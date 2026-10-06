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

// Ultra-fast Gemini models that respond within seconds with high availability
const TALK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.5-flash'
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

VOICE & COMPLETENESS INSTRUCTIONS:
- CRITICAL: Provide a COMPLETE, well-formed answer (2 to 4 clear, spoken-friendly sentences).
- EVERY sentence MUST be completely finished with full-stop punctuation. NEVER stop or leave a sentence cut off or halfway!
- Language:
  * If the user speaks in Kannada (or asks in Kannada), respond in warm, natural Kannada.
  * If the user speaks in English, respond in fluent English.
  * If mixed (Kanglish), respond naturally in Kannada-English.
- Give the answer directly and quickly within seconds!`;

/**
 * Removes duplicate repetitions caused by mobile Web Speech API quirks
 * (e.g. repeated words like "ಅಲ್ಲ ಅಲ್ಲ ಅಲ್ಲ ಅಲ್ಲ" -> "ಅಲ್ಲ",
 * or repeated multi-word loops like "ಇಂಡಿಯಾಸ್ ಫಸ್ಟ್ ಇಂಡಿಯಾಸ್ ಫಸ್ಟ್" -> "ಇಂಡಿಯಾಸ್ ಫಸ್ಟ್").
 */
function cleanRepeatedPhrases(rawText: string): string {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  // 1. Collapse consecutive identical single words
  const words = cleaned.split(/\s+/);
  const dedupedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (
      dedupedWords.length > 0 &&
      dedupedWords[dedupedWords.length - 1].toLowerCase() === word.toLowerCase()
    ) {
      continue;
    }
    dedupedWords.push(word);
  }
  cleaned = dedupedWords.join(' ');

  // 2. Collapse consecutive repeating multi-word phrases (e.g. 2 to 6 word loops)
  for (let phraseLen = 6; phraseLen >= 2; phraseLen--) {
    let tokens = cleaned.split(/\s+/);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i <= tokens.length - phraseLen * 2; i++) {
        const p1 = tokens.slice(i, i + phraseLen).join(' ').toLowerCase();
        const p2 = tokens.slice(i + phraseLen, i + phraseLen * 2).join(' ').toLowerCase();
        if (p1 === p2) {
          tokens.splice(i + phraseLen, phraseLen);
          cleaned = tokens.join(' ');
          changed = true;
          break;
        }
      }
    }
  }

  return cleaned.trim();
}

/**
 * Ensures the response does not end abruptly with a half-sentence.
 * If the response does not end with sentence-ending punctuation, trims to the last
 * completed sentence, or adds punctuation so it is never left hanging.
 */
function ensureCompleteSentences(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();

  // Sentence ending punctuation marks in Kannada / English / Indic languages
  const endingRegex = /[.!?।|]["')\]]?$/;
  if (endingRegex.test(trimmed)) {
    return trimmed;
  }

  // Look for the last sentence boundary (. ! ? । \n)
  const lastBoundary = Math.max(
    trimmed.lastIndexOf('.'),
    trimmed.lastIndexOf('?'),
    trimmed.lastIndexOf('!'),
    trimmed.lastIndexOf('।'),
    trimmed.lastIndexOf('\n')
  );

  // If there is a complete sentence earlier in the response (at least 30 chars),
  // cleanly trim off the dangling half-sentence so the user never sees/hears a broken sentence.
  if (lastBoundary > 30) {
    return trimmed.slice(0, lastBoundary + 1).trim();
  }

  // If short and just lacking punctuation, add a period
  return trimmed + '.';
}

export class TalkAgentService {
  private recognition: any = null;
  private isListeningActive = false;
  private silenceTimer: any = null;
  private currentSessionFinal = '';
  private conversationHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
  private callbacks: TalkAgentCallbacks;
  private currentStatus: TalkAgentStatus = 'idle';

  // Persistent reference to SpeechSynthesisUtterance to prevent garbage collection cut-off
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechWatchdogTimer: any = null;
  private speechResumeInterval: any = null;

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

        // While answering or speaking, ignore all microphone input to prevent echo feedback
        if (this.currentStatus === 'answering' || this.currentStatus === 'speaking') {
          return;
        }

        // Reconstruct transcript directly from event.results to prevent duplicate accumulation
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (!res || !res[0]) continue;
          const transcript = (res[0].transcript || '').trim();
          if (!transcript) continue;
          if (res.isFinal) {
            sessionFinal = sessionFinal ? `${sessionFinal} ${transcript}` : transcript;
          } else {
            sessionInterim = sessionInterim ? `${sessionInterim} ${transcript}` : transcript;
          }
        }

        // Apply deduplication filter against repetitive recognition engine outputs
        const cleanFinal = cleanRepeatedPhrases(sessionFinal);
        const cleanInterim = cleanRepeatedPhrases(sessionInterim);

        this.currentSessionFinal = cleanFinal;

        const displayText = cleanInterim
          ? (cleanFinal ? `${cleanFinal} ${cleanInterim}` : cleanInterim)
          : cleanFinal;

        if (displayText) {
          this.callbacks.onInterimText(displayText);
        }

        // When user finishes speaking, wait for a natural pause (1100ms) then answer automatically
        if (cleanFinal || cleanInterim) {
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            const query = cleanRepeatedPhrases(cleanFinal || cleanInterim || displayText);
            if (query && query.length >= 2) {
              this.currentSessionFinal = '';
              this.callbacks.onInterimText('');
              this.answerQuestion(query);
            }
          }, 1100);
        }
      };

      this.recognition.onerror = (event: any) => {
        const err = event?.error;
        if (err === 'not-allowed') {
          this.callbacks.onError('Microphone access was denied. Please allow microphone permission in browser.');
          this.setStatus('error');
        } else if (err === 'no-speech' || err === 'network') {
          // Normal timeout on silence: keep alive for continuous experience if listening
          if (this.isListeningActive && this.currentStatus === 'listening') {
            setTimeout(() => this.startListeningSafe(), 250);
          }
        }
      };

      this.recognition.onend = () => {
        // Automatically restart listening ONLY if still active and supposed to be listening
        if (this.isListeningActive && this.currentStatus === 'listening') {
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
    this.currentSessionFinal = '';
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
    this.currentSessionFinal = '';
    this.setStatus('idle');
  }

  // -------------------------------------------------------------
  // ANSWER USER QUESTION (Within seconds using Gemini)
  // -------------------------------------------------------------
  public async answerQuestion(rawQuery: string) {
    const query = cleanRepeatedPhrases(rawQuery);
    if (!query) return;

    // Immediately stop mic listening while processing and speaking to avoid speaker echo
    this.stopListeningSafe();
    this.stopSpeaking();
    this.setStatus('answering');

    // Add user question to transcript
    const userMsg: TalkMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.callbacks.onNewMessage(userMsg);

    // Add to multi-turn conversation history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: query }]
    });

    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    let responseText = '';
    let success = false;

    // Try multiple fast models and rotate API keys on error
    for (const model of TALK_MODELS) {
      const apiKey = getApiKey();
      if (!apiKey) continue;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: TALK_AGENT_SYSTEM_PROMPT }] },
            contents: this.conversationHistory,
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 2048 // Sufficient tokens so Kannada/English sentences are never truncated
            }
          })
        });

        if (!res.ok) {
          rotateApiKey();
          continue;
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        if (candidate?.content?.parts) {
          // Combine all text parts (ensures multi-part answers are not cut off)
          const fullText = candidate.content.parts
            .filter((p: any) => p && typeof p.text === 'string' && !p.thought)
            .map((p: any) => p.text)
            .join('');

          if (fullText.trim()) {
            responseText = ensureCompleteSentences(fullText);
            success = true;
            break;
          }
        }

        if (data.error) {
          rotateApiKey();
        }
      } catch (err) {
        rotateApiKey();
      }
    }

    if (!success || !responseText) {
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
      // Once speech ends, resume listening cleanly for continuous conversation
      if (this.isListeningActive) {
        this.setStatus('listening');
        this.startListeningSafe();
      } else {
        this.setStatus('idle');
      }
    });
  }

  // -------------------------------------------------------------
  // SPEAK RESPONSE (Barge-in supported, GC-safe & freeze-proof)
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

    let isCompleted = false;
    const safeComplete = () => {
      if (isCompleted) return;
      isCompleted = true;
      if (this.speechWatchdogTimer) {
        clearTimeout(this.speechWatchdogTimer);
        this.speechWatchdogTimer = null;
      }
      if (this.speechResumeInterval) {
        clearInterval(this.speechResumeInterval);
        this.speechResumeInterval = null;
      }
      this.currentUtterance = null;
      onDone();
    };

    const utterance = new SpeechSynthesisUtterance(clean);
    this.currentUtterance = utterance; // Keep class reference to prevent GC cutting off speech mid-sentence

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

    utterance.onend = safeComplete;
    utterance.onerror = safeComplete;

    // Watchdog timer: safety timeout calculated from text length so agent never gets stuck
    const estimatedSeconds = Math.max(6, Math.ceil((clean.length / 10) + 4));
    this.speechWatchdogTimer = setTimeout(() => {
      if (this.currentStatus === 'speaking') {
        this.stopSpeaking();
        safeComplete();
      }
    }, estimatedSeconds * 1000);

    // Chrome/Android freeze prevention: keep speech synthesis active
    this.speechResumeInterval = setInterval(() => {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      }
    }, 5000);

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.speechWatchdogTimer) {
      clearTimeout(this.speechWatchdogTimer);
      this.speechWatchdogTimer = null;
    }
    if (this.speechResumeInterval) {
      clearInterval(this.speechResumeInterval);
      this.speechResumeInterval = null;
    }
    this.currentUtterance = null;

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

