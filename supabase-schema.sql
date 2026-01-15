-- MeetingMind Enterprise - Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- This creates all the tables, RLS policies, and functions needed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    company TEXT,
    role TEXT DEFAULT 'user',
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members (link users to organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Employees (meeting participants)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '1',
    default_language TEXT DEFAULT 'en-GB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'completed',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    audio_url TEXT,
    transcript TEXT,
    notes TEXT,
    ai_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcript entries
CREATE TABLE IF NOT EXISTS public.transcript_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES public.employees(id),
    text TEXT NOT NULL,
    timestamp_seconds INTEGER NOT NULL,
    is_highlighted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action items
CREATE TABLE IF NOT EXISTS public.action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    assigned_to UUID REFERENCES public.employees(id),
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles 
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES - ORGANIZATIONS
-- ============================================
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;

CREATE POLICY "organizations_select" ON public.organizations 
    FOR SELECT USING (true);

CREATE POLICY "organizations_insert" ON public.organizations 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "organizations_update" ON public.organizations 
    FOR UPDATE USING (created_by = auth.uid());

-- ============================================
-- RLS POLICIES - ORGANIZATION MEMBERS
-- ============================================
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;

CREATE POLICY "org_members_select" ON public.organization_members 
    FOR SELECT USING (true);

CREATE POLICY "org_members_insert" ON public.organization_members 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- RLS POLICIES - EMPLOYEES
-- ============================================
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;

CREATE POLICY "employees_select" ON public.employees 
    FOR SELECT USING (true);

CREATE POLICY "employees_insert" ON public.employees 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "employees_update" ON public.employees 
    FOR UPDATE USING (true);

CREATE POLICY "employees_delete" ON public.employees 
    FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES - MEETINGS
-- ============================================
DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete" ON public.meetings;

CREATE POLICY "meetings_select" ON public.meetings 
    FOR SELECT USING (true);

CREATE POLICY "meetings_insert" ON public.meetings 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "meetings_update" ON public.meetings 
    FOR UPDATE USING (true);

CREATE POLICY "meetings_delete" ON public.meetings 
    FOR DELETE USING (created_by = auth.uid());

-- ============================================
-- RLS POLICIES - TRANSCRIPT ENTRIES
-- ============================================
DROP POLICY IF EXISTS "transcript_select" ON public.transcript_entries;
DROP POLICY IF EXISTS "transcript_insert" ON public.transcript_entries;
DROP POLICY IF EXISTS "transcript_update" ON public.transcript_entries;

CREATE POLICY "transcript_select" ON public.transcript_entries 
    FOR SELECT USING (true);

CREATE POLICY "transcript_insert" ON public.transcript_entries 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "transcript_update" ON public.transcript_entries 
    FOR UPDATE USING (true);

-- ============================================
-- RLS POLICIES - ACTION ITEMS
-- ============================================
DROP POLICY IF EXISTS "actions_select" ON public.action_items;
DROP POLICY IF EXISTS "actions_insert" ON public.action_items;
DROP POLICY IF EXISTS "actions_update" ON public.action_items;
DROP POLICY IF EXISTS "actions_delete" ON public.action_items;

CREATE POLICY "actions_select" ON public.action_items 
    FOR SELECT USING (true);

CREATE POLICY "actions_insert" ON public.action_items 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "actions_update" ON public.action_items 
    FOR UPDATE USING (true);

CREATE POLICY "actions_delete" ON public.action_items 
    FOR DELETE USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to add user as org member when creating org
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as org member
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for meeting audio (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('meeting-audio', 'meeting-audio', false) 
-- ON CONFLICT DO NOTHING;

-- ============================================
-- INDEXES (for better performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meetings_org ON public.meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created ON public.meetings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employees_org ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_transcript_meeting ON public.transcript_entries(meeting_id);
CREATE INDEX IF NOT EXISTS idx_actions_org ON public.action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON public.action_items(status);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
