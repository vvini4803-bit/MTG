import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
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
  Image as ImageIcon
} from 'lucide-react';

interface GalleryScreenProps {
  onOpenGalleryDetail: (item: GalleryItem) => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ onOpenGalleryDetail }) => {
  const { language, isKannada } = useLanguage();
  const { currentUser, isModerator } = useAuth();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCat, setUploadCat] = useState<GalleryItem['category']>('FESTIVAL');
  const [uploadPhotoData, setUploadPhotoData] = useState<string | null>(null);

  useEffect(() => {
    return dbService.subscribeGallery(setGallery);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await compressImage(file, 1400, 1000, 0.85);
      setUploadPhotoData(result.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Image processing failed');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !uploadPhotoData || !uploadTitle.trim()) return;

    setIsUploading(true);
    await dbService.addGalleryItem({
      title_en: uploadTitle.trim(),
      title_kn: uploadTitle.trim(),
      category: uploadCat,
      url: uploadPhotoData,
      media_type: 'IMAGE',
      author_id: currentUser.uid,
      author_name: currentUser.name,
      approved: isModerator ? true : false
    });

    setIsUploading(false);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadPhotoData(null);
    alert(
      isModerator
        ? 'Photo published to official gallery!'
        : 'Photo submitted! It will appear after moderator review.'
    );
  };

  const filtered = gallery.filter((g) => {
    if (catFilter !== 'ALL' && g.category !== catFilter) return false;
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ಗ್ರಾಮದ ಛಾಯಾಚಿತ್ರ ಗ್ಯಾಲರಿ' : 'Village Photographic Archive & Gallery'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ನಮ್ಮ ಹಳ್ಳಿ, ಹಬ್ಬಗಳು, ಸುಗ್ಗಿಯ ದೃಶ್ಯಗಳು ಮತ್ತು ಪ್ರಾಕೃತಿಕ ಸೌಂದರ್ಯ'
              : 'Landscapes, seasonal harvests, festive processions and local life'}
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn-primary">
          <Camera size={18} />
          <span>{isKannada ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್' : 'Upload Photo'}</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
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
            onClick={() => setCatFilter(c.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              background: catFilter === c.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: catFilter === c.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: catFilter === c.id ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isKannada ? c.label_kn : c.label_en}
          </button>
        ))}
      </div>

      {/* Masonry / Responsive Photo Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => onOpenGalleryDetail(item)}
            className="glass-card glass-card-interactive card-3d"
            style={{
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              height: '240px'
            }}
          >
            <img
              src={item.url}
              alt={item.title_en}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '14px'
              }}
            >
              <span style={{ fontSize: '0.68rem', color: '#FEF08A', fontWeight: 700, textTransform: 'uppercase' }}>
                {item.category}
              </span>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                {isKannada ? item.title_kn : item.title_en}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
              {isKannada ? 'ಗ್ಯಾಲರಿಗೆ ಫೋಟೋ ಸೇರಿಸಿ' : 'Contribute Photo to Village Gallery'}
            </h3>

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಶೀರ್ಷಿಕೆ / ವಿವರಣೆ' : 'Photo Caption / Title *'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Morning fog at Lake Bund"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ವಿಭಾಗ' : 'Category'}</label>
                <select
                  className="form-select"
                  value={uploadCat}
                  onChange={(e) => setUploadCat(e.target.value as any)}
                >
                  <option value="FESTIVAL">Festivals (ಹಬ್ಬಗಳು)</option>
                  <option value="NATURE">Nature (ಪ್ರಕೃತಿ)</option>
                  <option value="AGRICULTURE">Agriculture (ಕೃಷಿ)</option>
                  <option value="SPORTS">Sports (ಕ್ರೀಡೆ)</option>
                  <option value="TEMPLE">Temple (ದೇವಾಲಯ)</option>
                  <option value="HERITAGE">Heritage (ಪರಂಪರೆ)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಭಾವಚಿತ್ರ ಆಯ್ಕೆ ಮಾಡಿ' : 'Choose Photo *'}</label>
                <input type="file" accept="image/*" onChange={handleFileSelect} required />
              </div>

              {uploadPhotoData && (
                <div style={{ maxHeight: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px' }}>
                  <img src={uploadPhotoData} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isUploading || !uploadPhotoData}>
                  {isUploading ? 'Uploading...' : 'Submit Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
