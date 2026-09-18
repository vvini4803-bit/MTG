import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title,
  subtitle,
  onClose
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `muttagundi-image-${Date.now()}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="image-lightbox-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(5, 8, 18, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top, 12px) 12px env(safe-area-inset-bottom, 12px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Enlarged photo preview'}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '8px 12px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 8px',
          zIndex: 2
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {title && (
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={title}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '0.74rem',
                color: '#94A3B8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isZoomed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: isZoomed ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isZoomed ? '#34D399' : '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
            aria-label={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Download Image"
            aria-label="Download Image"
          >
            <Download size={18} />
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Open Original in New Tab"
            aria-label="Open Original in New Tab"
          >
            <ExternalLink size={18} />
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '44px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close Preview"
            aria-label="Close Preview"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Center Image Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '8px',
          cursor: isZoomed ? 'zoom-out' : 'zoom-in'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          } else {
            setIsZoomed(!isZoomed);
          }
        }}
      >
        <img
          src={imageUrl}
          alt={title || 'Village media'}
          style={{
            maxWidth: isZoomed ? 'none' : '96vw',
            maxHeight: isZoomed ? 'none' : '80vh',
            width: isZoomed ? '140%' : 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s ease',
            userSelect: 'none'
          }}
        />
      </div>

      {/* Bottom Hint */}
      <div
        style={{
          textAlign: 'center',
          padding: '6px 12px',
          fontSize: '0.74rem',
          color: 'rgba(255, 255, 255, 0.5)',
          maxWidth: '500px',
          margin: '0 auto',
          userSelect: 'none'
        }}
      >
        <span>💡 ಚಿತ್ರದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಜೂಮ್ ಮಾಡಿ • ಮುಚ್ಚಲು ಹೊರಗೆ ಕ್ಲಿಕ್ ಮಾಡಿ (Esc)</span>
      </div>
    </div>
  );
};
