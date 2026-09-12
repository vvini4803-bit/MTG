import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { ViewTab } from '../types';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Trophy,
  BarChart3,
  Wheat,
  Landmark,
  FileText,
  AlertOctagon,
  Database,
  Activity,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

interface AdminDashboardScreenProps {
  onSelectAdminSubtab: (subtab: string) => void;
  onNavigateTab: (tab: ViewTab) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onSelectAdminSubtab,
  onNavigateTab
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, role, isAdmin, isModerator, claimAdminRole } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');

  const [usersCount, setUsersCount] = useState(0);
  const [pendingNewsCount, setPendingNewsCount] = useState(0);
  const [verifiedNewsCount, setVerifiedNewsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [tournamentsCount, setTournamentsCount] = useState(0);
  const [isDemo, setIsDemo] = useState(dbService.getDemoMode());

  useEffect(() => {
    dbService.subscribeUsers((u) => setUsersCount(u.length));
    dbService.subscribeNews((n) => {
      setPendingNewsCount(n.filter((item) => item.verification_status === 'PENDING' || item.verification_status === 'COMMUNITY_REPORT').length);
      setVerifiedNewsCount(n.filter((item) => item.verification_status === 'VERIFIED').length);
    });
    dbService.subscribeReports((r) => setReportsCount(r.filter((item) => item.status === 'PENDING').length));
    dbService.subscribeEvents((e) => setEventsCount(e.length));
    dbService.subscribeTournaments((t) => setTournamentsCount(t.length));
  }, []);

  if (!isModerator && !isAdmin) {
    const handleClaim = async () => {
      setClaiming(true);
      const res = await claimAdminRole('vvini4803@gmail.com');
      setClaiming(false);
      if (res.success) {
        setClaimMsg(res.message);
      }
    };

    return (
      <div className="container" style={{ padding: '60px 16px', maxWidth: '540px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '36px 24px' }}>
          <Lock size={44} color="#EF4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            {isKannada ? 'ನಿರ್ವಾಹಕ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ' : 'Administrative Access Restricted'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            {isKannada
              ? 'ಈ ವಿಭಾಗವನ್ನು ಪ್ರವೇಶಿಸಲು ಸೂಪರ್ ಅಡ್ಮಿನ್ ಅಥವಾ ವಿಷಯ ಪರಿಶೀಲಕ (Moderator) ರೋಲ್ ಅಗತ್ಯವಿದೆ.'
              : 'This portal is strictly protected by RBAC permissions. Currently logged in as: ' +
                (currentUser?.email || currentUser?.name || 'Resident') + ' (Role: ' + role + ').'}
          </p>

          {/* 👑 Instant 1-Tap Claim Super Admin Role button */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.08) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>👑</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FBBF24', margin: '0 0 6px' }}>
              {isKannada ? 'vvini4803@gmail.com ಅಡ್ಮಿನ್ ಪಾತ್ರ ಪಡೆಯಿರಿ' : 'Claim Super Admin Role (vvini4803@gmail.com)'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#E2E8F0', lineHeight: 1.5, margin: '0 0 14px' }}>
              {isKannada
                ? 'ನೀವು ಡೆವಲಪರ್ ಅಥವಾ ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿಯಾಗಿದ್ದರೆ, ನಿಮ್ಮ ಸೂಪರ್ ಅಡ್ಮಿನ್ ಹಕ್ಕನ್ನು ತಕ್ಷಣ ಸಕ್ರಿಯಗೊಳಿಸಲು ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ.'
                : 'Click below to claim and activate full Super Admin role and unlock all 7 governance desks.'}
            </p>

            {claimMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', marginBottom: '12px' }}>
                {claimMsg}
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={claiming}
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              <span>👑</span>
              <span>{claiming ? 'Activating...' : (isKannada ? 'ಅಡ್ಮಿನ್ ಪಾತ್ರ ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Claim Super Admin Role Now')}</span>
            </button>
          </div>

          <button onClick={() => onNavigateTab('profile')} className="btn-secondary" style={{ width: '100%' }}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const metricCards = [
    { title: 'Registered Citizens', count: usersCount, icon: Users, color: '#10B981', subtab: 'users' },
    { title: 'Pending Verification', count: pendingNewsCount, icon: ShieldAlert, color: '#F59E0B', subtab: 'news_verify' },
    { title: 'Verified News', count: verifiedNewsCount, icon: ShieldCheck, color: '#34D399', subtab: 'news_verify' },
    { title: 'Grievance Reports', count: reportsCount, icon: AlertOctagon, color: '#EF4444', subtab: 'moderation' },
    { title: 'Active Events', count: eventsCount, icon: Calendar, color: '#0284C7', subtab: 'events' },
    { title: 'Tournaments', count: tournamentsCount, icon: Trophy, color: '#8B5CF6', subtab: 'tournaments' }
  ];

  const adminModules = [
    {
      id: 'news_verify',
      title_en: 'News Verification Desk',
      title_kn: 'ಸುದ್ದಿ ಪರಿಶೀಲನಾ ಡೆಸ್ಕ್',
      desc_en: 'Approve, verify, reject community reports and publish official corrections',
      icon: ShieldCheck,
      color: '#10B981'
    },
    {
      id: 'users',
      title_en: 'Resident & RBAC Role Management',
      title_kn: 'ನಾಗರಿಕರು & ಪಾತ್ರಗಳ ನಿರ್ವಹಣೆ',
      desc_en: 'Manage permissions for Admins, Moderators, Sports Organizers, and Citizens',
      icon: Users,
      color: '#0284C7'
    },
    {
      id: 'moderation',
      title_en: 'Content Moderation & Reports',
      title_kn: 'ವಿಷಯ ನಿಯಂತ್ರಣ & ವರದಿ ಪರಿಶೀಲನೆ',
      desc_en: 'Audit flagged misinformation, offensive comments, and duplicate entries',
      icon: ShieldAlert,
      color: '#EF4444'
    },
    {
      id: 'events',
      title_en: 'Event & Festival Management',
      title_kn: 'ಕಾರ್ಯಕ್ರಮಗಳ ನಿರ್ವಹಣೆ',
      desc_en: 'Schedule Rathotsava, agricultural workshops, and manage attendee rosters',
      icon: Calendar,
      color: '#F59E0B'
    },
    {
      id: 'tournaments',
      title_en: 'Sports & Tournament Controller',
      title_kn: 'ಕ್ರೀಡಾ ಟೂರ್ನಮೆಂಟ್ ನಿಯಂತ್ರಣ',
      desc_en: 'Create leagues, assign scorekeepers, update points tables and live commentary',
      icon: Trophy,
      color: '#8B5CF6'
    },
    {
      id: 'village_data',
      title_en: 'Village Data & Demo Mode Switch',
      title_kn: 'ಗ್ರಾಮ ಅಂಕಿಅಂಶ & ಡೇಟಾ ಆಮದು',
      desc_en: 'Update official census statistics, import CSV/JSON, or toggle production mode',
      icon: Database,
      color: '#14B8A6'
    },
    {
      id: 'analytics',
      title_en: 'Administrative Analytics & Trends',
      title_kn: 'ಆಡಳಿತಾತ್ಮಕ ವಿಶ್ಲೇಷಣೆ',
      desc_en: 'Demographics growth, language usage breakdown, and community engagement metrics',
      icon: Activity,
      color: '#EC4899'
    }
  ];

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1080px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#FBBF24',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              ROLE: {role}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Gramasiri Administrative Portal
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>
            {isKannada ? 'ಗ್ರಾಮ ಆಡಳಿತ & ನಿಯಂತ್ರಣ ಕೇಂದ್ರ' : 'Gram Panchayat Admin & Moderation Hub'}
          </h1>
        </div>

        {/* Demo Mode Badge */}
        <div style={{
          background: isDemo ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${isDemo ? '#F59E0B' : '#10B981'}`,
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          textAlign: 'right'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>System State</span>
          <strong style={{ fontSize: '0.85rem', color: isDemo ? '#FBBF24' : '#34D399' }}>
            {isDemo ? '🧪 DEMO DATA ACTIVE' : '🛡️ PRODUCTION DATA ONLY'}
          </strong>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              onClick={() => onSelectAdminSubtab(m.subtab)}
              className="glass-card glass-card-interactive card-3d"
              style={{ padding: '18px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.title}</span>
                <Icon size={18} color={m.color} />
              </div>
              <strong style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF' }}>
                {m.count}
              </strong>
            </div>
          );
        })}
      </div>

      {/* Governance Modules Navigation */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
        {isKannada ? 'ಆಡಳಿತ ಮಾಡ್ಯೂಲ್‌ಗಳು' : 'Governance & Moderation Modules'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {adminModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              onClick={() => onSelectAdminSubtab(mod.id)}
              className="glass-card glass-card-interactive card-3d"
              style={{
                padding: '22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: `${mod.color}20`,
                  border: `1px solid ${mod.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={22} color={mod.color} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, marginBottom: '4px' }}>
                  {isKannada ? mod.title_kn : mod.title_en}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {mod.desc_en}
                </p>
              </div>

              <ArrowRight size={18} color="var(--text-muted)" style={{ alignSelf: 'center' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
