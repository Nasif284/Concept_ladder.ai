-- ============================================================
-- Concept Ladder: Complete Database Schema
-- Compatible with Clerk Authentication & Direct Supabase PostgREST
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES TABLE (Stores User Profile Information)
-- ------------------------------------------------------------
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
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;

-- Open policies for profiles (allows Clerk client sync via anon/authenticated)
CREATE POLICY "Allow all access to profiles"
ON public.profiles
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. TOPICS TABLE (Stores Ladders & Progress)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    progress TEXT NOT NULL DEFAULT 'kid',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
    levels JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop foreign key constraint if it exists to allow guest and Clerk user topics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'topics_user_id_fkey' AND table_name = 'topics'
    ) THEN
        ALTER TABLE public.topics DROP CONSTRAINT topics_user_id_fkey;
    END IF;
END $$;

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics (user_id);
CREATE INDEX IF NOT EXISTS idx_topics_last_accessed ON public.topics (user_id, last_accessed DESC);

-- Enable RLS on topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Clean existing restrictive policies on topics
DROP POLICY IF EXISTS "Users can read own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can insert own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can update own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can delete own topics" ON public.topics;
DROP POLICY IF EXISTS "Allow all access to topics" ON public.topics;
DROP POLICY IF EXISTS "Allow read topics" ON public.topics;
DROP POLICY IF EXISTS "Allow insert topics" ON public.topics;
DROP POLICY IF EXISTS "Allow update topics" ON public.topics;
DROP POLICY IF EXISTS "Allow delete topics" ON public.topics;

-- RLS Policies for topics (accessible by anon and authenticated tokens)
CREATE POLICY "Allow all access to topics"
ON public.topics
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

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
