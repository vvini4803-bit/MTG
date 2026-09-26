import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { TempleItem } from '../types';
import { triggerHapticFeedback } from '../services/deviceIdentity';
import { backNavigation } from '../services/backNavigation';
import {
  X,
  Landmark,
  Save,
  Trash2,
  Upload,
  Sparkles,
  Camera
} from 'lucide-react';

interface EditTempleModalProps {
  temple: TempleItem | null;
  mode?: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (temple: TempleItem) => void;
  onDeleted?: (templeId: string) => void;
}

export const EditTempleModal: React.FC<EditTempleModalProps> = ({
  temple,
  mode = 'edit',
  isOpen,
  onClose,
  onSaved,
  onDeleted
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, role } = useAuth();

  const [nameKn, setNameKn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [deityKn, setDeityKn] = useState('');
  const [deityEn, setDeityEn] = useState('');
  const [timingsKn, setTimingsKn] = useState('');
  const [timingsEn, setTimingsEn] = useState('');
  const [locationKn, setLocationKn] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [historyKn, setHistoryKn] = useState('');
  const [historyEn, setHistoryEn] = useState('');
  const [festivalsKn, setFestivalsKn] = useState('');
  const [festivalsEn, setFestivalsEn] = useState('');
  const [specialPoojaKn, setSpecialPoojaKn] = useState('');
  const [specialPoojaEn, setSpecialPoojaEn] = useState('');
  const [imageUrl, setImageUrl] = useState('/anime/temple_gopuram.jpg');
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mode === 'edit' && temple) {
      setNameKn(temple.name_kn || '');
      setNameEn(temple.name_en || '');
      setDeityKn(temple.deity_kn || '');
      setDeityEn(temple.deity_en || '');
      setTimingsKn(temple.timings_kn || '');
      setTimingsEn(temple.timings_en || '');
      setLocationKn(temple.location_kn || '');
      setLocationEn(temple.location_en || '');
      setHistoryKn(temple.history_kn || '');
      setHistoryEn(temple.history_en || '');
      setFestivalsKn(temple.festivals_kn || '');
      setFestivalsEn(temple.festivals_en || '');
      setSpecialPoojaKn(temple.special_pooja_kn || '');
      setSpecialPoojaEn(temple.special_pooja_en || '');
      setImageUrl(temple.image_url || '/anime/temple_gopuram.jpg');
      setCustomPhotoInput('');
      setMsg(null);
    } else if (mode === 'add') {
      setNameKn('');
      setNameEn('');
      setDeityKn('');
      setDeityEn('');
      setTimingsKn('ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦ & ಸಂಜೆ ೫:೩೦ - ೮:೩೦');
      setTimingsEn('6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM');
      setLocationKn('ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ');
      setLocationEn('Muttagundi Village');
      setHistoryKn('');
      setHistoryEn('');
      setFestivalsKn('ವಾರ್ಷಿಕ ರಥೋತ್ಸವ ಮತ್ತು ದೀಪೋತ್ಸವ');
      setFestivalsEn('Annual Rathotsava & Karthika Deepotsava');
      setSpecialPoojaKn('ವಿಶೇಷ ಅಭಿಷೇಕ ಹಾಗೂ ಪೂಜೆ');
      setSpecialPoojaEn('Special Abhisheka and Mangalarathi');
      setImageUrl('/anime/temple_gopuram.jpg');
      setCustomPhotoInput('');
      setMsg(null);
    }
  }, [mode, temple, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const dismiss = backNavigation.pushModal('editTempleModal', () => onClose());
      return () => dismiss();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        setCustomPhotoInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameKn.trim()) {
      setMsg({ text: isKannada ? 'ದೇವಾಲಯದ ಹೆಸರು ಅಗತ್ಯವಿದೆ' : 'Temple name is required', type: 'error' });
      return;
    }

    setIsSaving(true);
    const finalImage = (customPhotoInput.trim() || imageUrl || '/anime/temple_gopuram.jpg').trim();

    try {
      if (mode === 'add') {
        const created = await dbService.addTemple({
          name_en: nameEn.trim() || nameKn.trim(),
          name_kn: nameKn.trim() || nameEn.trim(),
          deity_en: deityEn.trim() || 'Lord Shiva / Vishnu / Grama Devathe',
          deity_kn: deityKn.trim() || 'ಗ್ರಾಮ ದೇವತೆ / ಶ್ರೀ ಸ್ವಾಮಿ',
          timings_en: timingsEn.trim() || '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
          timings_kn: timingsKn.trim() || 'ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦ & ಸಂಜೆ ೫:೩೦ - ೮:೩೦',
          location_en: locationEn.trim() || 'Muttagundi Village',
          location_kn: locationKn.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ',
          history_en: historyEn.trim() || 'Sacred historic temple and center of devotion for Muttagundi residents.',
          history_kn: historyKn.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮಸ್ಥರ ಪವಿತ್ರ ಆರಾಧನಾ ಕೇಂದ್ರ ಮತ್ತು ಐತಿಹಾಸಿಕ ತಾಣ.',
          festivals_en: festivalsEn.trim() || 'Annual Rathotsava / Jaatre & Karthika Deepotsava',
          festivals_kn: festivalsKn.trim() || 'ವಾರ್ಷಿಕ ರಥೋತ್ಸವ, ಜಾತ್ರೆ ಮತ್ತು ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ',
          special_pooja_en: specialPoojaEn.trim() || 'Sankranti, Ugadi & Maha Shivaratri Special Pooja',
          special_pooja_kn: specialPoojaKn.trim() || 'ಸಂಕ್ರಾಂತಿ, ಯುಗಾದಿ ಮತ್ತು ಮಹಾ ಶಿವರಾತ್ರಿ ವಿಶೇಷ ಪೂಜೆ',
          image_url: finalImage,
          source: 'Muttagundi Grama Panchayat Heritage Register',
          verified: true
        });

        triggerHapticFeedback();
        setMsg({ text: isKannada ? '✅ ದೇವಾಲಯ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!' : '✅ Temple record created successfully!', type: 'success' });
        if (onSaved) onSaved(created);
        setTimeout(() => onClose(), 700);
      } else if (temple) {
        await dbService.updateTemple(
          temple.id,
          {
            name_en: nameEn.trim() || nameKn.trim(),
            name_kn: nameKn.trim() || nameEn.trim(),
            deity_en: deityEn.trim() || temple.deity_en,
            deity_kn: deityKn.trim() || temple.deity_kn,
            timings_en: timingsEn.trim() || temple.timings_en,
            timings_kn: timingsKn.trim() || temple.timings_kn,
            location_en: locationEn.trim() || temple.location_en,
            location_kn: locationKn.trim() || temple.location_kn,
            history_en: historyEn.trim() || temple.history_en,
            history_kn: historyKn.trim() || temple.history_kn,
            festivals_en: festivalsEn.trim() || temple.festivals_en,
            festivals_kn: festivalsKn.trim() || temple.festivals_kn,
            special_pooja_en: specialPoojaEn.trim() || temple.special_pooja_en,
            special_pooja_kn: specialPoojaKn.trim() || temple.special_pooja_kn,
            image_url: finalImage
          },
          currentUser?.uid,
          role
        );

        triggerHapticFeedback();
        setMsg({ text: isKannada ? '✅ ದೇವಾಲಯದ ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : '✅ Temple updated successfully!', type: 'success' });
        if (onSaved) onSaved({ ...temple, name_en: nameEn, name_kn: nameKn, image_url: finalImage });
        setTimeout(() => onClose(), 700);
      }
    } catch (err: any) {
      setMsg({ text: err?.message || 'Error saving temple', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!temple) return;
    const confirmPrompt = isKannada
      ? `"${temple.name_kn || temple.name_en}" ದೇವಾಲಯದ ದಾಖಲೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಖಚಿತವೇ?`
      : `Are you sure you want to permanently delete "${temple.name_en}"?`;
    if (!window.confirm(confirmPrompt)) return;

    setIsDeleting(true);
    try {
      await dbService.deleteTemple(temple.id, currentUser?.uid, role);
      triggerHapticFeedback();
      if (onDeleted) onDeleted(temple.id);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Error deleting temple');
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
            <Landmark size={20} color="#EC4899" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {mode === 'add'
                ? isKannada ? 'ಹೊಸ ದೇವಾಲಯ ಸೇರಿಸಿ (Add Temple)' : 'Add New Temple Record'
                : isKannada ? 'ದೇವಾಲಯ ತಿದ್ದುಪಡಿ & ಅಳಿಸುವಿಕೆ (Edit Temple)' : 'Edit / Correct Temple Record'}
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
          {/* Temple Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ದೇವಾಲಯದ ಹೆಸರು (ಕನ್ನಡ)' : 'Temple Name (Kannada)'}</label>
              <input
                type="text"
                className="form-input"
                value={nameKn}
                onChange={(e) => setNameKn(e.target.value)}
                placeholder="ಉದಾ: ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ..."
                required
              />
            </div>
            <div>
              <label className="form-label">{isKannada ? 'ದೇವಾಲಯದ ಹೆಸರು (English)' : 'Temple Name (English)'}</label>
              <input
                type="text"
                className="form-input"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Sri Lakshmi Thimmappa..."
                required
              />
            </div>
          </div>

          {/* Deity Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ಪ್ರಧಾನ ದೈವ (ಕನ್ನಡ)' : 'Primary Deity (Kannada)'}</label>
              <input
                type="text"
                className="form-input"
                value={deityKn}
                onChange={(e) => setDeityKn(e.target.value)}
                placeholder="ಉದಾ: ಶ್ರೀ ಆಂಜನೇಯ..."
              />
            </div>
            <div>
              <label className="form-label">{isKannada ? 'ಪ್ರಧಾನ ದೈವ (English)' : 'Primary Deity (English)'}</label>
              <input
                type="text"
                className="form-input"
                value={deityEn}
                onChange={(e) => setDeityEn(e.target.value)}
                placeholder="e.g. Lord Anjaneya Swamy..."
              />
            </div>
          </div>

          {/* Timings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ದರ್ಶನ ಸಮಯ (ಕನ್ನಡ)' : 'Darshan Timings (Kannada)'}</label>
              <input
                type="text"
                className="form-input"
                value={timingsKn}
                onChange={(e) => setTimingsKn(e.target.value)}
                placeholder="ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦..."
              />
            </div>
            <div>
              <label className="form-label">{isKannada ? 'ದರ್ಶನ ಸಮಯ (English)' : 'Darshan Timings (English)'}</label>
              <input
                type="text"
                className="form-input"
                value={timingsEn}
                onChange={(e) => setTimingsEn(e.target.value)}
                placeholder="6:00 AM - 12:30 PM..."
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ಸ್ಥಳ / ವಿಳಾಸ (ಕನ್ನಡ)' : 'Location / Address (Kannada)'}</label>
              <input
                type="text"
                className="form-input"
                value={locationKn}
                onChange={(e) => setLocationKn(e.target.value)}
                placeholder="ಉದಾ: ತೇರು ಬೀದಿ, ಮುತ್ತಗುಂಡಿ..."
              />
            </div>
            <div>
              <label className="form-label">{isKannada ? 'ಸ್ಥಳ / ವಿಳಾಸ (English)' : 'Location (English)'}</label>
              <input
                type="text"
                className="form-input"
                value={locationEn}
                onChange={(e) => setLocationEn(e.target.value)}
                placeholder="e.g. Car Street, Muttagundi..."
              />
            </div>
          </div>

          {/* History */}
          <div>
            <label className="form-label">{isKannada ? 'ಇತಿಹಾಸ & ಮಹತ್ವ (ಕನ್ನಡ)' : 'History & Significance (Kannada)'}</label>
            <textarea
              className="form-input"
              rows={3}
              value={historyKn}
              onChange={(e) => setHistoryKn(e.target.value)}
              placeholder="ದೇವಾಲಯದ ಪೌರಾಣಿಕ ಹಿನ್ನೆಲೆ, ಶಿಲ್ಪಕಲೆ ಹಾಗೂ ಮಹಿಮೆ..."
            />
          </div>
          <div>
            <label className="form-label">{isKannada ? 'ಇತಿಹಾಸ & ಮಹತ್ವ (English)' : 'History & Significance (English)'}</label>
            <textarea
              className="form-input"
              rows={3}
              value={historyEn}
              onChange={(e) => setHistoryEn(e.target.value)}
              placeholder="Temple historical origin, stone architecture & sanctum..."
            />
          </div>

          {/* Photo Management */}
          <div>
            <label className="form-label">{isKannada ? 'ದೇವಾಲಯದ ಭಾವಚಿತ್ರ' : 'Temple Photo Image'}</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}
              >
                <img
                  src={customPhotoInput.trim() || imageUrl || '/anime/temple_gopuram.jpg'}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Camera size={14} />
                  <span>{isKannada ? 'ಸಾಧನದಿಂದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload Image from Device'}</span>
                </button>

                <input
                  type="text"
                  className="form-input"
                  value={customPhotoInput}
                  onChange={(e) => setCustomPhotoInput(e.target.value)}
                  placeholder="Or paste image URL (https://... or /anime/...)"
                  style={{ fontSize: '0.78rem', height: '34px' }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '10px' }}>
            {mode === 'edit' && temple ? (
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
                <span>{isDeleting ? 'Deleting...' : (isKannada ? 'ಅಳಿಸಿ (Delete)' : 'Delete Temple')}</span>
              </button>
            ) : <div />}

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
                <span>
                  {isSaving
                    ? 'Saving...'
                    : mode === 'add'
                    ? (isKannada ? 'ದೇವಾಲಯ ಸೇರಿಸಿ' : 'Add Temple')
                    : (isKannada ? 'ತಿದ್ದುಪಡಿ ಉಳಿಸಿ' : 'Save Changes')}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
