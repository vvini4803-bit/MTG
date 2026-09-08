import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const { language, isKannada } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto transition after 3.5 seconds if not clicked
      onEnter();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onEnter]);

  const villageName = isKannada
    ? (import.meta.env.VITE_VILLAGE_NAME_KN || 'ನಮ್ಮ ಗ್ರಾಮ')
    : (import.meta.env.VITE_VILLAGE_NAME_EN || 'Gramasiri');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 30%, #0F5132 0%, #0A1628 60%, #040814 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambience Glow */}
      <div
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.25)',
          filter: 'blur(90px)',
          top: '20%'
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '480px' }}>
        <div style={{ marginBottom: '24px' }}>
          <img
            src="/logo.svg"
            alt="Gramasiri Village Logo"
            className="animate-float"
            style={{
              width: '110px',
              height: '110px',
              filter: 'drop-shadow(0 10px 25px rgba(16, 185, 129, 0.5))'
            }}
          />
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '16px'
          }}
        >
          <Sparkles size={14} color="#FBBF24" />
          DIGITAL VILLAGE SUPER APP 2026
        </span>

        <h1
          style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #F59E0B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {villageName}
        </h1>

        <p
          style={{
            fontSize: '1rem',
            fontWeight: 500,
            color: '#94A3B8',
            letterSpacing: '0.04em',
            marginBottom: '32px',
            lineHeight: 1.6
          }}
        >
          {isKannada
            ? 'ನಮ್ಮ ಗ್ರಾಮ — ನಮ್ಮ ಜನ — ನಮ್ಮ ಕಥೆಗಳು — ನಮ್ಮ ಭವಿಷ್ಯ'
            : 'OUR VILLAGE — OUR PEOPLE — OUR STORIES — OUR FUTURE'}
        </p>

        <button
          onClick={onEnter}
          className="btn-primary"
          style={{
            padding: '14px 32px',
            fontSize: '1rem',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '280px'
          }}
        >
          <span>{isKannada ? 'ಗ್ರಾಮ ಪ್ರವೇಶಿಸಿ' : 'Enter Super App'}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          fontSize: '0.75rem',
          color: '#64748B',
          zIndex: 10
        }}
      >
        <span>PWA Ready • Offline Capable • Real-Time Community</span>
      </div>
    </div>
  );
};
