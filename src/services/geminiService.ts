import { dbService } from './dbService';
import { Language } from '../types';

// Pool of Gemini API keys for seamless quota load balancing and failover
const API_KEY_POOL = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
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

// Default models validated on the account
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];

export interface GeminiResponse {
  answer_en: string;
  answer_kn: string;
  category?: string;
  navTab?: string;
}

class GeminiService {
  private manualApiKey: string = '';

  constructor() {}

  public setApiKey(key: string) {
    this.manualApiKey = key;
  }

  public getApiKey(): string {
    return this.manualApiKey || getActiveApiKey();
  }

  private async callGeminiAPI(prompt: string, systemInstruction?: string): Promise<string> {
    let lastError: any = null;

    for (const model of GEMINI_MODELS) {
      const activeKey = getActiveApiKey();
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
            temperature: 0.4,
            maxOutputTokens: 800
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
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errorMsg = errData?.error?.message || `HTTP ${res.status}`;
          // If rate limited or quota exceeded, rotate key
          if (res.status === 429 || res.status === 403) {
            rotateApiKey();
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text.trim();
        }
      } catch (err) {
        lastError = err;
        rotateApiKey();
        continue; // try next key or model
      }
    }

    throw lastError || new Error('Failed to reach Gemini API');
  }

  /**
   * Builds rich real-time context from the village database.
   */
  private buildVillageContext(): string {
    const stats = dbService['villageStats'];
    const news = dbService['news']?.slice(0, 4);
    const events = dbService['events']?.slice(0, 3);
    const tournaments = dbService['tournaments']?.slice(0, 2);
    const crops = dbService['crops']?.slice(0, 4);
    const alert = dbService['emergencyAlert'];

    let ctx = `VILLAGE KNOWLEDGE BASE:
Village Name: Gramasiri (ನಮ್ಮ ಗ್ರಾಮಸಿರಿ), Karnataka
Population: ${stats?.population || 4820} residents, ${stats?.households || 1120} households
Literacy Rate: ${stats?.literacy_rate || 84.6}%
Agricultural Area: ${stats?.agricultural_land_acres || 2450} acres
Main Crops: ${stats?.main_crops_en || 'Ragi, Arecanut, Coconut, Paddy, Pepper'}
Main Temples: Sri Chennakeshava Swamy Temple, Sri Veerabhadreshwara Temple, Grama Devi Temple
Schools: 4 schools including Government High School and PU College. Primary Health Center has 2 doctors.

`;

    if (alert && alert.active) {
      ctx += `ACTIVE EMERGENCY ADVISORY:
[${alert.level}] ${alert.title_en} / ${alert.title_kn}: ${alert.message_en} (Contact: ${alert.contact_info})\n\n`;
    }

    if (news && news.length > 0) {
      ctx += `RECENT VERIFIED NEWS & ANNOUNCEMENTS:\n`;
      news.forEach((n) => {
        ctx += `- ${n.title_en} (${n.title_kn}): ${n.content_en}\n`;
      });
      ctx += `\n`;
    }

    if (events && events.length > 0) {
      ctx += `UPCOMING EVENTS & FESTIVALS:\n`;
      events.forEach((e) => {
        ctx += `- ${e.title_en} (${e.title_kn}) on ${e.date} at ${e.venue_en}\n`;
      });
      ctx += `\n`;
    }

    if (tournaments && tournaments.length > 0) {
      ctx += `SPORTS & TOURNAMENTS:\n`;
      tournaments.forEach((t) => {
        ctx += `- ${t.name_en} (${t.sport}): Status: ${t.status}\n`;
      });
      ctx += `\n`;
    }

    if (crops && crops.length > 0) {
      ctx += `AGRICULTURE CROPS & TECHNIQUES:\n`;
      crops.forEach((c) => {
        ctx += `- ${c.name_en} (${c.name_kn}): Season: ${c.season_en}, Cultivation tips: ${c.cultivation_en}\n`;
      });
      ctx += `\n`;
    }

    return ctx;
  }

  /**
   * Real-time conversational Village Voice & Text Assistant
   */
  public async askVillageAssistant(
    userQuery: string,
    preferredLang: Language
  ): Promise<GeminiResponse> {
    const context = this.buildVillageContext();

    const systemInstruction = `You are "ಗ್ರಾಮಸಿರಿ ಸಹಾಯಕ" (Gramasiri AI Assistant), the official virtual assistant of Gramasiri village, Karnataka.
Your job is to assist village residents, farmers, elders, students, and guests with warmth, simplicity, and accuracy.

CRITICAL INSTRUCTIONS:
1. Always base answers on the provided VILLAGE KNOWLEDGE BASE when relevant.
2. For agricultural questions, give actionable, farmer-friendly tips (soil, water, crop protection, subsidies).
3. For village queries, specify dates, locations, and timings clearly.
4. STRICT PRIVACY: NEVER invent or reveal any citizen's private phone number, email address, or private chat messages.
5. Return your response strictly in valid JSON format matching:
{
  "answer_en": "Clear, friendly, complete response in English (2-4 sentences)",
  "answer_kn": "ಅದೇ ಉತ್ತರವನ್ನು ಶುದ್ಧ, ಸರಳ ಮತ್ತು ಗೌರವಯುತ ಕನ್ನಡದಲ್ಲಿ (2-4 ವಾಕ್ಯಗಳು)",
  "category": "AGRICULTURE" | "SPORTS" | "EVENTS" | "TEMPLE" | "NEWS" | "GENERAL",
  "navTab": "agriculture" | "sports" | "events" | "temples" | "news" | "home"
}`;

    const prompt = `${context}

USER QUESTION: "${userQuery}"
Preferred Language: ${preferredLang === 'kn' ? 'Kannada' : 'English'}

Provide the JSON response:`;

    try {
      const raw = await this.callGeminiAPI(prompt, systemInstruction);
      // Clean JSON delimiters if markdown formatted
      const match = raw.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : raw;
      const parsed = JSON.parse(jsonStr);

      return {
        answer_en: parsed.answer_en || raw,
        answer_kn: parsed.answer_kn || raw,
        category: parsed.category || 'GENERAL',
        navTab: parsed.navTab || 'home'
      };
    } catch (err) {
      console.warn('Gemini response fallback:', err);
      return {
        answer_en: `Regarding "${userQuery}": Please check our village notices or contact the Grama Panchayat office.`,
        answer_kn: `"${userQuery}" ಕುರಿತು: ದಯವಿಟ್ಟು ನಮ್ಮ ಗ್ರಾಮ ಪೋರ್ಟಲ್ ಸೂಚನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.`,
        category: 'GENERAL',
        navTab: 'home'
      };
    }
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
