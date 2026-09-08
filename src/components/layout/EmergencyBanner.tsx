import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { EmergencyAlert } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { AlertOctagon, PhoneCall, ShieldAlert, X } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { language, isKannada } = useLanguage();

  useEffect(() => {
    return dbService.subscribeEmergencyAlert((currentAlert) => {
      setAlert(currentAlert);
    });
  }, []);

  if (!alert || !alert.active || dismissed) return null;

  const title = language === 'kn' ? alert.title_kn : alert.title_en;
  const message = language === 'kn' ? alert.message_kn : alert.message_en;
  const issuedBy = language === 'kn' ? alert.issued_by_kn : alert.issued_by_en;

  return (
    <div
      role="alert"
      style={{
        background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
        color: '#FEE2E2',
        borderBottom: '2px solid #EF4444',
        padding: '12px 16px',
        position: 'relative',
        zIndex: 45,
        boxShadow: '0 4px 20px rgba(185, 28, 28, 0.4)'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          padding: '6px',
          display: 'flex',
          flexShrink: 0
        }}>
          <AlertOctagon size={24} color="#FEF2F2" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{
              background: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldAlert size={12} />
              {isKannada ? 'ಅಧಿಕೃತ ತುರ್ತು ಎಚ್ಚರಿಕೆ' : 'OFFICIAL EMERGENCY ALERT'}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
              {isKannada ? `ಮೂಲ: ${issuedBy}` : `Source: ${issuedBy}`}
            </span>
          </div>

          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
            {title}
          </h4>

          <p style={{ fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '8px', color: '#FEE2E2' }}>
            {message}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
            {alert.contact_info && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(0,0,0,0.3)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 600,
                color: '#FEF08A'
              }}>
                <PhoneCall size={13} />
                {alert.contact_info}
              </span>
            )}
            <span style={{ fontStyle: 'italic', opacity: 0.85 }}>
              {isKannada
                ? 'ದಯವಿಟ್ಟು ಈ ಮಾಹಿತಿಯನ್ನು ಅಧಿಕೃತ ಸ್ಥಳೀಯ ಪ್ರಾಧಿಕಾರಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.'
                : 'Please verify this information through official local authorities.'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FEE2E2',
            cursor: 'pointer',
            padding: '4px',
            opacity: 0.8
          }}
          aria-label="Dismiss Emergency Banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
