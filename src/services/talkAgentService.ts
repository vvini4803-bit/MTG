// ===============================================================
// 🤖 MTG TALK AGENT — LIVE GEMINI STREAMING VOICE ASSISTANCE
// Answers within seconds on: Agriculture, Education & Future,
// General Knowledge, History, and Any Type/Kind of Question.
// Dedicated exclusively to the Talk Agent section.
// ===============================================================

const API_KEY_POOL = [
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_3,
].filter(Boolean) as string[];

let keyIndex = 0;
function getApiKey(): string {
  if (API_KEY_POOL.length === 0) return '';
  return API_KEY_POOL[keyIndex % API_KEY_POOL.length];
}

function rotateApiKey() {
  if (API_KEY_POOL.length > 1) {
    keyIndex = (keyIndex + 1) % API_KEY_POOL.length;
  }
}

// Fast Gemini models that respond within seconds
const TALK_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-2.0-flash-exp'
];

export type TalkAgentStatus = 'idle' | 'listening' | 'answering' | 'speaking' | 'error';

export interface TalkMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface TalkAgentCallbacks {
  onStatusChange: (status: TalkAgentStatus) => void;
  onInterimText: (text: string) => void;
  onNewMessage: (message: TalkMessage) => void;
  onError: (errorText: string) => void;
}

const TALK_AGENT_SYSTEM_PROMPT = `You are the "MTG Talk Agent" (ಎಂಟಿಜಿ ಟಾಕ್ ಏಜೆಂಟ್), an intelligent, friendly, and lightning-fast live voice assistant for Muttagundi (MTG) Village and Karnataka.

YOUR EXPERTISE INCLUDES:
1. 🌱 AGRICULTURE: Crop management (pomegranate/ದಾಳಿಂಬೆ, arecanut/ಅಡಿಕೆ, coconut/ತೆಂಗು, onion/ಈರುಳ್ಳಿ, ragi/ರಾಗಿ, cotton/ಹತ್ತಿ, maize), pest/disease diagnosis, organic fertilizers, Jeevamrutha, drip irrigation, APMC market rates, Karnataka & central govt farmer schemes (PM-Kisan, Ganga Kalyana, Raitha Siri, Krishi Bhagya).
2. 🎓 EDUCATION & FUTURE: Educational paths after 10th/PUC/Degree, engineering, medicine, agriculture BSc, competitive exams (KPSC, Police, Banking, FDA, SDA, UPSC), emerging careers in AI, technology, skill development.
3. 🌍 GENERAL KNOWLEDGE: Science, nature, geography, Indian constitution, government functioning, current technology, space, daily facts.
4. 🏛️ HISTORY: Chitradurga Nayakas (Madakari Nayaka, Onake Obavva, Chitradurga Fort), Karnataka & Vijayanagara history, Muttagundi village heritage, Sri Kalleshwara Temple.
5. 💬 ANY TYPE OF QUESTION: Whatever question the user asks of any type or category, answer immediately, accurately, and politely!

VOICE INSTRUCTION:
- Respond in conversational, spoken-friendly language (2-4 sentences for natural audio listening).
- Language:
  * If the user speaks in Kannada (or asks in Kannada), respond in warm, natural Kannada.
  * If the user speaks in English, respond in fluent English.
  * If mixed (Kanglish), respond naturally in Kannada-English.
- Give the answer directly and quickly within seconds!`;

export class TalkAgentService {
  private recognition: any = null;
  private isListeningActive = false;
  private silenceTimer: any = null;
  private accumulatedSpeech = '';
  private conversationHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
  private callbacks: TalkAgentCallbacks;
  private currentStatus: TalkAgentStatus = 'idle';

  constructor(callbacks: TalkAgentCallbacks) {
    this.callbacks = callbacks;
    this.initRecognition();
  }

  private setStatus(status: TalkAgentStatus) {
    this.currentStatus = status;
    this.callbacks.onStatusChange(status);
  }

  public getStatus(): TalkAgentStatus {
    return this.currentStatus;
  }

  private initRecognition() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = 'kn-IN';

      this.recognition.onresult = (event: any) => {
        if (!this.isListeningActive) return;

        // If user speaks while agent is speaking, stop speaking immediately (barge-in)
        if (this.currentStatus === 'speaking') {
          this.stopSpeaking();
          this.setStatus('listening');
        }

        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          this.callbacks.onInterimText(interim.trim());
        }

        if (finalChunk) {
          this.accumulatedSpeech += ' ' + finalChunk.trim();
          this.callbacks.onInterimText(this.accumulatedSpeech.trim());

          // When user pauses for 900ms after speaking, answer within seconds!
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            const query = this.accumulatedSpeech.trim();
            this.accumulatedSpeech = '';
            this.callbacks.onInterimText('');
            if (query) {
              this.answerQuestion(query);
            }
          }, 900);
        }
      };

      this.recognition.onerror = (event: any) => {
        const err = event?.error;
        if (err === 'not-allowed') {
          this.callbacks.onError('Microphone access was denied. Please allow microphone permission in browser.');
          this.setStatus('error');
        } else if (err === 'no-speech' || err === 'network') {
          // Normal timeout on silence: keep alive for continuous experience
          if (this.isListeningActive && this.currentStatus !== 'answering' && this.currentStatus !== 'speaking') {
            setTimeout(() => this.startListeningSafe(), 250);
          }
        }
      };

      this.recognition.onend = () => {
        // Automatically restart listening if still active
        if (this.isListeningActive && this.currentStatus !== 'answering' && this.currentStatus !== 'speaking') {
          setTimeout(() => this.startListeningSafe(), 200);
        }
      };
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }

  private startListeningSafe() {
    if (!this.recognition || !this.isListeningActive) return;
    try {
      this.recognition.start();
    } catch {}
  }

  private stopListeningSafe() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {}
  }

  // -------------------------------------------------------------
  // START TALK AGENT LISTENING
  // -------------------------------------------------------------
  public startListening() {
    this.isListeningActive = true;
    this.setStatus('listening');
    this.startListeningSafe();
  }

  // -------------------------------------------------------------
  // STOP TALK AGENT
  // -------------------------------------------------------------
  public stop() {
    this.isListeningActive = false;
    this.stopSpeaking();
    this.stopListeningSafe();
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.setStatus('idle');
  }

  // -------------------------------------------------------------
  // ANSWER USER QUESTION (Within seconds using Gemini Live Stream)
  // -------------------------------------------------------------
  public async answerQuestion(query: string) {
    if (!query.trim()) return;

    this.stopListeningSafe();
    this.stopSpeaking();
    this.setStatus('answering');

    // Add user question to transcript
    const userMsg: TalkMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.callbacks.onNewMessage(userMsg);

    // Add to multi-turn conversation history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: query.trim() }]
    });

    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    let responseText = '';
    const apiKey = getApiKey();

    for (const model of TALK_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: TALK_AGENT_SYSTEM_PROMPT }] },
            contents: this.conversationHistory,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 500
            }
          })
        });

        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          responseText = data.candidates[0].content.parts[0].text;
          break;
        } else if (data.error) {
          rotateApiKey();
        }
      } catch (err) {
        rotateApiKey();
      }
    }

    if (!responseText) {
      responseText = 'ಕ್ಷಮಿಸಿ, ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಕೇಳಿ (Sorry, please ask your question again).';
    }

    // Add agent response to memory & UI
    this.conversationHistory.push({
      role: 'model',
      parts: [{ text: responseText }]
    });

    const agentMsg: TalkMessage = {
      id: 'a_' + Date.now(),
      sender: 'agent',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.callbacks.onNewMessage(agentMsg);

    // Speak the response lively
    const isKannada = /[\u0C80-\u0CFF]/.test(responseText);
    this.setStatus('speaking');
    this.speakResponse(responseText, isKannada ? 'kn' : 'en', () => {
      // Once speech ends, resume listening immediately for continuous conversation!
      if (this.isListeningActive) {
        this.setStatus('listening');
        this.startListeningSafe();
      } else {
        this.setStatus('idle');
      }
    });
  }

  // -------------------------------------------------------------
  // SPEAK RESPONSE (Barge-in supported)
  // -------------------------------------------------------------
  private speakResponse(text: string, lang: 'kn' | 'en', onDone: () => void) {
    if (!('speechSynthesis' in window)) {
      setTimeout(onDone, 1200);
      return;
    }

    this.stopSpeaking();

    // Clean emojis and markdown formatting for smooth speech readout
    const clean = text
      .replace(/[*#_`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!clean) {
      onDone();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = lang === 'kn' ? 0.95 : 1.0;
    utterance.pitch = 1.0;

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

    utterance.onend = () => onDone();
    utterance.onerror = () => onDone();

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public setLanguage(lang: 'kn' | 'en') {
    if (this.recognition) {
      this.recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    }
  }
}
