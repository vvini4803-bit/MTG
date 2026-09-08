import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CropItem } from '../types';
import {
  X,
  Wheat,
  Droplets,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

interface CropDetailModalProps {
  crop: CropItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CropDetailModal: React.FC<CropDetailModalProps> = ({
  crop,
  isOpen,
  onClose
}) => {
  const { language, isKannada } = useLanguage();

  if (!isOpen || !crop) return null;

  const name = language === 'kn' ? crop.name_kn : crop.name_en;
  const season = language === 'kn' ? crop.season_kn : crop.season_en;
  const soil = language === 'kn' ? crop.soil_type_kn : crop.soil_type_en;
  const water = language === 'kn' ? crop.water_req_kn : crop.water_req_en;
  const cultivation = language === 'kn' ? crop.cultivation_kn : crop.cultivation_en;
  const uses = language === 'kn' ? crop.uses_kn : crop.uses_en;
  const advantages = language === 'kn' ? crop.advantages_kn : crop.advantages_en;
  const risks = language === 'kn' ? crop.risks_kn : crop.risks_en;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'relative', height: '220px' }}>
          <img src={crop.image_url} alt={crop.name_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              color: '#FFFFFF',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="badge badge-verified">
              <ShieldCheck size={12} />
              VERIFIED CROP GUIDE
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {crop.category} CROP
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px' }}>
            {name}
          </h2>

          {/* Quick Specifications Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Season</span>
              <strong style={{ fontSize: '0.88rem' }}>{season}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Soil Type</span>
              <strong style={{ fontSize: '0.88rem' }}>{soil}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Water Need</span>
              <strong style={{ fontSize: '0.88rem', color: '#38BDF8' }}>{water}</strong>
            </div>
          </div>

          {/* Cultivation Guide */}
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#10B981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sprout size={16} />
              {isKannada ? 'ಬೇಸಾಯ ಕ್ರಮ & ತಳಿಗಳು' : 'Cultivation Practices & Recommended Varieties'}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {cultivation}
            </p>
          </div>

          {/* Uses */}
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F59E0B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bookmark size={16} />
              {isKannada ? 'ಬಳಕೆ & ಪೋಷಕಾಂಶ ಗುಣಗಳು' : 'Common Uses & Nutritional Profile'}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {uses}
            </p>
          </div>

          {/* Advantages & Risks side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <CheckCircle2 size={14} /> Advantages
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {advantages}
              </p>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <AlertTriangle size={14} /> Risks & Pests
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {risks}
              </p>
            </div>
          </div>

          {/* Source Attribution */}
          <div style={{
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Verified Source: {crop.source}</span>
            <span>Date: {crop.verified_date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
