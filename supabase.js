/**
 * Supabase Client Configuration
 * Handles all database and authentication operations
 */

import { createClient } from '@supabase/supabase-js';

// Get and clean environment variables (remove any accidental whitespace/quotes)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = rawKey.trim().replace(/^["']|["']$/g, '');

// Debug logging
console.log('Supabase Config:', {
  urlPresent: !!supabaseUrl,
  urlLength: supabaseUrl.length,
  urlStart: supabaseUrl.substring(0, 30),
  keyPresent: !!supabaseAnonKey,
  keyLength: supabaseAnonKey.length
});

// Check for environment variables - URL must start with https://
const hasConfig = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://');

if (!hasConfig) {
  console.error('Invalid Supabase configuration!');
  console.error('URL valid:', supabaseUrl && supabaseUrl.startsWith('https://'));
  console.error('Key present:', !!supabaseAnonKey);
}

// Create client only if config is valid
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
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getOrganizations(userId) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('organizations')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Employees
  async createEmployee(orgId, employeeData) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('employees')
      .insert({ organization_id: orgId, ...employeeData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getEmployees(orgId) {
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('meetings')
      .insert(meetingData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMeeting(meetingId, updates) {
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('transcript_entries')
      .insert(entryData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTranscriptEntries(meetingId) {
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('action_items')
      .insert(actionData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateActionItem(actionId, updates) {
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
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
    if (!supabase) throw new Error('Supabase not configured');
    const { data } = supabase.storage
      .from('meeting-audio')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  async deleteAudio(filePath) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.storage
      .from('meeting-audio')
      .remove([filePath]);
    
    if (error) throw error;
  }
};

export default supabase;
