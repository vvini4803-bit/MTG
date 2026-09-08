import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ViewTab, NotificationItem } from '../../types';
import { dbService } from '../../services/dbService';
import {
  Globe,
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  Shield,
  User,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenMore: () => void;
  onOpenVoice: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenMore,
  onOpenVoice
}) => {
  const { language, setLanguage, isKannada } = useLanguage();
  const { currentUser, role, isAdmin } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('gramasiri_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('gramasiri_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    return dbService.subscribeNotifications(currentUser?.uid || 'ALL', (notifs: NotificationItem[]) => {
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });
  }, [currentUser]);

  const villageName = isKannada
    ? (import.meta.env.VITE_VILLAGE_NAME_KN || 'ನಮ್ಮ ಗ್ರಾಮ')
    : (import.meta.env.VITE_VILLAGE_NAME_EN || 'Gramasiri');

  return (
    <header className="header-glass">
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px'
      }}>
        {/* Left: Brand Identity */}
        <div
          onClick={() => onSelectTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <img
            src="/logo.svg"
            alt="Gramasiri Logo"
            style={{ width: '42px', height: '42px', filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4))' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {villageName}
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                fontWeight: 700
              }}>
                SUPER APP
              </span>
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              {isKannada ? 'ನಮ್ಮ ಗ್ರಾಮ — ನಮ್ಮ ಭವಿಷ್ಯ' : 'Official Community Portal'}
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav style={{
          display: 'none',
          gap: '6px',
          alignItems: 'center'
        }} className="desktop-nav-links">
          <style>{`
            @media (min-width: 901px) {
              .desktop-nav-links { display: flex !important; }
            }
          `}</style>
          {[
            { id: 'home', label: isKannada ? 'ಮುಖಪುಟ' : 'Home' },
            { id: 'news', label: isKannada ? 'ಸುದ್ದಿ' : 'News' },
            { id: 'events', label: isKannada ? 'ಕಾರ್ಯಕ್ರಮಗಳು' : 'Events' },
            { id: 'sports', label: isKannada ? 'ಕ್ರೀಡೆ' : 'Sports' },
            { id: 'agriculture', label: isKannada ? 'ಕೃಷಿ' : 'Agriculture' },
            { id: 'temples', label: isKannada ? 'ದೇವಸ್ಥಾನ' : 'Temples' },
            { id: 'stats', label: isKannada ? 'ಅಂಕಿಅಂಶ' : 'Data' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as ViewTab)}
              style={{
                background: currentTab === item.id ? 'rgba(16, 185, 129, 0.15)' : 'none',
                color: currentTab === item.id ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                fontWeight: currentTab === item.id ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {item.label}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              style={{
                background: currentTab === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Shield size={13} />
              {isKannada ? 'ನಿರ್ವಾಹಕ' : 'Admin'}
            </button>
          )}
        </nav>

        {/* Right: Controls & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Voice Assistant Trigger */}
          <button
            onClick={onOpenVoice}
            className="btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: '0.82rem',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Ask bilingual Voice Assistant"
          >
            <Sparkles size={15} color="#FEF08A" />
            <span style={{ display: 'none' }} className="voice-btn-text">
              {isKannada ? 'ಧ್ವನಿ' : 'Voice'}
            </span>
            <style>{`@media (min-width: 600px) { .voice-btn-text { display: inline !important; } }`}</style>
          </button>

          {/* Search */}
          <button
            onClick={() => onSelectTab('search')}
            style={{
              background: 'none',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            aria-label="Global Search"
          >
            <Search size={17} />
          </button>

          {/* Notifications */}
          <button
            onClick={() => onSelectTab('notifications')}
            style={{
              background: 'none',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              position: 'relative'
            }}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.78rem'
            }}
            title="Switch Language (EN / ಕನ್ನಡ)"
          >
            <Globe size={14} color="#10B981" />
            <span>{language === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} color="#FBBF24" /> : <Moon size={17} />}
          </button>

          {/* User Profile / Role Badge */}
          {currentUser ? (
            <div
              onClick={() => onSelectTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)'
              }}
            >
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div style={{ display: 'none' }} className="user-role-label">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>
                  {isKannada && currentUser.name_kn ? currentUser.name_kn : currentUser.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  {role.replace('_', ' ')}
                </span>
              </div>
              <style>{`@media (min-width: 1024px) { .user-role-label { display: block !important; } }`}</style>
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('profile')}
              className="btn-secondary"
              style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem' }}
            >
              <User size={15} />
              <span>{isKannada ? 'ಲಾಗಿನ್' : 'Sign In'}</span>
            </button>
          )}

          {/* More Drawer Hamburger */}
          <button
            onClick={onOpenMore}
            style={{
              background: 'none',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            aria-label="Open More Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
