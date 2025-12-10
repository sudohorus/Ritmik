CREATE OR REPLACE FUNCTION update_playlist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_statistics (user_id, playlists_created)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      playlists_created = user_statistics.playlists_created + 1,
      stats_updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_statistics
    SET playlists_created = GREATEST(playlists_created - 1, 0),
        stats_updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_playlist_count ON playlists;
CREATE TRIGGER trigger_update_playlist_count
AFTER INSERT OR DELETE ON playlists
FOR EACH ROW
EXECUTE FUNCTION update_playlist_count();

CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_statistics (user_id, followers_count)
    VALUES (NEW.following_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      followers_count = user_statistics.followers_count + 1,
      stats_updated_at = NOW();
    
    INSERT INTO user_statistics (user_id, following_count)
    VALUES (NEW.follower_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      following_count = user_statistics.following_count + 1,
      stats_updated_at = NOW();
      
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_statistics
    SET followers_count = GREATEST(followers_count - 1, 0),
        stats_updated_at = NOW()
    WHERE user_id = OLD.following_id;
    
    UPDATE user_statistics
    SET following_count = GREATEST(following_count - 1, 0),
        stats_updated_at = NOW()
    WHERE user_id = OLD.follower_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_follower_count ON followers;
CREATE TRIGGER trigger_update_follower_count
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_count();
