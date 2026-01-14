/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

import { auth, db } from '../lib/supabase.js';
import { showToast } from '../utils/helpers.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.currentOrganization = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize authentication state
   */
  async initialize() {
    try {
      const session = await auth.getSession();
      
      if (session) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        await this.loadUserData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return false;
    }
  }

  /**
   * Load user profile and organization data
   */
  async loadUserData() {
    try {
      // Get profile
      this.currentProfile = await db.getProfile(this.currentUser.id);
      
      // Get organizations
      const orgs = await db.getOrganizations(this.currentUser.id);
      if (orgs && orgs.length > 0) {
        this.currentOrganization = orgs[0]; // Use first org for now
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load user data:', error);
      return false;
    }
  }

  /**
   * Sign up new user
   */
  async signUp(email, password, userData = {}) {
    try {
      const { user } = await auth.signUp(email, password, {
        display_name: userData.displayName,
        company: userData.company
      });

      this.currentUser = user;
      this.isAuthenticated = true;

      showToast('Account created successfully! Please check your email.', 'success');
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      showToast(error.message || 'Failed to create account', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email, password) {
    try {
      const { user } = await auth.signIn(email, password);
      
      this.currentUser = user;
      this.isAuthenticated = true;
      
      await this.loadUserData();
      
      showToast('Welcome back!', 'success');
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      showToast(error.message || 'Invalid email or password', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await auth.signOut();
      
      this.currentUser = null;
      this.currentProfile = null;
      this.currentOrganization = null;
      this.isAuthenticated = false;
      
      showToast('Signed out successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup organization (onboarding step)
   */
  async setupOrganization(organizationName, employees = []) {
    try {
      // Create organization
      const org = await db.createOrganization(organizationName, this.currentUser.id);
      this.currentOrganization = org;

      // Add user's profile to organization if needed
      await db.updateProfile(this.currentUser.id, {
        company: organizationName
      });

      // Create employees
      const createdEmployees = [];
      for (const employee of employees) {
        const emp = await db.createEmployee(org.id, employee);
        createdEmployees.push(emp);
      }

      showToast('Organization setup complete!', 'success');
      return { success: true, organization: org, employees: createdEmployees };
    } catch (error) {
      console.error('Organization setup error:', error);
      showToast('Failed to setup organization', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const updated = await db.updateProfile(this.currentUser.id, updates);
      this.currentProfile = updated;
      
      showToast('Profile updated', 'success');
      return { success: true, profile: updated };
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('Failed to update profile', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  /**
   * Check if user has completed onboarding
   */
  hasCompletedOnboarding() {
    return this.currentOrganization !== null;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Get current profile
   */
  getProfile() {
    return this.currentProfile;
  }

  /**
   * Get current organization
   */
  getOrganization() {
    return this.currentOrganization;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    return auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        this.loadUserData().then(() => callback(event, session));
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentProfile = null;
        this.currentOrganization = null;
        this.isAuthenticated = false;
        callback(event, session);
      }
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
