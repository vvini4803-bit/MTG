import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { backNavigation } from '../services/backNavigation';
import { geminiService } from '../services/geminiService';
import { voiceAssistant } from '../services/voiceService';
import {
  marketPriceService,
  POPULAR_COMMODITIES,
  KARNATAKA_DISTRICTS
} from '../services/marketPriceService';
import {
  MarketPriceRecord,
  MarketPriceHistoryPoint,
  FarmerMarketPreferences
} from '../types/market';
import {
  Wheat,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Bell,
  Sparkles,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  Check,
  ChevronRight,
  BarChart2,
  Volume2,
  VolumeX,
  Star,
  Layers,
  ArrowLeft,
  X,
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface MarketPricesScreenProps {
  onBack?: () => void;
}

export const MarketPricesScreen: React.FC<MarketPricesScreenProps> = ({ onBack }) => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();

  // Filter State
  const [selectedState, setSelectedState] = useState<string>('Karnataka');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Gadag');
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Pomegranate');
  const [searchCropQuery, setSearchCropQuery] = useState<string>('');

  // Data State
  const [allRecords, setAllRecords] = useState<MarketPriceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metaInfo, setMetaInfo] = useState<{
    source: string;
    lastUpdated: string;
    reportDate: string;
    isCached: boolean;
    cachedAt?: string;
  } | null>(null);

  // User Preferences
  const [userPrefs, setUserPrefs] = useState<FarmerMarketPreferences | null>(null);
  const [prefSaveMsg, setPrefSaveMsg] = useState<string | null>(null);

  // Modals State
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyRecord, setHistoryRecord] = useState<MarketPriceRecord | null>(null);
  const [historyDays, setHistoryDays] = useState<7 | 15 | 30 | 90>(15);
  const [historyPoints, setHistoryPoints] = useState<MarketPriceHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [compareCommodity, setCompareCommodity] = useState<string>('Pomegranate');
  const [compareRecords, setCompareRecords] = useState<MarketPriceRecord[]>([]);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);

  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [alertRecord, setAlertRecord] = useState<MarketPriceRecord | null>(null);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [alertSuccess, setAlertSuccess] = useState<boolean>(false);

  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiRecord, setAiRecord] = useState<MarketPriceRecord | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [isSpeakingAi, setIsSpeakingAi] = useState<boolean>(false);

  // 1. Initial Load of Preferences & Live Market Data
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoading(true);
      setError(null);

      // Load user preferences
      const uid = currentUser?.uid || 'guest';
      const prefs = await marketPriceService.getUserPreferences(uid);
      if (isMounted) {
        setUserPrefs(prefs);
        if (prefs.preferredDistrict) setSelectedDistrict(prefs.preferredDistrict);
        if (prefs.preferredCommodities?.[0]) setSelectedCommodity(prefs.preferredCommodities[0]);
      }

      // Fetch official market data
      try {
        const res = await marketPriceService.getMarketPrices({
          state: 'Karnataka'
        });

        if (isMounted) {
          setAllRecords(res.records || []);
          setMetaInfo({
            source: res.source,
            lastUpdated: res.lastUpdated,
            reportDate: res.reportDate,
            isCached: res.isCached,
            cachedAt: res.cachedAt
          });
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to load market prices:', err);
        if (isMounted) {
          setError(
            isKannada
              ? 'ಸರ್ಕಾರಿ ಮಾರುಕಟ್ಟೆ ಸರ್ವರ್ ಸಂಪರ್ಕದಲ್ಲಿ ತೊಂದರೆ ಉಂಟಾಗಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.'
              : 'Market data is temporarily unavailable from the government source. Please try again later.'
          );
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Back Navigation modal registrations
  useEffect(() => {
    if (showHistoryModal) {
      return backNavigation.pushModal('marketHistoryModal', () => setShowHistoryModal(false));
    }
  }, [showHistoryModal]);

  useEffect(() => {
    if (showCompareModal) {
      return backNavigation.pushModal('marketCompareModal', () => setShowCompareModal(false));
    }
  }, [showCompareModal]);

  useEffect(() => {
    if (showAlertModal) {
      return backNavigation.pushModal('marketAlertModal', () => setShowAlertModal(false));
    }
  }, [showAlertModal]);

  useEffect(() => {
    if (showAiModal) {
      return backNavigation.pushModal('marketAiModal', () => {
        voiceAssistant.stopSpeaking();
        setIsSpeakingAi(false);
        setShowAiModal(false);
      });
    }
  }, [showAiModal]);

  // Manual Refresh Handler
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await marketPriceService.getMarketPrices(
        { state: selectedState },
        true // force bypass cache
      );
      setAllRecords(res.records || []);
      setMetaInfo({
        source: res.source,
        lastUpdated: res.lastUpdated,
        reportDate: res.reportDate,
        isCached: res.isCached,
        cachedAt: res.cachedAt
      });
    } catch (err: any) {
      setError(
        isKannada
          ? 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ. ಇತ್ತೀಚಿನ ಲಭ್ಯವಿರುವ ದತ್ತಾಂಶವನ್ನು ಉಳಿಸಲಾಗಿದೆ.'
          : 'Refresh failed. Retaining latest available cached market data.'
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Extract unique commodities and markets from live records
  const availableCommodities = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.commodity) set.add(r.commodity);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const availableMarketsForDistrict = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (selectedDistrict === 'ALL' || r.district.toLowerCase() === selectedDistrict.toLowerCase()) {
        if (r.market) set.add(r.market);
      }
    });
    return Array.from(set).sort();
  }, [allRecords, selectedDistrict]);

  // Filter records based on active user selection
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      // 1. District match
      if (selectedDistrict !== 'ALL' && rec.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }
      // 2. Market match
      if (selectedMarket !== 'ALL' && rec.market.toLowerCase() !== selectedMarket.toLowerCase()) {
        return false;
      }
      // 3. Commodity match or search query
      if (searchCropQuery.trim()) {
        const q = searchCropQuery.toLowerCase();
        const matchesEn = rec.commodity.toLowerCase().includes(q);
        const matchesKn = (rec.commodityKn || '').toLowerCase().includes(q);
        const matchesMarket = rec.market.toLowerCase().includes(q);
        return matchesEn || matchesKn || matchesMarket;
      }
      if (selectedCommodity && selectedCommodity !== 'ALL') {
        return rec.commodity.toLowerCase() === selectedCommodity.toLowerCase();
      }
      return true;
    });
  }, [allRecords, selectedDistrict, selectedMarket, selectedCommodity, searchCropQuery]);

  // Primary / Featured Card Record
  const featuredRecord = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    // Prefer exact market match if selected
    if (selectedMarket !== 'ALL') {
      const match = filteredRecords.find(
        (r) => r.market.toLowerCase() === selectedMarket.toLowerCase()
      );
      if (match) return match;
    }
    return filteredRecords[0];
  }, [filteredRecords, selectedMarket]);

  // Secondary records (other reported items in the same APMC / selection)
  const secondaryRecords = useMemo(() => {
    if (!featuredRecord) return filteredRecords;
    return filteredRecords.filter((r) => r.id !== featuredRecord.id);
  }, [filteredRecords, featuredRecord]);

  // 📈 Open Price History Modal
  const handleOpenHistory = async (record: MarketPriceRecord) => {
    setHistoryRecord(record);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const history = await marketPriceService.getPriceHistory(
        record.commodity,
        record.market,
        historyDays
      );
      setHistoryPoints(history);
    } catch (e) {
      console.warn('History fetch error:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Change history timeframe
  const handleHistoryDaysChange = async (days: 7 | 15 | 30 | 90) => {
    setHistoryDays(days);
    if (!historyRecord) return;
    setHistoryLoading(true);
    try {
      const history = await marketPriceService.getPriceHistory(
        historyRecord.commodity,
        historyRecord.market,
        days
      );
      setHistoryPoints(history);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 📊 Open Market Comparison Modal
  const handleOpenCompare = async (record: MarketPriceRecord) => {
    setCompareCommodity(record.commodity);
    setShowCompareModal(true);
    setCompareLoading(true);
    try {
      const comp = await marketPriceService.getComparisonForCommodity(record.commodity);
      setCompareRecords(comp);
    } catch (e) {
      console.warn('Compare fetch error:', e);
    } finally {
      setCompareLoading(false);
    }
  };

  // 🔔 Open Price Alert Modal
  const handleOpenAlert = (record: MarketPriceRecord) => {
    setAlertRecord(record);
    setAlertTargetPrice(record.modalPrice ? record.modalPrice.toString() : '');
    setAlertSuccess(false);
    setShowAlertModal(true);
  };

  const handleSaveAlert = async () => {
    if (!alertRecord || !alertTargetPrice) return;
    const priceNum = parseFloat(alertTargetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert(isKannada ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯ ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ' : 'Please enter a valid price');
      return;
    }

    const uid = currentUser?.uid || 'guest';
    await marketPriceService.createPriceAlert(uid, {
      commodity: alertRecord.commodity,
      commodityKn: alertRecord.commodityKn,
      market: alertRecord.market,
      district: alertRecord.district,
      targetPrice: priceNum,
      condition: 'ABOVE'
    });

    setAlertSuccess(true);
    setTimeout(() => {
      setShowAlertModal(false);
      setAlertSuccess(false);
    }, 1800);
  };

  // 🤖 Open Gemini AI Explanation Modal
  const handleOpenAi = async (record: MarketPriceRecord) => {
    setAiRecord(record);
    setShowAiModal(true);
    setAiLoading(true);
    setAiExplanation('');
    try {
      const explanation = await geminiService.explainMarketPrices(record, isKannada);
      setAiExplanation(explanation);
    } catch (e) {
      setAiExplanation(
        isKannada
          ? `${record.market} ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ${record.commodity} ಬೆಳೆಯ ಇತ್ತೀಚಿನ ಮಾದರಿ ಬೆಲೆ ಕ್ವಿಂಟಾಲ್‌ಗೆ ₹${record.modalPrice.toLocaleString('en-IN')} ಆಗಿದೆ.`
          : `Latest available modal price for ${record.commodity} at ${record.market} is ₹${record.modalPrice.toLocaleString('en-IN')} per quintal.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  // Read AI explanation aloud
  const handleToggleAiSpeech = () => {
    if (isSpeakingAi) {
      voiceAssistant.stopSpeaking();
      setIsSpeakingAi(false);
    } else {
      if (!aiExplanation) return;
      setIsSpeakingAi(true);
      voiceAssistant.speak(
        aiExplanation,
        isKannada ? 'kn' : 'en',
        () => setIsSpeakingAi(false),
        () => setIsSpeakingAi(false)
      );
    }
  };

  // ⭐ Save User Preferences (My Market / My Crops)
  const handleSavePreferences = async (market: string, district: string, commodity: string) => {
    const uid = currentUser?.uid || 'guest';
    const newPrefs: FarmerMarketPreferences = {
      preferredState: 'Karnataka',
      preferredDistrict: district,
      preferredMarket: market,
      preferredCommodities: [commodity, ...(userPrefs?.preferredCommodities || []).filter((c) => c !== commodity)]
    };
    await marketPriceService.saveUserPreferences(uid, newPrefs);
    setUserPrefs(newPrefs);
    setPrefSaveMsg(isKannada ? 'ಮೆಚ್ಚಿನ ಮಾರುಕಟ್ಟೆ ಉಳಿಸಲಾಗಿದೆ!' : 'Saved as your preferred market!');
    setTimeout(() => setPrefSaveMsg(null), 3000);
  };

  return (
    <div style={{ padding: '16px 12px 60px', maxWidth: '1020px', margin: '0 auto', color: '#F8FAFC' }}>
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
            >
              <ArrowLeft size={16} />
              <span>{isKannada ? 'ಮುಖಪುಟ' : 'Home'}</span>
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.6rem' }}>🌾</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {isKannada ? 'ದಿನನಿತ್ಯದ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು' : 'Daily Agricultural Market Prices'}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}
              >
                🏛️ AGMARKNET 2.0 • GOI
              </span>
              <span
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#A78BFA',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}
              >
                🤖 Gemini AI Enhanced
              </span>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#FBBF24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}
              >
                {isKannada ? 'ಕರ್ನಾಟಕ ಮೊದಲ ಆದ್ಯತೆ' : 'Karnataka First'}
              </span>
            </div>
          </div>
        </div>

        {/* Refresh & Sync Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34D399',
              borderRadius: '14px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            title={isKannada ? 'ಇತ್ತೀಚಿನ ಬೆಲೆಗಳನ್ನು ಮರುಲೋಡ್ ಮಾಡಿ' : 'Refresh live prices'}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? (isKannada ? 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'Refreshing...') : (isKannada ? 'ನವೀಕರಿಸಿ' : 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Meta Bar: Reporting Date & Cache Status */}
      {metaInfo && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '8px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#94A3B8',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#10B981" />
            <span>
              {isKannada ? 'ಇತ್ತೀಚಿನ ಲಭ್ಯವಿರುವ ಮಾರುಕಟ್ಟೆ ವರದಿ:' : 'Latest available market report:'}{' '}
              <strong style={{ color: '#F1F5F9' }}>{metaInfo.reportDate}</strong>
            </span>
          </div>
          <div>
            <span>{metaInfo.isCached ? (isKannada ? 'ಕ್ಯಾಶ್ ಮಾಡಿದ ದತ್ತಾಂಶ (ತ್ವರಿತ)' : 'Verified cached data') : (isKannada ? 'ಲೈವ್ ದತ್ತಾಂಶ' : 'Live server response')}</span>
            {metaInfo.cachedAt && (
              <span style={{ marginLeft: '6px', color: '#64748B' }}>
                ({new Date(metaInfo.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Preference Saved Banner */}
      {prefSaveMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.25)',
            border: '1px solid #10B981',
            color: '#34D399',
            padding: '8px 16px',
            borderRadius: '12px',
            marginBottom: '14px',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Check size={16} />
          <span>{prefSaveMsg}</span>
        </div>
      )}

      {/* 2. FARMER-FRIENDLY FILTERS: State -> District -> Market */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <SlidersHorizontal size={18} color="#10B981" />
          <h2 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
            {isKannada ? 'ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಜಿಲ್ಲೆ ಆಯ್ಕೆ' : 'Select State, District & Market (APMC)'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* State (Default: Karnataka) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
              {isKannada ? 'ರಾಜ್ಯ (State)' : 'State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="Karnataka">Karnataka (ಕರ್ನಾಟಕ)</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Telangana">Telangana</option>
            </select>
          </div>

          {/* District */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
              {isKannada ? 'ಜಿಲ್ಲೆ (District)' : 'District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedMarket('ALL');
              }}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              {KARNATAKA_DISTRICTS.map((d) => (
                <option key={d.en} value={d.en}>
                  {isKannada ? d.kn : `${d.en}`}
                </option>
              ))}
            </select>
          </div>

          {/* Market / APMC (Dynamically populated) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
              {isKannada ? 'ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ (APMC Market)' : 'Market / APMC'}
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="ALL">
                {isKannada ? 'ಎಲ್ಲಾ ಮಾರುಕಟ್ಟೆಗಳು (All Markets)' : 'All Markets'}
              </option>
              {availableMarketsForDistrict.map((m) => (
                <option key={m} value={m}>
                  📍 {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. QUICK COMMODITY CHIPS & SEARCH BAR */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E2E8F0' }}>
            {isKannada ? 'ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ (Select Crop)' : 'Select Crop / Commodity'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            {availableCommodities.length} {isKannada ? 'ಬೆಳೆಗಳು ಲಭ್ಯವಿದೆ' : 'crops reporting'}
          </span>
        </div>

        {/* Quick Emoji Chips Horizontal Scroll */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '10px',
            scrollbarWidth: 'none'
          }}
        >
          {POPULAR_COMMODITIES.map((c) => {
            const isSelected = selectedCommodity.toLowerCase() === c.en.toLowerCase();
            return (
              <button
                key={c.en}
                onClick={() => {
                  setSelectedCommodity(c.en);
                  setSearchCropQuery('');
                }}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'rgba(30, 41, 59, 0.75)',
                  border: isSelected ? '1px solid #34D399' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  borderRadius: '24px',
                  padding: '7px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{c.emoji}</span>
                <span>{isKannada ? c.kn.split('(')[0].trim() : c.en}</span>
              </button>
            );
          })}
        </div>

        {/* Crop Search Input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            placeholder={
              isKannada
                ? 'ಬೆಳೆ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಹುಡುಕಿ (ಉದಾ: ದಾಳಿಂಬೆ, ಟೊಮೆಟೊ, ಗದಗ)...'
                : 'Search any commodity or APMC market (e.g., Pomegranate, Tomato, Gadag)...'
            }
            value={searchCropQuery}
            onChange={(e) => setSearchCropQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '12px 40px 12px 42px',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchCropQuery && (
            <button
              onClick={() => setSearchCropQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {loading ? (
        // Loading Skeleton
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '12px' }}>
              <RefreshCw size={28} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0', color: '#FFFFFF' }}>
              {isKannada ? 'ಸರ್ಕಾರಿ AGMARKNET ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...' : 'Loading official market prices from AGMARKNET & Gemini AI...'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>
              {isKannada
                ? 'ಕರ್ನಾಟಕದ 70+ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆಗಳ ಲೈವ್ ದತ್ತಾಂಶ ಮತ್ತು ಜೆಮಿನಿ AI ವಿಶ್ಲೇಷಣೆ ಪಡೆಯಲಾಗುತ್ತಿದೆ.'
                : 'Verifying official APMC daily reports and generating Gemini AI market intelligence.'}
            </p>
          </div>
        </div>
      ) : error && allRecords.length === 0 ? (
        // Error State
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '18px',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <AlertCircle size={36} color="#EF4444" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FCA5A5', margin: '0 0 8px 0' }}>
            {error}
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#CBD5E1', marginBottom: '16px' }}>
            {isKannada
              ? 'ಲೈವ್ ಮಾರುಕಟ್ಟೆ ದತ್ತಾಂಶವನ್ನು ಪಡೆಯಲು ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ ಮರುಪ್ರಯತ್ನಿಸಿ.'
              : 'Failed to retrieve live market data. Tap below to retry with Gemini AI.'}
          </p>
          <button
            onClick={handleRefresh}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {isKannada ? 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ' : 'Retry'}
          </button>
        </div>
      ) : filteredRecords.length === 0 ? (
        // Empty State (Section 20)
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '36px 20px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
            {isKannada
              ? 'ಈ ಆಯ್ಕೆಗೆ ಯಾವುದೇ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ದಾಖಲಾಗಿಲ್ಲ'
              : 'No market-price data is available for this selection.'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            {isKannada
              ? `"${selectedDistrict}" ಜಿಲ್ಲೆಯಲ್ಲಿ "${selectedCommodity}" ಬೆಳೆಗೆ ಇಂದಿನ ದಿನದ ಯಾವುದೇ ಆಗಮನ ವರದಿ ಬಂದಿಲ್ಲ. ಬೇರೆ ಬೆಳೆ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಆಯ್ಕೆಮಾಡಿ.`
              : `No arrival report for "${selectedCommodity}" in "${selectedDistrict}" district on this reporting date. Please select another market or crop.`}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedDistrict('ALL')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isKannada ? 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳ ಮಾರುಕಟ್ಟೆ ನೋಡಿ' : 'Change Market (All Districts)'}
            </button>
            <button
              onClick={() => {
                setSelectedCommodity('Tomato');
                setSearchCropQuery('');
              }}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {isKannada ? 'ಟೊಮೆಟೊ ಬೆಲೆ ನೋಡಿ' : 'Change Commodity (Tomato)'}
            </button>
          </div>
        </div>
      ) : (
        // Records Present: 5. TODAY'S PRICE CARD (Featured)
        <div>
          {featuredRecord && (
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.3) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.45)',
                borderRadius: '24px',
                padding: '24px 20px',
                marginBottom: '24px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
                position: 'relative'
              }}
            >
              {/* Header of Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '2rem' }}>
                      {marketPriceService.getCommodityEmoji(featuredRecord.commodity)}
                    </span>
                    <div>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                        {featuredRecord.commodity}
                      </h2>
                      <span style={{ fontSize: '0.95rem', color: '#A7F3D0', fontWeight: 700 }}>
                        {featuredRecord.commodityKn || marketPriceService.getCommodityNameKn(featuredRecord.commodity)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        color: '#CBD5E1',
                        fontWeight: 700
                      }}
                    >
                      <MapPin size={13} color="#10B981" />
                      <span>{featuredRecord.market}</span>
                      <span style={{ color: '#64748B' }}>({featuredRecord.district})</span>
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        color: '#CBD5E1',
                        fontWeight: 700
                      }}
                    >
                      <Calendar size={13} color="#F59E0B" />
                      <span>{featuredRecord.arrivalDate}</span>
                    </span>

                    {featuredRecord.variety && featuredRecord.variety !== 'Other' && (
                      <span
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#C4B5FD',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      >
                        {featuredRecord.variety}
                      </span>
                    )}
                  </div>
                </div>

                {/* Save Preference Button */}
                <button
                  onClick={() =>
                    handleSavePreferences(
                      featuredRecord.market,
                      featuredRecord.district,
                      featuredRecord.commodity
                    )
                  }
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FBBF24',
                    borderRadius: '14px',
                    padding: '6px 12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={isKannada ? 'ನನ್ನ ಮೆಚ್ಚಿನ ಮಾರುಕಟ್ಟೆಯಾಗಿ ಉಳಿಸಿ' : 'Save as My Preferred Market'}
                >
                  <Star size={14} fill="#FBBF24" />
                  <span>{isKannada ? 'ಮೆಚ್ಚಿನ ಮಾರುಕಟ್ಟೆ' : 'My Market'}</span>
                </button>
              </div>

              {/* 3 Main Price Boxes: Modal, Min, Max */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}
              >
                {/* 1. Modal Price (Featured Primary) */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.22)',
                    border: '2px solid #10B981',
                    borderRadius: '16px',
                    padding: '14px 12px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.76rem', color: '#A7F3D0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isKannada ? 'ಮಾದರಿ ಬೆಲೆ (Modal)' : 'Modal Price'}
                  </span>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    {featuredRecord.modalPrice > 0
                      ? `₹${featuredRecord.modalPrice.toLocaleString('en-IN')}`
                      : 'Not available'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#6EE7B7', fontWeight: 700 }}>
                    {featuredRecord.modalPrice > 0 ? (isKannada ? 'ಕ್ವಿಂಟಾಲ್‌ಗೆ (Per Quintal)' : '₹ / Quintal') : ''}
                  </span>
                </div>

                {/* 2. Minimum Price */}
                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.14)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: '16px',
                    padding: '14px 12px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.76rem', color: '#93C5FD', fontWeight: 800, textTransform: 'uppercase' }}>
                    {isKannada ? 'ಕನಿಷ್ಠ ಬೆಲೆ (Min)' : 'Minimum Price'}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    {featuredRecord.minPrice > 0
                      ? `₹${featuredRecord.minPrice.toLocaleString('en-IN')}`
                      : 'Not available'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#93C5FD', fontWeight: 700 }}>
                    {featuredRecord.minPrice > 0 ? (isKannada ? 'ಕ್ವಿಂಟಾಲ್‌ಗೆ' : '₹ / Quintal') : ''}
                  </span>
                </div>

                {/* 3. Maximum Price */}
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '16px',
                    padding: '14px 12px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.76rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
                    {isKannada ? 'ಗರಿಷ್ಠ ಬೆಲೆ (Max)' : 'Maximum Price'}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    {featuredRecord.maxPrice > 0
                      ? `₹${featuredRecord.maxPrice.toLocaleString('en-IN')}`
                      : 'Not available'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 700 }}>
                    {featuredRecord.maxPrice > 0 ? (isKannada ? 'ಕ್ವಿಂಟಾಲ್‌ಗೆ' : '₹ / Quintal') : ''}
                  </span>
                </div>

                {/* 4. Arrival Quantity */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    padding: '14px 12px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.76rem', color: '#CBD5E1', fontWeight: 800, textTransform: 'uppercase' }}>
                    {isKannada ? 'ಆಗಮನ ಪ್ರಮಾಣ' : 'Arrival Quantity'}
                  </span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                    {featuredRecord.arrivalQuantity !== undefined && featuredRecord.arrivalQuantity !== null && featuredRecord.arrivalQuantity > 0
                      ? `${featuredRecord.arrivalQuantity} ${featuredRecord.unitArrival || featuredRecord.arrivalUnit || 'tonnes'}`
                      : 'Not available'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>
                    {isKannada ? 'ಮಾರುಕಟ್ಟೆಗೆ ಬಂದ ಮಾಲು' : 'Mandi Arrival'}
                  </span>
                </div>
              </div>

              {/* 4 Action Buttons on Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* 📈 Price History */}
                <button
                  onClick={() => handleOpenHistory(featuredRecord)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.18)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93C5FD',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <TrendingUp size={15} />
                  <span>{isKannada ? 'ಬೆಲೆ ಇತಿಹಾಸ' : 'Price History'}</span>
                </button>

                {/* 📊 Compare Markets */}
                <button
                  onClick={() => handleOpenCompare(featuredRecord)}
                  style={{
                    background: 'rgba(139, 92, 246, 0.18)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    color: '#C4B5FD',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <BarChart2 size={15} />
                  <span>{isKannada ? 'ಮಾರುಕಟ್ಟೆ ಹೋಲಿಕೆ' : 'Compare Markets'}</span>
                </button>

                {/* 🔔 Price Alert */}
                <button
                  onClick={() => handleOpenAlert(featuredRecord)}
                  style={{
                    background: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#FCD34D',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Bell size={15} />
                  <span>{isKannada ? 'ಬೆಲೆ ಎಚ್ಚರಿಕೆ' : 'Price Alert'}</span>
                </button>

                {/* 🤖 Explain with AI */}
                <button
                  onClick={() => handleOpenAi(featuredRecord)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.25) 100%)',
                    border: '1px solid #10B981',
                    color: '#34D399',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={15} />
                  <span>{isKannada ? 'AI ವಿವರಣೆ' : 'Explain with AI'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Secondary Records Grid (Other reported items in same market/district) */}
          {secondaryRecords.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '12px' }}>
                {isKannada
                  ? `ಇತರ ಮಾರುಕಟ್ಟೆ ವರದಿಗಳು (${secondaryRecords.length})`
                  : `Other Available Mandi Reports (${secondaryRecords.length})`}
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px'
                }}
              >
                {secondaryRecords.slice(0, 12).map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.3rem' }}>
                            {marketPriceService.getCommodityEmoji(rec.commodity)}
                          </span>
                          <div>
                            <strong style={{ fontSize: '0.94rem', color: '#FFFFFF' }}>{rec.commodity}</strong>
                            {rec.commodityKn && (
                              <span style={{ fontSize: '0.78rem', color: '#A7F3D0', display: 'block' }}>
                                {rec.commodityKn}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34D399' }}>
                            {rec.modalPrice > 0 ? `₹${rec.modalPrice.toLocaleString('en-IN')}` : 'N/A'}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>/ Quintal</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#CBD5E1', marginBottom: '8px' }}>
                        <span>📍 {rec.market}</span> • <span>{rec.district}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#94A3B8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                        <span>
                          {isKannada ? 'ಕನಿಷ್ಠ:' : 'Min:'}{' '}
                          <strong style={{ color: '#E2E8F0' }}>
                            {rec.minPrice > 0 ? `₹${rec.minPrice.toLocaleString('en-IN')}` : 'N/A'}
                          </strong>
                        </span>
                        <span>
                          {isKannada ? 'ಗರಿಷ್ಠ:' : 'Max:'}{' '}
                          <strong style={{ color: '#E2E8F0' }}>
                            {rec.maxPrice > 0 ? `₹${rec.maxPrice.toLocaleString('en-IN')}` : 'N/A'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      <button
                        onClick={() => handleOpenHistory(rec)}
                        style={{
                          flex: 1,
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          color: '#93C5FD',
                          borderRadius: '8px',
                          padding: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📈 {isKannada ? 'ಇತಿಹಾಸ' : 'History'}
                      </button>
                      <button
                        onClick={() => handleOpenCompare(rec)}
                        style={{
                          flex: 1,
                          background: 'rgba(139, 92, 246, 0.12)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          color: '#C4B5FD',
                          borderRadius: '8px',
                          padding: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📊 {isKannada ? 'ಹೋಲಿಕೆ' : 'Compare'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. OFFICIAL SOURCE ATTRIBUTION BANNER (Section 21) */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>🏛️</span>
              <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>
                {isKannada ? 'ಮೂಲ: AGMARKNET / ಭಾರತ ಸರ್ಕಾರ' : 'Source: AGMARKNET / Government of India'}
              </strong>
            </div>
            <span
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#C4B5FD',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                padding: '1px 7px',
                borderRadius: '8px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}
            >
              🤖 Gemini AI Integrated
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: 0, maxWidth: '650px', lineHeight: 1.4 }}>
            {isKannada
              ? 'ಭಾರತ ಸರ್ಕಾರದ ಕೃಷಿ ಮತ್ತು ರೈತರ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯದ AGMARKNET ಪೋರ್ಟಲ್ ಹಾಗೂ ಮುಕ್ತ ದತ್ತಾಂಶ ವೇದಿಕೆ (data.gov.in). ನೈಜ ಸಮಯದ ಬೆಲೆ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಧ್ವನಿ ವಿವರಣೆ ಗೂಗಲ್ ಜೆಮಿನಿ AI ಮೂಲಕ ಒದಗಿಸಲಾಗಿದೆ.'
              : 'Official data source: Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, Government of India. Real-time market advice, voice synthesis & price explanations powered by Google Gemini AI.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="https://www.agmarknet.gov.in/home"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#34D399',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isKannada ? 'ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ನೋಡಿ' : 'View Official AGMARKNET'}</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={handleRefresh}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34D399',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{isKannada ? 'ತಾಜಾ ದರಗಳನ್ನು ಪಡೆಯಿರಿ' : 'Sync / Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📈 MODAL 1: PRICE HISTORY WITH INTERACTIVE SVG CHART (Sec 6)  */}
      {/* ============================================================ */}
      {showHistoryModal && historyRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} color="#10B981" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    {isKannada ? 'ಬೆಲೆ ಇತಿಹಾಸ' : 'Price History'}
                  </h3>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                  {historyRecord.commodity} • {historyRecord.market} ({historyRecord.district})
                </span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Timeframe Selector Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              {([7, 15, 30, 90] as const).map((days) => {
                const isSelected = historyDays === days;
                const label =
                  days === 7
                    ? isKannada ? '7 ದಿನಗಳು' : '7 Days'
                    : days === 15
                    ? isKannada ? '15 ದಿನಗಳು' : '15 Days'
                    : days === 30
                    ? isKannada ? '30 ದಿನಗಳು' : '30 Days'
                    : isKannada ? '3 ತಿಂಗಳು' : '3 Months';
                return (
                  <button
                    key={days}
                    onClick={() => handleHistoryDaysChange(days)}
                    style={{
                      flex: 1,
                      background: isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#070F1E' : '#CBD5E1',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Interactive SVG Chart */}
            {historyLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <span>{isKannada ? 'ಇತಿಹಾಸ ಬೆಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading price history...'}</span>
              </div>
            ) : historyPoints.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                <Info size={30} style={{ margin: '0 auto 8px', color: '#F59E0B' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>
                  {isKannada
                    ? 'ಈ ಮಾರುಕಟ್ಟೆಗೆ ಹಿಂದಿನ ದಿನಗಳ ಅಧಿಕೃತ ವರದಿ ದಾಖಲಾಗಿಲ್ಲ. ಕೃತಕ ದತ್ತಾಂಶವನ್ನು ಸೃಷ್ಟಿಸಲಾಗುವುದಿಲ್ಲ.'
                    : 'Insufficient official historical reports available for this market. Factual data only.'}
                </p>
              </div>
            ) : (
              <div>
                {/* SVG Render */}
                <HistorySvgChart points={historyPoints} isKannada={isKannada} />

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '3px' }} />
                    <span style={{ color: '#E2E8F0' }}>{isKannada ? 'ಮಾದರಿ ಬೆಲೆ (Modal)' : 'Modal Price'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '3px' }} />
                    <span style={{ color: '#E2E8F0' }}>{isKannada ? 'ಗರಿಷ್ಠ ಬೆಲೆ (Max)' : 'Max Price'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#3B82F6', borderRadius: '3px' }} />
                    <span style={{ color: '#E2E8F0' }}>{isKannada ? 'ಕನಿಷ್ಠ ಬೆಲೆ (Min)' : 'Min Price'}</span>
                  </div>
                </div>

                {/* Historical Points Table */}
                <div style={{ marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#CBD5E1', marginBottom: '8px' }}>
                    {isKannada ? 'ವರದಿ ವಿವರ (ದಿನಾಂಕವಾರು)' : 'Daily Records Summary'}
                  </h4>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.78rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '6px 8px' }}>{isKannada ? 'ದಿನಾಂಕ' : 'Date'}</th>
                          <th style={{ padding: '6px 8px' }}>{isKannada ? 'ಕನಿಷ್ಠ' : 'Min'}</th>
                          <th style={{ padding: '6px 8px' }}>{isKannada ? 'ಗರಿಷ್ಠ' : 'Max'}</th>
                          <th style={{ padding: '6px 8px' }}>{isKannada ? 'ಮಾದರಿ (Modal)' : 'Modal'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyPoints.map((pt) => (
                          <tr key={pt.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '6px 8px', color: '#E2E8F0' }}>{pt.date}</td>
                            <td style={{ padding: '6px 8px', color: '#93C5FD' }}>₹{pt.minPrice.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', color: '#FCD34D' }}>₹{pt.maxPrice.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', color: '#34D399', fontWeight: 800 }}>₹{pt.modalPrice.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 📊 MODAL 2: MARKET COMPARISON (Section 7)                    */}
      {/* ============================================================ */}
      {showCompareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowCompareModal(false)}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={22} color="#8B5CF6" />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    {isKannada ? 'ಮಾರುಕಟ್ಟೆ ಹೋಲಿಕೆ' : 'Compare Markets'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#A7F3D0', fontWeight: 700 }}>
                    {compareCommodity} • {isKannada ? 'ಕರ್ನಾಟಕದ ಇತರ ಎಪಿಎಂಸಿ ದರಗಳು' : 'Karnataka APMC Mandi Rates'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.4 }}>
              {isKannada
                ? 'ವಿವಿಧ ಮಾರುಕಟ್ಟೆಗಳ ವಾಸ್ತವಿಕ ಬೆಲೆ ವ್ಯತ್ಯಾಸಗಳು. ಇಲ್ಲಿ ಯಾವುದೇ ಮಾರುಕಟ್ಟೆಯನ್ನು "ಉತ್ತಮ" ಎಂದು ಪ್ರಚಾರ ಮಾಡುವುದಿಲ್ಲ; ಕೇವಲ ನೈಜ ಸರ್ಕಾರಿ ದತ್ತಾಂಶವನ್ನು ತೋರಿಸಲಾಗಿದೆ.'
                : 'Factual price differences across reporting markets. We simply display factual price data without ranking.'}
            </p>

            {compareLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <span>{isKannada ? 'ಮಾರುಕಟ್ಟೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading market comparison...'}</span>
              </div>
            ) : compareRecords.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                {isKannada ? 'ಬೇರೆ ಯಾವುದೇ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಈ ಬೆಳೆ ವರದಿಯಾಗಿಲ್ಲ.' : 'No other markets reporting this crop today.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }}>
                      <th style={{ padding: '10px 12px', borderRadius: '10px 0 0 10px' }}>
                        {isKannada ? 'ಮಾರುಕಟ್ಟೆ' : 'Market / APMC'}
                      </th>
                      <th style={{ padding: '10px 12px' }}>{isKannada ? 'ಜಿಲ್ಲೆ' : 'District'}</th>
                      <th style={{ padding: '10px 12px' }}>{isKannada ? 'ಕನಿಷ್ಠ' : 'Min'}</th>
                      <th style={{ padding: '10px 12px' }}>{isKannada ? 'ಗರಿಷ್ಠ' : 'Max'}</th>
                      <th style={{ padding: '10px 12px', borderRadius: '0 10px 10px 0' }}>
                        {isKannada ? 'ಮಾದರಿ (Modal)' : 'Modal Price'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRecords.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#FFFFFF' }}>{r.market}</td>
                        <td style={{ padding: '10px 12px', color: '#94A3B8' }}>{r.district}</td>
                        <td style={{ padding: '10px 12px', color: '#93C5FD' }}>₹{r.minPrice.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px 12px', color: '#FCD34D' }}>₹{r.maxPrice.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px 12px', color: '#34D399', fontWeight: 900, fontSize: '0.92rem' }}>
                          ₹{r.modalPrice.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 🔔 MODAL 3: PRICE ALERT (Section 15)                          */}
      {/* ============================================================ */}
      {showAlertModal && alertRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowAlertModal(false)}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} color="#F59E0B" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {isKannada ? 'ಬೆಲೆ ಎಚ್ಚರಿಕೆ ಹೊಂದಿಸಿ' : 'Set Price Alert'}
                </h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {alertSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Check size={42} color="#10B981" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                  {isKannada ? 'ಎಚ್ಚರಿಕೆ ಯಶಸ್ವಿಯಾಗಿ ಹೊಂದಿಸಲಾಗಿದೆ!' : 'Price Alert Set Successfully!'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>
                  {isKannada
                    ? `${alertRecord.market} ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ${alertRecord.commodity} ಬೆಲೆ ₹${parseFloat(alertTargetPrice).toLocaleString('en-IN')} ತಲುಪಿದಾಗ ನಿಮಗೆ ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲಾಗುವುದು.`
                    : `You will be notified when modal price at ${alertRecord.market} reaches ₹${parseFloat(alertTargetPrice).toLocaleString('en-IN')}/quintal.`}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '14px', background: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{isKannada ? 'ಬೆಳೆ & ಮಾರುಕಟ್ಟೆ' : 'Crop & Market'}</div>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                    {alertRecord.commodity} @ {alertRecord.market}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: '#10B981', marginTop: '2px' }}>
                    {isKannada ? 'ಪ್ರಸ್ತುತ ಮಾದರಿ ಬೆಲೆ:' : 'Current Modal Price:'} ₹{alertRecord.modalPrice.toLocaleString('en-IN')} / Qtl
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    {isKannada ? 'ಗುರಿ ಮಾದರಿ ಬೆಲೆ (₹ / ಕ್ವಿಂಟಾಲ್)' : 'Target Modal Price (₹ / Quintal)'}
                  </label>
                  <input
                    type="number"
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    placeholder="ಉದಾ: 15000"
                    style={{
                      width: '100%',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#FFFFFF',
                      fontSize: '1rem',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                    {isKannada
                      ? 'ಈ ಮಾರುಕಟ್ಟೆಯ ಮಾದರಿ ಬೆಲೆ ಈ ಮೊತ್ತವನ್ನು ತಲುಪಿದಾಗ ನೋಟಿಫಿಕೇಶನ್ ಬರುತ್ತದೆ.'
                      : 'Notify me when modal price reaches or exceeds this target.'}
                  </span>
                </div>

                <button
                  onClick={handleSaveAlert}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#070F1E',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  {isKannada ? 'ಎಚ್ಚರಿಕೆ ಉಳಿಸಿ' : 'Save Price Alert'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 🤖 MODAL 4: GEMINI AI EXPLANATION (Section 16)                */}
      {/* ============================================================ */}
      {showAiModal && aiRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => {
            voiceAssistant.stopSpeaking();
            setIsSpeakingAi(false);
            setShowAiModal(false);
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={22} color="#10B981" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {isKannada ? 'AI ಮಾರುಕಟ್ಟೆ ವಿವರಣೆ' : 'AI Market Explanation'}
                </h3>
              </div>
              <button
                onClick={() => {
                  voiceAssistant.stopSpeaking();
                  setIsSpeakingAi(false);
                  setShowAiModal(false);
                }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#A7F3D0', fontWeight: 700, marginBottom: '12px' }}>
              {aiRecord.commodity} @ {aiRecord.market} ({aiRecord.arrivalDate})
            </div>

            {aiLoading ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94A3B8' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#10B981' }} />
                <span>{isKannada ? 'ಜೆಮಿನಿ AI ದತ್ತಾಂಶವನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Gemini AI is analyzing official report...'}</span>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '0.94rem',
                    lineHeight: 1.6,
                    color: '#F1F5F9',
                    marginBottom: '16px'
                  }}
                >
                  {aiExplanation}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleToggleAiSpeech}
                    style={{
                      flex: 1,
                      background: isSpeakingAi ? '#EF4444' : 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: isSpeakingAi ? '#FFFFFF' : '#34D399',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {isSpeakingAi ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    <span>
                      {isSpeakingAi
                        ? (isKannada ? 'ನಿಲ್ಲಿಸಿ' : 'Stop')
                        : (isKannada ? 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ' : 'Listen Aloud')}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(aiExplanation);
                      alert(isKannada ? 'ವಿವರಣೆ ನಕಲಿಸಲಾಗಿದೆ!' : 'Copied to clipboard!');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isKannada ? 'ಕಾಪಿ ಮಾಡಿ' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 📈 Responsive Interactive SVG History Line Chart Component
// ============================================================
interface HistorySvgChartProps {
  points: MarketPriceHistoryPoint[];
  isKannada: boolean;
}

const HistorySvgChart: React.FC<HistorySvgChartProps> = ({ points, isKannada }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) return null;

  const width = 580;
  const height = 220;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Min and max price across all series
  const allPrices = points.flatMap((p) => [p.minPrice, p.maxPrice, p.modalPrice]).filter((v) => v > 0);
  const minVal = Math.max(0, Math.min(...allPrices) * 0.9);
  const maxVal = Math.max(...allPrices) * 1.1 || 1000;

  const getX = (idx: number) => {
    if (points.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (points.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return paddingTop + chartH / 2;
    return paddingTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
  };

  // Build SVG path strings
  const modalPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.modalPrice)}`)
    .join(' ');

  const maxPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.maxPrice)}`)
    .join(' ');

  const minPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.minPrice)}`)
    .join(' ');

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const val = Math.round(minVal + (maxVal - minVal) * pct);
          const y = paddingTop + chartH - pct * chartH;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94A3B8"
                fontWeight="600"
              >
                ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* X-axis date labels */}
        {points.map((p, i) => {
          // Label only every 2nd or 3rd if points are many
          if (points.length > 8 && i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) {
            return null;
          }
          const x = getX(i);
          const parts = p.date.split('/');
          const label = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : p.date;
          return (
            <text
              key={p.date}
              x={x}
              y={height - 12}
              textAnchor="middle"
              fontSize="10"
              fill="#94A3B8"
              fontWeight="600"
            >
              {label}
            </text>
          );
        })}

        {/* Min Line (Blue) */}
        <path d={minPath} fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.75" />

        {/* Max Line (Amber) */}
        <path d={maxPath} fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.75" />

        {/* Modal Price Line (Green - Primary) */}
        <path d={modalPath} fill="none" stroke="#10B981" strokeWidth="3.5" />

        {/* Data points */}
        {points.map((p, i) => {
          const x = getX(i);
          const y = getY(p.modalPrice);
          const isHovered = hoverIndex === i;
          return (
            <g
              key={p.date}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill="#10B981"
                stroke="#070F1E"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip on Hover */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '20px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #10B981',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        >
          <strong style={{ color: '#F1F5F9', display: 'block', marginBottom: '2px' }}>
            📅 {points[hoverIndex].date}
          </strong>
          <span style={{ color: '#34D399', fontWeight: 800 }}>
            {isKannada ? 'ಮಾದರಿ:' : 'Modal:'} ₹{points[hoverIndex].modalPrice.toLocaleString('en-IN')}
          </span>{' '}
          | <span style={{ color: '#FCD34D' }}>Max: ₹{points[hoverIndex].maxPrice.toLocaleString('en-IN')}</span>{' '}
          | <span style={{ color: '#93C5FD' }}>Min: ₹{points[hoverIndex].minPrice.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
};
