// ===============================================================
// 🤖 MTG VILLAGE & FARMER AI TALKING AGENT LIVE
// Gemini AI Live Streaming Talking Agent
// Continuous, Real-Time Bidirectional Voice & Chat Loop
// Natural Kannada & English • Follows All User Instructions
// Private Farmer & Family Records Integration (Authenticated)
// ===============================================================

import { farmerService } from './farmerService';

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-2.0-flash-exp'
];

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'error';

export interface LiveMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
}

export interface LiveCallbacks {
  onStatusChange: (status: LiveStatus) => void;
  onTranscriptUpdate: (message: LiveMessage) => void;
  onInterimTranscript?: (text: string) => void;
  onError: (errorMsg: string) => void;
  onVolumeChange?: (volume: number) => void;
}

const SYSTEM_INSTRUCTION_LIVE_AGENT = `You are the "MTG Village & Farmer AI Live Talking Agent" (ಎಂಟಿಜಿ ಗ್ರಾಮ ಮತ್ತು ರೈತ AI ಲೈವ್ ಟಾಕಿಂಗ್ ಏಜೆಂಟ್).
You are a warm, highly intelligent, respectful, and lively conversational AI assistant speaking directly with farmers and villagers of Muttagundi (MTG) Village, Karnataka.

KEY CONVERSATIONAL BEHAVIORS:
1. CONTINUOUS & LIVELY: You are speaking in an active, continuous live conversation. Give clear, lively, conversational, and direct answers. Keep each spoken turn natural, concise (2-4 sentences for voice), and ask relevant follow-up questions when helpful so the farmer can keep talking.
2. BILINGUAL EXCELLENCE (Kannada & English):
   - If the user speaks in Kannada (e.g. "ದಾಳಿಂಬೆ ಬೆಳೆಗೆ ಯಾವ ಗೊಬ್ಬರ ಹಾಕಬೇಕು?", "ನನ್ನ ಲಾಭ ಎಷ್ಟು?"), respond naturally in warm, authentic rural Kannada (e.g. "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ಖಂಡಿತ...").
   - If the user speaks in English, respond warmly in fluent English.
   - If the user mixes Kannada and English (Kanglish), understand completely and respond in natural Kannada-English.
3. OBEY & FOLLOW ALL USER INSTRUCTIONS:
   - Whatever the user says or asks you to do, follow their instructions faithfully and cooperatively.
   - If they say "explain simpler", "give me spray dosage", "compare 2025 and 2026", "tell me a village story", "remind me what to do tomorrow", or "translate this", follow it immediately and accurately.
4. AGRICULTURE & FARMING KNOWLEDGE:
   - Provide practical guidance for crops: Pomegranate (ದಾಳಿಂಬೆ), Arecanut (ಅಡಿಕೆ), Coconut (ತೆಂಗು), Onion (ಈರುಳ್ಳಿ), Ragi (ರಾಗಿ), Maize (ಮೆಕ್ಕೆಜೋಳ), Cotton (ಹತ್ತಿ), Groundnut (ಕಡಲೆಕಾಯಿ), Flowers, Vegetables.
   - Pests & diseases: Bacterial blight (ದುಂಡಾಣು ರೋಗ), fruit borer, wilt, yellow mosaic.
   - Fertilizer dosages: DAP, Urea, Potash, organic compost, Jeevamrutha, neem cake.
   - Irrigation: Drip irrigation schedules, water management, borewell maintenance.
   - Government farmer welfare schemes: PM-Kisan (₹6,000/year), Raitha Siri, Krishi Bhagya, Ganga Kalyana borewell scheme, Yashasvini, Crop Insurance (PMFBY).
   - Karnataka welfare guarantees: Gruha Lakshmi (₹2,000/month), Gruha Jyothi (free electricity up to 200 units), Anna Bhagya (free rice/cash), Yuva Nidhi, Shakti free bus travel.
5. VILLAGE KNOWLEDGE:
   - MTG Village: Muttagundi, Hosadurga Taluk, Chitradurga District, Karnataka (Pincode: 577533).
   - Local landmarks: Sri Kalleshwara Temple (ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಾಲಯ), ancient shrines, Gram Panchayat, village school, Anganwadi.
6. PRIVATE FARMER & FAMILY RECORDS (for authenticated users):
   - When private data context is provided, use it accurately: crops, income, farm expenses, family members, education fees, medical costs, loans, savings, and net profit/loss.
   - Never invent missing financial numbers. If not in records, state clearly.
   - Protect privacy: Only reference the authorized user's records.

Keep your tone welcoming, polite, practical, and inspiring for rural farming families!`;

export class GeminiLiveSession {
  private status: LiveStatus = 'idle';
  private isLiveActive: boolean = false;
  private isPaused: boolean = false;
  private isMuted: boolean = false;
  private currentUserId: string = '';
  private callbacks: LiveCallbacks;

  // Audio / Media
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  // Speech Recognition (Continuous Loop)
  private recognition: any = null;
  private silenceTimer: any = null;
  private accumulatedSpeech: string = '';
  private isSynthesisSpeaking: boolean = false;

  // Multi-Turn Conversation Memory
  private conversationHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

  constructor(callbacks: LiveCallbacks) {
    this.callbacks = callbacks;
  }

  private setStatus(newStatus: LiveStatus) {
    this.status = newStatus;
    this.callbacks.onStatusChange(newStatus);
  }

  public getStatus(): LiveStatus {
    return this.status;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  // -------------------------------------------------------------
  // START CONTINUOUS LIVE SESSION
  // -------------------------------------------------------------
  public async startLive(userId?: string): Promise<void> {
    this.currentUserId = userId || '';
    this.isLiveActive = true;
    this.isPaused = false;
    this.isMuted = false;
    this.setStatus('connecting');
    this.conversationHistory = [];

    // 1. Request Microphone & Start Audio Visualizer
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          this.analyserNode = this.audioContext.createAnalyser();
          this.analyserNode.fftSize = 256;
          source.connect(this.analyserNode);
          this.startVolumeMeter();
        }
      }
    } catch (micErr: any) {
      console.warn('Microphone stream error (falling back to speech recognition):', micErr);
    }

    // 2. Setup Continuous Speech Recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.initSpeechRecognition(SpeechRec);
    } else {
      this.callbacks.onError('Your browser does not support Speech Recognition. Please use Chrome, Edge, or type in the box below.');
    }

    // 3. Welcome Message & Initial Spoken Greeting
    const welcomeKn = 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಎಂಟಿಜಿ AI ಲೈವ್ ಟಾಕಿಂಗ್ ಏಜೆಂಟ್. ಕೃಷಿ, ಬೆಳೆಗಳು, ಹವಾಮಾನ ಅಥವಾ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಲೆಕ್ಕಾಚಾರದ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ, ನಾನು ನಿರಂತರವಾಗಿ ಉತ್ತರಿಸಲು ಸಿದ್ಧನಿದ್ದೇನೆ. ಮಾತನಾಡಿ!';
    const welcomeEn = 'Hello! I am your MTG Village & Farmer AI Live Talking Agent. Ask me anything about crops, farming, market prices, or your personal records. I am ready to continuously answer all your questions. Please speak!';

    this.callbacks.onTranscriptUpdate({
      id: 'welcome_' + Date.now(),
      sender: 'system',
      text: `🤖 🔴 **AI Talking Agent Live Connected**\n${welcomeKn}\n\n_${welcomeEn}_`,
      timestamp: new Date().toLocaleTimeString()
    });

    this.setStatus('listening');

    // Speak initial warm greeting
    this.speakLively(welcomeKn, 'kn', () => {
      // Once welcome greeting finishes, start listening immediately for user question
      if (this.isLiveActive && !this.isPaused) {
        this.setStatus('listening');
        this.startRecognitionSafe();
      }
    });
  }

  // -------------------------------------------------------------
  // CONTINUOUS SPEECH RECOGNITION SETUP
  // -------------------------------------------------------------
  private initSpeechRecognition(SpeechRec: any) {
    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      // Bilingual detection default
      this.recognition.lang = 'kn-IN';

      this.recognition.onstart = () => {
        if (!this.isSynthesisSpeaking && this.isLiveActive && !this.isPaused) {
          this.setStatus('listening');
        }
      };

      this.recognition.onresult = (event: any) => {
        if (this.isPaused || !this.isLiveActive) return;

        // If user speaks while AI is talking, interrupt AI immediately (Barge-in)!
        if (this.isSynthesisSpeaking) {
          this.interruptPlayback();
          this.setStatus('listening');
        }

        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        if (interimText && this.callbacks.onInterimTranscript) {
          this.callbacks.onInterimTranscript(interimText.trim());
        }

        if (finalText) {
          this.accumulatedSpeech += ' ' + finalText.trim();
          if (this.callbacks.onInterimTranscript) {
            this.callbacks.onInterimTranscript(this.accumulatedSpeech.trim());
          }

          // Debounce user pause: after 1.1 seconds of silence, process question
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            const queryToProcess = this.accumulatedSpeech.trim();
            this.accumulatedSpeech = '';
            if (this.callbacks.onInterimTranscript) {
              this.callbacks.onInterimTranscript('');
            }
            if (queryToProcess) {
              this.handleUserQuestion(queryToProcess);
            }
          }, 1100);
        }
      };

      this.recognition.onerror = (event: any) => {
        const error = event?.error;
        console.warn('[GeminiLiveAgent] Speech Recognition Error:', error);
        if (error === 'not-allowed') {
          this.callbacks.onError('Microphone permission denied. Please allow microphone access in your browser settings.');
          this.setStatus('error');
        } else if (error === 'no-speech' || error === 'network') {
          // Normal silence or timeout - auto restart silently to maintain continuous loop!
          if (this.isLiveActive && !this.isPaused && !this.isSynthesisSpeaking) {
            setTimeout(() => this.startRecognitionSafe(), 300);
          }
        }
      };

      this.recognition.onend = () => {
        // PERPETUAL LISTENING: If browser ends recognition due to silence, auto-restart immediately!
        if (this.isLiveActive && !this.isPaused && !this.isSynthesisSpeaking) {
          setTimeout(() => this.startRecognitionSafe(), 200);
        }
      };
    } catch (e) {
      console.warn('Speech recognition init error:', e);
    }
  }

  private startRecognitionSafe() {
    if (!this.recognition || !this.isLiveActive || this.isPaused || this.isSynthesisSpeaking) return;
    try {
      this.recognition.start();
    } catch {
      // Already running or starting
    }
  }

  private stopRecognitionSafe() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {}
  }

  // -------------------------------------------------------------
  // CONTINUOUS VOLUME METER FOR LIVE VISUALIZER
  // -------------------------------------------------------------
  private startVolumeMeter() {
    if (!this.analyserNode) return;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const updateVolume = () => {
      if (!this.isLiveActive) return;
      if (this.analyserNode && !this.isMuted && !this.isPaused) {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        if (this.callbacks.onVolumeChange) {
          this.callbacks.onVolumeChange(normalized);
        }
      } else {
        if (this.callbacks.onVolumeChange) {
          this.callbacks.onVolumeChange(0);
        }
      }
      this.animFrameId = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }

  // -------------------------------------------------------------
  // PROCESS USER QUESTION (Continuous Turn)
  // -------------------------------------------------------------
  public async handleUserQuestion(text: string) {
    if (!text.trim() || !this.isLiveActive) return;

    // Stop listening while generating and speaking
    this.stopRecognitionSafe();
    this.setStatus('thinking');

    // Add user message to UI transcript
    this.callbacks.onTranscriptUpdate({
      id: 'user_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString()
    });

    // 1. Gather relevant private records if user is logged in
    let privateContext = '';
    if (this.currentUserId) {
      try {
        const qLower = text.toLowerCase();
        if (qLower.includes('crop') || qLower.includes('ಬೆಳೆ') || qLower.includes('ದಾಳಿಂಬೆ') || qLower.includes('pomegranate') || qLower.includes('ಉತ್ಪಾದನೆ')) {
          const crops = await farmerService.getCropSummary(this.currentUserId);
          privateContext += `\nPrivate User Crops: ${JSON.stringify(crops)}`;
        }
        if (qLower.includes('income') || qLower.includes('ಆದಾಯ') || qLower.includes('profit') || qLower.includes('ಲಾಭ') || qLower.includes('ನಷ್ಟ') || qLower.includes('loss')) {
          const yearSummary = await farmerService.getCurrentYearSummary(this.currentUserId);
          privateContext += `\nPrivate User Year Summary: ${JSON.stringify(yearSummary)}`;
        }
        if (qLower.includes('family') || qLower.includes('ಕುಟುಂಬ') || qLower.includes('ಮಗ') || qLower.includes('ಮಗಳು') || qLower.includes('son') || qLower.includes('daughter')) {
          const fam = await farmerService.getFamilyDetails(this.currentUserId);
          privateContext += `\nPrivate Family Members: ${JSON.stringify(fam)}`;
        }
        if (qLower.includes('education') || qLower.includes('ಶಿಕ್ಷಣ') || qLower.includes('fee') || qLower.includes('ಫೀಸ್') || qLower.includes('ಶಾಲೆ') || qLower.includes('school') || qLower.includes('college')) {
          const edu = await farmerService.getEducationExpenses(this.currentUserId);
          privateContext += `\nPrivate Education Expenses: ${JSON.stringify(edu)}`;
        }
        if (qLower.includes('loan') || qLower.includes('ಸಾಲ') || qLower.includes('ಬ್ಯಾಂಕ್') || qLower.includes('bank') || qLower.includes('interest') || qLower.includes('ಬಡ್ಡಿ')) {
          const loans = await farmerService.getLoanSummary(this.currentUserId);
          privateContext += `\nPrivate Loans: ${JSON.stringify(loans)}`;
        }
        if (qLower.includes('expense') || qLower.includes('ಖರ್ಚು') || qLower.includes('ಔಷಧ') || qLower.includes('ಗೊಬ್ಬರ')) {
          const exp = await farmerService.getExpenseSummary(this.currentUserId);
          privateContext += `\nPrivate Expenses: ${JSON.stringify(exp)}`;
        }
        if (qLower.includes('compare') || qLower.includes('ಹೋಲಿಕೆ') || (qLower.includes('2025') && qLower.includes('2026'))) {
          const cmp = await farmerService.compareYears(this.currentUserId, 2025, 2026);
          privateContext += `\nPrivate Year Comparison (2025 vs 2026): ${JSON.stringify(cmp)}`;
        }
        if (!privateContext) {
          const generalSummary = await farmerService.getCurrentYearSummary(this.currentUserId);
          privateContext = `\nPrivate User Farmer Snapshot (2026): ${JSON.stringify(generalSummary)}`;
        }
      } catch (err) {
        console.warn('Error fetching private context:', err);
      }
    }

    // 2. Call Gemini AI with Streaming Conversation
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY_2 || import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('Gemini API key is not configured.');
      }

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: privateContext ? `${text}\n\n[Authorized Private Data Context for Authenticated User]:\n${privateContext}` : text }]
      });

      // Keep recent 12 conversation turns to prevent token bloat
      if (this.conversationHistory.length > 12) {
        this.conversationHistory = this.conversationHistory.slice(-12);
      }

      let replyText = '';
      for (const model of GEMINI_MODELS) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION_LIVE_AGENT }] },
              contents: this.conversationHistory,
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 600
              }
            })
          });

          const data = await res.json();
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            replyText = data.candidates[0].content.parts[0].text;
            break;
          }
        } catch (modelErr) {
          console.warn(`Model ${model} attempt failed:`, modelErr);
        }
      }

      if (!replyText) {
        replyText = 'ಕ್ಷಮಿಸಿ, ಮಾಹಿತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಶ್ನೆ ಕೇಳಿ (Sorry, could not process information. Please ask again).';
      }

      // Store model response in memory
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: replyText }]
      });

      // Show transcript message
      this.callbacks.onTranscriptUpdate({
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString()
      });

      // 3. Speak the Answer in Natural Kannada/English Voice
      const hasKannada = /[\u0C80-\u0CFF]/.test(replyText);
      const lang = hasKannada ? 'kn' : 'en';

      this.setStatus('speaking');
      this.speakLively(replyText, lang, () => {
        // CONTINUOUS CONVERSATION LOOP:
        // As soon as the agent finishes speaking, resume listening immediately!
        // No stop until user clicks Stop!
        if (this.isLiveActive && !this.isPaused) {
          this.setStatus('listening');
          this.startRecognitionSafe();
        }
      });
    } catch (err: any) {
      console.error('Gemini Live Query Error:', err);
      this.callbacks.onError(err.message || 'Error communicating with Gemini AI.');
      if (this.isLiveActive && !this.isPaused) {
        this.setStatus('listening');
        this.startRecognitionSafe();
      }
    }
  }

  // -------------------------------------------------------------
  // LIVELY SPOKEN AUDIO WITH BARGE-IN
  // -------------------------------------------------------------
  private speakLively(text: string, lang: 'kn' | 'en', onComplete: () => void) {
    if (!('speechSynthesis' in window) || this.isMuted) {
      setTimeout(onComplete, 1200);
      return;
    }

    this.interruptPlayback(); // Stop any pending speech
    this.isSynthesisSpeaking = true;

    // Clean formatting characters, markdown symbols, and emojis for smooth voice
    const cleanSpeech = text
      .replace(/[*#_`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!cleanSpeech) {
      this.isSynthesisSpeaking = false;
      onComplete();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = lang === 'kn' ? 0.95 : 1.0;
    utterance.pitch = 1.0;

    // Choose preferred voice if available
    const voices = window.speechSynthesis.getVoices();
    if (lang === 'kn') {
      const knVoice = voices.find(
        (v) => v.lang === 'kn-IN' || v.lang.startsWith('kn') || v.name.toLowerCase().includes('kannada')
      );
      if (knVoice) utterance.voice = knVoice;
    } else {
      const enVoice = voices.find(
        (v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('natural')
      );
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => {
      this.isSynthesisSpeaking = false;
      onComplete();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSynthesisSpeaking = false;
      onComplete();
    };

    window.speechSynthesis.speak(utterance);
  }

  // -------------------------------------------------------------
  // CONTROLS & INTERRUPTIONS
  // -------------------------------------------------------------
  public interruptPlayback() {
    this.isSynthesisSpeaking = false;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.interruptPlayback();
    }
    return this.isMuted;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.interruptPlayback();
      this.stopRecognitionSafe();
      this.setStatus('paused');
    } else {
      this.setStatus('listening');
      this.startRecognitionSafe();
    }
    return this.isPaused;
  }

  // Text message query sent by user
  public async sendTextMessage(text: string) {
    if (!text.trim()) return;
    await this.handleUserQuestion(text);
  }

  // -------------------------------------------------------------
  // END LIVE SESSION (User stopped)
  // -------------------------------------------------------------
  public endLive() {
    this.isLiveActive = false;
    this.interruptPlayback();
    this.stopRecognitionSafe();

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    this.setStatus('idle');
    this.callbacks.onTranscriptUpdate({
      id: 'end_' + Date.now(),
      sender: 'system',
      text: '🛑 **Live session ended.** Tap "Start Live" anytime to talk again.',
      timestamp: new Date().toLocaleTimeString()
    });
  }
}
