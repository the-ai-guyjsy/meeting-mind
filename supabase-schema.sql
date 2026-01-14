-- Run this in your Supabase SQL Editor
-- This creates all the tables, RLS policies, and functions needed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    company TEXT,
    role TEXT DEFAULT 'user',
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    color TEXT DEFAULT '1',
    default_language TEXT DEFAULT 'en-GB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id),
    created_by UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'completed',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    audio_url TEXT,
    transcript TEXT,
    notes TEXT,
    ai_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcript entries
CREATE TABLE public.transcript_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES public.employees(id),
    text TEXT NOT NULL,
    timestamp_seconds INTEGER NOT NULL,
    is_highlighted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action items
CREATE TABLE public.action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    assigned_to UUID REFERENCES public.employees(id),
    status TEXT DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, restrict later)
CREATE POLICY "Enable read for all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable read for all users" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.meetings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable read for all users" ON public.action_items FOR SELECT USING (true);

-- Storage bucket for audio
INSERT INTO storage.buckets (id, name, public) VALUES ('meeting-audio', 'meeting-audio', false) ON CONFLICT DO NOTHING;
