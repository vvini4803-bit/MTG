import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Sparkles, Volume2, VolumeX, X, Sun, Heart } from 'lucide-react';
import { triggerHapticFeedback } from '../services/deviceIdentity';

interface SplashScreenProps {
  onEnter: () => void;
  autoPlayAudio?: boolean;
}

// -------------------------------------------------------------
// 🕉️ SACRED TEMPLE DARSHAN SLIDES (NO COLLISION, SMOOTH FADE)
// -------------------------------------------------------------
const SACRED_SLIDES = [
  {
    id: 'hanuman',
    image: '/temple-blessing-1.jpg',
    title_kn: '🙏 ಶ್ರೀ ವೀರ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದಿವ್ಯ ದರ್ಶನ',
    title_en: '🙏 Sri Veera Anjaneya Swamy Divine Darshan',
    subtitle_kn: 'ಪವಿತ್ರ ಪುಷ್ಪಾಲಂಕಾರ • ರಕ್ಷೆ, ಧೈರ್ಯ & ಭಕ್ತಿಯ ಅನುಗ್ರಹ',
    subtitle_en: 'Sacred Floral Alankara • Blessings of Strength & Protection',
    badge_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ದೇವತಾ ಕೃಪೆ',
    badge_en: 'Muttagundi Village Sacred Blessing'
  },
  {
    id: 'kalleshwara',
    image: '/temple-blessing-2.png',
    title_kn: '🙏 ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ಉತ್ಸವ ಮೂರ್ತಿ',
    title_en: '🙏 Sri Kalleshwara Swamy Utsava Murthy',
    subtitle_kn: 'ಸ್ವರ್ಣ ಕಿರೀಟ & ದಿವ್ಯ ಛತ್ರಾಲಂಕಾರ • ಶಾಂತಿ, ಆರೋಗ್ಯ & ಸಮೃದ್ಧಿ',
    subtitle_en: 'Golden Crown & Divine Alankara • Peace, Health & Prosperity',
    badge_kn: 'ಐತಿಹಾಸಿಕ ಶ್ರೀ ಕ್ಷೇತ್ರ ಮುತ್ತಾಗೊಂದಿ',
    badge_en: 'Historic Muttagundi Sanctum'
  }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const { isKannada, setLanguage } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Web Audio Context & Synthesizer references for automated divine BGM
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const bellIntervalRef = useRef<any>(null);
  const droneOscillatorsRef = useRef<OscillatorNode[]>([]);

  // -------------------------------------------------------------
  // 🎵 AUTOMATED DIVINE AMBIENT BGM (TEMPLE BELLS & TANPURA DRONE)
  // -------------------------------------------------------------
  const startDivineBgm = () => {
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

      // Stop previous sounds if already running
      stopDroneOscillators();

      // Master Gain for smooth fades
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // 1. Divine Meditative Om / Tanpura Harmonics (C#3 fundamental 138.6Hz)
      const baseFreq = 138.59;
      const harmonics = [
        { freq: baseFreq, gain: 0.11, type: 'sine' as OscillatorType },
        { freq: baseFreq * 1.5, gain: 0.08, type: 'sine' as OscillatorType }, // Panchama (G#)
        { freq: baseFreq * 2, gain: 0.05, type: 'triangle' as OscillatorType }, // Octave
        { freq: baseFreq * 2.5, gain: 0.03, type: 'sine' as OscillatorType }  // Gandhara
      ];

      harmonics.forEach(({ freq, gain, type }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Soft subtle tremolo / chorusing for warmth
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.75, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        g.gain.setValueAtTime(gain, ctx.currentTime);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        droneOscillatorsRef.current.push(osc);
      });

      // 2. Initial welcoming resonant bronze temple bell strike
      ringTempleBell([880, 1320, 1760, 2640]);

      // 3. Periodic serene temple bells every 4.8 seconds
      let step = 0;
      const bellHarmonics = [
        [659.25, 987.77, 1318.51], // E5, B5, E6
        [783.99, 1174.66, 1567.98], // G5, D6, G6
        [880.00, 1320.00, 1760.00], // A5, E6, A6
        [1046.50, 1567.98, 2093.00]  // C6, G6, C7
      ];

      if (bellIntervalRef.current) clearInterval(bellIntervalRef.current);
      bellIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || !masterGainRef.current) return;
        step = (step + 1) % bellHarmonics.length;
        ringTempleBell(bellHarmonics[step]);
      }, 4800);

      setIsPlayingAudio(true);
    } catch {
      // Audio autoplay policy handled gracefully via user gesture hook
    }
  };

  const ringTempleBell = (freqs: number[]) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Metallic bronze strike envelope & long peaceful decay
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 3.2);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 3.5);
    });
  };

  const stopDroneOscillators = () => {
    droneOscillatorsRef.current.forEach((osc) => {
      try { osc.stop(); } catch {}
    });
    droneOscillatorsRef.current = [];
  };

  const stopDivineBgm = () => {
    if (bellIntervalRef.current) {
      clearInterval(bellIntervalRef.current);
      bellIntervalRef.current = null;
    }
    if (masterGainRef.current && audioCtxRef.current) {
      try {
        masterGainRef.current.gain.linearRampToValueAtTime(
          0.0001,
          audioCtxRef.current.currentTime + 0.35
        );
      } catch {}
    }
    setTimeout(() => {
      stopDroneOscillators();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch {}
      }
      audioCtxRef.current = null;
      masterGainRef.current = null;
    }, 400);
    setIsPlayingAudio(false);
  };

  // -------------------------------------------------------------
  // AUTOPLAY ON MOUNT + SEAMLESS USER GESTURE UNBLOCKING
  // -------------------------------------------------------------
  useEffect(() => {
    startDivineBgm();

    // Browser Autoplay safety: if initial AudioContext was suspended by browser policy,
    // resume it on the very first touch/click anywhere on the screen!
    const handleFirstGesture = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
        setIsPlayingAudio(true);
      } else if (!audioCtxRef.current) {
        startDivineBgm();
      }
    };

    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });

    return () => {
      stopDivineBgm();
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
  }, []);

  // -------------------------------------------------------------
  // SLIDE ROTATION (ONE AFTER ONE, ZERO COLLISION CROSSFADE)
  // -------------------------------------------------------------
  useEffect(() => {
    // 5 seconds per deity photo for serene, immersive darshan
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SACRED_SLIDES.length);
    }, 5000);

    return () => clearInterval(slideTimer);
  }, []);

  // Exit & Enter Village
  const handleEnter = () => {
    triggerHapticFeedback();
    setIsExiting(true);
    stopDivineBgm();
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  // Auto transition after 14 seconds so users enjoy both deity blessings
  useEffect(() => {
    const timer = setTimeout(() => {
      handleEnter();
    }, 14000);
    return () => clearTimeout(timer);
  }, []);

  const activeSlide = SACRED_SLIDES[currentSlide];

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
        /* Smooth Ken Burns animation for Photo 1 (Sri Anjaneya Swamy) */
        @keyframes kenBurnsDarshanA {
          0% {
            transform: scale(1.0) translate(0%, 0%);
          }
          100% {
            transform: scale(1.12) translate(-1.5%, -2%);
          }
        }

        /* Smooth Ken Burns animation for Photo 2 (Sri Kalleshwara Swamy) */
        @keyframes kenBurnsDarshanB {
          0% {
            transform: scale(1.0) translate(0%, 0%);
          }
          100% {
            transform: scale(1.13) translate(1.5%, -1.5%);
          }
        }

        /* Divine Halo / Aureole pulsating aura behind idols */
        @keyframes divineAuraGlow {
          0%, 100% {
            opacity: 0.55;
            transform: scale(1.0);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.22);
          }
        }

        /* Falling Sacred Flower Petals (Pushparchane) */
        @keyframes flowerPetalFall {
          0% {
            transform: translateY(-80px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.9;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(105vh) translateX(45px) rotate(360deg);
            opacity: 0;
          }
        }

        /* Golden Ray Shimmer */
        @keyframes goldenBlessingShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulseBlessingGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.45), 0 0 50px rgba(16, 185, 129, 0.25);
          }
          50% {
            box-shadow: 0 0 45px rgba(245, 158, 11, 0.8), 0 0 85px rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes floatingCardAnim {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* 1. SEAMLESS BACKGROUND SLIDES (NO COLLISION, CROSSFADE ONLY)   */}
      {/* ------------------------------------------------------------- */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {SACRED_SLIDES.map((slide, idx) => {
          const isActive = currentSlide === idx;
          return (
            <div
              key={slide.id}
              style={{
                position: 'absolute',
                inset: '-20px',
                backgroundImage: `url("${slide.image}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 38%',
                opacity: isActive ? 1 : 0,
                // Zero collision: Smooth 1.2s opacity crossfade transition
                transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isActive
                  ? idx === 0
                    ? 'kenBurnsDarshanA 6s ease-in-out infinite alternate'
                    : 'kenBurnsDarshanB 6s ease-in-out infinite alternate'
                  : 'none',
                filter: 'brightness(0.95) contrast(1.1) saturate(1.15)',
                willChange: 'transform, opacity',
                zIndex: isActive ? 2 : 1
              }}
            />
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. DIVINE RADIANT HALO OVER THE SANCTUM SANCTORUM              */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(254, 240, 138, 0.65) 0%, rgba(245, 158, 11, 0.35) 40%, rgba(217, 119, 6, 0.12) 65%, transparent 75%)',
          filter: 'blur(35px)',
          animation: 'divineAuraGlow 4s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* 3. MULTI-LAYER CINEMATIC VIGNETTE (KEEPS SACRED TEXT CRISP)   */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(4, 7, 17, 0.78) 0%,
            rgba(4, 7, 17, 0.15) 25%,
            rgba(4, 7, 17, 0.25) 55%,
            rgba(4, 7, 17, 0.85) 78%,
            #040711 100%
          )`,
          pointerEvents: 'none',
          zIndex: 4
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* 4. ANIMATED PUSHPARCHANE (FALLING SACRED FLOWER PETALS)        */}
      {/* ------------------------------------------------------------- */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
        {[...Array(20)].map((_, i) => {
          // Petal colors: Marigold yellow, Rose red, Jasmine white, Golden
          const petalColors = ['#F59E0B', '#F43F5E', '#FFFFFF', '#FBBF24', '#FB7185'];
          const color = petalColors[i % petalColors.length];
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${(i * 5.2 + 2) % 96}%`,
                width: `${(i % 3) * 3 + 8}px`,
                height: `${(i % 3) * 4 + 11}px`,
                borderRadius: '50% 0 50% 50%',
                background: color,
                boxShadow: `0 0 10px ${color}`,
                animation: `flowerPetalFall ${4.5 + (i % 6) * 1.5}s linear infinite`,
                animationDelay: `${(i * 0.45) % 5.5}s`,
                opacity: 0.85
              }}
            />
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. TOP CONTROLS: SOUND BGM, LANGUAGE, SKIP                     */}
      {/* ------------------------------------------------------------- */}
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
        {/* Left: Divine Village Sanctum Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.55)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            backdropFilter: 'blur(14px)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#FDE047',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
          }}
        >
          <Sparkles size={14} color="#F59E0B" />
          <span>{isKannada ? activeSlide.badge_kn : activeSlide.badge_en}</span>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Automated Divine BGM Toggle */}
          <button
            onClick={() => {
              if (isPlayingAudio) {
                stopDivineBgm();
              } else {
                startDivineBgm();
              }
            }}
            title={isPlayingAudio ? 'Mute Divine BGM' : 'Play Divine BGM'}
            style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: '9999px',
              background: isPlayingAudio ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.5)',
              border: isPlayingAudio ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              color: isPlayingAudio ? '#FDE047' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 800,
              boxShadow: isPlayingAudio ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isPlayingAudio ? <Volume2 size={16} color="#FBBF24" /> : <VolumeX size={16} />}
            <span>{isPlayingAudio ? (isKannada ? 'ದಿವ್ಯ ಸಂಗೀತ 🎶' : 'Divine BGM 🎶') : (isKannada ? 'ಮ್ಯೂಟ್' : 'Muted')}</span>
          </button>

          {/* Language Switcher */}
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

      {/* ------------------------------------------------------------- */}
      {/* 6. CENTER & BOTTOM: DIVINE BLESSINGS & VILLAGE WELCOME         */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '680px',
          margin: '0 auto',
          padding: '0 24px 34px 24px',
          textAlign: 'center',
          width: '100%'
        }}
      >
        {/* LOGO WITH GLOWING GOLDEN AURA */}
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              padding: '4px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(16, 185, 129, 0.8) 100%)',
              animation: 'pulseBlessingGlow 3.5s ease-in-out infinite alternate',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7)'
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

        {/* ACTIVE DEITY SACRED BLESSING PILL (ANIMATED ONE AFTER ONE) */}
        <div
          style={{
            marginBottom: '16px',
            background: 'rgba(10, 16, 32, 0.85)',
            border: '1.5px solid rgba(245, 158, 11, 0.55)',
            backdropFilter: 'blur(18px)',
            borderRadius: '22px',
            padding: '12px 20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.35)',
            animation: 'floatingCardAnim 3s ease-in-out infinite alternate',
            transition: 'all 0.5s ease'
          }}
        >
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 900,
              color: '#FEF08A',
              letterSpacing: '0.01em',
              marginBottom: '3px',
              textShadow: '0 0 12px rgba(245, 158, 11, 0.6)'
            }}
          >
            {isKannada ? activeSlide.title_kn : activeSlide.title_en}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#E2E8F0',
              fontWeight: 600,
              lineHeight: 1.4
            }}
          >
            {isKannada ? activeSlide.subtitle_kn : activeSlide.subtitle_en}
          </div>

          {/* TWO SLIDE INDICATOR PILLS (NO COLLISION DOTS) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
            {SACRED_SLIDES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrentSlide(dotIdx)}
                style={{
                  width: currentSlide === dotIdx ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: currentSlide === dotIdx ? '#F59E0B' : 'rgba(255, 255, 255, 0.25)',
                  boxShadow: currentSlide === dotIdx ? '0 0 10px #F59E0B' : 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.35s ease'
                }}
                title={`View Photo ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ⭐ THE USER'S EXACT TAGLINE BANNER ⭐ */}
        <h1
          style={{
            fontSize: 'clamp(1.85rem, 5.2vw, 2.75rem)',
            fontWeight: 900,
            lineHeight: 1.22,
            letterSpacing: '-0.02em',
            margin: '0 auto 10px auto',
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
            fontSize: 'clamp(0.9rem, 2.2vw, 1.05rem)',
            color: '#E2E8F0',
            fontWeight: 600,
            lineHeight: 1.45,
            margin: '0 auto 20px auto',
            maxWidth: '540px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
          }}
        >
          {isKannada
            ? 'ಕರ್ನಾಟಕ ಹಾಗೂ ಭಾರತದ ಪ್ರಥಮ ಡಿಜಿಟಲ್ ಗ್ರಾಮ AI ಸೂಪರ್ ಆ್ಯಪ್‌ಗೆ ಆತ್ಮೀಯ ಸ್ವಾಗತ'
            : "Welcome to Karnataka & India's 1st Digital Village AI Super App"}
        </p>

        {/* MAIN CTA "ENTER VILLAGE" BUTTON */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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
              border: '2px solid rgba(254, 240, 138, 0.7)',
              color: '#FFFFFF',
              boxShadow: '0 12px 35px rgba(16, 185, 129, 0.45), 0 0 25px rgba(245, 158, 11, 0.45)',
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
