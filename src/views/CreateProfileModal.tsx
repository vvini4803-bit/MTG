import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../services/imageOptimizer';
import { UserRole, UserProfile } from '../types';
import { X, Camera, ShieldCheck, Check } from 'lucide-react';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated: () => void;
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileCreated
}) => {
  const { isKannada } = useLanguage();
  const { updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('USER');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await compressImage(file, 400, 400, 0.85);
      setPhotoDataUrl(result.dataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ' : 'Please enter full name');
      return;
    }
    if (!consent) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು ಸಮುದಾಯ ನಿಯಮಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ' : 'Please agree to community guidelines');
      return;
    }

    setIsSubmitting(true);
    const newProfile: UserProfile = {
      uid: 'user_' + Date.now(),
      name: name.trim(),
      name_kn: nameKn.trim() || undefined,
      phone: phone || '+91 99000 00000',
      email: email || undefined,
      role: requestedRole,
      language: isKannada ? 'kn' : 'en',
      photoUrl: photoDataUrl || undefined,
      bio: bio.trim() || undefined,
      account_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_phone_verified: !!phone
    };

    try {
      await updateProfile(newProfile);
      setIsSubmitting(false);
      onProfileCreated();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Error saving profile');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {isKannada ? 'ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ ರಚನೆ' : 'Create Resident Profile'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
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
              marginBottom: '16px'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '2px dashed var(--accent-emerald)',
                margin: '0 auto 8px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {photoDataUrl ? (
                <img
                  src={photoDataUrl}
                  alt="Avatar preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Camera size={26} color="#10B981" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isKannada ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಒತ್ತಿ' : 'Tap to upload profile photo'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ಪೂರ್ಣ ಹೆಸರು (English)' : 'Full Name (English) *'}</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ಹೆಸರು (ಕನ್ನಡದಲ್ಲಿ)' : 'Name in Kannada (Optional)'}</label>
            <input
              type="text"
              className="form-input"
              value={nameKn}
              onChange={(e) => setNameKn(e.target.value)}
              placeholder="ಉದಾ: ರಮೇಶ್ ಕುಮಾರ್"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">{isKannada ? 'ಮೊಬೈಲ್' : 'Mobile Phone'}</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 99000 12345"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{isKannada ? 'ಇಮೇಲ್' : 'Email Address'}</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ಉದ್ಯೋಗ / ಕಿರು ವಿವರ' : 'Occupation / Bio'}</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isKannada ? 'ಉದಾ: ಕೃಷಿಕರು, ಸಿರಿಧಾನ್ಯ ಬೆಳೆಗಾರರು...' : 'e.g. Progressive farmer, millets grower'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{isKannada ? 'ಪಾತ್ರ / ರೋಲ್ ಆಯ್ಕೆ' : 'Requested Community Role'}</label>
            <select
              className="form-select"
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as UserRole)}
            >
              <option value="USER">Resident / Citizen (ಸಾಮಾನ್ಯ ನಿವಾಸಿ)</option>
              <option value="VERIFIED_CONTRIBUTOR">Verified Contributor (ದೃಢೀಕೃತ ಲೇಖಕ)</option>
              <option value="SPORTS_ORGANIZER">Sports Organizer (ಕ್ರೀಡಾ ಸಂಘಟಕ)</option>
              <option value="EVENT_ORGANIZER">Event Organizer (ಕಾರ್ಯಕ್ರಮ ಸಂಘಟಕ)</option>
              <option value="MODERATOR">Content Moderator (ವಿಷಯ ಪರಿಶೀಲಕ)</option>
              <option value="ADMIN">Gram Panchayat Admin (ಪಂಚಾಯಿತಿ ನಿರ್ವಾಹಕ)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '20px' }}>
            <input
              type="checkbox"
              id="consent-check"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
            <label htmlFor="consent-check" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {isKannada
                ? 'ನಾನು ಗ್ರಾಮದ ಸಮುದಾಯ ನಿಯಮಗಳು, ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು ಒಪ್ಪುತ್ತೇನೆ ಹಾಗೂ ಯಾವುದೇ ಸುಳ್ಳು ಸುದ್ದಿ ಅಥವಾ ವದಂತಿಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳುವುದಿಲ್ಲ ಎಂದು ಪ್ರಮಾಣಿಸುತ್ತೇನೆ.'
                : 'I agree to the Community Guidelines & Privacy Policy, and promise never to share unverified rumors or misinformation.'}
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', height: '48px' }}
          >
            <ShieldCheck size={18} />
            <span>{isSubmitting ? 'Creating...' : isKannada ? 'ಪ್ರೊಫೈಲ್ ರಚಿಸಿ' : 'Complete Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
