import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Village3DScene, LandmarkId } from '../components/3d/Village3DScene';
import { VERIFIED_VILLAGE_LOCATIONS, MapLocationItem } from './VillageMapView';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Compass,
  Maximize2,
  X,
  Sparkles,
  ArrowRight,
  Eye,
  Layers,
  Map as MapIcon
} from 'lucide-react';

interface Village3DViewProps {
  onNavigateToMap?: () => void;
}

export const Village3DView: React.FC<Village3DViewProps> = ({ onNavigateToMap }) => {
  const { isKannada } = useLanguage();

  const [locations] = useState<MapLocationItem[]>(() => {
    try {
      const saved = localStorage.getItem('muttagundi_map_locations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customPlaces = parsed.filter(
            (p: MapLocationItem) => p.id !== 'mtg_stone_shrine' && (!p.verified || !VERIFIED_VILLAGE_LOCATIONS.some((v) => v.id === p.id))
          );
          return [...VERIFIED_VILLAGE_LOCATIONS, ...customPlaces];
        }
      }
    } catch {}
    return VERIFIED_VILLAGE_LOCATIONS;
  });

  const [selectedLandmarkId, setSelectedLandmarkId] = useState<LandmarkId>('shrine');
  const [selectedLocation, setSelectedLocation] = useState<MapLocationItem | null>(() => {
    return locations.find((l) => l.id.includes('thimmappa')) || locations[0] || null;
  });

  const [isAnimeMode, setIsAnimeMode] = useState(true);
  const [activeAnimeModal, setActiveAnimeModal] = useState<MapLocationItem | null>(null);

  // Sync selection from 3D Village model to locations list
  const handle3DLandmarkSelect = (landmarkId: LandmarkId) => {
    setSelectedLandmarkId(landmarkId);
    let match: MapLocationItem | undefined;
    if (landmarkId === 'shrine') {
      match = locations.find((l) => l.id.includes('thimmappa') || l.id.includes('stone') || l.name_kn.includes('ತಿಮ್ಮಪ್ಪ'));
    } else if (landmarkId === 'temple') {
      match = locations.find((l) => l.id.includes('anjaneya'));
    } else if (landmarkId === 'temple1') {
      match = locations.find((l) => l.id.includes('kalle'));
    } else if (landmarkId === 'panchayat') {
      match = locations.find((l) => l.id.includes('panchayat') || l.category === 'HALL');
    } else if (landmarkId === 'school') {
      match = locations.find((l) => l.id.includes('school') || l.category === 'SCHOOL');
    } else if (landmarkId === 'kindergarden' || landmarkId === 'clinic') {
      match = locations.find((l) => l.id.includes('anganwadi') || l.category === 'HEALTH');
    } else if (landmarkId === 'farms') {
      match = locations.find((l) => l.id.includes('farm') || l.category === 'FARM');
    } else if (landmarkId === 'water') {
      match = locations.find((l) => l.id.includes('water') || l.category === 'WATER');
    }

    if (match) {
      setSelectedLocation(match);
    }
  };

  const selectLandmarkByPill = (id: LandmarkId) => {
    handle3DLandmarkSelect(id);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '36px' }}>
      {/* 1. TOP SEGMENTED SWITCHER BAR: VILLAGE MAP vs 3D VILLAGE */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '6px',
          marginBottom: '20px',
          display: 'flex',
          gap: '6px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <button
          onClick={onNavigateToMap}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: '18px',
            border: 'none',
            background: 'transparent',
            color: '#94A3B8',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#94A3B8';
          }}
        >
          <MapIcon size={18} color="#3B82F6" />
          <span>{isKannada ? '🗺️ ಗ್ರಾಮ ನಕ್ಷೆ & ಜಿಪಿಎಸ್ (2D Map)' : '🗺️ Village Map & GPS (2D Map)'}</span>
        </button>

        <button
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: '18px',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.28) 0%, rgba(99, 102, 241, 0.2) 100%)',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            fontWeight: 900,
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
          }}
        >
          <Sparkles size={18} color="#FBBF24" />
          <span>{isKannada ? '🌐 3D ಗ್ರಾಮ ದರ್ಶನ (ಸಕ್ರಿಯ)' : '🌐 3D Village View (Active)'}</span>
        </button>
      </div>

      {/* 2. SECTION TITLE & DESCRIPTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.8rem' }}>🌐</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ 3D ಗ್ರಾಮ ದರ್ಶನ' : 'Muttagundi 3D Village Experience'}
            </h2>
            <span
              style={{
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '3px 9px',
                borderRadius: '10px'
              }}
            >
              3D ISOMETRIC
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', margin: 0 }}>
            {isKannada
              ? 'ಇಂಟರ್ಯಾಕ್ಟಿವ್ 3D ಮಾದರಿ, ಬೆಳಕಿನ ಸಮಯ (ದಿನ/ಸಂಜೆ/ರಾತ್ರಿ), ಪ್ರಮುಖ ದೇವಸ್ಥಾನಗಳು ಹಾಗೂ ಆಧುನಿಕ ಅನಿಮೆ ಕಲಾ ನೋಟ'
              : 'Interactive 3D isometric village canvas with real-time lighting, sacred temples, schools, farmlands & anime art'}
          </p>
        </div>

        {/* Quick shortcut to 2D Map */}
        {onNavigateToMap && (
          <button
            onClick={onNavigateToMap}
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Navigation size={15} />
            <span>{isKannada ? '2D ನಕ್ಷೆ & ಜಿಪಿಎಸ್‌ಗೆ ಹೋಗಿ' : 'Switch to 2D Map & GPS'}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 3. QUICK LANDMARK FOCUS PILLS */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#A78BFA', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={14} />
          <span>{isKannada ? 'ತ್ವರಿತ ಸ್ಥಳ ವೀಕ್ಷಣೆ (ಕ್ಲಿಕ್ ಮಾಡಿ 3D ನಲ್ಲಿ ನೋಡಿ):' : 'Quick Landmark Focus (Click to inspect in 3D):'}</span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none'
          }}
        >
          {[
            { id: 'shrine' as LandmarkId, label_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಾಲಯ', label_en: 'Sri Lakshmi Thimmappa Temple', icon: '🛕' },
            { id: 'temple' as LandmarkId, label_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ (ಗೋಪುರ)', label_en: 'Sri Anjaneya Temple (Gopuram)', icon: '🛕' },
            { id: 'temple1' as LandmarkId, label_kn: 'ಕಲ್ಲೇ ದೇವರ ಗುಡಿ (ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ)', label_en: 'Sri Kalleshwara Temple', icon: '🛕' },
            { id: 'school' as LandmarkId, label_kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ', label_en: 'Govt Lower Primary School', icon: '🏫' },
            { id: 'kindergarden' as LandmarkId, label_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ', label_en: 'Anganwadi Center', icon: '👶' },
            { id: 'panchayat' as LandmarkId, label_kn: 'ಸಮುದಾಯ ಭವನ & ಅಂಗಡಿಗಳು', label_en: 'Community Hall & Shops', icon: '🏛️' },
            { id: 'water' as LandmarkId, label_kn: 'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕ', label_en: 'RO Water Plant', icon: '💧' },
            { id: 'farms' as LandmarkId, label_kn: 'ಅಡಿಕೆ ಮತ್ತು ತೆಂಗಿನ ತೋಟ', label_en: 'Farmlands & Groves', icon: '🌴' }
          ].map((item) => {
            const isSelected = selectedLandmarkId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectLandmarkByPill(item.id)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  border: `1px solid ${isSelected ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{item.icon}</span>
                <span>{isKannada ? item.label_kn : item.label_en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. THE 3D INTERACTIVE VILLAGE CANVAS CONTAINER */}
      <div
        className="glass-card"
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '20px',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          background: '#070F1E',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(139, 92, 246, 0.15)',
          position: 'relative'
        }}
      >
        <Village3DScene
          selectedId={selectedLocation?.id}
          onSelect={handle3DLandmarkSelect}
          isKannada={isKannada}
          isAnimeMode={isAnimeMode}
          onToggleAnimeMode={setIsAnimeMode}
          onOpenAnimeShowcase={(id) => {
            const match = locations.find((l) => l.anime_image && (
              (id === 'temple' && l.id.includes('anjaneya')) ||
              (id === 'temple1' && l.id.includes('kalle')) ||
              (id === 'school' && l.id.includes('school')) ||
              (id === 'kindergarden' && l.id.includes('anganwadi')) ||
              (id === 'shrine' && (l.id.includes('thimmappa') || l.id.includes('stone')))
            ));
            if (match) {
              setSelectedLocation(match);
              setActiveAnimeModal(match);
            }
          }}
        />

        {/* Interactive Gesture Guide Footer Overlay */}
        <div
          style={{
            background: 'rgba(7, 15, 30, 0.92)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.76rem',
            color: '#94A3B8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span>👆 {isKannada ? 'ಎಳೆದು 360° ಸುತ್ತು ತಿರುಗಿಸಿ' : 'Drag to rotate 360°'}</span>
            <span>🔍 {isKannada ? 'ಸ್ಕ್ರಾಲ್ ಮಾಡಿ ಜೂಮ್ ಇನ್/ಔಟ್' : 'Scroll/Pinch to zoom'}</span>
            <span>🏛️ {isKannada ? 'ಕಟ್ಟಡದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ವಿವರ ನೋಡಿ' : 'Tap buildings for details'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#FBBF24', fontWeight: 800 }}>Muttagundi, Hosadurga Taluk</span>
          </div>
        </div>
      </div>

      {/* 5. SELECTED LANDMARK INSPECTION CARD */}
      {selectedLocation && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${selectedLocation.color}`,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: `0 12px 30px rgba(0, 0, 0, 0.4), 0 0 24px ${selectedLocation.color}22`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `${selectedLocation.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  border: `1px solid ${selectedLocation.color}44`
                }}
              >
                {selectedLocation.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    {isKannada ? selectedLocation.name_kn : selectedLocation.name_en}
                  </h3>
                  {selectedLocation.verified && (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '0.82rem', marginTop: '4px' }}>
                  <MapPin size={14} color={selectedLocation.color} />
                  <span>{isKannada ? selectedLocation.distance_kn : selectedLocation.distance_en}</span>
                  <span style={{ color: '#64748B' }}>•</span>
                  <span style={{ color: '#64748B', fontSize: '0.76rem' }}>
                    {selectedLocation.coords.lat.toFixed(4)}° N, {selectedLocation.coords.lng.toFixed(4)}° E
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation & Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Direct View on 2D Map */}
              {onNavigateToMap && (
                <button
                  onClick={onNavigateToMap}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    borderRadius: '24px',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <MapIcon size={15} />
                  <span>{isKannada ? '2D ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ' : 'View on 2D Map'}</span>
                </button>
              )}

              {/* Official Google Maps Directions Link */}
              <a
                href={selectedLocation.map_url || `https://www.google.com/maps/search/?api=1&query=${selectedLocation.coords.lat},${selectedLocation.coords.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                }}
              >
                <Compass size={15} />
                <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ದಾರಿ' : 'Google Maps Directions'}</span>
              </a>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 12px 0' }}>
            {isKannada ? selectedLocation.desc_kn : selectedLocation.desc_en}
          </p>

          {selectedLocation.timings_en && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94A3B8', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
              <Clock size={14} color={selectedLocation.color} />
              <span>{isKannada ? selectedLocation.timings_kn : selectedLocation.timings_en}</span>
            </div>
          )}
        </div>
      )}

      {/* 6. ✨ 3D ANIME VISUALS SHOWCASE GALLERY (5 HERITAGE LANDMARKS) */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 24px rgba(245, 158, 11, 0.12)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ 3D ಅನಿಮೆ ಕಲಾವೈಭವಗಳು (5 ಪವಿತ್ರ ಸ್ಥಳಗಳು)' : 'Muttagundi 3D Anime Visuals (5 Heritage Landmarks)'}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                {isKannada
                  ? 'ಮಕೋತೋ ಶಿಂಕೈ & ಘಿಬ್ಲಿ ಪ್ರೇರಿತ ಪ್ರೀಮಿಯಂ 3D ಅನಿಮೆ ನೋಟಗಳು — ಕ್ಲಿಕ್ ಮಾಡಿ ಫುಲ್ HD ನಲ್ಲಿ ನೋಡಿ'
                  : 'Makoto Shinkai & Studio Ghibli inspired modern 3D anime scenes — tap to view full screen'}
              </span>
            </div>
          </div>
          <span
            style={{
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.7rem',
              padding: '4px 12px',
              borderRadius: '12px'
            }}
          >
            {isKannada ? 'ಕ್ಲಿಕ್ ಮಾಡಿ ವೀಕ್ಷಿಸಿ' : 'TAP TO VIEW 3D ART'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {locations.filter((l) => !!l.anime_image).map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedLocation(item);
                setActiveAnimeModal(item);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: selectedLocation?.id === item.id ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                boxShadow: selectedLocation?.id === item.id ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = '#F59E0B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = selectedLocation?.id === item.id ? '#F59E0B' : 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <div style={{ width: '100%', height: '110px', position: 'relative' }}>
                <img
                  src={item.anime_image}
                  alt={item.name_en}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    background: 'rgba(7, 15, 30, 0.88)',
                    color: '#FDE047',
                    fontSize: '0.64rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(253, 224, 71, 0.35)'
                  }}
                >
                  ✨ 3D ANIME
                </span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isKannada ? item.name_kn : item.name_en}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                  {item.distance_en}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. FULLSCREEN 3D ANIME MASTERPIECE MODAL */}
      {activeAnimeModal && activeAnimeModal.anime_image && (
        <div
          onClick={() => setActiveAnimeModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(5, 10, 20, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              background: '#0B132B',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>{activeAnimeModal.icon}</span>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    {isKannada ? activeAnimeModal.name_kn : activeAnimeModal.name_en}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 700 }}>
                    {isKannada ? activeAnimeModal.anime_title_kn : activeAnimeModal.anime_title_en}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveAnimeModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* High-Res Hero Image */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
              <img
                src={activeAnimeModal.anime_image}
                alt={activeAnimeModal.name_en}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  padding: '4px 12px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
              >
                ✨ 3D ANIME MASTERPIECE
              </div>
            </div>

            {/* Content & Navigation Actions */}
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.94rem', color: '#E2E8F0', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                {isKannada ? activeAnimeModal.desc_kn : activeAnimeModal.desc_en}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  📍 {activeAnimeModal.coords.lat.toFixed(5)}° N, {activeAnimeModal.coords.lng.toFixed(5)}° E • {isKannada ? 'ಮುತ್ತಗುಂಡಿ, ಹೊಸದುರ್ಗ' : 'Muttagundi, Hosadurga Taluk'}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {onNavigateToMap && (
                    <button
                      onClick={() => {
                        setActiveAnimeModal(null);
                        onNavigateToMap();
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        borderRadius: '20px',
                        border: 'none',
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <MapIcon size={14} />
                      <span>{isKannada ? '2D ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ' : 'View on 2D Map'}</span>
                    </button>
                  )}

                  <a
                    href={activeAnimeModal.map_url || `https://www.google.com/maps/search/?api=1&query=${activeAnimeModal.coords.lat},${activeAnimeModal.coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '8px 18px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    <Navigation size={14} />
                    <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ದಾರಿ' : 'Google Maps Directions'}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
