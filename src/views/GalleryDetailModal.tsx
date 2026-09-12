import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { getEffectiveUserId, triggerHapticFeedback } from '../services/deviceIdentity';
import { GalleryItem } from '../types';
import { X, Heart, Flag, Share2, Download, HardDrive, Trash2, Check } from 'lucide-react';

interface GalleryDetailModalProps {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReportModal: (type: 'MEDIA', id: string, title: string) => void;
}

export const GalleryDetailModal: React.FC<GalleryDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenReportModal
}) => {
  const { language, isKannada } = useLanguage();
  const { currentUser, isModerator, isAdmin } = useAuth();
  const [isCopied, setIsCopied] = useState(false);

  const effectiveUid = getEffectiveUserId(currentUser);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (item) {
      setIsLiked(Array.isArray(item.liked_by) && item.liked_by.includes(effectiveUid));
      setLikesCount(item.likes_count || 0);
    }
  }, [item, effectiveUid]);

  if (!isOpen || !item) return null;

  const title = language === 'kn' ? item.title_kn : item.title_en;

  const handleToggleLike = async () => {
    triggerHapticFeedback();
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    await dbService.toggleLikeGalleryItem(item.id, effectiveUid);
  };

  const handleShare = () => {
    triggerHapticFeedback();
    const text = `📸 *${title}* - ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಸುಂದರ ಛಾಯಾಚಿತ್ರ:\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    triggerHapticFeedback();
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `Muttagundi_${item.category}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canDelete = currentUser && (item.author_id === currentUser.uid || isModerator || isAdmin);

  const handleDelete = async () => {
    if (!currentUser) return;
    if (confirm(isKannada ? 'ಈ ಫೋಟೋವನ್ನು ಗ್ಯಾಲರಿಯಿಂದ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?' : 'Are you sure you want to delete this photo?')) {
      triggerHapticFeedback();
      await dbService.deleteGalleryItem(item.id, currentUser.uid, currentUser.role);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content mobile-bottom-sheet"
        style={{ maxWidth: '720px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Container */}
        <div style={{ position: 'relative', background: '#000000', maxHeight: '520px', display: 'flex', justifyContent: 'center' }}>
          <img
            src={item.url}
            alt={title}
            style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain' }}
          />
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              color: '#FFFFFF',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Details & Actions */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>
                {item.category}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  color: '#06B6D4',
                  border: '1px solid rgba(6, 182, 212, 0.25)'
                }}
              >
                <HardDrive size={11} />
                {isKannada ? 'ಶಾಶ್ವತ ಸಂಗ್ರಹಿತ' : 'Permanently Saved'}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {item.created_at ? item.created_at.split('T')[0] : ''}
            </span>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px', lineHeight: 1.3 }}>{title}</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {isKannada ? 'ಕ್ಯಾಮೆರಾ & ಅಪಲೋಡ್: ' : 'Captured & contributed by: '}
            <strong style={{ color: 'var(--text-primary)' }}>{item.author_name}</strong>
          </p>

          {/* Action Button Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            {/* Left Actions: Like & WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleLike}
                style={{
                  background: isLiked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isLiked ? 'rgba(239, 68, 68, 0.4)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: isLiked ? '#EF4444' : 'var(--text-primary)',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  minHeight: '40px',
                  transition: 'all 0.15s ease'
                }}
                title={isLiked ? 'Liked' : 'Like'}
              >
                <Heart
                  size={18}
                  fill={isLiked ? '#EF4444' : 'none'}
                  color={isLiked ? '#EF4444' : 'currentColor'}
                  style={{ animation: isLiked ? 'heartPop 0.3s ease' : 'none' }}
                />
                <span>{likesCount} {isKannada ? 'ಮೆಚ್ಚುಗೆ' : 'Likes'}</span>
              </button>

              <button
                onClick={handleShare}
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  color: '#22C55E',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  minHeight: '40px'
                }}
                title="Share on WhatsApp"
              >
                {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleDownload}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem', minHeight: '40px' }}
                title="Save photo to phone"
              >
                <Download size={15} />
                <span>{isKannada ? 'ಉಳಿಸಿ' : 'Save'}</span>
              </button>
            </div>

            {/* Right Actions: Report or Delete */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    color: '#EF4444',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '38px'
                  }}
                  title="Delete photo"
                >
                  <Trash2 size={14} />
                  <span>{isKannada ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                </button>
              )}

              <button
                onClick={() => onOpenReportModal('MEDIA', item.id, title)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  padding: '8px'
                }}
              >
                <Flag size={13} />
                <span>{isKannada ? 'ವರದಿ' : 'Report'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
