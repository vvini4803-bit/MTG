import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { getEffectiveUserId, getEffectiveUserName, triggerHapticFeedback } from '../services/deviceIdentity';
import { NewsItem, CommentItem } from '../types';
import { X, Send, Heart, Flag, MessageSquare, User, Sparkles } from 'lucide-react';

interface CommentsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReportModal: (type: 'COMMENT', id: string, title: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  news,
  isOpen,
  onClose,
  onOpenReportModal
}) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveUid = getEffectiveUserId(currentUser);

  useEffect(() => {
    if (!isOpen || !news) return;
    return dbService.subscribeComments(news.id, setComments);
  }, [isOpen, news]);

  if (!isOpen || !news) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    triggerHapticFeedback();
    setIsSubmitting(true);

    const authorName = currentUser
      ? currentUser.name
      : (guestName.trim() || getEffectiveUserName(currentUser, isKannada));

    const authorRole = currentUser ? currentUser.role : 'USER';

    await dbService.addComment({
      post_id: news.id,
      author_id: effectiveUid,
      author_name: authorName,
      author_photo: currentUser?.photoUrl || undefined,
      author_role: authorRole,
      text: commentText.trim()
    });

    setCommentText('');
    setIsSubmitting(false);
  };

  const handleLikeComment = async (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    triggerHapticFeedback();
    await dbService.toggleLikeComment(commentId, effectiveUid);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content mobile-bottom-sheet"
        style={{
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          padding: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={18} color="#10B981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಸಾರ್ವಜನಿಕ ಪ್ರತಿಕ್ರಿಯೆಗಳು' : 'Community Discussion'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {comments.length} {isKannada ? 'ಅಭಿಪ್ರಾಯಗಳು' : 'Comments'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Topic Title Bar */}
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '14px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <strong style={{ color: '#10B981' }}>{isKannada ? 'ವಿಷಯ: ' : 'Topic: '}</strong>
          "{isKannada ? news.title_kn : news.title_en}"
        </div>

        {/* Comments List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '14px',
            paddingRight: '4px',
            minHeight: '140px'
          }}
        >
          {comments.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={28} color="#10B981" style={{ opacity: 0.8 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>
                {isKannada ? 'ಮೊದಲ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ನೀವೇ ಬರೆಯಿರಿ!' : 'Be the first to share your thoughts!'}
              </p>
              <span style={{ fontSize: '0.75rem' }}>
                {isKannada
                  ? 'ಲಾಗಿನ್ ಇಲ್ಲದೆಯೂ ಗ್ರಾಮಸ್ಥರು ತಮ್ಮ ಅನಿಸಿಕೆ ಹಂಚಿಕೊಳ್ಳಬಹುದು.'
                  : 'All residents can share comments instantly.'}
              </span>
            </div>
          ) : (
            comments.map((c) => {
              const isLiked = Array.isArray(c.liked_by) && c.liked_by.includes(effectiveUid);
              return (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#10B981'
                        }}
                      >
                        {c.author_name ? c.author_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {c.author_name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#34D399',
                          fontWeight: 600
                        }}
                      >
                        {c.author_role.replace('_', ' ')}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {c.created_at ? c.created_at.split('T')[0] : ''}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '6px 0 10px' }}>
                    {c.text}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                    {/* Like button on comment */}
                    <button
                      type="button"
                      onClick={(e) => handleLikeComment(e, c.id)}
                      style={{
                        background: isLiked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isLiked ? 'rgba(239, 68, 68, 0.35)' : 'var(--glass-border)'}`,
                        borderRadius: 'var(--radius-full)',
                        padding: '4px 10px',
                        color: isLiked ? '#EF4444' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Heart
                        size={13}
                        fill={isLiked ? '#EF4444' : 'none'}
                        color={isLiked ? '#EF4444' : 'currentColor'}
                        style={{ animation: isLiked ? 'heartPop 0.3s ease' : 'none' }}
                      />
                      <span>{c.likes_count || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenReportModal('COMMENT', c.id, c.text.substring(0, 30))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Report abusive comment"
                    >
                      <Flag size={12} />
                      <span>{isKannada ? 'ವರದಿ' : 'Report'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Comment Form — Accessible to ALL residents! */}
        <form
          onSubmit={handleAddComment}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '12px'
          }}
        >
          {!currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={isKannada ? 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ - ಗ್ರಾಮಸ್ಥರು)' : 'Your name (Optional - Village Resident)'}
                  style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '32px' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isKannada ? 'ನಿಮ್ಮ ಸಭ್ಯ ಅಭಿಪ್ರಾಯ ಬರೆಯಿರಿ...' : 'Share your respectful thought...'}
              style={{ flex: 1, height: '44px', fontSize: '0.88rem' }}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !commentText.trim()}
              style={{
                width: '48px',
                height: '44px',
                padding: 0,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)'
              }}
              title={isKannada ? 'ಕಳುಹಿಸಿ' : 'Post comment'}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
