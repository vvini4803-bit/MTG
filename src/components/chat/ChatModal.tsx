import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { ChatMessage, UserProfile } from '../../types';
import { compressImage } from '../../services/imageOptimizer';
import { geminiService } from '../../services/geminiService';
import {
  X,
  Send,
  Image as ImageIcon,
  Trash2,
  MoreVertical,
  ShieldAlert,
  Ban,
  Check,
  CheckCheck,
  ArrowLeft,
  Info,
  ExternalLink,
  Languages,
  Sparkles
} from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  conversationId: string;
  partnerUser: {
    uid: string;
    name: string;
    name_kn?: string;
    photoUrl?: string;
    role?: string;
    community_category?: string;
  };
  onClose: () => void;
  onNavigateToPeople?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  conversationId,
  partnerUser,
  onClose,
  onNavigateToPeople
}) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // AI Assistant states
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);

  // Moderation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('HARASSMENT');
  const [reportDetails, setReportDetails] = useState('');
  const [reportTargetMsgId, setReportTargetMsgId] = useState<string | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Smart Replies generator
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.sender_id !== currentUser?.uid && last.text) {
        geminiService
          .generateSmartReplies(last.text, isKannada ? 'kn' : 'en')
          .then((replies) => setSmartReplies(replies))
          .catch(() => {});
      } else {
        setSmartReplies([]);
      }
    } else {
      setSmartReplies([]);
    }
  }, [messages, currentUser, isKannada]);

  const handleTranslate = async (msgId: string, text: string) => {
    if (translatedMessages[msgId]) {
      const next = { ...translatedMessages };
      delete next[msgId];
      setTranslatedMessages(next);
      return;
    }
    setTranslatingMsgId(msgId);
    try {
      const targetLang = isKannada ? 'kn' : 'en';
      const translated = await geminiService.translateMessage(text, targetLang);
      setTranslatedMessages((prev) => ({ ...prev, [msgId]: translated }));
    } catch (err) {
      console.error(err);
    } finally {
      setTranslatingMsgId(null);
    }
  };

  const handlePolish = async () => {
    if (!inputText.trim()) return;
    setIsPolishing(true);
    try {
      const targetLang = isKannada ? 'kn' : 'en';
      const polished = await geminiService.translateMessage(inputText, targetLang);
      if (polished) setInputText(polished);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPolishing(false);
    }
  };

  // Subscribe to messages in this conversation
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    if (currentUser) {
      setIsBlocked(dbService.isUserBlocked(currentUser.uid, partnerUser.uid));
      // Mark as read
      dbService.markConversationRead(conversationId, currentUser.uid);
    }

    const unsubscribe = dbService.subscribeMessages(conversationId, (msgs) => {
      setMessages(msgs);
      if (currentUser) {
        dbService.markConversationRead(conversationId, currentUser.uid);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, conversationId, currentUser, partnerUser.uid]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && !attachedImage) return;
    if (isBlocked) return;

    setIsSending(true);
    try {
      await dbService.sendMessage({
        conversationId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderPhoto: currentUser.photoUrl,
        text: textToSend,
        mediaUrl: attachedImage || undefined
      });

      setInputText('');
      setAttachedImage(null);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1200, 900, 0.8);
      setAttachedImage(compressed.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to load photo');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm(isKannada ? 'ಈ ಸಂದೇಶವನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವೇ?' : 'Delete this message?')) return;
    try {
      await dbService.deleteMessage(msgId, conversationId, currentUser.uid);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleBlock = async () => {
    setShowOptions(false);
    if (isBlocked) {
      await dbService.unblockUser(currentUser.uid, partnerUser.uid);
      setIsBlocked(false);
      alert(isKannada ? 'ಬಳಕೆದಾರರನ್ನು ಅನ್‌ಬ್ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : 'User has been unblocked');
    } else {
      if (
        window.confirm(
          isKannada
            ? `${partnerUser.name} ಅವರನ್ನು ನಿರ್ಬಂಧಿಸಲು ನೀವು ಖಚಿತವೇ? ಇವರು ನಿಮಗೆ ಸಂದೇಶ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.`
            : `Are you sure you want to block ${partnerUser.name}? You will no longer receive messages from this user.`
        )
      ) {
        await dbService.blockUser(currentUser.uid, partnerUser.uid);
        setIsBlocked(true);
      }
    }
  };

  const handleOpenReport = (msgId?: string) => {
    setShowOptions(false);
    setReportTargetMsgId(msgId || null);
    setShowReportModal(true);
    setReportSubmitted(false);
  };

  const handleSubmitReport = async () => {
    const targetType = reportTargetMsgId ? 'MESSAGE' : 'USER';
    const targetId = reportTargetMsgId || partnerUser.uid;

    await dbService.reportUserOrMessage(
      currentUser.uid,
      currentUser.name,
      targetType,
      targetId,
      reportReason,
      reportDetails
    );

    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportDetails('');
    }, 1500);
  };

  const quickEmojis = ['🙏', '🌾', '👍', '💐', '❤️', '👏', '🤝'];

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'FARMER':
        return { label: isKannada ? '🌾 ರೈತರು' : '🌾 Farmer', color: '#10B981' };
      case 'SPORTS':
        return { label: isKannada ? '🏏 ಕ್ರೀಡೆ' : '🏏 Sports', color: '#F59E0B' };
      case 'STUDENT':
        return { label: isKannada ? '🎓 ವಿದ್ಯಾರ್ಥಿ' : '🎓 Student', color: '#3B82F6' };
      case 'TEACHER':
        return { label: isKannada ? '👨‍🏫 ಶಿಕ್ಷಕರು' : '👨‍🏫 Teacher', color: '#8B5CF6' };
      case 'ARTIST':
        return { label: isKannada ? '🎨 ಕಲಾವಿದರು' : '🎨 Artist', color: '#EC4899' };
      case 'ACHIEVER':
        return { label: isKannada ? '🏆 ಸಾಧಕರು' : '🏆 Achiever', color: '#EAB308' };
      default:
        return { label: isKannada ? '👤 ಗ್ರಾಮಸ್ಥರು' : '👤 Resident', color: 'var(--text-muted)' };
    }
  };

  const partnerBadge = getCategoryBadge(partnerUser.community_category);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '92vh',
          maxHeight: '760px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* --- CHAT HEADER --- */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              title="Close chat"
            >
              <ArrowLeft size={20} />
            </button>

            {partnerUser.photoUrl ? (
              <img
                src={partnerUser.photoUrl}
                alt={partnerUser.name}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent-emerald)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '42px',
                  height: '42px',
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
                {partnerUser.name.charAt(0)}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'var(--text-primary)'
                  }}
                >
                  {isKannada && partnerUser.name_kn ? partnerUser.name_kn : partnerUser.name}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                <span
                  style={{
                    color: partnerBadge.color,
                    fontWeight: 600
                  }}
                >
                  {partnerBadge.label}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10B981'
                    }}
                  />
                  {isKannada ? 'ಗ್ರಾಮಸ್ಥರು' : 'Village Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%'
              }}
            >
              <MoreVertical size={20} />
            </button>

            {showOptions && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  minWidth: '190px',
                  zIndex: 100,
                  padding: '6px 0',
                  marginTop: '4px'
                }}
              >
                <button
                  onClick={handleToggleBlock}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: isBlocked ? '#10B981' : '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Ban size={16} />
                  <span>
                    {isBlocked
                      ? isKannada
                        ? 'ಅನ್‌ಬ್ಲಾಕ್ ಮಾಡಿ'
                        : 'Unblock User'
                      : isKannada
                      ? 'ನಿರ್ಬಂಧಿಸಿ (Block)'
                      : 'Block User'}
                  </span>
                </button>

                <button
                  onClick={() => handleOpenReport()}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>{isKannada ? 'ದೂರು ನೀಡಿ (Report)' : 'Report User'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- PRIVACY & AI NOTICE BANNER --- */}
        <div
          style={{
            padding: '6px 14px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Info size={14} color="#10B981" />
          <span>
            {isKannada
              ? 'ಸುರಕ್ಷಿತ ಖಾಸಗಿ ಸಂಭಾಷಣೆ. ಗ್ರಾಮದ AI ಸಹಾಯಕ ಅಥವಾ ಸಾರ್ವಜನಿಕರಿಗೆ ಈ ಸಂದೇಶಗಳು ಲಭ್ಯವಿರುವುದಿಲ್ಲ.'
              : 'End-to-end community chat. Messages are private and never accessible to the AI Assistant.'}
          </span>
        </div>

        {/* --- BLOCKED BANNER --- */}
        {isBlocked && (
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(239, 68, 68, 0.12)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>
              {isKannada
                ? 'ನೀವು ಈ ಬಳಕೆದಾರರನ್ನು ನಿರ್ಬಂಧಿಸಿದ್ದೀರಿ. ಸಂದೇಶ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.'
                : 'You have blocked this resident. You cannot send or receive messages.'}
            </span>
            <button
              onClick={handleToggleBlock}
              style={{
                background: '#EF4444',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isKannada ? 'ಅನ್‌ಬ್ಲಾಕ್' : 'Unblock'}
            </button>
          </div>
        )}

        {/* --- MESSAGE LIST --- */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                padding: '30px 20px',
                color: 'var(--text-muted)'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <Send size={24} color="#10B981" />
              </div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.95rem' }}>
                {isKannada ? 'ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ' : 'Start a Conversation'}
              </h4>
              <p style={{ fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto' }}>
                {isKannada
                  ? `${partnerUser.name} ಅವರಿಗೆ ನಮಸ್ಕಾರ ಅಥವಾ ಸಂದೇಶ ಕಳುಹಿಸಿ.`
                  : `Say Namaskara or send a message to ${partnerUser.name}.`}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUser.uid;
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '6px'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      background: isMine
                        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                        : 'var(--bg-card)',
                      color: isMine ? '#FFFFFF' : 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                      border: isMine ? 'none' : '1px solid var(--glass-border)',
                      position: 'relative',
                      wordBreak: 'break-word'
                    }}
                  >
                    {/* Media Photo if attached */}
                    {msg.media_url && (
                      <div
                        style={{
                          marginBottom: msg.text ? '8px' : '0',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        onClick={() => setLightboxUrl(msg.media_url!)}
                      >
                        <img
                          src={msg.media_url}
                          alt="Shared media"
                          style={{
                            width: '100%',
                            maxHeight: '220px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          lineHeight: 1.45,
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {msg.text}
                      </p>
                    )}

                    {/* Gemini AI Translation */}
                    {translatedMessages[msg.id] && (
                      <div
                        style={{
                          marginTop: '6px',
                          paddingTop: '6px',
                          borderTop: '1px dashed rgba(255, 255, 255, 0.2)',
                          fontSize: '0.85rem',
                          color: isMine ? '#E0F2FE' : '#A7F3D0',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px'
                        }}
                      >
                        <Sparkles size={13} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{translatedMessages[msg.id]}</span>
                      </div>
                    )}

                    {/* Metadata: Time, Status, Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '6px',
                        marginTop: '4px',
                        fontSize: '0.68rem',
                        color: isMine ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)'
                      }}
                    >
                      {/* AI Translate button for incoming messages */}
                      {!isMine && msg.text && (
                        <button
                          type="button"
                          onClick={() => handleTranslate(msg.id, msg.text)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid var(--glass-border)',
                            color: translatedMessages[msg.id] ? '#10B981' : 'var(--text-secondary)',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.65rem',
                            marginRight: 'auto'
                          }}
                          title="Translate message (ಕನ್ನಡ / English)"
                        >
                          <Languages size={10} />
                          <span>
                            {translatingMsgId === msg.id
                              ? '...'
                              : translatedMessages[msg.id]
                              ? isKannada
                                ? 'ಮೂಲ'
                                : 'Original'
                              : isKannada
                              ? 'ಕನ್ನಡಕ್ಕೆ'
                              : 'Translate'}
                          </span>
                        </button>
                      )}

                      <span>{timeStr}</span>

                      {/* Read tick marks for sender */}
                      {isMine && (
                        <span>
                          {msg.status === 'READ' ? (
                            <CheckCheck size={13} color="#93C5FD" />
                          ) : (
                            <Check size={13} color="rgba(255, 255, 255, 0.7)" />
                          )}
                        </span>
                      )}

                      {/* Delete own message */}
                      {isMine && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.65)',
                            padding: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '4px'
                          }}
                          title="Delete message"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}

                      {/* Report incoming message */}
                      {!isMine && (
                        <button
                          onClick={() => handleOpenReport(msg.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '4px'
                          }}
                          title="Report message"
                        >
                          <ShieldAlert size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* --- ATTACHED IMAGE PREVIEW --- */}
        {attachedImage && (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={attachedImage}
                alt="Selected"
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {isKannada ? 'ಚಿತ್ರವನ್ನು ಲಗತ್ತಿಸಲಾಗಿದೆ' : 'Photo attached'}
              </span>
            </div>
            <button
              onClick={() => setAttachedImage(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* --- AI SMART REPLY CHIPS (Gemini-Powered) --- */}
        {!isBlocked && smartReplies.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              background: 'rgba(16, 185, 129, 0.08)',
              borderTop: '1px solid rgba(16, 185, 129, 0.25)',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                color: '#10B981',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              <Sparkles size={13} />
              <span>{isKannada ? 'AI ಸಲಹೆ:' : 'AI reply:'}</span>
            </div>
            {smartReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(reply)}
                style={{
                  whiteSpace: 'nowrap',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '0.78rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s ease'
                }}
              >
                <span>{reply}</span>
              </button>
            ))}
          </div>
        )}

        {/* --- QUICK EMOJI BAR --- */}
        {!isBlocked && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 16px',
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--glass-border)',
              overflowX: 'auto'
            }}
          >
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputText((prev) => prev + emoji)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '2px 8px',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  lineHeight: 1.4
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* --- INPUT BAR --- */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '12px 16px',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {/* Photo attach button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImagePick}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            disabled={isBlocked}
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isBlocked ? 'not-allowed' : 'pointer',
              flexShrink: 0
            }}
            title="Attach Photo"
          >
            <ImageIcon size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            disabled={isBlocked}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isBlocked
                ? isKannada
                  ? 'ಬಳಕೆದಾರರನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ'
                  : 'User blocked'
                : isKannada
                ? 'ಸಂದೇಶ ಬರೆಯಿರಿ... (Type a message)'
                : 'Type a message...'
            }
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />

          {/* AI Polish Button */}
          {inputText.trim().length > 0 && !isBlocked && (
            <button
              type="button"
              disabled={isPolishing}
              onClick={handlePolish}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#10B981',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPolishing ? 'wait' : 'pointer',
                flexShrink: 0
              }}
              title={isKannada ? 'AI ಭಾಷಾ ಸುಧಾರಣೆ (AI Polish)' : 'AI Polish / Translate'}
            >
              <Sparkles size={16} />
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={isBlocked || isSending || (!inputText.trim() && !attachedImage)}
            style={{
              background:
                isBlocked || (!inputText.trim() && !attachedImage)
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor:
                isBlocked || (!inputText.trim() && !attachedImage) ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
            title="Send"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* --- LIGHTBOX MODAL --- */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="Enlarged view"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '8px',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      {/* --- REPORT MODAL --- */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#F59E0B" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  {isKannada ? 'ವರದಿ ಸಲ್ಲಿಸಿ (Report)' : 'Report Violation'}
                </h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {reportSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#10B981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}
                >
                  <Check size={24} />
                </div>
                <h4 style={{ margin: '0 0 6px' }}>
                  {isKannada ? 'ವರದಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ' : 'Report Received'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {isKannada
                    ? 'ಗ್ರಾಮ ಆಡಳಿತ ಮಂಡಳಿ ಈ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಲಿದೆ.'
                    : 'Village moderators will review this matter promptly.'}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {isKannada
                    ? 'ಅನುಚಿತ ವರ್ತನೆ, ಸುಳ್ಳು ಮಾಹಿತಿ ಅಥವಾ ತೊಂದರೆ ನೀಡುವ ಸಂದೇಶಗಳನ್ನು ವರದಿ ಮಾಡಿ.'
                    : 'Help maintain a safe and respectful village community by reporting inappropriate content.'}
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px'
                    }}
                  >
                    {isKannada ? 'ಕಾರಣ ಆಯ್ಕೆಮಾಡಿ' : 'Select Reason'}
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="HARASSMENT">{isKannada ? 'ತೊಂದರೆ / ನಿಂದನೆ (Harassment / Abuse)' : 'Harassment / Abuse'}</option>
                    <option value="SPAM">{isKannada ? 'ಸ್ಪ್ಯಾಮ್ / ಅನಗತ್ಯ ಪ್ರಚಾರ (Spam)' : 'Spam / Commercial Ads'}</option>
                    <option value="MISINFORMATION">{isKannada ? 'ಸುಳ್ಳು ವದಂತಿ / ದಾರಿತಪ್ಪಿಸುವ ಮಾಹಿತಿ' : 'Misinformation / Rumors'}</option>
                    <option value="INAPPROPRIATE">{isKannada ? 'ಅನುಚಿತ ಭಾಷೆ ಅಥವಾ ವಿಷಯ' : 'Inappropriate Content'}</option>
                    <option value="OTHER">{isKannada ? 'ಇತರೆ (Other)' : 'Other issue'}</option>
                  </select>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px'
                    }}
                  >
                    {isKannada ? 'ಹೆಚ್ಚುವರಿ ವಿವರಣೆ (ಐಚ್ಛಿಕ)' : 'Additional Details (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder={
                      isKannada
                        ? 'ವಿವರಗಳನ್ನು ಬರೆಯಿರಿ...'
                        : 'Explain the issue to help moderators understand...'
                    }
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowReportModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: '#EF4444',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {isKannada ? 'ದೂರು ಸಲ್ಲಿಸಿ' : 'Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
