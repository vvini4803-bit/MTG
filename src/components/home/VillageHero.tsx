import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, MapPin } from 'lucide-react';

export const VillageHero: React.FC = () => {
  const { isKannada } = useLanguage();

  const villageName = isKannada
    ? (import.meta.env.VITE_VILLAGE_NAME_KN || 'ಮುಟ್ಟಗುಂಡಿ')
    : (import.meta.env.VITE_VILLAGE_NAME_EN || 'Muttagundi');

  const districtName = isKannada
    ? (import.meta.env.VITE_DISTRICT_KN || 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮ, ಹೊಸದುರ್ಗ ತಾಲೂಕು, ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ')
    : (import.meta.env.VITE_DISTRICT_EN || 'Muttagundi, Hosadurga Taluk, Chitradurga District');

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #064E3B 0%, #065F46 40%, #047857 70%, #0F172A 100%)',
        boxShadow: '0 20px 40px rgba(6, 78, 59, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        marginBottom: '20px',
        color: '#FFFFFF'
      }}
    >
      {/* Background Animated SVG Landscape */}
      <svg
        viewBox="0 0 1000 340"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          opacity: 0.65
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="skyGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
          <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#065F46" />
          </linearGradient>
        </defs>

        {/* Soft Golden Sun */}
        <circle cx="780" cy="70" r="55" fill="#FBBF24" opacity="0.45" />
        <circle cx="780" cy="70" r="80" fill="#FBBF24" opacity="0.2" />

        {/* Distant Mountains / Hills */}
        <path d="M0,220 Q200,120 420,200 T850,160 T1000,210 L1000,340 L0,340 Z" fill="url(#hillGrad1)" opacity="0.5" />
        <path d="M0,240 Q280,160 560,230 T1000,200 L1000,340 L0,340 Z" fill="url(#hillGrad2)" opacity="0.75" />

        {/* Gentle Rolling Farm Terraces */}
        <path d="M-50,260 Q180,210 400,270 T820,240 T1050,280 L1050,340 L-50,340 Z" fill="#047857" />

        {/* Stylized Temple Gopura Silhouette */}
        <path d="M680,220 L695,160 L705,160 L720,220 Z" fill="#022C22" opacity="0.7" />
        <line x1="700" y1="160" x2="700" y2="150" stroke="#F59E0B" strokeWidth="2" />

        {/* Stylized Coconut Palm Trees */}
        <g opacity="0.8">
          {/* Tree 1 */}
          <path d="M120,270 Q125,210 140,170" stroke="#064E3B" strokeWidth="4" fill="none" />
          <path d="M140,170 Q110,160 90,175 M140,170 Q130,140 120,135 M140,170 Q160,145 175,150 M140,170 Q170,175 180,190" stroke="#10B981" strokeWidth="3" fill="none" />

          {/* Tree 2 */}
          <path d="M860,280 Q850,210 830,160" stroke="#064E3B" strokeWidth="4" fill="none" />
          <path d="M830,160 Q800,150 780,165 M830,160 Q820,130 810,125 M830,160 Q850,135 865,140 M830,160 Q860,165 870,180" stroke="#10B981" strokeWidth="3" fill="none" />
        </g>
      </svg>

      {/* Hero Foreground Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '36px 24px 28px',
          maxWidth: '750px'
        }}
      >
        {/* District & Location Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#FBBF24',
            marginBottom: '14px'
          }}
        >
          <MapPin size={14} color="#FBBF24" />
          <span>{districtName}</span>
        </div>

        {/* Village Name Title & Logo Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '0 0 10px 0', flexWrap: 'wrap' }}>
          <img
            src="/logo.png"
            alt="Muttagundi Village MTG Emblem"
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
              border: '2.5px solid rgba(245, 158, 11, 0.65)',
              background: '#070F1E',
              flexShrink: 0
            }}
          />
          <div>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}
            >
              {villageName}
            </h1>
          </div>
        </div>

        {/* Soulful Tagline */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#E2E8F0',
            margin: '0 0 20px 0',
            fontWeight: 600,
            lineHeight: 1.4,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)'
          }}
        >
          {isKannada
            ? 'ನಮ್ಮ ಗ್ರಾಮ • ನಮ್ಮ ಜನ • ನಮ್ಮ ಕಥೆಗಳು'
            : 'Our Village • Our People • Our Stories'}
        </p>

        {/* Warm Welcome Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            borderRadius: '12px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            color: '#A7F3D0',
            fontWeight: 700
          }}
        >
          <Sparkles size={16} color="#34D399" />
          <span>
            {isKannada
              ? 'ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಮಾಹಿತಿ & ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಸುಸ್ವಾಗತ'
              : 'Welcome to the Digital Village Hub & Information Center'}
          </span>
        </div>
      </div>
    </div>
  );
};
