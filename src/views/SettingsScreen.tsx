import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { notificationService } from '../services/notificationService';
import { triggerHapticFeedback } from '../services/deviceIdentity';
import {
  Globe,
  Moon,
  Sun,
  Type,
  Wifi,
  WifiOff,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Users,
  Bell,
  Volume2,
  ShieldCheck,
  Check
} from 'lucide-react';

interface SettingsScreenProps {
  onNavigateTab?: (tab: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigateTab }) => {
  const { language, setLanguage, isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState('15');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [soundTested, setSoundTested] = useState(false);

  // Messages & Privacy State
  const [allowFindMe, setAllowFindMe] = useState(currentUser?.allow_find_me !== false);
  const [privacyMessage, setPrivacyMessage] = useState(currentUser?.privacy_message || 'EVERYONE');
  const [privacySaved, setPrivacySaved] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('gramasiri_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('gramasiri_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  };

  const handleClearOfflineCache = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '640px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ಸೆಟ್ಟಿಂಗ್ಸ್ & ಆದ್ಯತೆಗಳು' : 'Settings & Preferences'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada ? 'ಭಾಷೆ, ಥೀಮ್, ಅಕ್ಷರ ಗಾತ್ರ ಮತ್ತು ಆಫ್‌ಲೈನ್ ಕಾನ್ಫಿಗರೇಶನ್' : 'Language, theme, font size, and offline caching options'}
        </p>
      </div>

      {/* Network Status Banner */}
      <div
        style={{
          background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : '#EF4444'}`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        {isOnline ? <Wifi size={20} color="#10B981" /> : <WifiOff size={20} color="#EF4444" />}
        <div>
          <strong style={{ fontSize: '0.9rem', color: isOnline ? '#34D399' : '#FCA5A5', display: 'block' }}>
            {isOnline
              ? isKannada ? 'ಆನ್‌ಲೈನ್ ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕದಲ್ಲಿದೆ' : 'Connected to Village Network'
              : isKannada ? 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ' : 'You are currently offline'}
          </strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {isOnline
              ? isKannada ? 'ನೈಜ ಸಮಯದ ಅಪ್‌ಡೇಟ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿವೆ.' : 'Real-time database sync is active.'
              : isKannada ? 'ಕೊನೆಯದಾಗಿ ಉಳಿಸಿದ ಮಾಹಿತಿಯನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.' : 'Displaying latest locally cached records.'}
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Language Selection */}
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={16} color="#10B981" />
            <span>{isKannada ? 'ಭಾಷೆ ಆಯ್ಕೆ (Language Selection)' : 'Display Language'}</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                background: language === 'en' ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.04)',
                color: '#FFFFFF',
                fontWeight: language === 'en' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('kn')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                background: language === 'kn' ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.04)',
                color: '#FFFFFF',
                fontWeight: language === 'kn' ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-family-kannada)'
              }}
            >
              ಕನ್ನಡ (Kannada)
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {theme === 'dark' ? <Moon size={16} color="#FBBF24" /> : <Sun size={16} color="#F59E0B" />}
            <span>{isKannada ? 'ಬಣ್ಣದ ಥೀಮ್ (Visual Theme)' : 'Theme Mode'}</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => handleThemeChange('dark')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                background: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: '#FFFFFF',
                fontWeight: theme === 'dark' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              🌙 Dark Mode (Default)
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                background: theme === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)',
                fontWeight: theme === 'light' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              ☀️ Light Mode
            </button>
          </div>
        </div>

        {/* Accessibility Font Size */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Type size={16} color="#0284C7" />
              <span>{isKannada ? 'ಅಕ್ಷರ ಗಾತ್ರ (Accessibility Text Size)' : 'Text Size Accessibility'}</span>
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              {fontSize}px
            </span>
          </div>
          <input
            type="range"
            min="14"
            max="19"
            step="1"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>Standard (14px)</span>
            <span>Medium (16px)</span>
            <span>Large / Senior (19px)</span>
          </div>
        </div>

        {/* 💬 Messages & Find People Settings */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#10B981" />
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {isKannada ? 'ಸಂದೇಶಗಳು & ಗ್ರಾಮಸ್ಥರ ಸಂಪರ್ಕ ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Messages & Village Directory Settings'}
              </strong>
            </div>
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
              {isKannada ? '⚡ ನೈಜ ಸಮಯದ ಲೈವ್ ಸಿಂಕ್' : '⚡ Realtime Live Sync'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Real-time Status */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34D399', display: 'block' }}>
                  {isKannada ? '🟢 ವಾಟ್ಸಾಪ್ ಮಾದರಿಯ ಕ್ಷಣಾರ್ಧ ಸಂದೇಶ ವಿತರಣೆ ಸಕ್ರಿಯ' : '🟢 WhatsApp-grade Instant Message Sync Active'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {isKannada
                    ? 'ಸಂದೇಶ ಮತ್ತು ಫೋಟೋ ಕಳುಹಿಸಿದ ತಕ್ಷಣವೇ ಘಂಟೆ ಐಕಾನ್‌ನಲ್ಲಿ ಅಧಿಸೂಚನೆ ತಲುಪುತ್ತದೆ.'
                    : 'Messages & photos are delivered instantly with immediate notification bell alerts.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  notificationService.playMessageReceived();
                  triggerHapticFeedback();
                  setSoundTested(true);
                  setTimeout(() => setSoundTested(false), 2000);
                }}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Test notification sound & vibration"
              >
                <Volume2 size={14} color="#10B981" />
                <span>{soundTested ? (isKannada ? 'ಶಬ್ದ ಪರೀಕ್ಷಿತ!' : 'Sound Tested!') : (isKannada ? 'ಶಬ್ದ ಪರೀಕ್ಷಿಸಿ' : 'Test Alert Sound')}</span>
              </button>
            </div>

            {/* Find People Directory Shortcut */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} color="#38BDF8" />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#FFFFFF', display: 'block' }}>
                    {isKannada ? 'ಗ್ರಾಮಸ್ಥರನ್ನು ಹುಡುಕಿ (Find People)' : 'Find People Directory'}
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {isKannada ? 'ರೈತರು, ಕ್ರೀಡಾಪಟುಗಳು, ಶಿಕ್ಷಕರು ಮತ್ತು ಗ್ರಾಮಸ್ಥರ ಸಂಪರ್ಕ ಪಟ್ಟಿ' : 'Search and connect with verified village residents'}
                  </span>
                </div>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('people')}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                >
                  {isKannada ? 'ಡೈರೆಕ್ಟರಿ ತೆರೆಯಿರಿ' : 'Open Directory'} →
                </button>
              )}
            </div>

            {/* Privacy Controls (if logged in) */}
            {currentUser && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    <ShieldCheck size={16} color="#10B981" />
                    <span>{isKannada ? 'ಗ್ರಾಮಸ್ಥರ ಪಟ್ಟಿಯಲ್ಲಿ ನನ್ನನ್ನು ತೋರಿಸಿ' : 'Allow others to find me in directory'}</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={allowFindMe}
                    onChange={async (e) => {
                      const val = e.target.checked;
                      setAllowFindMe(val);
                      await dbService.updateUserPrivacy(currentUser.uid, { allow_find_me: val });
                      setPrivacySaved(true);
                      setTimeout(() => setPrivacySaved(false), 2000);
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {isKannada ? 'ಯಾರು ಸಂದೇಶ ಕಳುಹಿಸಬಹುದು:' : 'Who can message me:'}
                  </span>
                  <select
                    value={privacyMessage}
                    onChange={async (e) => {
                      const val = e.target.value as 'EVERYONE' | 'VILLAGE_MEMBERS' | 'NOBODY';
                      setPrivacyMessage(val);
                      await dbService.updateUserPrivacy(currentUser.uid, { privacy_message: val });
                      setPrivacySaved(true);
                      setTimeout(() => setPrivacySaved(false), 2000);
                    }}
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="EVERYONE">{isKannada ? 'ಎಲ್ಲಾ ಗ್ರಾಮಸ್ಥರು (Everyone)' : 'Everyone in Village'}</option>
                    <option value="VILLAGE_MEMBERS">{isKannada ? 'ದೃಢೀಕೃತ ಸದಸ್ಯರು ಮಾತ್ರ (Verified Only)' : 'Verified Only'}</option>
                    <option value="NOBODY">{isKannada ? 'ಯಾರೂ ಬೇಡ (Nobody)' : 'Nobody'}</option>
                  </select>
                </div>
                {privacySaved && (
                  <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                    ✓ {isKannada ? 'ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಲಾಗಿದೆ!' : 'Privacy settings saved!'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cache & Offline Maintenance */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <label className="form-label">{isKannada ? 'ಆಫ್‌ಲೈನ್ ಕ್ಯಾಶ್ ನಿರ್ವಹಣೆ' : 'Offline Cache Management'}</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Gramasiri Progressive Web App (PWA) cache
            </span>
            <button
              onClick={handleClearOfflineCache}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '34px' }}
            >
              {cacheCleared ? <CheckCircle2 size={14} color="#10B981" /> : <Trash2 size={14} />}
              <span>{cacheCleared ? 'Cache Cleaned' : 'Clear Cache'}</span>
            </button>
          </div>
        </div>

        {/* Developer & Project Profile */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <label className="form-label">{isKannada ? 'ಯೋಜನೆಯ ತಂತ್ರಜ್ಞಾನ ಅಭಿವೃದ್ಧಿಕಾರರು' : 'Project Developer & Creator'}</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src="/developer.png"
                alt="Vinay - Developer"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #10B981',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: '#10B981',
                  color: '#070F1E',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 900
                }}
              >
                ✓
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>Vinay (ವಿನಯ್)</strong>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                  DEVELOPER
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಮುತ್ತಾಗೊಂದಿ ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಪೋರ್ಟಲ್ ಹಾಗೂ ತಂತ್ರಜ್ಞಾನ ವ್ಯವಸ್ಥೆಯನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸಿ ನಿರ್ಮಿಸಿದವರು.'
                  : 'Lead Developer & Creator of the Muttagundi Digital Village Portal & Community Systems.'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#A7F3D0', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                  React • TypeScript • Three.js 3D • Gemini AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
