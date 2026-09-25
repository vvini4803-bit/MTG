import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { backNavigation } from '../services/backNavigation';
import { TempleItem } from '../types';
import {
  Landmark,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Check
} from 'lucide-react';

interface TemplesScreenProps {
  onOpenTempleDetail: (temple: TempleItem) => void;
  onOpenCreateTemple?: () => void;
}

export interface TempleThemeOption {
  id: string;
  name_en: string;
  name_kn: string;
  url: string;
  tag_en: string;
  tag_kn: string;
}

export const TEMPLE_THEMES: TempleThemeOption[] = [
  {
    id: 'anjaneya_gopuram',
    name_en: 'Sri Anjaneya Gopuram',
    name_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ಗೋಪುರ',
    url: '/anime/temple_gopuram.jpg',
    tag_en: 'Majestic Gopuram',
    tag_kn: 'ಭವ್ಯ ರಾಜಗೋಪುರ'
  },
  {
    id: 'kalleshwara_stone',
    name_en: 'Sri Kalleshwara Hoysala Temple',
    name_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಹೊಯ್ಸಳ ಮಂದಿರ',
    url: '/anime/kalleshwara.jpg',
    tag_en: 'Ancient Stone Sanctum',
    tag_kn: 'ಪುರಾತನ ಶಿಲಾ ಸನ್ನಿಧಿ'
  },
  {
    id: 'thimmappa_sanctum',
    name_en: 'Sri Lakshmi Thimmappa Shrine',
    name_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸನ್ನಿಧಿ',
    url: '/anime/stone_shrine.jpg',
    tag_en: 'Hillock Shrine',
    tag_kn: 'ಬೆಟ್ಟದ ಪವಿತ್ರ ಗುಡಿ'
  },
  {
    id: 'deepotsava_lamps',
    name_en: 'Deepotsava & Sacred Lamps',
    name_kn: 'ದೀಪೋತ್ಸವ & ಕಾರ್ತಿಕ ದೀಪ',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    tag_en: 'Sacred Lamps',
    tag_kn: 'ದೀಪಾರಾಧನೆ'
  },
  {
    id: 'grama_devathe',
    name_en: 'Grama Devathe & Garlands',
    name_kn: 'ಗ್ರಾಮ ದೇವತೆ ಹಬ್ಬದ ಸನ್ನಿಧಿ',
    url: 'https://images.unsplash.com/photo-1621827979802-6d778e170a2f?auto=format&fit=crop&w=800&q=80',
    tag_en: 'Village Guardian',
    tag_kn: 'ಗ್ರಾಮ ದೇವತೆ'
  },
  {
    id: 'vishnu_sanctum',
    name_en: 'Sri Maha Vishnu Golden Sanctum',
    name_kn: 'ಶ್ರೀ ಮಹಾವಿಷ್ಣು ಸುವರ್ಣ ಮಂದಿರ',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    tag_en: 'Golden Darshan',
    tag_kn: 'ಸುವರ್ಣ ಗರ್ಭಗುಡಿ'
  }
];

export const TemplesScreen: React.FC<TemplesScreenProps> = ({
  onOpenTempleDetail,
  onOpenCreateTemple
}) => {
  const { language, isKannada } = useLanguage();
  const { isAdmin } = useAuth();
  const [temples, setTemples] = useState<TempleItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [deityEn, setDeityEn] = useState('');
  const [deityKn, setDeityKn] = useState('');
  const [timingsEn, setTimingsEn] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [historyEn, setHistoryEn] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('/anime/temple_gopuram.jpg');
  const [customPhotoInput, setCustomPhotoInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return dbService.subscribeTemples(setTemples);
  }, []);

  // Back button handling: when modal is open, back closes the modal
  useEffect(() => {
    if (showAddModal) {
      const dismiss = backNavigation.pushModal('addTempleModal', () => {
        setShowAddModal(false);
      });
      return () => dismiss();
    }
  }, [showAddModal]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSelectedPhotoUrl(result);
        setCustomPhotoInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTemple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    const finalImage = (customPhotoInput.trim() || selectedPhotoUrl || '/anime/temple_gopuram.jpg').trim();
    const safeImage =
      finalImage.includes('photo-1609766857041-ed402ea8069a') || finalImage.toLowerCase().includes('bedroom')
        ? '/anime/temple_gopuram.jpg'
        : finalImage;

    await dbService.addTemple({
      name_en: nameEn.trim(),
      name_kn: nameKn.trim() || nameEn.trim(),
      deity_en: deityEn.trim() || 'Lord Shiva / Vishnu / Grama Devathe',
      deity_kn: deityKn.trim() || (nameKn.trim() ? 'ಗ್ರಾಮ ದೇವತೆ / ಶ್ರೀ ಸ್ವಾಮಿ' : 'Lord Shiva / Vishnu'),
      timings_en: timingsEn.trim() || '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
      timings_kn: nameKn.trim() ? (timingsEn.trim() || 'ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦ & ಸಂಜೆ ೫:೩೦ - ೮:೩೦') : '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
      location_en: locationEn.trim() || 'Muttagundi Village',
      location_kn: locationEn.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ',
      history_en: historyEn.trim() || 'Sacred historic temple and center of devotion for Muttagundi residents.',
      history_kn: historyEn.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮಸ್ಥರ ಪವಿತ್ರ ಆರಾಧನಾ ಕೇಂದ್ರ ಮತ್ತು ಐತಿಹಾಸಿಕ ತಾಣ.',
      festivals_en: 'Annual Rathotsava / Jaatre & Karthika Deepotsava',
      festivals_kn: 'ವಾರ್ಷಿಕ ರಥೋತ್ಸವ, ಜಾತ್ರೆ ಮತ್ತು ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ',
      special_pooja_en: 'Sankranti, Ugadi & Maha Shivaratri Special Pooja',
      special_pooja_kn: 'ಸಂಕ್ರಾಂತಿ, ಯುಗಾದಿ ಮತ್ತು ಮಹಾ ಶಿವರಾತ್ರಿ ವಿಶೇಷ ಪೂಜೆ',
      image_url: safeImage,
      source: 'Muttagundi Grama Panchayat Heritage Register',
      verified: true
    });

    setShowAddModal(false);
    setNameEn('');
    setNameKn('');
    setDeityEn('');
    setDeityKn('');
    setTimingsEn('');
    setLocationEn('');
    setHistoryEn('');
    setSelectedPhotoUrl('/anime/temple_gopuram.jpg');
    setCustomPhotoInput('');
  };

  const getCleanImageUrl = (url?: string) => {
    if (!url || url.includes('photo-1609766857041-ed402ea8069a') || url.toLowerCase().includes('bedroom')) {
      return '/anime/temple_gopuram.jpg';
    }
    return url;
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ದೇವಾಲಯಗಳು & ಪಾರಂಪರಿಕ ತಾಣಗಳು' : 'Temples & Sacred Heritage'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಹೊಯ್ಸಳ ಕಾಲದ ಶಿಲ್ಪಕಲೆ, ಗ್ರಾಮ ದೇವತೆ ಸನ್ನಿಧಿಗಳು ಹಾಗೂ ಪೂಜಾ ವಿವರಗಳು'
              : 'Historic Hoysala sanctums, village guardian shrines, festival timings & traditions'}
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>{isKannada ? 'ದೇಗುಲ ಸೇರಿಸಿ' : 'Add Temple Record'}</span>
        </button>
      </div>

      {/* Temples Grid */}
      {temples.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Landmark size={42} color="#EC4899" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            {isKannada ? 'ಯಾವುದೇ ದೇವಾಲಯಗಳ ಮಾಹಿತಿ ಇಲ್ಲ' : 'No Temple Records Added Yet'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
            {isKannada
              ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ, ವೀರಭದ್ರೇಶ್ವರ ಅಥವಾ ಗ್ರಾಮ ದೇವತೆ ಸನ್ನಿಧಿಯ ಇತಿಹಾಸ ಮತ್ತು ಪೂಜಾ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ.'
              : 'Add temple history, daily darshan pooja timings, and annual jaatre dates for Muttagundi.'}
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} />
            <span>{isKannada ? 'ಮೊದಲ ದೇಗುಲ ಸೇರಿಸಿ' : 'Add First Temple'}</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {temples.map((temple) => {
            const cleanImage = getCleanImageUrl(temple.image_url);
            return (
              <div
                key={temple.id}
                onClick={() => onOpenTempleDetail(temple)}
                className="glass-card glass-card-interactive card-3d"
                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ height: '200px', position: 'relative', overflow: 'hidden', background: '#0D1629' }}>
                  <img
                    src={cleanImage}
                    alt={temple.name_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/anime/temple_gopuram.jpg';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    color: '#34D399',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={12} />
                    {temple.verified ? 'Verified Heritage' : 'Awaiting Review'}
                  </div>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                    {isKannada ? temple.name_kn : temple.name_en}
                  </h2>

                  <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600, marginBottom: '10px' }}>
                    {isKannada ? temple.deity_kn : temple.deity_en}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                    <Clock size={14} color="#10B981" />
                    <span>{isKannada ? temple.timings_kn : temple.timings_en}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '14px' }}>
                    <MapPin size={14} color="#0284C7" />
                    <span>{isKannada ? temple.location_kn : temple.location_en}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                    {(isKannada ? temple.history_kn : temple.history_en).substring(0, 120)}...
                  </p>

                  <div style={{
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Source: {temple.source.split(' ')[0]}...</span>
                    <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                      {isKannada ? 'ವಿವರ ನೋಡಿ' : 'Explore'} →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Temple Modal with Sacred Themes & Photo Picker */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🛕</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಹೊಸ ದೇವಾಲಯದ ವಿವರ ಸೇರಿಸಿ' : 'Add Temple Record'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTemple}>
              {/* 🛕 TEMPLE PHOTO & THEME SELECTOR */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <ImageIcon size={15} color="#F59E0B" />
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                    {isKannada ? 'ದೇವಾಲಯದ ಥೀಮ್ ಮತ್ತು ಫೋಟೋ ಆಯ್ಕೆ' : 'Select Temple Theme & Photo *'}
                  </span>
                </label>

                {/* Live Preview of Selected Photo */}
                <div style={{
                  height: '140px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: '14px',
                  border: '2px solid rgba(245, 158, 11, 0.4)'
                }}>
                  <img
                    src={selectedPhotoUrl}
                    alt="Temple preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/anime/temple_gopuram.jpg';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    color: '#FBBF24',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Check size={12} />
                    <span>{isKannada ? 'ಆಯ್ಕೆಯಾದ ಪವಿತ್ರ ಫೋಟೋ' : 'Active Temple Theme'}</span>
                  </div>
                </div>

                {/* Preset Themes Carousel / Grid */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {isKannada ? 'ಪವಿತ್ರ ದೇವಾಲಯ ಥೀಮ್‌ಗಳು:' : 'Curated Temple Themes:'}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px',
                  marginBottom: '14px'
                }}>
                  {TEMPLE_THEMES.map((theme) => {
                    const isSelected = selectedPhotoUrl === theme.url;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setSelectedPhotoUrl(theme.url);
                          setCustomPhotoInput('');
                        }}
                        style={{
                          background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '2px solid #F59E0B' : '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ height: '56px', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                          <img src={theme.url} alt={theme.name_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isSelected ? '#FBBF24' : '#FFFFFF',
                          lineHeight: 1.2
                        }}>
                          {isKannada ? theme.name_kn : theme.name_en}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {isKannada ? theme.tag_kn : theme.tag_en}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Photo Upload or Direct URL */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#34D399',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={14} />
                    <span>{isKannada ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload Device Photo'}</span>
                  </button>

                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <input
                      type="url"
                      className="form-input"
                      value={customPhotoInput}
                      onChange={(e) => {
                        setCustomPhotoInput(e.target.value);
                        if (e.target.value.trim()) {
                          setSelectedPhotoUrl(e.target.value.trim());
                        }
                      }}
                      placeholder={isKannada ? 'ಅಥವಾ ಫೋಟೋ ಲಿಂಕ್ (URL)...' : 'Or paste online photo URL...'}
                      style={{ fontSize: '0.78rem', height: '34px', padding: '4px 8px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ದೇಗುಲದ ಹೆಸರು (English)' : 'Temple Name (English) *'}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Sri Anjaneya Swamy Temple"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ದೇಗುಲದ ಹೆಸರು (ಕನ್ನಡ)' : 'Temple Name (Kannada)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={nameKn}
                  onChange={(e) => setNameKn(e.target.value)}
                  placeholder="ಉದಾ: ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಮುಖ್ಯ ದೇವರು / ಅಧಿದೇವತೆ' : 'Main Deity'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={deityEn}
                  onChange={(e) => setDeityEn(e.target.value)}
                  placeholder="e.g. Sri Rama Devru / Anjaneya Swamy / Lord Shiva"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಪೂಜಾ ಸಮಯ / ದರ್ಶನ' : 'Pooja / Darshan Timings'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={timingsEn}
                  onChange={(e) => setTimingsEn(e.target.value)}
                  placeholder="e.g. 6:30 AM - 1:00 PM & 5:00 PM - 8:30 PM"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಸ್ಥಳ / ವಿಳಾಸ' : 'Location'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={locationEn}
                  onChange={(e) => setLocationEn(e.target.value)}
                  placeholder="e.g. Car Street / Lake Bund, Muttagundi"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ದೇವಾಲಯದ ಇತಿಹಾಸ & ಹಿನ್ನೆಲೆ' : 'Temple History & Significance'}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={historyEn}
                  onChange={(e) => setHistoryEn(e.target.value)}
                  placeholder={isKannada ? 'ದೇಗುಲದ ಸಂಪ್ರದಾಯ, ಜಾತ್ರೆ ಮತ್ತು ಇತಿಹಾಸ...' : 'Historic origins, architecture, annual festival and traditions...'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary">
                  {isKannada ? 'ದೇಗುಲ ಉಳಿಸಿ (SAVE)' : 'Save Temple'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplesScreen;
