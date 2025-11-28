-- Create playlist_tracks table (junction table)
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id VARCHAR(20) NOT NULL,
  title VARCHAR(300) NOT NULL,
  artist VARCHAR(200),
  thumbnail_url TEXT,
  duration INTEGER,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id 
  ON public.playlist_tracks(playlist_id);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position 
  ON public.playlist_tracks(playlist_id, position);

-- Enable RLS
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;



-- Users can view tracks from public playlists and their own playlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view playlist tracks'
      AND tablename = 'playlist_tracks'
  ) THEN
    CREATE POLICY "Users can view playlist tracks"
      ON public.playlist_tracks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 
          FROM public.playlists
          WHERE public.playlists.id = public.playlist_tracks.playlist_id
          AND (public.playlists.is_public = true OR public.playlists.user_id = auth.uid())
        )
      );
  END IF;
END $$;

-- Users can add tracks to their own playlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can add tracks to own playlists'
      AND tablename = 'playlist_tracks'
  ) THEN
    CREATE POLICY "Users can add tracks to own playlists"
      ON public.playlist_tracks FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 
          FROM public.playlists
          WHERE public.playlists.id = public.playlist_tracks.playlist_id
          AND public.playlists.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can update tracks in their own playlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update tracks in own playlists'
      AND tablename = 'playlist_tracks'
  ) THEN
    CREATE POLICY "Users can update tracks in own playlists"
      ON public.playlist_tracks FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 
          FROM public.playlists
          WHERE public.playlists.id = public.playlist_tracks.playlist_id
          AND public.playlists.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 
          FROM public.playlists
          WHERE public.playlists.id = public.playlist_tracks.playlist_id
          AND public.playlists.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can delete tracks from their own playlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete tracks from own playlists'
      AND tablename = 'playlist_tracks'
  ) THEN
    CREATE POLICY "Users can delete tracks from own playlists"
      ON public.playlist_tracks FOR DELETE
      USING (
        EXISTS (
          SELECT 1 
          FROM public.playlists
          WHERE public.playlists.id = public.playlist_tracks.playlist_id
          AND public.playlists.user_id = auth.uid()
        )
      );
  END IF;
END $$;
