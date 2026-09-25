import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { backNavigation } from '../services/backNavigation';
import { CropItem } from '../types';
import {
  X,
  Wheat,
  Droplets,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Calendar,
  Layers,
  ArrowDown
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

  useEffect(() => {
    if (isOpen) {
      const dismiss = backNavigation.pushModal('cropDetailModal', onClose);
      return () => dismiss();
    }
  }, [isOpen, onClose]);

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
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        touchAction: 'pan-y',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          width: '100%',
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Image and Accessible Close Button */}
        <div style={{ position: 'relative', height: '190px', minHeight: '190px', flexShrink: 0, background: '#0D1629' }}>
          <img
            src={crop.image_url}
            alt={crop.name_en}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(16, 25, 46, 0.9) 100%)'
          }} />

          {/* Top Close Button (Always visible on top of image) */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              color: '#FFFFFF',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Title & Badge Overlay inside Header */}
          <div style={{ position: 'absolute', bottom: '14px', left: '18px', right: '18px', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-verified" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                <ShieldCheck size={12} />
                VERIFIED CROP GUIDE
              </span>
              <span style={{ fontSize: '0.74rem', color: '#FEF08A', fontWeight: 700 }}>
                {crop.category} CROP
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
              {name}
            </h2>
          </div>
        </div>

        {/* Dedicated Scrollable Content Body - Native Touch Scroll */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            padding: '20px 20px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Quick Specifications Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Calendar size={13} color="#10B981" /> {isKannada ? 'ಹಂಗಾಮು' : 'Season'}
              </span>
              <strong style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>{season}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Layers size={13} color="#F59E0B" /> {isKannada ? 'ಮಣ್ಣಿನ ವಿಧ' : 'Soil Type'}
              </span>
              <strong style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>{soil}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Droplets size={13} color="#0284C7" /> {isKannada ? 'ನೀರಿನ ಅಗತ್ಯ' : 'Water Need'}
              </span>
              <strong style={{ fontSize: '0.88rem', color: '#38BDF8' }}>{water}</strong>
            </div>
          </div>

          {/* Full Cultivation Guide Practices */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <h4 style={{
              fontSize: '0.96rem',
              fontWeight: 700,
              color: '#34D399',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sprout size={18} />
              <span>{isKannada ? 'ಬೇಸಾಯ ಕ್ರಮ & ತಳಿಗಳ ವಿವರ' : 'Cultivation Practices & Recommended Varieties'}</span>
            </h4>
            <div style={{
              fontSize: '0.9rem',
              color: '#F1F5F9',
              lineHeight: 1.7,
              whiteSpace: 'pre-line'
            }}>
              {cultivation}
            </div>
          </div>

          {/* Uses & Nutritional Profile */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <h4 style={{
              fontSize: '0.96rem',
              fontWeight: 700,
              color: '#FBBF24',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Bookmark size={18} />
              <span>{isKannada ? 'ಬಳಕೆ, ಮಾರುಕಟ್ಟೆ & ಪೋಷಕಾಂಶ ಗುಣಗಳು' : 'Common Uses & Market Value'}</span>
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#E2E8F0', lineHeight: 1.6, margin: 0 }}>
              {uses}
            </p>
          </div>

          {/* Advantages & Risks side by side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{isKannada ? 'ಅನುಕೂಲಗಳು & ಇಳುವರಿ' : 'Key Advantages'}</span>
              </span>
              <p style={{ fontSize: '0.84rem', color: '#E2E8F0', lineHeight: 1.5, margin: 0 }}>
                {advantages}
              </p>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#FCA5A5',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{isKannada ? 'ಕೀಟಬಾಧೆ & ಎಚ್ಚರಿಕೆಗಳು' : 'Risks & Pest Control'}</span>
              </span>
              <p style={{ fontSize: '0.84rem', color: '#E2E8F0', lineHeight: 1.5, margin: 0 }}>
                {risks}
              </p>
            </div>
          </div>

          {/* Source Attribution & Bottom Close Button */}
          <div style={{
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '16px',
            marginTop: '8px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{ color: '#94A3B8' }}>{isKannada ? 'ದೃಢೀಕೃತ ಮೂಲ:' : 'Verified Source:'} {crop.source}</span>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                {isKannada ? 'ದೃಢೀಕರಣ ದಿನಾಂಕ:' : 'Date:'} {crop.verified_date}
              </span>
            </div>

            <button
              onClick={onClose}
              className="btn-primary"
              style={{
                fontSize: '0.82rem',
                padding: '8px 18px',
                minHeight: '38px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {isKannada ? 'ಮುಚ್ಚಿ (Close Guide)' : 'Close Guide'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropDetailModal;
