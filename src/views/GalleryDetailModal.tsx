import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { GalleryItem } from '../types';
import { X, Heart, Flag, Share2, Download, User } from 'lucide-react';

interface GalleryDetailModalProps {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReportModal: (type: 'MEDIA', id: string, title: string) => void;
}

export const GalleryDetailModal: React.FC<GalleryDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenReportModal
}) => {
  const { language, isKannada } = useLanguage();

  if (!isOpen || !item) return null;

  const title = language === 'kn' ? item.title_kn : item.title_en;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '720px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'relative', background: '#000000', maxHeight: '520px', display: 'flex', justifyContent: 'center' }}>
          <img src={item.url} alt={title} style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain' }} />
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

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
              {item.category}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {item.created_at}
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>{title}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Captured & uploaded by: <strong>{item.author_name}</strong>
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
            <button
              onClick={() => onOpenReportModal('MEDIA', item.id, title)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem'
              }}
            >
              <Flag size={13} />
              <span>Report Photo</span>
            </button>

            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
            >
              <Download size={14} />
              <span>View Full Resolution</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
