import React, { useState } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Cpu,
  Cloud,
  MapPin,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface GoogleEcosystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKannada: boolean;
}

export const GoogleEcosystemModal: React.FC<GoogleEcosystemModalProps> = ({
  isOpen,
  onClose,
  isKannada
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleGoogleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' Muttagundi')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleQuickSearch = (term: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const quickSearchChips = isKannada
    ? [
        { label: 'ಮುತ್ತಾಗೊಂದಿ ಹವಾಮಾನ', query: 'Muttagundi weather today' },
        { label: 'ಕಲ್ಲೇಶ್ವರ ದೇವಸ್ಥಾನ', query: 'Kalleshwara Temple Muttagundi Hosadurga' },
        { label: 'ಅಡಿಕೆ ಮಾರುಕಟ್ಟೆ ದರ', query: 'Arecanut price today Chitradurga APMC' },
        { label: 'ಹೊಸದುರ್ಗ ಸುದ್ದಿ', query: 'Hosadurga Chitradurga latest news' },
        { label: 'ರಾಗಿ ಕೃಷಿ ಮಾಹಿತಿ', query: 'Ragi cultivation techniques Karnataka' }
      ]
    : [
        { label: 'Muttagundi Weather', query: 'Muttagundi weather today' },
        { label: 'Kalleshwara Temple', query: 'Kalleshwara Temple Muttagundi Hosadurga' },
        { label: 'Arecanut Mandi Price', query: 'Arecanut price today Chitradurga APMC' },
        { label: 'Hosadurga News', query: 'Hosadurga Chitradurga latest news' },
        { label: 'Ragi Crop Guide', query: 'Ragi crop cultivation guide Karnataka' }
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(3, 10, 8, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0A192F 0%, #06121E 100%)',
          border: '1.5px solid rgba(66, 133, 244, 0.4)',
          borderRadius: '24px',
          padding: '24px',
          color: '#FFFFFF',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(66, 133, 244, 0.25)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google 4-Color Accent Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            background: 'linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC05 50%, #FBBC05 75%, #34A853 75%, #34A853 100%)'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#CBD5E1',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', marginTop: '6px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(66, 133, 244, 0.15)',
              border: '1px solid rgba(66, 133, 244, 0.4)',
              color: '#93C5FD',
              fontWeight: 800,
              fontSize: '0.74rem',
              padding: '4px 12px',
              borderRadius: '999px',
              letterSpacing: '0.04em'
            }}
          >
            <div style={{ display: 'flex', gap: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4285F4' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EA4335' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FBBC05' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34A853' }} />
            </div>
            <span>GOOGLE ECOSYSTEM ARCHITECTURE</span>
          </div>

          <span
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px'
            }}
          >
            VERIFIED
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 'clamp(1.25rem, 3.5vw, 1.55rem)',
            fontWeight: 800,
            lineHeight: 1.3,
            margin: '0 0 6px 0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #93C5FD 50%, #60A5FA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {isKannada
            ? 'ಗೂಗಲ್ ತಂತ್ರಜ್ಞಾನ ಪರಿಸರ & ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ'
            : 'Google Ecosystem & AI Architecture'}
        </h2>

        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0 0 18px 0', lineHeight: 1.45 }}>
          {isKannada
            ? 'MTG ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಪೋರ್ಟಲ್ ಸಂಪೂರ್ಣವಾಗಿ ಗೂಗಲ್‌ನ ವಿಶ್ವದರ್ಜೆಯ ಕ್ಲೌಡ್ ಮತ್ತು ಜೆಮಿನಿ AI ತಂತ್ರಜ್ಞಾನದಿಂದ ನಿರ್ಮಿಸಲ್ಪಟ್ಟಿದೆ.'
            : 'MTG Digital Village Portal is natively architected and integrated with Google Cloud Platform and Gemini AI.'}
        </p>

        {/* Live Search on Google Widget */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Search size={16} color="#4285F4" />
            <strong style={{ fontSize: '0.82rem', color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isKannada ? 'ಗೂಗಲ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಹುಡುಕಿ' : 'Search Live on Google'}
            </strong>
          </div>

          <form onSubmit={handleGoogleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isKannada ? 'ಗ್ರಾಮದ ಮಾಹಿತಿ, ಕೃಷಿ, ಇತಿಹಾಸ ಗೂಗಲ್‌ನಲ್ಲಿ ಹುಡುಕಿ...' : 'Search village topics on Google...'}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(66, 133, 244, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#FFF',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #4285F4 0%, #1D4ED8 100%)',
                color: '#FFF',
                border: 'none',
                borderRadius: '10px',
                padding: '0 16px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{isKannada ? 'ಹುಡುಕಿ' : 'Search'}</span>
              <ExternalLink size={14} />
            </button>
          </form>

          {/* Quick Search Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {quickSearchChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSearch(chip.query)}
                style={{
                  background: 'rgba(66, 133, 244, 0.12)',
                  border: '1px solid rgba(66, 133, 244, 0.25)',
                  color: '#93C5FD',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s'
                }}
              >
                <span>{chip.label}</span>
                <ExternalLink size={10} />
              </button>
            ))}
          </div>
        </div>

        {/* 5 Google Pillars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {/* Pillar 1: Google Gemini AI */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: 'rgba(66, 133, 244, 0.08)',
              border: '1px solid rgba(66, 133, 244, 0.25)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#4285F4', color: '#FFF', borderRadius: '10px', padding: '7px', display: 'flex', height: 'fit-content' }}>
              <Cpu size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>
                  {isKannada ? '1. ಗೂಗಲ್ ಜೆಮಿನಿ AI (Google Gemini AI)' : '1. Google Gemini AI Engine'}
                </strong>
                <a
                  href="https://deepmind.google/technologies/gemini/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60A5FA', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  <span>Google DeepMind</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p style={{ fontSize: '0.79rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಹಚ್ಚಲು Gemini 2.5 Flash ವಿಷನ್ ಮಾಡೆಲ್ ಹಾಗೂ ಗ್ರಾಮದ ಧ್ವನಿ ಸಂಭಾಷಣೆಗೆ ಕನ್ನಡ AI ಅಸಿಸ್ಟೆಂಟ್.'
                  : 'Powering automated crop disease diagnosis via Gemini Multimodal Vision and bilingual Kannada/English conversational AI.'}
              </p>
            </div>
          </div>

          {/* Pillar 2: Google Cloud Platform & Firebase */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: 'rgba(234, 67, 53, 0.08)',
              border: '1px solid rgba(234, 67, 53, 0.25)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#EA4335', color: '#FFF', borderRadius: '10px', padding: '7px', display: 'flex', height: 'fit-content' }}>
              <Cloud size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>
                  {isKannada ? '2. ಗೂಗಲ್ ಕ್ಲೌಡ್ & ಫೈರ್‌ಬೇಸ್ (Google Cloud GCP)' : '2. Google Cloud Platform & Firebase'}
                </strong>
                <a
                  href="https://cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#F87171', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  <span>Google Cloud</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p style={{ fontSize: '0.79rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಗ್ರಾಮದ ಎಲ್ಲಾ ದತ್ತಾಂಶಗಳು ಗೂಗಲ್ ಕ್ಲೌಡ್ ಫೈರ್‌ಸ್ಟೋರ್ (Firestore) ಮತ್ತು ಜಾಗತಿಕ CDN ಹೋಸ್ಟಿಂಗ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿವೆ.'
                  : 'All village records, news, and notifications operate on Google Cloud Firestore with 99.99% uptime and enterprise security.'}
              </p>
            </div>
          </div>

          {/* Pillar 3: Google Search Console */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: 'rgba(251, 188, 5, 0.08)',
              border: '1px solid rgba(251, 188, 5, 0.25)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#FBBC05', color: '#000', borderRadius: '10px', padding: '7px', display: 'flex', height: 'fit-content' }}>
              <Search size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>
                  {isKannada ? '3. ಗೂಗಲ್ ಸರ್ಚ್ ಕನ್ಸೋಲ್ (Google Search Verified)' : '3. Google Search Console Verified'}
                </strong>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#FDE047', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  <span>Google Search</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p style={{ fontSize: '0.79rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಗೂಗಲ್ ಸರ್ಚ್ ಕನ್ಸೋಲ್‌ನಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದ್ದು, ಗೂಗಲ್‌ನ AI Overview ಮತ್ತು ಸರ್ಚ್ ರಿಸಲ್ಟ್‌ಗಳಲ್ಲಿ ಇಂಡೆಕ್ಸ್ ಆಗಿದೆ.'
                  : 'Officially verified and indexed in Google Search Console, appearing in Google Search results and AI Overviews.'}
              </p>
            </div>
          </div>

          {/* Pillar 4: Google Maps */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: 'rgba(52, 168, 83, 0.08)',
              border: '1px solid rgba(52, 168, 83, 0.25)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#34A853', color: '#FFF', borderRadius: '10px', padding: '7px', display: 'flex', height: 'fit-content' }}>
              <MapPin size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>
                  {isKannada ? '4. ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ (Google Maps Navigation)' : '4. Google Maps & Geolocation'}
                </strong>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Muttagundi,+Hosadurga,+Karnataka"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#86EFAC', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  <span>Open Maps</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p style={{ fontSize: '0.79rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಕಲ್ಲೇಶ್ವರ ದೇವಸ್ಥಾನ, ಶಾಲೆ ಹಾಗೂ ಎಲ್ಲಾ ಪ್ರಮುಖ ಸ್ಥಳಗಳಿಗೆ ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ನೇರ ಜಿಪಿಎಸ್ ಮಾರ್ಗದರ್ಶನ.'
                  : 'Instant one-tap Google Maps turn-by-turn navigation to Muttagundi landmarks, temples, and schools.'}
              </p>
            </div>
          </div>

          {/* Pillar 5: Google Chromium PWA */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#A855F7', color: '#FFF', borderRadius: '10px', padding: '7px', display: 'flex', height: 'fit-content' }}>
              <Smartphone size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>
                  {isKannada ? '5. ಗೂಗಲ್ ಕ್ರೋಮ್ PWA (Progressive Web App)' : '5. Google Chromium PWA Architecture'}
                </strong>
                <span style={{ color: '#D8B4FE', fontSize: '0.72rem', fontWeight: 700 }}>
                  Android & Chrome
                </span>
              </div>
              <p style={{ fontSize: '0.79rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಗೂಗಲ್‌ನ ಅಧಿಕೃತ PWA ಮಾನದಂಡದಂತೆ ಆಫ್‌ಲೈನ್ ಬೆಂಬಲ ಹಾಗೂ ಮೊಬೈಲ್‌ನಲ್ಲಿ ಆ್ಯಪ್ ತರಹ ಇನ್‌ಸ್ಟಾಲ್ ಆಗುವ ವ್ಯವಸ್ಥೆ.'
                  : 'Built to Google progressive web app standards for offline caching and fast mobile installation on Android and Chrome.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.open('https://www.google.com/search?q=Muttagundi+MTG+Digital+Village+App', '_blank', 'noopener,noreferrer')}
            style={{
              flex: '1 1 200px',
              background: 'linear-gradient(135deg, #4285F4 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(66, 133, 244, 0.4)'
            }}
          >
            <Search size={16} />
            <span>{isKannada ? 'ಗೂಗಲ್‌ನಲ್ಲಿ ಮುತ್ತಾಗೊಂದಿ ಹುಡುಕಿ' : 'Find MTG on Google'}</span>
          </button>

          <button
            onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Muttagundi,+Hosadurga,+Karnataka', '_blank', 'noopener,noreferrer')}
            style={{
              flex: '1 1 200px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#E2E8F0',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 18px',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <MapPin size={16} color="#34A853" />
            <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ನೋಡಿ' : 'View on Google Maps'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
