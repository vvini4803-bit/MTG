// ===============================================================
// 🤖 MTG FARMER AI LIVE — GEMINI MULTIMODAL LIVE SERVICE
// Official Stateful WebSocket Bidirectional Audio/Text Connection
// Controlled Tool Execution on Authenticated User Data Only
// ===============================================================

import { farmerService } from './farmerService';

const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
const GEMINI_LIVE_MODEL = 'models/gemini-2.0-flash-exp';

// The system prompt strictly enforcing user privacy, Kannada + English, and farmer assistance
const GEMINI_FARMER_SYSTEM_INSTRUCTION = `You are MTG Farmer AI, a private personal farming and family assistant for Muttagundi (MTG) Village.
You are assisting only the currently authenticated user.
You may use only authorized information belonging to that user.
Private information includes farming records, income, expenses, family information, education expenses, medical expenses, loans, savings and other personal records.
Never access, request, reveal or infer another user's private data.
Never expose private information publicly.
Use only data returned by authorized application tools.
Never invent missing financial information.
If information is unavailable, clearly say that it is unavailable.
When calculating financial information, calculate accurately.
Support Kannada, English and Kannada-English mixed conversation.
If the user speaks in Kannada (e.g., "ಈ ವರ್ಷ ನನ್ನ profit ಎಷ್ಟು?"), respond naturally in Kannada with clear numbers and currency in ₹ Rupees.
If the user speaks in English, respond in English.
If mixed, respond warmly in natural Kannada-English.
Keep responses simple, polite, concise, and highly useful for farmers.`;

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
  onError: (errorMsg: string) => void;
  onVolumeChange?: (volume: number) => void;
}

// Convert Float32Array to 16-bit linear PCM base64 string
function floatTo16BitPCMBase64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // little-endian
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 PCM (24kHz 16-bit little endian) to AudioBuffer
function pcm24kToAudioBuffer(base64PCM: string, audioCtx: AudioContext): AudioBuffer {
  const binary = atob(base64PCM);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const audioBuffer = audioCtx.createBuffer(1, int16.length, 24000);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < int16.length; i++) {
    channelData[i] = int16[i] / 32768.0;
  }
  return audioBuffer;
}

export class GeminiLiveSession {
  private socket: WebSocket | null = null;
  private audioContextInput: AudioContext | null = null;
  private audioContextOutput: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isMuted: boolean = false;
  private isPaused: boolean = false;
  private status: LiveStatus = 'idle';
  private currentUserId: string = '';
  private callbacks: LiveCallbacks;
  private nextPlayTime: number = 0;
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private fallbackMode: boolean = false;

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

  // -------------------------------------------------------------
  // START LIVE SESSION
  // -------------------------------------------------------------
  public async startLive(userId: string): Promise<void> {
    if (!userId) {
      this.callbacks.onError('Authentication required: Sign in to open your private MTG Farmer AI Live session.');
      return;
    }
    this.currentUserId = userId;
    this.setStatus('connecting');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY_2 || import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      this.callbacks.onError('Gemini API key is not configured.');
      this.setStatus('error');
      return;
    }

    // 1. Initialize Microphones & Audio Input
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      this.callbacks.onError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : 'Could not access microphone.'
      );
      this.setStatus('error');
      return;
    }

    // 2. Setup AudioContexts
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContextInput = new AudioCtx({ sampleRate: 16000 });
      this.audioContextOutput = new AudioCtx({ sampleRate: 24000 });
      this.nextPlayTime = this.audioContextOutput.currentTime;

      this.sourceNode = this.audioContextInput.createMediaStreamSource(this.mediaStream);
      // BufferSize 2048 at 16000Hz = ~128ms audio chunk
      this.scriptProcessor = this.audioContextInput.createScriptProcessor(2048, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isMuted || this.isPaused || this.status === 'speaking' || this.status === 'thinking') {
          return;
        }
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate volume meter for UI animation
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        if (this.callbacks.onVolumeChange) {
          this.callbacks.onVolumeChange(Math.min(1, rms * 5));
        }

        // Send PCM chunks to Gemini WebSocket
        if (this.socket && this.socket.readyState === WebSocket.OPEN && !this.fallbackMode) {
          const base64PCM = floatTo16BitPCMBase64(inputData);
          const payload = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64PCM
                }
              ]
            }
          };
          try {
            this.socket.send(JSON.stringify(payload));
          } catch (sendErr) {
            console.warn('Live audio send error:', sendErr);
          }
        }
      };

      this.sourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContextInput.destination);
    } catch (e: any) {
      console.warn('AudioContext initialization error:', e);
    }

    // 3. Connect to Official Gemini Multimodal Live WebSocket
    try {
      const wsUrl = `${GEMINI_LIVE_WS_URL}?key=${apiKey}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.info('[GeminiLive] WebSocket connected. Sending setup message...');
        this.sendSetupMessage();
        this.setStatus('listening');
        this.callbacks.onTranscriptUpdate({
          id: Date.now().toString(),
          sender: 'system',
          text: '🔵 Live connection established with Google Gemini AI. Speak now in Kannada or English...',
          timestamp: new Date().toLocaleTimeString()
        });
      };

      this.socket.onmessage = async (event) => {
        try {
          let data: any;
          if (typeof event.data === 'string') {
            data = JSON.parse(event.data);
          } else if (event.data instanceof Blob) {
            const text = await event.data.text();
            data = JSON.parse(text);
          }
          if (data) {
            await this.handleServerMessage(data);
          }
        } catch (err) {
          console.warn('Live message parse error:', err);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[GeminiLive] WebSocket error, switching to interactive live fallback', err);
        this.enableInteractiveFallback();
      };

      this.socket.onclose = (event) => {
        console.info('[GeminiLive] WebSocket closed:', event.code, event.reason);
        if (this.status !== 'idle' && !this.fallbackMode) {
          this.enableInteractiveFallback();
        }
      };
    } catch (e: any) {
      console.warn('WebSocket connection attempt failed, enabling interactive live mode:', e);
      this.enableInteractiveFallback();
    }
  }

  // -------------------------------------------------------------
  // SEND SETUP WITH CONTROLLED TOOL DEFINITIONS
  // -------------------------------------------------------------
  private sendSetupMessage() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const setupPayload = {
      setup: {
        model: GEMINI_LIVE_MODEL,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede'
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: GEMINI_FARMER_SYSTEM_INSTRUCTION }]
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: 'getCurrentYearSummary',
                description: 'Get total income, crop expenses, family expenses, education expenses, medical, loan payments and net profit/loss for the current year (2026).',
                parameters: { type: 'OBJECT', properties: {} }
              },
              {
                name: 'getCropSummary',
                description: 'Get details about crops grown, yields, expenses and profit/loss. Optionally for a specific crop name like Pomegranate, Ragi, Arecanut.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    cropName: { type: 'STRING', description: 'Name of the crop e.g. Pomegranate, ದಾಳಿಂಬೆ, Ragi' }
                  }
                }
              },
              {
                name: 'getYearSummary',
                description: 'Get financial summary, income, expenses and profit/loss for any specific year (e.g. 2025, 2024).',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year: { type: 'INTEGER', description: 'The year to inspect e.g. 2025' }
                  },
                  required: ['year']
                }
              },
              {
                name: 'getIncomeSummary',
                description: 'Get breakdown of all income sources for a given year.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year: { type: 'INTEGER', description: 'Year e.g. 2026' }
                  }
                }
              },
              {
                name: 'getExpenseSummary',
                description: 'Get breakdown of where money was spent (farming, family, education, medical, loans, etc.).',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year: { type: 'INTEGER', description: 'Year e.g. 2026' }
                  }
                }
              },
              {
                name: 'getFamilyDetails',
                description: 'Get private list of family members, relationships, occupations and education.',
                parameters: { type: 'OBJECT', properties: {} }
              },
              {
                name: 'getFamilyExpenses',
                description: 'Get household family expenses (food, clothing, travel, festivals, emergency, etc.).',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year: { type: 'INTEGER', description: 'Year e.g. 2026' }
                  }
                }
              },
              {
                name: 'getEducationExpenses',
                description: 'Get education fees, school/college expenses, hostel and books for family students.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year: { type: 'INTEGER', description: 'Year e.g. 2026' }
                  }
                }
              },
              {
                name: 'getMedicalExpenses',
                description: 'Get medical, hospital and clinic expenses for family members.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year: { type: 'INTEGER', description: 'Year e.g. 2026' }
                  }
                }
              },
              {
                name: 'getLoanSummary',
                description: 'Get summary of all loans, bank/private lenders, remaining balance, interest rate and monthly payments.',
                parameters: { type: 'OBJECT', properties: {} }
              },
              {
                name: 'getSavingsSummary',
                description: 'Get savings breakdown (Bank, Cash, Post Office).',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year: { type: 'INTEGER', description: 'Year e.g. 2026' }
                  }
                }
              },
              {
                name: 'compareYears',
                description: 'Compare profit/loss and income between two years (e.g. 2025 vs 2026).',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    year1: { type: 'INTEGER', description: 'First year e.g. 2025' },
                    year2: { type: 'INTEGER', description: 'Second year e.g. 2026' }
                  },
                  required: ['year1', 'year2']
                }
              }
            ]
          }
        ]
      }
    };

    this.socket.send(JSON.stringify(setupPayload));
  }

  // -------------------------------------------------------------
  // SERVER MESSAGE HANDLER
  // -------------------------------------------------------------
  private async handleServerMessage(data: any) {
    // 1. Tool Call Execution (Strictly on current authenticated user)
    if (data.toolCall && data.toolCall.functionCalls) {
      this.setStatus('thinking');
      const responses: any[] = [];

      for (const call of data.toolCall.functionCalls) {
        const name = call.name;
        const args = call.args || {};
        let result: any = null;

        try {
          if (name === 'getCurrentYearSummary') {
            result = await farmerService.getCurrentYearSummary(this.currentUserId);
          } else if (name === 'getCropSummary') {
            result = await farmerService.getCropSummary(this.currentUserId, args.cropName, args.year || 2026);
          } else if (name === 'getYearSummary') {
            result = await farmerService.getYearSummary(this.currentUserId, args.year || 2026);
          } else if (name === 'getIncomeSummary') {
            result = await farmerService.getIncomeSummary(this.currentUserId, args.year || 2026);
          } else if (name === 'getExpenseSummary') {
            result = await farmerService.getExpenseSummary(this.currentUserId, args.year || 2026);
          } else if (name === 'getFamilyDetails') {
            result = await farmerService.getFamilyDetails(this.currentUserId, args.year || 2026);
          } else if (name === 'getFamilyExpenses') {
            result = await farmerService.getFamilyExpenses(this.currentUserId, args.year || 2026);
          } else if (name === 'getEducationExpenses') {
            result = await farmerService.getEducationExpenses(this.currentUserId, args.year || 2026);
          } else if (name === 'getMedicalExpenses') {
            result = await farmerService.getMedicalExpenses(this.currentUserId, args.year || 2026);
          } else if (name === 'getLoanSummary') {
            result = await farmerService.getLoanSummary(this.currentUserId, args.year || 2026);
          } else if (name === 'getSavingsSummary') {
            result = await farmerService.getSavingsSummary(this.currentUserId, args.year || 2026);
          } else if (name === 'compareYears') {
            result = await farmerService.compareYears(this.currentUserId, args.year1 || 2025, args.year2 || 2026);
          } else {
            result = { error: `Function ${name} is not recognized.` };
          }
        } catch (toolErr: any) {
          result = { error: toolErr.message || 'Error querying private database' };
        }

        responses.push({
          response: { output: result },
          id: call.id
        });
      }

      // Send tool response back to Gemini Live
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            toolResponse: {
              functionResponses: responses
            }
          })
        );
      }
      return;
    }

    // 2. Server Content (Audio / Text Stream)
    if (data.serverContent) {
      // Barge-in / Interruption handling:
      if (data.serverContent.interrupted) {
        this.interruptPlayback();
        this.setStatus('listening');
        return;
      }

      const modelTurn = data.serverContent.modelTurn;
      if (modelTurn && modelTurn.parts) {
        for (const part of modelTurn.parts) {
          // Play real-time audio chunk
          if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
            this.setStatus('speaking');
            this.queueAudioPCM(part.inlineData.data);
          }

          // Real-time transcript text
          if (part.text) {
            this.callbacks.onTranscriptUpdate({
              id: Date.now().toString(),
              sender: 'ai',
              text: part.text,
              timestamp: new Date().toLocaleTimeString()
            });
          }
        }
      }

      if (data.serverContent.turnComplete) {
        // AI finished current turn
        setTimeout(() => {
          if (this.status === 'speaking' || this.status === 'thinking') {
            this.setStatus('listening');
          }
        }, 500);
      }
    }
  }

  // -------------------------------------------------------------
  // REAL-TIME AUDIO PLAYBACK QUEUE
  // -------------------------------------------------------------
  private queueAudioPCM(base64PCM: string) {
    if (!this.audioContextOutput) return;

    try {
      const buffer = pcm24kToAudioBuffer(base64PCM, this.audioContextOutput);
      const source = this.audioContextOutput.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContextOutput.destination);

      const currentTime = this.audioContextOutput.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += buffer.duration;
      this.activeAudioSources.push(source);

      source.onended = () => {
        const idx = this.activeAudioSources.indexOf(source);
        if (idx >= 0) this.activeAudioSources.splice(idx, 1);
        if (this.activeAudioSources.length === 0 && this.status === 'speaking') {
          this.setStatus('listening');
        }
      };
    } catch (e) {
      console.warn('Error queuing audio PCM buffer:', e);
    }
  }

  // -------------------------------------------------------------
  // BARGE-IN / INTERRUPTION SUPPORT
  // -------------------------------------------------------------
  public interruptPlayback() {
    this.activeAudioSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    this.activeAudioSources = [];
    if (this.audioContextOutput) {
      this.nextPlayTime = this.audioContextOutput.currentTime;
    }
  }

  // -------------------------------------------------------------
  // CONTROLS (Mute, Pause, Resume, End)
  // -------------------------------------------------------------
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
      this.setStatus('paused');
    } else {
      this.setStatus('listening');
    }
    return this.isPaused;
  }

  public endLive() {
    this.interruptPlayback();

    // Close WebSocket
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }

    // Stop MediaStream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Disconnect audio processors
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    // Close AudioContexts
    if (this.audioContextInput && this.audioContextInput.state !== 'closed') {
      try {
        this.audioContextInput.close();
      } catch {}
      this.audioContextInput = null;
    }
    if (this.audioContextOutput && this.audioContextOutput.state !== 'closed') {
      try {
        this.audioContextOutput.close();
      } catch {}
      this.audioContextOutput = null;
    }

    this.setStatus('idle');
    this.callbacks.onTranscriptUpdate({
      id: Date.now().toString(),
      sender: 'system',
      text: '🛑 Live session ended.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // -------------------------------------------------------------
  // FALLBACK INTERACTIVE LIVE MODE
  // If WebSocket is blocked by ISP / browser policy, seamless fallback
  // -------------------------------------------------------------
  private enableInteractiveFallback() {
    this.fallbackMode = true;
    this.setStatus('listening');
    this.callbacks.onTranscriptUpdate({
      id: Date.now().toString(),
      sender: 'system',
      text: '🎙️ Live conversational voice mode ready. Ask any question in Kannada or English below!',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // Text message query into live session
  public async sendTextMessage(text: string) {
    if (!text.trim()) return;

    this.callbacks.onTranscriptUpdate({
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN && !this.fallbackMode) {
      const payload = {
        realtimeInput: {
          parts: [{ text }]
        }
      };
      this.setStatus('thinking');
      this.socket.send(JSON.stringify(payload));
      return;
    }

    // Interactive Fallback with Gemini REST API + Tool Calling
    this.setStatus('thinking');
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY_2 || import.meta.env.VITE_GEMINI_API_KEY || '';
      const promptLower = text.toLowerCase();

      // Resolve relevant tools locally on current user's data
      let contextData = '';
      if (promptLower.includes('crop') || promptLower.includes('ಬೆಳೆ') || promptLower.includes('ದಾಳಿಂಬೆ') || promptLower.includes('pomegranate')) {
        const crops = await farmerService.getCropSummary(this.currentUserId);
        contextData += `Crop Summary: ${JSON.stringify(crops)}\n`;
      }
      if (promptLower.includes('income') || promptLower.includes('ಆದಾಯ') || promptLower.includes('profit') || promptLower.includes('ಲಾಭ')) {
        const yearSummary = await farmerService.getCurrentYearSummary(this.currentUserId);
        contextData += `Year Summary: ${JSON.stringify(yearSummary)}\n`;
      }
      if (promptLower.includes('family') || promptLower.includes('ಕುಟುಂಬ') || promptLower.includes('ಮಗ') || promptLower.includes('son') || promptLower.includes('daughter')) {
        const fam = await farmerService.getFamilyDetails(this.currentUserId);
        contextData += `Family Members: ${JSON.stringify(fam)}\n`;
      }
      if (promptLower.includes('education') || promptLower.includes('ಶಿಕ್ಷಣ') || promptLower.includes('ಶಾಲ') || promptLower.includes('fee')) {
        const edu = await farmerService.getEducationExpenses(this.currentUserId);
        contextData += `Education Expenses: ${JSON.stringify(edu)}\n`;
      }
      if (promptLower.includes('loan') || promptLower.includes('ಸಾಲ') || promptLower.includes('ಬ್ಯಾಂಕ್') || promptLower.includes('bank')) {
        const loans = await farmerService.getLoanSummary(this.currentUserId);
        contextData += `Loan Summary: ${JSON.stringify(loans)}\n`;
      }
      if (promptLower.includes('expense') || promptLower.includes('ಖರ್ಚು')) {
        const exp = await farmerService.getExpenseSummary(this.currentUserId);
        contextData += `Expense Summary: ${JSON.stringify(exp)}\n`;
      }
      if (!contextData) {
        const general = await farmerService.getCurrentYearSummary(this.currentUserId);
        contextData = `General Summary: ${JSON.stringify(general)}`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: GEMINI_FARMER_SYSTEM_INSTRUCTION }] },
            contents: [
              {
                role: 'user',
                parts: [{ text: `User Question: "${text}"\n\nAuthorized Private Data:\n${contextData}` }]
              }
            ]
          })
        }
      );

      const json = await response.json();
      const reply = json.candidates?.[0]?.content?.parts?.[0]?.text || 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ (Information not available).';

      this.setStatus('speaking');
      this.callbacks.onTranscriptUpdate({
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString()
      });

      // Browser TTS audio for live reply
      if ('speechSynthesis' in window && !this.isMuted) {
        const utterance = new SpeechSynthesisUtterance(reply.replace(/[*#_`]/g, ''));
        // Try Kannada if Kannada text detected
        const hasKannada = /[\u0C80-\u0CFF]/.test(reply);
        utterance.lang = hasKannada ? 'kn-IN' : 'en-IN';
        utterance.rate = 1.0;
        utterance.onend = () => this.setStatus('listening');
        utterance.onerror = () => this.setStatus('listening');
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => this.setStatus('listening'), 1200);
      }
    } catch (e: any) {
      console.warn('Fallback error:', e);
      this.setStatus('listening');
      this.callbacks.onTranscriptUpdate({
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ (Sorry, unable to connect to Gemini at this moment).',
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }
}
