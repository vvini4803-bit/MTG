import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  Wheat,
  Trophy,
  ArrowRight,
  Globe,
  CheckCircle2
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { language, setLanguage, isKannada } = useLanguage();
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: ShieldCheck,
      color: '#10B981',
      title_en: 'Verified Community News & Alerts',
      title_kn: 'ದೃಢೀಕೃತ ಗ್ರಾಮ ಸುದ್ದಿ & ತುರ್ತು ಎಚ್ಚರಿಕೆ',
      desc_en:
        'Zero rumors. Every vital community report on roads, water, and power is reviewed and tagged with clear verification badges.',
      desc_kn:
        'ಯಾವುದೇ ಊಹಾಪೋಹಗಳಿಲ್ಲ. ರಸ್ತೆ, ನೀರು ಮತ್ತು ವಿದ್ಯುತ್ ಕುರಿತ ಪ್ರತಿಯೊಂದು ವರದಿಯೂ ಸ್ಪಷ್ಟ ದೃಢೀಕರಣ ಮುದ್ರೆಯೊಂದಿಗೆ ಪ್ರಕಟವಾಗುತ್ತದೆ.'
    },
    {
      icon: Wheat,
      color: '#F59E0B',
      title_en: 'Agriculture, Temples & Living Heritage',
      title_kn: 'ಕೃಷಿ ಜ್ಞಾನ, ದೇವಸ್ಥಾನಗಳು & ಜೀವಂತ ಪರಂಪರೆ',
      desc_en:
        'Access scientific crop advisories, daily pooja timings of ancient Hoysala temples, and our village’s authentic oral history.',
      desc_kn:
        'ವೈಜ್ಞಾನಿಕ ಕೃಷಿ ಮಾರ್ಗದರ್ಶನ, ಹೊಯ್ಸಳ ದೇಗುಲಗಳ ಪೂಜಾ ಸಮಯ ಹಾಗೂ ಗ್ರಾಮದ ಅಧಿಕೃತ ಇತಿಹಾಸದ ದಾಖಲೆಗಳು ಒಂದೆಡೆ ಲಭ್ಯ.'
    },
    {
      icon: Trophy,
      color: '#0284C7',
      title_en: 'Live Sports Scores & Voice Assistant',
      title_kn: 'ಲೈವ್ ಕ್ರೀಡಾ ಸ್ಕೋರ್ & ಧ್ವನಿ ಸಹಾಯಕ',
      desc_en:
        'Track cricket and kabaddi matches ball-by-ball. Ask questions in natural Kannada or English anytime.',
      desc_kn:
        'ಸ್ಥಳೀಯ ಕ್ರಿಕೆಟ್ ಮತ್ತು ಕಬಡ್ಡಿ ಪಂದ್ಯಗಳ ನೇರ ಸ್ಕೋರ್ ಪಡೆಯಿರಿ. ಯಾವುದೇ ಪ್ರಶ್ನೆಗೆ ಕನ್ನಡದಲ್ಲೇ ಧ್ವನಿ ಮೂಲಕ ಉತ್ತರ ಪಡೆಯಿರಿ.'
    }
  ];

  const currentSlide = slides[step];
  const Icon = currentSlide.icon;

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        maxWidth: '540px',
        margin: '0 auto'
      }}
    >
      {/* Top Bar: Language Picker & Skip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--glass-border)',
            padding: '6px 14px',
            borderRadius: '9999px',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Globe size={14} color="#10B981" />
          <span>{language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}</span>
        </button>

        <button
          onClick={onComplete}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isKannada ? 'ಸ್ಕಿಪ್ ಮಾಡಿ' : 'Skip'}
        </button>
      </div>

      {/* Main Slide Card */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '28px',
            background: `linear-gradient(135deg, ${currentSlide.color}30 0%, ${currentSlide.color}10 100%)`,
            border: `2px solid ${currentSlide.color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            boxShadow: `0 12px 30px ${currentSlide.color}25`
          }}
        >
          <Icon size={48} color={currentSlide.color} />
        </div>

        <h2
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            marginBottom: '16px',
            lineHeight: 1.3
          }}
        >
          {isKannada ? currentSlide.title_kn : currentSlide.title_en}
        </h2>

        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '420px',
            margin: '0 auto'
          }}
        >
          {isKannada ? currentSlide.desc_kn : currentSlide.desc_en}
        </p>
      </div>

      {/* Bottom Controls: Dots & Next */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {slides.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: step === idx ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: step === idx ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="btn-primary"
          style={{
            width: '100%',
            height: '52px',
            fontSize: '1rem',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          {step === slides.length - 1 ? (
            <>
              <CheckCircle2 size={18} />
              <span>{isKannada ? 'ಪ್ರಾರಂಭಿಸಿ' : 'Get Started'}</span>
            </>
          ) : (
            <>
              <span>{isKannada ? 'ಮುಂದೆ' : 'Continue'}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
