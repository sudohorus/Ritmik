CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS play_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  
  playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  listen_duration INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_listen_duration CHECK (listen_duration IS NULL OR listen_duration <= duration)
);

CREATE INDEX idx_play_history_user ON play_history(user_id, played_at DESC);
CREATE INDEX idx_play_history_video ON play_history(video_id);
CREATE INDEX idx_play_history_playlist ON play_history(playlist_id);

ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own play history"
  ON play_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own play history"
  ON play_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  total_plays INTEGER DEFAULT 0,
  total_listen_time INTEGER DEFAULT 0,
  completed_plays INTEGER DEFAULT 0,
  
  playlists_created INTEGER DEFAULT 0,
  playlists_followed INTEGER DEFAULT 0,
  tracks_favorited INTEGER DEFAULT 0,
  
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  
  last_played_at TIMESTAMP WITH TIME ZONE,
  stats_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON user_statistics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics"
  ON user_statistics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS track_statistics (
  video_id TEXT PRIMARY KEY,
  
  title TEXT NOT NULL,
  artist TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  
  total_plays INTEGER DEFAULT 0,
  unique_listeners INTEGER DEFAULT 0,
  completed_plays INTEGER DEFAULT 0,
  
  in_playlists_count INTEGER DEFAULT 0,
  favorited_count INTEGER DEFAULT 0,
  
  plays_last_7_days INTEGER DEFAULT 0,
  plays_last_30_days INTEGER DEFAULT 0,
  
  first_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_played_at TIMESTAMP WITH TIME ZONE,
  stats_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_track_stats_popularity ON track_statistics(total_plays DESC);
CREATE INDEX idx_track_stats_trending ON track_statistics(plays_last_7_days DESC);

ALTER TABLE track_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view track statistics"
  ON track_statistics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update track statistics"
  ON track_statistics FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert track statistics"
  ON track_statistics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS playlist_statistics (
  playlist_id UUID PRIMARY KEY REFERENCES playlists(id) ON DELETE CASCADE,
  
  total_plays INTEGER DEFAULT 0,
  unique_listeners INTEGER DEFAULT 0,
  
  followers_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  plays_last_7_days INTEGER DEFAULT 0,
  plays_last_30_days INTEGER DEFAULT 0,
  
  last_played_at TIMESTAMP WITH TIME ZONE,
  stats_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_playlist_stats_popularity ON playlist_statistics(total_plays DESC);

ALTER TABLE playlist_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view playlist statistics"
  ON playlist_statistics FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT user_favorites_unique UNIQUE (user_id, video_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id, favorited_at DESC);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS trending_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  time_period TEXT NOT NULL,
  
  video_id TEXT,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  artist_name TEXT,
  
  score FLOAT NOT NULL,
  rank INTEGER NOT NULL,
  
  data JSONB,
  
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT trending_cache_unique UNIQUE (category, time_period, rank)
);

CREATE INDEX idx_trending_category ON trending_cache(category, time_period, rank);

ALTER TABLE trending_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trending"
  ON trending_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_statistics (
    user_id, 
    total_plays, 
    total_listen_time,
    completed_plays,
    last_played_at
  )
  VALUES (
    NEW.user_id, 
    1, 
    COALESCE(NEW.listen_duration, 0),
    CASE WHEN NEW.completed THEN 1 ELSE 0 END,
    NEW.played_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_plays = user_statistics.total_plays + 1,
    total_listen_time = user_statistics.total_listen_time + COALESCE(NEW.listen_duration, 0),
    completed_plays = user_statistics.completed_plays + CASE WHEN NEW.completed THEN 1 ELSE 0 END,
    last_played_at = NEW.played_at,
    stats_updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_stats ON play_history;
CREATE TRIGGER trigger_update_user_stats
AFTER INSERT ON play_history
FOR EACH ROW
EXECUTE FUNCTION update_user_statistics();

CREATE OR REPLACE FUNCTION update_track_statistics()
RETURNS TRIGGER AS $$
DECLARE
  is_new_listener BOOLEAN;
BEGIN
  SELECT NOT EXISTS (
    SELECT 1 FROM play_history 
    WHERE video_id = NEW.video_id 
    AND user_id = NEW.user_id 
    AND id != NEW.id
  ) INTO is_new_listener;

  INSERT INTO track_statistics (
    video_id, title, artist, thumbnail_url, duration,
    total_plays, unique_listeners, last_played_at
  )
  VALUES (
    NEW.video_id, NEW.title, NEW.artist, NEW.thumbnail_url, NEW.duration,
    1, CASE WHEN is_new_listener THEN 1 ELSE 0 END, NEW.played_at
  )
  ON CONFLICT (video_id) DO UPDATE SET
    total_plays = track_statistics.total_plays + 1,
    unique_listeners = track_statistics.unique_listeners + CASE WHEN is_new_listener THEN 1 ELSE 0 END,
    completed_plays = track_statistics.completed_plays + CASE WHEN NEW.completed THEN 1 ELSE 0 END,
    last_played_at = NEW.played_at,
    stats_updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_track_stats ON play_history;
CREATE TRIGGER trigger_update_track_stats
AFTER INSERT ON play_history
FOR EACH ROW
EXECUTE FUNCTION update_track_statistics();
