import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { notificationService, PushNotificationPayload } from '../../services/notificationService';
import { Bell, AlertTriangle, X, ChevronRight, MessageSquare } from 'lucide-react';

interface InAppNotificationToastProps {
  onNavigate: (section: string, itemId?: string) => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({ onNavigate }) => {
  const { isKannada } = useLanguage();
  const [activeToast, setActiveToast] = useState<PushNotificationPayload | null>(null);

  useEffect(() => {
    // Listen for incoming notifications from anywhere (MQTT, local, or Firestore)
    const unsub = notificationService.onInAppNotification((payload) => {
      setActiveToast(payload);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const title = isKannada ? activeToast.title_kn : activeToast.title_en;
  const body = isKannada ? activeToast.body_kn : activeToast.body_en;

  return (
    <div
      onClick={() => {
        if (activeToast.section) {
          onNavigate(activeToast.section, activeToast.itemId);
        }
        setActiveToast(null);
      }}
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '480px',
        background: activeToast.urgent ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: activeToast.urgent
          ? '1.5px solid #FCA5A5'
          : activeToast.section === 'messages'
          ? '1.5px solid #10B981'
          : '1.5px solid rgba(16, 185, 129, 0.45)',
        borderRadius: '18px',
        padding: '12px 16px',
        boxShadow: activeToast.urgent
          ? '0 12px 35px rgba(239, 68, 68, 0.4)'
          : '0 12px 35px rgba(0, 0, 0, 0.65), 0 0 20px rgba(16, 185, 129, 0.25)',
        color: '#FFFFFF',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideDownToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: activeToast.urgent
            ? 'rgba(255, 255, 255, 0.2)'
            : activeToast.section === 'messages'
            ? 'rgba(16, 185, 129, 0.25)'
            : 'rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {activeToast.urgent ? (
          <AlertTriangle size={20} color="#FFFFFF" />
        ) : activeToast.section === 'messages' ? (
          <MessageSquare size={20} color="#34D399" />
        ) : (
          <Bell size={20} color="#34D399" />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: activeToast.urgent
                ? '#FEE2E2'
                : activeToast.section === 'messages'
                ? '#34D399'
                : '#34D399',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1px 6px',
              borderRadius: '6px'
            }}
          >
            {activeToast.urgent
              ? (isKannada ? 'ತುರ್ತು ಎಚ್ಚರಿಕೆ' : 'EMERGENCY')
              : activeToast.section === 'messages'
              ? (isKannada ? '💬 ಹೊಸ ಸಂದೇಶ' : '💬 NEW MESSAGE')
              : (isKannada ? 'ಹೊಸ ಅಪ್‌ಡೇಟ್' : 'LIVE UPDATE')}
          </span>
        </div>
        <h4
          style={{
            fontSize: '0.88rem',
            fontWeight: 800,
            margin: '2px 0 0 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {title}
        </h4>
        <p
          style={{
            fontSize: '0.78rem',
            color: '#CBD5E1',
            margin: '2px 0 0 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {body}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span style={{ fontSize: '0.72rem', color: '#93C5FD', fontWeight: 800 }}>
          {isKannada ? 'ನೋಡಿ' : 'View'}
        </span>
        <ChevronRight size={15} color="#93C5FD" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={15} />
        </button>
      </div>

      <style>{`
        @keyframes slideDownToast {
          from {
            opacity: 0;
            transform: translate(-50%, -24px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};
