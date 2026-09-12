import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { getEffectiveUserId, getEffectiveUserName, triggerHapticFeedback } from '../services/deviceIdentity';
import { compressImage } from '../services/imageOptimizer';
import { GalleryItem } from '../types';
import {
  Camera,
  Plus,
  Heart,
  Share2,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  HardDrive,
  Upload,
  User,
  Sparkles
} from 'lucide-react';

interface GalleryScreenProps {
  onOpenGalleryDetail: (item: GalleryItem) => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ onOpenGalleryDetail }) => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCat, setUploadCat] = useState<GalleryItem['category']>('FESTIVAL');
  const [uploadPhotoData, setUploadPhotoData] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveUid = getEffectiveUserId(currentUser);

  useEffect(() => {
    return dbService.subscribeGallery(setGallery);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await compressImage(file, 1400, 1000, 0.85);
      setUploadPhotoData(result.dataUrl);
      triggerHapticFeedback();
    } catch (err: any) {
      alert(err.message || 'Image processing failed');
    }
  };

  const handleLikePhoto = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    triggerHapticFeedback();
    await dbService.toggleLikeGalleryItem(itemId, effectiveUid);
  };

  const handleShareWhatsApp = (e: React.MouseEvent, item: GalleryItem) => {
    e.stopPropagation();
    triggerHapticFeedback();
    const title = isKannada ? item.title_kn : item.title_en;
    const text = `📸 *${title}* - ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಸುಂದರ ಛಾಯಾಚಿತ್ರ:\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPhotoData || !uploadTitle.trim()) return;

    triggerHapticFeedback();
    setIsUploading(true);

    const authorName = currentUser
      ? currentUser.name
      : (guestName.trim() || getEffectiveUserName(currentUser, isKannada));

    await dbService.addGalleryItem({
      title_en: uploadTitle.trim(),
      title_kn: uploadTitle.trim(),
      category: uploadCat,
      url: uploadPhotoData,
      media_type: 'IMAGE',
      author_id: effectiveUid,
      author_name: authorName,
      approved: true
    });

    setIsUploading(false);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadPhotoData(null);
    setGuestName('');
    alert(isKannada ? 'ಭಾವಚಿತ್ರ ಗ್ರಾಮ ಭಂಡಾರದಲ್ಲಿ ಶಾಶ್ವತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' : 'Photo permanently saved to village archive!');
  };

  const filtered = gallery.filter((g) => {
    if (catFilter !== 'ALL' && g.category !== catFilter) return false;
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1080px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
              {isKannada ? 'ಗ್ರಾಮದ ಛಾಯಾಚಿತ್ರ ಗ್ಯಾಲರಿ' : 'Village Photographic Archive & Gallery'}
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06B6D4',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}
              title="Permanent IndexedDB storage enabled"
            >
              <HardDrive size={11} />
              {isKannada ? 'ಶಾಶ್ವತ ಸಂಗ್ರಹ' : 'Permanent Storage'}
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isKannada
              ? 'ನಮ್ಮ ಹಳ್ಳಿ, ಹಬ್ಬಗಳು, ಸುಗ್ಗಿಯ ದೃಶ್ಯಗಳು ಮತ್ತು ಪ್ರಾಕೃತಿಕ ಸೌಂದರ್ಯ — ಎಲ್ಲಾ ಚಿತ್ರಗಳು ಶಾಶ್ವತವಾಗಿ ಲಭ್ಯ'
              : 'Landscapes, seasonal harvests, festive processions and local life — permanently preserved'}
          </p>
        </div>

        <button
          onClick={() => {
            triggerHapticFeedback();
            setShowUploadModal(true);
          }}
          className="btn-primary"
          style={{ minHeight: '44px' }}
        >
          <Camera size={18} />
          <span>{isKannada ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್' : 'Upload Photo'}</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {[
          { id: 'ALL', label_en: 'All Photos', label_kn: 'ಎಲ್ಲಾ ಚಿತ್ರಗಳು' },
          { id: 'FESTIVAL', label_en: 'Festivals', label_kn: 'ಹಬ್ಬಗಳು' },
          { id: 'NATURE', label_en: 'Nature & Lake', label_kn: 'ಪ್ರಕೃತಿ & ಕೆರೆ' },
          { id: 'AGRICULTURE', label_en: 'Harvest & Farming', label_kn: 'ಸುಗ್ಗಿ & ಕೃಷಿ' },
          { id: 'SPORTS', label_en: 'Sports', label_kn: 'ಕ್ರೀಡೆ' },
          { id: 'TEMPLE', label_en: 'Temples', label_kn: 'ದೇವಾಲಯಗಳು' }
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => {
              triggerHapticFeedback();
              setCatFilter(c.id);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              background: catFilter === c.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: catFilter === c.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: catFilter === c.id ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minHeight: '38px',
              transition: 'all 0.15s ease'
            }}
          >
            {isKannada ? c.label_kn : c.label_en}
          </button>
        ))}
      </div>

      {/* Responsive Masonry/Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ImageIcon size={42} color="#06B6D4" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            {isKannada ? 'ಯಾವುದೇ ಫೋಟೋಗಳಿಲ್ಲ' : 'No Village Photos Yet'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
            {isKannada
              ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಪ್ರಕೃತಿ, ಕೃಷಿ, ದೇವಾಲಯ ಅಥವಾ ಹಬ್ಬಗಳ ಸುಂದರ ಚಿತ್ರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಿಮ್ಮ ಚಿತ್ರಗಳು ಶಾಶ್ವತವಾಗಿ ಉಳಿಯುತ್ತವೆ.'
              : 'Upload real photos of Muttagundi village — temples, festivals, nature, and community life. Photos are permanently stored.'}
          </p>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
            <Camera size={16} />
            <span>{isKannada ? 'ಮೊದಲ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload First Photo'}</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}
        >
          {filtered.map((item) => {
            const isLiked = Array.isArray(item.liked_by) && item.liked_by.includes(effectiveUid);
            return (
              <div
                key={item.id}
                onClick={() => onOpenGalleryDetail(item)}
                className="glass-card glass-card-interactive card-3d"
                style={{
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  height: '260px',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <img
                  src={item.url}
                  alt={item.title_en}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />

                {/* Top Overlay: Like Button */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 2
                  }}
                >
                  <button
                    onClick={(e) => handleLikePhoto(e, item.id)}
                    style={{
                      background: isLiked ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 0, 0, 0.55)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 10px',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      minHeight: '32px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.15s ease'
                    }}
                    title={isLiked ? 'Liked' : 'Like'}
                  >
                    <Heart
                      size={14}
                      fill={isLiked ? '#FFFFFF' : 'none'}
                      color="#FFFFFF"
                      style={{ animation: isLiked ? 'heartPop 0.3s ease' : 'none' }}
                    />
                    <span>{item.likes_count || 0}</span>
                  </button>

                  <button
                    onClick={(e) => handleShareWhatsApp(e, item)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.55)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      color: '#22C55E',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                    title="Share on WhatsApp"
                  >
                    <Share2 size={13} />
                  </button>
                </div>

                {/* Bottom Gradient Metadata */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.88) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '16px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: '#FEF08A',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {item.category}
                  </span>
                  <h4
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      lineHeight: 1.3,
                      margin: '4px 0 2px'
                    }}
                  >
                    {isKannada ? item.title_kn : item.title_en}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                    {item.author_name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Super Smart Mobile-Flexible Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div
            className="modal-content mobile-bottom-sheet"
            style={{ maxWidth: '520px', padding: '22px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಗ್ಯಾಲರಿಗೆ ಫೋಟೋ ಸೇರಿಸಿ' : 'Upload Village Photo'}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  🔒 {isKannada ? 'ಶಾಶ್ವತ ಸಂಗ್ರಹಣೆ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Permanent Archive Enabled'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
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
                ✕
              </button>
            </div>

            {/* Permanent Storage Notice Banner */}
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.78rem',
                color: '#E0F2FE'
              }}
            >
              <HardDrive size={18} color="#06B6D4" style={{ flexShrink: 0 }} />
              <div>
                <strong>{isKannada ? 'ಶಾಶ್ವತ ಭಂಡಾರ: ' : 'Permanent Local Archive: '}</strong>
                {isKannada
                  ? 'ಈ ಫೋಟೋ ನಿಮ್ಮ ಮೊಬೈಲ್‌ನ IndexedDB ಯಲ್ಲಿ ಶಾಶ್ವತವಾಗಿ ಸಂಗ್ರಹವಾಗುತ್ತದೆ. ಬ್ರೌಸರ್ ಕ್ಲಿಯರ್ ಆಗದ ಹೊರತು ಎಂದಿಗೂ ಅಳಿಸುವುದಿಲ್ಲ.'
                  : 'Photos are permanently stored in device IndexedDB without browser quota restrictions.'}
              </div>
            </div>

            <form onSubmit={handleUploadSubmit}>
              {/* Dual Mobile Picker: Camera or Gallery */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>
                  {isKannada ? 'ಫೋಟೋ ಆಯ್ಕೆ ವಿಧಾನ' : 'Choose Photo Source *'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Camera Direct Capture */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      color: '#34D399',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      minHeight: '60px'
                    }}
                  >
                    <Camera size={22} />
                    <span>{isKannada ? 'ಕ್ಯಾಮರಾ (ನೇರ ಫೋಟೋ)' : 'Take Photo (Camera)'}</span>
                  </button>

                  {/* Device File/Gallery Picker */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(6, 182, 212, 0.12)',
                      border: '1px solid rgba(6, 182, 212, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      color: '#06B6D4',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      minHeight: '60px'
                    }}
                  >
                    <Upload size={22} />
                    <span>{isKannada ? 'ಗ್ಯಾಲರಿ (ಫೈಲ್ಸ್)' : 'Browse Photos'}</span>
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Photo Preview */}
              {uploadPhotoData && (
                <div
                  style={{
                    maxHeight: '200px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid var(--accent-emerald)',
                    position: 'relative'
                  }}
                >
                  <img src={uploadPhotoData} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      color: '#34D399',
                      fontWeight: 600
                    }}
                  >
                    ✓ {isKannada ? 'ಆಪ್ಟಿಮೈಸ್ ಮಾಡಲಾಗಿದೆ' : 'Optimized for Permanent Storage'}
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಶೀರ್ಷಿಕೆ / ವಿವರಣೆ *' : 'Photo Caption / Title *'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={isKannada ? 'ಉದಾ: ಮುಂಜಾನೆಯ ಕೆರೆಯ ಮಂಜು' : 'e.g. Morning fog at Muttagundi Lake'}
                  required
                />
              </div>

              {/* Category Select */}
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ವಿಭಾಗ' : 'Category'}</label>
                <select
                  className="form-select"
                  value={uploadCat}
                  onChange={(e) => setUploadCat(e.target.value as any)}
                >
                  <option value="FESTIVAL">Festivals (ಹಬ್ಬಗಳು)</option>
                  <option value="NATURE">Nature (ಪ್ರಕೃತಿ & ಕೆರೆ)</option>
                  <option value="AGRICULTURE">Agriculture (ಕೃಷಿ & ಸುಗ್ಗಿ)</option>
                  <option value="SPORTS">Sports (ಕ್ರೀಡೆ)</option>
                  <option value="TEMPLE">Temple (ದೇವಾಲಯ)</option>
                  <option value="HERITAGE">Heritage (ಪರಂಪರೆ)</option>
                </select>
              </div>

              {/* Guest Name input if not logged in */}
              {!currentUser && (
                <div className="form-group">
                  <label className="form-label">{isKannada ? 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ)' : 'Your Name (Optional)'}</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={isKannada ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮಸ್ಥರು' : 'Muttagundi Resident'}
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary" style={{ minHeight: '44px' }}>
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUploading || !uploadPhotoData || !uploadTitle.trim()}
                  style={{ minHeight: '44px' }}
                >
                  {isUploading
                    ? (isKannada ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving Permanently...')
                    : (isKannada ? 'ಶಾಶ್ವತವಾಗಿ ಸೇರಿಸಿ' : 'Save Photo Permanently')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
