import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../services/imageOptimizer';
import { UserRole, UserProfile } from '../types';
import { X, Camera, ShieldCheck, Trash2, Sparkles, Upload } from 'lucide-react';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated: () => void;
}

const AVATAR_PRESETS = [
  { id: 'farmer', label_en: 'Farmer', label_kn: 'ರೈತರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RameshFarmer&skinColor=edb98a,d08b5b,ae5d29' },
  { id: 'elder', label_en: 'Village Elder', label_kn: 'ಹಿರಿಯರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GramElder&facialHair=beardLight,moustacheMagnum' },
  { id: 'woman', label_en: 'Leader', label_kn: 'ಮುಖಂಡರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LakshmiGowda&top=longHairCurvy' },
  { id: 'sports', label_en: 'Sports/Youth', label_kn: 'ಯುವಕರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KiranSports&clothingGraphic=diamond' },
  { id: 'student', label_en: 'Student', label_kn: 'ವಿದ್ಯಾರ್ಥಿ', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaStudent&accessories=round' },
  { id: 'teacher', label_en: 'Teacher', label_kn: 'ಶಿಕ್ಷಕರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ManjunathTeacher&facialHair=moustacheFancy' },
  { id: 'temple', label_en: 'Heritage', label_kn: 'ಸಂಪ್ರದಾಯ', url: '/anime/temple_gopuram.jpg' },
  { id: 'school', label_en: 'Vidya', label_kn: 'ವಿದ್ಯಾ', url: '/anime/village_school.jpg' }
];

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileCreated
}) => {
  const { isKannada } = useLanguage();
  const { updateProfile, currentUser } = useAuth();

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setName(currentUser.name || '');
        setNameKn(currentUser.name_kn || '');
        setPhone(currentUser.phone || '');
        setEmail(currentUser.email || '');
        setBio(currentUser.bio || '');
        setRequestedRole(currentUser.role || 'USER');
        setPhotoDataUrl(currentUser.photoUrl || null);
      } else {
        setName('');
        setNameKn('');
        setPhone('');
        setEmail('');
        setBio('');
        setRequestedRole('USER');
        setPhotoDataUrl(null);
      }
      setErrorMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await compressImage(file, 400, 400, 0.85);
      setPhotoDataUrl(result.dataUrl);
      setErrorMsg(null);
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
    const updatedProfile: UserProfile = {
      ...(currentUser || {}),
      uid: currentUser?.uid || ('user_' + Date.now()),
      name: name.trim(),
      name_kn: nameKn.trim() || undefined,
      phone: phone.trim() || currentUser?.phone || '',
      email: email.trim() || currentUser?.email || undefined,
      role: requestedRole,
      language: isKannada ? 'kn' : 'en',
      photoUrl: photoDataUrl || currentUser?.photoUrl || undefined,
      bio: bio.trim() || undefined,
      account_status: currentUser?.account_status || 'ACTIVE',
      created_at: currentUser?.created_at || new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_phone_verified: !!phone || !!currentUser?.is_phone_verified,
      community_category: currentUser?.community_category || 'RESIDENT',
      allow_find_me: currentUser?.allow_find_me !== false,
      privacy_find: currentUser?.privacy_find || 'EVERYONE',
      privacy_message: currentUser?.privacy_message || 'EVERYONE'
    };

    try {
      await updateProfile(updatedProfile);
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
        style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {currentUser
                ? (isKannada ? 'ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ ತಿದ್ದುಪಡಿ' : 'Edit Resident Profile')
                : (isKannada ? 'ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ ರಚನೆ' : 'Create Resident Profile')}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isKannada ? 'ನಿಮ್ಮ ಭಾವಚಿತ್ರ ಮತ್ತು ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ' : 'Upload your photo & update your resident identity'}
            </span>
          </div>
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
          {/* Avatar Upload Box */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <label
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '2.5px dashed var(--accent-emerald)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0
                }}
                title={isKannada ? 'ಫೋಟೋ ಬದಲಾಯಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click to change photo'}
              >
                {photoDataUrl ? (
                  <img
                    src={photoDataUrl}
                    alt="Avatar preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Camera size={28} color="#10B981" />
                    <span style={{ fontSize: '0.62rem', color: '#10B981', fontWeight: 700 }}>Upload</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                  }}
                />
              </label>

              <div style={{ textAlign: 'left', flex: 1, minWidth: '180px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಚಿತ್ರ' : 'Profile Photo'}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', lineHeight: 1.4 }}>
                  {isKannada
                    ? 'ಗ್ರಾಮಸ್ಥರಿಗೆ ನಿಮ್ಮನ್ನು ಗುರುತಿಸಲು ಸ್ಪಷ್ಟ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'
                    : 'Upload a clear photo so fellow villagers can easily identify you.'}
                </span>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid var(--accent-emerald)',
                      color: '#10B981',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Upload size={13} />
                    <span>{isKannada ? 'ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ' : 'Choose Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  </label>

                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl(null)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#EF4444',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{isKannada ? 'ತೆಗೆದುಹಾಕಿ' : 'Remove'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', justifyContent: 'center' }}>
                <Sparkles size={12} color="#F59E0B" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {isKannada ? 'ಅಥವಾ ಸಿದ್ಧ ಗ್ರಾಮ ಅವತಾರ ಆಯ್ಕೆಮಾಡಿ:' : 'Or choose a village avatar preset:'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = photoDataUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPhotoDataUrl(preset.url)}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.04)',
                        border: isSelected ? '2px solid var(--accent-emerald)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.15s ease'
                      }}
                      title={preset.label_en}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label_en}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '0.62rem', color: isSelected ? '#10B981' : 'var(--text-muted)', fontWeight: isSelected ? 700 : 500 }}>
                        {isKannada ? preset.label_kn : preset.label_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
            style={{ width: '100%', height: '48px', fontSize: '0.95rem' }}
          >
            <ShieldCheck size={18} />
            <span>
              {isSubmitting
                ? (isKannada ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...')
                : currentUser
                  ? (isKannada ? 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ' : 'Save Changes')
                  : (isKannada ? 'ಪ್ರೊಫೈಲ್ ರಚಿಸಿ' : 'Complete Profile')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
