/**
 * Audio Recording Module
 * Handles audio capture, recording, and upload to Supabase
 */

export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
  }

  /**
   * Initialize and start recording
   */
  async startRecording() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Determine best audio format
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];

      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!selectedMimeType) {
        selectedMimeType = 'audio/webm'; // Fallback
      }

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });

      this.audioChunks = [];

      // Handle data available
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      console.log('🎙️ Audio recording started:', selectedMimeType);
      return true;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied. Please allow microphone access.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone.');
      }
      throw error;
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.addEventListener('stop', () => {
        // Create blob from chunks
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder.mimeType 
        });

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }

        this.isRecording = false;
        console.log('🎙️ Audio recording stopped. Size:', (audioBlob.size / 1024 / 1024).toFixed(2), 'MB');
        
        resolve({
          blob: audioBlob,
          mimeType: this.mediaRecorder.mimeType,
          size: audioBlob.size
        });
      });

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      state: this.mediaRecorder?.state || 'inactive'
    };
  }

  /**
   * Check if browser supports audio recording
   */
  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }
}

/**
 * Speech Recognition Module
 * Handles real-time transcription
 */
export class SpeechRecognizer {
  constructor(options = {}) {
    this.recognition = null;
    this.isListening = false;
    this.onResult = options.onResult || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.onError = options.onError || (() => {});
    
    this.language = options.language || 'en-GB';
    this.continuous = options.continuous !== false;
    this.interimResults = options.interimResults !== false;
    this.maxAlternatives = options.maxAlternatives || 3;
  }

  /**
   * Initialize speech recognition
   */
  initialize() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = this.maxAlternatives;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        if (result.isFinal) {
          // Choose best alternative
          let bestTranscript = result[0].transcript;
          let bestConfidence = result[0].confidence;

          // Check alternatives for better matches
          for (let j = 1; j < result.length; j++) {
            if (result[j].confidence > bestConfidence) {
              bestTranscript = result[j].transcript;
              bestConfidence = result[j].confidence;
            }
          }

          final += bestTranscript;
        } else {
          interim += result[0].transcript;
        }
      }

      this.onResult({ final: final.trim(), interim: interim.trim() });
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening && this.continuous) {
        // Auto-restart if continuous mode
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 100);
      } else {
        this.onEnd();
      }
    };
  }

  /**
   * Start listening
   */
  start() {
    if (!this.recognition) {
      this.initialize();
    }

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('🎤 Speech recognition started:', this.language);
    } catch (error) {
      if (error.name !== 'InvalidStateError') {
        console.error('Failed to start speech recognition:', error);
        throw error;
      }
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      console.log('🎤 Speech recognition stopped');
    }
  }

  /**
   * Change language
   */
  setLanguage(language) {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Check if browser supports speech recognition
   */
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

/**
 * Audio Playback Helper
 */
export class AudioPlayer {
  constructor(audioBlob) {
    this.audioUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(this.audioUrl);
  }

  play() {
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  getDuration() {
    return this.audio.duration;
  }

  seek(time) {
    this.audio.currentTime = time;
  }

  destroy() {
    this.stop();
    URL.revokeObjectURL(this.audioUrl);
  }

  onEnded(callback) {
    this.audio.addEventListener('ended', callback);
  }

  onTimeUpdate(callback) {
    this.audio.addEventListener('timeupdate', () => {
      callback(this.audio.currentTime, this.audio.duration);
    });
  }
}

/**
 * Check browser capabilities
 */
export function checkAudioSupport() {
  return {
    recording: AudioRecorder.isSupported(),
    speechRecognition: SpeechRecognizer.isSupported(),
    audioContext: !!(window.AudioContext || window.webkitAudioContext)
  };
}

export default {
  AudioRecorder,
  SpeechRecognizer,
  AudioPlayer,
  checkAudioSupport
};
