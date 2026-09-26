import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Sparkles,
  MapPin,
  Wind,
  Droplets,
  CloudRain,
  RefreshCw,
  Compass,
  Thermometer
} from 'lucide-react';
import {
  subscribeMuttagundiWeather,
  fetchMuttagundiLiveWeather,
  MuttagundiWeather,
  MUTTAGUNDI_COORDS
} from '../../services/weatherService';

export const VillageHero: React.FC = () => {
  const { isKannada } = useLanguage();
  const [weather, setWeather] = useState<MuttagundiWeather | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsub = subscribeMuttagundiWeather((w) => {
      setWeather(w);
    });
    return unsub;
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const fresh = await fetchMuttagundiLiveWeather();
    setWeather(fresh);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const villageName = isKannada
    ? (import.meta.env.VITE_VILLAGE_NAME_KN || 'ಮುತ್ತಾಗೊಂದಿ')
    : (import.meta.env.VITE_VILLAGE_NAME_EN || 'Muttagundi');

  const districtName = isKannada
    ? (import.meta.env.VITE_DISTRICT_KN || 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ, ಹೊಸದುರ್ಗ ತಾಲೂಕು, ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ')
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

      {/* Hero Foreground Content with Two Responsive Columns */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '30px 22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}
      >
        {/* LEFT COLUMN: Village Emblem, Title & Welcome */}
        <div style={{ flex: '1 1 340px', maxWidth: '620px' }}>
          {/* District & Location Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.4)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.25)',
                    border: '1px solid rgba(52, 211, 153, 0.45)',
                    color: '#6EE7B7',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    backdropFilter: 'blur(8px)',
                    textTransform: 'uppercase'
                  }}
                >
                  MTG Village App
                </span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#A7F3D0', fontWeight: 600, letterSpacing: '0.03em', marginTop: '4px' }}>
                {isKannada ? 'MTG ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಪೋರ್ಟಲ್' : 'MTG Digital Village Portal'}
              </div>
            </div>
          </div>

          {/* Soulful Tagline */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: '#E2E8F0',
              margin: '0 0 16px 0',
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
              background: 'rgba(16, 185, 129, 0.22)',
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

        {/* RIGHT COLUMN: MUTTAGUNDI-ONLY LIVE WEATHER CARD */}
        <div
          style={{
            flex: '1 1 310px',
            maxWidth: '380px',
            background: 'rgba(6, 30, 22, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(52, 211, 153, 0.35)',
            borderRadius: '20px',
            padding: '16px 18px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minWidth: '280px'
          }}
        >
          {/* Card Header: Title & Live Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>📍</span>
              <div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    display: 'block',
                    lineHeight: 1.2
                  }}
                >
                  {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ಹವಾಮಾನ' : 'Muttagundi Weather'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6EE7B7', fontWeight: 600 }}>
                  {isKannada ? 'ಹೊಸದುರ್ಗ ತಾಲೂಕು (ಕೇವಲ ಮುತ್ತಾಗೊಂದಿ)' : 'Hosadurga Taluk (Muttagundi Only)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(52, 211, 153, 0.45)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#34D399'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 6px #10B981'
                  }}
                />
                <span>{isKannada ? 'ಲೈವ್' : 'LIVE'}</span>
              </div>

              <button
                type="button"
                onClick={handleManualRefresh}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s ease'
                }}
                title={isKannada ? 'ಹವಾಮಾನ ನವೀಕರಿಸಿ' : 'Refresh Muttagundi Weather'}
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Main Temperature & Condition Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '14px',
              padding: '10px 14px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
                }}
              >
                {weather?.iconEmoji || '⛅'}
              </span>
              <div>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1, color: '#FFFFFF' }}>
                  {weather ? weather.temperature : 24}
                  <span style={{ fontSize: '1.2rem', color: '#FBBF24', fontWeight: 700 }}>°C</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '3px' }}>
                  {isKannada ? 'ಅನಿಸಿಕೆ:' : 'Feels like:'}{' '}
                  <strong style={{ color: '#F1F5F9' }}>
                    {weather ? weather.apparentTemperature : 25}°C
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: '#FBBF24',
                  display: 'block'
                }}
              >
                {isKannada ? weather?.conditionKn || 'ಭಾಗಶಃ ಮೋಡ' : weather?.conditionEn || 'Partly Cloudy'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#A7F3D0',
                  fontWeight: 600,
                  display: 'inline-block',
                  marginTop: '2px'
                }}
              >
                {weather?.isDay
                  ? (isKannada ? '☀️ ಹಗಲು ವಾತಾವರಣ' : '☀️ Daytime')
                  : (isKannada ? '🌙 ರಾತ್ರಿ ವಾತಾವರಣ' : '🌙 Nighttime')}
              </span>
            </div>
          </div>

          {/* 4-Pill Metric Grid for Muttagundi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {/* Humidity */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '7px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Droplets size={16} color="#38BDF8" />
              <div>
                <span style={{ fontSize: '0.66rem', color: '#94A3B8', display: 'block' }}>
                  {isKannada ? 'ಆರ್ದ್ರತೆ' : 'Humidity'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {weather?.humidity ?? 76}%
                </span>
              </div>
            </div>

            {/* Wind Speed */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '7px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Wind size={16} color="#34D399" />
              <div>
                <span style={{ fontSize: '0.66rem', color: '#94A3B8', display: 'block' }}>
                  {isKannada ? 'ಗಾಳಿಯ ವೇಗ' : 'Wind Speed'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {weather?.windSpeed ?? 15} km/h
                </span>
              </div>
            </div>

            {/* Precipitation / Rain */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '7px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CloudRain size={16} color="#60A5FA" />
              <div>
                <span style={{ fontSize: '0.66rem', color: '#94A3B8', display: 'block' }}>
                  {isKannada ? 'ಮಳೆ ಸಂಭವ' : 'Precipitation'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {weather?.precipitation ?? 0} mm
                </span>
              </div>
            </div>

            {/* Elevation / Coords */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '7px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Compass size={16} color="#FBBF24" />
              <div>
                <span style={{ fontSize: '0.66rem', color: '#94A3B8', display: 'block' }}>
                  {isKannada ? 'ಎತ್ತರ (MSL)' : 'Elevation'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
                  742 ಮೀಟರ್
                </span>
              </div>
            </div>
          </div>

          {/* Micro-footer: Exclusively for Muttagundi */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              color: '#94A3B8',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '6px'
            }}
          >
            <span style={{ color: '#34D399', fontWeight: 700 }}>
              ✓ {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ನಿಖರ GPS ವರದಿ' : 'Muttagundi GPS Only'}
            </span>
            <span>
              {isKannada ? 'ಅಪ್‌ಡೇಟ್: ' : 'Updated: '}{weather?.lastUpdated || 'ಈಗಷ್ಟೇ'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VillageHero;
