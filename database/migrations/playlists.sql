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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playlists_user_id 
  ON public.playlists(user_id);

CREATE INDEX IF NOT EXISTS idx_playlists_created_at 
  ON public.playlists(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Trigger function
CREATE OR REPLACE FUNCTION public.update_playlists_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_playlists_updated_at ON public.playlists;

CREATE TRIGGER trg_update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_playlists_updated_at();


DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view public playlists'
      AND tablename = 'playlists'
  ) THEN
    DROP POLICY "Users can view public playlists" ON public.playlists;
  END IF;

  CREATE POLICY "Users can view public playlists"
    ON public.playlists FOR SELECT
    USING (
      public.playlists.is_public = true 
      OR (select auth.uid()) = public.playlists.user_id
    );
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can create own playlists'
      AND tablename = 'playlists'
  ) THEN
    DROP POLICY "Users can create own playlists" ON public.playlists;
  END IF;

  CREATE POLICY "Users can create own playlists"
    ON public.playlists FOR INSERT
    WITH CHECK ((select auth.uid()) = public.playlists.user_id);
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update own playlists'
      AND tablename = 'playlists'
  ) THEN
    DROP POLICY "Users can update own playlists" ON public.playlists;
  END IF;

  CREATE POLICY "Users can update own playlists"
    ON public.playlists FOR UPDATE
    USING ((select auth.uid()) = public.playlists.user_id)
    WITH CHECK ((select auth.uid()) = public.playlists.user_id);
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete own playlists'
      AND tablename = 'playlists'
  ) THEN
    DROP POLICY "Users can delete own playlists" ON public.playlists;
  END IF;

  CREATE POLICY "Users can delete own playlists"
    ON public.playlists FOR DELETE
    USING ((select auth.uid()) = public.playlists.user_id);
END $$;
