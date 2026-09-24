import { dbService } from './dbService';
import { geminiService } from './geminiService';
import { liveGroundingService } from './liveGroundingService';
import { Language } from '../types';

export interface VoiceQueryResponse {
  answer_en: string;
  answer_kn: string;
  category: string;
  isVerified: boolean;
  navTab?: string;
}

// In-memory query cache for verified answers (0ms instant recall)
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
        // Warm up speech synthesis voices on startup
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
   * REAL-TIME AI ARCHITECTURE:
   * Voice/Text Question
   * → Speech-to-Text
   * → Identify question type
   * → Fetch latest MTG database data OR current web information when required
   * → Send the retrieved/current information to Gemini
   * → Gemini generates ONE final answer
   * → Display answer
   * → Text-to-Speech
   *
   * Critical Rule: Gemini is the intelligence layer, NOT the source of truth for MTG data.
   * The MTG database is the source of truth for MTG information.
   * For current internet information, live web grounding is used.
   */
  public async query(prompt: string, currentLang: Language): Promise<VoiceQueryResponse> {
    const q = prompt.toLowerCase().trim();

    // 1. Identify question type
    const questionType = this.identifyQuestionType(q);

    // 2. Fetch latest MTG database data OR current web information
    const realTimeResult = await this.fetchRealTimeData(questionType, prompt, q);

    // 3. Send the retrieved/current information to Gemini for reasoning & single natural phrasing
    if (realTimeResult.groundingContext) {
      try {
        const geminiRes = await geminiService.askVillageAssistant(
          prompt,
          currentLang,
          realTimeResult.groundingContext
        );

        if (geminiRes && (geminiRes.answer_en || geminiRes.answer_kn)) {
          return {
            answer_en: geminiRes.answer_en,
            answer_kn: geminiRes.answer_kn,
            category: geminiRes.category || realTimeResult.category || 'GENERAL',
            isVerified: realTimeResult.isVerified !== undefined ? realTimeResult.isVerified : true,
            navTab: geminiRes.navTab || realTimeResult.navTab || 'home'
          };
        }
      } catch (err) {
        console.warn('[VoiceAssistant] Gemini processing failed, falling back to direct source-of-truth answer:', err);
      }

      // If Gemini times out / fails, immediately use the single final answer generated directly from the fresh retrieved data
      if (realTimeResult.directAnswer) {
        return realTimeResult.directAnswer;
      }
    }

    // If realTimeResult returned a direct non-grounded answer (e.g., live date/time)
    if (realTimeResult.directAnswer) {
      return realTimeResult.directAnswer;
    }

    // 4. For static knowledge queries (greetings, village geography, staple crops):
    const cacheKey = `${currentLang}:${q}`;
    if (VOICE_CACHE.has(cacheKey)) {
      return VOICE_CACHE.get(cacheKey)!;
    }

    const instantLocal = this.getInstantLocalAnswer(q);
    if (instantLocal) {
      VOICE_CACHE.set(cacheKey, instantLocal);
      return instantLocal;
    }

    // 5. Open-ended / General / AI query to Gemini
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
      console.warn('[VoiceAssistant] Gemini open-ended query fallback:', err);
    }

    // 6. Dynamic, question-specific fallback
    return this.getSmartDynamicFallback(prompt, q, currentLang);
  }

  /**
   * Identifies question category to determine whether fresh MTG database data
   * or live web meteorological grounding must be retrieved.
   */
  private identifyQuestionType(q: string):
    | 'MTG_PAYMENT'
    | 'MTG_FUND'
    | 'MTG_MEETING'
    | 'MTG_ADMIN'
    | 'MTG_SPORTS'
    | 'MTG_EMERGENCY'
    | 'MTG_NEWS'
    | 'LIVE_WEATHER'
    | 'LIVE_DATETIME'
    | 'GENERAL' {
    // 1. Payment / Contributions (ಹಣ ಕಟ್ಟಿದವರು / ಪಾವತಿ ವಿವರ)
    if (
      q.includes('who paid') ||
      q.includes('who has paid') ||
      q.includes('paid this month') ||
      q.includes('who has not paid') ||
      q.includes('paid amount') ||
      q.includes('pending payment') ||
      q.includes('payment') ||
      q.includes('contribution') ||
      q.includes('ಹಣ ಕಟ್ಟಿದ್ದಾರೆ') ||
      q.includes('ಹಣ ಕಟ್ಟಿದವರು') ||
      q.includes('ದುಡ್ಡು ಕೊಟ್ಟಿದ್ದಾರೆ') ||
      q.includes('ಹಣ ಕೊಟ್ಟವರು') ||
      q.includes('ಹಣ ಪಾವತಿ') ||
      q.includes('ಯಾರದ್ದು ಬಾಕಿ') ||
      q.includes('ಹಣ ಕಟ್ಟಿಲ್ಲ') ||
      q.includes('ದೇಣಿಗೆ ನೀಡಿದವರು') ||
      q.includes('ಚಂದಾ ಕಟ್ಟಿದವರು')
    ) {
      return 'MTG_PAYMENT';
    }

    // 2. Fund & Balance (ಖಜಾನೆ ಮತ್ತು ಫಂಡ್ ವಿವರ)
    if (
      q.includes('mtg fund') ||
      q.includes('village fund') ||
      q.includes('fund balance') ||
      q.includes('current fund') ||
      q.includes('total fund') ||
      q.includes('treasury') ||
      q.includes('current mtg') ||
      q.includes('ಫಂಡ್') ||
      q.includes('ಖಜಾನೆ') ||
      q.includes('ಗ್ರಾಮದ ಹಣ') ||
      q.includes('ಖಾತೆಯಲ್ಲಿ ಎಷ್ಟು') ||
      q.includes('ಬ್ಯಾಲೆನ್ಸ್')
    ) {
      return 'MTG_FUND';
    }

    // 3. Meetings & Grama Sabha (ಸಭೆ & ಮೀಟಿಂಗ್ ವೇಳಾಪಟ್ಟಿ)
    if (
      q.includes('meeting') ||
      q.includes('ಮೀಟಿಂಗ್') ||
      q.includes('ಸಭೆ') ||
      q.includes('ಗ್ರಾಮ ಸಭೆ') ||
      q.includes('ಪಂಚಾಯತ್ ಸಭೆ') ||
      q.includes('ಇಂದು ಸಭೆ') ||
      q.includes('ಇವತ್ತು ನಮ್ಮ meeting') ||
      q.includes('meeting ಇದೆಯಾ')
    ) {
      return 'MTG_MEETING';
    }

    // 4. Admin & Leadership (ಅಡ್ಮಿನ್ & ಸೂಪರ್ ಅಡ್ಮಿನ್)
    if (
      q.includes('who is the admin') ||
      q.includes('who is admin') ||
      q.includes('who is super admin') ||
      q.includes('super admin') ||
      q.includes('portal admin') ||
      q.includes('ಅಡ್ಮಿನ್ ಯಾರು') ||
      q.includes('ಸೂಪರ್ ಅಡ್ಮಿನ್') ||
      q.includes('ಅಡ್ಮಿನ್') ||
      q.includes('ನಿರ್ವಾಹಕರು') ||
      q.includes('ಮುಖಂಡರು ಯಾರು')
    ) {
      return 'MTG_ADMIN';
    }

    // 5. Weather, Rain & Temperature (ಹವಾಮಾನ & ಮಳೆ - ಲೈವ್ ಮೆಟಿಯೊರೊಲಾಜಿಕಲ್ ಡೇಟಾ)
    if (
      q.includes('weather') ||
      q.includes('rain') ||
      q.includes('temperature') ||
      q.includes('climate') ||
      q.includes('forecast') ||
      q.includes('ಹವಾಮಾನ') ||
      q.includes('ಮಳೆ') ||
      q.includes('ತಾಪಮಾನ') ||
      q.includes('ಬಿಸಿಲು') ||
      q.includes('ಮಳೆ ಬರುತ್ತಾ') ||
      q.includes('ಮೋಡ')
    ) {
      return 'LIVE_WEATHER';
    }

    // 6. Cricket, MPL & Sports (ಕ್ರಿಕೆಟ್ ಸ್ಕೋರ್ & ಪಂದ್ಯಾವಳಿ)
    if (
      q.includes('cricket') ||
      q.includes('ಕ್ರಿಕೆಟ್') ||
      q.includes('score') ||
      q.includes('ಸ್ಕೋರ್') ||
      q.includes('mpl') ||
      q.includes('tournament') ||
      q.includes('ಟೂರ್ನಮೆಂಟ್') ||
      q.includes('sports') ||
      q.includes('ಕ್ರೀಡೆ') ||
      q.includes('kabaddi') ||
      q.includes('ಕಬಡ್ಡಿ') ||
      q.includes('match') ||
      q.includes('ಪಂದ್ಯ')
    ) {
      return 'MTG_SPORTS';
    }

    // 7. Time & Date (ಸಮಯ & ದಿನಾಂಕ)
    if (
      q.includes('what time') ||
      q.includes('current time') ||
      q.includes('today date') ||
      q.includes('what day is today') ||
      q.includes('ಸಮಯ ಎಷ್ಟು') ||
      q.includes('ಗಂಟೆ ಎಷ್ಟು') ||
      q.includes('ಇವತ್ತು ಯಾವ ದಿನ')
    ) {
      return 'LIVE_DATETIME';
    }

    // 8. Emergency Alert (ತುರ್ತು ಎಚ್ಚರಿಕೆ)
    if (
      q.includes('emergency') ||
      q.includes('alert') ||
      q.includes('warning') ||
      q.includes('ತುರ್ತು') ||
      q.includes('ಎಚ್ಚರಿಕೆ')
    ) {
      return 'MTG_EMERGENCY';
    }

    // 9. Village News (ಸುದ್ದಿ & ಪ್ರಕಟಣೆ)
    if (
      q.includes('news') ||
      q.includes('notice') ||
      q.includes('announcement') ||
      q.includes('ಸುದ್ದಿ') ||
      q.includes('ಪ್ರಕಟಣೆ')
    ) {
      return 'MTG_NEWS';
    }

    return 'GENERAL';
  }

  /**
   * Fetches fresh real-time data from MTG Database or Live Web Grounding.
   * This is the absolute SOURCE OF TRUTH passed to Gemini.
   */
  private async fetchRealTimeData(
    type: ReturnType<typeof this.identifyQuestionType>,
    prompt: string,
    q: string
  ): Promise<{
    groundingContext?: string;
    directAnswer?: VoiceQueryResponse;
    category?: string;
    isVerified?: boolean;
    navTab?: string;
  }> {
    switch (type) {
      // 1. Who paid this month's amount?
      case 'MTG_PAYMENT': {
        const fund = dbService.getVillageFund();
        const payments = dbService.getPaymentRecords();
        const paid = payments.filter((p) => p.status === 'PAID');
        const pending = payments.filter((p) => p.status === 'PENDING');
        const paidNames = paid.map((p) => p.user_name).join(', ') || 'None';
        const paidNamesKn = paid.map((p) => p.user_name_kn || p.user_name).join(', ') || 'ಯಾರೂ ಇಲ್ಲ';
        const pendingNames = pending.map((p) => p.user_name).join(', ') || 'None';

        const groundingContext = `REAL-TIME MTG DATABASE DATA (SOURCE OF TRUTH) - MONTHLY PAYMENTS:
- Current Active Month: ${fund.current_month}
- Total Collected this month: ₹${fund.monthly_collected.toLocaleString('en-IN')} (Target: ₹${fund.monthly_target.toLocaleString('en-IN')})
- Members who PAID this month: ${paid.map((p) => `${p.user_name} (₹${p.amount} on ${p.date})`).join('; ') || 'None'}
- Members with PENDING payment this month: ${pendingNames}`;

        return {
          groundingContext,
          category: 'GENERAL',
          isVerified: true,
          navTab: 'home',
          directAnswer: {
            answer_en: `For ${fund.current_month}, ${paid.map((p) => p.user_name).slice(0, 4).join(', ')} and others have paid their contribution, totaling ₹${fund.monthly_collected.toLocaleString('en-IN')}.`,
            answer_kn: `ಈ ತಿಂಗಳು (${fund.current_month}) ${paidNamesKn} ಹಣ ಪಾವತಿಸಿದ್ದು, ಒಟ್ಟು ₹${fund.monthly_collected.toLocaleString('en-IN')} ಸಂಗ್ರಹವಾಗಿದೆ.`,
            category: 'GENERAL',
            isVerified: true,
            navTab: 'home'
          }
        };
      }

      // 2. What is the current MTG fund?
      case 'MTG_FUND': {
        const fund = dbService.getVillageFund();
        const groundingContext = `REAL-TIME MTG DATABASE DATA (SOURCE OF TRUTH) - FUND BALANCE:
- Current MTG Village Fund Balance: ₹${fund.total_balance.toLocaleString('en-IN')}
- Active Month (${fund.current_month}) Collected: ₹${fund.monthly_collected.toLocaleString('en-IN')}
- Monthly Target: ₹${fund.monthly_target.toLocaleString('en-IN')}
- Active Contributors Count: ${fund.active_contributors_count}
- Last Updated: ${fund.last_updated}`;

        return {
          groundingContext,
          category: 'GENERAL',
          isVerified: true,
          navTab: 'home',
          directAnswer: {
            answer_en: `The current MTG village fund balance is ₹${fund.total_balance.toLocaleString('en-IN')}, with ₹${fund.monthly_collected.toLocaleString('en-IN')} collected for ${fund.current_month}.`,
            answer_kn: `ಪ್ರಸ್ತುತ MTG ಗ್ರಾಮದ ಒಟ್ಟು ಖಜಾನೆ ನಿಧಿ ₹${fund.total_balance.toLocaleString('en-IN')} ಆಗಿದ್ದು, ${fund.current_month} ತಿಂಗಳಲ್ಲಿ ₹${fund.monthly_collected.toLocaleString('en-IN')} ಸಂಗ್ರಹವಾಗಿದೆ.`,
            category: 'GENERAL',
            isVerified: true,
            navTab: 'home'
          }
        };
      }

      // 3. When is our next meeting? / ಇವತ್ತು ನಮ್ಮ meeting ಇದೆಯಾ?
      case 'MTG_MEETING': {
        const meetings = dbService.getMeetingsSchedule();
        const groundingContext = `REAL-TIME MTG DATABASE DATA (SOURCE OF TRUTH) - VILLAGE MEETINGS:
- Is there a meeting today?: ${meetings.hasMeetingToday && meetings.todayMeetings[0] ? `YES. Meeting: "${meetings.todayMeetings[0].title_en}" (${meetings.todayMeetings[0].title_kn}) scheduled today at ${meetings.todayMeetings[0].start_time} at ${meetings.todayMeetings[0].venue_en}.` : 'NO. No meeting is scheduled for today.'}
- Next upcoming meeting: ${meetings.nextMeeting ? `"${meetings.nextMeeting.title_en}" (${meetings.nextMeeting.title_kn}) on ${meetings.nextMeeting.date} at ${meetings.nextMeeting.start_time} at ${meetings.nextMeeting.venue_en}.` : 'None scheduled at present.'}`;

        return {
          groundingContext,
          category: 'EVENTS',
          isVerified: true,
          navTab: 'events',
          directAnswer: {
            answer_en: meetings.hasMeetingToday && meetings.todayMeetings[0]
              ? `Yes, there is an MTG meeting scheduled today at ${meetings.todayMeetings[0].start_time} at ${meetings.todayMeetings[0].venue_en}.`
              : `No MTG meeting is scheduled for today.${meetings.nextMeeting ? ` The next meeting is on ${meetings.nextMeeting.date} at ${meetings.nextMeeting.start_time}.` : ''}`,
            answer_kn: meetings.hasMeetingToday && meetings.todayMeetings[0]
              ? `ಹೌದು, ಇಂದು ${meetings.todayMeetings[0].start_time} ಗಂಟೆಗೆ MTG meeting ${meetings.todayMeetings[0].venue_kn || meetings.todayMeetings[0].venue_en}ದಲ್ಲಿ ಇದೆ.`
              : `ಇಂದು ಯಾವುದೇ MTG meeting schedule ಆಗಿಲ್ಲ.${meetings.nextMeeting ? ` ಮುಂದಿನ ಸಭೆಯು ${meetings.nextMeeting.date} ರಂದು ನಿಗದಿಯಾಗಿದೆ.` : ''}`,
            category: 'EVENTS',
            isVerified: true,
            navTab: 'events'
          }
        };
      }

      // 4. Who is the admin?
      case 'MTG_ADMIN': {
        const admins = dbService.getAdmins();
        const groundingContext = `REAL-TIME MTG DATABASE DATA (SOURCE OF TRUTH) - PORTAL ADMINS & LEADERSHIP:
- Super Admin: Vinay Kumar (email: vvini4803@gmail.com, UID: admin_vvini4803)
- Active Admins: ${admins.map((a) => `${a.name} (${a.role})`).join(', ') || 'Vinay Kumar'}`;

        return {
          groundingContext,
          category: 'GENERAL',
          isVerified: true,
          navTab: 'home',
          directAnswer: {
            answer_en: `The Super Admin of Muttagundi Digital Village is Vinay Kumar (vvini4803@gmail.com).`,
            answer_kn: `ಮುತ್ತಾಗೊಂದಿ ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಪೋರ್ಟಲ್‌ನ ಸೂಪರ್ ಅಡ್ಮಿನ್ ವಿನಯ್ ಕುಮಾರ್ (Vinay Kumar).`,
            category: 'GENERAL',
            isVerified: true,
            navTab: 'home'
          }
        };
      }

      // 5. Current Live Weather from Open-Meteo API
      case 'LIVE_WEATHER': {
        const weather = await liveGroundingService.getLiveWeather();
        if (weather && weather.isLive) {
          const groundingContext = `LIVE REAL-TIME WEATHER (MUTTAGUNDI, HOSADURGA, CHITRADURGA):
- Current Temperature: ${weather.tempC}°C
- Sky Condition: ${weather.conditionEn} (${weather.conditionKn})
- Relative Humidity: ${weather.humidity}%
- Rain / Precipitation: ${weather.rainMm} mm
- Rain Probability: ${weather.rainProbability || 0}%
- Wind Speed: ${weather.windKmh} km/h
- Timestamp: ${weather.timestamp}`;

          return {
            groundingContext,
            category: 'AGRICULTURE',
            isVerified: true,
            navTab: 'agriculture',
            directAnswer: {
              answer_en: `Current weather in Muttagundi is ${weather.tempC}°C with ${weather.conditionEn}. Humidity is ${weather.humidity}% with ${weather.rainProbability || 0}% chance of rain.`,
              answer_kn: `ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಪ್ರಸ್ತುತ ತಾಪಮಾನ ${weather.tempC}°C ಇದ್ದು, ${weather.conditionKn}. ಮಳೆ ಬರುವ ಸಾಧ್ಯತೆ ಶೇ. ${weather.rainProbability || 0} ರಷ್ಟಿದೆ.`,
              category: 'AGRICULTURE',
              isVerified: true,
              navTab: 'agriculture'
            }
          };
        } else {
          // Do not pretend that information is real-time if live data was not successfully retrieved
          return {
            category: 'AGRICULTURE',
            isVerified: false,
            navTab: 'agriculture',
            directAnswer: {
              answer_en: 'Could not retrieve live meteorological data at this moment. Please check back shortly.',
              answer_kn: 'ಪ್ರಸ್ತುತ ಲೈವ್ ಹವಾಮಾನ ಮಾಹಿತಿ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.',
              category: 'AGRICULTURE',
              isVerified: false,
              navTab: 'agriculture'
            }
          };
        }
      }

      // 6. Live Time & Date in IST
      case 'LIVE_DATETIME': {
        const dt = liveGroundingService.getLiveDateTimeContext();
        return {
          category: 'GENERAL',
          isVerified: true,
          navTab: 'home',
          directAnswer: {
            answer_en: `Today is ${dt.dayEn}, ${dt.dateStr}, and the current time is ${dt.timeStr} (IST).`,
            answer_kn: `ಇಂದು ${dt.dayKn}, ದಿನಾಂಕ ${dt.dateStr}, ಪ್ರಸ್ತುತ ಸಮಯ ${dt.timeStr}.`,
            category: 'GENERAL',
            isVerified: true,
            navTab: 'home'
          }
        };
      }

      // 7. Live Sports & Matches
      case 'MTG_SPORTS': {
        const sports = dbService.getLiveSportsStatus();
        const live = sports.liveMatches[0];
        const upcoming = sports.upcomingTournaments[0];

        const groundingContext = `REAL-TIME MTG DATABASE DATA - SPORTS:
- Live Match: ${live ? `In progress: ${live.team_a} vs ${live.team_b} at ${live.venue}. Score: ${live.team_a_score} vs ${live.team_b_score}. Status: ${live.current_status_en}` : 'No live match currently playing.'}
- Tournaments: ${upcoming ? `${upcoming.name_en} (${upcoming.sport}) - Status: ${upcoming.status}` : 'Muttagundi Premier League (MPL) Cricket Tournament'}`;

        return {
          groundingContext,
          category: 'SPORTS',
          isVerified: true,
          navTab: 'sports',
          directAnswer: {
            answer_en: live
              ? `Live match in progress: ${live.team_a} vs ${live.team_b} at ${live.venue}. Score: ${live.team_a_score} vs ${live.team_b_score}.`
              : 'Muttagundi Premier League (MPL) cricket and Kabaddi are our village sports highlights. Check the Sports section for tournament schedules.',
            answer_kn: live
              ? `ಪ್ರಸ್ತುತ ನೇರ ಪಂದ್ಯ ನಡೆಯುತ್ತಿದೆ: ${live.team_a} ವಿರುದ್ಧ ${live.team_b}. ಸ್ಕೋರ್: ${live.team_a_score} vs ${live.team_b_score}.`
              : 'ಮುತ್ತಾಗೊಂದಿ ಪ್ರೀಮಿಯರ್ ಲೀಗ್ (MPL) ಕ್ರಿಕೆಟ್ ಮತ್ತು ಕಬಡ್ಡಿ ನಮ್ಮ ಪ್ರಮುಖ ಕ್ರೀಡೆಗಳಾಗಿವೆ. ಕ್ರೀಡಾ ವಿಭಾಗದಲ್ಲಿ ಹೊಸ ವೇಳಾಪಟ್ಟಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
            category: 'SPORTS',
            isVerified: true,
            navTab: 'sports'
          }
        };
      }

      // 8. Emergency Alert
      case 'MTG_EMERGENCY': {
        const alert = dbService.getEmergencyAlertStatus();
        const groundingContext = `REAL-TIME MTG DATABASE DATA - EMERGENCY ADVISORY:
- Alert Active: ${alert ? `YES. [${alert.level}] ${alert.title_en} (${alert.title_kn}): ${alert.message_en}. Contact: ${alert.contact_info}` : 'NO. There are no active emergency advisories in Muttagundi.'}`;

        return {
          groundingContext,
          category: 'GENERAL',
          isVerified: true,
          navTab: 'home',
          directAnswer: {
            answer_en: alert
              ? `Active Village Alert [${alert.level}]: ${alert.title_en} - ${alert.message_en}. Contact: ${alert.contact_info}.`
              : 'There are currently no active emergency alerts in Muttagundi. For medical help call 108, for police assistance call 112.',
            answer_kn: alert
              ? `ತುರ್ತು ಎಚ್ಚರಿಕೆ [${alert.level}]: ${alert.title_kn} - ${alert.message_kn}. ಸಂಪರ್ಕ: ${alert.contact_info}.`
              : 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಪ್ರಸ್ತುತ ಯಾವುದೇ ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ. ವೈದ್ಯಕೀಯ ನೆರವಿಗೆ 108, ಪೊಲೀಸ್ ಸಹಾಯಕ್ಕೆ 112 ಕರೆ ಮಾಡಿ.',
            category: 'GENERAL',
            isVerified: true,
            navTab: 'home'
          }
        };
      }

      // 9. Latest Village News
      case 'MTG_NEWS': {
        const news = dbService.getNews();
        const latest = news[0];
        const groundingContext = `REAL-TIME MTG DATABASE DATA - NEWS & ANNOUNCEMENTS:
- Latest Announcement: ${latest ? `"${latest.title_en}" (${latest.title_kn}): ${latest.content_en} (${latest.created_at})` : 'No recent announcements.'}`;

        return {
          groundingContext,
          category: 'NEWS',
          isVerified: true,
          navTab: 'news',
          directAnswer: {
            answer_en: latest
              ? `Latest village notice: ${latest.title_en}. Visit the News tab for complete details.`
              : 'No new village notices at present. Check the News section for past updates.',
            answer_kn: latest
              ? `ಇತ್ತೀಚಿನ ಗ್ರಾಮ ಪ್ರಕಟಣೆ: ${latest.title_kn}. ಸಂಪೂರ್ಣ ವಿವರಗಳಿಗಾಗಿ ಸುದ್ದಿ ವಿಭಾಗವನ್ನು ನೋಡಿ.`
              : 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಹೊಸ ಗ್ರಾಮ ಪ್ರಕಟಣೆಗಳಿಲ್ಲ. ಸುದ್ದಿ ವಿಭಾಗದಲ್ಲಿ ಹಿಂದಿನ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
            category: 'NEWS',
            isVerified: true,
            navTab: 'news'
          }
        };
      }

      default:
        return {};
    }
  }

  /**
   * Instant Static Local Knowledge Matcher - For non-real-time static village information
   */
  private getInstantLocalAnswer(q: string): VoiceQueryResponse | null {
    // 1. Greetings, Identity & How are you
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
        answer_en: 'Namaskara! I am your Muttagundi Digital Village AI Assistant. Ask me anything about agriculture, temples, cricket scores, panchayat certificates, weather, or government schemes!',
        answer_kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಮುತ್ತಾಗೊಂದಿ ಡಿಜಿಟಲ್ ಗ್ರಾಮದ ಧ್ವನಿ ಸಹಾಯಕ. ಕೃಷಿ, ದೇವಾಲಯಗಳು, ಕ್ರಿಕೆಟ್ ಸ್ಕೋರ್, ಪಂಚಾಯಿತಿ ಪ್ರಮಾಣಪತ್ರಗಳು, ಹವಾಮಾನ ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ!',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 3. Cricket, Sports & MPL (ಕ್ರಿಕೆಟ್ & ಸ್ಕೋರ್)
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
          answer_en: `Live match in progress: ${liveMatch.team_a} vs ${liveMatch.team_b} at ${liveMatch.venue}. Current score: ${liveMatch.team_a_score} vs ${liveMatch.team_b_score}.`,
          answer_kn: `ಪ್ರಸ್ತುತ ನೇರ ಪಂದ್ಯ ನಡೆಯುತ್ತಿದೆ: ${liveMatch.team_a} ವಿರುದ್ಧ ${liveMatch.team_b}. ಸ್ಥಳ: ${liveMatch.venue}. ಸ್ಕೋರ್: ${liveMatch.team_a_score} vs ${liveMatch.team_b_score}.`,
          category: 'SPORTS',
          isVerified: true,
          navTab: 'sports'
        };
      }
      if (tournaments.length > 0) {
        const t = tournaments[0];
        return {
          answer_en: `Scheduled tournament: ${t.name_en} (${t.sport}). Status: ${t.status}. Check the Sports tab for team fixtures and schedules.`,
          answer_kn: `ನಿಗದಿತ ಪಂದ್ಯಾವಳಿ: ${t.name_kn} (${t.sport}). ಸ್ಥಿತಿ: ${t.status}. ಹೆಚ್ಚಿನ ವಿವರ ಮತ್ತು ವೇಳಾಪಟ್ಟಿಗಾಗಿ ಕ್ರೀಡಾ ವಿಭಾಗವನ್ನು ನೋಡಿ.`,
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

    // 4. Temples & Pooja (ಶ್ರೀ ರಂಗನಾಥ, ವೀರಭದ್ರೇಶ್ವರ, ಮಾರಮ್ಮ ದೇವಾಲಯಗಳು)
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
      if (q.includes('ರಂಗನಾಥ') || q.includes('ranganatha')) {
        return {
          answer_en: 'Sri Ranganatha Swamy Temple is the historic center of Muttagundi. Annual Jathra Mahotsava is celebrated grandly during Chaitra Masa. Daily pooja at 6:30 AM & 7:00 PM.',
          answer_kn: 'ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ ದೇವಾಲಯವು ಮುತ್ತಾಗೊಂದಿಯ ಐತಿಹಾಸಿಕ ಪವಿತ್ರ ಕೇಂದ್ರ. ಚೈತ್ರ ಮಾಸದಲ್ಲಿ ವಾರ್ಷಿಕ ಜಾತ್ರಾ ಮಹೋತ್ಸವ ಸಂಭ್ರಮದಿಂದ ಜರುಗುತ್ತದೆ. ನಿತ್ಯ ಪೂಜೆ ಬೆಳಿಗ್ಗೆ 6:30 ಮತ್ತು ಸಂಜೆ 7:00 ಕ್ಕೆ.',
          category: 'TEMPLES',
          isVerified: true,
          navTab: 'temples'
        };
      }
      if (q.includes('ವೀರಭದ್ರೇಶ್ವರ') || q.includes('veerabhadreshwara')) {
        return {
          answer_en: 'Sri Veerabhadreshwara Swamy Temple conducts special poojas every Shravana Somavara and grand Karthika Deepotsava with village elders and youth.',
          answer_kn: 'ಶ್ರೀ ವೀರಭದ್ರೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನದಲ್ಲಿ ಪ್ರತಿ ಶ್ರಾವಣ ಸೋಮವಾರ ವಿಶೇಷ ಪೂಜೆ ಹಾಗೂ ಕಾರ್ತಿಕ ಮಾಸದಲ್ಲಿ ದೀಪೋತ್ಸವ ವಿಜೃಂಭಣೆಯಿಂದ ನಡೆಯುತ್ತದೆ.',
          category: 'TEMPLES',
          isVerified: true,
          navTab: 'temples'
        };
      }
      if (q.includes('ಮಾರಮ್ಮ') || q.includes('maramma')) {
        return {
          answer_en: 'Grama Devathe Sri Maramma Temple protects our village. Annual Marihabba is celebrated unitedly by all families of Muttagundi.',
          answer_kn: 'ಗ್ರಾಮ ದೇವತೆ ಶ್ರೀ ಮಾರಮ್ಮ ದೇವಾಲಯವು ನಮ್ಮ ಊರಿನ ರಕ್ಷಾ ದೇವತೆಯಾಗಿದೆ. ವಾರ್ಷಿಕ ಮಾರಿಹಬ್ಬವನ್ನು ಗ್ರಾಮದ ಸಮಸ್ತ ಬಾಂಧವರು ಒಗ್ಗಟ್ಟಿನಿಂದ ಆಚರಿಸುತ್ತಾರೆ.',
          category: 'TEMPLES',
          isVerified: true,
          navTab: 'temples'
        };
      }
      return {
        answer_en: 'Muttagundi has Sri Ranganatha Swamy, Sri Veerabhadreshwara, and Grama Devathe Maramma temples. Daily morning pooja starts at 6:30 AM and evening aarti at 7:00 PM.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿಯಲ್ಲಿ ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ, ಶ್ರೀ ವೀರಭದ್ರೇಶ್ವರ ಹಾಗೂ ಗ್ರಾಮದೇವತೆ ಶ್ರೀ ಮಾರಮ್ಮ ದೇವಾಲಯಗಳಿವೆ. ನಿತ್ಯ ಮುಂಜಾನೆ 6:30 ಮತ್ತು ಸಂಜೆ 7:00 ಕ್ಕೆ ಪೂಜೆ ನೆರವೇರುತ್ತದೆ.',
        category: 'TEMPLES',
        isVerified: true,
        navTab: 'temples'
      };
    }

    // 5. Specific Agricultural Crops & Farming (ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ತೆಂಗು, ಅಡಿಕೆ, ಗೊಬ್ಬರ)
    if (
      q.includes('ragi') ||
      q.includes('ರಾಗಿ')
    ) {
      return {
        answer_en: 'Ragi (Finger Millet) is the primary staple crop of Muttagundi, sown during Kharif season (July-August). Recommended varieties: ML-365 and GPU-28, best suited for local red soil.',
        answer_kn: 'ರಾಗಿ ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಪ್ರಮುಖ ಆಹಾರ ಬೆಳೆಯಾಗಿದ್ದು, ಜುಲೈ-ಆಗಸ್ಟ್ ಮುಂಗಾರಿನಲ್ಲಿ ಬಿತ್ತನೆ ಮಾಡಲಾಗುತ್ತದೆ. ಎಂಎಲ್-365 ಮತ್ತು ಜಿಪಿಯು-28 ತಳಿಗಳು ನಮ್ಮ ಕೆಂಪು ಮಣ್ಣಿಗೆ ಅತ್ಯುತ್ತಮವಾಗಿವೆ.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    if (
      q.includes('groundnut') ||
      q.includes('shenga') ||
      q.includes('ಕಡಲೆಕಾಯಿ') ||
      q.includes('ಶೇಂಗಾ')
    ) {
      return {
        answer_en: 'Groundnut is our major commercial oilseed crop in Muttagundi. Sowing in June-July with gypsum application at 30-40 days ensures high pod yield.',
        answer_kn: 'ಕಡಲೆಕಾಯಿ (ಶೇಂಗಾ) ಮುತ್ತಾಗೊಂದಿಯ ಪ್ರಮುಖ ವಾಣಿಜ್ಯ ಬೆಳೆಯಾಗಿದೆ. ಜೂನ್-ಜುಲೈನಲ್ಲಿ ಬಿತ್ತನೆ ಮಾಡಿ, 30-40 ದಿನಗಳಲ್ಲಿ ಜಿಪ್ಸಂ ಗೊಬ್ಬರ ಹಾಕುವುದರಿಂದ ಉತ್ತಮ ಕಾಳು ಕಟ್ಟುತ್ತದೆ.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    if (
      q.includes('coconut') ||
      q.includes('arecanut') ||
      q.includes('ತೆಂಗು') ||
      q.includes('ಅಡಿಕೆ')
    ) {
      return {
        answer_en: 'Coconut and Arecanut plantations thrive in Muttagundi with drip irrigation. Organic compost, vermicompost, and borewell management are key for year-round yield.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿಯಲ್ಲಿ ತೆಂಗು ಮತ್ತು ಅಡಿಕೆ ತೋಟಗಳು ಹನಿ ನೀರಾವರಿಯೊಂದಿಗೆ ಉತ್ತಮ ಫಸಲು ನೀಡುತ್ತವೆ. ಸಾವಯವ ಗೊಬ್ಬರ ಮತ್ತು ತೇವಾಂಶ ನಿರ್ವಹಣೆ ಇಳುವರಿಗೆ ಸಹಾಯಕ.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    if (
      q.includes('agriculture') ||
      q.includes('farming') ||
      q.includes('crop') ||
      q.includes('fertilizer') ||
      q.includes('pesticide') ||
      q.includes('ಕೃಷಿ') ||
      q.includes('ಬೆಳೆ') ||
      q.includes('ಗೊಬ್ಬರ') ||
      q.includes('ಕೀಟನಾಶಕ') ||
      q.includes('ರೈತ')
    ) {
      return {
        answer_en: 'Muttagundi has 2,150 acres of agricultural land. Major crops are Ragi, Groundnut, Coconut, Arecanut, and Maize. Drip irrigation and organic neem cake fertilizer are highly recommended.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ 2,150 ಎಕರೆ ಕೃಷಿ ಭೂಮಿಯಿದ್ದು, ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ತೆಂಗು, ಅಡಿಕೆ ಮತ್ತು ಮೆಕ್ಕೆಜೋಳ ಮುಖ್ಯ ಬೆಳೆಗಳು. ಹನಿ ನೀರಾವರಿ ಹಾಗೂ ಬೇವಿನ ಹಿಂಡಿ ಸಾವಯವ ಗೊಬ್ಬರಕ್ಕೆ ಆದ್ಯತೆ ನೀಡಲಾಗಿದೆ.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    // 6. Government Schemes & Subsidies (ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು)
    if (
      q.includes('scheme') ||
      q.includes('subsidy') ||
      q.includes('pm kisan') ||
      q.includes('raitha siri') ||
      q.includes('gruha lakshmi') ||
      q.includes('anna bhagya') ||
      q.includes('ಯೋಜನೆ') ||
      q.includes('ಸಬ್ಸಿಡಿ') ||
      q.includes('ಪಿಎಂ ಕಿಸಾನ್') ||
      q.includes('ರೈತ ಸಿರಿ') ||
      q.includes('ಗೃಹಲಕ್ಷ್ಮಿ') ||
      q.includes('ಅನ್ನಭಾಗ್ಯ') ||
      q.includes('ಗಂಗಾ ಕಲ್ಯಾಣ')
    ) {
      return {
        answer_en: 'Key farmer schemes available at Grama Panchayat: PM-Kisan (₹6,000/year), Raitha Siri for millets, Ganga Kalyana borewell scheme, and crop insurance (Fasal Bima). Apply at Panchayat or Raitha Samparka Kendra.',
        answer_kn: 'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಮೂಲಕ ಲಭ್ಯವಿರುವ ಪ್ರಮುಖ ಯೋಜನೆಗಳು: ಪಿಎಂ-ಕಿಸಾನ್, ಸಿರಿಧಾನ್ಯ ಬೆಳೆಗಾರರಿಗೆ ರೈತ ಸಿರಿ, ಗಂಗಾ ಕಲ್ಯಾಣ ಉಚಿತ ಬೋರ್‌ವೆಲ್ ಹಾಗೂ ಬೆಳೆ ವಿಮೆ. ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಹೊಸದುರ್ಗದಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.',
        category: 'AGRICULTURE',
        isVerified: true,
        navTab: 'agriculture'
      };
    }

    // 7. Grama Panchayat, Certificates, Property Tax & E-Swathu
    if (
      q.includes('panchayat') ||
      q.includes('certificate') ||
      q.includes('tax') ||
      q.includes('e-swathu') ||
      q.includes('rtc') ||
      q.includes('ಪಂಚಾಯಿತಿ') ||
      q.includes('ಪ್ರಮಾಣಪತ್ರ') ||
      q.includes('ದಾಖಲೆ') ||
      q.includes('ಜನನ') ||
      q.includes('ಮರಣ') ||
      q.includes('ಜಾತಿ') ||
      q.includes('ಆದಾಯ') ||
      q.includes('ಇ-ಸ್ವತ್ತು') ||
      q.includes('ಪಹಣಿ') ||
      q.includes('ತೆರಿಗೆ')
    ) {
      return {
        answer_en: 'Muttagundi Grama Panchayat is open Monday to Saturday, 10:00 AM to 5:30 PM. Services include Birth/Death certificates, Caste/Income certificates, E-Swathu, and Property Tax payments.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಕಚೇರಿ ಸೋಮವಾರದಿಂದ ಶನಿವಾರ ಬೆಳಿಗ್ಗೆ 10:00 ರಿಂದ ಸಂಜೆ 5:30 ರವರೆಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. ಜನನ/ಮರಣ ಪ್ರಮಾಣಪತ್ರ, ಜಾತಿ/ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ, ಇ-ಸ್ವತ್ತು ಮತ್ತು ಆಸ್ತಿ ತೆರಿಗೆ ಸೇವೆಗಳು ಇಲ್ಲಿ ಲಭ್ಯ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 8. Health, Hospital, Doctor & Emergency (ಆರೋಗ್ಯ ಮತ್ತು ತುರ್ತು)
    if (
      q.includes('emergency') ||
      q.includes('hospital') ||
      q.includes('phc') ||
      q.includes('doctor') ||
      q.includes('ambulance') ||
      q.includes('police') ||
      q.includes('ತುರ್ತು') ||
      q.includes('ಆಸ್ಪತ್ರೆ') ||
      q.includes('ಆಂಬ್ಯುಲೆನ್ಸ್') ||
      q.includes('ವೈದ್ಯ') ||
      q.includes('ಪೊಲೀಸ್') ||
      q.includes('ಆರೋಗ್ಯ') ||
      q.includes('108') ||
      q.includes('112')
    ) {
      return {
        answer_en: 'Emergency Numbers: Call 108 for Medical Ambulance, 112 for Police Assistance. Muttagundi Primary Health Center (PHC) provides 24x7 doctor coordination and emergency medical services.',
        answer_kn: 'ತುರ್ತು ಸಹಾಯವಾಣಿಗಳು: ವೈದ್ಯಕೀಯ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ 108, ಪೊಲೀಸ್ ಸೇವೆಗೆ 112. ಮುತ್ತಾಗೊಂದಿ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ (PHC) 24x7 ವೈದ್ಯರ ಸಂಪರ್ಕ ಹಾಗೂ ತುರ್ತು ಚಿಕಿತ್ಸೆ ನೀಡುತ್ತದೆ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 9. Drinking Water & Lake (ನೀರು & ಕೆರೆ)
    if (
      q.includes('water') ||
      q.includes('lake') ||
      q.includes('borewell') ||
      q.includes('ನೀರು') ||
      q.includes('ಕೆರೆ') ||
      q.includes('ಬೋರ್‌ವೆಲ್') ||
      q.includes('ಜಲಜೀವನ್')
    ) {
      return {
        answer_en: 'Muttagundi has clean drinking water through the Jal Jeevan Mission and village RO water plants. Muttagundi Lake serves as the vital rainwater reservoir recharge lifeline.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಜಲಜೀವನ್ ಮಿಷನ್ ಹಾಗೂ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕಗಳ ಮೂಲಕ ನಿತ್ಯ ನೀರು ಸರಬರಾಜಾಗುತ್ತದೆ. ಮುತ್ತಾಗೊಂದಿ ಕೆರೆಯು ಅಂತರ್ಜಲ ಮರುಪೂರಣದ ಜೀವನಾಡಿಯಾಗಿದೆ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 10. School, Education & Library (ಶಾಲೆ & ಗ್ರಂಥಾಲಯ)
    if (
      q.includes('school') ||
      q.includes('education') ||
      q.includes('library') ||
      q.includes('student') ||
      q.includes('ಶಾಲೆ') ||
      q.includes('ಶಿಕ್ಷಣ') ||
      q.includes('ಗ್ರಂಥಾಲಯ') ||
      q.includes('ವಿದ್ಯಾರ್ಥಿ') ||
      q.includes('ಪುಸ್ತಕ')
    ) {
      return {
        answer_en: 'Muttagundi has Government Higher Primary & High Schools equipped with a digital learning center, sports ground, and midday meal program for all village children.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಮತ್ತು ಪ್ರೌಢಶಾಲೆಗಳಿದ್ದು, ಡಿಜಿಟಲ್ ಗ್ರಂಥಾಲಯ, ಆಟದ ಮೈದಾನ ಹಾಗೂ ಮಧ್ಯಾಹ್ನದ ಬಿಸಿಯೂಟದ ಸೌಲಭ್ಯವಿದೆ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 11. Distance, Route & Travel (ಹೊಸದುರ್ಗ, ಚಿತ್ರದುರ್ಗ ಎಷ್ಟು ದೂರ?)
    if (
      q.includes('distance') ||
      q.includes('route') ||
      q.includes('bus') ||
      q.includes('hosadurga') ||
      q.includes('chitradurga') ||
      q.includes('ದೂರ') ||
      q.includes('ಹೊಸದುರ್ಗ') ||
      q.includes('ಚಿತ್ರದುರ್ಗ') ||
      q.includes('ಬಸ್') ||
      q.includes('ದಾರಿಯೇನು')
    ) {
      return {
        answer_en: 'Muttagundi is 18 km from Hosadurga town, 65 km from Chitradurga district headquarters, and 230 km from Bengaluru. Regular KSRTC and private buses connect via Hosadurga.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮವು ತಾಲೂಕು ಕೇಂದ್ರ ಹೊಸದುರ್ಗದಿಂದ 18 ಕಿ.ಮೀ, ಜಿಲ್ಲಾ ಕೇಂದ್ರ ಚಿತ್ರದುರ್ಗದಿಂದ 65 ಕಿ.ಮೀ ಮತ್ತು ಬೆಂಗಳೂರಿನಿಂದ 230 ಕಿ.ಮೀ ದೂರದಲ್ಲಿದೆ. ಹೊಸದುರ್ಗದಿಂದ ನಿತ್ಯ ಬಸ್ ಸೌಲಭ್ಯವಿದೆ.',
        category: 'STATS',
        isVerified: true,
        navTab: 'map'
      };
    }

    // 12. Village Population & Demographics (ಜನಸಂಖ್ಯೆ & ವಿವರ)
    if (
      q.includes('population') ||
      q.includes('households') ||
      q.includes('pincode') ||
      q.includes('ಜನಸಂಖ್ಯೆ') ||
      q.includes('ಮನೆ') ||
      q.includes('ಪಿನ್‌ಕೋಡ್') ||
      q.includes('ತಾಲೂಕು') ||
      q.includes('ಜಿಲ್ಲೆ')
    ) {
      const stats = dbService['villageStats'];
      return {
        answer_en: `Muttagundi is in Hosadurga Taluk, Chitradurga District, Karnataka (Pincode: 577527). It has ${stats?.population || 3450} residents across ${stats?.households || 820} households with 82.4% literacy rate.`,
        answer_kn: `ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮವು ಕರ್ನಾಟಕದ ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ, ಹೊಸದುರ್ಗ ತಾಲೂಕಿನಲ್ಲಿದೆ (ಪಿನ್‌ಕೋಡ್: 577527). ಗ್ರಾಮದಲ್ಲಿ ಸುಮಾರು ${stats?.population || 3450} ಜನಸಂಖ್ಯೆ, ${stats?.households || 820} ಮನೆಗಳು ಹಾಗೂ ಶೇ. 82.4 ಸಾಕ್ಷರತೆ ಇದೆ.`,
        category: 'STATS',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 13. State & National Leaders & Capitals (ಪ್ರಧಾನಿ, ಮುಖ್ಯಮಂತ್ರಿ, ರಾಜಧಾನಿ)
    if (
      q.includes('prime minister') ||
      q.includes('ಪ್ರಧಾನಿ') ||
      q.includes('pm of india')
    ) {
      return {
        answer_en: 'The Prime Minister of India is Shri Narendra Modi.',
        answer_kn: 'ಭಾರತದ ಗೌರವಾನ್ವಿತ ಪ್ರಧಾನ ಮಂತ್ರಿಗಳು ಶ್ರೀ ನರೇಂದ್ರ ಮೋದಿ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    if (
      q.includes('chief minister') ||
      q.includes('ಮುಖ್ಯಮಂತ್ರಿ') ||
      q.includes('cm of karnataka')
    ) {
      return {
        answer_en: 'The Chief Minister of Karnataka is Shri Siddaramaiah.',
        answer_kn: 'ಕರ್ನಾಟಕದ ಗೌರವಾನ್ವಿತ ಮುಖ್ಯಮಂತ್ರಿಗಳು ಶ್ರೀ ಸಿದ್ಧರಾಮಯ್ಯ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    if (
      q.includes('capital') ||
      q.includes('ರಾಜಧಾನಿ')
    ) {
      if (q.includes('ಕರ್ನಾಟಕ') || q.includes('karnataka')) {
        return {
          answer_en: 'The capital of Karnataka is Bengaluru.',
          answer_kn: 'ಕರ್ನಾಟಕ ರಾಜ್ಯದ ರಾಜಧಾನಿ ಬೆಂಗಳೂರು.',
          category: 'GENERAL',
          isVerified: true,
          navTab: 'home'
        };
      }
      return {
        answer_en: 'The capital of India is New Delhi, and the capital of Karnataka is Bengaluru.',
        answer_kn: 'ಭಾರತದ ರಾಜಧಾನಿ ನವದೆಹಲಿ ಹಾಗೂ ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ ಬೆಂಗಳೂರು.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 14. Fundamental General Science / Common concepts
    if (
      q.includes('what is water') ||
      q.includes('ನೀರು ಎಂದರೇನು') ||
      q.includes('ನೀರು ಅಂದರೇನು')
    ) {
      return {
        answer_en: 'Water (H2O) is a transparent, odorless, and tasteless liquid essential for all known forms of life, plants, and agriculture.',
        answer_kn: 'ನೀರು (H2O) ಜೀವ ಸಂಕುಲ, ಸಸ್ಯವರ್ಗ ಹಾಗೂ ಕೃಷಿಗೆ ಅತ್ಯಂತ ಆವಶ್ಯಕವಾದ ನೈಸರ್ಗಿಕ ಪಾರದರ್ಶಕ ದ್ರವ ಸಂಪನ್ಮೂಲವಾಗಿದೆ.',
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // 15. Latest News Updates (ಸುದ್ದಿ)
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
          answer_en: `Latest village announcement: ${n.title_en}. Visit the News section to read full village notices.`,
          answer_kn: `ಇತ್ತೀಚಿನ ಗ್ರಾಮ ಪ್ರಕಟಣೆ: ${n.title_kn}. ಸಂಪೂರ್ಣ ವಿವರಗಳಿಗಾಗಿ ಸುದ್ದಿ ವಿಭಾಗವನ್ನು ಪರಿಶೀಲಿಸಿ.`,
          category: 'NEWS',
          isVerified: true,
          navTab: 'news'
        };
      }
    }

    // 16. Events & Festivals (ಕಾರ್ಯಕ್ರಮ & ಹಬ್ಬ)
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
          answer_en: `Upcoming village event: ${e.title_en} on ${e.date} at ${e.venue_en}.`,
          answer_kn: `ಮುಂಬರುವ ಗ್ರಾಮದ ಕಾರ್ಯಕ್ರಮ: ${e.title_kn}, ದಿನಾಂಕ: ${e.date}, ಸ್ಥಳ: ${e.venue_kn}.`,
          category: 'EVENTS',
          isVerified: true,
          navTab: 'events'
        };
      }
    }

    // 17. Navigation Direct Commands
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

    if (q.includes('people') || q.includes('resident') || q.includes('ಜನರು') || q.includes('ಗ್ರಾಮಸ್ಥರು')) {
      return {
        answer_en: 'Opening the Village People Directory to discover residents, farmers, and community profiles.',
        answer_kn: 'ಗ್ರಾಮಸ್ಥರು ಹಾಗೂ ರೈತರ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಜನರು ವಿಭಾಗವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
        category: 'PEOPLE',
        isVerified: true,
        navTab: 'people'
      };
    }

    return null;
  }

  /**
   * Dynamic, intelligent fallback tailored specifically to the user's question.
   * This guarantees that different questions NEVER get the same canned answer.
   */
  private getSmartDynamicFallback(rawPrompt: string, q: string, lang: Language): VoiceQueryResponse {
    // Math / Calculations
    const mathMatch = q.match(/(\d+)\s*([\+\-\*\/]|plus|minus|into|times|divided by|ಭಾಗಿಸು|ಗುಣಿಸು|ಕೂಡಿಸು|ಕಳೆ)\s*(\d+)/i);
    if (mathMatch) {
      const n1 = parseInt(mathMatch[1], 10);
      const op = mathMatch[2].toLowerCase();
      const n2 = parseInt(mathMatch[3], 10);
      let res = 0;
      if (op === '+' || op.includes('plus') || op.includes('ಕೂಡಿಸು')) res = n1 + n2;
      else if (op === '-' || op.includes('minus') || op.includes('ಕಳೆ')) res = n1 - n2;
      else if (op === '*' || op.includes('into') || op.includes('times') || op.includes('ಗುಣಿಸು')) res = n1 * n2;
      else if (op === '/' || op.includes('divided') || op.includes('ಭಾಗಿಸು')) res = n2 !== 0 ? Math.round((n1 / n2) * 100) / 100 : 0;
      return {
        answer_en: `The calculation result of ${n1} and ${n2} is ${res}.`,
        answer_kn: `${n1} ಮತ್ತು ${n2} ಲೆಕ್ಕಾಚಾರದ ಉತ್ತರ ${res} ಆಗಿದೆ.`,
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // Time & Date queries
    if (q.includes('time') || q.includes('date') || q.includes('ಸಮಯ') || q.includes('ದಿನಾಂಕ') || q.includes('ಗಂಟೆ')) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return {
        answer_en: `Current time is ${timeStr}, on ${dateStr}.`,
        answer_kn: `ಪ್ರಸ್ತುತ ಸಮಯ ${timeStr}, ದಿನಾಂಕ: ${dateStr}.`,
        category: 'GENERAL',
        isVerified: true,
        navTab: 'home'
      };
    }

    // "How to" / Guidance questions
    if (q.startsWith('how') || q.includes('ಹೇಗೆ') || q.includes('ವಿಧಾನ')) {
      return {
        answer_en: `Regarding "${rawPrompt}": For complete guidance and applications, please visit the relevant village section or reach out to our community members in Messages.`,
        answer_kn: `"${rawPrompt}" ಕುರಿತು: ಸಂಪೂರ್ಣ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನಮ್ಮ ಗ್ರಾಮ ಪೋರ್ಟಲ್‌ನ ಸಂಬಂಧಪಟ್ಟ ವಿಭಾಗವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಸಂದೇಶಗಳ ಮೂಲಕ ಸಂಪರ್ಕಿಸಿ.`,
        category: 'GENERAL',
        isVerified: false,
        navTab: 'home'
      };
    }

    // "Where is" / Location questions
    if (q.startsWith('where') || q.includes('ಎಲ್ಲಿ') || q.includes('ಸ್ಥಳ')) {
      return {
        answer_en: `Regarding the location for "${rawPrompt}": Muttagundi is in Hosadurga Taluk, Chitradurga. Open our interactive Village Map to explore all village landmarks and routes.`,
        answer_kn: `"${rawPrompt}" ಸ್ಥಳದ ವಿವರ: ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮವು ಹೊಸದುರ್ಗ ತಾಲೂಕಿನಲ್ಲಿದೆ. ನಮ್ಮ ಗ್ರಾಮದ ನಕ್ಷೆ ವಿಭಾಗದಲ್ಲಿ ರಸ್ತೆ ಹಾಗೂ ಸ್ಥಳಗಳ ನಿಖರ ದಾರಿ ನೋಡಬಹುದು.`,
        category: 'MAP',
        isVerified: false,
        navTab: 'map'
      };
    }

    // "Who is" questions
    if (q.startsWith('who') || q.includes('ಯಾರು')) {
      return {
        answer_en: `Regarding "${rawPrompt}": In Muttagundi, our community directory lists local village leaders, elders, and achievers. Browse our People section for details.`,
        answer_kn: `"${rawPrompt}" ಕುರಿತು: ನಮ್ಮ ಗ್ರಾಮ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಮುತ್ತಾಗೊಂದಿಯ ಪ್ರಮುಖ ವ್ಯಕ್ತಿಗಳು ಮತ್ತು ಸಾಧಕರ ವಿವರಗಳು ಲಭ್ಯವಿದೆ. ಜನರು ವಿಭಾಗದಲ್ಲಿ ನೋಡಿ.`,
        category: 'PEOPLE',
        isVerified: false,
        navTab: 'people'
      };
    }

    // Dynamic tailored answer incorporating the user's specific prompt
    return {
      answer_en: `For your question on "${rawPrompt}": Information is available across our village sections including Agriculture, Temples, Sports, and News.`,
      answer_kn: `ನಿಮ್ಮ "${rawPrompt}" ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ: ಕೃಷಿ, ದೇವಾಲಯಗಳು, ಕ್ರೀಡೆ ಅಥವಾ ಪಂಚಾಯಿತಿ ವಿಭಾಗಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು.`,
      category: 'GENERAL',
      isVerified: false,
      navTab: 'home'
    };
  }
}

export const voiceAssistant = new VoiceAssistantService();
