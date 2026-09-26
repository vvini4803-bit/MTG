import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { NewsItem, NewsCategory, VerificationStatus } from '../types';
import { triggerHapticFeedback } from '../services/deviceIdentity';
import { backNavigation } from '../services/backNavigation';
import {
  X,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Save,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface EditNewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export const EditNewsModal: React.FC<EditNewsModalProps> = ({
  news,
  isOpen,
  onClose,
  onSaved,
  onDeleted
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, role } = useAuth();

  const [titleKn, setTitleKn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentKn, setContentKn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState<NewsCategory>('GENERAL');
  const [urgent, setUrgent] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [officialCorrection, setOfficialCorrection] = useState('');
  const [officialCorrectionKn, setOfficialCorrectionKn] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('VERIFIED');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (news) {
      setTitleKn(news.title_kn || '');
      setTitleEn(news.title_en || '');
      setContentKn(news.content_kn || '');
      setContentEn(news.content_en || '');
      setCategory(news.category || 'GENERAL');
      setUrgent(Boolean(news.urgent));
      setMediaUrl(news.media_url || '');
      setOfficialCorrection(news.official_correction || '');
      setOfficialCorrectionKn(news.official_correction_kn || '');
      setVerificationStatus(news.verification_status || 'VERIFIED');
      setMsg(null);
    }
  }, [news]);

  useEffect(() => {
    if (isOpen) {
      const dismiss = backNavigation.pushModal('editNewsModal', () => onClose());
      return () => dismiss();
    }
  }, [isOpen, onClose]);

  if (!isOpen || !news) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() && !titleKn.trim()) {
      setMsg({ text: isKannada ? 'ಶೀರ್ಷಿಕೆ ಅಗತ್ಯವಿದೆ' : 'Title is required', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await dbService.updateNews(
        news.id,
        {
          title_kn: titleKn.trim() || titleEn.trim(),
          title_en: titleEn.trim() || titleKn.trim(),
          content_kn: contentKn.trim() || contentEn.trim(),
          content_en: contentEn.trim() || contentKn.trim(),
          category,
          urgent,
          media_url: mediaUrl.trim() || undefined,
          official_correction: officialCorrection.trim() || undefined,
          official_correction_kn: officialCorrectionKn.trim() || officialCorrection.trim() || undefined,
          verification_status: verificationStatus,
          verified_by: currentUser?.uid,
          verified_by_name: currentUser?.name || 'Administrator',
          verified_at: new Date().toISOString()
        },
        currentUser?.uid,
        role
      );

      triggerHapticFeedback();
      setMsg({ text: isKannada ? '✅ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : '✅ Post updated successfully!', type: 'success' });
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setMsg({ text: err?.message || 'Error updating post', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmPrompt = isKannada
      ? 'ಈ ಸುದ್ದಿಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?'
      : 'Are you sure you want to permanently delete this post?';
    if (!window.confirm(confirmPrompt)) return;

    setIsDeleting(true);
    try {
      await dbService.deleteNews(news.id, currentUser?.uid || '', role);
      triggerHapticFeedback();
      if (onDeleted) onDeleted();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Error deleting post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} color="#10B981" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {isKannada ? 'ಪೋಸ್ಟ್ / ಸುದ್ದಿ ತಿದ್ದುಪಡಿ (Admin Edit)' : 'Admin Edit / Correct Post'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {msg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: msg.type === 'success' ? '#34D399' : '#FCA5A5',
              border: `1px solid ${msg.type === 'success' ? '#10B981' : '#EF4444'}`
            }}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Title Kannada */}
          <div>
            <label className="form-label">
              {isKannada ? 'ಶೀರ್ಷಿಕೆ (ಕನ್ನಡ)' : 'Title (Kannada)'}
            </label>
            <input
              type="text"
              className="form-input"
              value={titleKn}
              onChange={(e) => setTitleKn(e.target.value)}
              placeholder="ಸುದ್ದಿ ಶೀರ್ಷಿಕೆ..."
            />
          </div>

          {/* Title English */}
          <div>
            <label className="form-label">
              {isKannada ? 'ಶೀರ್ಷಿಕೆ (English)' : 'Title (English)'}
            </label>
            <input
              type="text"
              className="form-input"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Post title in English..."
            />
          </div>

          {/* Content Kannada */}
          <div>
            <label className="form-label">
              {isKannada ? 'ವಿವರ (ಕನ್ನಡ)' : 'Content (Kannada)'}
            </label>
            <textarea
              className="form-input"
              rows={4}
              value={contentKn}
              onChange={(e) => setContentKn(e.target.value)}
              placeholder="ಸುದ್ದಿ ಸಂಪೂರ್ಣ ವಿವರ..."
            />
          </div>

          {/* Content English */}
          <div>
            <label className="form-label">
              {isKannada ? 'ವಿವರ (English)' : 'Content (English)'}
            </label>
            <textarea
              className="form-input"
              rows={4}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              placeholder="Detailed content in English..."
            />
          </div>

          {/* Category & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ವರ್ಗ' : 'Category'}</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
              >
                <option value="GENERAL">General / ಸಾಮಾನ್ಯ</option>
                <option value="ROAD">Road & Transport / ರಸ್ತೆ</option>
                <option value="WATER">Water / ನೀರು</option>
                <option value="ELECTRICITY">Electricity / ವಿದ್ಯುತ್</option>
                <option value="AGRICULTURE">Agriculture / ಕೃಷಿ</option>
                <option value="SPORTS">Sports / ಕ್ರೀಡೆ</option>
                <option value="FESTIVAL">Festival / ಹಬ್ಬ</option>
                <option value="TEMPLE">Temple / ದೇಗುಲ</option>
                <option value="EMERGENCY">Emergency / ತುರ್ತು</option>
                <option value="COMMUNITY">Community / ಸಮುದಾಯ</option>
              </select>
            </div>

            <div>
              <label className="form-label">{isKannada ? 'ದೃಢೀಕರಣ ಸ್ಥಿತಿ' : 'Verification Status'}</label>
              <select
                className="form-input"
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
              >
                <option value="VERIFIED">VERIFIED / ದೃಢೀಕೃತ</option>
                <option value="PENDING">PENDING / ಬಾಕಿ</option>
                <option value="COMMUNITY_REPORT">COMMUNITY REPORT / ವರದಿ</option>
                <option value="REJECTED">REJECTED / ತಿರಸ್ಕರಿಸಲಾಗಿದೆ</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="form-label">
              {isKannada ? 'ಚಿತ್ರದ URL (Photo URL)' : 'Media Photo URL'}
            </label>
            <input
              type="text"
              className="form-input"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://... or /anime/..."
            />
          </div>

          {/* Urgent Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
            <input
              type="checkbox"
              id="edit-news-urgent"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#EF4444' }}
            />
            <label htmlFor="edit-news-urgent" style={{ fontSize: '0.85rem', color: '#EF4444', fontWeight: 700, cursor: 'pointer' }}>
              🚨 {isKannada ? 'ತುರ್ತು ಪ್ರಕಟಣೆ ಎಂದು ಗುರುತಿಸಿ (Urgent Broadcast)' : 'Mark as Urgent Broadcast'}
            </label>
          </div>

          {/* Official Correction / Note Section */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <AlertTriangle size={16} color="#F59E0B" />
              <strong style={{ fontSize: '0.85rem', color: '#FBBF24' }}>
                {isKannada ? 'ಅಧಿಕೃತ ಸ್ಪಷ್ಟನೆ / ಆಡಳಿತ ಟಿಪ್ಪಣಿ (Official Correction / Note)' : 'Official Correction / Admin Note'}
              </strong>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#CBD5E1', marginBottom: '10px' }}>
              {isKannada
                ? 'ತಪ್ಪು ಮಾಹಿತಿ ಅಥವಾ ಹೆಚ್ಚಿನ ಸ್ಪಷ್ಟನೆಗಾಗಿ ಈ ಪೋಸ್ಟ್ ಮೇಲೆ ಅಧಿಕೃತ ಆಡಳಿತಾತ್ಮಕ ಸೂಚನೆ ಪ್ರದರ್ಶಿಸಲಾಗುತ್ತದೆ.'
                : 'This note will appear prominently at the top of the post as an official admin correction or clarification.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={officialCorrectionKn}
                onChange={(e) => setOfficialCorrectionKn(e.target.value)}
                placeholder="ಅಧಿಕೃತ ಸ್ಪಷ್ಟನೆ (ಕನ್ನಡದಲ್ಲಿ)..."
                style={{ fontSize: '0.82rem' }}
              />
              <input
                type="text"
                className="form-input"
                value={officialCorrection}
                onChange={(e) => setOfficialCorrection(e.target.value)}
                placeholder="Official correction in English..."
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                borderRadius: 'var(--radius-md)',
                padding: '10px 18px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={16} />
              <span>{isDeleting ? 'Deleting...' : (isKannada ? 'ಅಳಿಸಿ (Delete)' : 'Delete Post')}</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.84rem' }}
              >
                {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.84rem' }}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : (isKannada ? 'ತಿದ್ದುಪಡಿ ಉಳಿಸಿ' : 'Save Changes')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
