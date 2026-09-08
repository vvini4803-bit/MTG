import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { NotificationItem, ViewTab } from '../types';
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Trophy,
  CheckCheck,
  ChevronRight
} from 'lucide-react';

interface NotificationsScreenProps {
  onNavigateTab: (tab: ViewTab) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigateTab }) => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    return dbService.subscribeNotifications(currentUser?.uid || 'ALL', setNotifications);
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await dbService.markAllNotificationsRead(currentUser.uid);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'EMERGENCY':
        return <AlertTriangle size={20} color="#EF4444" />;
      case 'NEWS_VERIFIED':
        return <ShieldCheck size={20} color="#10B981" />;
      case 'EVENT':
        return <Calendar size={20} color="#0284C7" />;
      case 'SPORTS':
        return <Trophy size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#8B5CF6" />;
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            {isKannada ? 'ಗ್ರಾಮ ಸೂಚನೆಗಳು & ಎಚ್ಚರಿಕೆಗಳು' : 'Notifications & Alerts'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isKannada ? 'ನೈಜ ಸಮಯದ ತುರ್ತು ಪ್ರಕಟಣೆಗಳು ಮತ್ತು ಅಪ್‌ಡೇಟ್‌ಗಳು' : 'Real-time broadcast alerts and verified updates'}
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <CheckCheck size={15} />
          <span>{isKannada ? 'ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ' : 'Mark all read'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>{isKannada ? 'ಯಾವುದೇ ಹೊಸ ಸೂಚನೆಗಳಿಲ್ಲ' : 'No new notifications right now'}</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const title = language === 'kn' ? notif.title_kn : notif.title_en;
            const message = language === 'kn' ? notif.message_kn : notif.message_en;

            return (
              <div
                key={notif.id}
                onClick={() => notif.link_tab && onNavigateTab(notif.link_tab as ViewTab)}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: notif.link_tab ? 'pointer' : 'default',
                  borderLeft: notif.type === 'EMERGENCY' ? '4px solid #EF4444' : notif.read ? '1px solid var(--glass-border)' : '3px solid var(--accent-emerald)',
                  background: notif.read ? 'var(--bg-card)' : 'rgba(16, 185, 129, 0.06)'
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {getIcon(notif.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: notif.type === 'EMERGENCY' ? '#FCA5A5' : '#FFFFFF' }}>
                      {title}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {notif.created_at.split('T')[0]}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {message}
                  </p>
                </div>

                {notif.link_tab && <ChevronRight size={16} color="var(--text-muted)" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
