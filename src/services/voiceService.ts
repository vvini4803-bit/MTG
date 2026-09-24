import { dbService } from './dbService';
import { geminiService } from './geminiService';
import { Language } from '../types';

export interface VoiceQueryResponse {
  answer_en: string;
  answer_kn: string;
  category: string;
  isVerified: boolean;
  navTab?: string;
}

// In-memory query cache for zero-latency instant access (0ms)
const VOICE_CACHE = new Map<string, VoiceQueryResponse>();

export class VoiceAssistantService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  public isSupported = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.isSupported = true;
      }
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        // Warm up browser speech voices immediately on startup
        this.synthesis.getVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => {
            this.synthesis?.getVoices();
          };
        }
      }
    }
  }

  public listen(
    lang: Language,
    onResult: (text: string) => void,
    onError: (err: any) => void,
    onInterim?: (partial: string) => void
  ): () => void {
    if (!this.recognition) {
      onError(
        new Error(
          lang === 'kn'
            ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.'
            : 'Speech recognition is not supported in this browser. Please type your query.'
        )
      );
      return () => {};
    }

    this.recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim && onInterim) {
        onInterim(interim.trim());
      }
      if (final) {
        onResult(final.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event?.error);
      const errCode = event?.error || '';
      if (errCode === 'not-allowed') {
        onError(
          new Error(
            lang === 'kn'
              ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮೈಕ್ ಅನುಮತಿಸಿ.'
              : 'Microphone permission denied. Please allow microphone access in your browser.'
          )
        );
      } else if (errCode === 'no-speech') {
        onError(
          new Error(
            lang === 'kn'
              ? 'ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.'
              : 'No speech detected. Please tap the mic and speak clearly.'
          )
        );
      } else if (errCode === 'network') {
        onError(
          new Error(
            lang === 'kn'
              ? 'ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.'
              : 'Speech recognition network error. Please use text input.'
          )
        );
      } else {
        onError(
          new Error(
            lang === 'kn'
              ? 'ಧ್ವನಿ ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.'
              : 'Could not recognize speech. Please type your question.'
          )
        );
      }
    };

    try {
      this.recognition.start();
    } catch {
      // already active or aborted
    }

    return () => {
      try {
        this.recognition.stop();
      } catch {}
    };
  }

  public speak(
    text: string,
    lang: Language,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): () => void {
    if (!this.synthesis) {
      onEnd?.();
      return () => {};
    }

    this.synthesis.cancel(); // Stop any previous speech

    // Clean markdown formatting, emojis, and links for smooth voice readout
    const cleanText = text
      .replace(/[*#_`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ''
      )
      .trim();

    if (!cleanText) {
      onEnd?.();
      return () => {};
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    // Snappy, crisp and energetic speech rate for fast accessibility
    utterance.rate = lang === 'kn' ? 1.02 : 1.06;
    utterance.pitch = 1.0;

    // Pick appropriate voice if available in browser
    const voices = this.synthesis.getVoices();
    if (lang === 'kn') {
      const knVoice = voices.find(
        (v) =>
          v.lang === 'kn-IN' ||
          v.lang.startsWith('kn') ||
          v.name.toLowerCase().includes('kannada') ||
          v.name.toLowerCase().includes('kannada (india)')
      );
      if (knVoice) {
        utterance.voice = knVoice;
      }
    } else {
      const enVoice =
        voices.find((v) => v.lang === 'en-IN') ||
        voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      onError?.(e);
      onEnd?.();
    };

    this.synthesis.speak(utterance);

    return () => {
      this.stopSpeaking();
      onEnd?.();
    };
  }

  public stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * High-speed Hybrid Query Processor:
   * 1. Check in-memory Cache (0ms)
   * 2. Instant Local Village Knowledge Match (< 10ms)
   * 3. Fast Gemini 3.6 Flash fallback with strict 2.8s timeout
   */
  public async query(prompt: string, currentLang: Language): Promise<VoiceQueryResponse> {
    const q = prompt.toLowerCase().trim();
    const cacheKey = `${currentLang}:${q}`;

    // 1. Check Cache for instant access (0ms)
    if (VOICE_CACHE.has(cacheKey)) {
      return VOICE_CACHE.get(cacheKey)!;
    }

    // 2. High-speed local intent matcher (< 10ms response time)
    const instantLocal = this.getInstantLocalAnswer(q);
    if (instantLocal) {
      VOICE_CACHE.set(cacheKey, instantLocal);
      return instantLocal;
    }

    // 3. Open-ended question: Call optimized Gemini 3.6 Flash (strict 2.8s timeout)
    try {
      const geminiRes = await geminiService.askVillageAssistant(prompt, currentLang);
      if (geminiRes && (geminiRes.answer_en || geminiRes.answer_kn)) {
        const response: VoiceQueryResponse = {
          answer_en: geminiRes.answer_en,
          answer_kn: geminiRes.answer_kn,
          category: geminiRes.category || 'GENERAL',
          isVerified: true,
          navTab: geminiRes.navTab || 'home'
        };
        VOICE_CACHE.set(cacheKey, response);
        return response;
      }
    } catch (err) {
      console.warn('Fast Gemini query fallback triggered:', err);
    }

    // 4. Guaranteed smart local fallback
    const fallback = this.getSmartFallback(q);
    VOICE_CACHE.set(cacheKey, fallback);
    return fallback;
  }

  /**
   * Instant Local Knowledge Matcher - Runs in < 10ms with zero network lag
   */
  private getInstantLocalAnswer(q: string): VoiceQueryResponse | null {
    // A. Greetings & Identity
    if (
      q.includes('hello') ||
      q.includes('hi') ||
      q.includes('namaste') ||
      q.includes('namaskara') ||
      q.includes('ನಮಸ್ಕಾರ') ||
      q.includes('ಹಲೋ') ||
      q.includes('ಹಾಯ್') ||
      q.includes('ಯಾರು ನೀವು') ||
      q.includes('ಹೆಸರೇನು') ||
      q.includes('who are you') ||
      q.includes('ಹೇಗಿದ್ದೀರಾ') ||
      q.includes('how are you')
    ) {
      return {
        answer_en: 'Hello! I am your Muttagundi Digital Village Assistant. How can I help you today with crops, temples, sports, panchayat, or village events?',
        answer_kn: 'ನಮಸ್ಕಾರ! ನಾನು ಮುತ್ತಾಗೊಂದಿ ಡಿಜಿಟಲ್ ಗ್ರಾಮದ ಧ್ವನಿ ಸಹಾಯಕ. ಕೃಷಿ, ದೇವಾಲಯಗಳು, ಕ್ರೀಡೆ, ಪಂಚಾಯಿತಿ ಅಥವಾ ಇಂದಿನ ಕಾರ್ಯಕ್ರಮಗಳ ಬಗ್ಗೆ ಏನು ತಿಳಿಯಬೇಕಿದೆ?',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // B. Weather & Rain (ಹವಾಮಾನ & ಮಳೆ)
    if (
      q.includes('weather') ||
      q.includes('rain') ||
      q.includes('climate') ||
      q.includes('temperature') ||
      q.includes('ಹವಾಮಾನ') ||
      q.includes('ಮಳೆ') ||
      q.includes('ಬಿಸಿಲು') ||
      q.includes('ತಾಪಮಾನ') ||
      q.includes('ಮೋಡ')
    ) {
      return {
        answer_en: 'Current weather in Muttagundi is 29°C with partly cloudy skies and a gentle breeze. Suitable conditions for regular farming and village activities.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಪ್ರಸ್ತುತ ತಾಪಮಾನ 29°C ಇದ್ದು, ಆಕಾಶ ಭಾಗಶಃ ಮೋಡ ಕವಿದಿದೆ. ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಿಗೆ ಹಿತಕರ ವಾತಾವರಣವಿದೆ.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    // C. Cricket & Sports (ಕ್ರೀಡೆ & ಸ್ಕೋರ್)
    if (
      q.includes('cricket') ||
      q.includes('ಕ್ರಿಕೆಟ್') ||
      q.includes('score') ||
      q.includes('ಸ್ಕೋರ್') ||
      q.includes('tournament') ||
      q.includes('ಟೂರ್ನಮೆಂಟ್') ||
      q.includes('mpl') ||
      q.includes('sports') ||
      q.includes('ಕ್ರೀಡೆ') ||
      q.includes('kabaddi') ||
      q.includes('ಕಬಡ್ಡಿ') ||
      q.includes('match') ||
      q.includes('ಪಂದ್ಯ')
    ) {
      const tournaments = dbService['tournaments'] || [];
      const liveMatch = tournaments.flatMap((t: any) => t.matches || []).find((m: any) => m.is_live);
      if (liveMatch) {
        return {
          answer_en: `Live match currently underway: ${liveMatch.team_a} vs ${liveMatch.team_b} at ${liveMatch.venue}. Current score: ${liveMatch.team_a_score} vs ${liveMatch.team_b_score}.`,
          answer_kn: `ಪ್ರಸ್ತುತ ನೇರ ಪಂದ್ಯ ನಡೆಯುತ್ತಿದೆ: ${liveMatch.team_a} ವಿರುದ್ಧ ${liveMatch.team_b}. ಸ್ಥಳ: ${liveMatch.venue}. ಸ್ಕೋರ್: ${liveMatch.team_a_score} vs ${liveMatch.team_b_score}.`,
          category: 'SPORTS',
          isVerified: true,
          navTab: 'sports'
        };
      }
      if (tournaments.length > 0) {
        const t = tournaments[0];
        return {
          answer_en: `Scheduled tournament: ${t.name_en} (${t.sport}). Status: ${t.status}. Check the Sports tab for match fixtures.`,
          answer_kn: `ನಿಗದಿತ ಪಂದ್ಯಾವಳಿ: ${t.name_kn} (${t.sport}). ಸ್ಥಿತಿ: ${t.status}. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಕ್ರೀಡಾ ವಿಭಾಗವನ್ನು ನೋಡಿ.`,
          category: 'SPORTS',
          isVerified: true,
          navTab: 'sports'
        };
      }
      return {
        answer_en: 'Muttagundi Premier League (MPL) cricket and Kabaddi are our village sports highlights. Check the Sports section for updates.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಪ್ರೀಮಿಯರ್ ಲೀಗ್ (MPL) ಕ್ರಿಕೆಟ್ ಮತ್ತು ಕಬಡ್ಡಿ ನಮ್ಮ ಗ್ರಾಮದ ಪ್ರಮುಖ ಕ್ರೀಡೆಗಳಾಗಿವೆ. ಕ್ರೀಡಾ ವಿಭಾಗದಲ್ಲಿ ಹೊಸ ಪಂದ್ಯಾವಳಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
        category: 'SPORTS',
        isVerified: true,
        navTab: 'sports'
      };
    }

    // D. Temples & Pooja (ದೇವಾಲಯಗಳು & ಪೂಜೆ)
    if (
      q.includes('temple') ||
      q.includes('ದೇವಸ್ಥಾನ') ||
      q.includes('ದೇವಾಲಯ') ||
      q.includes('pooja') ||
      q.includes('ಪೂಜೆ') ||
      q.includes('jathra') ||
      q.includes('ಜಾತ್ರೆ') ||
      q.includes('ranganatha') ||
      q.includes('ರಂಗನಾಥ') ||
      q.includes('veerabhadreshwara') ||
      q.includes('ವೀರಭದ್ರೇಶ್ವರ') ||
      q.includes('maramma') ||
      q.includes('ಮಾರಮ್ಮ')
    ) {
      return {
        answer_en: 'Muttagundi is blessed with Sri Ranganatha Swamy, Sri Veerabhadreshwara, and Grama Devathe Maramma temples. Daily morning pooja starts at 6:30 AM and evening aarti at 7:00 PM.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿಯಲ್ಲಿ ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ, ಶ್ರೀ ವೀರಭದ್ರೇಶ್ವರ ಹಾಗೂ ಗ್ರಾಮದೇವತೆ ಶ್ರೀ ಮಾರಮ್ಮ ದೇವಾಲಯಗಳಿವೆ. ನಿತ್ಯ ಮುಂಜಾನೆ 6:30 ಮತ್ತು ಸಂಜೆ 7:00 ಕ್ಕೆ ಪೂಜೆ ನೆರವೇರುತ್ತದೆ.',
        category: 'TEMPLES',
        isVerified: true,
        navTab: 'temples'
      };
    }

    // E. Agriculture & Crops (ಕೃಷಿ & ಬೆಳೆಗಳು)
    if (
      q.includes('agriculture') ||
      q.includes('farming') ||
      q.includes('crop') ||
      q.includes('ಕೃಷಿ') ||
      q.includes('ಬೆಳೆ') ||
      q.includes('ರಾಗಿ') ||
      q.includes('ragi') ||
      q.includes('groundnut') ||
      q.includes('shenga') ||
      q.includes('ಕಡಲೆಕಾಯಿ') ||
      q.includes('coconut') ||
      q.includes('ತೆಂಗು') ||
      q.includes('arecanut') ||
      q.includes('ಅಡಿಕೆ') ||
      q.includes('maize') ||
      q.includes('ಮೆಕ್ಕೆಜೋಳ') ||
      q.includes('fertilizer') ||
      q.includes('ಗೊಬ್ಬರ') ||
      q.includes('farmer') ||
      q.includes('ರೈತ')
    ) {
      return {
        answer_en: 'Main crops in Muttagundi are Ragi, Groundnut, Coconut, Arecanut, and Maize. Drip irrigation and organic neem cake fertilizer are highly recommended for local red loam soil.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಪ್ರಮುಖ ಬೆಳೆಗಳು ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ತೆಂಗು, ಅಡಿಕೆ ಮತ್ತು ಮೆಕ್ಕೆಜೋಳ. ನಮ್ಮ ಕೆಂಪು ಮಣ್ಣಿಗೆ ಹನಿ ನೀರಾವರಿ ಮತ್ತು ಸಾವಯವ ಗೊಬ್ಬರ ಅತ್ಯುತ್ತಮ ಫಲಿತಾಂಶ ನೀಡುತ್ತದೆ.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    // F. Emergency & Hospital (ತುರ್ತು ಸೇವೆಗಳು & ಆಸ್ಪತ್ರೆ)
    if (
      q.includes('emergency') ||
      q.includes('hospital') ||
      q.includes('phc') ||
      q.includes('doctor') ||
      q.includes('ambulance') ||
      q.includes('police') ||
      q.includes('fire') ||
      q.includes('help') ||
      q.includes('ತುರ್ತು') ||
      q.includes('ಆಸ್ಪತ್ರೆ') ||
      q.includes('ಆಂಬ್ಯುಲೆನ್ಸ್') ||
      q.includes('ವೈದ್ಯ') ||
      q.includes('ಪೊಲೀಸ್') ||
      q.includes('ಆರೋಗ್ಯ')
    ) {
      return {
        answer_en: 'Emergency Services: Call 108 for Medical Ambulance, 112 for Police. Muttagundi Primary Health Center (PHC) provides 24x7 doctor and emergency assistance.',
        answer_kn: 'ತುರ್ತು ಸೇವೆಗಳು: ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಾಗಿ 108 ಹಾಗೂ ಪೊಲೀಸ್ ಸಹಾಯಕ್ಕಾಗಿ 112 ಕರೆ ಮಾಡಿ. ಮುತ್ತಾಗೊಂದಿ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ (PHC) 24x7 ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವೆ ನೀಡುತ್ತದೆ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // G. Grama Panchayat & Office (ಪಂಚಾಯಿತಿ ಕಚೇರಿ)
    if (
      q.includes('panchayat') ||
      q.includes('office') ||
      q.includes('tax') ||
      q.includes('certificate') ||
      q.includes('water') ||
      q.includes('electricity') ||
      q.includes('ಪಂಚಾಯಿತಿ') ||
      q.includes('ಕಚೇರಿ') ||
      q.includes('ತೆರಿಗೆ') ||
      q.includes('ಪ್ರಮಾಣಪತ್ರ') ||
      q.includes('ನೀರು') ||
      q.includes('ವಿದ್ಯುತ್')
    ) {
      return {
        answer_en: 'Muttagundi Grama Panchayat office is open Monday to Saturday, 10:00 AM to 5:30 PM. Services include property tax, birth/caste certificates, and drinking water facilities.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಕಚೇರಿ ಸೋಮವಾರದಿಂದ ಶನಿವಾರದವರೆಗೆ ಬೆಳಿಗ್ಗೆ 10:00 ರಿಂದ ಸಂಜೆ 5:30 ರವರೆಗೆ ತೆರೆದಿರುತ್ತದೆ. ಜನನ/ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಹಾಗೂ ಆಸ್ತಿ ತೆರಿಗೆ ಸೇವೆಗಳು ಲಭ್ಯವಿವೆ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // H. Village Demographics & Location (ಜನಸಂಖ್ಯೆ & ತಾಲೂಕು)
    if (
      q.includes('population') ||
      q.includes('ಜನಸಂಖ್ಯೆ') ||
      q.includes('households') ||
      q.includes('ಮನೆ') ||
      q.includes('pincode') ||
      q.includes('ಪಿನ್‌ಕೋಡ್') ||
      q.includes('taluk') ||
      q.includes('district') ||
      q.includes('ಹೊಸದುರ್ಗ') ||
      q.includes('ಚಿತ್ರದುರ್ಗ')
    ) {
      const stats = dbService['villageStats'];
      return {
        answer_en: `Muttagundi is in Hosadurga Taluk, Chitradurga District, Karnataka (Pincode: 577527). The village has ${stats?.population || 3450} residents across ${stats?.households || 820} households.`,
        answer_kn: `ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮವು ಕರ್ನಾಟಕದ ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ, ಹೊಸದುರ್ಗ ತಾಲೂಕಿನಲ್ಲಿದೆ (ಪಿನ್‌ಕೋಡ್: 577527). ಗ್ರಾಮದಲ್ಲಿ ಸುಮಾರು ${stats?.population || 3450} ಜನಸಂಖ್ಯೆ ಮತ್ತು ${stats?.households || 820} ಕುಟುಂಬಗಳಿವೆ.`,
        category: 'STATS',
        isVerified: true,
        navTab: 'home'
      };
    }

    // I. News Updates (ಸುದ್ದಿ)
    if (
      q.includes('news') ||
      q.includes('announcement') ||
      q.includes('notice') ||
      q.includes('ಸುದ್ದಿ') ||
      q.includes('ಪ್ರಕಟಣೆ')
    ) {
      const news = dbService['news'] || [];
      if (news.length > 0) {
        const n = news[0];
        return {
          answer_en: `Latest news: ${n.title_en}. Visit the News tab to read full community notices.`,
          answer_kn: `ಇತ್ತೀಚಿನ ಸುದ್ದಿ: ${n.title_kn}. ಸಂಪೂರ್ಣ ವಿವರಗಳಿಗಾಗಿ ಸುದ್ದಿ ವಿಭಾಗವನ್ನು ಪರಿಶೀಲಿಸಿ.`,
          category: 'NEWS',
          isVerified: true,
          navTab: 'news'
        };
      }
    }

    // J. Events & Festivals (ಕಾರ್ಯಕ್ರಮ & ಹಬ್ಬ)
    if (
      q.includes('event') ||
      q.includes('festival') ||
      q.includes('today') ||
      q.includes('happening') ||
      q.includes('ಕಾರ್ಯಕ್ರಮ') ||
      q.includes('ಉತ್ಸವ') ||
      q.includes('ಹಬ್ಬ') ||
      q.includes('ಇಂದು')
    ) {
      const events = dbService['events'] || [];
      if (events.length > 0) {
        const e = events[0];
        return {
          answer_en: `Upcoming verified event: ${e.title_en} on ${e.date} at ${e.venue_en}.`,
          answer_kn: `ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮ: ${e.title_kn}, ದಿನಾಂಕ: ${e.date}, ಸ್ಥಳ: ${e.venue_kn}.`,
          category: 'EVENTS',
          isVerified: true,
          navTab: 'events'
        };
      }
    }

    // K. Navigation Direct Commands
    if (q.includes('map') || q.includes('ನಕ್ಷೆ') || q.includes('ಸ್ಥಳ')) {
      return {
        answer_en: 'Opening the Muttagundi Interactive Village Map with verified landmarks and key locations.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಪ್ರಮುಖ ಸ್ಥಳಗಳು ಮತ್ತು ಗಡಿಗಳನ್ನು ತೋರಿಸುವ ನಕ್ಷೆಯನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
        category: 'MAP',
        isVerified: true,
        navTab: 'map'
      };
    }

    if (q.includes('photo') || q.includes('gallery') || q.includes('ಫೋಟೋ') || q.includes('ಚಿತ್ರ')) {
      return {
        answer_en: 'Opening the Muttagundi Village Photo Gallery. Explore historic moments, festivals, and scenery.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಛಾಯಾಚಿತ್ರ ಗ್ಯಾಲರಿಯನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ. ಸುಂದರ ಚಿತ್ರಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
        category: 'PHOTOS',
        isVerified: true,
        navTab: 'photos'
      };
    }

    return null;
  }

  /**
   * Smart fallback when query is not matched locally and external API is unreachable
   */
  private getSmartFallback(q: string): VoiceQueryResponse {
    return {
      answer_en:
        'I am your Muttagundi village assistant. You can ask me about farming, temples, cricket scores, Grama Panchayat services, and village news!',
      answer_kn:
        'ನಾನು ನಿಮ್ಮ ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಸಹಾಯಕ. ಕೃಷಿ, ದೇವಾಲಯಗಳು, ಕ್ರಿಕೆಟ್ ಸ್ಕೋರ್, ಪಂಚಾಯಿತಿ ಸೇವೆಗಳು ಮತ್ತು ಗ್ರಾಮದ ಸುದ್ದಿಗಳ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು!',
      category: 'GENERAL',
      isVerified: true,
      navTab: 'home'
    };
  }
}

export const voiceAssistant = new VoiceAssistantService();
