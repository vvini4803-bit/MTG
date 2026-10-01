import { dbService } from './dbService';
import { geminiService } from './geminiService';
import { marketPriceService } from './marketPriceService';
import { Language } from '../types';

export interface VoiceQueryResponse {
  answer_en: string;
  answer_kn: string;
  category: string;
  isVerified: boolean;
  navTab?: string;
}

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
        this.recognition.interimResults = false;
        this.isSupported = true;
      }
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }
    }
  }

  public listen(
    lang: Language,
    onResult: (text: string) => void,
    onError: (err: any) => void
  ): () => void {
    if (!this.recognition) {
      onError(new Error(lang === 'kn' ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.' : 'Speech recognition is not supported in this browser. Please type your query.'));
      return () => {};
    }

    this.recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onResult(transcript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event?.error);
      const errCode = event?.error || '';
      if (errCode === 'not-allowed') {
        onError(new Error(lang === 'kn' ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮೈಕ್ ಅನುಮತಿಸಿ.' : 'Microphone permission denied. Please allow microphone access in your browser.'));
      } else if (errCode === 'no-speech') {
        onError(new Error(lang === 'kn' ? 'ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.' : 'No speech detected. Please tap the mic and speak clearly.'));
      } else if (errCode === 'network') {
        onError(new Error(lang === 'kn' ? 'ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.' : 'Speech recognition network error. Please use text input.'));
      } else {
        onError(new Error(lang === 'kn' ? 'ಧ್ವನಿ ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.' : 'Could not recognize speech. Please type your question.'));
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
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
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!cleanText) {
      onEnd?.();
      return () => {};
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = lang === 'kn' ? 0.92 : 0.95;
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

  // Answer matching with live Google Gemini 3.6 Flash + verified database fallback
  public async query(prompt: string, currentLang: Language): Promise<VoiceQueryResponse> {
    try {
      // Primary: Live conversational Gemini intelligence grounded in village data
      const geminiRes = await geminiService.askVillageAssistant(prompt, currentLang);
      if (geminiRes && (geminiRes.answer_en || geminiRes.answer_kn)) {
        return {
          answer_en: geminiRes.answer_en,
          answer_kn: geminiRes.answer_kn,
          category: geminiRes.category || 'GENERAL',
          isVerified: true,
          navTab: geminiRes.navTab || 'home'
        };
      }
    } catch (err) {
      console.warn('Live Gemini query fallback triggered:', err);
    }

    const q = prompt.toLowerCase().trim();

    // 0. Agricultural Market Prices queries (AGMARKNET Government Data)
    const isMarketQuery =
      q.includes('price') ||
      q.includes('rate') ||
      q.includes('market') ||
      q.includes('apmc') ||
      q.includes('mandi') ||
      q.includes('ಬೆಲೆ') ||
      q.includes('ದರ') ||
      q.includes('ಮಾರುಕಟ್ಟೆ') ||
      q.includes('ಎಪಿಎಂಸಿ') ||
      q.includes('ಮಂಡಿ') ||
      q.includes('ದಾಳಿಂಬೆ') ||
      q.includes('ಟೊಮೆಟೊ') ||
      q.includes('ಟೊಮೇಟೊ') ||
      q.includes('ಈರುಳ್ಳಿ') ||
      q.includes('ಭತ್ತ') ||
      q.includes('ಮೆಕ್ಕೆಜೋಳ') ||
      q.includes('ಕಡಲೆಕಾಯಿ') ||
      q.includes('ಶೇಂಗಾ') ||
      q.includes('ಮೆಣಸಿನಕಾಯಿ') ||
      q.includes('pomegranate') ||
      q.includes('tomato') ||
      q.includes('onion') ||
      q.includes('paddy') ||
      q.includes('maize') ||
      q.includes('groundnut') ||
      q.includes('chilli');

    if (isMarketQuery) {
      // Detect commodity
      let detectedCrop = '';
      let cropNameKn = '';
      if (q.includes('pomegranate') || q.includes('ದಾಳಿಂಬೆ')) {
        detectedCrop = 'Pomegranate';
        cropNameKn = 'ದಾಳಿಂಬೆ';
      } else if (q.includes('tomato') || q.includes('ಟೊಮೆಟೊ') || q.includes('ಟೊಮೇಟೊ')) {
        detectedCrop = 'Tomato';
        cropNameKn = 'ಟೊಮೆಟೊ';
      } else if (q.includes('onion') || q.includes('ಈರುಳ್ಳಿ')) {
        detectedCrop = 'Onion';
        cropNameKn = 'ಈರುಳ್ಳಿ';
      } else if (q.includes('paddy') || q.includes('ಭತ್ತ')) {
        detectedCrop = 'Paddy(Common)';
        cropNameKn = 'ಭತ್ತ';
      } else if (q.includes('maize') || q.includes('ಮೆಕ್ಕೆಜೋಳ')) {
        detectedCrop = 'Maize';
        cropNameKn = 'ಮೆಕ್ಕೆಜೋಳ';
      } else if (q.includes('groundnut') || q.includes('ಕಡಲೆಕಾಯಿ') || q.includes('ಶೇಂಗಾ')) {
        detectedCrop = 'Groundnut';
        cropNameKn = 'ಕಡಲೆಕಾಯಿ';
      } else if (q.includes('chilli') || q.includes('ಮೆಣಸಿನಕಾಯಿ')) {
        detectedCrop = 'Dry Chillies';
        cropNameKn = 'ಒಣ ಮೆಣಸಿನಕಾಯಿ';
      }

      // Detect market or district
      let detectedMarket = '';
      if (q.includes('gadag') || q.includes('ಗದಗ')) detectedMarket = 'Gadag';
      else if (q.includes('bengaluru') || q.includes('bangalore') || q.includes('ಬೆಂಗಳೂರು')) detectedMarket = 'Bengaluru';
      else if (q.includes('hubballi') || q.includes('hubli') || q.includes('ಹುಬ್ಬಳ್ಳಿ')) detectedMarket = 'Hubballi';
      else if (q.includes('dharwad') || q.includes('ಧಾರವಾಡ')) detectedMarket = 'Dharwad';
      else if (q.includes('chitradurga') || q.includes('ಚಿತ್ರದುರ್ಗ') || q.includes('hosadurga') || q.includes('ಹೊಸದುರ್ಗ')) detectedMarket = 'Chitradurga';
      else if (q.includes('davangere') || q.includes('ದಾವಣಗೆರೆ')) detectedMarket = 'Davangere';

      // Ambiguity check: user asked for a crop without specifying market
      if (detectedCrop && !detectedMarket && !q.includes('all') && !q.includes('ಎಲ್ಲಾ')) {
        return {
          answer_en: `Which market price would you like for ${detectedCrop}? Gadag, Bengaluru, Hubballi, or Davangere? Opening Market Prices.`,
          answer_kn: `ಯಾವ ಮಾರುಕಟ್ಟೆಯ ${cropNameKn || detectedCrop} ಬೆಲೆ ಬೇಕು? ಗದಗ, ಬೆಂಗಳೂರು, ಹುಬ್ಬಳ್ಳಿ ಅಥವಾ ದಾವಣಗೆರೆ? ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ವಿಭಾಗವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.`,
          category: 'MARKET_PRICES',
          isVerified: true,
          navTab: 'market_prices'
        };
      }

      // Attempt fast fetch from marketPriceService
      try {
        const pricesRes = await marketPriceService.getMarketPrices({
          state: 'Karnataka',
          commodity: detectedCrop,
          market: detectedMarket
        });

        const records = pricesRes.records || [];
        if (records.length > 0) {
          const rec = records[0];
          const modalFmt = rec.modalPrice ? `₹${rec.modalPrice.toLocaleString('en-IN')}` : 'Not available';
          const minFmt = rec.minPrice ? `₹${rec.minPrice.toLocaleString('en-IN')}` : 'Not available';
          const maxFmt = rec.maxPrice ? `₹${rec.maxPrice.toLocaleString('en-IN')}` : 'Not available';
          const arrivalFmt = rec.arrivalQuantity ? `${rec.arrivalQuantity} ${rec.unitArrival || 'tonnes'}` : 'Not available';

          return {
            answer_en: `Today's available modal price for ${rec.commodity} at ${rec.market} is ${modalFmt} per quintal (Min: ${minFmt}, Max: ${maxFmt}). Reported arrival: ${arrivalFmt} on ${rec.arrivalDate}. Source: AGMARKNET.`,
            answer_kn: `${rec.market} ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ${rec.commodity} ಬೆಳೆಯ ಇತ್ತೀಚಿನ ಲಭ್ಯವಿರುವ ಮಾದರಿ ಬೆಲೆ ಕ್ವಿಂಟಾಲ್‌ಗೆ ${modalFmt} ಆಗಿದೆ (ಕನಿಷ್ಠ: ${minFmt}, ಗರಿಷ್ಠ: ${maxFmt}). ವರದಿ ದಿನಾಂಕ: ${rec.arrivalDate}. ಮೂಲ: AGMARKNET / ಭಾರತ ಸರ್ಕಾರ.`,
            category: 'MARKET_PRICES',
            isVerified: true,
            navTab: 'market_prices'
          };
        }
      } catch (err) {
        console.warn('Voice market price fetch fallback:', err);
      }

      return {
        answer_en: `Viewing daily agricultural market prices from AGMARKNET / Government of India. Opening Market Prices section.`,
        answer_kn: `ಭಾರತ ಸರ್ಕಾರದ AGMARKNET ನಿಂದ ದೈನಂದಿನ ಮಾರುಕಟ್ಟೆ ದರಗಳು. ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ವಿಭಾಗವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.`,
        category: 'MARKET_PRICES',
        isVerified: true,
        navTab: 'market_prices'
      };
    }

    // 1. Cricket / Sports queries
    if (
      q.includes('cricket') ||
      q.includes('ಕ್ರಿಕೆಟ್') ||
      q.includes('tournament') ||
      q.includes('ಟೂರ್ನಮೆಂಟ್') ||
      q.includes('sports') ||
      q.includes('ಕ್ರೀಡೆ') ||
      q.includes('score') ||
      q.includes('ಸ್ಕೋರ್')
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
          answer_en: `Scheduled tournament: ${t.name_en} (${t.sport}). Status: ${t.status}.`,
          answer_kn: `ನಿಗದಿತ ಪಂದ್ಯಾವಳಿ: ${t.name_kn} (${t.sport}). ಸ್ಥಿತಿ: ${t.status}.`,
          category: 'SPORTS',
          isVerified: true,
          navTab: 'sports'
        };
      }
      return {
        answer_en: 'No sports tournaments or matches are currently scheduled for Muttagundi. You can create the first tournament in the Sports tab!',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಕ್ರೀಡಾ ಪಂದ್ಯಾವಳಿಗಳು ನಿಗದಿಯಾಗಿಲ್ಲ. ನೀವು ಕ್ರೀಡಾ ವಿಭಾಗದಲ್ಲಿ ಹೊಸ ಪಂದ್ಯಾವಳಿ ಸೇರಿಸಬಹುದು!',
        category: 'SPORTS',
        isVerified: true,
        navTab: 'sports'
      };
    }

    // 2. Events queries
    if (
      q.includes('event') ||
      q.includes('ಕಾರ್ಯಕ್ರಮ') ||
      q.includes('today') ||
      q.includes('ಇಂದು') ||
      q.includes('happening') ||
      q.includes('ನಡೆಯುತ್ತಿದೆ') ||
      q.includes('week') ||
      q.includes('ವಾರ')
    ) {
      const events = dbService['events'] || [];
      if (events.length > 0) {
        const e = events[0];
        return {
          answer_en: `Upcoming verified event: ${e.title_en} on ${e.date} at ${e.venue_en}.`,
          answer_kn: `ಮುಂಬರುವ ದೃಢೀಕೃತ ಕಾರ್ಯಕ್ರಮ: ${e.title_kn}, ದಿನಾಂಕ: ${e.date}, ಸ್ಥಳ: ${e.venue_kn}.`,
          category: 'EVENTS',
          isVerified: true,
          navTab: 'events'
        };
      }
      return {
        answer_en: 'No village events or festivals are currently scheduled for Muttagundi. You can add the first event in the Events tab!',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮಗಳು ನಿಗದಿಯಾಗಿಲ್ಲ. ನೀವು ಕಾರ್ಯಕ್ರಮಗಳ ವಿಭಾಗದಲ್ಲಿ ಹೊಸ ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಬಹುದು!',
        category: 'EVENTS',
        isVerified: true,
        navTab: 'events'
      };
    }

    // 3. Agriculture / Crop queries
    if (
      q.includes('agriculture') ||
      q.includes('farming') ||
      q.includes('crop') ||
      q.includes('ಕೃಷಿ') ||
      q.includes('ಬೆಳೆ') ||
      q.includes('ರಾಗಿ') ||
      q.includes('ಅಡಿಕೆ') ||
      q.includes('farmer')
    ) {
      const crops = dbService['crops'] || [];
      if (crops.length > 0) {
        const c = crops[0];
        return {
          answer_en: `Crop record: ${c.name_en} (${c.category}). Season: ${c.season_en}.`,
          answer_kn: `ಬೆಳೆ ಮಾಹಿತಿ: ${c.name_kn} (${c.category}). ಹಂಗಾಮು: ${c.season_kn}.`,
          category: 'AGRICULTURE',
          isVerified: true,
          navTab: 'agriculture'
        };
      }
      return {
        answer_en: 'No agricultural guides have been added yet for Muttagundi. Farmers and residents can contribute crop practices and MSP info in the Agriculture section.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಕೃಷಿ ವಿಭಾಗದಲ್ಲಿ ಇನ್ನೂ ಬೆಳೆಗಳ ಮಾಹಿತಿ ದಾಖಲಾಗಿಲ್ಲ. ರೈತರು ಕೃಷಿ ವಿಭಾಗದಲ್ಲಿ ಹೊಸ ಬೆಳೆ ಮಾಹಿತಿಯನ್ನು ಸೇರಿಸಬಹುದು.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    // 4. Temple / Culture queries
    if (
      q.includes('temple') ||
      q.includes('ದೇವಸ್ಥಾನ') ||
      q.includes('culture') ||
      q.includes('ಸಂಸ್ಕೃತಿ') ||
      q.includes('history') ||
      q.includes('ಇತಿಹಾಸ')
    ) {
      const temples = dbService['temples'] || [];
      if (temples.length > 0) {
        const t = temples[0];
        return {
          answer_en: `Muttagundi temple: ${t.name_en}. Timings: ${t.timings_en}.`,
          answer_kn: `ಮುತ್ತಾಗೊಂದಿ ದೇವಾಲಯ: ${t.name_kn}. ಪೂಜಾ ಸಮಯ: ${t.timings_kn}.`,
          category: 'TEMPLES',
          isVerified: true,
          navTab: 'temples'
        };
      }
      return {
        answer_en: 'No temple details have been added yet for Muttagundi. You can add temple details, festivals, and pooja timings in the Temples tab.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ದೇವಾಲಯಗಳ ವಿವರ ಇನ್ನೂ ದಾಖಲಾಗಿಲ್ಲ. ದೇಗುಲಗಳ ವಿಭಾಗದಲ್ಲಿ ಪೂಜಾ ಸಮಯ ಮತ್ತು ಇತಿಹಾಸವನ್ನು ಸೇರಿಸಬಹುದು.',
        category: 'TEMPLES',
        isVerified: true,
        navTab: 'temples'
      };
    }

    // 5. Village Statistics queries
    if (
      q.includes('population') ||
      q.includes('ಜನಸಂಖ್ಯೆ') ||
      q.includes('households') ||
      q.includes('ಮನೆ') ||
      q.includes('statistics') ||
      q.includes('data') ||
      q.includes('ಅಂಕಿಅಂಶ')
    ) {
      const stats = dbService['villageStats'];
      return {
        answer_en: `Muttagundi village, Hosadurga Taluk, Chitradurga District has an estimated population of ${stats?.population || 3450} across ${stats?.households || 820} households.`,
        answer_kn: `ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ, ಹೊಸದುರ್ಗ ತಾಲೂಕಿನ ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಜನಸಂಖ್ಯೆ ಸುಮಾರು ${stats?.population || 3450} ಹಾಗೂ ${stats?.households || 820} ಕುಟುಂಬಗಳಿವೆ.`,
        category: 'STATS',
        isVerified: true,
        navTab: 'stats'
      };
    }

    // 6. News queries
    if (
      q.includes('news') ||
      q.includes('ಸುದ್ದಿ') ||
      q.includes('water') ||
      q.includes('ನೀರು') ||
      q.includes('electricity') ||
      q.includes('ವಿದ್ಯುತ್')
    ) {
      const news = dbService['news'] || [];
      if (news.length > 0) {
        const n = news[0];
        return {
          answer_en: `Latest verified update: ${n.title_en} - ${n.content_en.substring(0, 100)}...`,
          answer_kn: `ಇತ್ತೀಚಿನ ದೃಢೀಕೃತ ಸುದ್ದಿ: ${n.title_kn} - ${n.content_kn.substring(0, 100)}...`,
          category: 'NEWS',
          isVerified: true,
          navTab: 'news'
        };
      }
      return {
        answer_en: 'No news notices have been published yet for Muttagundi. Residents can share updates in the News section.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಹೊಸ ಪ್ರಕಟಣೆಗಳಿಲ್ಲ. ಗ್ರಾಮಸ್ಥರು ಸುದ್ದಿ ವಿಭಾಗದಲ್ಲಿ ಹೊಸ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಬಹುದು.',
        category: 'NEWS',
        isVerified: true,
        navTab: 'news'
      };
    }

    // Strict AI Safety Guardrail: Do NOT invent answers
    return {
      answer_en:
        "I couldn't find verified village records for that question. You can browse or contribute verified records across the village sections.",
      answer_kn:
        'ಈ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ದೃಢೀಕೃತ ದಾಖಲೆಗಳು ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ. ಗ್ರಾಮದ ವಿವಿಧ ವಿಭಾಗಗಳಲ್ಲಿ ಹೊಸ ಮಾಹಿತಿಯನ್ನು ಸೇರಿಸಬಹುದು.',
      category: 'UNVERIFIED',
      isVerified: false
    };
  }
}

export const voiceAssistant = new VoiceAssistantService();
