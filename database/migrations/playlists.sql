-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_created_at ON public.playlists(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Users can view public playlists and their own playlists
CREATE POLICY "Users can view public playlists"
  ON public.playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can create their own playlists
CREATE POLICY "Users can create own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

