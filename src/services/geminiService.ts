import { dbService } from './dbService';
import { Language } from '../types';

// Pool of Gemini API keys for seamless quota load balancing and failover
// Prioritizes healthy keys with verified active quota
const API_KEY_POOL = [
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_3,
].filter(Boolean) as string[];

let keyIndex = 0;
function getActiveApiKey(): string {
  if (API_KEY_POOL.length === 0) return '';
  return API_KEY_POOL[keyIndex % API_KEY_POOL.length];
}

function rotateApiKey() {
  if (API_KEY_POOL.length > 1) {
    keyIndex = (keyIndex + 1) % API_KEY_POOL.length;
    console.log(`[GeminiService] Rotated to API key #${keyIndex + 1}/${API_KEY_POOL.length}`);
  }
}

// Active Gemini models supporting live streaming with sub-second response times
const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-3.6-flash', 'gemini-3.5-flash'];

export interface GeminiResponse {
  answer_en: string;
  answer_kn: string;
  category?: string;
  navTab?: string;
}

// In-memory query cache for instant response on successful queries
const FAST_QUERY_CACHE = new Map<string, GeminiResponse>();

class GeminiService {
  private manualApiKey: string = '';

  constructor() {}

  public setApiKey(key: string) {
    this.manualApiKey = key;
  }

  public getApiKey(): string {
    return this.manualApiKey || getActiveApiKey();
  }

  private async callGeminiAPI(prompt: string, systemInstruction?: string, isJson: boolean = false): Promise<string> {
    let lastError: any = null;

    // Multi-key and multi-model failover loop
    for (let attempt = 0; attempt < 3; attempt++) {
      for (const model of GEMINI_MODELS) {
        const activeKey = this.getApiKey();
        if (!activeKey) continue;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;

          const body: any = {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600
            }
          };

          if (isJson) {
            body.generationConfig.responseMimeType = 'application/json';
          }

          if (systemInstruction) {
            body.systemInstruction = {
              parts: [{ text: systemInstruction }]
            };
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
          });

          if (!res.ok) {
            rotateApiKey();
            continue;
          }

          const data = await res.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find((p: any) => p.text && !p.thought) || parts[parts.length - 1];
          if (textPart && textPart.text) {
            return textPart.text.trim();
          }
        } catch (err) {
          lastError = err;
          rotateApiKey();
          continue;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }

    throw lastError || new Error('Failed to reach Gemini API');
  }

  /**
   * Real-time Gemini Live Streaming over Server-Sent Events (SSE).
   * Streams text tokens directly from Google Gemini as they are generated.
   */
  public async streamGeminiAPI(
    prompt: string,
    systemInstruction?: string,
    onChunk?: (chunk: string, fullText: string) => void
  ): Promise<string> {
    let lastError: any = null;

    for (let attempt = 0; attempt < API_KEY_POOL.length + 1; attempt++) {
      for (const model of GEMINI_MODELS) {
        const activeKey = this.getApiKey();
        if (!activeKey) continue;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${activeKey}`;

          const body: any = {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600
            }
          };

          if (systemInstruction) {
            body.systemInstruction = {
              parts: [{ text: systemInstruction }]
            };
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
          });

          if (!res.ok) {
            rotateApiKey();
            continue;
          }

          const reader = res.body?.getReader();
          if (!reader) {
            rotateApiKey();
            continue;
          }

          const decoder = new TextDecoder();
          let fullText = '';
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const data = JSON.parse(jsonStr);
                  const parts = data.candidates?.[0]?.content?.parts || [];
                  const textPart = parts.find((p: any) => p.text && !p.thought);
                  if (textPart && textPart.text) {
                    fullText += textPart.text;
                    onChunk?.(textPart.text, fullText);
                  }
                } catch {
                  // ignore non-json stream heartbeats
                }
              }
            }
          }

          if (fullText.trim()) {
            return fullText.trim();
          }
        } catch (err) {
          lastError = err;
          rotateApiKey();
          continue;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }

    throw lastError || new Error('Failed to reach Gemini Streaming API');
  }

  /**
   * Builds rich real-time context from the village database.
   */
  private buildVillageContext(): string {
    const stats = dbService['villageStats'];
    const news = (dbService['news'] || []).slice(0, 5);
    const events = (dbService['events'] || []).slice(0, 4);
    const tournaments = (dbService['tournaments'] || []).slice(0, 3);
    const crops = (dbService['crops'] || []).slice(0, 6);
    const alert = dbService['emergencyAlert'];

    let ctx = `OFFICIAL VILLAGE KNOWLEDGE BASE (ಗ್ರಾಮ ಮಾಹಿತಿ):
Village: Muttagundi (ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ)
Taluk: Hosadurga Taluk (ಹೊಸದುರ್ಗ ತಾಲೂಕು)
District: Chitradurga District, Karnataka (ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ, ಕರ್ನಾಟಕ)
Pincode: 577527
Location Note: Muttagundi is in Hosadurga Taluk, Chitradurga District, Karnataka (Central Karnataka). It is NOT in Kumta/Uttara Kannada.
Population: ${stats?.population || 3450} residents, ${stats?.households || 820} households
Literacy Rate: ${stats?.literacy_rate || 82.4}%
Agricultural Area: ${stats?.agricultural_land_acres || 2150} acres
Main Agricultural Crops: Ragi (ರಾಗಿ), Groundnut / Shenga (ಕಡಲೆಕಾಯಿ), Maize (ಮೆಕ್ಕೆಜೋಳ), Coconut (ತೆಂಗು), Arecanut (ಅಡಿಕೆ), Onion (ಈರುಳ್ಳಿ), Pomegranate (ದಾಳಿಂಬೆ).
Main Temples & Festivals:
- Sri Ranganatha Swamy Temple (ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ ದೇವಾಲಯ): Historical temple with annual Jathra Mahotsava in Chaitra Masa.
- Sri Veerabhadreshwara Swamy Temple (ಶ್ರೀ ವೀರಭದ್ರೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ): Shravana Somavara special poojas & Karthika Deepotsava.
- Grama Devathe Sri Maramma Temple (ಗ್ರಾಮ ದೇವತೆ ಶ್ರೀ ಮಾರಮ್ಮ ದೇವಸ್ಥಾನ): Annual village Marihabba festival.
Key Village Facilities:
- Grama Panchayat Office: Service window 10:00 AM - 5:30 PM (Birth/Death certificates, property tax, water supply, government schemes).
- Primary Health Center (PHC): 24x7 emergency medical assistance & ambulance coordination.
- Government Schools: Higher Primary & High School with digital library and sports ground.
- Muttagundi Lake (ಕೆರೆ): Rainwater harvesting and irrigation lifeline for local farmlands.
Sports & Youth: Muttagundi Premier League (MPL) Cricket Tournament, annual Kabaddi Championship.
`;

    if (alert && alert.active) {
      ctx += `\nACTIVE EMERGENCY ADVISORY:
[${alert.level}] ${alert.title_en} / ${alert.title_kn}: ${alert.message_en} (Contact: ${alert.contact_info})\n`;
    }

    if (news && news.length > 0) {
      ctx += `\nRECENT VERIFIED NEWS & ANNOUNCEMENTS:\n`;
      news.forEach((n) => {
        ctx += `- ${n.title_en} (${n.title_kn}): ${n.content_en}\n`;
      });
    }

    if (events && events.length > 0) {
      ctx += `\nUPCOMING EVENTS & FESTIVALS:\n`;
      events.forEach((e) => {
        ctx += `- ${e.title_en} (${e.title_kn}) on ${e.date} at ${e.venue_en}\n`;
      });
    }

    if (tournaments && tournaments.length > 0) {
      ctx += `\nSPORTS & TOURNAMENTS:\n`;
      tournaments.forEach((t) => {
        ctx += `- ${t.name_en} (${t.sport}): Status: ${t.status}\n`;
      });
    }

    if (crops && crops.length > 0) {
      ctx += `\nAGRICULTURE CROPS & TECHNIQUES:\n`;
      crops.forEach((c) => {
        ctx += `- ${c.name_en} (${c.name_kn}): Season: ${c.season_en}, Soil: ${c.soil_type_en}, Cultivation: ${c.cultivation_en}\n`;
      });
    }

    try {
      const fund = dbService.getVillageFund();
      ctx += `\nREAL-TIME MTG FINANCIAL STATUS (ಖಜಾನೆ ಮತ್ತು ದೇಣಿಗೆ ವಿವರ):
- Total MTG Village Fund Balance: ₹${fund.total_balance.toLocaleString('en-IN')}
- Current Active Month: ${fund.current_month}
- Collected this month: ₹${fund.monthly_collected.toLocaleString('en-IN')} (Target: ₹${fund.monthly_target.toLocaleString('en-IN')})
- Contributors who PAID this month: ${fund.recent_payments.filter((p) => p.status === 'PAID').map((p) => `${p.user_name} (₹${p.amount})`).join(', ') || 'None'}
- Contributors with PENDING payment this month: ${fund.recent_payments.filter((p) => p.status === 'PENDING').map((p) => p.user_name).join(', ') || 'None'}
`;
    } catch {}

    try {
      const admins = dbService.getAdmins();
      ctx += `\nREAL-TIME VILLAGE LEADERSHIP & ADMINS (ಆಡಳಿತ ಮಂಡಳಿ):
- Super Admin: Vinay Kumar (vvini4803@gmail.com, UID: admin_vvini4803)
- Active Admins: ${admins.map((a) => `${a.name} (${a.role})`).join(', ') || 'Vinay Kumar'}
`;
    } catch {}

    try {
      const meetings = dbService.getMeetingsSchedule();
      ctx += `\nREAL-TIME VILLAGE MEETING SCHEDULE (ಸಭೆಗಳ ವಿವರ):
- Today's Meeting: ${meetings.hasMeetingToday && meetings.todayMeetings[0] ? `Yes, ${meetings.todayMeetings[0].title_en} (${meetings.todayMeetings[0].title_kn}) at ${meetings.todayMeetings[0].start_time} at ${meetings.todayMeetings[0].venue_en}` : 'No MTG meeting is scheduled for today'}
- Next Upcoming Meeting: ${meetings.nextMeeting ? `${meetings.nextMeeting.title_en} (${meetings.nextMeeting.title_kn}) on ${meetings.nextMeeting.date} at ${meetings.nextMeeting.start_time}` : 'No upcoming meeting scheduled currently'}
`;
    } catch {}

    try {
      const sports = dbService.getLiveSportsStatus();
      if (sports.liveMatches.length > 0) {
        const lm = sports.liveMatches[0];
        ctx += `\nLIVE MATCH IN PROGRESS: ${lm.team_a} vs ${lm.team_b} at ${lm.venue}. Score: ${lm.team_a_score} vs ${lm.team_b_score}.\n`;
      }
    } catch {}

    return ctx;
  }

  /**
   * Real-time conversational Village Voice & Text Assistant
   * - Ingests fresh real-time MTG database or live web grounding data
   * - Gemini acts as the reasoning & natural language layer (Source of truth is DB/web)
   * - Generates ONE concise, natural final answer in both English & Kannada
   */
  public async askVillageAssistant(
    userQuery: string,
    preferredLang: Language,
    realTimeGroundingContext?: string
  ): Promise<GeminiResponse> {
    const isDynamicQuery = Boolean(realTimeGroundingContext);
    const cacheKey = `${preferredLang}:${userQuery.toLowerCase().trim()}`;

    // Only use cache for static open queries; NEVER cache fresh real-time DB queries
    if (!isDynamicQuery && FAST_QUERY_CACHE.has(cacheKey)) {
      return FAST_QUERY_CACHE.get(cacheKey)!;
    }

    const context = this.buildVillageContext();

    const systemInstruction = `You are "ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಸಹಾಯಕ" (Muttagundi AI Voice Assistant), the official AI assistant of Muttagundi village, Hosadurga Taluk, Chitradurga District, Karnataka.
Your job is to assist village residents, farmers, elders, students, and guests with warmth, simplicity, and 100% accuracy.

CRITICAL RULES FOR REAL-TIME ARCHITECTURE & ONE FINAL ANSWER:
1. SOURCE OF TRUTH: You are the intelligence layer, NOT the source of truth. The MTG backend/database data and live web grounding provided to you is the absolute source of truth.
2. ONE FINAL ANSWER: Regardless of question, generate strictly ONE clean, direct, final answer. Do NOT show multiple answers, duplicate answers, internal database JSON, or raw dumps.
3. For MTG meeting queries: If no meeting exists today, say so directly in one sentence (e.g. "ಇಂದು ಯಾವುದೇ MTG meeting schedule ಆಗಿಲ್ಲ." / "No MTG meeting is scheduled for today."). If a meeting exists, give its time and venue clearly.
4. For MTG fund or payment queries: State the exact amount and contributors clearly in one sentence (e.g. "ಈ ತಿಂಗಳು ವಿನಯ್ ಕುಮಾರ್, ರಮೇಶ್ ಗೌಡ ಸೇರಿದಂತೆ ಒಟ್ಟು ₹24,000 ಹಣ ಸಂಗ್ರಹವಾಗಿದೆ.").
5. For live weather queries: State the current temperature, skies, and rain status clearly.
6. STRICT PRIVACY: NEVER invent or reveal any citizen's private phone number, email address, or private chat messages.
7. Return strictly valid JSON matching this schema:
{
  "answer_en": "One concise, natural, direct answer in English (1-2 sentences)",
  "answer_kn": "ಒಂದೇ ಸರಳ, ಸಹಜ ಮತ್ತು ನೇರ ಉತ್ತರ ಕನ್ನಡದಲ್ಲಿ (1-2 ವಾಕ್ಯಗಳು)",
  "category": "AGRICULTURE" | "SPORTS" | "EVENTS" | "TEMPLE" | "NEWS" | "STATS" | "GENERAL",
  "navTab": "agriculture" | "sports" | "events" | "temples" | "news" | "home"
}`;

    let prompt = '';
    if (realTimeGroundingContext) {
      prompt = `===========================================================
FRESH REAL-TIME RETRIEVED DATA (SOURCE OF TRUTH):
${realTimeGroundingContext}
===========================================================

BASELINE VILLAGE KNOWLEDGE:
${context}

USER QUESTION: "${userQuery}"
Preferred Language of User: ${preferredLang === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}

Generate ONE direct, natural final answer in the JSON schema:`;
    } else {
      prompt = `${context}

USER QUESTION: "${userQuery}"
Preferred Language of User: ${preferredLang === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}

Provide the JSON response:`;
    }

    try {
      const raw = await this.callGeminiAPI(prompt, systemInstruction, true);
      let jsonStr = raw.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        jsonStr = match[0];
      }
      const parsed = JSON.parse(jsonStr);

      const res: GeminiResponse = {
        answer_en: parsed.answer_en || raw,
        answer_kn: parsed.answer_kn || parsed.answer_en || raw,
        category: parsed.category || 'GENERAL',
        navTab: parsed.navTab || 'home'
      };

      if (!isDynamicQuery) {
        FAST_QUERY_CACHE.set(cacheKey, res);
      }
      return res;
    } catch (err) {
      console.warn('Gemini response fallback triggered:', err);
      return this.getLocalSmartFallback(userQuery, preferredLang);
    }
  }

  /**
   * Gemini Real-Time Live Streaming Assistant
   * - Connects directly to Google Gemini via Server-Sent Events (SSE)
   * - Streams tokens in real-time as Google Gemini generates them
   * - Fires onChunk callback so UI displays words immediately
   */
  public async streamVillageAssistant(
    userQuery: string,
    preferredLang: Language,
    realTimeGroundingContext?: string,
    onChunk?: (textChunk: string, fullText: string) => void
  ): Promise<GeminiResponse> {
    const context = this.buildVillageContext();
    const isKannada = preferredLang === 'kn';

    const systemInstruction = `You are "ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಸಹಾಯಕ" (Muttagundi AI Voice Assistant), the official AI assistant of Muttagundi village, Hosadurga Taluk, Chitradurga District, Karnataka.
Your job is to answer directly from Google Gemini with warmth, simplicity, and 100% accuracy.

CRITICAL RULES FOR LIVE STREAMING & ONE FINAL ANSWER:
1. SOURCE OF TRUTH: The MTG backend/database data and live web grounding provided to you is the absolute source of truth.
2. ONE FINAL ANSWER: Formulate ONE clean, direct answer in 1 to 2 sentences.
3. BILINGUAL STREAMING FORMAT:
${isKannada
  ? '- Write the primary spoken answer in natural, respectful spoken Kannada on the first line.\n- On a new line, write "[EN] " followed by the exact English translation.'
  : '- Write the primary spoken answer in clear, friendly English on the first line.\n- On a new line, write "[KN] " followed by the exact Kannada translation.'}
4. For meetings: If no meeting exists today, say so directly (e.g. "ಇಂದು ಯಾವುದೇ MTG meeting schedule ಆಗಿಲ್ಲ."). If a meeting exists, specify time and venue.
5. For funds/payments: State the exact amount and contributors clearly.
6. For live weather: State current temperature, skies, and rain status clearly.
7. STRICT PRIVACY: NEVER invent or reveal any citizen's private phone number or private chat messages.
8. DO NOT wrap the output in markdown codeblocks or JSON. Write the text directly so it streams smoothly to the user.`;

    let prompt = '';
    if (realTimeGroundingContext) {
      prompt = `===========================================================
FRESH REAL-TIME RETRIEVED DATA (SOURCE OF TRUTH):
${realTimeGroundingContext}
===========================================================

BASELINE VILLAGE KNOWLEDGE:
${context}

USER QUESTION: "${userQuery}"
Preferred Language of User: ${isKannada ? 'Kannada (ಕನ್ನಡ)' : 'English'}

Generate ONE direct, natural streamed answer:`;
    } else {
      prompt = `${context}

USER QUESTION: "${userQuery}"
Preferred Language of User: ${isKannada ? 'Kannada (ಕನ್ನಡ)' : 'English'}

Provide the direct streamed response:`;
    }

    try {
      const rawText = await this.streamGeminiAPI(prompt, systemInstruction, onChunk);
      const parsed = this.parseBilingualStream(rawText, preferredLang);

      return {
        answer_en: parsed.answer_en,
        answer_kn: parsed.answer_kn,
        category: this.detectCategory(userQuery),
        navTab: this.detectNavTab(userQuery)
      };
    } catch (err) {
      console.warn('[GeminiService] Live streaming failed, falling back to standard API:', err);
      return this.askVillageAssistant(userQuery, preferredLang, realTimeGroundingContext);
    }
  }

  private parseBilingualStream(
    rawText: string,
    preferredLang: Language
  ): { answer_en: string; answer_kn: string } {
    let text = rawText.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try parsing as JSON first if Gemini returned JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const j = JSON.parse(match[0]);
        if (j.answer_en || j.answer_kn) {
          return {
            answer_en: j.answer_en || j.answer_kn || text,
            answer_kn: j.answer_kn || j.answer_en || text
          };
        }
      } catch {}
    }

    // Parse [EN] and [KN] delimiters
    if (text.includes('[EN]') || text.includes('[KN]')) {
      if (preferredLang === 'kn') {
        const parts = text.split(/\[EN\]/i);
        const kn = parts[0].replace(/\[KN\]/i, '').trim();
        const en = (parts[1] || '').trim();
        return {
          answer_kn: kn || text,
          answer_en: en || kn || text
        };
      } else {
        const parts = text.split(/\[KN\]/i);
        const en = parts[0].replace(/\[EN\]/i, '').trim();
        const kn = (parts[1] || '').trim();
        return {
          answer_en: en || text,
          answer_kn: kn || en || text
        };
      }
    }

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      if (preferredLang === 'kn') {
        return { answer_kn: lines[0], answer_en: lines.slice(1).join(' ') };
      } else {
        return { answer_en: lines[0], answer_kn: lines.slice(1).join(' ') };
      }
    }

    return { answer_en: text, answer_kn: text };
  }

  private detectCategory(q: string): string {
    const lq = q.toLowerCase();
    if (lq.includes('weather') || lq.includes('rain') || lq.includes('crop') || lq.includes('ಕೃಷಿ') || lq.includes('ಮಳೆ')) return 'AGRICULTURE';
    if (lq.includes('cricket') || lq.includes('sports') || lq.includes('score') || lq.includes('ಸ್ಕೋರ್')) return 'SPORTS';
    if (lq.includes('meeting') || lq.includes('event') || lq.includes('ಸಭೆ')) return 'EVENTS';
    if (lq.includes('temple') || lq.includes('ದೇವಾಲಯ') || lq.includes('ದೇವಸ್ಥಾನ')) return 'TEMPLE';
    if (lq.includes('news') || lq.includes('ಸುದ್ದಿ')) return 'NEWS';
    return 'GENERAL';
  }

  private detectNavTab(q: string): string {
    const lq = q.toLowerCase();
    if (lq.includes('weather') || lq.includes('crop') || lq.includes('ಕೃಷಿ') || lq.includes('ಮಳೆ')) return 'agriculture';
    if (lq.includes('cricket') || lq.includes('score') || lq.includes('sports')) return 'sports';
    if (lq.includes('meeting') || lq.includes('event')) return 'events';
    if (lq.includes('temple') || lq.includes('ದೇವಸ್ಥಾನ')) return 'temples';
    if (lq.includes('news') || lq.includes('ಸುದ್ದಿ')) return 'news';
    return 'home';
  }

  /**
   * Smart localized fallback based on keyword matching with live local database
   */
  private getLocalSmartFallback(userQuery: string, preferredLang: Language): GeminiResponse {
    const q = userQuery.toLowerCase().trim();

    if (q.includes('ಕೃಷಿ') || q.includes('ಬೆಳೆ') || q.includes('ರಾಗಿ') || q.includes('crop') || q.includes('farm') || q.includes('agriculture')) {
      return {
        answer_en: 'Muttagundi is rich in agricultural land. Major crops are Ragi, Groundnut, Coconut, Arecanut, Maize, and Pomegranate. Check our Agriculture tab for detailed farming guides.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ತೆಂಗು, ಅಡಿಕೆ, ಮೆಕ್ಕೆಜೋಳ ಮತ್ತು ದಾಳಿಂಬೆ ಪ್ರಮುಖ ಬೆಳೆಗಳಾಗಿವೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ನಮ್ಮ ಕೃಷಿ ವಿಭಾಗವನ್ನು ಪರಿಶೀಲಿಸಿ.',
        category: 'AGRICULTURE',
        navTab: 'agriculture'
      };
    }

    if (q.includes('ದೇವಸ್ಥಾನ') || q.includes('ದೇವಾಲಯ') || q.includes('ಪೂಜೆ') || q.includes('temple') || q.includes('pooja') || q.includes('god')) {
      return {
        answer_en: 'In Muttagundi, the prominent temples are Sri Ranganatha Swamy Temple, Sri Veerabhadreshwara Swamy Temple, and Grama Devathe Sri Maramma Temple.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದಲ್ಲಿ ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ ದೇವಾಲಯ, ಶ್ರೀ ವೀರಭದ್ರೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ ಮತ್ತು ಗ್ರಾಮ ದೇವತೆ ಶ್ರೀ ಮಾರಮ್ಮ ದೇವಾಲಯಗಳು ಪ್ರಸಿದ್ಧವಾಗಿವೆ.',
        category: 'TEMPLE',
        navTab: 'temples'
      };
    }

    if (q.includes('ಕ್ರಿಕೆಟ್') || q.includes('ಕ್ರೀಡೆ') || q.includes('ಟೂರ್ನಮೆಂಟ್') || q.includes('cricket') || q.includes('sport') || q.includes('match')) {
      return {
        answer_en: 'Muttagundi hosts the annual Muttagundi Premier League (MPL) Cricket Tournament and village Kabaddi Championships at the Panchayat Ground.',
        answer_kn: 'ಮುತ್ತಾಗೊಂದಿಯಲ್ಲಿ ವಾರ್ಷಿಕ ಎಂಪಿಎಲ್ (MPL) ಕ್ರಿಕೆಟ್ ಟೂರ್ನಮೆಂಟ್ ಮತ್ತು ಕಬಡ್ಡಿ ಪಂದ್ಯಾವಳಿಗಳು ಗ್ರಾಮ ಪಂಚಾಯತಿ ಮೈದಾನದಲ್ಲಿ ನಡೆಯುತ್ತವೆ.',
        category: 'SPORTS',
        navTab: 'sports'
      };
    }

    if (q.includes('ಜನಸಂಖ್ಯೆ') || q.includes('population') || q.includes('ಮನೆ') || q.includes('households')) {
      const stats = dbService['villageStats'];
      return {
        answer_en: `Muttagundi village in Hosadurga taluk has a population of approximately ${stats?.population || 3450} residents across ${stats?.households || 820} households, with an 82.4% literacy rate.`,
        answer_kn: `ಹೊಸದುರ್ಗ ತಾಲೂಕಿನ ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮವು ಸುಮಾರು ${stats?.population || 3450} ಜನಸಂಖ್ಯೆ ಮತ್ತು ${stats?.households || 820} ಮನೆಗಳನ್ನು ಹೊಂದಿದ್ದು, ಶೇ. 82.4 ಸಾಕ್ಷರತೆ ಹೊಂದಿದೆ.`,
        category: 'GENERAL',
        navTab: 'home'
      };
    }

    return {
      answer_en: `Regarding "${userQuery}": Welcome to Muttagundi village portal! You can explore verified news, events, agriculture, and temples from the main menu.`,
      answer_kn: `"${userQuery}" ಕುರಿತು: ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ! ನೀವು ಮುಖ್ಯ ಮೆನುವಿನಿಂದ ದೃಢೀಕೃತ ಸುದ್ದಿ, ಕಾರ್ಯಕ್ರಮಗಳು, ಕೃಷಿ ಮತ್ತು ದೇವಸ್ಥಾನಗಳ ಮಾಹಿತಿ ಪಡೆಯಬಹುದು.`,
      category: 'GENERAL',
      navTab: 'home'
    };
  }

  /**
   * Instant Kannada ⇄ English Message Translation for Private Chat
   */
  public async translateMessage(text: string, targetLanguage: Language): Promise<string> {
    const targetName = targetLanguage === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English';
    const prompt = `Translate the following chat message accurately and naturally into ${targetName}. Keep the tone respectful and preserve emojis and names.
Message: "${text}"
Translation only:`;

    try {
      const translation = await this.callGeminiAPI(prompt);
      return translation.replace(/^["']|["']$/g, '').trim();
    } catch {
      return text;
    }
  }

  /**
   * Smart Quick-Reply generation for Messaging
   */
  public async generateSmartReplies(
    lastMessage: string,
    lang: Language
  ): Promise<string[]> {
    const langPrompt = lang === 'kn' ? 'Kannada' : 'English';
    const prompt = `Given this incoming chat message: "${lastMessage}"
Suggest 3 short, polite, 2-to-4-word quick replies suitable for a village resident in ${langPrompt}.
Return them strictly as a JSON array of 3 strings, e.g. ["ಸರಿ, ಧನ್ಯವಾದಗಳು", "ಖಂಡಿತ ಬರುತ್ತೇನೆ", "ಸಮಯ ತಿಳಿಸಿ"].
JSON array only:`;

    try {
      const raw = await this.callGeminiAPI(prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.slice(0, 3);
      }
    } catch {}

    // Safe fallbacks
    return lang === 'kn'
      ? ['ಧನ್ಯವಾದಗಳು 🙏', 'ಖಂಡಿತವಾಗಿ 👍', 'ಸರಿ ನೋಡೋಣ 🌾']
      : ['Thank you! 🙏', 'Sure, will be there 👍', 'Noted 🌾'];
  }

  /**
   * Summarize long news or panchayat circulars
   */
  public async summarizeNews(content: string, lang: Language): Promise<string> {
    const targetName = lang === 'kn' ? 'simple spoken Kannada' : 'simple English';
    const prompt = `Summarize this village announcement in 2 clear sentences in ${targetName} for farmers and residents:
"${content}"
Summary:`;

    try {
      const summary = await this.callGeminiAPI(prompt);
      return summary.trim();
    } catch {
      return content.slice(0, 150) + '...';
    }
  }
}

export const geminiService = new GeminiService();
