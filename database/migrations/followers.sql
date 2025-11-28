-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at DESC);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Anyone can view followers' 
      AND tablename = 'followers'
  ) THEN
    CREATE POLICY "Anyone can view followers"
      ON public.followers FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can follow others' 
      AND tablename = 'followers'
  ) THEN
    CREATE POLICY "Users can follow others"
      ON public.followers FOR INSERT
      WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can unfollow' 
      AND tablename = 'followers'
  ) THEN
    CREATE POLICY "Users can unfollow"
      ON public.followers FOR DELETE
      USING (auth.uid() = follower_id);
  END IF;
END $$;


-- (fixed search_path)
CREATE OR REPLACE FUNCTION public.get_follower_count(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.followers 
  WHERE following_id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_following_count(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.followers 
  WHERE follower_id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_following(follower UUID, following UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.followers 
    WHERE follower_id = follower 
      AND following_id = following
  );
$$;
