-- ============================================================
-- Concept Ladder: Complete Database Schema
-- Powered by Clerk Authentication & Supabase PostgreSQL
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES TABLE (Stores User Profile Information)
-- ------------------------------------------------------------
-- The 'id' here is the Clerk user ID (e.g. 'user_2t1aBcDe...')
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- RLS for profiles: only the authenticated user matching the Clerk 'sub' claim
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    id = (SELECT auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = (SELECT auth.jwt() ->> 'sub')
)
WITH CHECK (
    id = (SELECT auth.jwt() ->> 'sub')
);

-- ------------------------------------------------------------
-- 2. TOPICS TABLE (Stores Ladders & Progress)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT (auth.jwt() ->> 'sub'),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    progress TEXT NOT NULL DEFAULT 'kid',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
    levels JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics (user_id);
CREATE INDEX IF NOT EXISTS idx_topics_last_accessed ON public.topics (user_id, last_accessed DESC);

-- Enable RLS on topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Clean existing policies on topics
DROP POLICY IF EXISTS "Users can read own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can insert own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can update own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can delete own topics" ON public.topics;

-- RLS Policies for topics
CREATE POLICY "Users can read own topics"
ON public.topics
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can insert own topics"
ON public.topics
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = (SELECT auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can update own topics"
ON public.topics
FOR UPDATE
TO authenticated
USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
)
WITH CHECK (
    user_id = (SELECT auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can delete own topics"
ON public.topics
FOR DELETE
TO authenticated
USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
);

-- ------------------------------------------------------------
-- 3. AUTO-UPDATE TIMESTAMP TRIGGER
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_topics_updated_at ON public.topics;
CREATE TRIGGER set_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
