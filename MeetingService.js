/**
 * Meeting Service
 * Handles all meeting-related operations including recording, transcription, and AI processing
 */

import { db, storage } from './supabase.js';
import { generateMinutes, askMeetingQuestion, analyzeMeeting } from './ai.js';
import { AudioRecorder, SpeechRecognizer } from './audio.js';
import { showToast, formatDuration } from './helpers.js';
import { authService } from './AuthService.js';

class MeetingService {
  constructor() {
    this.currentMeeting = null;
    this.audioRecorder = null;
    this.speechRecognizer = null;
    this.isRecording = false;
    this.startTime = null;
    this.transcript = '';
    this.entries = [];
    this.currentSpeaker = null;
    this.speakers = [];
    this.autoAlternate = false;
    this.timerInterval = null;
  }

  /**
   * Start a new meeting
   */
  async startMeeting(meetingData) {
    try {
      const org = authService.getOrganization();
      const user = authService.getUser();

      if (!org) {
        throw new Error('No organization - please complete setup first');
      }
      
      if (!user) {
        throw new Error('Not authenticated - please sign in');
      }

      // Create meeting record in database
      const meeting = await db.createMeeting({
        organization_id: org.id,
        created_by: user.id,
        title: meetingData.title,
        type: meetingData.type || 'general',
        status: 'in_progress',
        started_at: new Date().toISOString()
      });

      this.currentMeeting = meeting;
      this.speakers = meetingData.speakers || [];
      this.currentSpeaker = this.speakers[0] || null;
      this.entries = [];
      this.transcript = '';
      
      showToast('Meeting created', 'success');
      return { success: true, meeting };
    } catch (error) {
      console.error('Failed to start meeting:', error);
      showToast('Failed to create meeting: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Start recording audio and transcription
   */
  async startRecording() {
    try {
      if (!this.currentMeeting) {
        throw new Error('No active meeting');
      }

      // Initialize audio recorder
      this.audioRecorder = new AudioRecorder();
      await this.audioRecorder.startRecording();

      // Initialize speech recognition
      this.speechRecognizer = new SpeechRecognizer({
        language: this.currentSpeaker?.default_language || 'en-GB',
        continuous: true,
        interimResults: true,
        onResult: (result) => this.handleTranscriptResult(result),
        onError: (error) => console.error('Speech recognition error:', error)
      });
      
      this.speechRecognizer.start();

      this.isRecording = true;
      this.startTime = Date.now();
      this.startTimer();

      showToast('Recording started', 'success');
      return { success: true };
    } catch (error) {
      console.error('Failed to start recording:', error);
      showToast(error.message || 'Failed to start recording', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop recording and save
   */
  async stopRecording() {
    try {
      if (!this.isRecording) {
        throw new Error('No active recording');
      }

      // Stop speech recognition
      if (this.speechRecognizer) {
        this.speechRecognizer.stop();
      }

      // Stop audio recording
      const audioData = await this.audioRecorder.stopRecording();
      
      // Stop timer
      this.stopTimer();
      
      const duration = Math.floor((Date.now() - this.startTime) / 1000);

      // Upload audio to storage
      let audioUrl = null;
      try {
        const filename = `recording_${Date.now()}.webm`;
        const { url } = await storage.uploadAudio(
          this.currentMeeting.id,
          audioData.blob,
          filename
        );
        audioUrl = url;
      } catch (uploadError) {
        console.error('Audio upload failed:', uploadError);
        // Continue even if upload fails
      }

      // Update meeting record
      await db.updateMeeting(this.currentMeeting.id, {
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        transcript: this.transcript,
        audio_url: audioUrl
      });

      this.isRecording = false;
      
      showToast('Recording stopped', 'success');
      return { success: true, duration, audioUrl };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      showToast('Failed to stop recording', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle transcript results from speech recognition
   */
  async handleTranscriptResult(result) {
    if (result.final && result.final.trim()) {
      await this.addTranscriptEntry(result.final.trim());
    }
    
    // Emit interim results for UI updates
    if (this.onInterimResult) {
      this.onInterimResult(result.interim);
    }
  }

  /**
   * Add transcript entry
   */
  async addTranscriptEntry(text) {
    if (!this.currentMeeting || !this.currentSpeaker) {
      return;
    }

    const timestamp = Math.floor((Date.now() - this.startTime) / 1000);

    try {
      // Save to database
      const entry = await db.createTranscriptEntry({
        meeting_id: this.currentMeeting.id,
        speaker_id: this.currentSpeaker.id,
        text: text,
        timestamp_seconds: timestamp
      });

      // Add to local state
      const entryData = {
        ...entry,
        speaker: this.currentSpeaker
      };
      
      this.entries.push(entryData);
      this.transcript += `${this.currentSpeaker.name}: ${text}\n`;

      // Emit to UI
      if (this.onNewEntry) {
        this.onNewEntry(entryData);
      }

      // Auto-alternate speakers if enabled
      if (this.autoAlternate && this.speakers.length > 1) {
        this.nextSpeaker();
      }

      return entry;
    } catch (error) {
      console.error('Failed to save transcript entry:', error);
    }
  }

  /**
   * Set current speaker
   */
  setSpeaker(speakerIndex) {
    if (speakerIndex >= 0 && speakerIndex < this.speakers.length) {
      this.currentSpeaker = this.speakers[speakerIndex];
      
      // Update speech recognition language if needed
      if (this.speechRecognizer && this.currentSpeaker.default_language) {
        this.speechRecognizer.setLanguage(this.currentSpeaker.default_language);
      }
      
      return this.currentSpeaker;
    }
  }

  /**
   * Next speaker (for auto-alternate)
   */
  nextSpeaker() {
    const currentIndex = this.speakers.indexOf(this.currentSpeaker);
    const nextIndex = (currentIndex + 1) % this.speakers.length;
    return this.setSpeaker(nextIndex);
  }

  /**
   * Toggle auto-alternate mode
   */
  setAutoAlternate(enabled) {
    this.autoAlternate = enabled;
    return this.autoAlternate;
  }

  /**
   * Highlight a transcript entry
   */
  async highlightEntry(entryId) {
    try {
      await db.updateTranscriptEntry(entryId, { is_highlighted: true });
      
      const entry = this.entries.find(e => e.id === entryId);
      if (entry) {
        entry.is_highlighted = true;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to highlight entry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate AI meeting minutes
   */
  async generateAIMinutes(additionalNotes = '') {
    try {
      if (!this.currentMeeting) {
        throw new Error('No active meeting');
      }

      showToast('Generating minutes...', 'info', 2000);

      const minutesData = await generateMinutes({
        title: this.currentMeeting.title,
        type: this.currentMeeting.type,
        transcript: this.transcript,
        speakers: this.speakers,
        entries: this.entries,
        notes: additionalNotes
      });

      // Save to database
      await db.updateMeeting(this.currentMeeting.id, {
        ai_summary: minutesData,
        notes: additionalNotes
      });

      // Create action items
      if (minutesData.action_items) {
        for (const action of minutesData.action_items) {
          // Find employee by name
          const assignedEmployee = this.speakers.find(
            s => s.name.toLowerCase() === action.assigned_to?.toLowerCase()
          );

          await db.createActionItem({
            meeting_id: this.currentMeeting.id,
            organization_id: authService.getOrganization().id,
            text: action.text,
            assigned_to: assignedEmployee?.id || null,
            status: 'pending',
            priority: action.priority || 'medium'
          });
        }
      }

      showToast('Minutes generated!', 'success');
      return { success: true, minutes: minutesData };
    } catch (error) {
      console.error('Failed to generate minutes:', error);
      showToast('Failed to generate minutes', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Ask AI a question about the meeting
   */
  async askQuestion(question) {
    try {
      const answer = await askMeetingQuestion(question, {
        transcript: this.transcript,
        entries: this.entries,
        speakers: this.speakers,
        type: this.currentMeeting?.type
      });

      return { success: true, answer };
    } catch (error) {
      console.error('Failed to get AI answer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get meeting analytics
   */
  async getAnalytics() {
    try {
      const analytics = await analyzeMeeting({
        entries: this.entries,
        speakers: this.speakers
      });

      return { success: true, analytics };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load existing meeting
   */
  async loadMeeting(meetingId) {
    try {
      const meeting = await db.getMeeting(meetingId);
      
      this.currentMeeting = meeting;
      this.entries = meeting.transcript_entries || [];
      this.transcript = meeting.transcript || '';
      
      // TODO: Load speakers from meeting participants
      
      return { success: true, meeting };
    } catch (error) {
      console.error('Failed to load meeting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all meetings for current organization
   */
  async getMeetings(limit = 50) {
    try {
      const org = authService.getOrganization();
      if (!org) {
        console.warn('No organization set');
        return { success: true, meetings: [] };
      }

      const meetings = await db.getMeetings(org.id, limit);
      return { success: true, meetings };
    } catch (error) {
      console.error('Failed to get meetings:', error);
      return { success: false, error: error.message, meetings: [] };
    }
  }

  /**
   * Timer functions
   */
  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.onTimerUpdate) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.onTimerUpdate(elapsed);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Get current meeting state
   */
  getState() {
    return {
      meeting: this.currentMeeting,
      isRecording: this.isRecording,
      currentSpeaker: this.currentSpeaker,
      speakers: this.speakers,
      entries: this.entries,
      transcript: this.transcript,
      autoAlternate: this.autoAlternate
    };
  }

  /**
   * Event handlers (set by UI components)
   */
  onNewEntry = null;
  onInterimResult = null;
  onTimerUpdate = null;
}

// Export singleton instance
export const meetingService = new MeetingService();
export default meetingService;
