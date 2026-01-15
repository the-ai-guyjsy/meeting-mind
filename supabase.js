/**
 * Supabase Client Configuration
 * Handles all database and authentication operations
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://xrvbfnceuuajjwxnccon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydmJmbmNldXVhamp3eG5jY29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTE3NzMsImV4cCI6MjA4Mzk2Nzc3M30.ZtFkbuPutpWL2FqVD6s-Wz60Xbm0bvL4TUpGeAqk4KM';

// Debug logging
console.log('Supabase Config:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length
});

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// DEBUG: Test function - call window.testSupabase('email', 'password') from console
window.testSupabase = async (email, password) => {
  console.log('Testing with:', { email, password: '***' });
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    console.log('Result:', result);
    return result;
  } catch (err) {
    console.error('Error:', err);
    return err;
  }
};

// DEBUG: Test basic fetch to Supabase
window.testFetch = async () => {
  console.log('Testing fetch to:', supabaseUrl);
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log('Fetch response:', response.status, response.statusText);
    return response;
  } catch (err) {
    console.error('Fetch error:', err);
    return err;
  }
};

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
      .insert({ name, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getOrganizations(userId) {
    if (!supabase) throw new Error('Supabase not configured');
    // Get organizations where user is a member
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', userId);
    
    if (error) {
      // Fallback: try getting orgs created by user directly
      console.log('Member query failed, trying direct org query...');
      const { data: directOrgs, error: directError } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', userId);
      if (directError) throw directError;
      return directOrgs;
    }
    
    // Extract organizations from the join result
    return data?.map(m => m.organizations).filter(Boolean) || [];
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
