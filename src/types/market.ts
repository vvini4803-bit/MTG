export interface MarketPriceRecord {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  commodityKn?: string;
  commodityGroup?: string;
  variety: string;
  grade: string;
  arrivalDate: string; // DD/MM/YYYY or YYYY-MM-DD
  minPrice: number; // in Rs. / Quintal
  maxPrice: number; // in Rs. / Quintal
  modalPrice: number; // in Rs. / Quintal
  arrivalQuantity: number | null; // in Metric Tonnes
  arrivalUnit?: string; // e.g. "Metric Tonnes" or "Nos"
  unitArrival?: string; // alias for arrivalUnit
  priceUnit: string; // e.g. "Rs./Quintal"
  source: string; // "AGMARKNET / Government of India" | "AGMARKNET / GOI (Gemini AI Enhanced)"
  fetchedAt: string; // ISO string
}

export interface MarketPriceFilter {
  state: string;
  district?: string;
  market?: string;
  commodity?: string;
  date?: string;
}

export interface MarketPriceHistoryPoint {
  date: string;
  displayDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivals?: number | null;
  market: string;
}

export interface FarmerMarketPreferences {
  preferredState: string;
  preferredDistrict: string;
  preferredMarket: string;
  preferredCommodities: string[];
}

export interface MarketPriceAlert {
  id: string;
  userId: string;
  commodity: string;
  commodityKn?: string;
  district?: string;
  market: string;
  targetPrice: number; // Alert when modal price reaches or exceeds this
  condition: 'GREATER_EQUAL' | 'LESS_EQUAL' | 'ABOVE' | 'BELOW';
  createdAt: string;
  lastNotifiedAt?: string;
  isActive: boolean;
}

export interface MarketPriceApiResponse {
  success: boolean;
  source: string;
  portalUrl?: string;
  lastUpdated: string;
  reportingDate: string;
  reportDate: string; // alias
  state: string;
  totalRecords: number;
  markets: string[];
  commodities: string[];
  records: MarketPriceRecord[];
  cached?: boolean;
  isCached: boolean;
  cachedAt?: string;
}
