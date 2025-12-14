-- Rate Limiting Table
-- Stores attempts to prevent brute force attacks and rate limit signups

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('login', 'signup')),
    attempt_count INTEGER NOT NULL DEFAULT 1,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_address, action_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_action ON rate_limit_attempts(ip_address, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON rate_limit_attempts(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and updates (needed for auth flow)
CREATE POLICY "Allow anonymous to manage rate limits"
    ON rate_limit_attempts
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to view their own rate limit status
CREATE POLICY "Allow users to view rate limits"
    ON rate_limit_attempts
    FOR SELECT
    TO authenticated
    USING (true);

-- Function to clean up expired rate limit records (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM rate_limit_attempts
    WHERE blocked_until IS NOT NULL 
        AND blocked_until < NOW();
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limit_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_rate_limit_attempts_timestamp
    BEFORE UPDATE ON rate_limit_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_rate_limit_timestamp();


-- Revoke direct access to the table
REVOKE ALL ON rate_limit_attempts FROM anon, authenticated;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_ip_address TEXT, p_action_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit_config RECORD;
    v_attempt RECORD;
    v_max_attempts INT;
    v_block_duration INTERVAL;
BEGIN
    -- Define limits (matching TS config)
    IF p_action_type = 'login' THEN
        v_max_attempts := 15;
        v_block_duration := '30 minutes'::INTERVAL;
    ELSIF p_action_type = 'signup' THEN
        v_max_attempts := 5;
        v_block_duration := '30 minutes'::INTERVAL;
    ELSIF p_action_type = 'reset_password' THEN
        v_max_attempts := 3;
        v_block_duration := '1 hour'::INTERVAL;
    ELSE
        -- Unknown action, allow it
        RETURN jsonb_build_object('allowed', true);
    END IF;

    -- Fetch existing attempt
    SELECT * INTO v_attempt FROM rate_limit_attempts 
    WHERE ip_address = p_ip_address AND action_type = p_action_type;

    -- If no record, allowed
    IF v_attempt IS NULL THEN
        RETURN jsonb_build_object('allowed', true, 'remainingAttempts', v_max_attempts);
    END IF;

    -- Check if blocked
    IF v_attempt.blocked_until IS NOT NULL THEN
        IF v_attempt.blocked_until > NOW() THEN
            RETURN jsonb_build_object(
                'allowed', false, 
                'blockedUntil', v_attempt.blocked_until,
                'resetAt', v_attempt.blocked_until
            );
        ELSE
            -- Expired block, delete and allow
            DELETE FROM rate_limit_attempts WHERE id = v_attempt.id;
            RETURN jsonb_build_object('allowed', true, 'remainingAttempts', v_max_attempts);
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'allowed', (v_max_attempts - v_attempt.attempt_count) > 0,
        'remainingAttempts', GREATEST(0, v_max_attempts - v_attempt.attempt_count)
    );
END;
$$;

-- Function to record attempt
CREATE OR REPLACE FUNCTION record_rate_limit_attempt(p_ip_address TEXT, p_action_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_max_attempts INT;
    v_block_duration INTERVAL;
    v_attempt RECORD;
    v_new_count INT;
    v_should_block BOOLEAN;
BEGIN
    -- Define limits
    IF p_action_type = 'login' THEN
        v_max_attempts := 15;
        v_block_duration := '30 minutes'::INTERVAL;
    ELSIF p_action_type = 'signup' THEN
        v_max_attempts := 5;
        v_block_duration := '30 minutes'::INTERVAL;
    ELSIF p_action_type = 'reset_password' THEN
        v_max_attempts := 3;
        v_block_duration := '1 hour'::INTERVAL;
    ELSE
        RETURN;
    END IF;

    SELECT * INTO v_attempt FROM rate_limit_attempts 
    WHERE ip_address = p_ip_address AND action_type = p_action_type;

    IF v_attempt IS NOT NULL THEN
        -- Reset count if enough time has passed since last update (inactivity reset)
        IF (NOW() - v_attempt.updated_at) > v_block_duration THEN
             v_new_count := 1;
        ELSE
             v_new_count := v_attempt.attempt_count + 1;
        END IF;

        v_should_block := v_new_count >= v_max_attempts;

        UPDATE rate_limit_attempts SET
            attempt_count = v_new_count,
            blocked_until = CASE WHEN v_should_block THEN NOW() + v_block_duration ELSE NULL END,
            updated_at = NOW()
        WHERE id = v_attempt.id;
    ELSE
        INSERT INTO rate_limit_attempts (ip_address, action_type, attempt_count)
        VALUES (p_ip_address, p_action_type, 1);
    END IF;
END;
$$;

-- Function to reset attempts (on success)
CREATE OR REPLACE FUNCTION reset_rate_limit_attempts(p_ip_address TEXT, p_action_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM rate_limit_attempts 
    WHERE ip_address = p_ip_address AND action_type = p_action_type;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_rate_limit_attempt TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_rate_limit_attempts TO anon, authenticated;