import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { notificationService } from '../../services/notificationService';
import { Bell, X, Check } from 'lucide-react';

export const NotificationPermissionBanner: React.FC = () => {
  const { isKannada } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and not yet decided
    if (typeof window === 'undefined') return;
    const isDismissed = localStorage.getItem('mtg_notif_banner_dismissed');
    if (isDismissed) return;

    if (notificationService.isSupported()) {
      const perm = notificationService.getPermission();
      if (perm === 'default') {
        // Show after a brief delay so the user is not overwhelmed on initial second
        const t = setTimeout(() => setShowPrompt(true), 2500);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const handleEnable = async () => {
    setIsActivating(true);
    const granted = await notificationService.requestPermission();
    setIsActivating(false);
    setShowPrompt(false);
    localStorage.setItem('mtg_notif_banner_dismissed', 'true');

    if (granted) {
      // Send a welcome test push notification to confirm mobile delivery
      await notificationService.sendNotification({
        title_kn: '🔔 ಅಧಿಸೂಚನೆಗಳು ಸಕ್ರಿಯಗೊಂಡಿವೆ!',
        title_en: '🔔 Notifications Enabled!',
        body_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಹೊಸ ಸುದ್ದಿ, ಕಾರ್ಯಕ್ರಮ ಹಾಗೂ ಪ್ರಕಟಣೆಗಳು ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ತಕ್ಷಣ ಬರುತ್ತವೆ.',
        body_en: 'You will now receive instant updates whenever news or events are shared in Muttagundi.',
        section: 'news'
      }, isKannada);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('mtg_notif_banner_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.14) 100%)',
        border: '1.5px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '16px',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Bell size={18} color="#34D399" />
        </div>
        <div>
          <h4 style={{ fontSize: '0.86rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
            {isKannada ? 'ಮೊಬೈಲ್ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Enable Mobile Notifications'}
          </h4>
          <p style={{ fontSize: '0.76rem', color: '#CBD5E1', margin: '2px 0 0 0' }}>
            {isKannada
              ? 'ಗ್ರಾಮದ ಹೊಸ ಸುದ್ದಿ & ಮಾಹಿತಿ ಹಂಚಿಕೊಂಡಾಗ ನಿಮ್ಮ ಮೊಬೈಲ್‌ನಲ್ಲಿ ತಕ್ಷಣ ಎಚ್ಚರಿಕೆ ಪಡೆಯಿರಿ.'
              : 'Get instant alerts on your phone whenever news or updates are shared.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleEnable}
          disabled={isActivating}
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
          }}
        >
          <Check size={14} />
          <span>{isKannada ? 'ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Enable Now'}</span>
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
