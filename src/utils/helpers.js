/**
 * Utility Functions
 * Common helper functions used throughout the app
 */

/**
 * Format duration from seconds
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format time for transcript (MM:SS)
 */
export function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date
 */
export function formatDate(date, format = 'full') {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'full') {
    return d.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } else if (format === 'short') {
    return d.toLocaleDateString('en-GB');
  } else if (format === 'time') {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } else if (format === 'datetime') {
    return d.toLocaleString('en-GB');
  }
  
  return d.toLocaleDateString('en-GB');
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get avatar color based on speaker color code
 */
export function getSpeakerColor(colorCode) {
  const colors = {
    '1': '#2563eb', // blue
    '2': '#10b981', // green
    '3': '#f59e0b', // yellow
    '4': '#ec4899', // pink
    '5': '#06b6d4', // cyan
    '6': '#f97316'  // orange
  };
  return colors[colorCode] || colors['1'];
}

/**
 * Download file
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Export to CSV
 */
export function exportToCSV(data, filename) {
  const csv = data.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export to iCalendar format
 */
export function exportToICS(meeting) {
  const { title, started_at, ended_at, notes, id } = meeting;
  
  const formatICSDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MeetingMind//Enterprise//EN
BEGIN:VEVENT
UID:${id || Date.now()}@meetingmind.app
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(started_at)}
DTEND:${formatICSDate(ended_at || started_at)}
SUMMARY:${title}
DESCRIPTION:${notes || 'Meeting recorded with MeetingMind'}
END:VEVENT
END:VCALENDAR`;

  downloadFile(ics, `${title.replace(/[^a-z0-9]/gi, '_')}.ics`, 'text/calendar');
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Find or create toast container
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/**
 * Create loading spinner element
 */
export function createSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  return spinner;
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generate unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Calculate file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if date is today
 */
export function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
}

/**
 * Check if date is this week
 */
export function isThisWeek(date) {
  const today = new Date();
  const d = new Date(date);
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return d >= weekStart && d <= weekEnd;
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return formatDate(date, 'short');
}

/**
 * Local storage helpers
 */
export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

export default {
  formatDuration,
  formatTimestamp,
  formatDate,
  escapeHtml,
  debounce,
  throttle,
  getInitials,
  getSpeakerColor,
  downloadFile,
  copyToClipboard,
  exportToCSV,
  exportToICS,
  showToast,
  createSpinner,
  isValidEmail,
  generateId,
  formatFileSize,
  isToday,
  isThisWeek,
  getRelativeTime,
  storage
};
