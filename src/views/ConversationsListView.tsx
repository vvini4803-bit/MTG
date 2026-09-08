import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Conversation, UserProfile } from '../types';
import {
  MessageSquare,
  Users,
  Search,
  CheckCheck,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface ConversationsListViewProps {
  onOpenLogin: () => void;
  onOpenChat: (convId: string, partner: any) => void;
  onNavigateToPeople: () => void;
}

export const ConversationsListView: React.FC<ConversationsListViewProps> = ({
  onOpenLogin,
  onOpenChat,
  onNavigateToPeople
}) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const unsub = dbService.subscribeConversations(currentUser.uid, (convs) => {
      setConversations(convs);
    });

    return () => unsub();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="container" style={{ padding: '40px 16px', maxWidth: '480px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '36px 20px' }}>
          <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>
            {isKannada ? 'ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ' : 'Sign In to View Messages'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {isKannada
              ? 'ನಿಮ್ಮ ಖಾಸಗಿ ಸಂದೇಶಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಅಥವಾ ಗ್ರಾಮಸ್ಥರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಲು ಲಾಗಿನ್ ಆಗಿ.'
              : 'Sign in to access your private village chats and receive updates.'}
          </p>
          <button onClick={onOpenLogin} className="btn-primary" style={{ width: '100%', height: '48px' }}>
            {isKannada ? 'ಲಾಗಿನ್ / ಸೈನ್ ಅಪ್' : 'Sign In / Register'}
          </button>
        </div>
      </div>
    );
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const partnerId = c.participants.find((p) => p !== currentUser.uid) || '';
    const partnerName = c.participant_names?.[partnerId] || '';
    const lastMsg = c.last_message_text || '';
    const q = searchQuery.toLowerCase();
    return partnerName.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '680px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.4rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <MessageSquare size={26} color="var(--accent-emerald)" />
            <span>{isKannada ? 'ಸಂದೇಶಗಳು' : 'Messages'}</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಗ್ರಾಮಸ್ಥರೊಂದಿಗೆ ನೇರ ಮತ್ತು ಸುರಕ್ಷಿತ ಸಂಭಾಷಣೆಗಳು'
              : 'Direct and private chats with village residents'}
          </p>
        </div>

        <button
          onClick={onNavigateToPeople}
          className="btn-primary"
          style={{
            fontSize: '0.82rem',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Users size={16} />
          <span>{isKannada ? '👥 ಗ್ರಾಮಸ್ಥರನ್ನು ಹುಡುಕಿ' : '👥 Find People'}</span>
        </button>
      </div>

      {/* Search Conversations */}
      {conversations.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            marginBottom: '16px'
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKannada ? 'ಸಂದೇಶಗಳಲ್ಲಿ ಹುಡುಕಿ...' : 'Search in conversations...'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          />
        </div>
      )}

      {/* Conversations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredConversations.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <MessageSquare size={30} color="#10B981" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.1rem' }}>
              {isKannada ? 'ಯಾವುದೇ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ' : 'No Conversations Yet'}
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto 20px' }}>
              {isKannada
                ? 'ಗ್ರಾಮದ ರೈತರು, ಕ್ರೀಡಾಪಟುಗಳು ಮತ್ತು ಸಾಧಕರ ಡೈರೆಕ್ಟರಿ ನೋಡಿ ಸಂದೇಶ ಕಳುಹಿಸಿ.'
                : 'Connect with local farmers, sports youth, and neighbors in the community directory.'}
            </p>
            <button
              onClick={onNavigateToPeople}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Users size={18} />
              <span>{isKannada ? 'ಗ್ರಾಮಸ್ಥರ ಡೈರೆಕ್ಟರಿ ನೋಡಿ' : 'Explore Community Directory'}</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const partnerId = conv.participants.find((p) => p !== currentUser.uid) || '';
            const partnerName = conv.participant_names?.[partnerId] || 'Resident';
            const partnerPhoto = conv.participant_photos?.[partnerId];
            const partnerRole = conv.participant_roles?.[partnerId];
            const unread = conv.unread_counts?.[currentUser.uid] || 0;
            const isLastSenderMe = conv.last_sender_id === currentUser.uid;

            const timeStr = conv.last_message_at
              ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={conv.id}
                onClick={() =>
                  onOpenChat(conv.id, {
                    uid: partnerId,
                    name: partnerName,
                    photoUrl: partnerPhoto,
                    role: partnerRole
                  })
                }
                className="glass-card"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: unread > 0 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--glass-border)',
                  background: unread > 0 ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, transform 0.15s ease'
                }}
              >
                {/* Partner Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {partnerPhoto ? (
                    <img
                      src={partnerPhoto}
                      alt={partnerName}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--accent-emerald)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}
                    >
                      {partnerName.charAt(0)}
                    </div>
                  )}

                  {/* Online / Active badge */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#10B981',
                      border: '2px solid var(--bg-card)'
                    }}
                  />
                </div>

                {/* Conversation Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: unread > 0 ? 800 : 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {partnerName}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: unread > 0 ? '#10B981' : 'var(--text-muted)', flexShrink: 0 }}>
                      {timeStr}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.82rem',
                        color: unread > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: unread > 0 ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isLastSenderMe && <span style={{ color: '#10B981', fontSize: '0.75rem' }}>✓</span>}
                      <span>{conv.last_message_text || (isKannada ? 'ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ...' : 'Start conversation...')}</span>
                    </p>

                    {unread > 0 && (
                      <span
                        style={{
                          background: '#10B981',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          minWidth: '20px',
                          height: '20px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 6px',
                          marginLeft: '8px',
                          flexShrink: 0
                        }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
