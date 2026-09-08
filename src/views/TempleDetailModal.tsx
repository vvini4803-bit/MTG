import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TempleItem } from '../types';
import {
  X,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Bookmark,
  Building
} from 'lucide-react';

interface TempleDetailModalProps {
  temple: TempleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TempleDetailModal: React.FC<TempleDetailModalProps> = ({
  temple,
  isOpen,
  onClose
}) => {
  const { language, isKannada } = useLanguage();

  if (!isOpen || !temple) return null;

  const name = language === 'kn' ? temple.name_kn : temple.name_en;
  const deity = language === 'kn' ? temple.deity_kn : temple.deity_en;
  const history = language === 'kn' ? temple.history_kn : temple.history_en;
  const location = language === 'kn' ? temple.location_kn : temple.location_en;
  const timings = language === 'kn' ? temple.timings_kn : temple.timings_en;
  const festivals = language === 'kn' ? temple.festivals_kn : temple.festivals_en;
  const specialPooja = language === 'kn' ? temple.special_pooja_kn : temple.special_pooja_en;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'relative', height: '240px' }}>
          <img src={temple.image_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-verified">
              <ShieldCheck size={12} />
              VERIFIED HERITAGE ARCHIVE
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>
            {name}
          </h2>
          <span style={{ fontSize: '0.9rem', color: '#F59E0B', fontWeight: 700, display: 'block', marginBottom: '18px' }}>
            {deity}
          </span>

          {/* Timings & Location Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Clock size={13} color="#10B981" /> Daily Darshan Timings
              </span>
              <strong style={{ fontSize: '0.85rem' }}>{timings || 'Information not available yet'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <MapPin size={13} color="#0284C7" /> Sannidhi Location
              </span>
              <strong style={{ fontSize: '0.85rem' }}>{location}</strong>
            </div>
          </div>

          {/* History */}
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={16} color="#F59E0B" />
              {isKannada ? 'ದೇವಾಲಯದ ಇತಿಹಾಸ & ವಾಸ್ತುಶಿಲ್ಪ' : 'Sacred History & Architecture'}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {history}
            </p>
          </div>

          {/* Festivals */}
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="#EC4899" />
              {isKannada ? 'ವಾರ್ಷಿಕ ಉತ್ಸವಗಳು & ಜಾತ್ರೆಗಳು' : 'Annual Festivals & Celebrations'}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {festivals}
            </p>
          </div>

          {/* Special Pooja */}
          {specialPooja && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles size={14} /> Special Sevas & Pooja
              </span>
              <p style={{ fontSize: '0.82rem', color: '#FEF3C7', lineHeight: 1.5 }}>
                {specialPooja}
              </p>
            </div>
          )}

          <div style={{
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '14px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span>Verified Source: {temple.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
