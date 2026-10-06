import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Volume2, VolumeX, X } from 'lucide-react';
import { triggerHapticFeedback } from '../services/deviceIdentity';

interface SplashScreenProps {
  onEnter: () => void;
  autoPlayAudio?: boolean;
}

// -------------------------------------------------------------
// 🕉️ SACRED TEMPLE DARSHAN SLIDES (CLEAN, ZERO CLUTTER)
// -------------------------------------------------------------
const SACRED_SLIDES = [
  {
    id: 'hanuman',
    image: '/temple-blessing-1.jpg',
    title_kn: 'ಶ್ರೀ ವೀರ ಆಂಜನೇಯ ಸ್ವಾಮಿ',
    title_en: 'Sri Veera Anjaneya Swamy'
  },
  {
    id: 'kalleshwara',
    image: '/temple-blessing-2.png',
    title_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ',
    title_en: 'Sri Kalleshwara Swamy'
  }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const { isKannada } = useLanguage();
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

      stopDroneOscillators();

      // Master Gain for smooth fades
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Meditative Tanpura / Om harmonics (C#3 138.6Hz)
      const baseFreq = 138.59;
      const harmonics = [
        { freq: baseFreq, gain: 0.11, type: 'sine' as OscillatorType },
        { freq: baseFreq * 1.5, gain: 0.08, type: 'sine' as OscillatorType },
        { freq: baseFreq * 2, gain: 0.05, type: 'triangle' as OscillatorType },
        { freq: baseFreq * 2.5, gain: 0.03, type: 'sine' as OscillatorType }
      ];

      harmonics.forEach(({ freq, gain, type }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

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

      // Initial welcoming temple bell chime
      ringTempleBell([880, 1320, 1760, 2640]);

      // Periodic serene temple bells every 4.8 seconds
      let step = 0;
      const bellHarmonics = [
        [659.25, 987.77, 1318.51],
        [783.99, 1174.66, 1567.98],
        [880.00, 1320.00, 1760.00],
        [1046.50, 1567.98, 2093.00]
      ];

      if (bellIntervalRef.current) clearInterval(bellIntervalRef.current);
      bellIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || !masterGainRef.current) return;
        step = (step + 1) % bellHarmonics.length;
        ringTempleBell(bellHarmonics[step]);
      }, 4800);

      setIsPlayingAudio(true);
    } catch {
      // Audio autoplay policy handled via gesture fallback
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

  // Auto transition after 14 seconds
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
        /* Smooth Ken Burns animation for Photo 1 */
        @keyframes kenBurnsDarshanA {
          0% {
            transform: scale(1.0) translate(0%, 0%);
          }
          100% {
            transform: scale(1.08) translate(-1%, -1%);
          }
        }

        /* Smooth Ken Burns animation for Photo 2 */
        @keyframes kenBurnsDarshanB {
          0% {
            transform: scale(1.0) translate(0%, 0%);
          }
          100% {
            transform: scale(1.08) translate(1%, -1%);
          }
        }

        /* Falling Sacred Flower Petals */
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
            transform: translateY(105vh) translateX(40px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* 1. FULLSCREEN SACRED PHOTOS (NO COLLISION, SMOOTH 1.2S FADE)   */}
      {/* ------------------------------------------------------------- */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {SACRED_SLIDES.map((slide, idx) => {
          const isActive = currentSlide === idx;
          return (
            <div
              key={slide.id}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${slide.image}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isActive
                  ? idx === 0
                    ? 'kenBurnsDarshanA 6s ease-in-out infinite alternate'
                    : 'kenBurnsDarshanB 6s ease-in-out infinite alternate'
                  : 'none',
                filter: 'brightness(0.98) contrast(1.05)',
                willChange: 'transform, opacity',
                zIndex: isActive ? 2 : 1
              }}
            />
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ULTRA-SUBTLE VIGNETTES ONLY AT EDGES (CENTER IS 100% CLEAR)*/}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(4, 7, 17, 0.6) 0%,
            transparent 18%,
            transparent 75%,
            rgba(4, 7, 17, 0.85) 100%
          )`,
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* 3. ANIMATED PUSHPARCHANE (FALLING SACRED FLOWER PETALS)        */}
      {/* ------------------------------------------------------------- */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 4 }}>
        {[...Array(18)].map((_, i) => {
          const petalColors = ['#F59E0B', '#F43F5E', '#FFFFFF', '#FBBF24', '#FB7185'];
          const color = petalColors[i % petalColors.length];
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${(i * 5.5 + 2) % 96}%`,
                width: `${(i % 3) * 3 + 7}px`,
                height: `${(i % 3) * 4 + 10}px`,
                borderRadius: '50% 0 50% 50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animation: `flowerPetalFall ${4.5 + (i % 5) * 1.5}s linear infinite`,
                animationDelay: `${(i * 0.45) % 5}s`,
                opacity: 0.8
              }}
            />
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MINIMAL TOP BAR: SOUND BGM & SKIP ONLY                     */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* Subtle Slide Switcher Dots */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(12px)',
            padding: '6px 14px',
            borderRadius: '9999px'
          }}
        >
          {SACRED_SLIDES.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setCurrentSlide(dotIdx)}
              style={{
                width: currentSlide === dotIdx ? '24px' : '7px',
                height: '7px',
                borderRadius: '9999px',
                background: currentSlide === dotIdx ? '#F59E0B' : 'rgba(255, 255, 255, 0.4)',
                boxShadow: currentSlide === dotIdx ? '0 0 8px #F59E0B' : 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              title={`Photo ${dotIdx + 1}`}
            />
          ))}
          <span style={{ fontSize: '0.74rem', color: '#FEF08A', fontWeight: 700, marginLeft: '4px' }}>
            {isKannada ? activeSlide.title_kn : activeSlide.title_en}
          </span>
        </div>

        {/* Right: Sound & Skip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              height: '36px',
              padding: '0 12px',
              borderRadius: '9999px',
              background: isPlayingAudio ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.5)',
              border: isPlayingAudio ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              color: isPlayingAudio ? '#FDE047' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 800,
              boxShadow: isPlayingAudio ? '0 0 14px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isPlayingAudio ? <Volume2 size={15} color="#FBBF24" /> : <VolumeX size={15} />}
            <span>{isPlayingAudio ? (isKannada ? 'ದಿವ್ಯ ಸಂಗೀತ 🎶' : 'Divine BGM 🎶') : (isKannada ? 'ಮ್ಯೂಟ್' : 'Muted')}</span>
          </button>

          {/* Skip Button */}
          <button
            onClick={handleEnter}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              color: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={isKannada ? 'ತೆರವು' : 'Skip'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. MINIMAL BOTTOM: PURE ENTER VILLAGE BUTTON (NO TAGLINES)     */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '0 20px 28px 20px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto'
        }}
      >
        <button
          onClick={handleEnter}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px 28px',
            fontSize: '1.02rem',
            fontWeight: 800,
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #D97706 100%)',
            border: '1.5px solid rgba(254, 240, 138, 0.7)',
            color: '#FFFFFF',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.25s ease'
          }}
        >
          <span>{isKannada ? 'ಗ್ರಾಮ ಪ್ರವೇಶಿಸಿ' : 'Enter Village Portal'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
