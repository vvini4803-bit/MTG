import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Sparkles, Volume2, VolumeX, X, Play, Compass, Sun, Heart } from 'lucide-react';
import { triggerHapticFeedback } from '../services/deviceIdentity';

interface SplashScreenProps {
  onEnter: () => void;
  autoPlayAudio?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const { isKannada, language, setLanguage } = useLanguage();
  const [isMuted, setIsMuted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play a soft meditative morning temple chime using Web Audio API
  const playMorningChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Harmonic chords (Pentatonic peaceful bell: C5, E5, G5, B5, D6)
      const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.15 + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 3.0);
      });
      setIsMuted(false);
    } catch {
      // Audio autoplay restrictions gracefully handled
    }
  };

  const handleEnter = () => {
    triggerHapticFeedback();
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  // Rotate through 3 village pride highlights
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Auto transition after 9 seconds if user just wants to watch
  useEffect(() => {
    const timer = setTimeout(() => {
      handleEnter();
    }, 9000);
    return () => clearTimeout(timer);
  }, []);

  const features = isKannada
    ? [
        { icon: '🌾', title: 'ಸಮೃದ್ಧ ಕೃಷಿ & ಹಸಿರು ಸಿರಿ', subtitle: 'ರೈತರ ಹೆಮ್ಮೆಯ ಶ್ರಮ, ಕಾಲುವೆ ನೀರಿನ ಸಂಭ್ರಮ' },
        { icon: '🛕', title: 'ಐತಿಹಾಸಿಕ ಶ್ರೀ ಕ್ಷೇತ್ರ ದೇಗುಲ', subtitle: 'ಪವಿತ್ರ ಗೋಪುರ ಮತ್ತು ಗ್ರಾಮ ದೇವತೆಯ ಕೃಪೆ' },
        { icon: '🤖', title: 'ಭಾರತದ ಮೊದಲ ಡಿಜಿಟಲ್ ಗ್ರಾಮ AI', subtitle: 'ಕನ್ನಡ ಧ್ವನಿ ಸಹಾಯಕ, ಮಾರುಕಟ್ಟೆ ಧಾರಣೆ, AI ಬೆಳೆ ವೈದ್ಯ' }
      ]
    : [
        { icon: '🌾', title: 'Lush Agriculture & Green Heritage', subtitle: 'Farmers pride with water canals & fertile fields' },
        { icon: '🛕', title: 'Historic Village Temple', subtitle: 'Sacred blessings and community celebration' },
        { icon: '🤖', title: '1st Digital Village AI Super App', subtitle: 'Kannada Voice AI, Live Mandi Rates & Crop Doctor' }
      ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#040711',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <style>{`
        @keyframes kenBurnsZoom {
          0% {
            transform: scale(1.0) translate(0%, 0%);
          }
          50% {
            transform: scale(1.14) translate(-2%, -2%);
          }
          100% {
            transform: scale(1.0) translate(0%, 0%);
          }
        }

        @keyframes sunFlarePulse {
          0%, 100% {
            opacity: 0.55;
            transform: scale(1.0);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.2);
          }
        }

        @keyframes goldenRayRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes particleDrift {
          0% {
            transform: translateY(110vh) translateX(0) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          80% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(-10vh) translateX(40px) scale(1.3);
            opacity: 0;
          }
        }

        @keyframes titleShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.4), 0 0 50px rgba(16, 185, 129, 0.25);
          }
          50% {
            box-shadow: 0 0 40px rgba(245, 158, 11, 0.7), 0 0 80px rgba(16, 185, 129, 0.45);
          }
        }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      {/* 1. CINEMATIC KEN BURNS VILLAGE VIDEO BACKGROUND */}
      <div
        style={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage: 'url("/intro-village.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
          animation: 'kenBurnsZoom 16s ease-in-out infinite alternate',
          filter: 'brightness(0.92) contrast(1.08) saturate(1.15)',
          willChange: 'transform'
        }}
      />

      {/* 2. ATMOSPHERIC SUNRISE FLARE OVER THE TEMPLE & HILLS */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          right: '20%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(254, 240, 138, 0.75) 0%, rgba(245, 158, 11, 0.4) 35%, rgba(217, 119, 6, 0.15) 55%, transparent 75%)',
          filter: 'blur(30px)',
          animation: 'sunFlarePulse 4.5s ease-in-out infinite alternate',
          pointerEvents: 'none'
        }}
      />

      {/* 3. MULTI-LAYER CINEMATIC VIGNETTE (Keeps text ultra crisp) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(4, 7, 17, 0.82) 0%,
            rgba(4, 7, 17, 0.2) 28%,
            rgba(4, 7, 17, 0.35) 52%,
            rgba(4, 7, 17, 0.88) 80%,
            #040711 100%
          )`,
          pointerEvents: 'none'
        }}
      />

      {/* 4. FLOATING GOLDEN SUNBEAM PARTICLES */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(14)].map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 7.5 + 4) % 96}%`,
              width: `${(i % 3) * 2 + 4}px`,
              height: `${(i % 3) * 2 + 4}px`,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#FDE047' : '#34D399',
              boxShadow: '0 0 10px #F59E0B',
              animation: `particleDrift ${5 + (i % 5) * 1.8}s linear infinite`,
              animationDelay: `${(i * 0.65) % 6}s`
            }}
          />
        ))}
      </div>

      {/* 5. TOP BAR: Skip, Language & Sound Controls */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {/* Left: Village Live Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#FDE047'
          }}
        >
          <Sparkles size={14} color="#F59E0B" />
          <span>{isKannada ? 'ನಮ್ಮ ಗ್ರಾಮ • ನಮ್ಮ ಹೆಮ್ಮೆ' : 'Our Village • Our Pride'}</span>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sound Toggle */}
          <button
            onClick={() => {
              if (isMuted) {
                playMorningChime();
              } else {
                setIsMuted(true);
              }
            }}
            title={isMuted ? 'Play Chime' : 'Mute'}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              color: isMuted ? '#94A3B8' : '#FBBF24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLanguage(isKannada ? 'en' : 'kn')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isKannada ? 'English' : 'ಕನ್ನಡ'}
          </button>

          {/* Skip Button */}
          <button
            onClick={handleEnter}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              color: '#F8FAFC',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>{isKannada ? 'ತೆರವು' : 'Skip'}</span>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 6. CENTER & BOTTOM CONTENT (The Grand Tagline & Welcome Experience) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '680px',
          margin: '0 auto',
          padding: '0 24px 36px 24px',
          textAlign: 'center',
          width: '100%'
        }}
      >
        {/* LOGO WITH GLOWING SQUIRCLE */}
        <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '94px',
              height: '94px',
              borderRadius: '24px',
              padding: '4px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.8) 0%, rgba(16, 185, 129, 0.8) 100%)',
              animation: 'pulseGlow 3.5s ease-in-out infinite alternate',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.65)'
            }}
          >
            <img
              src="/logo.png?v=3"
              alt="MTG Village Logo"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '20px',
                objectFit: 'contain',
                background: '#070F1E',
                display: 'block'
              }}
            />
          </div>
        </div>

        {/* PROUD VILLAGE PILL */}
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              backdropFilter: 'blur(10px)',
              padding: '5px 16px',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#A7F3D0',
              letterSpacing: '0.04em'
            }}
          >
            <Sun size={14} color="#FBBF24" />
            MUTTAGUNDI • DIGITAL VILLAGE 2026
          </span>
        </div>

        {/* ⭐ THE USER'S EXACT REQUESTED TAGLINE (HERO BANNER) ⭐ */}
        <h1
          style={{
            fontSize: 'clamp(1.9rem, 5.5vw, 2.85rem)',
            fontWeight: 900,
            lineHeight: 1.22,
            letterSpacing: '-0.02em',
            margin: '0 auto 12px auto',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FEF08A 30%, #F59E0B 70%, #10B981 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.85)',
            filter: 'drop-shadow(0 2px 14px rgba(245, 158, 11, 0.35))'
          }}
        >
          {isKannada ? 'ನಮ್ಮ ಹೆಮ್ಮೆಯ ಮುತ್ತಾಗೊಂದಿ ಗೆ ಸ್ವಾಗತ' : 'Welcome to Our Proud Muttagundi'}
        </h1>

        <p
          style={{
            fontSize: 'clamp(0.92rem, 2.2vw, 1.08rem)',
            color: '#E2E8F0',
            fontWeight: 600,
            lineHeight: 1.5,
            margin: '0 auto 20px auto',
            maxWidth: '540px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
          }}
        >
          {isKannada
            ? 'ಕರ್ನಾಟಕ ಹಾಗೂ ಭಾರತದ ಪ್ರಥಮ ಡಿಜಿಟಲ್ ಗ್ರಾಮ AI ಸೂಪರ್ ಆ್ಯಪ್‌ಗೆ ಆತ್ಮೀಯ ಸ್ವಾಗತ'
            : "Welcome to Karnataka & India's 1st Digital Village AI Super App"}
        </p>

        {/* 7. DYNAMIC ROTATING HIGHLIGHT PILL */}
        <div
          style={{
            background: 'rgba(10, 16, 32, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '12px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            animation: 'floatCard 3s ease-in-out infinite alternate'
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>{features[activeFeature].icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
              {features[activeFeature].title}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
              {features[activeFeature].subtitle}
            </div>
          </div>
        </div>

        {/* 8. MAIN CTA "ENTER VILLAGE" BUTTON */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleEnter}
            className="btn-primary"
            style={{
              width: '100%',
              maxWidth: '340px',
              padding: '16px 28px',
              fontSize: '1.08rem',
              fontWeight: 800,
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #D97706 100%)',
              border: '2px solid rgba(254, 240, 138, 0.65)',
              color: '#FFFFFF',
              boxShadow: '0 12px 35px rgba(16, 185, 129, 0.45), 0 0 20px rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            <span>{isKannada ? 'ಗ್ರಾಮ ಪ್ರವೇಶಿಸಿ' : 'Enter Village Portal'}</span>
            <ArrowRight size={20} />
          </button>

          <span style={{ fontSize: '0.72rem', color: '#CBD5E1', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {isKannada ? 'ಹೊಸದುರ್ಗ ತಾಲೂಕು • ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ' : 'Hosadurga Taluk • Chitradurga District'}
          </span>
        </div>
      </div>
    </div>
  );
};
