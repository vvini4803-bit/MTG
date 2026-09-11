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

// Default active Gemini models verified with current API key
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash'];

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

  private async callGeminiAPI(prompt: string, systemInstruction?: string, isJson: boolean = false): Promise<string> {
    let lastError: any = null;

    for (const model of GEMINI_MODELS) {
      const activeKey = getActiveApiKey();
      if (!activeKey) continue;
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
            maxOutputTokens: 1000
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
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errorMsg = errData?.error?.message || `HTTP ${res.status}`;
          if (res.status === 429 || res.status === 403) {
            rotateApiKey();
          }
          throw new Error(errorMsg);
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
      }
    }

    throw lastError || new Error('Failed to reach Gemini API');
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
Village: Muttagundi (ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮ)
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

    const systemInstruction = `You are "ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮ ಸಹಾಯಕ" (Muttagundi AI Voice Assistant), the official AI assistant of Muttagundi village, Hosadurga Taluk, Chitradurga District, Karnataka.
Your job is to assist village residents, farmers, elders, students, and guests with warmth, simplicity, and 100% accuracy.

CRITICAL INSTRUCTIONS:
1. Ground all answers firmly in the provided OFFICIAL VILLAGE KNOWLEDGE BASE. Muttagundi is in Hosadurga, Chitradurga, Karnataka.
2. For agricultural questions, give actionable, farmer-friendly advice suitable for Central Karnataka (soil preparation, water management, pest control, government schemes).
3. For temple, sports, or festival queries, specify timings and locations clearly.
4. STRICT PRIVACY: NEVER invent or reveal any citizen's private phone number, email address, or private chat messages.
5. You MUST return valid JSON matching this schema:
{
  "answer_en": "Clear, friendly, conversational response in English (2-3 sentences)",
  "answer_kn": "ಅದೇ ಉತ್ತರವನ್ನು ಶುದ್ಧ, ಸರಳ ಮತ್ತು ಗೌರವಯುತ ಕನ್ನಡದಲ್ಲಿ (2-3 ವಾಕ್ಯಗಳು)",
  "category": "AGRICULTURE" | "SPORTS" | "EVENTS" | "TEMPLE" | "NEWS" | "GENERAL",
  "navTab": "agriculture" | "sports" | "events" | "temples" | "news" | "home"
}`;

    const prompt = `${context}

USER QUESTION: "${userQuery}"
Preferred Language of User: ${preferredLang === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}

Provide the JSON response:`;

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

      return {
        answer_en: parsed.answer_en || raw,
        answer_kn: parsed.answer_kn || parsed.answer_en || raw,
        category: parsed.category || 'GENERAL',
        navTab: parsed.navTab || 'home'
      };
    } catch (err) {
      console.warn('Gemini response fallback triggered:', err);
      return this.getLocalSmartFallback(userQuery, preferredLang);
    }
  }

  /**
   * Smart localized fallback based on keyword matching with live local database
   */
  private getLocalSmartFallback(userQuery: string, preferredLang: Language): GeminiResponse {
    const q = userQuery.toLowerCase().trim();

    if (q.includes('ಕೃಷಿ') || q.includes('ಬೆಳೆ') || q.includes('ರಾಗಿ') || q.includes('crop') || q.includes('farm') || q.includes('agriculture')) {
      return {
        answer_en: 'Muttagundi is rich in agricultural land. Major crops are Ragi, Groundnut, Coconut, Arecanut, Maize, and Pomegranate. Check our Agriculture tab for detailed farming guides.',
        answer_kn: 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದಲ್ಲಿ ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ತೆಂಗು, ಅಡಿಕೆ, ಮೆಕ್ಕೆಜೋಳ ಮತ್ತು ದಾಳಿಂಬೆ ಪ್ರಮುಖ ಬೆಳೆಗಳಾಗಿವೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ನಮ್ಮ ಕೃಷಿ ವಿಭಾಗವನ್ನು ಪರಿಶೀಲಿಸಿ.',
        category: 'AGRICULTURE',
        navTab: 'agriculture'
      };
    }

    if (q.includes('ದೇವಸ್ಥಾನ') || q.includes('ದೇವಾಲಯ') || q.includes('ಪೂಜೆ') || q.includes('temple') || q.includes('pooja') || q.includes('god')) {
      return {
        answer_en: 'In Muttagundi, the prominent temples are Sri Ranganatha Swamy Temple, Sri Veerabhadreshwara Swamy Temple, and Grama Devathe Sri Maramma Temple.',
        answer_kn: 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದಲ್ಲಿ ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ ದೇವಾಲಯ, ಶ್ರೀ ವೀರಭದ್ರೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ ಮತ್ತು ಗ್ರಾಮ ದೇವತೆ ಶ್ರೀ ಮಾರಮ್ಮ ದೇವಾಲಯಗಳು ಪ್ರಸಿದ್ಧವಾಗಿವೆ.',
        category: 'TEMPLE',
        navTab: 'temples'
      };
    }

    if (q.includes('ಕ್ರಿಕೆಟ್') || q.includes('ಕ್ರೀಡೆ') || q.includes('ಟೂರ್ನಮೆಂಟ್') || q.includes('cricket') || q.includes('sport') || q.includes('match')) {
      return {
        answer_en: 'Muttagundi hosts the annual Muttagundi Premier League (MPL) Cricket Tournament and village Kabaddi Championships at the Panchayat Ground.',
        answer_kn: 'ಮುಟ್ಟಗುಂಡಿಯಲ್ಲಿ ವಾರ್ಷಿಕ ಎಂಪಿಎಲ್ (MPL) ಕ್ರಿಕೆಟ್ ಟೂರ್ನಮೆಂಟ್ ಮತ್ತು ಕಬಡ್ಡಿ ಪಂದ್ಯಾವಳಿಗಳು ಗ್ರಾಮ ಪಂಚಾಯತಿ ಮೈದಾನದಲ್ಲಿ ನಡೆಯುತ್ತವೆ.',
        category: 'SPORTS',
        navTab: 'sports'
      };
    }

    if (q.includes('ಜನಸಂಖ್ಯೆ') || q.includes('population') || q.includes('ಮನೆ') || q.includes('households')) {
      const stats = dbService['villageStats'];
      return {
        answer_en: `Muttagundi village in Hosadurga taluk has a population of approximately ${stats?.population || 3450} residents across ${stats?.households || 820} households, with an 82.4% literacy rate.`,
        answer_kn: `ಹೊಸದುರ್ಗ ತಾಲೂಕಿನ ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮವು ಸುಮಾರು ${stats?.population || 3450} ಜನಸಂಖ್ಯೆ ಮತ್ತು ${stats?.households || 820} ಮನೆಗಳನ್ನು ಹೊಂದಿದ್ದು, ಶೇ. 82.4 ಸಾಕ್ಷರತೆ ಹೊಂದಿದೆ.`,
        category: 'GENERAL',
        navTab: 'home'
      };
    }

    return {
      answer_en: `Regarding "${userQuery}": Welcome to Muttagundi village portal! You can explore verified news, events, agriculture, and temples from the main menu.`,
      answer_kn: `"${userQuery}" ಕುರಿತು: ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮ ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ! ನೀವು ಮುಖ್ಯ ಮೆನುವಿನಿಂದ ದೃಢೀಕೃತ ಸುದ್ದಿ, ಕಾರ್ಯಕ್ರಮಗಳು, ಕೃಷಿ ಮತ್ತು ದೇವಸ್ಥಾನಗಳ ಮಾಹಿತಿ ಪಡೆಯಬಹುದು.`,
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
