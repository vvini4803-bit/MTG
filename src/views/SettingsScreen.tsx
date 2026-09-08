import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Moon, Sun, Type, Wifi, WifiOff, Trash2, CheckCircle2 } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { language, setLanguage, isKannada } = useLanguage();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState('15');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheCleared, setCacheCleared] = useState(false);

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
      </div>
    </div>
  );
};
