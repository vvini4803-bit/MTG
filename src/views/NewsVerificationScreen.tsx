import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { NewsItem, VerificationStatus } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Search,
  Clock,
  Pin,
  Flame,
  Radio
} from 'lucide-react';

interface NewsVerificationScreenProps {
  onBack: () => void;
}

export const NewsVerificationScreen: React.FC<NewsVerificationScreenProps> = ({ onBack }) => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'VERIFIED' | 'COMMUNITY_REPORT' | 'ALL'>('PENDING');

  useEffect(() => {
    return dbService.subscribeNews(setNews);
  }, []);

  const handleVerify = async (item: NewsItem, status: VerificationStatus) => {
    if (!currentUser) return;
    await dbService.verifyNews(
      item.id,
      status,
      currentUser.uid,
      currentUser.name
    );
  };

  const handleToggleUrgent = async (item: NewsItem) => {
    if (!currentUser) return;
    await dbService.verifyNews(
      item.id,
      item.verification_status,
      currentUser.uid,
      currentUser.name,
      item.official_correction,
      item.official_correction_kn,
      !item.urgent
    );
  };

  const filtered = news.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return item.verification_status === 'PENDING' || item.verification_status === 'COMMUNITY_REPORT';
    return item.verification_status === filter;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>News & Broadcast Verification Desk</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Review citizen submissions, stamp verification, attach official corrections, or broadcast emergency alerts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'VERIFIED', label: 'Verified Items' },
            { id: 'ALL', label: 'All Updates' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--glass-border)',
                background: filter === tab.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
                color: filter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: filter === tab.id ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <p>Verification queue is empty. All current submissions are processed.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={item.verification_status === 'VERIFIED' ? 'badge badge-verified' : 'badge badge-pending'}>
                    {item.verification_status}
                  </span>
                  {item.urgent && <span className="badge badge-urgent">🚨 URGENT ALERT</span>}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {item.category}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Submitted on {item.created_at.replace('T', ' ').slice(0, 16)} by <strong>{item.author_name}</strong>
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
                {language === 'kn' ? item.title_kn : item.title_en}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                {language === 'kn' ? item.content_kn : item.content_en}
              </p>

              {item.media_url && (
                <div style={{ maxHeight: '200px', width: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '14px' }}>
                  <img src={item.media_url} alt="Post attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleVerify(item, 'VERIFIED')}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Stamp as Verified</span>
                  </button>

                  <button
                    onClick={() => handleVerify(item, 'REJECTED')}
                    className="btn-danger"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
                  >
                    <XCircle size={14} />
                    <span>Reject / Flag False</span>
                  </button>
                </div>

                <button
                  onClick={() => handleToggleUrgent(item)}
                  className="btn-secondary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    minHeight: '34px',
                    color: item.urgent ? '#EF4444' : 'var(--text-secondary)'
                  }}
                >
                  <Radio size={14} />
                  <span>{item.urgent ? 'Revoke Urgent Alert' : 'Mark as Urgent Broadcast'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
