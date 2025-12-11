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
