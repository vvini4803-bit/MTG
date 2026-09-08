import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import { HistoryItem, HistorySourceType } from '../types';
import {
  BookOpen,
  Calendar,
  ShieldCheck,
  Flame,
  Award,
  HelpCircle,
  Clock
} from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const { language, isKannada } = useLanguage();
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    return dbService.subscribeHistory(setHistoryList);
  }, []);

  const getTypeBadge = (type: HistorySourceType) => {
    switch (type) {
      case 'HISTORICAL_FACT':
        return {
          label: isKannada ? 'ಐತಿಹಾಸಿಕ ಸತ್ಯ (ದಾಖಲಿತ)' : 'Historical Fact',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)'
        };
      case 'LOCAL_TRADITION':
        return {
          label: isKannada ? 'ಸ್ಥಳೀಯ ಸಂಪ್ರದಾಯ' : 'Local Tradition',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)'
        };
      case 'COMMUNITY_STORY':
        return {
          label: isKannada ? 'ಸಮುದಾಯದ ಕಥೆ' : 'Community Story',
          color: '#0284C7',
          bg: 'rgba(2, 132, 199, 0.15)'
        };
      default:
        return {
          label: isKannada ? 'ಪರಿಶೀಲಿಸದ ಕಥೆ' : 'Unverified Story',
          color: '#94A3B8',
          bg: 'rgba(148, 163, 184, 0.15)'
        };
    }
  };

  const filteredHistory = historyList.filter((item) => {
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '840px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ನಮ್ಮ ಗ್ರಾಮದ ಇತಿಹಾಸ & ಪಯಣ' : 'Our Story & Historical Timeline'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada
            ? 'ಹೊಯ್ಸಳ ಕಾಲದ ಶಾಸನಗಳಿಂದ ಆಧುನಿಕ ದಿನಗಳವರೆಗಿನ ಪ್ರಮುಖ ಮೈಲುಗಲ್ಲುಗಳು'
            : 'From 12th century Hoysala inscriptions to modern rural milestones'}
        </p>
      </div>

      {/* Label Distinction Guide */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {isKannada ? 'ದಾಖಲಾತಿ ಮಾನದಂಡಗಳು:' : 'Authenticity Standard:'}
        </span>
        <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          🏛️ Historical Fact (Archaeological Inscriptions)
        </span>
        <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          🙏 Local Tradition (Ritual Customs)
        </span>
        <span style={{ fontSize: '0.72rem', background: 'rgba(2, 132, 199, 0.15)', color: '#38BDF8', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          📖 Community Story (Elder Memoirs)
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: isKannada ? 'ಎಲ್ಲಾ ದಾಖಲೆಗಳು' : 'All Milestones' },
          { id: 'HISTORICAL_FACT', label: isKannada ? 'ಐತಿಹಾಸಿಕ ಸತ್ಯಗಳು' : 'Historical Facts' },
          { id: 'LOCAL_TRADITION', label: isKannada ? 'ಸಂಪ್ರದಾಯಗಳು' : 'Traditions' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--glass-border)',
              background: typeFilter === tab.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: typeFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: typeFilter === tab.id ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Layout */}
      <div style={{ position: 'relative', paddingLeft: '28px' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '8px',
          width: '2px',
          background: 'linear-gradient(180deg, #10B981 0%, #F59E0B 50%, #0284C7 100%)'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredHistory.map((item) => {
            const badge = getTypeBadge(item.type);
            const title = language === 'kn' ? item.title_kn : item.title_en;
            const content = language === 'kn' ? item.content_kn : item.content_en;

            return (
              <div
                key={item.id}
                className="glass-card"
                style={{ padding: '20px', position: 'relative' }}
              >
                {/* Milestone Node on Line */}
                <div style={{
                  position: 'absolute',
                  left: '-26px',
                  top: '24px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: badge.color,
                  border: '3px solid var(--bg-primary)',
                  boxShadow: `0 0 10px ${badge.color}`
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    color: badge.color,
                    background: 'rgba(0,0,0,0.3)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {item.year}
                  </span>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      background: badge.bg,
                      color: badge.color,
                      letterSpacing: '0.04em'
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, marginBottom: '8px' }}>
                  {title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                  {content}
                </p>

                <div style={{
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '10px',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>Source: {item.source}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
