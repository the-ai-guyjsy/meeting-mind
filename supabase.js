/**
 * Supabase Client Configuration
 * Handles all database and authentication operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for environment variables
const hasConfig = supabaseUrl && supabaseAnonKey;

if (!hasConfig) {
  console.error('âŒ Missing Supabase environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel');
}

// Create client even if config missing (will fail gracefully)
export const supabase = hasConfig ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) : null;

// Auth helpers
export const auth = {
  async signUp(email, password, userData = {}) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    if (!supabase) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getUser() {
    if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  onAuthStateChange(callback) {
    if (!supabase) return () => {};
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // Profiles
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Organizations
  async createOrganization(name, userId) {
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getOrganizations(userId) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Employees
  async createEmployee(orgId, employeeData) {
    const { data, error } = await supabase
      .from('employees')
      .insert({ organization_id: orgId, ...employeeData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getEmployees(orgId) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('organization_id', orgId)
      .order('name');
    if (error) throw error;
    return data;
  },

  // Meetings
  async createMeeting(meetingData) {
    const { data, error } = await supabase
      .from('meetings')
      .insert(meetingData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMeeting(meetingId, updates) {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', meetingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMeetings(orgId, limit = 50) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getMeeting(meetingId) {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        transcript_entries (*),
        action_items (*)
      `)
      .eq('id', meetingId)
      .single();
    if (error) throw error;
    return data;
  },

  // Transcript Entries
  async createTranscriptEntry(entryData) {
    const { data, error } = await supabase
      .from('transcript_entries')
      .insert(entryData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTranscriptEntries(meetingId) {
    const { data, error } = await supabase
      .from('transcript_entries')
      .select('*, employees(*)')
      .eq('meeting_id', meetingId)
      .order('timestamp_seconds');
    if (error) throw error;
    return data;
  },

  // Action Items
  async createActionItem(actionData) {
    const { data, error } = await supabase
      .from('action_items')
      .insert(actionData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateActionItem(actionId, updates) {
    const { data, error } = await supabase
      .from('action_items')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getActionItems(orgId, filters = {}) {
    let query = supabase
      .from('action_items')
      .select('*, meetings(title), employees(name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

// Storage helpers
export const storage = {
  async uploadAudio(meetingId, audioBlob, filename) {
    const filePath = `${meetingId}/${filename}`;
    
    const { data, error } = await supabase.storage
      .from('meeting-audio')
      .upload(filePath, audioBlob, {
        contentType: audioBlob.type,
        upsert: false
      });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('meeting-audio')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  },

  async getAudioUrl(filePath) {
    const { data } = supabase.storage
      .from('meeting-audio')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  async deleteAudio(filePath) {
    const { error } = await supabase.storage
      .from('meeting-audio')
      .remove([filePath]);
    
    if (error) throw error;
  }
};

export default supabase;
