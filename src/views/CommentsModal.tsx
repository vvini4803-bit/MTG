import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { NewsItem, CommentItem } from '../types';
import { X, Send, Heart, Flag, Trash2, MessageSquare } from 'lucide-react';

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
  const { currentUser, isModerator } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !news) return;
    return dbService.subscribeComments(news.id, setComments);
  }, [isOpen, news]);

  if (!isOpen || !news) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    setIsSubmitting(true);
    await dbService.addComment({
      post_id: news.id,
      author_id: currentUser.uid,
      author_name: currentUser.name,
      author_photo: currentUser.photoUrl,
      author_role: currentUser.role,
      text: commentText.trim()
    });
    setCommentText('');
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {isKannada ? 'ಸಾರ್ವಜನಿಕ ಪ್ರತಿಕ್ರಿಯೆಗಳು' : 'Community Discussion'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
          Topic: "{isKannada ? news.title_kn : news.title_en}"
        </p>

        {/* Comments List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', paddingRight: '4px' }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {isKannada ? 'ಮೊದಲ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ನೀವೇ ಬರೆಯಿರಿ' : 'Be the first to share your thoughts on this update'}
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {c.author_name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)' }}>
                      {c.author_role.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {c.created_at.split('T')[0]}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                  {c.text}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    onClick={() => onOpenReportModal('COMMENT', c.id, c.text.substring(0, 30))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                    title="Report abusive comment"
                  >
                    <Flag size={12} />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        {currentUser ? (
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
            <input
              type="text"
              className="form-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isKannada ? 'ನಿಮ್ಮ ಸಭ್ಯ ಅಭಿಪ್ರಾಯ ಬರೆಯಿರಿ...' : 'Write a respectful comment...'}
              style={{ flex: 1, height: '44px' }}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !commentText.trim()}
              style={{ width: '48px', height: '44px', padding: 0 }}
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isKannada ? 'ಪ್ರತಿಕ್ರಿಯಿಸಲು ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಆಗಿ' : 'Please sign in to participate in the discussion'}
          </div>
        )}
      </div>
    </div>
  );
};
