import {
  MarketPriceRecord,
  MarketPriceApiResponse,
  MarketPriceHistoryPoint,
  FarmerMarketPreferences,
  MarketPriceAlert
} from '../types/market';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { notificationService } from './notificationService';

// Default Preferences
export const DEFAULT_PREFERENCES: FarmerMarketPreferences = {
  preferredState: 'Karnataka',
  preferredDistrict: 'Gadag',
  preferredMarket: 'Gadag APMC',
  preferredCommodities: ['Pomegranate', 'Maize', 'Paddy(Common)', 'Tomato', 'Onion', 'Groundnut', 'Dry Chillies']
};

// Kannada & English commodity mapping with emoji icons
export interface CommodityMeta {
  en: string;
  kn: string;
  emoji: string;
  category: string;
}

export const POPULAR_COMMODITIES: CommodityMeta[] = [
  { en: 'Pomegranate', kn: 'ದಾಳಿಂಬೆ', emoji: '🍎', category: 'Fruits' },
  { en: 'Tomato', kn: 'ಟೊಮೆಟೊ', emoji: '🍅', category: 'Vegetables' },
  { en: 'Onion', kn: 'ಈರುಳ್ಳಿ', emoji: '🧅', category: 'Vegetables' },
  { en: 'Paddy(Common)', kn: 'ಭತ್ತ (Paddy)', emoji: '🌾', category: 'Cereals' },
  { en: 'Maize', kn: 'ಮೆಕ್ಕೆಜೋಳ (Maize)', emoji: '🌽', category: 'Cereals' },
  { en: 'Groundnut', kn: 'ಕಡಲೆಕಾಯಿ (Groundnut)', emoji: '🥜', category: 'Oil Seeds' },
  { en: 'Dry Chillies', kn: 'ಒಣ ಮೆಣಸಿನಕಾಯಿ (Dry Chillies)', emoji: '🌶️', category: 'Spices' },
  { en: 'Green Chilli', kn: 'ಹಸಿ ಮೆಣಸಿನಕಾಯಿ (Green Chilli)', emoji: '🌶️', category: 'Vegetables' },
  { en: 'Wheat', kn: 'ಗೋಧಿ (Wheat)', emoji: '🌾', category: 'Cereals' },
  { en: 'Bengal Gram(Gram)(Whole)', kn: 'ಕಡಲೆಕಾಳು (Bengal Gram)', emoji: '🫘', category: 'Pulses' },
  { en: 'Banana - Green', kn: 'ಬಾಳೆಹಣ್ಣು (Banana)', emoji: '🍌', category: 'Fruits' },
  { en: 'Coconut', kn: 'ತೆಂಗಿನಕಾಯಿ (Coconut)', emoji: '🥥', category: 'Spices' },
  { en: 'Arecanut(Betelnut/Supari)', kn: 'ಅಡಿಕೆ (Arecanut)', emoji: '🌴', category: 'Spices' },
  { en: 'Cotton', kn: 'ಹತ್ತಿ (Cotton)', emoji: '☁️', category: 'Fiber Crops' },
  { en: 'Potato', kn: 'ಆಲೂಗಡ್ಡೆ (Potato)', emoji: '🥔', category: 'Vegetables' }
];

export const KARNATAKA_DISTRICTS = [
  { en: 'ALL', kn: 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು (All Districts)' },
  { en: 'Gadag', kn: 'ಗದಗ (Gadag)' },
  { en: 'Chitradurga', kn: 'ಚಿತ್ರದುರ್ಗ (Chitradurga)' },
  { en: 'Bengaluru Urban', kn: 'ಬೆಂಗಳೂರು (Bengaluru Urban)' },
  { en: 'Dharwad', kn: 'ಧಾರವಾಡ / ಹುಬ್ಬಳ್ಳಿ (Dharwad/Hubballi)' },
  { en: 'Davangere', kn: 'ದಾವಣಗೆರೆ (Davangere)' },
  { en: 'Ballari', kn: 'ಬಳ್ಳಾರಿ (Ballari)' },
  { en: 'Belagavi', kn: 'ಬೆಳಗಾವಿ (Belagavi)' },
  { en: 'Hassan', kn: 'ಹಾಸನ (Hassan)' },
  { en: 'Kalaburagi', kn: 'ಕಲಬುರಗಿ (Kalaburagi)' },
  { en: 'Mysuru', kn: 'ಮೈಸೂರು (Mysuru)' },
  { en: 'Tumakuru', kn: 'ತುಮಕೂರು (Tumakuru)' },
  { en: 'Chamarajanagar', kn: 'ಚಾಮರಾಜನಗರ (Chamarajanagar)' },
  { en: 'Chikkaballapura', kn: 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ (Chikkaballapura)' },
  { en: 'Kolar', kn: 'ಕೋಲಾರ (Kolar)' },
  { en: 'Koppal', kn: 'ಕೊಪ್ಪಳ (Koppal)' },
  { en: 'Mandya', kn: 'ಮಂಡ್ಯ (Mandya)' },
  { en: 'Raichur', kn: 'ರಾಯಚೂರು (Raichur)' },
  { en: 'Shivamogga', kn: 'ಶಿವಮೊಗ್ಗ (Shivamogga)' },
  { en: 'Vijayapura', kn: 'ವಿಜಯಪುರ (Vijayapura)' },
  { en: 'Bagalkote', kn: 'ಬಾಗಲಕೋಟೆ (Bagalkote)' },
  { en: 'Haveri', kn: 'ಹಾವೇರಿ (Haveri)' },
  { en: 'Udupi', kn: 'ಉಡುಪಿ (Udupi)' },
  { en: 'Dakshina Kannada', kn: 'ದಕ್ಷಿಣ ಕನ್ನಡ (Dakshina Kannada)' },
  { en: 'Uttara Kannada', kn: 'ಉತ್ತರ ಕನ್ನಡ (Uttara Kannada)' },
  { en: 'Bidar', kn: 'ಬೀದರ್ (Bidar)' },
  { en: 'Yadgir', kn: 'ಯಾದಗಿರಿ (Yadgir)' },
  { en: 'Kodagu', kn: 'ಕೊಡಗು (Kodagu)' }
];

export const MAJOR_KARNATAKA_MARKETS = [
  'Gadag APMC',
  'Binny Mill (FF&V) Bengaluru APMC',
  'Bengaluru APMC',
  'APMC Hubballi',
  'Davangere APMC',
  'Challakere APMC',
  'Chitradurga APMC',
  'Kalaburagi APMC',
  'Ballari APMC',
  'Arasikere APMC',
  'Bagepalli APMC',
  'Mysuru APMC',
  'Koppal APMC'
];

class MarketPriceService {
  private memoryCache: MarketPriceApiResponse | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_LIFETIME = 20 * 60 * 1000; // 20 minutes

  // Format currency in Indian Rupees
  public formatIndianRupees(amount: number): string {
    if (isNaN(amount) || amount <= 0) return 'Not available';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Get commodity meta
  public getCommodityMeta(name: string): CommodityMeta {
    const found = POPULAR_COMMODITIES.find((c) =>
      name.toLowerCase().includes(c.en.toLowerCase()) ||
      c.en.toLowerCase().includes(name.toLowerCase())
    );
    if (found) return found;

    return {
      en: name,
      kn: name,
      emoji: '🌾',
      category: 'General'
    };
  }

  // Fetch Daily Market Prices
  public async fetchDailyPrices(params?: {
    state?: string;
    district?: string;
    market?: string;
    commodity?: string;
    date?: string;
    refresh?: boolean;
  }): Promise<MarketPriceApiResponse> {
    const now = Date.now();

    // Check memory cache
    if (!params?.refresh && this.memoryCache && now - this.cacheTimestamp < this.CACHE_LIFETIME) {
      const filtered = this.filterRecords(this.memoryCache.records, params);
      return {
        ...this.memoryCache,
        records: filtered,
        totalRecords: filtered.length,
        cached: true,
        isCached: true,
        reportDate: this.memoryCache.reportDate || this.memoryCache.reportingDate
      };
    }

    // Try LocalStorage cache if offline or recent
    if (!params?.refresh) {
      try {
        const local = localStorage.getItem('mtg_market_prices_cache');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && parsed.timestamp && now - parsed.timestamp < this.CACHE_LIFETIME) {
            this.memoryCache = parsed.data;
            this.cacheTimestamp = parsed.timestamp;
            const filtered = this.filterRecords(parsed.data.records, params);
            return {
              ...parsed.data,
              records: filtered,
              totalRecords: filtered.length,
              cached: true,
              isCached: true,
              reportDate: parsed.data.reportDate || parsed.data.reportingDate || 'Latest available'
            };
          }
        }
      } catch (e) {
        // ignore localStorage error
      }
    }

    // Build URL for internal API
    const searchParams = new URLSearchParams();
    searchParams.set('state', params?.state || 'Karnataka');
    searchParams.set('stateId', '16');
    if (params?.district && params.district !== 'ALL') searchParams.set('district', params.district);
    if (params?.market && params.market !== 'ALL') searchParams.set('market', params.market);
    if (params?.commodity && params.commodity !== 'ALL') searchParams.set('commodity', params.commodity);
    if (params?.date) searchParams.set('date', params.date);

    try {
      const response = await fetch(`/api/market-prices?${searchParams.toString()}`);
      if (response.ok) {
        const json: MarketPriceApiResponse = await response.json();
        if (json.success && Array.isArray(json.records)) {
          this.memoryCache = json;
          this.cacheTimestamp = now;

          // Save to LocalStorage
          try {
            localStorage.setItem(
              'mtg_market_prices_cache',
              JSON.stringify({ timestamp: now, data: json })
            );
          } catch (e) {
            // ignore
          }

          const filtered = this.filterRecords(json.records, params);
          return {
            ...json,
            records: filtered,
            totalRecords: filtered.length,
            cached: false,
            isCached: false,
            reportDate: json.reportDate || json.reportingDate || 'Latest available'
          };
        }
      }
    } catch (err) {
      console.warn('Backend /api/market-prices fetch failed, falling back to direct AGMARKNET report:', err);
    }

    // Direct Resilient Fallback to AGMARKNET 2.0 (for static hosting or offline environments)
    try {
      const fallbackResult = await this.fetchDirectAgmarknet(params?.date);
      if (fallbackResult.success) {
        this.memoryCache = fallbackResult;
        this.cacheTimestamp = now;
        const filtered = this.filterRecords(fallbackResult.records, params);
        return {
          ...fallbackResult,
          records: filtered,
          totalRecords: filtered.length,
          cached: false,
          isCached: false,
          reportDate: fallbackResult.reportDate || fallbackResult.reportingDate || 'Latest available'
        };
      }
    } catch (fallbackErr) {
      console.error('Direct AGMARKNET fetch failed:', fallbackErr);
    }

    // If all failed, return cached data if available, or clean empty response
    try {
      const local = localStorage.getItem('mtg_market_prices_cache');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.data) {
          const filtered = this.filterRecords(parsed.data.records, params);
          return {
            ...parsed.data,
            records: filtered,
            totalRecords: filtered.length,
            cached: true,
            isCached: true,
            reportDate: parsed.data.reportDate || parsed.data.reportingDate || 'Latest available'
          };
        }
      }
    } catch (e) {
      // ignore
    }

    return {
      success: false,
      source: 'AGMARKNET / Government of India',
      lastUpdated: new Date().toISOString(),
      reportingDate: 'Not available',
      reportDate: 'Not available',
      state: 'Karnataka',
      totalRecords: 0,
      markets: [],
      commodities: [],
      records: [],
      isCached: false
    };
  }

  // Direct AGMARKNET 2.0 fetcher
  private async fetchDirectAgmarknet(targetDate?: string): Promise<MarketPriceApiResponse> {
    const datesToTry: string[] = [];
    if (targetDate) {
      datesToTry.push(targetDate);
    } else {
      const today = new Date();
      datesToTry.push(today.toISOString().split('T')[0]);
      for (let i = 1; i <= 4; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        datesToTry.push(d.toISOString().split('T')[0]);
      }
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://agmarknet.gov.in/',
      'Origin': 'https://agmarknet.gov.in'
    };

    let reportJson: any = null;
    let successfulDate = '';

    for (const dStr of datesToTry) {
      const url = `https://api.agmarknet.gov.in/v1/prices-and-arrivals/commodity-market/daily-report-state?date=${dStr}&state=16&includeExcel=false`;
      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.commodityGroups) && json.commodityGroups.length > 0) {
            reportJson = json;
            successfulDate = dStr;
            break;
          }
        }
      } catch (e) {
        // try next date
      }
    }

    if (!reportJson) {
      throw new Error('No data available from AGMARKNET');
    }

    const allRecords: MarketPriceRecord[] = [];
    const marketsSet = new Set<string>();
    const commoditiesSet = new Set<string>();

    for (const group of reportJson.commodityGroups || []) {
      const groupName = group.CommodityGroup || 'Other';
      for (const comm of group.commodities || []) {
        const commName = comm.commodityName || 'Unknown';
        commoditiesSet.add(commName);

        for (const mkt of comm.markets || []) {
          const marketName = mkt.marketCenter || 'Unknown APMC';
          marketsSet.add(marketName);

          for (const item of mkt.data || []) {
            allRecords.push({
              id: `${commName}_${marketName}_${item.variety || 'std'}_${successfulDate}`.replace(/[\s/\\()]+/g, '_'),
              state: 'Karnataka',
              district: this.deriveDistrict(marketName),
              market: marketName,
              commodity: commName,
              commodityGroup: groupName,
              variety: item.variety || 'FAQ / Standard',
              grade: 'FAQ (Fair Average Quality)',
              arrivalDate: successfulDate,
              minPrice: Number(item.minimumPrice) || 0,
              maxPrice: Number(item.maximumPrice) || 0,
              modalPrice: Number(item.modalPrice) || 0,
              arrivalQuantity: item.arrivals != null ? Number(item.arrivals) : null,
              arrivalUnit: item.unitOfArrivals || 'Metric Tonnes',
              priceUnit: item.unitOfPrice || 'Rs./Quintal',
              source: 'AGMARKNET / Government of India',
              fetchedAt: new Date().toISOString()
            });
          }
        }
      }
    }

    return {
      success: true,
      source: 'AGMARKNET / Government of India',
      lastUpdated: new Date().toISOString(),
      reportingDate: successfulDate,
      reportDate: successfulDate,
      state: 'Karnataka',
      totalRecords: allRecords.length,
      markets: Array.from(marketsSet).sort(),
      commodities: Array.from(commoditiesSet).sort(),
      records: allRecords,
      isCached: false
    };
  }

  private deriveDistrict(marketName: string): string {
    const map: Record<string, string> = {
      gadag: 'Gadag',
      bengaluru: 'Bengaluru Urban',
      'binny mill': 'Bengaluru Urban',
      hubballi: 'Dharwad',
      dharwad: 'Dharwad',
      davangere: 'Davangere',
      challakere: 'Chitradurga',
      chitradurga: 'Chitradurga',
      hosadurga: 'Chitradurga',
      kalaburagi: 'Kalaburagi',
      ballari: 'Ballari',
      arasikere: 'Hassan',
      bagepalli: 'Chikkaballapura',
      chamarajanagar: 'Chamarajanagar',
      koppal: 'Koppal',
      mysuru: 'Mysuru'
    };
    const lower = marketName.toLowerCase();
    for (const [k, dist] of Object.entries(map)) {
      if (lower.includes(k)) return dist;
    }
    return 'Karnataka APMC';
  }

  private filterRecords(records: MarketPriceRecord[], params?: any): MarketPriceRecord[] {
    if (!params) return records;
    let list = records;
    if (params.district && params.district !== 'ALL') {
      const q = params.district.toLowerCase();
      list = list.filter((r) => r.district.toLowerCase().includes(q));
    }
    if (params.market && params.market !== 'ALL') {
      const q = params.market.toLowerCase();
      list = list.filter((r) => r.market.toLowerCase().includes(q));
    }
    if (params.commodity && params.commodity !== 'ALL') {
      const q = params.commodity.toLowerCase();
      list = list.filter((r) => r.commodity.toLowerCase().includes(q));
    }
    return list;
  }

  // Fetch Price History
  public async fetchPriceHistory(params: {
    commodity: string;
    market?: string;
    period?: '7d' | '15d' | '30d' | '3m';
  }): Promise<MarketPriceHistoryPoint[]> {
    const period = params.period || '7d';
    const searchParams = new URLSearchParams({
      history: 'true',
      commodity: params.commodity,
      period
    });
    if (params.market && params.market !== 'ALL') {
      searchParams.set('market', params.market);
    }

    try {
      const res = await fetch(`/api/market-prices?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.history)) {
          return json.history;
        }
      }
    } catch (e) {
      console.warn('History API request failed:', e);
    }

    return [];
  }

  // Market Comparison (across Karnataka APMCs for a crop)
  public getMarketComparison(commodityName: string, allRecords: MarketPriceRecord[]): MarketPriceRecord[] {
    const matched = allRecords.filter((r) =>
      r.commodity.toLowerCase() === commodityName.toLowerCase() ||
      r.commodity.toLowerCase().includes(commodityName.toLowerCase())
    );

    // Group by market and pick highest modal price entry per market
    const marketMap = new Map<string, MarketPriceRecord>();
    for (const r of matched) {
      const existing = marketMap.get(r.market);
      if (!existing || r.modalPrice > existing.modalPrice) {
        marketMap.set(r.market, r);
      }
    }

    return Array.from(marketMap.values());
  }

  // -------------------------------------------------------------
  // User Preferences
  // -------------------------------------------------------------
  public async getUserPreferences(userId: string): Promise<FarmerMarketPreferences> {
    // 1. Try LocalStorage
    try {
      const local = localStorage.getItem(`mtg_market_pref_${userId}`);
      if (local) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(local) };
      }
    } catch (e) {
      // ignore
    }

    // 2. Try Firestore
    if (isFirebaseConfigured && db && userId) {
      try {
        const ref = doc(db, 'user_market_preferences', userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as FarmerMarketPreferences;
          return { ...DEFAULT_PREFERENCES, ...data };
        }
      } catch (e) {
        console.warn('Firestore get preferences error:', e);
      }
    }

    return DEFAULT_PREFERENCES;
  }

  public async saveUserPreferences(userId: string, prefs: FarmerMarketPreferences): Promise<void> {
    try {
      localStorage.setItem(`mtg_market_pref_${userId}`, JSON.stringify(prefs));
    } catch (e) {
      // ignore
    }

    if (isFirebaseConfigured && db && userId) {
      try {
        const ref = doc(db, 'user_market_preferences', userId);
        await setDoc(ref, prefs, { merge: true });
      } catch (e) {
        console.warn('Firestore save preferences error:', e);
      }
    }
  }

  // -------------------------------------------------------------
  // Price Alerts
  // -------------------------------------------------------------
  public async getPriceAlerts(userId: string): Promise<MarketPriceAlert[]> {
    try {
      const local = localStorage.getItem(`mtg_market_alerts_${userId}`);
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      // ignore
    }

    if (isFirebaseConfigured && db && userId) {
      try {
        const ref = collection(db, 'market_price_alerts');
        const snap = await getDocs(ref);
        const alerts: MarketPriceAlert[] = [];
        snap.forEach((d) => {
          const data = d.data() as MarketPriceAlert;
          if (data.userId === userId) {
            alerts.push({ ...data, id: d.id });
          }
        });
        return alerts;
      } catch (e) {
        console.warn('Firestore get alerts error:', e);
      }
    }

    return [];
  }

  public async savePriceAlert(userId: string, alert: Omit<MarketPriceAlert, 'id' | 'createdAt' | 'userId'>): Promise<MarketPriceAlert> {
    const newAlert: MarketPriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    const current = await this.getPriceAlerts(userId);
    const updated = [newAlert, ...current];

    try {
      localStorage.setItem(`mtg_market_alerts_${userId}`, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }

    if (isFirebaseConfigured && db && userId) {
      try {
        const ref = doc(db, 'market_price_alerts', newAlert.id);
        await setDoc(ref, newAlert);
      } catch (e) {
        console.warn('Firestore save alert error:', e);
      }
    }

    return newAlert;
  }

  public async deletePriceAlert(userId: string, alertId: string): Promise<void> {
    const current = await this.getPriceAlerts(userId);
    const updated = current.filter((a) => a.id !== alertId);

    try {
      localStorage.setItem(`mtg_market_alerts_${userId}`, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }

    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'market_price_alerts', alertId);
        await deleteDoc(ref);
      } catch (e) {
        console.warn('Firestore delete alert error:', e);
      }
    }
  }

  // Check active alerts against fresh price records
  public async checkAlerts(userId: string, records: MarketPriceRecord[]): Promise<void> {
    const alerts = await this.getPriceAlerts(userId);
    const active = alerts.filter((a) => a.isActive);
    if (active.length === 0) return;

    for (const alert of active) {
      const match = records.find(
        (r) =>
          r.commodity.toLowerCase().includes(alert.commodity.toLowerCase()) &&
          (!alert.market || alert.market === 'ALL' || r.market.toLowerCase().includes(alert.market.toLowerCase()))
      );

      if (match) {
        const conditionMet =
          alert.condition === 'GREATER_EQUAL'
            ? match.modalPrice >= alert.targetPrice
            : match.modalPrice <= alert.targetPrice;

        if (conditionMet) {
          notificationService.sendNotification({
            title_kn: `🌾 ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಎಚ್ಚರಿಕೆ: ${match.commodity}`,
            title_en: `🌾 Market Price Alert: ${match.commodity}`,
            body_kn: `${match.market} ನಲ್ಲಿ ${match.commodity} ಮಾದರಿ ಬೆಲೆ ₹${match.modalPrice.toLocaleString('en-IN')}/ಕ್ವಿಂಟಾಲ್ ತಲುಪಿದೆ!`,
            body_en: `Modal price for ${match.commodity} at ${match.market} reached ₹${match.modalPrice.toLocaleString('en-IN')}/quintal!`,
            section: 'market_prices',
            urgent: false
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 🌟 Convenience Aliases for UI Components
  // -------------------------------------------------------------
  public async getMarketPrices(
    filter?: { state?: string; district?: string; market?: string; commodity?: string; date?: string },
    forceRefresh?: boolean
  ): Promise<MarketPriceApiResponse> {
    return this.fetchDailyPrices({ ...filter, refresh: forceRefresh });
  }

  public async getPriceHistory(
    commodity: string,
    market?: string,
    days: 7 | 15 | 30 | 90 = 15
  ): Promise<MarketPriceHistoryPoint[]> {
    const period = days === 7 ? '7d' : days === 15 ? '15d' : days === 30 ? '30d' : '3m';
    return this.fetchPriceHistory({ commodity, market, period });
  }

  public async getComparisonForCommodity(commodity: string): Promise<MarketPriceRecord[]> {
    const res = await this.fetchDailyPrices();
    return res.records.filter((r) => r.commodity.toLowerCase().includes(commodity.toLowerCase()));
  }

  public async createPriceAlert(userId: string, alert: any): Promise<MarketPriceAlert> {
    return this.savePriceAlert(userId, alert);
  }

  public getCommodityEmoji(name: string): string {
    return this.getCommodityMeta(name).emoji;
  }

  public getCommodityNameKn(name: string): string {
    return this.getCommodityMeta(name).kn;
  }
}

export const marketPriceService = new MarketPriceService();
