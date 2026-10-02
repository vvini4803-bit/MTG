// Self-contained types for universal serverless & Vite dev compatibility
export interface RequestLike {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers?: Record<string, any>;
  body?: any;
}

export interface ResponseLike {
  setHeader: (key: string, value: string) => any;
  status: (code: number) => ResponseLike;
  json: (data: any) => void;
  end: (data?: any) => void;
}

// In-memory cache to prevent repeatedly hammering the government AGMARKNET portal
interface CacheEntry {
  timestamp: number;
  data: any;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const AGMARKNET_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://agmarknet.gov.in/',
  'Origin': 'https://agmarknet.gov.in'
};

// Comprehensive District lookup for all 74 Karnataka APMC markets
const KARNATAKA_MARKET_DISTRICT_MAP: Record<string, string> = {
  // Dharwad
  'Hubballi': 'Dharwad',
  'APMC Hubballi': 'Dharwad',
  'Dharwad': 'Dharwad',

  // Shivamogga
  'Shimoga': 'Shivamogga',
  'THIRTHAHALLI': 'Shivamogga',
  'Sagar': 'Shivamogga',
  'Shikaripura': 'Shivamogga',

  // Hassan
  'Arasikere': 'Hassan',
  'Belur': 'Hassan',
  'Hassan': 'Hassan',

  // Bidar
  'Aurad': 'Bidar',
  'Basava Kalayana': 'Bidar',
  'Bidar': 'Bidar',

  // Chikkaballapura
  'Bagepalli': 'Chikkaballapura',
  'Chintamani': 'Chikkaballapura',
  'Chikkaballapura': 'Chikkaballapura',

  // Belagavi
  'Bailahongal': 'Belagavi',
  'Belgaum': 'Belagavi',
  'Belagavi': 'Belagavi',
  'Kudchi': 'Belagavi',
  'Nippani': 'Belagavi',

  // Ballari
  'Ballari': 'Ballari',
  'Bellary': 'Ballari',

  // Kolar
  'Bangarpet': 'Kolar',
  'Kolar': 'Kolar',
  'Malur': 'Kolar',

  // Dakshina Kannada
  'Bantwala': 'Dakshina Kannada',
  'Mangaluru': 'Dakshina Kannada',
  'Mangalore': 'Dakshina Kannada',
  'Puttur': 'Dakshina Kannada',
  'Sulya': 'Dakshina Kannada',

  // Bengaluru Urban
  'Bengaluru': 'Bengaluru Urban',
  'Binny Mill': 'Bengaluru Urban',
  'Yeshwanthpur': 'Bengaluru Urban',

  // Chitradurga
  'Challakere': 'Chitradurga',
  'Chitradurga': 'Chitradurga',
  'Hiriyur': 'Chitradurga',
  'Holalkere': 'Chitradurga',
  'Hosadurga': 'Chitradurga',

  // Chamarajanagar
  'Chamarajanagar': 'Chamarajanagar',
  'Gundlupet': 'Chamarajanagar',

  // Ramanagara
  'Channapatna': 'Ramanagara',
  'Ramanagara': 'Ramanagara',

  // Kalaburagi
  'Chittapur': 'Kalaburagi',
  'Jevargi': 'Kalaburagi',
  'Kalaburagi': 'Kalaburagi',

  // Davangere
  'Davangere': 'Davangere',
  'Harihara': 'Davangere',
  'Honnali': 'Davangere',

  // Bengaluru Rural
  'Doddaballapur': 'Bengaluru Rural',

  // Gadag
  'Gadag': 'Gadag',

  // Koppal
  'Gangavathi': 'Koppal',
  'Koppal': 'Koppal',
  'Kustagi': 'Koppal',

  // Uttara Kannada
  'Haliyala': 'Uttara Kannada',
  'Honnavar': 'Uttara Kannada',
  'Kumta': 'Uttara Kannada',
  'Siddapur': 'Uttara Kannada',
  'Sirsi': 'Uttara Kannada',
  'Yellapur': 'Uttara Kannada',
  'Karwar': 'Uttara Kannada',

  // Haveri
  'Hanagal': 'Haveri',
  'Haveri': 'Haveri',
  'Hirekerur': 'Haveri',
  'Ranebennur': 'Haveri',
  'Savanur': 'Haveri',
  'Byadgi': 'Haveri',

  // Vijayanagara
  'HarappanaHalli': 'Vijayanagara',
  'Hoovinahadagali': 'Vijayanagara',
  'Kottur': 'Vijayanagara',

  // Mandya
  'K.R. Pet': 'Mandya',
  'Mandya': 'Mandya',
  'Pandavapura': 'Mandya',

  // Mysuru
  'K.R.Nagar': 'Mysuru',
  'Mysuru': 'Mysuru',
  'Mysore': 'Mysuru',
  'Nanjangud': 'Mysuru',

  // Chikkamagaluru
  'Kadur': 'Chikkamagaluru',
  'Mudigere': 'Chikkamagaluru',
  'Chikkamagaluru': 'Chikkamagaluru',

  // Udupi
  'Kundapura': 'Udupi',
  'Udupi': 'Udupi',

  // Raichur
  'Lingasugur': 'Raichur',
  'Manvi': 'Raichur',
  'Raichur': 'Raichur',
  'Sindhanur': 'Raichur',

  // Vijayapura
  'Talikot': 'Vijayapura',
  'Vijayapura': 'Vijayapura',
  'Bijapur': 'Vijayapura',

  // Tumakuru
  'Tiptur': 'Tumakuru',
  'Turvekere': 'Tumakuru',
  'Tumkur': 'Tumakuru',
  'Tumakuru': 'Tumakuru',

  // Yadgir
  'Yadgir': 'Yadgir',

  // Bagalkote
  'Bagalkote': 'Bagalkote',
  'Badami': 'Bagalkote',

  // Kodagu
  'Madikeri': 'Kodagu',
  'Somvarpet': 'Kodagu'
};

function resolveDistrict(marketName: string): string {
  for (const [key, district] of Object.entries(KARNATAKA_MARKET_DISTRICT_MAP)) {
    if (marketName.toLowerCase().includes(key.toLowerCase())) {
      return district;
    }
  }
  return 'Karnataka APMC';
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateIST(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch (e) {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 3600000 * 5.5);
    return formatDateISO(ist);
  }
}

function getPreviousDateIST(daysAgo: number): string {
  try {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 3600000 * 5.5 - daysAgo * 86400000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(ist);
  } catch (e) {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 3600000 * 5.5 - daysAgo * 86400000);
    return formatDateISO(ist);
  }
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      state = 'Karnataka',
      stateId = '16',
      district,
      market,
      commodity,
      date,
      refresh,
      history,
      period = '7d'
    } = req.query;

    const todayIST = getTodayDateIST();
    const requestedDate = typeof date === 'string' && date.trim() ? date.trim() : todayIST;
    const forceRefresh = refresh === 'true' || refresh === '1';

    const cacheKey = `agmark_${stateId}_${requestedDate}_${history || 'false'}_${period}`;
    const now = Date.now();

    // Check cache (bypassed if forceRefresh is true)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      const effectiveTtl = cached?.data?.isRecentFallback ? 3 * 60 * 1000 : CACHE_TTL_MS;
      if (cached && now - cached.timestamp < effectiveTtl) {
        let filtered = filterRecords(cached.data.records, { district, market, commodity });
        return res.status(200).json({
          ...cached.data,
          records: filtered,
          totalRecords: filtered.length,
          cached: true
        });
      }
    } else {
      cache.delete(cacheKey);
    }

    // 1. If History is requested
    if (history === 'true') {
      const historyData = await fetchHistoryData(Number(stateId), commodity as string, market as string, period as string);
      return res.status(200).json({
        success: true,
        source: 'AGMARKNET / Government of India',
        commodity: commodity || 'All',
        market: market || 'All',
        history: historyData
      });
    }

    // 2. Fetch daily report from Government AGMARKNET 2.0 API
    // Try requestedDate first; if not yet available, try recent business days up to 7 days back
    const datesToTry: string[] = [requestedDate];
    for (let i = 1; i <= 7; i++) {
      const prev = getPreviousDateIST(i);
      if (!datesToTry.includes(prev)) {
        datesToTry.push(prev);
      }
    }

    let reportJson: any = null;
    let successfulDate = '';

    for (const testDate of datesToTry) {
      const url = `https://api.agmarknet.gov.in/v1/prices-and-arrivals/commodity-market/daily-report-state?date=${testDate}&state=${stateId}&includeExcel=false`;
      try {
        const response = await fetch(url, { headers: AGMARKNET_HEADERS });
        if (response.ok) {
          const json = await response.json();
          if (json && json.success && Array.isArray(json.commodityGroups) && json.commodityGroups.length > 0) {
            reportJson = json;
            successfulDate = testDate;
            break;
          }
        }
      } catch (err) {
        // Continue trying next recent date
      }
    }

    if (!reportJson || !reportJson.commodityGroups) {
      return res.status(200).json({
        success: false,
        message: 'No market-price data is available from AGMARKNET for this period.',
        source: 'AGMARKNET / Government of India',
        reportingDate: datesToTry[0],
        totalRecords: 0,
        markets: [],
        commodities: [],
        records: []
      });
    }

    // Normalize Government AGMARKNET response
    const allRecords: any[] = [];
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
          const districtName = resolveDistrict(marketName);

          for (const item of mkt.data || []) {
            allRecords.push({
              id: `${commName}_${marketName}_${item.variety || 'std'}_${successfulDate}`.replace(/[\s/\\()]+/g, '_'),
              state: typeof state === 'string' ? state : 'Karnataka',
              district: districtName,
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

    const isToday = successfulDate === todayIST;
    const isRecentFallback = successfulDate !== requestedDate;
    const fallbackNotice = isRecentFallback
      ? `Today's (${requestedDate}) APMC reports are being finalized by market officers. Showing most recent verified market data from ${successfulDate}.`
      : null;

    const payload = {
      success: true,
      source: 'AGMARKNET / Government of India',
      portalUrl: 'https://agmarknet.gov.in/home',
      lastUpdated: new Date().toISOString(),
      requestedDate: requestedDate,
      reportingDate: successfulDate,
      reportDate: successfulDate,
      isToday: isToday,
      isRecentFallback: isRecentFallback,
      fallbackNotice: fallbackNotice,
      state: typeof state === 'string' ? state : 'Karnataka',
      markets: Array.from(marketsSet).sort(),
      commodities: Array.from(commoditiesSet).sort(),
      records: allRecords
    };

    // Store in cache
    cache.set(cacheKey, { timestamp: now, data: payload });

    // Apply client filters if provided
    const filtered = filterRecords(allRecords, { district, market, commodity });

    return res.status(200).json({
      ...payload,
      records: filtered,
      totalRecords: filtered.length,
      cached: false
    });
  } catch (error: any) {
    console.error('Market prices API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve agricultural market prices. Please try again.',
      error: error.message
    });
  }
}

function filterRecords(
  records: any[],
  filters: { district?: any; market?: any; commodity?: any }
) {
  let list = records;
  if (filters.district && typeof filters.district === 'string' && filters.district !== 'ALL') {
    const q = filters.district.toLowerCase();
    list = list.filter((r) => r.district.toLowerCase().includes(q));
  }
  if (filters.market && typeof filters.market === 'string' && filters.market !== 'ALL') {
    const q = filters.market.toLowerCase();
    list = list.filter((r) => r.market.toLowerCase().includes(q));
  }
  if (filters.commodity && typeof filters.commodity === 'string' && filters.commodity !== 'ALL') {
    const q = filters.commodity.toLowerCase();
    list = list.filter((r) => r.commodity.toLowerCase().includes(q));
  }
  return list;
}

// Fetch historical dates for a commodity / market
async function fetchHistoryData(
  stateId: number,
  commodity?: string,
  market?: string,
  period: string = '7d'
) {
  const daysCount = period === '3m' ? 90 : period === '30d' ? 30 : period === '15d' ? 15 : 7;
  const historyPoints: any[] = [];
  const today = new Date();

  // Pick up to 6 evenly spaced sample dates across the selected period
  const step = Math.max(1, Math.floor(daysCount / 6));
  const dates: string[] = [];
  for (let i = 0; i < daysCount; i += step) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(formatDateISO(d));
  }

  for (const dateStr of dates) {
    const url = `https://api.agmarknet.gov.in/v1/prices-and-arrivals/commodity-market/daily-report-state?date=${dateStr}&state=${stateId}&includeExcel=false`;
    try {
      const response = await fetch(url, { headers: AGMARKNET_HEADERS });
      if (response.ok) {
        const json = await response.json();
        if (json?.success && Array.isArray(json.commodityGroups)) {
          for (const g of json.commodityGroups) {
            for (const c of g.commodities || []) {
              if (!commodity || c.commodityName?.toLowerCase().includes(commodity.toLowerCase())) {
                for (const m of c.markets || []) {
                  if (!market || m.marketCenter?.toLowerCase().includes(market.toLowerCase())) {
                    const firstData = m.data?.[0];
                    if (firstData) {
                      historyPoints.push({
                        date: dateStr,
                        displayDate: new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                        commodity: c.commodityName,
                        market: m.marketCenter,
                        minPrice: Number(firstData.minimumPrice) || 0,
                        maxPrice: Number(firstData.maximumPrice) || 0,
                        modalPrice: Number(firstData.modalPrice) || 0,
                        arrivals: firstData.arrivals != null ? Number(firstData.arrivals) : null
                      });
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore single date failure
    }
  }

  // Sort ascending by date
  return historyPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
