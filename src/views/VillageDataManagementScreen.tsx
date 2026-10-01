import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import { marketPriceService } from '../services/marketPriceService';
import { MarketPriceRecord } from '../types/market';
import {
  Database,
  ArrowLeft,
  Upload,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Wheat
} from 'lucide-react';

interface VillageDataManagementScreenProps {
  onBack: () => void;
}

export const VillageDataManagementScreen: React.FC<VillageDataManagementScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const [isDemo, setIsDemo] = useState(dbService.getDemoMode());
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Gemini AI Agricultural Market Engine State
  const [marketStatus, setMarketStatus] = useState<{
    loading: boolean;
    marketsCount: number;
    commoditiesCount: number;
    recordsCount: number;
    lastFetchTime: string;
    reportDate: string;
    status: 'CONNECTED' | 'ERROR';
    source: string;
    isCached: boolean;
  }>({
    loading: true,
    marketsCount: 0,
    commoditiesCount: 0,
    recordsCount: 0,
    lastFetchTime: 'Not synced yet',
    reportDate: 'Pending',
    status: 'CONNECTED',
    source: 'AGMARKNET 2.0 / GOI + Gemini AI',
    isCached: false
  });

  const checkMarketStatus = async (force: boolean = false) => {
    setMarketStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await marketPriceService.getMarketPrices({ state: 'Karnataka' }, force);
      const uniqueMarkets = new Set(res.records.map((r: MarketPriceRecord) => r.market)).size;
      const uniqueCommodities = new Set(res.records.map((r: MarketPriceRecord) => r.commodity)).size;

      setMarketStatus({
        loading: false,
        marketsCount: uniqueMarkets,
        commoditiesCount: uniqueCommodities,
        recordsCount: res.records.length,
        lastFetchTime: res.lastUpdated || new Date().toLocaleString(),
        reportDate: res.reportDate,
        status: 'CONNECTED',
        source: res.source,
        isCached: res.isCached
      });
    } catch (e) {
      setMarketStatus((prev) => ({
        ...prev,
        loading: false,
        status: 'ERROR',
        lastFetchTime: new Date().toLocaleString()
      }));
    }
  };

  useEffect(() => {
    checkMarketStatus();
  }, []);

  const handleToggleDemoMode = () => {
    const next = !isDemo;
    dbService.setDemoMode(next);
    setIsDemo(next);
  };

  const handleExport = () => {
    const jsonStr = dbService.exportCompleteDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gramasiri-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const res = dbService.importDatabase(importJsonText);
    setImportStatus(res.message);
    if (res.success) {
      setImportJsonText('');
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '840px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent-emerald)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          marginBottom: '16px'
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Admin Hub</span>
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          Village Data Controller & Production Switch
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Toggle between development sample data and real municipal production state, or import records
        </p>
      </div>

      {/* Production vs Demo Mode Switcher Card */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '28px',
          border: isDemo ? '1px solid #F59E0B' : '1px solid #10B981'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Database size={20} color={isDemo ? '#F59E0B' : '#10B981'} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {isDemo ? 'Development Demo Mode: ON' : 'Production Real-Data Mode: ACTIVE'}
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
              {isDemo
                ? 'Displaying labeled sample seed data for festivals, news, and sports. Switch to Production to remove sample records so unverified fields display "Information not available yet".'
                : 'Zero sample data. All fields display verified municipal records or indicate "Awaiting verification".'}
            </p>
          </div>

          <button
            onClick={handleToggleDemoMode}
            className={isDemo ? 'btn-primary' : 'btn-gold'}
            style={{ padding: '10px 20px' }}
          >
            {isDemo ? 'Switch to Real Production Mode' : 'Restore Demo Test Data'}
          </button>
        </div>
      </div>

      {/* Export / Backup Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
              Export Complete Village Database
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Download a complete verified JSON backup of all news, events, crops, temples, and statistics
            </p>
          </div>
          <button onClick={handleExport} className="btn-secondary" style={{ padding: '8px 18px' }}>
            <Download size={16} />
            <span>Download Backup (JSON)</span>
          </button>
        </div>
      </div>

      {/* Real Data Import Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
          Import Real Municipal / Panchayat Data
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Paste verified JSON data exported from municipal revenue or agricultural portals to update database collections
        </p>

        {importStatus && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: '#34D399',
              fontSize: '0.82rem',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="form-group">
          <textarea
            className="form-textarea"
            rows={5}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder='{"village_stats": { ... }, "news": [ ... ], "crops": [ ... ]}'
          />
        </div>

        <button
          onClick={handleImport}
          className="btn-primary"
          disabled={!importJsonText.trim()}
          style={{ padding: '8px 20px' }}
        >
          <Upload size={16} />
          <span>Validate & Import Data</span>
        </button>
      </div>

      {/* 🌾 SECTION: AGMARKNET & Gemini AI Agricultural Market Engine Status */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '28px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wheat size={20} color="#10B981" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {isKannada ? 'AGMARKNET 2.0 ಮತ್ತು ಜೆಮಿನಿ AI ಕೃಷಿ ಮಾರುಕಟ್ಟೆ ಎಂಜಿನ್' : 'AGMARKNET 2.0 & Gemini AI Market Engine Status'}
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Official Government Portal (agmarknet.gov.in) & Google Gemini AI • Karnataka APMC Mandi Daily Intelligence
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href="https://www.agmarknet.gov.in/home"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem'
              }}
            >
              <span>{isKannada ? 'ಅಧಿಕೃತ AGMARKNET' : 'Official AGMARKNET'}</span>
              <ExternalLink size={14} />
            </a>

            <button
              onClick={() => checkMarketStatus(true)}
              disabled={marketStatus.loading}
              className="btn-secondary"
              style={{
                padding: '8px 16px',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={15} className={marketStatus.loading ? 'animate-spin' : ''} />
              <span>{marketStatus.loading ? 'Testing...' : 'Test Connection & Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Connection Status
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: marketStatus.status === 'CONNECTED' ? '#34D399' : '#EF4444', marginTop: '4px' }}>
              {marketStatus.status === 'CONNECTED' ? '● Connected (AGMARKNET + AI)' : '● Offline / Error'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Reporting APMC Markets
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              {marketStatus.marketsCount} APMCs (Karnataka)
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Commodities Reporting
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              {marketStatus.commoditiesCount} Commodities
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Latest Arrival Report Date
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FCD34D', marginTop: '4px' }}>
              {marketStatus.reportDate}
            </div>
          </div>
        </div>

        {/* Notice on Official Source Integrity */}
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.78rem',
            color: '#93C5FD',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#60A5FA' }} />
          <div>
            <strong>Hybrid Official AGMARKNET & Gemini AI Engine:</strong> Daily agricultural market rates are sourced directly from Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, Government of India (agmarknet.gov.in) and data.gov.in. Real-time market advisory, voice synthesis, price comparisons, and high-availability uptime failover are managed continuously via Google Gemini AI.
          </div>
        </div>
      </div>
    </div>
  );
};
