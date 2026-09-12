import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService, getOneWeekStatus } from '../services/dbService';
import { voiceAssistant } from '../services/voiceService';
import { NewsItem, VerificationStatus } from '../types';
import {
  X,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Volume2,
  Share2,
  Heart,
  MessageSquare,
  Flag,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Trash2,
  Check
} from 'lucide-react';

interface NewsDetailModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenComments: (news: NewsItem) => void;
  onOpenReportModal: (type: 'POST', id: string, title: string) => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  news,
  isOpen,
  onClose,
  onOpenComments,
  onOpenReportModal
}) => {
  const { language, isKannada } = useLanguage();
  const { currentUser, isModerator } = useAuth();

  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [correctionInput, setCorrectionInput] = useState('');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  if (!isOpen || !news) return null;

  const title = language === 'kn' ? news.title_kn : news.title_en;
  const content = language === 'kn' ? news.content_kn : news.content_en;
  const weekStatus = getOneWeekStatus(news.created_at);

  React.useEffect(() => {
    if (!isOpen) {
      voiceAssistant.stopSpeaking();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const handleSpeech = () => {
    if (isSpeaking) {
      voiceAssistant.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      voiceAssistant.speak(
        `${title}. ${content}`,
        language,
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `${title} - Gramasiri Village News`,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      navigator.clipboard.writeText(`${title} - ${window.location.href}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleVerifyStatus = async (status: VerificationStatus) => {
    if (!currentUser) return;
    await dbService.verifyNews(
      news.id,
      status,
      currentUser.uid,
      currentUser.name
    );
    onClose();
  };

  const handleSaveCorrection = async () => {
    if (!currentUser || !correctionInput.trim()) return;
    await dbService.verifyNews(
      news.id,
      news.verification_status,
      currentUser.uid,
      currentUser.name,
      correctionInput.trim()
    );
    setShowCorrectionForm(false);
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    if (confirm(isKannada ? 'ಈ ಸುದ್ದಿಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?' : 'Are you sure you want to delete this news update?')) {
      await dbService.deleteNews(news.id, currentUser.uid, currentUser.role);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-verified">
              <ShieldCheck size={12} />
              {isKannada ? 'ದೃಢೀಕೃತ (Auto-Verified)' : 'VERIFIED'}
            </span>

            {/* 1-Week Active Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: weekStatus.isWithinWeek ? 'rgba(16, 185, 129, 0.18)' : 'rgba(148, 163, 184, 0.15)',
                color: weekStatus.isWithinWeek ? '#34D399' : '#94A3B8',
                border: `1px solid ${weekStatus.isWithinWeek ? 'rgba(16, 185, 129, 0.35)' : 'rgba(148, 163, 184, 0.2)'}`
              }}
            >
              <Clock size={11} />
              {isKannada ? weekStatus.labelKn : weekStatus.labelEn}
            </span>

            {news.urgent && (
              <span className="badge badge-urgent">
                🚨 {isKannada ? 'ತುರ್ತು' : 'URGENT'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleSpeech}
              style={{
                background: isSpeaking ? 'rgba(16, 185, 129, 0.2)' : 'none',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: isSpeaking ? '#10B981' : 'var(--text-secondary)',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="Listen in speech"
            >
              <Volume2 size={15} />
              <span>{isSpeaking ? 'Listening...' : 'Listen'}</span>
            </button>

            <button
              onClick={handleShare}
              style={{
                background: 'none',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
            >
              {isCopied ? <Check size={14} color="#10B981" /> : <Share2 size={14} />}
              <span>{isCopied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Media */}
        {news.media_url && (
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '360px', marginBottom: '16px' }}>
            <img src={news.media_url} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.35, marginBottom: '10px' }}>
          {title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span>Author: <strong>{news.author_name}</strong></span>
          <span>Category: <strong>{news.category}</strong></span>
          {news.location && <span>Location: <strong>{news.location}</strong></span>}
          <span>Date: {news.created_at.split('T')[0]}</span>
        </div>

        {/* Story Body */}
        <div style={{
          fontSize: '0.95rem',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          marginBottom: '20px',
          whiteSpace: 'pre-wrap'
        }}>
          {content}
        </div>

        {/* Verification Metadata Box */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#10B981" />
            <span>Verification Record:</span>
          </div>
          {news.verified_by_name ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              Verified by <strong>{news.verified_by_name}</strong> on {news.verified_at?.split('T')[0]}.
            </p>
          ) : (
            <p style={{ color: '#FBBF24' }}>
              {isKannada
                ? 'ಈ ವರದಿಯು ಇನ್ನೂ ಅಧಿಕೃತವಾಗಿ ಪರಿಶೀಲನೆಯಾಗಿಲ್ಲ. ಯಾವುದೇ ಕ್ರಮ ಕೈಗೊಳ್ಳುವ ಮುನ್ನ ಸ್ಥಳೀಯ ಪಂಚಾಯತ್ ಜೊತೆ ದೃಢೀಕರಿಸಿ.'
                : 'Awaiting formal admin verification. Please verify with local authorities before acting.'}
            </p>
          )}

          {news.official_correction && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '6px' }}>
              <span style={{ fontWeight: 700, color: '#F59E0B' }}>Official Correction: </span>
              <span style={{ color: '#FEF3C7' }}>{news.official_correction}</span>
            </div>
          )}
        </div>

        {/* Admin/Moderator Controls */}
        {isModerator && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F59E0B', display: 'block', marginBottom: '8px' }}>
              MODERATOR & ADMIN ACTIONS:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleVerifyStatus('VERIFIED')}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: '34px' }}
              >
                <CheckCircle2 size={14} />
                <span>Mark Verified</span>
              </button>

              <button
                onClick={() => handleVerifyStatus('REJECTED')}
                className="btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: '34px' }}
              >
                <XCircle size={14} />
                <span>Reject Post</span>
              </button>

              <button
                onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: '34px' }}
              >
                <span>Add Correction</span>
              </button>

              <button
                onClick={handleDelete}
                style={{
                  background: 'none',
                  border: '1px solid #EF4444',
                  borderRadius: 'var(--radius-md)',
                  color: '#EF4444',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>

            {showCorrectionForm && (
              <div style={{ marginTop: '12px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={correctionInput}
                  onChange={(e) => setCorrectionInput(e.target.value)}
                  placeholder="Enter official correction note..."
                  style={{ height: '38px', fontSize: '0.82rem', marginBottom: '8px' }}
                />
                <button
                  onClick={handleSaveCorrection}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '32px' }}
                >
                  Save Note
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          <button
            onClick={() => {
              onClose();
              onOpenComments(news);
            }}
            className="btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            <MessageSquare size={16} />
            <span>Comments ({news.comments_count})</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenReportModal('POST', news.id, title);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem'
            }}
          >
            <Flag size={14} />
            <span>Report Misinformation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
