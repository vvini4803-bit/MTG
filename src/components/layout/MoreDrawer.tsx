import React from 'react';
import { ViewTab } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Wheat,
  Landmark,
  BookOpen,
  Camera,
  Award,
  Share2,
  Mic,
  BarChart3,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Flame,
  FileText,
  UserCheck
} from 'lucide-react';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ViewTab) => void;
  onOpenVoice: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenVoice
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, role, isAdmin, isModerator, isSportsOrganizer, loginWithDemo } = useAuth();

  if (!isOpen) return null;

  const navigate = (tab: ViewTab) => {
    onSelectTab(tab);
    onClose();
  };

  const menuSections = [
    {
      title: isKannada ? 'ಗ್ರಾಮ ಸೇವೆಗಳು & ಜ್ಞಾನ' : 'Village Services & Hubs',
      items: [
        { id: 'agriculture', label: isKannada ? 'ಕೃಷಿ ಮಾಹಿತಿ ಕೇಂದ್ರ' : 'Agriculture Hub', icon: Wheat, color: '#10B981' },
        { id: 'temples', label: isKannada ? 'ದೇವಸ್ಥಾನ & ಸಂಸ್ಕೃತಿ' : 'Temples & Culture', icon: Landmark, color: '#F59E0B' },
        { id: 'history', label: isKannada ? 'ಇತಿಹಾಸ & ಪರಂಪರೆ' : 'History & Timeline', icon: BookOpen, color: '#0284C7' },
        { id: 'stories', label: isKannada ? 'ಗ್ರಾಮದ ಕಥೆಗಳು' : 'Village Stories & Lore', icon: Flame, color: '#EA580C' },
        { id: 'stats', label: isKannada ? 'ಅಧಿಕೃತ ಅಂಕಿಅಂಶ' : 'Verified Village Data', icon: BarChart3, color: '#8B5CF6' },
        { id: 'achievements', label: isKannada ? 'ಗ್ರಾಮದ ಸಾಧನೆಗಳು' : 'Achievements & Pride', icon: Award, color: '#EC4899' },
        { id: 'gallery', label: isKannada ? 'ಫೋಟೋ & ವೀಡಿಯೊ ಗ್ಯಾಲರಿ' : 'Photo & Video Gallery', icon: Camera, color: '#14B8A6' },
        { id: 'social', label: isKannada ? 'ಸಾಮಾಜಿಕ ಜಾಲತಾಣ ಸಂಪರ್ಕ' : 'Official Social Media', icon: Share2, color: '#6366F1' }
      ]
    },
    {
      title: isKannada ? 'ಸಿಸ್ಟಮ್ & ಸೆಟ್ಟಿಂಗ್ಸ್' : 'System & Preferences',
      items: [
        { id: 'settings', label: isKannada ? 'ಸೆಟ್ಟಿಂಗ್ಸ್ & ಭಾಷೆ' : 'Settings & Language', icon: Settings, color: '#64748B' },
        { id: 'privacy', label: isKannada ? 'ಗೌಪ್ಯತೆ & ಸಮುದಾಯ ನಿಯಮಗಳು' : 'Privacy & Guidelines', icon: ShieldCheck, color: '#059669' },
        { id: 'reports', label: isKannada ? 'ವರದಿಗಳ ಸ್ಥಿತಿ' : 'Reports & Appeals', icon: ShieldAlert, color: '#DC2626' }
      ]
    }
  ];

  return (
    <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={onClose}>
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          height: '100vh',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.svg" alt="Gramasiri" style={{ width: '32px', height: '32px' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {isKannada ? 'ಗ್ರಾಮಸಿರಿ ಮೆನು' : 'Village Directory'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {isKannada ? 'ಎಲ್ಲಾ ಸೇವೆಗಳು ಒಂದೆಡೆ' : 'All village portals in one app'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px'
            }}
            aria-label="Close Drawer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Voice Assistant Promo Tile */}
        <div style={{ padding: '16px 20px 0' }}>
          <div
            onClick={() => {
              onClose();
              onOpenVoice();
            }}
            className="glass-card"
            style={{
              padding: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Mic size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                {isKannada ? 'ದ್ವಿಭಾಷಾ ಧ್ವನಿ ಸಹಾಯಕ' : 'Bilingual Voice Assistant'}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isKannada ? 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ' : 'Ask questions in Kannada or English'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {menuSections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: '24px' }}>
              <h5 style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                marginBottom: '10px'
              }}>
                {sec.title}
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id as ViewTab)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: `${item.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={18} color={item.color} />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin & Moderation Section */}
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#F59E0B',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={14} />
              {isKannada ? 'ನಿರ್ವಹಣಾ ಪೋರ್ಟಲ್ (RBAC)' : 'Administration & Governance'}
            </h5>
            <button
              onClick={() => navigate('admin')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#FBBF24',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 700
              }}
            >
              <FileText size={18} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{isKannada ? 'ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Admin & Moderation Hub'}</span>
                  <span style={{ fontSize: '0.65rem', background: '#D97706', color: '#FFF', padding: '1px 5px', borderRadius: '4px' }}>
                    {role}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, display: 'block' }}>
                  {isKannada ? 'ಸುದ್ದಿ ಪರಿಶೀಲನೆ, ವರದಿಗಳು & ಅಂಕಿಅಂಶ' : 'Verify news, moderate posts, manage data'}
                </span>
              </div>
            </button>
          </div>

          {/* Quick Demo Role Switcher for seamless testing */}
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              <UserCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {isKannada ? 'ಪರೀಕ್ಷಾ ರೋಲ್ ಸ್ವಿಚ್ (RBAC ಡೆಮೊ):' : 'Test RBAC Roles Switcher:'}
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { r: 'SUPER_ADMIN', label: 'Admin' },
                { r: 'MODERATOR', label: 'Moderator' },
                { r: 'SPORTS_ORGANIZER', label: 'Sports Org' },
                { r: 'USER', label: 'Resident' }
              ].map((item) => (
                <button
                  key={item.r}
                  onClick={() => loginWithDemo(item.r as any)}
                  style={{
                    fontSize: '0.68rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--glass-border)',
                    background: role === item.r ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontWeight: role === item.r ? 700 : 500
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--glass-border)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Gramasiri v2.6.0 PWA</span>
          <span>© 2026 {isKannada ? 'ಗ್ರಾಮ ಪಂಚಾಯತಿ' : 'Gram Panchayat'}</span>
        </div>
      </div>
    </div>
  );
};
