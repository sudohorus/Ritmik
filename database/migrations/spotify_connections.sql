-- Spotify Connections Table
-- Stores Spotify OAuth connections for playlist import functionality

CREATE TABLE IF NOT EXISTS spotify_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  spotify_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE NULL,
  CONSTRAINT spotify_connections_pkey PRIMARY KEY (id),
  CONSTRAINT spotify_connections_user_id_key UNIQUE (user_id),
  CONSTRAINT spotify_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user_id ON spotify_connections USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections USING btree (spotify_user_id);

-- Enable RLS
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;

-- Users can only view and manage their own Spotify connections
CREATE POLICY "Users can view own spotify connections"
    ON spotify_connections
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spotify connections"
    ON spotify_connections
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spotify connections"
    ON spotify_connections
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spotify connections"
    ON spotify_connections
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
