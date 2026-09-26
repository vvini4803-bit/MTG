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
  Check,
  BellRing,
  BellOff,
  Smartphone,
  VolumeX,
  AlertTriangle,
  Send,
  Sparkles
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

  // Mobile Push Notifications State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    notificationService.getPermission()
  );
  const [testNotifSent, setTestNotifSent] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Notification category toggles
  const [allowMsgNotif, setAllowMsgNotif] = useState(() => localStorage.getItem('notif_messages') !== 'false');
  const [allowEmergencyNotif, setAllowEmergencyNotif] = useState(() => localStorage.getItem('notif_emergency') !== 'false');
  const [allowNewsNotif, setAllowNewsNotif] = useState(() => localStorage.getItem('notif_news') !== 'false');
  const [allowEventsNotif, setAllowEventsNotif] = useState(() => localStorage.getItem('notif_events') !== 'false');
  const [allowSoundHaptics, setAllowSoundHaptics] = useState(() => localStorage.getItem('notif_sound') !== 'false');

  // Messages & Privacy State
  const [allowFindMe, setAllowFindMe] = useState(currentUser?.allow_find_me !== false);
  const [privacyMessage, setPrivacyMessage] = useState(currentUser?.privacy_message || 'EVERYONE');
  const [privacySaved, setPrivacySaved] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('gramasiri_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const updatePerm = () => setNotifPermission(notificationService.getPermission());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', updatePerm);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', updatePerm);
    };
  }, []);

  const handleAllowNotifications = async () => {
    setIsRequestingPermission(true);
    try {
      const granted = await notificationService.requestPermission();
      setNotifPermission(notificationService.getPermission());
      if (granted) {
        triggerHapticFeedback();
        await notificationService.sendTestNotification(isKannada);
        setTestNotifSent(true);
        setTimeout(() => setTestNotifSent(false), 3500);
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestNotifSent(true);
    triggerHapticFeedback();
    await notificationService.sendTestNotification(isKannada);
    setTimeout(() => setTestNotifSent(false), 3500);
  };

  const handleToggleCategory = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(key, String(val));
    triggerHapticFeedback();
  };

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

        {/* 📱 Mobile Push Notifications Settings */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="#10B981" />
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {isKannada ? 'ಮೊಬೈಲ್ ಪುಶ್ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು' : 'Mobile Push Notifications'}
              </strong>
            </div>
            {/* Status Badge */}
            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background:
                  notifPermission === 'granted'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : notifPermission === 'denied'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                color:
                  notifPermission === 'granted'
                    ? '#34D399'
                    : notifPermission === 'denied'
                    ? '#F87171'
                    : '#FBBF24',
                border: `1px solid ${
                  notifPermission === 'granted'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : notifPermission === 'denied'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(245, 158, 11, 0.3)'
                }`
              }}
            >
              {notifPermission === 'granted' ? (
                <>
                  <CheckCircle2 size={13} />
                  {isKannada ? 'ಸಕ್ರಿಯವಾಗಿದೆ (Active)' : 'Active (Receiving)'}
                </>
              ) : notifPermission === 'denied' ? (
                <>
                  <BellOff size={13} />
                  {isKannada ? 'ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ (Blocked)' : 'Blocked in Browser'}
                </>
              ) : (
                <>
                  <BellRing size={13} />
                  {isKannada ? 'ಅನುಮತಿ ಅಗತ್ಯವಿದೆ' : 'Permission Needed'}
                </>
              )}
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            {isKannada
              ? 'ಯಾವುದೇ ಹೊಸ ಸಂದೇಶ, ಫೋಟೋ, ಗ್ರಾಮದ ತುರ್ತು ಪ್ರಕಟಣೆ ಅಥವಾ ನೈಜ ಸಮಯದ ಅಪ್‌ಡೇಟ್ ಬಂದಾಗ ನೇರವಾಗಿ ನಿಮ್ಮ ಮೊಬೈಲ್ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ನೋಟಿಫಿಕೇಶನ್ ಪಡೆಯಲು ಅನುಮತಿಸಿ.'
              : 'Allow direct push notifications to your mobile lock-screen & notification tray for instant messages, photos, and urgent village alerts.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Primary Action Button to Allow Notifications */}
            {notifPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleAllowNotifications}
                disabled={isRequestingPermission}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: isRequestingPermission ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <BellRing size={18} />
                <span>
                  {isRequestingPermission
                    ? isKannada
                      ? 'ಅನುಮತಿ ಕೇಳಲಾಗುತ್ತಿದೆ...'
                      : 'Requesting permission...'
                    : isKannada
                    ? '🔔 ಮೊಬೈಲ್ ನೋಟಿಫಿಕೇಶನ್ ಅನುಮತಿಸಿ (Allow Push)'
                    : '🔔 Allow Mobile Push Notifications'}
                </span>
              </button>
            )}

            {/* Blocked instructions banner if user previously clicked "Block" in browser */}
            {notifPermission === 'denied' && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.78rem', color: '#FCA5A5', lineHeight: 1.45 }}>
                  <strong style={{ display: 'block', marginBottom: '3px', color: '#F87171' }}>
                    {isKannada ? 'ಬ್ರೌಸರ್‌ನಲ್ಲಿ ನೋಟಿಫಿಕೇಶನ್ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ' : 'Notifications are blocked in your browser'}
                  </strong>
                  <span>
                    {isKannada
                      ? 'ಸಕ್ರಿಯಗೊಳಿಸಲು: ಬ್ರೌಸರ್ ವಿಳಾಸ ಪಟ್ಟಿಯಲ್ಲಿರುವ (Address bar) 🔒 ಲಾಕ್ ಅಥವಾ ⚙️ ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ "Site settings" -> "Notifications" ಅನ್ನು "Allow" ಎಂದು ಬದಲಾಯಿಸಿ.'
                      : 'To unblock: Tap the 🔒 lock or ⚙️ icon in your browser address bar, tap "Permissions / Site settings", and change "Notifications" to "Allow".'}
                  </span>
                </div>
              </div>
            )}

            {/* Send Test Notification Button */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
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
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  {isKannada ? '🔔 ನೋಟಿಫಿಕೇಶನ್ ಪರೀಕ್ಷೆ (Test Notification)' : '🔔 Test Mobile Push Notification'}
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  {isKannada
                    ? 'ಧ್ವನಿ, ವೈಬ್ರೇಶನ್ ಮತ್ತು ಮೊಬೈಲ್ ಟ್ರೇ ಅಲರ್ಟ್ ಅನ್ನು ತಕ್ಷಣವೇ ಪರೀಕ್ಷಿಸಿ.'
                    : 'Send an instant test alert with sound, vibration, and system tray popup.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendTestNotification}
                style={{
                  padding: '9px 15px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: testNotifSent ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)',
                  color: testNotifSent ? '#34D399' : '#10B981',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {testNotifSent ? <CheckCircle2 size={15} /> : <Send size={15} />}
                <span>
                  {testNotifSent
                    ? isKannada
                      ? 'ಕಳುಹಿಸಲಾಗಿದೆ!'
                      : 'Test Alert Sent!'
                    : isKannada
                    ? 'ಟೆಸ್ಟ್ ಕಳುಹಿಸಿ'
                    : 'Send Test Alert'}
                </span>
              </button>
            </div>

            {/* Notification Preference Toggles */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isKannada ? 'ನೋಟಿಫಿಕೇಶನ್ ವಿಭಾಗಗಳ ಆಯ್ಕೆ (Categories)' : 'Notification Category Preferences'}
              </span>

              {/* Private Messages & Photos Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>
                    {isKannada ? '💬 ಸಂದೇಶಗಳು & ಫೋಟೋಗಳು' : '💬 Private Messages & Photos'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ಗ್ರಾಮಸ್ಥರಿಂದ ನೇರ ಸಂದೇಶ ಬಂದಾಗ ಅಲರ್ಟ್' : 'Instant alerts when someone messages you'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowMsgNotif}
                  onChange={(e) => handleToggleCategory('notif_messages', e.target.checked, setAllowMsgNotif)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
              </div>

              {/* Emergency Alerts Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>
                    {isKannada ? '🚨 ಗ್ರಾಮದ ತುರ್ತು ಪ್ರಕಟಣೆಗಳು' : '🚨 Urgent Village Alerts'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ವಿದ್ಯುತ್, ನೀರು, ಆರೋಗ್ಯ ಮತ್ತು ವಿಪತ್ತು ಸೂಚನೆ' : 'Electricity, water supply & emergency updates'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowEmergencyNotif}
                  onChange={(e) => handleToggleCategory('notif_emergency', e.target.checked, setAllowEmergencyNotif)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
              </div>

              {/* Village News & Announcements */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>
                    {isKannada ? '📰 ಗ್ರಾಮ ಪಂಚಾಯತ್ & ಸುದ್ದಿ' : '📰 Village News & Panchayat'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ಯೋಜನೆಗಳು ಮತ್ತು ಹೊಸ ಪ್ರಕಟಣೆಗಳು' : 'Government schemes and village updates'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowNewsNotif}
                  onChange={(e) => handleToggleCategory('notif_news', e.target.checked, setAllowNewsNotif)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
              </div>

              {/* Sports & Events */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>
                    {isKannada ? '🏆 ಕ್ರೀಡಾಕೂಟ & ಉತ್ಸವಗಳು' : '🏆 Sports & Cultural Events'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ಕ್ರಿಕೆಟ್ ಪಂದ್ಯಾವಳಿ & ಜಾತ್ರಾ ಮಹೋತ್ಸವ' : 'Tournament scores and temple festivals'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowEventsNotif}
                  onChange={(e) => handleToggleCategory('notif_events', e.target.checked, setAllowEventsNotif)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
              </div>

              {/* Sound & Vibration */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>
                    {isKannada ? '🔊 ಧ್ವನಿ & ಮೊಬೈಲ್ ಕಂಪನ (Vibrate)' : '🔊 Sound & Mobile Vibration'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ನೋಟಿಫಿಕೇಶನ್ ಬಂದಾಗ ರಿಂಗ್ ಟೋನ್ ಮತ್ತು ವೈಬ್ರೇಶನ್' : 'Audio chime and haptic buzz on incoming alert'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowSoundHaptics}
                  onChange={(e) => handleToggleCategory('notif_sound', e.target.checked, setAllowSoundHaptics)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* PWA & Service Worker Status Info */}
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 4px'
              }}
            >
              <span>
                {isKannada
                  ? '⚡ ಮೊಬೈಲ್ ಬ್ಯಾಕ್‌ಗ್ರೌಂಡ್ ವರ್ಕರ್: ಸಕ್ರಿಯವಾಗಿದೆ (PWA Service Worker)'
                  : '⚡ Mobile Background Worker: Ready (PWA Service Worker)'}
              </span>
              <span style={{ color: '#10B981', fontWeight: 600 }}>v2.4 Active</span>
            </div>
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
