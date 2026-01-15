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
  getSpeakerColor,
  getRelativeTime
} from './helpers.js';
console.log('main.js: All imports complete');

// ============================================
// SVG ICONS (Using inline SVGs to avoid encoding issues)
// ============================================

const ICONS = {
  calendar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  checkSquare: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  mic: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  grid: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  history: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  barChart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  arrowUp: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  arrowDown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  chevronRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`,
  x: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  trendUp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  activity: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  pieChart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  target: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  zap: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  filter: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  play: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
};

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
  actionItems: [],
  currentMeeting: null,
  onboardingStep: 1,
  selectedEmployees: [],
  drilldownModal: null,
  dashboardStats: null
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
  console.log('Initializing MeetingMind Enterprise...');

  try {
    const isAuthenticated = await authService.initialize();

    if (isAuthenticated) {
      state.isAuthenticated = true;
      state.user = authService.getUser();
      state.profile = authService.getProfile();
      state.organization = authService.getOrganization();

      if (!authService.hasCompletedOnboarding()) {
        showView('onboarding');
      } else {
        await loadAppData();
        showView('dashboard');
      }
    } else {
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
    if (state.organization) {
      const employees = await db.getEmployees(state.organization.id);
      state.employees = employees || [];

      const { meetings } = await meetingService.getMeetings(50);
      state.meetings = meetings || [];

      // Load action items
      try {
        const actionItems = await db.getActionItems(state.organization.id);
        state.actionItems = actionItems || [];
      } catch (e) {
        state.actionItems = [];
      }
    }
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
              <input type="password" name="password" required placeholder="Enter your password">
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
              <input type="password" name="password" required placeholder="Min 6 characters" minlength="6">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Create Account</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function attachAuthHandlers() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-tab-content').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      document.getElementById(e.target.dataset.tab + 'Tab').classList.add('active');
    });
  });

  document.getElementById('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = await authService.signIn(formData.get('email'), formData.get('password'));
    if (result.success) {
      state.isAuthenticated = true;
      state.user = result.user;
      await loadAppData();
      showView('dashboard');
    }
  });

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
              ${ICONS.chevronRight}
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
  const orgForm = document.getElementById('orgSetupForm');
  if (orgForm) {
    orgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.onboardingStep = 2;
      showView('onboarding');
    });
  }

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
    const orgName = document.querySelector('input[name="orgName"]')?.value || 'My Organization';
    
    const employeesToCreate = PREDEFINED_EMPLOYEES
      .filter(e => state.selectedEmployees.includes(e.name))
      .map(e => ({ ...e }));

    const result = await authService.setupOrganization(orgName, employeesToCreate);
    
    if (result.success) {
      state.organization = result.organization;
      state.employees = result.employees;
      await loadAppData();
      showView('dashboard');
    }
  };
}

// ============================================
// DASHBOARD VIEW - COMPLETELY REDESIGNED
// ============================================

function calculateDashboardStats() {
  const meetings = state.meetings || [];
  const actions = state.actionItems || [];
  
  const totalMeetings = meetings.length;
  const totalSeconds = meetings.reduce((sum, m) => sum + (m.duration_seconds || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  
  const completedActions = actions.filter(a => a.status === 'completed').length;
  const pendingActions = actions.filter(a => a.status === 'pending').length;
  
  // Meetings by type
  const meetingsByType = {};
  meetings.forEach(m => {
    meetingsByType[m.type] = (meetingsByType[m.type] || 0) + 1;
  });
  
  // This week's meetings
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const thisWeekMeetings = meetings.filter(m => new Date(m.created_at) >= weekStart);
  
  // Last week comparison
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekMeetings = meetings.filter(m => {
    const d = new Date(m.created_at);
    return d >= lastWeekStart && d < weekStart;
  });
  
  const weekChange = lastWeekMeetings.length > 0 
    ? Math.round(((thisWeekMeetings.length - lastWeekMeetings.length) / lastWeekMeetings.length) * 100)
    : 0;

  return {
    totalMeetings,
    totalHours,
    totalMinutes,
    totalTimeFormatted: totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`,
    totalActions: actions.length,
    completedActions,
    pendingActions,
    avgAttendees: state.employees.length > 0 ? Math.ceil(state.employees.length / 2) : 0,
    meetingsByType,
    thisWeekMeetings: thisWeekMeetings.length,
    weekChange,
    completionRate: actions.length > 0 ? Math.round((completedActions / actions.length) * 100) : 0
  };
}

function renderDashboardView() {
  const stats = calculateDashboardStats();
  state.dashboardStats = stats;

  return `
    ${renderSidebar()}
    <main class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">Dashboard</h1>
          <span class="header-subtitle">Welcome back, ${state.profile?.display_name || 'there'}!</span>
        </div>
        <div class="header-right">
          <button class="header-btn" onclick="window.refreshDashboard()">
            ${ICONS.activity}
            Refresh
          </button>
          <button class="header-btn header-btn-primary" onclick="window.startNewMeeting()">
            ${ICONS.plus}
            New Meeting
          </button>
        </div>
      </header>

      <div class="content">
        <!-- Stats Grid - Now Clickable -->
        <div class="stats-grid">
          ${renderStatCard({
            id: 'meetings',
            icon: ICONS.calendar,
            value: stats.totalMeetings,
            label: 'Total Meetings',
            sublabel: `${stats.thisWeekMeetings} this week`,
            trend: stats.weekChange,
            gradient: 'gradient-1',
            clickable: true
          })}
          ${renderStatCard({
            id: 'time',
            icon: ICONS.clock,
            value: stats.totalTimeFormatted,
            label: 'Meeting Time',
            sublabel: 'Total recorded',
            trend: 0,
            gradient: 'gradient-2',
            clickable: true
          })}
          ${renderStatCard({
            id: 'actions',
            icon: ICONS.checkSquare,
            value: stats.totalActions,
            label: 'Action Items',
            sublabel: `${stats.pendingActions} pending`,
            trend: null,
            gradient: 'gradient-3',
            clickable: true,
            badge: stats.pendingActions > 0 ? stats.pendingActions : null
          })}
          ${renderStatCard({
            id: 'team',
            icon: ICONS.users,
            value: state.employees.length,
            label: 'Team Members',
            sublabel: `${stats.avgAttendees} avg per meeting`,
            trend: null,
            gradient: 'gradient-4',
            clickable: true
          })}
        </div>

        <!-- Dashboard Grid -->
        <div class="dashboard-grid">
          <!-- Main Column -->
          <div class="dashboard-main-col">
            <!-- Recent Activity Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <h3 class="card-title">Recent Meetings</h3>
                  <span class="card-subtitle">${stats.totalMeetings} total</span>
                </div>
                <div class="card-actions">
                  <button class="card-action-btn" onclick="window.navigateTo('history')">
                    View All ${ICONS.chevronRight}
                  </button>
                </div>
              </div>
              <div class="meeting-list">
                ${renderRecentMeetings()}
              </div>
            </div>

            <!-- Meeting Types Breakdown -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <h3 class="card-title">Meeting Types</h3>
                  <span class="card-subtitle">Distribution by category</span>
                </div>
              </div>
              <div class="card-body">
                ${renderMeetingTypesChart(stats.meetingsByType)}
              </div>
            </div>
          </div>

          <!-- Side Column -->
          <div class="dashboard-side-col">
            <!-- Quick Actions -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Quick Actions</h3>
              </div>
              <div class="card-body">
                <div class="quick-actions-grid">
                  <button class="quick-action-item" onclick="window.startNewMeeting()">
                    <div class="quick-action-icon blue">${ICONS.mic}</div>
                    <span>Start Meeting</span>
                  </button>
                  <button class="quick-action-item" onclick="window.navigateTo('history')">
                    <div class="quick-action-icon green">${ICONS.search}</div>
                    <span>Search History</span>
                  </button>
                  <button class="quick-action-item" onclick="window.navigateTo('reports')">
                    <div class="quick-action-icon purple">${ICONS.barChart}</div>
                    <span>View Reports</span>
                  </button>
                  <button class="quick-action-item" onclick="window.navigateTo('actions')">
                    <div class="quick-action-icon orange">${ICONS.target}</div>
                    <span>Action Items</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Pending Actions -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <h3 class="card-title">Pending Actions</h3>
                  <span class="card-badge">${stats.pendingActions}</span>
                </div>
                <button class="card-action-btn" onclick="window.navigateTo('actions')">
                  ${ICONS.chevronRight}
                </button>
              </div>
              <div class="card-body">
                ${renderPendingActions()}
              </div>
            </div>

            <!-- Team Activity -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Active Team</h3>
              </div>
              <div class="card-body">
                ${renderTeamActivity()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Drilldown Modal -->
      <div class="modal-overlay" id="drilldownModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2 class="modal-title" id="drilldownTitle">Details</h2>
            <button class="modal-close" onclick="window.closeDrilldown()">${ICONS.x}</button>
          </div>
          <div class="modal-body" id="drilldownContent">
            <!-- Dynamic content -->
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderStatCard({ id, icon, value, label, sublabel, trend, gradient, clickable, badge }) {
  const trendClass = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  const trendIcon = trend > 0 ? ICONS.arrowUp : trend < 0 ? ICONS.arrowDown : '';
  const trendText = trend !== null && trend !== 0 ? `${trend > 0 ? '+' : ''}${trend}%` : '';

  return `
    <div class="stat-card ${gradient} ${clickable ? 'clickable' : ''}" 
         ${clickable ? `onclick="window.openDrilldown('${id}')"` : ''}>
      <div class="stat-header">
        <div class="stat-icon">${icon}</div>
        ${trend !== null ? `
          <div class="stat-trend ${trendClass}">
            ${trendIcon}
            <span>${trendText || '--'}</span>
          </div>
        ` : ''}
        ${badge ? `<div class="stat-badge">${badge}</div>` : ''}
      </div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
      ${sublabel ? `<div class="stat-sublabel">${sublabel}</div>` : ''}
      ${clickable ? `<div class="stat-expand-hint">Click to expand ${ICONS.chevronRight}</div>` : ''}
    </div>
  `;
}

function renderRecentMeetings() {
  if (!state.meetings || state.meetings.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.calendar}</div>
        <p class="empty-title">No meetings yet</p>
        <p class="empty-text">Start your first meeting to see it here</p>
        <button class="btn btn-primary" onclick="window.startNewMeeting()">
          ${ICONS.plus} Start Meeting
        </button>
      </div>
    `;
  }

  return state.meetings.slice(0, 5).map((meeting, index) => {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];
    const color = colors[index % colors.length];
    
    return `
      <div class="meeting-item" onclick="window.viewMeeting('${meeting.id}')">
        <div class="meeting-icon" style="background: ${color}">
          ${getInitials(meeting.title)}
        </div>
        <div class="meeting-info">
          <div class="meeting-title">${escapeHtml(meeting.title)}</div>
          <div class="meeting-meta">
            <span class="meeting-date">${getRelativeTime(meeting.created_at)}</span>
            <span class="meeting-type-badge">${meeting.type}</span>
          </div>
        </div>
        <div class="meeting-actions">
          <span class="meeting-duration">${formatDuration(meeting.duration_seconds || 0)}</span>
          <span class="meeting-arrow">${ICONS.chevronRight}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderMeetingTypesChart(meetingsByType) {
  const types = Object.entries(meetingsByType);
  const total = types.reduce((sum, [_, count]) => sum + count, 0);
  
  if (total === 0) {
    return `
      <div class="empty-state-small">
        <p>No meeting data to display</p>
      </div>
    `;
  }

  const typeColors = {
    general: '#2563eb',
    standup: '#10b981',
    operations: '#f59e0b',
    '1on1': '#ec4899',
    client: '#06b6d4',
    interview: '#8b5cf6',
    brainstorming: '#f97316',
    training: '#14b8a6'
  };

  return `
    <div class="type-chart">
      ${types.map(([type, count]) => {
        const percentage = Math.round((count / total) * 100);
        const color = typeColors[type] || '#64748b';
        return `
          <div class="type-row">
            <div class="type-label">
              <span class="type-dot" style="background: ${color}"></span>
              <span class="type-name">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </div>
            <div class="type-bar-wrapper">
              <div class="type-bar" style="width: ${percentage}%; background: ${color}"></div>
            </div>
            <div class="type-value">${count}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPendingActions() {
  const pending = state.actionItems.filter(a => a.status === 'pending').slice(0, 4);
  
  if (pending.length === 0) {
    return `
      <div class="empty-state-small">
        <p>No pending actions</p>
      </div>
    `;
  }

  return `
    <div class="action-list-compact">
      ${pending.map(action => `
        <div class="action-item-compact">
          <div class="action-checkbox" onclick="window.toggleAction('${action.id}')"></div>
          <div class="action-content">
            <div class="action-text">${escapeHtml(action.text)}</div>
            ${action.employees?.name ? `
              <div class="action-assignee">@${action.employees.name}</div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTeamActivity() {
  if (state.employees.length === 0) {
    return `
      <div class="empty-state-small">
        <p>No team members yet</p>
      </div>
    `;
  }

  return `
    <div class="team-avatars">
      ${state.employees.slice(0, 8).map(emp => `
        <div class="team-avatar" style="background: ${getSpeakerColor(emp.color)}" title="${emp.name}">
          ${getInitials(emp.name)}
        </div>
      `).join('')}
      ${state.employees.length > 8 ? `
        <div class="team-avatar team-avatar-more">+${state.employees.length - 8}</div>
      ` : ''}
    </div>
    <div class="team-stats">
      <div class="team-stat">
        <span class="team-stat-value">${state.employees.length}</span>
        <span class="team-stat-label">Total Members</span>
      </div>
    </div>
  `;
}

// ============================================
// DRILLDOWN MODAL FUNCTIONS
// ============================================

function openDrilldown(type) {
  const modal = document.getElementById('drilldownModal');
  const title = document.getElementById('drilldownTitle');
  const content = document.getElementById('drilldownContent');
  
  const stats = state.dashboardStats;
  
  switch (type) {
    case 'meetings':
      title.textContent = 'Meetings Overview';
      content.innerHTML = renderMeetingsDrilldown();
      break;
    case 'time':
      title.textContent = 'Time Analysis';
      content.innerHTML = renderTimeDrilldown();
      break;
    case 'actions':
      title.textContent = 'Action Items';
      content.innerHTML = renderActionsDrilldown();
      break;
    case 'team':
      title.textContent = 'Team Members';
      content.innerHTML = renderTeamDrilldown();
      break;
    default:
      return;
  }
  
  modal.classList.add('show');
}

function closeDrilldown() {
  const modal = document.getElementById('drilldownModal');
  modal.classList.remove('show');
}

function renderMeetingsDrilldown() {
  const stats = state.dashboardStats;
  const meetings = state.meetings;
  
  // Group by day of week
  const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  meetings.forEach(m => {
    const day = new Date(m.created_at).getDay();
    byDayOfWeek[day]++;
  });
  const maxByDay = Math.max(...byDayOfWeek, 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return `
    <div class="drilldown-grid">
      <div class="drilldown-section">
        <h4 class="drilldown-section-title">Summary</h4>
        <div class="drilldown-stats">
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${stats.totalMeetings}</div>
            <div class="drilldown-stat-label">Total Meetings</div>
          </div>
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${stats.thisWeekMeetings}</div>
            <div class="drilldown-stat-label">This Week</div>
          </div>
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${Object.keys(stats.meetingsByType).length}</div>
            <div class="drilldown-stat-label">Meeting Types</div>
          </div>
        </div>
      </div>
      
      <div class="drilldown-section">
        <h4 class="drilldown-section-title">Meetings by Day</h4>
        <div class="day-chart">
          ${days.map((day, i) => `
            <div class="day-bar-group">
              <div class="day-bar" style="height: ${(byDayOfWeek[i] / maxByDay) * 100}%"></div>
              <div class="day-label">${day}</div>
              <div class="day-value">${byDayOfWeek[i]}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="drilldown-section drilldown-section-full">
        <h4 class="drilldown-section-title">Recent Meetings</h4>
        <div class="drilldown-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${meetings.slice(0, 10).map(m => `
                <tr onclick="window.viewMeeting('${m.id}')" class="clickable-row">
                  <td><strong>${escapeHtml(m.title)}</strong></td>
                  <td><span class="type-badge type-${m.type}">${m.type}</span></td>
                  <td>${formatDuration(m.duration_seconds || 0)}</td>
                  <td>${formatDate(m.created_at, 'short')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTimeDrilldown() {
  const stats = state.dashboardStats;
  const meetings = state.meetings;
  
  // Calculate average meeting duration
  const durations = meetings.map(m => m.duration_seconds || 0).filter(d => d > 0);
  const avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  
  // Longest meeting
  const longestMeeting = meetings.reduce((longest, m) => 
    (m.duration_seconds || 0) > (longest?.duration_seconds || 0) ? m : longest
  , null);
  
  // Time by type
  const timeByType = {};
  meetings.forEach(m => {
    timeByType[m.type] = (timeByType[m.type] || 0) + (m.duration_seconds || 0);
  });

  return `
    <div class="drilldown-grid">
      <div class="drilldown-section">
        <h4 class="drilldown-section-title">Time Summary</h4>
        <div class="drilldown-stats">
          <div class="drilldown-stat highlight">
            <div class="drilldown-stat-value">${stats.totalTimeFormatted}</div>
            <div class="drilldown-stat-label">Total Time</div>
          </div>
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${formatDuration(avgDuration)}</div>
            <div class="drilldown-stat-label">Avg Duration</div>
          </div>
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${longestMeeting ? formatDuration(longestMeeting.duration_seconds) : '--'}</div>
            <div class="drilldown-stat-label">Longest Meeting</div>
          </div>
        </div>
      </div>
      
      <div class="drilldown-section drilldown-section-full">
        <h4 class="drilldown-section-title">Time by Meeting Type</h4>
        <div class="time-by-type">
          ${Object.entries(timeByType).map(([type, seconds]) => {
            const percentage = Math.round((seconds / (stats.totalHours * 3600 + stats.totalMinutes * 60)) * 100) || 0;
            return `
              <div class="time-type-row">
                <div class="time-type-label">${type}</div>
                <div class="time-type-bar-container">
                  <div class="time-type-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="time-type-value">${formatDuration(seconds)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderActionsDrilldown() {
  const actions = state.actionItems;
  const completed = actions.filter(a => a.status === 'completed');
  const pending = actions.filter(a => a.status === 'pending');
  const stats = state.dashboardStats;

  return `
    <div class="drilldown-grid">
      <div class="drilldown-section">
        <h4 class="drilldown-section-title">Action Summary</h4>
        <div class="drilldown-stats">
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${stats.totalActions}</div>
            <div class="drilldown-stat-label">Total Actions</div>
          </div>
          <div class="drilldown-stat success">
            <div class="drilldown-stat-value">${stats.completedActions}</div>
            <div class="drilldown-stat-label">Completed</div>
          </div>
          <div class="drilldown-stat warning">
            <div class="drilldown-stat-value">${stats.pendingActions}</div>
            <div class="drilldown-stat-label">Pending</div>
          </div>
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${stats.completionRate}%</div>
            <div class="drilldown-stat-label">Completion Rate</div>
          </div>
        </div>
      </div>
      
      <div class="drilldown-section">
        <h4 class="drilldown-section-title">Completion Progress</h4>
        <div class="completion-ring-container">
          <div class="completion-ring">
            <svg viewBox="0 0 36 36">
              <path class="completion-ring-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                stroke-width="3"
              />
              <path class="completion-ring-fill"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10b981"
                stroke-width="3"
                stroke-dasharray="${stats.completionRate}, 100"
              />
            </svg>
            <div class="completion-ring-value">${stats.completionRate}%</div>
          </div>
        </div>
      </div>
      
      <div class="drilldown-section drilldown-section-full">
        <h4 class="drilldown-section-title">All Actions</h4>
        <div class="action-list-full">
          ${actions.length === 0 ? `
            <div class="empty-state-small">No action items yet</div>
          ` : actions.map(action => `
            <div class="action-item-full ${action.status}">
              <div class="action-item-checkbox ${action.status === 'completed' ? 'checked' : ''}" 
                   onclick="window.toggleAction('${action.id}')">
                ${action.status === 'completed' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
              </div>
              <div class="action-item-info">
                <div class="action-item-text">${escapeHtml(action.text)}</div>
                <div class="action-item-meta">
                  ${action.employees?.name ? `<span class="action-assignee">@${action.employees.name}</span>` : ''}
                  ${action.meetings?.title ? `<span class="action-meeting">${action.meetings.title}</span>` : ''}
                </div>
              </div>
              <div class="action-item-status ${action.status}">${action.status}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTeamDrilldown() {
  const employees = state.employees;
  const meetings = state.meetings;
  
  // Calculate participation (mock data since we don't track attendees yet)
  const participation = employees.map(emp => ({
    ...emp,
    meetingCount: Math.floor(Math.random() * meetings.length),
    lastActive: 'Today'
  }));

  return `
    <div class="drilldown-grid">
      <div class="drilldown-section">
        <h4 class="drilldown-section-title">Team Overview</h4>
        <div class="drilldown-stats">
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${employees.length}</div>
            <div class="drilldown-stat-label">Team Members</div>
          </div>
          <div class="drilldown-stat">
            <div class="drilldown-stat-value">${state.dashboardStats.avgAttendees}</div>
            <div class="drilldown-stat-label">Avg per Meeting</div>
          </div>
        </div>
      </div>
      
      <div class="drilldown-section drilldown-section-full">
        <h4 class="drilldown-section-title">Team Members</h4>
        <div class="team-grid">
          ${employees.map(emp => `
            <div class="team-member-card">
              <div class="team-member-avatar" style="background: ${getSpeakerColor(emp.color)}">
                ${getInitials(emp.name)}
              </div>
              <div class="team-member-info">
                <div class="team-member-name">${emp.name}</div>
                <div class="team-member-language">${emp.default_language}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// SIDEBAR
// ============================================

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
            ${ICONS.grid}
            <span>Dashboard</span>
          </div>
          <div class="nav-item ${state.currentView === 'meeting' ? 'active' : ''}" onclick="window.navigateTo('meeting')">
            ${ICONS.mic}
            <span>New Meeting</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Workspace</div>
          <div class="nav-item ${state.currentView === 'history' ? 'active' : ''}" onclick="window.navigateTo('history')">
            ${ICONS.history}
            <span>History</span>
          </div>
          <div class="nav-item ${state.currentView === 'reports' ? 'active' : ''}" onclick="window.navigateTo('reports')">
            ${ICONS.barChart}
            <span>Reports</span>
          </div>
          <div class="nav-item ${state.currentView === 'actions' ? 'active' : ''}" onclick="window.navigateTo('actions')">
            ${ICONS.checkSquare}
            <span>Action Items</span>
            ${state.actionItems.filter(a => a.status === 'pending').length > 0 ? `
              <span class="nav-item-badge">${state.actionItems.filter(a => a.status === 'pending').length}</span>
            ` : ''}
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Settings</div>
          <div class="nav-item ${state.currentView === 'preferences' ? 'active' : ''}" onclick="window.navigateTo('preferences')">
            ${ICONS.settings}
            <span>Preferences</span>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">${getInitials(state.profile?.display_name || state.user?.email || 'U')}</div>
          <div class="user-info">
            <div class="user-name">${state.profile?.display_name || 'User'}</div>
            <div class="user-role">${state.organization?.name || 'Enterprise'}</div>
          </div>
        </div>
      </div>
    </aside>
  `;
}

function attachDashboardHandlers() {
  window.navigateTo = showView;
  window.startNewMeeting = () => showView('meeting');
  window.viewMeeting = (id) => {
    console.log('View meeting:', id);
    closeDrilldown();
  };
  window.openDrilldown = openDrilldown;
  window.closeDrilldown = closeDrilldown;
  window.refreshDashboard = async () => {
    showToast('Refreshing...', 'info', 1000);
    await loadAppData();
    showView('dashboard');
  };
  window.toggleAction = async (id) => {
    const action = state.actionItems.find(a => a.id === id);
    if (action) {
      const newStatus = action.status === 'completed' ? 'pending' : 'completed';
      try {
        await db.updateActionItem(id, { status: newStatus });
        action.status = newStatus;
        showToast(newStatus === 'completed' ? 'Action completed!' : 'Action reopened', 'success');
        showView('dashboard');
      } catch (e) {
        showToast('Failed to update action', 'error');
      }
    }
  };

  // Close modal on backdrop click
  document.getElementById('drilldownModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'drilldownModal') {
      closeDrilldown();
    }
  });

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrilldown();
    }
  });
}

// ============================================
// MEETING VIEW
// ============================================

function renderMeetingView() {
  return `
    ${renderSidebar()}
    <main class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">New Meeting</h1>
        </div>
      </header>
      
      <div class="content">
        <div class="meeting-setup">
          <div class="setup-header">
            <div class="setup-icon">${ICONS.mic}</div>
            <h2>Start a New Meeting</h2>
            <p>Configure your meeting settings and start recording</p>
          </div>
          
          <form id="meetingSetupForm">
            <div class="form-group">
              <label>Meeting Title</label>
              <input type="text" name="title" required placeholder="e.g., Weekly Team Standup">
              <div class="quick-titles">
                <button type="button" class="quick-title" data-title="Daily Operations">Daily Operations</button>
                <button type="button" class="quick-title" data-title="Team Standup">Team Standup</button>
                <button type="button" class="quick-title" data-title="Client Call">Client Call</button>
                <button type="button" class="quick-title" data-title="1:1 Meeting">1:1 Meeting</button>
              </div>
            </div>
            
            <div class="form-group">
              <label>Meeting Type</label>
              <select name="type" class="form-select">
                <option value="general">General Meeting</option>
                <option value="standup">Daily Standup</option>
                <option value="operations">Operations Review</option>
                <option value="1on1">1:1 Meeting</option>
                <option value="client">Client Call</option>
                <option value="interview">Interview</option>
                <option value="brainstorming">Brainstorming</option>
                <option value="training">Training Session</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg btn-block">
              ${ICONS.play}
              Start Recording
            </button>
          </form>
        </div>
      </div>
    </main>
  `;
}

function attachMeetingHandlers() {
  window.navigateTo = showView;

  // Quick title buttons
  document.querySelectorAll('.quick-title').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('input[name="title"]').value = btn.dataset.title;
    });
  });

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
    }
  });
}

// ============================================
// OTHER VIEWS
// ============================================

function renderHistoryView() {
  return `
    ${renderSidebar()}
    <main class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">Meeting History</h1>
          <span class="header-subtitle">${state.meetings.length} meetings recorded</span>
        </div>
        <div class="header-right">
          <button class="header-btn">
            ${ICONS.filter}
            Filter
          </button>
          <button class="header-btn">
            ${ICONS.download}
            Export
          </button>
        </div>
      </header>
      
      <div class="content">
        <div class="card">
          <div class="meeting-list meeting-list-full">
            ${state.meetings.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">${ICONS.calendar}</div>
                <p class="empty-title">No meetings yet</p>
                <p class="empty-text">Your meeting history will appear here</p>
              </div>
            ` : state.meetings.map((meeting, index) => {
              const colors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];
              return `
                <div class="meeting-item meeting-item-detailed" onclick="window.viewMeeting('${meeting.id}')">
                  <div class="meeting-icon" style="background: ${colors[index % colors.length]}">
                    ${getInitials(meeting.title)}
                  </div>
                  <div class="meeting-info">
                    <div class="meeting-title">${escapeHtml(meeting.title)}</div>
                    <div class="meeting-meta">
                      <span>${formatDate(meeting.created_at, 'full')}</span>
                      <span class="meeting-type-badge">${meeting.type}</span>
                    </div>
                  </div>
                  <div class="meeting-stats">
                    <div class="meeting-stat">
                      <span class="meeting-stat-value">${formatDuration(meeting.duration_seconds || 0)}</span>
                      <span class="meeting-stat-label">Duration</span>
                    </div>
                  </div>
                  <div class="meeting-arrow">${ICONS.chevronRight}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderReportsView() {
  const stats = calculateDashboardStats();
  
  return `
    ${renderSidebar()}
    <main class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">Reports & Analytics</h1>
        </div>
        <div class="header-right">
          <button class="header-btn">
            ${ICONS.download}
            Export Report
          </button>
        </div>
      </header>
      
      <div class="content">
        <div class="reports-grid">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Meeting Overview</h3>
            </div>
            <div class="card-body">
              <div class="report-stats">
                <div class="report-stat">
                  <div class="report-stat-value">${stats.totalMeetings}</div>
                  <div class="report-stat-label">Total Meetings</div>
                </div>
                <div class="report-stat">
                  <div class="report-stat-value">${stats.totalTimeFormatted}</div>
                  <div class="report-stat-label">Total Time</div>
                </div>
                <div class="report-stat">
                  <div class="report-stat-value">${stats.completionRate}%</div>
                  <div class="report-stat-label">Action Completion</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Meeting Types</h3>
            </div>
            <div class="card-body">
              ${renderMeetingTypesChart(stats.meetingsByType)}
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderActionsView() {
  const pending = state.actionItems.filter(a => a.status === 'pending');
  const completed = state.actionItems.filter(a => a.status === 'completed');
  
  return `
    ${renderSidebar()}
    <main class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">Action Items</h1>
          <span class="header-subtitle">${pending.length} pending, ${completed.length} completed</span>
        </div>
      </header>
      
      <div class="content">
        <div class="actions-sections">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Pending Actions</h3>
              <span class="card-badge">${pending.length}</span>
            </div>
            <div class="card-body">
              ${pending.length === 0 ? `
                <div class="empty-state-small">
                  <p>No pending actions</p>
                </div>
              ` : `
                <div class="action-list-full">
                  ${pending.map(action => `
                    <div class="action-item-full pending">
                      <div class="action-item-checkbox" onclick="window.toggleAction('${action.id}')"></div>
                      <div class="action-item-info">
                        <div class="action-item-text">${escapeHtml(action.text)}</div>
                        <div class="action-item-meta">
                          ${action.employees?.name ? `<span class="action-assignee">@${action.employees.name}</span>` : ''}
                          ${action.meetings?.title ? `<span class="action-meeting">${action.meetings.title}</span>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Completed Actions</h3>
              <span class="card-badge success">${completed.length}</span>
            </div>
            <div class="card-body">
              ${completed.length === 0 ? `
                <div class="empty-state-small">
                  <p>No completed actions yet</p>
                </div>
              ` : `
                <div class="action-list-full">
                  ${completed.map(action => `
                    <div class="action-item-full completed">
                      <div class="action-item-checkbox checked" onclick="window.toggleAction('${action.id}')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div class="action-item-info">
                        <div class="action-item-text">${escapeHtml(action.text)}</div>
                        <div class="action-item-meta">
                          ${action.employees?.name ? `<span class="action-assignee">@${action.employees.name}</span>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderPreferencesView() {
  return `
    ${renderSidebar()}
    <main class="main">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">Preferences</h1>
        </div>
      </header>
      
      <div class="content">
        <div class="preferences-grid">
          <div class="card preferences-card">
            <div class="card-header">
              <h3 class="card-title">${ICONS.users} Profile</h3>
            </div>
            <div class="card-body">
              <div class="pref-group">
                <label class="pref-label">Display Name</label>
                <input type="text" class="pref-input" value="${state.profile?.display_name || ''}">
              </div>
              <div class="pref-group">
                <label class="pref-label">Organization</label>
                <input type="text" class="pref-input" value="${state.organization?.name || ''}" disabled>
              </div>
            </div>
          </div>
          
          <div class="card preferences-card">
            <div class="card-header">
              <h3 class="card-title">${ICONS.settings} Application</h3>
            </div>
            <div class="card-body">
              <div class="pref-toggle-row">
                <span class="pref-toggle-label">Auto-save transcripts</span>
                <label class="pref-toggle">
                  <input type="checkbox" checked>
                  <span class="pref-toggle-slider"></span>
                </label>
              </div>
              <div class="pref-toggle-row">
                <span class="pref-toggle-label">Enable AI suggestions</span>
                <label class="pref-toggle">
                  <input type="checkbox" checked>
                  <span class="pref-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function attachHistoryHandlers() {
  window.navigateTo = showView;
  window.viewMeeting = (id) => console.log('View meeting:', id);
}

function attachReportsHandlers() {
  window.navigateTo = showView;
}

function attachActionsHandlers() {
  window.navigateTo = showView;
  window.toggleAction = async (id) => {
    const action = state.actionItems.find(a => a.id === id);
    if (action) {
      const newStatus = action.status === 'completed' ? 'pending' : 'completed';
      try {
        await db.updateActionItem(id, { status: newStatus });
        action.status = newStatus;
        showToast(newStatus === 'completed' ? 'Action completed!' : 'Action reopened', 'success');
        showView('actions');
      } catch (e) {
        showToast('Failed to update action', 'error');
      }
    }
  };
}

function attachPreferencesHandlers() {
  window.navigateTo = showView;
}

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
  
  if (app) {
    app.classList.add('visible');
  }
}

// ============================================
// START APPLICATION
// ============================================

document.addEventListener('DOMContentLoaded', initializeApp);
