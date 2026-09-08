import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import {
  Activity,
  ArrowLeft,
  Users,
  Newspaper,
  Globe,
  TrendingUp,
  BarChart2,
  PieChart,
  ShieldCheck
} from 'lucide-react';

interface AnalyticsScreenProps {
  onBack: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const [usersCount, setUsersCount] = useState(4);
  const [newsCount, setNewsCount] = useState(4);

  useEffect(() => {
    dbService.subscribeUsers((u) => setUsersCount(u.length));
    dbService.subscribeNews((n) => setNewsCount(n.length));
  }, []);

  const languageStats = [
    { label: 'ಕನ್ನಡ (Kannada)', pct: 68, color: '#10B981' },
    { label: 'English', pct: 32, color: '#0284C7' }
  ];

  const categoryTraffic = [
    { cat: 'Drinking Water & Civic News', pct: 34, color: '#0284C7' },
    { cat: 'Sports & Live Scores', pct: 26, color: '#F59E0B' },
    { cat: 'Agriculture Advisories', pct: 22, color: '#10B981' },
    { cat: 'Temple Festivals & Events', pct: 18, color: '#EC4899' }
  ];

  const weeklyTraffic = [
    { day: 'Mon', visits: 420 },
    { day: 'Tue', visits: 580 },
    { day: 'Wed', visits: 510 },
    { day: 'Thu', visits: 690 },
    { day: 'Fri', visits: 820 },
    { day: 'Sat', visits: 1140 },
    { day: 'Sun', visits: 1480 }
  ];

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

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          Village Platform Analytics & Demographics
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Insights on resident engagement, category interest, language preferences, and weekly traffic trends
        </p>
      </div>

      {/* Analytics Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Daily Active Residents
          </span>
          <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>
            642
          </strong>
          <span style={{ fontSize: '0.72rem', color: '#34D399', display: 'block', marginTop: '4px' }}>
            ↑ 14.8% from last week
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Voice Assistant Inquiries
          </span>
          <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
            384
          </strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            71% spoken in Kannada
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Avg Moderation Turnaround
          </span>
          <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7' }}>
            24 mins
          </strong>
          <span style={{ fontSize: '0.72rem', color: '#38BDF8', display: 'block', marginTop: '4px' }}>
            Target: &lt; 45 mins
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Weekly Engagement Bar Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="#10B981" />
            Weekly Resident Activity (Visits)
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', paddingTop: '20px' }}>
            {weeklyTraffic.map((w, idx) => {
              const heightPct = Math.round((w.visits / 1500) * 100);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{w.visits}</span>
                  <div
                    style={{
                      width: '60%',
                      height: `${heightPct}%`,
                      background: idx >= 5 ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{w.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Language Preference Breakdown */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#0284C7" />
            Language Preference Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {languageStats.map((l, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>{l.label}</span>
                  <strong style={{ color: l.color }}>{l.pct}%</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${l.pct}%`, height: '100%', background: l.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total user sessions analyzed: 12,450
          </div>
        </div>
      </div>

      {/* Category Popularity Bars */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
          Content Consumption by Village Category
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {categoryTraffic.map((c, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span>{c.cat}</span>
                <strong>{c.pct}%</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
