/**
 * Export Service
 * Handles exporting meeting data to various formats (PDF, CSV, iCal, Email)
 */

import { downloadFile, exportToCSV, exportToICS, formatDate, formatDuration, showToast } from './helpers.js';

class ExportService {
  /**
   * Export meeting minutes to PDF (uses browser print)
   */
  exportToPDF(meeting, minutes) {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    
    const html = this.generatePrintableHTML(meeting, minutes);
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
    };
    
    showToast('Opening print dialog...', 'info');
  }

  /**
   * Generate printable HTML for PDF export
   */
  generatePrintableHTML(meeting, minutes) {
    const { title, started_at, duration_seconds, type } = meeting;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title} - Meeting Minutes</title>
        <style>
          @media print {
            body { margin: 0; }
            @page { margin: 2cm; }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header .meta {
            color: #64748b;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #1e293b;
            font-size: 18px;
            margin-bottom: 15px;
            border-left: 4px solid #2563eb;
            padding-left: 12px;
          }
          .summary {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .item {
            margin-bottom: 12px;
            padding-left: 20px;
            position: relative;
          }
          .item:before {
            content: "Ã¢â‚¬Â¢";
            position: absolute;
            left: 0;
            color: #2563eb;
            font-weight: bold;
          }
          .action-item {
            background: #fef3c7;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #f59e0b;
          }
          .action-owner {
            color: #d97706;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
          }
          .decision {
            background: #d1fae5;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #10b981;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="meta">
            <strong>Date:</strong> ${formatDate(started_at, 'full')}<br>
            <strong>Duration:</strong> ${formatDuration(duration_seconds)}<br>
            <strong>Type:</strong> ${type}
          </div>
        </div>

        ${minutes.summary ? `
          <div class="summary">
            <strong>Summary:</strong> ${minutes.summary}
          </div>
        ` : ''}

        ${minutes.key_points && minutes.key_points.length > 0 ? `
          <div class="section">
            <h2>Key Discussion Points</h2>
            ${minutes.key_points.map(point => `<div class="item">${point}</div>`).join('')}
          </div>
        ` : ''}

        ${minutes.decisions && minutes.decisions.length > 0 ? `
          <div class="section">
            <h2>Decisions Made</h2>
            ${minutes.decisions.map(decision => `<div class="decision">${decision}</div>`).join('')}
          </div>
        ` : ''}

        ${minutes.action_items && minutes.action_items.length > 0 ? `
          <div class="section">
            <h2>Action Items</h2>
            ${minutes.action_items.map(action => `
              <div class="action-item">
                ${action.text}
                ${action.assigned_to ? `<div class="action-owner">@${action.assigned_to}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${minutes.questions && minutes.questions.length > 0 ? `
          <div class="section">
            <h2>Open Questions</h2>
            ${minutes.questions.map(q => `<div class="item">${q}</div>`).join('')}
          </div>
        ` : ''}

        ${minutes.next_steps && minutes.next_steps.length > 0 ? `
          <div class="section">
            <h2>Next Steps</h2>
            ${minutes.next_steps.map(step => `<div class="item">${step}</div>`).join('')}
          </div>
        ` : ''}

        <div class="footer">
          Generated by MeetingMind Enterprise Ã¢â‚¬Â¢ ${formatDate(new Date(), 'datetime')}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Export meeting to CSV
   */
  exportMeetingToCSV(meeting, entries) {
    const data = [
      ['Meeting Minutes Export'],
      ['Title', meeting.title],
      ['Date', formatDate(meeting.started_at)],
      ['Duration', formatDuration(meeting.duration_seconds)],
      ['Type', meeting.type],
      [],
      ['Timestamp', 'Speaker', 'Text'],
      ...entries.map(entry => [
        entry.timestamp_seconds + 's',
        entry.speaker?.name || 'Unknown',
        entry.text
      ])
    ];

    const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_')}_transcript.csv`;
    exportToCSV(data, filename);
    showToast('CSV exported', 'success');
  }

  /**
   * Export dashboard data to CSV
   */
  exportDashboardToCSV(stats) {
    const data = [
      ['MeetingMind Dashboard Export'],
      ['Generated', formatDate(new Date(), 'datetime')],
      [],
      ['Metric', 'Value'],
      ['Total Meetings', stats.totalMeetings],
      ['Total Time', stats.totalTime],
      ['Action Items', stats.actionItems],
      ['Avg Attendees', stats.avgAttendees]
    ];

    exportToCSV(data, 'meetingmind_dashboard.csv');
    showToast('Dashboard exported', 'success');
  }

  /**
   * Export action items to CSV
   */
  exportActionsToCSV(actions) {
    const data = [
      ['Action Items Export'],
      ['Generated', formatDate(new Date(), 'datetime')],
      [],
      ['Action', 'Assigned To', 'Status', 'Priority', 'Due Date', 'Meeting'],
      ...actions.map(action => [
        action.text,
        action.employees?.name || 'Unassigned',
        action.status,
        action.priority || 'medium',
        action.due_date || 'Not set',
        action.meetings?.title || 'N/A'
      ])
    ];

    exportToCSV(data, 'meetingmind_actions.csv');
    showToast('Actions exported', 'success');
  }

  /**
   * Export meeting to iCalendar format
   */
  exportToCalendar(meeting) {
    exportToICS(meeting);
    showToast('Calendar file downloaded', 'success');
  }

  /**
   * Copy minutes to clipboard
   */
  async copyToClipboard(meeting, minutes) {
    let text = `${meeting.title}\n`;
    text += `${formatDate(meeting.started_at, 'full')}\n`;
    text += `Duration: ${formatDuration(meeting.duration_seconds)}\n\n`;

    if (minutes.summary) {
      text += `SUMMARY\n${minutes.summary}\n\n`;
    }

    if (minutes.key_points?.length > 0) {
      text += `KEY POINTS\n`;
      minutes.key_points.forEach(point => text += `Ã¢â‚¬Â¢ ${point}\n`);
      text += '\n';
    }

    if (minutes.decisions?.length > 0) {
      text += `DECISIONS\n`;
      minutes.decisions.forEach(decision => text += `Ã¢â‚¬Â¢ ${decision}\n`);
      text += '\n';
    }

    if (minutes.action_items?.length > 0) {
      text += `ACTION ITEMS\n`;
      minutes.action_items.forEach(action => {
        text += `Ã¢â‚¬Â¢ ${action.text}`;
        if (action.assigned_to) text += ` (@${action.assigned_to})`;
        text += '\n';
      });
      text += '\n';
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
      return true;
    } catch (error) {
      showToast('Failed to copy', 'error');
      return false;
    }
  }

  /**
   * Email meeting minutes
   */
  emailMinutes(meeting, minutes) {
    const subject = encodeURIComponent(`Meeting Minutes: ${meeting.title}`);
    
    let body = `Meeting: ${meeting.title}\n`;
    body += `Date: ${formatDate(meeting.started_at)}\n`;
    body += `Duration: ${formatDuration(meeting.duration_seconds)}\n\n`;

    if (minutes.summary) {
      body += `SUMMARY\n${minutes.summary}\n\n`;
    }

    if (minutes.action_items?.length > 0) {
      body += `ACTION ITEMS\n`;
      minutes.action_items.forEach(action => {
        body += `Ã¢â‚¬Â¢ ${action.text}`;
        if (action.assigned_to) body += ` (@${action.assigned_to})`;
        body += '\n';
      });
    }

    const encodedBody = encodeURIComponent(body);
    window.open(`mailto:?subject=${subject}&body=${encodedBody}`);
    
    showToast('Email client opened', 'success');
  }

  /**
   * Generate report PDF
   */
  exportReportToPDF(reportData) {
    const printWindow = window.open('', '_blank');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Meeting Analytics Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat {
            text-align: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
          }
          .stat-label {
            font-size: 14px;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Meeting Analytics Report</h1>
          <div>${reportData.period}</div>
        </div>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${reportData.totalMeetings}</div>
            <div class="stat-label">Total Meetings</div>
          </div>
          <div class="stat">
            <div class="stat-value">${reportData.totalHours}</div>
            <div class="stat-label">Total Hours</div>
          </div>
          <div class="stat">
            <div class="stat-value">${reportData.actionItems}</div>
            <div class="stat-label">Action Items</div>
          </div>
          <div class="stat">
            <div class="stat-value">${reportData.completion}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>

        ${reportData.meetings ? `
          <h2>Recent Meetings</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Attendees</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.meetings.map(m => `
                <tr>
                  <td>${formatDate(m.started_at, 'short')}</td>
                  <td>${m.title}</td>
                  <td>${m.type}</td>
                  <td>${formatDuration(m.duration_seconds)}</td>
                  <td>${m.attendees || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
    
    showToast('Opening print dialog...', 'info');
  }
}

// Export singleton instance
export const exportService = new ExportService();
export default exportService;
