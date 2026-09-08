import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { compressImage } from '../services/imageOptimizer';
import { NewsCategory, VerificationStatus } from '../types';
import { X, Image, MapPin, ShieldAlert, Send } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, isModerator } = useAuth();

  const [titleEn, setTitleEn] = useState('');
  const [titleKn, setTitleKn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentKn, setContentKn] = useState('');
  const [category, setCategory] = useState<NewsCategory>('COMMUNITY');
  const [location, setLocation] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await compressImage(file, 1200, 900, 0.8);
      setPhotoDataUrl(result.dataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Image processing failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು ಮೊದಲು ಲಾಗಿನ್ ಆಗಿ' : 'Please log in to post');
      return;
    }
    if (!titleEn.trim() && !titleKn.trim()) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ' : 'Please enter post title');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Initial status: If moderator/admin creates, it can be VERIFIED immediately. Regular user submissions go to PENDING for Admin verification.
    const initialStatus: VerificationStatus = isModerator
      ? 'VERIFIED'
      : 'PENDING';

    try {
      await dbService.addNews({
        author_id: currentUser.uid,
        author_name: currentUser.name,
        author_photo: currentUser.photoUrl,
        author_role: currentUser.role,
        title_en: titleEn.trim() || titleKn.trim(),
        title_kn: titleKn.trim() || titleEn.trim(),
        content_en: contentEn.trim() || contentKn.trim(),
        content_kn: contentKn.trim() || contentEn.trim(),
        category,
        media_url: photoDataUrl || undefined,
        media_type: photoDataUrl ? 'IMAGE' : undefined,
        location: location.trim() || undefined,
        verification_status: initialStatus,
        verified_by: isModerator ? currentUser.uid : undefined,
        verified_by_name: isModerator ? currentUser.name : undefined,
        verified_at: isModerator ? new Date().toISOString() : undefined,
        urgent: isModerator ? isUrgent : false,
        pinned: false
      });

      setIsSubmitting(false);
      onPostCreated();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Submission failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {isKannada ? 'ಗ್ರಾಮ ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'Post Community News / Report'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Responsible Submission Advisory */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px'
          }}
        >
          <ShieldAlert size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#FEF3C7', lineHeight: 1.4 }}>
            {isKannada
              ? 'ಗಮನಿಸಿ: ನಿಮ್ಮ ವರದಿಯು ಆರಂಭದಲ್ಲಿ "ಸಮುದಾಯ ವರದಿ" ಎಂದು ಪ್ರಕಟವಾಗುತ್ತದೆ. ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸಿದ ನಂತರವೇ ದೃಢೀಕೃತಗೊಳ್ಳುತ್ತದೆ.'
              : 'Notice: Your submission will appear as a "Community Report" until verified by authorized village moderators.'}
          </span>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              color: '#FCA5A5',
              fontSize: '0.78rem',
              marginBottom: '14px'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ವಿಭಾಗ' : 'Category *'}</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
              >
                <option value="WATER">Water (ಕುಡಿಯುವ ನೀರು)</option>
                <option value="ELECTRICITY">Electricity (ವಿದ್ಯುತ್)</option>
                <option value="ROAD">Road & Transport (ರಸ್ತೆ)</option>
                <option value="AGRICULTURE">Agriculture (ಕೃಷಿ)</option>
                <option value="WEATHER">Weather (ಹವಾಮಾನ)</option>
                <option value="SPORTS">Sports (ಕ್ರೀಡೆ)</option>
                <option value="FESTIVAL">Festival (ಹಬ್ಬ)</option>
                <option value="TEMPLE">Temple (ದೇವಸ್ಥಾನ)</option>
                <option value="ACHIEVEMENT">Achievement (ಸಾಧನೆ)</option>
                <option value="EMERGENCY">Emergency (ತುರ್ತು)</option>
                <option value="COMMUNITY">Community (ಸಮುದಾಯ)</option>
              </select>
            </div>

            <div>
              <label className="form-label">{isKannada ? 'ಸ್ಥಳ (ಐಚ್ಛಿಕ)' : 'Location / Ward'}</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ward 2, Near Sannidhi"
                  style={{ paddingLeft: '34px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ಶೀರ್ಷಿಕೆ (English)' : 'Title (English) *'}</label>
            <input
              type="text"
              className="form-input"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Clean drinking water pipe repaired at Market road"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ಶೀರ್ಷಿಕೆ (ಕನ್ನಡದಲ್ಲಿ)' : 'Title in Kannada (Optional)'}</label>
            <input
              type="text"
              className="form-input"
              value={titleKn}
              onChange={(e) => setTitleKn(e.target.value)}
              placeholder="ಉದಾ: ಮಾರುಕಟ್ಟೆ ರಸ್ತೆಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ದುರಸ್ತಿ"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ವಿವರಗಳು (English)' : 'Details (English) *'}</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              placeholder="Provide exact facts and location details..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ವಿವರಗಳು (ಕನ್ನಡದಲ್ಲಿ)' : 'Details in Kannada (Optional)'}</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={contentKn}
              onChange={(e) => setContentKn(e.target.value)}
              placeholder="ಸ್ಪಷ್ಟ ಮಾಹಿತಿ ಮತ್ತು ವಿವರಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ..."
            />
          </div>

          {/* Photo Attachment */}
          <div className="form-group">
            <label className="form-label">{isKannada ? 'ಭಾವಚಿತ್ರ ಲಗತ್ತಿಸಿ' : 'Attach Photo (Optional)'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <Image size={16} />
                <span>{photoDataUrl ? 'Change Photo' : 'Select Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
              </label>

              {photoDataUrl && (
                <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                  <img
                    src={photoDataUrl}
                    alt="Selected"
                    style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(null)}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#EF4444',
                      border: 'none',
                      borderRadius: '50%',
                      color: '#FFFFFF',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Moderator Only Option: Urgent Broadcast */}
          {isModerator && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '18px'
            }}>
              <input
                type="checkbox"
                id="urgent-check"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
              />
              <label htmlFor="urgent-check" style={{ fontSize: '0.8rem', color: '#FCA5A5', fontWeight: 600 }}>
                {isKannada ? '🚨 ತುರ್ತು ಪ್ರಕಟಣೆಯಾಗಿ ಗುರುತಿಸಿ (ಅಡ್ಮಿನ್ ಮಾತ್ರ)' : '🚨 Mark as Urgent Village Alert (Moderator Action)'}
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', height: '48px' }}
          >
            <Send size={18} />
            <span>{isSubmitting ? 'Posting...' : isKannada ? 'ಪ್ರಕಟಿಸಿ' : 'Submit for Verification'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
