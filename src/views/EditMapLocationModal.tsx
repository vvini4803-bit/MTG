import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { MapLocationItem, MapLocationCategory } from '../types';
import { getCategoryIcon, getCategoryColor } from '../services/defaultMapLocations';
import { triggerHapticFeedback } from '../services/deviceIdentity';
import { backNavigation } from '../services/backNavigation';
import {
  X,
  MapPin,
  Save,
  Trash2,
  Navigation,
  Compass,
  Phone,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface EditMapLocationModalProps {
  location: MapLocationItem | null;
  mode?: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (location: MapLocationItem) => void;
  onDeleted?: (locationId: string) => void;
}

export const EditMapLocationModal: React.FC<EditMapLocationModalProps> = ({
  location,
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
  const [category, setCategory] = useState<MapLocationCategory>('TEMPLE');
  const [descKn, setDescKn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [distanceKn, setDistanceKn] = useState('');
  const [distanceEn, setDistanceEn] = useState('');
  const [timingsKn, setTimingsKn] = useState('');
  const [timingsEn, setTimingsEn] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('13.7565');
  const [lng, setLng] = useState('76.3340');
  const [mapUrl, setMapUrl] = useState('');
  const [animeImage, setAnimeImage] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (mode === 'edit' && location) {
      setNameKn(location.name_kn || '');
      setNameEn(location.name_en || '');
      setCategory(location.category || 'TEMPLE');
      setDescKn(location.desc_kn || '');
      setDescEn(location.desc_en || '');
      setDistanceKn(location.distance_kn || '');
      setDistanceEn(location.distance_en || '');
      setTimingsKn(location.timings_kn || '');
      setTimingsEn(location.timings_en || '');
      setPhone(location.phone || '');
      setLat(String(location.coords?.lat || '13.7565'));
      setLng(String(location.coords?.lng || '76.3340'));
      setMapUrl(location.map_url || '');
      setAnimeImage(location.anime_image || '');
      setMsg(null);
    } else if (mode === 'add') {
      setNameKn('');
      setNameEn('');
      setCategory('TEMPLE');
      setDescKn('');
      setDescEn('');
      setDistanceKn('ಗ್ರಾಮ ಕೇಂದ್ರ');
      setDistanceEn('Village Center');
      setTimingsKn('ದಿನವಿಡೀ ಮುಕ್ತ');
      setTimingsEn('Open all day');
      setPhone('');
      setLat('13.7565');
      setLng('76.3340');
      setMapUrl('');
      setAnimeImage('');
      setMsg(null);
    }
  }, [mode, location, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const dismiss = backNavigation.pushModal('editMapModal', () => onClose());
      return () => dismiss();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDetectCurrentGps = () => {
    if (!navigator.geolocation) {
      setMsg({ text: 'GPS not supported on this browser', type: 'error' });
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setIsDetectingGps(false);
        triggerHapticFeedback();
        setMsg({ text: `📍 GPS detected: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, type: 'success' });
      },
      () => {
        setIsDetectingGps(false);
        setMsg({ text: 'Unable to acquire GPS location', type: 'error' });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameKn.trim()) {
      setMsg({ text: isKannada ? 'ಸ್ಥಳದ ಹೆಸರು ಅಗತ್ಯವಿದೆ' : 'Location name is required', type: 'error' });
      return;
    }

    const parsedLat = parseFloat(lat) || 13.7565;
    const parsedLng = parseFloat(lng) || 76.3340;
    const icon = getCategoryIcon(category);
    const color = getCategoryColor(category);

    setIsSaving(true);
    try {
      if (mode === 'add') {
        const created = await dbService.addMapLocation({
          name_en: nameEn.trim() || nameKn.trim(),
          name_kn: nameKn.trim() || nameEn.trim(),
          category,
          icon,
          color,
          desc_en: descEn.trim() || nameEn.trim(),
          desc_kn: descKn.trim() || nameKn.trim(),
          distance_en: distanceEn.trim() || 'Village Area',
          distance_kn: distanceKn.trim() || 'ಗ್ರಾಮ ಪ್ರದೇಶ',
          timings_en: timingsEn.trim() || undefined,
          timings_kn: timingsKn.trim() || undefined,
          phone: phone.trim() || undefined,
          coords: { lat: parsedLat, lng: parsedLng },
          map_url: mapUrl.trim() || `https://www.google.com/maps?q=${parsedLat},${parsedLng}`,
          anime_image: animeImage.trim() || undefined,
          verified: true
        });

        triggerHapticFeedback();
        setMsg({ text: isKannada ? '✅ ನಕ್ಷೆ ಸ್ಥಳ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!' : '✅ Map landmark created successfully!', type: 'success' });
        if (onSaved) onSaved(created);
        setTimeout(() => onClose(), 700);
      } else if (location) {
        await dbService.updateMapLocation(
          location.id,
          {
            name_en: nameEn.trim() || nameKn.trim(),
            name_kn: nameKn.trim() || nameEn.trim(),
            category,
            icon,
            color,
            desc_en: descEn.trim() || location.desc_en,
            desc_kn: descKn.trim() || location.desc_kn,
            distance_en: distanceEn.trim() || location.distance_en,
            distance_kn: distanceKn.trim() || location.distance_kn,
            timings_en: timingsEn.trim() || location.timings_en,
            timings_kn: timingsKn.trim() || location.timings_kn,
            phone: phone.trim() || location.phone,
            coords: { lat: parsedLat, lng: parsedLng },
            map_url: mapUrl.trim() || location.map_url,
            anime_image: animeImage.trim() || location.anime_image
          },
          currentUser?.uid,
          role
        );

        triggerHapticFeedback();
        setMsg({ text: isKannada ? '✅ ಸ್ಥಳದ ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : '✅ Landmark updated successfully!', type: 'success' });
        if (onSaved) onSaved({ ...location, name_en: nameEn, name_kn: nameKn, coords: { lat: parsedLat, lng: parsedLng } });
        setTimeout(() => onClose(), 700);
      }
    } catch (err: any) {
      setMsg({ text: err?.message || 'Error saving landmark', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!location) return;
    const confirmPrompt = isKannada
      ? `"${location.name_kn || location.name_en}" ಸ್ಥಳವನ್ನು ನಕ್ಷೆಯಿಂದ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಖಚಿತವೇ?`
      : `Are you sure you want to permanently delete "${location.name_en}" from map?`;
    if (!window.confirm(confirmPrompt)) return;

    setIsDeleting(true);
    try {
      await dbService.deleteMapLocation(location.id, currentUser?.uid, role);
      triggerHapticFeedback();
      if (onDeleted) onDeleted(location.id);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Error deleting landmark');
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
            <MapPin size={20} color="#10B981" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {mode === 'add'
                ? isKannada ? 'ಹೊಸ ನಕ್ಷೆ ಸ್ಥಳ ಸೇರಿಸಿ (Add Map Location)' : 'Add Village Map Landmark'
                : isKannada ? 'ಸ್ಥಳ ತಿದ್ದುಪಡಿ & ಅಳಿಸುವಿಕೆ (Edit Location)' : 'Edit / Correct Map Landmark'}
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
          {/* Location Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ಸ್ಥಳದ ಹೆಸರು (ಕನ್ನಡ)' : 'Landmark Name (Kannada)'}</label>
              <input
                type="text"
                className="form-input"
                value={nameKn}
                onChange={(e) => setNameKn(e.target.value)}
                placeholder="ಉದಾ: ಸರ್ಕಾರಿ ಶಾಲೆ, ಸಮುದಾಯ ಭವನ..."
                required
              />
            </div>
            <div>
              <label className="form-label">{isKannada ? 'ಸ್ಥಳದ ಹೆಸರು (English)' : 'Landmark Name (English)'}</label>
              <input
                type="text"
                className="form-input"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Village School, Panchayat Hall..."
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="form-label">{isKannada ? 'ವಿಭಾಗ (Category)' : 'Landmark Category'}</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as MapLocationCategory)}
            >
              <option value="TEMPLE">🛕 TEMPLE / ದೇಗುಲ</option>
              <option value="SCHOOL">🏫 SCHOOL / ಶಾಲೆ</option>
              <option value="HEALTH">🏥 HEALTH / ಆಸ್ಪತ್ರೆ / ಅಂಗನವಾಡಿ</option>
              <option value="HALL">🏛️ HALL / ಸಮುದಾಯ ಭವನ</option>
              <option value="WATER">💧 WATER / ನೀರಿನ ಘಟಕ</option>
              <option value="BUS">🚌 BUS / ಬಸ್ ನಿಲ್ದಾಣ</option>
              <option value="SHOP">🛒 SHOP / ಅಂಗಡಿಗಳು</option>
              <option value="BANK">🏦 BANK / ಬ್ಯಾಂಕ್ / ಸೊಸೈಟಿ</option>
              <option value="SPORTS">🏏 SPORTS / ಕ್ರೀಡಾಂಗಣ</option>
              <option value="FARM">🌴 FARM / ತೋಟ & ಕೃಷಿ</option>
              <option value="EMERGENCY">🚨 EMERGENCY / ತುರ್ತು ಸೇವೆ</option>
            </select>
          </div>

          {/* Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ವಿವರ (ಕನ್ನಡ)' : 'Description (Kannada)'}</label>
              <textarea
                className="form-input"
                rows={2}
                value={descKn}
                onChange={(e) => setDescKn(e.target.value)}
                placeholder="ಸ್ಥಳದ ಸಂಕ್ಷಿಪ್ತ ಮಾಹಿತಿ..."
              />
            </div>
            <div>
              <label className="form-label">{isKannada ? 'ವಿವರ (English)' : 'Description (English)'}</label>
              <textarea
                className="form-input"
                rows={2}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Short landmark description..."
              />
            </div>
          </div>

          {/* Coordinates (Lat, Lng) with Detect Button */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                {isKannada ? '🌐 ಜಿಪಿಎಸ್ ಅಕ್ಷಾಂಶ & ರೇಖಾಂಶ (GPS Coordinates)' : '🌐 GPS Coordinates (Lat & Lng)'}
              </label>
              <button
                type="button"
                onClick={handleDetectCurrentGps}
                disabled={isDetectingGps}
                className="btn-secondary"
                style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Compass size={12} />
                <span>{isDetectingGps ? 'Detecting...' : (isKannada ? '📍 ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಪಡೆದುಕೊಳ್ಳಿ' : 'Detect My GPS')}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Latitude (ಅಕ್ಷಾಂಶ)</span>
                <input
                  type="text"
                  className="form-input"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="13.7565"
                  required
                />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Longitude (ರೇಖಾಂಶ)</span>
                <input
                  type="text"
                  className="form-input"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="76.3340"
                  required
                />
              </div>
            </div>
          </div>

          {/* Timings & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">{isKannada ? 'ಸಮಯ (Timings)' : 'Timings / Hours'}</label>
              <input
                type="text"
                className="form-input"
                value={timingsKn}
                onChange={(e) => setTimingsKn(e.target.value)}
                placeholder="9:00 AM - 6:00 PM"
              />
            </div>
            <div>
              <label className="form-label">{isKannada ? 'ಸಂಪರ್ಕ ಸಂಖ್ಯೆ (Phone)' : 'Contact Phone'}</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 7483254968"
              />
            </div>
          </div>

          {/* Google Maps URL */}
          <div>
            <label className="form-label">
              {isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ಲಿಂಕ್ (Google Maps URL)' : 'Google Maps URL / Directions Link'}
            </label>
            <input
              type="text"
              className="form-input"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '10px' }}>
            {mode === 'edit' && location ? (
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
                <span>{isDeleting ? 'Deleting...' : (isKannada ? 'ಅಳಿಸಿ (Delete)' : 'Delete Landmark')}</span>
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
                    ? (isKannada ? 'ಸ್ಥಳ ಸೇರಿಸಿ' : 'Add Landmark')
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
