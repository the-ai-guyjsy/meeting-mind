/**
 * MeetingMind Enterprise - Main Application
 * Modern, modular meeting intelligence platform
 */

console.log('main.js: Starting imports...');

import { authService } from './AuthService.js';
console.log('main.js: AuthService imported');

import { meetingService } from './MeetingService.js';
console.log('main.js: MeetingService imported');

import { exportService } from './ExportService.js';
console.log('main.js: ExportService imported');

import { db } from './supabase.js';
console.log('main.js: Supabase imported');

import { 
  showToast, 
  escapeHtml, 
  formatDuration, 
  formatTimestamp,
  formatDate,
  getInitials,
  getSpeakerColor
} from './helpers.js';
console.log('main.js: All imports complete');

// ============================================
// APPLICATION STATE
// ============================================

const state = {
  currentView: 'auth',
  isAuthenticated: false,
  user: null,
  profile: null,
  organization: null,
  employees: [],
  meetings: [],
  currentMeeting: null,
  onboardingStep: 1,
  selectedEmployees: [],
  organizationName: 'La Collette Wholesale Ltd' // Store org name across steps
};

// Predefined employees for onboarding
const PREDEFINED_EMPLOYEES = [
  { name: 'Ciaran', color: '1', default_language: 'en-GB' },
  { name: 'Aura', color: '2', default_language: 'ro-RO' },
  { name: 'Eduardo', color: '3', default_language: 'pt-PT' },
  { name: 'Toby', color: '4', default_language: 'en-GB' },
  { name: 'Kelly', color: '5', default_language: 'en-GB' },
  { name: 'Jason', color: '6', default_language: 'en-GB' },
  { name: 'Nelson', color: '1', default_language: 'pt-PT' },
  { name: 'Lee', color: '2', default_language: 'en-GB' },
  { name: 'Richard', color: '3', default_language: 'en-GB' },
  { name: 'Melissa', color: '4', default_language: 'en-GB' },
  { name: 'Amanda', color: '5', default_language: 'en-GB' },
  { name: 'Clare', color: '6', default_language: 'en-GB' },
  { name: 'Alex', color: '1', default_language: 'ro-RO' },
  { name: 'James', color: '2', default_language: 'en-GB' }
];

// ============================================
// INITIALIZATION
// ============================================

async function initializeApp() {
  console.log('🚀 Initializing MeetingMind Enterprise...');

  try {
    // Check authentication
    const isAuthenticated = await authService.initialize();
    console.log('Auth result:', isAuthenticated, 'User:', authService.getUser()?.email);
    console.log('Organization:', authService.getOrganization());

    if (isAuthenticated) {
      state.isAuthenticated = true;
      state.user = authService.getUser();
      state.profile = authService.getProfile();
      state.organization = authService.getOrganization();

      // Check if onboarding completed
      if (!authService.hasCompletedOnboarding()) {
        console.log('No organization found, showing onboarding...');
        showView('onboarding');
      } else {
        console.log('Organization found, loading dashboard...');
        await loadAppData();
        showView('dashboard');
      }
    } else {
      console.log('Not authenticated, showing login...');
      showView('auth');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showView('auth');
  }

  hideLoadingScreen();
}

async function loadAppData() {
  try {
    // Load employees
    const employees = await db.getEmployees(state.organization.id);
    state.employees = employees;

    // Load recent meetings
    const { meetings } = await meetingService.getMeetings(20);
    state.meetings = meetings || [];

  } catch (error) {
    console.error('Failed to load app data:', error);
  }
}

// ============================================
// ROUTING & VIEWS
// ============================================

function showView(viewName) {
  state.currentView = viewName;
  const appContainer = document.getElementById('app');

  switch (viewName) {
    case 'auth':
      appContainer.innerHTML = renderAuthView();
      attachAuthHandlers();
      break;
    case 'onboarding':
      appContainer.innerHTML = renderOnboardingView();
      attachOnboardingHandlers();
      break;
    case 'dashboard':
      appContainer.innerHTML = renderDashboardView();
      attachDashboardHandlers();
      break;
    case 'meeting':
      appContainer.innerHTML = renderMeetingView();
      attachMeetingHandlers();
      break;
    case 'history':
      appContainer.innerHTML = renderHistoryView();
      attachHistoryHandlers();
      break;
    case 'reports':
      appContainer.innerHTML = renderReportsView();
      attachReportsHandlers();
      break;
    case 'actions':
      appContainer.innerHTML = renderActionsView();
      attachActionsHandlers();
      break;
    case 'preferences':
      appContainer.innerHTML = renderPreferencesView();
      attachPreferencesHandlers();
      break;
  }
}

// ============================================
// AUTH VIEW
// ============================================

function renderAuthView() {
  return `
    <div class="auth-container">
      <div class="auth-box">
        <div class="auth-logo">
          <div class="auth-logo-icon">M</div>
          <h1>MeetingMind</h1>
          <p>Enterprise Meeting Intelligence</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="signin">Sign In</button>
          <button class="auth-tab" data-tab="signup">Sign Up</button>
        </div>

        <div class="auth-tab-content active" id="signinTab">
          <form id="signinForm" class="auth-form">
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required placeholder="you@company.com">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" required placeholder="Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Sign In</button>
          </form>
        </div>

        <div class="auth-tab-content" id="signupTab">
          <form id="signupForm" class="auth-form">
            <div class="form-group">
              <label>Display Name</label>
              <input type="text" name="displayName" required placeholder="Your Name">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required placeholder="you@company.com">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" required placeholder="Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢" minlength="6">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Create Account</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function attachAuthHandlers() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-tab-content').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      document.getElementById(e.target.dataset.tab + 'Tab').classList.add('active');
    });
  });

  // Sign in
  document.getElementById('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    // Debug logging
    console.log('Sign in attempt:', { 
      email, 
      emailType: typeof email,
      passwordLength: password ? password.length : 0,
      passwordType: typeof password
    });

    const result = await authService.signIn(email, password);
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      await loadAppData();
      showView('dashboard');
    }
  });

  // Sign up
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await authService.signUp(
      formData.get('email'),
      formData.get('password'),
      { displayName: formData.get('displayName') }
    );

    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      showView('onboarding');
    }
  });
}

// ============================================
// ONBOARDING VIEW
// ============================================

function renderOnboardingView() {
  return `
    <div class="onboarding">
      <div class="onboarding-left">
        <div class="onboarding-brand">
          <div class="onboarding-logo">
            <div class="onboarding-logo-icon">M</div>
            <span class="onboarding-logo-text">MeetingMind</span>
          </div>
          <h1 class="onboarding-tagline">Capture what matters,<br><span>not everything.</span></h1>
          <p class="onboarding-desc">Enterprise-grade meeting intelligence that turns conversations into actionable insights.</p>
        </div>
      </div>

      <div class="onboarding-right">
        <div class="onboarding-form-container">
          ${renderOnboardingStep()}
        </div>
      </div>
    </div>
  `;
}

function renderOnboardingStep() {
  const step = state.onboardingStep;

  if (step === 1) {
    return `
      <div class="onboarding-step">
        <h2>Setup Your Organization</h2>
        <p class="onboarding-subtitle">Let's get started with your company details</p>

        <form id="orgSetupForm">
          <div class="form-group">
            <label>Organization Name</label>
            <input type="text" name="orgName" required placeholder="Your Company Name" value="La Collette Wholesale Ltd">
          </div>

          <div class="btn-group">
            <button type="submit" class="btn btn-primary btn-lg">
              Continue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    `;
  } else if (step === 2) {
    return `
      <div class="onboarding-step">
        <h2>Add Team Members</h2>
        <p class="onboarding-subtitle">Select who will be in your meetings</p>

        <div class="employee-actions">
          <button class="employee-action-btn add-all" onclick="window.selectAllEmployees()">Add All</button>
          <button class="employee-action-btn remove-all" onclick="window.removeAllEmployees()">Remove All</button>
        </div>

        <div class="employee-grid" id="employeeGrid">
          ${PREDEFINED_EMPLOYEES.map(emp => `
            <div class="employee-item ${state.selectedEmployees.includes(emp.name) ? 'selected' : ''}" 
                 data-name="${emp.name}">
              <div class="employee-checkbox">
                ${state.selectedEmployees.includes(emp.name) ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
              </div>
              <div class="employee-avatar" style="background: ${getSpeakerColor(emp.color)}">${getInitials(emp.name)}</div>
              <span class="employee-name">${emp.name}</span>
            </div>
          `).join('')}
        </div>

        <div class="btn-group">
          <button class="btn btn-secondary" onclick="window.prevOnboardingStep()">Back</button>
          <button class="btn btn-primary btn-lg" onclick="window.completeOnboarding()">
            Finish Setup
          </button>
        </div>
      </div>
    `;
  }
}

function attachOnboardingHandlers() {
  // Step 1: Organization setup
  const orgForm = document.getElementById('orgSetupForm');
  if (orgForm) {
    orgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Save org name to state before moving to step 2
      const orgNameInput = document.querySelector('input[name="orgName"]');
      if (orgNameInput) {
        state.organizationName = orgNameInput.value || 'My Organization';
      }
      state.onboardingStep = 2;
      showView('onboarding');
    });
  }

  // Step 2: Employee selection
  document.querySelectorAll('.employee-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.name;
      const index = state.selectedEmployees.indexOf(name);
      
      if (index === -1) {
        state.selectedEmployees.push(name);
        item.classList.add('selected');
        item.querySelector('.employee-checkbox').innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        state.selectedEmployees.splice(index, 1);
        item.classList.remove('selected');
        item.querySelector('.employee-checkbox').innerHTML = '';
      }
    });
  });

  // Global functions for buttons
  window.selectAllEmployees = () => {
    state.selectedEmployees = PREDEFINED_EMPLOYEES.map(e => e.name);
    showView('onboarding');
  };

  window.removeAllEmployees = () => {
    state.selectedEmployees = [];
    showView('onboarding');
  };

  window.prevOnboardingStep = () => {
    state.onboardingStep = 1;
    showView('onboarding');
  };

  window.completeOnboarding = async () => {
    // Use stored org name from state (saved in step 1)
    const orgName = state.organizationName || 'My Organization';
    console.log('Creating organization:', orgName);
    
    const employeesToCreate = PREDEFINED_EMPLOYEES
      .filter(e => state.selectedEmployees.includes(e.name))
      .map(e => ({ ...e }));
    
    console.log('Creating employees:', employeesToCreate.length);

    const result = await authService.setupOrganization(orgName, employeesToCreate);
    console.log('Setup result:', result);
    
    if (result.success) {
      state.organization = result.organization;
      state.employees = result.employees;
      await loadAppData();
      showView('dashboard');
    } else {
      showToast('Failed to setup organization: ' + (result.error || 'Unknown error'), 'error');
    }
  };
}

// ============================================
// DASHBOARD VIEW
// ============================================

function renderDashboardView() {
  const stats = calculateDashboardStats();

  return `
    ${renderSidebar()}
    <main class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">Dashboard</h1>
        </div>
        <div class="header-right">
          <button class="header-btn header-btn-primary" onclick="window.startNewMeeting()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Meeting
          </button>
        </div>
      </header>

      <div class="content">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card gradient-1">
            <div class="stat-header">
              <div class="stat-icon">Ã°Å¸â€œÅ </div>
              <div class="stat-trend up">+12%</div>
            </div>
            <div class="stat-value">${stats.totalMeetings}</div>
            <div class="stat-label">Total Meetings</div>
          </div>
          <div class="stat-card gradient-2">
            <div class="stat-header">
              <div class="stat-icon">Ã¢ÂÂ±Ã¯Â¸Â</div>
              <div class="stat-trend up">+8%</div>
            </div>
            <div class="stat-value">${stats.totalHours}</div>
            <div class="stat-label">Total Time</div>
          </div>
          <div class="stat-card gradient-3">
            <div class="stat-header">
              <div class="stat-icon">Ã¢Å“â€œ</div>
              <div class="stat-trend neutral">Ã¢â‚¬â€</div>
            </div>
            <div class="stat-value">${stats.actionItems}</div>
            <div class="stat-label">Action Items</div>
          </div>
          <div class="stat-card gradient-4">
            <div class="stat-header">
              <div class="stat-icon">Ã°Å¸â€˜Â¥</div>
              <div class="stat-trend neutral">Ã¢â‚¬â€</div>
            </div>
            <div class="stat-value">${stats.avgAttendees}</div>
            <div class="stat-label">Avg Attendees</div>
          </div>
        </div>

        <!-- Recent Meetings -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Meetings</h3>
            <button class="header-btn" onclick="window.navigateTo('history')">View All</button>
          </div>
          <div class="meeting-list">
            ${renderRecentMeetings()}
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">M</div>
          <span class="sidebar-logo-text">MeetingMind</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <div class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="window.navigateTo('dashboard')">
            <svg class="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </div>
          <div class="nav-item ${state.currentView === 'meeting' ? 'active' : ''}" onclick="window.navigateTo('meeting')">
            <svg class="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
            New Meeting
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Workspace</div>
          <div class="nav-item ${state.currentView === 'history' ? 'active' : ''}" onclick="window.navigateTo('history')">
            <svg class="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            History
          </div>
          <div class="nav-item ${state.currentView === 'reports' ? 'active' : ''}" onclick="window.navigateTo('reports')">
            <svg class="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Reports
          </div>
          <div class="nav-item ${state.currentView === 'actions' ? 'active' : ''}" onclick="window.navigateTo('actions')">
            <svg class="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Action Items
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">${getInitials(state.profile?.display_name || state.user?.email || 'U')}</div>
          <div class="user-info">
            <div class="user-name">${state.profile?.display_name || 'User'}</div>
            <div class="user-role">Enterprise</div>
          </div>
        </div>
      </div>
    </aside>
  `;
}

function renderRecentMeetings() {
  if (!state.meetings || state.meetings.length === 0) {
    return '<div class="empty-state">No meetings yet. Start your first meeting!</div>';
  }

  return state.meetings.slice(0, 5).map(meeting => `
    <div class="meeting-item" onclick="window.viewMeeting('${meeting.id}')">
      <div class="meeting-icon" style="background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%)">
        ${getInitials(meeting.title)}
      </div>
      <div class="meeting-info">
        <div class="meeting-title">${escapeHtml(meeting.title)}</div>
        <div class="meeting-meta">${formatDate(meeting.created_at, 'short')} Ã¢â‚¬Â¢ ${meeting.type}</div>
      </div>
      <div class="meeting-duration">${formatDuration(meeting.duration_seconds || 0)}</div>
    </div>
  `).join('');
}

function calculateDashboardStats() {
  const totalMeetings = state.meetings.length;
  const totalSeconds = state.meetings.reduce((sum, m) => sum + (m.duration_seconds || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const totalHours = hours > 0 ? `${hours}h` : `${Math.floor(totalSeconds / 60)}m`;

  return {
    totalMeetings,
    totalHours,
    actionItems: 0, // TODO: Load from DB
    avgAttendees: state.employees.length > 0 ? Math.ceil(state.employees.length / 2) : 0
  };
}

function attachDashboardHandlers() {
  window.navigateTo = showView;
  window.startNewMeeting = () => showView('meeting');
  window.viewMeeting = (id) => {
    console.log('View meeting:', id);
    // TODO: Load and show meeting details
  };
}

// ============================================
// MEETING VIEW (Simplified for now)
// ============================================

function renderMeetingView() {
  return `
    ${renderSidebar()}
    <main class="main">
      <div class="meeting-setup">
        <h2>Start New Meeting</h2>
        <form id="meetingSetupForm">
          <div class="form-group">
            <label>Meeting Title</label>
            <input type="text" name="title" required placeholder="Daily Operations">
          </div>
          <div class="form-group">
            <label>Meeting Type</label>
            <select name="type">
              <option value="general">General Meeting</option>
              <option value="standup">Daily Standup</option>
              <option value="operations">Operations Review</option>
              <option value="1on1">1:1 Meeting</option>
              <option value="client">Client Call</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-lg">Start Recording</button>
        </form>
      </div>
    </main>
  `;
}

function attachMeetingHandlers() {
  document.getElementById('meetingSetupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const result = await meetingService.startMeeting({
      title: formData.get('title'),
      type: formData.get('type'),
      speakers: state.employees
    });

    if (result.success) {
      await meetingService.startRecording();
      showToast('Recording started!', 'success');
      // TODO: Show recording UI
    }
  });
}

// ============================================
// OTHER VIEWS (Stubs)
// ============================================

function renderHistoryView() {
  return `${renderSidebar()}<main class="main"><div class="content"><h1>Meeting History</h1><p>Coming soon...</p></div></main>`;
}

function renderReportsView() {
  return `${renderSidebar()}<main class="main"><div class="content"><h1>Reports</h1><p>Coming soon...</p></div></main>`;
}

function renderActionsView() {
  return `${renderSidebar()}<main class="main"><div class="content"><h1>Action Items</h1><p>Coming soon...</p></div></main>`;
}

function renderPreferencesView() {
  return `${renderSidebar()}<main class="main"><div class="content"><h1>Preferences</h1><p>Coming soon...</p></div></main>`;
}

function attachHistoryHandlers() {}
function attachReportsHandlers() {}
function attachActionsHandlers() {}
function attachPreferencesHandlers() {}

// ============================================
// UTILITIES
// ============================================

function hideLoadingScreen() {
  const loading = document.getElementById('loadingScreen');
  const app = document.getElementById('app');
  
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 300);
  }
  
  // Make app visible
  if (app) {
    app.classList.add('visible');
  }
}

function showConfigurationError() {
  const appContainer = document.getElementById('app');
  appContainer.classList.add('visible'); // Make visible first
  appContainer.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="background: white; border-radius: 20px; padding: 3rem; max-width: 600px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">Ã¢Å¡Â Ã¯Â¸Â</div>
          <h1 style="font-size: 2rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem;">Configuration Required</h1>
          <p style="font-size: 1.125rem; color: #64748b; line-height: 1.6;">
            Environment variables are not configured in Vercel.
          </p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1rem; font-weight: 700; color: #475569; margin-bottom: 1rem;">Required Variables:</h2>
          <div style="font-family: 'Monaco', 'Courier New', monospace; font-size: 0.875rem; color: #1e293b;">
            <div style="margin-bottom: 0.5rem;">Ã¢â‚¬Â¢ VITE_SUPABASE_URL</div>
            <div style="margin-bottom: 0.5rem;">Ã¢â‚¬Â¢ VITE_SUPABASE_ANON_KEY</div>
            <div>Ã¢â‚¬Â¢ VITE_ANTHROPIC_API_KEY</div>
          </div>
        </div>
        
        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
          <h3 style="font-size: 0.875rem; font-weight: 700; color: #1e40af; margin-bottom: 0.5rem;">How to Fix:</h3>
          <ol style="font-size: 0.875rem; color: #1e40af; line-height: 1.6; padding-left: 1.25rem; margin: 0;">
            <li>Go to your Vercel project settings</li>
            <li>Navigate to "Environment Variables"</li>
            <li>Add the three required variables</li>
            <li>Redeploy the application</li>
          </ol>
        </div>
        
        <div style="text-align: center;">
          <a href="https://vercel.com/the-ai-guyjsy/meeting-mind/settings/environment-variables" 
             target="_blank"
             style="display: inline-block; padding: 0.875rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
            Open Vercel Settings Ã¢â€ â€™
          </a>
        </div>
        
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 0.8125rem; color: #94a3b8;">
            Need help? Check <a href="https://github.com/the-ai-guyjsy/meeting-mind" style="color: #3b82f6; text-decoration: none;">the documentation</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// START APPLICATION
// ============================================

document.addEventListener('DOMContentLoaded', initializeApp);
