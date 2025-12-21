CREATE OR REPLACE FUNCTION cleanup_inactive_jam_participants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jam_participants
  SET is_active = false,
      left_at = NOW()
  WHERE is_active = true
  AND last_seen < (NOW() - INTERVAL '2 minutes');
  
  UPDATE jam_sessions
  SET is_active = false,
      ended_at = NOW()
  WHERE is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM jam_participants
    WHERE jam_session_id = jam_sessions.id
    AND is_active = true
  );
END;
$$;
