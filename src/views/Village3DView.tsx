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
  X,
  Sparkles,
  Map as MapIcon,
  ChevronDown,
  Info
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

  const [selectedLandmarkId, setSelectedLandmarkId] = useState<LandmarkId>('temple');
  const [selectedLocation, setSelectedLocation] = useState<MapLocationItem | null>(() => {
    return locations.find((l) => l.id.includes('kalle') || l.id.includes('temple')) || locations[0] || null;
  });

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [showDioramaModal, setShowDioramaModal] = useState(false);

  // Sync selection from 3D Village model to locations list
  const handle3DLandmarkSelect = (landmarkId: LandmarkId) => {
    setSelectedLandmarkId(landmarkId);
    setIsInspectorOpen(true);

    let match: MapLocationItem | undefined;
    if (landmarkId === 'shrine') {
      match = locations.find((l) => l.id.includes('thimmappa') || l.id.includes('stone') || l.name_kn.includes('ತಿಮ್ಮಪ್ಪ'));
    } else if (landmarkId === 'temple') {
      match = locations.find((l) => l.id.includes('kalle') || l.id.includes('anjaneya') || l.category === 'TEMPLE');
    } else if (landmarkId === 'temple1') {
      match = locations.find((l) => l.id.includes('kalle') || l.id.includes('shrine'));
    } else if (landmarkId === 'school' || landmarkId === 'panchayat') {
      match = locations.find((l) => l.id.includes('school') || l.category === 'SCHOOL' || l.category === 'HALL');
    } else if (landmarkId === 'kindergarden') {
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

  const quickLandmarkPills: { id: LandmarkId; label_kn: string; label_en: string; icon: string }[] = [
    { id: 'temple', label_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ದೇವಸ್ಥಾನ', label_en: 'Sri Kalleshwara Temple', icon: '🛕' },
    { id: 'farms', label_kn: 'ಅಡಿಕೆ ತೋಟ', label_en: 'Areca Plantation', icon: '🌴' },
    { id: 'school', label_kn: 'ಸಮುದಾಯ ಭವನ / ಶಾಲೆ', label_en: 'Community Hall', icon: '🏫' },
    { id: 'shrine', label_kn: 'ಹಳೆಯ ಕಲ್ಲಿನ ಗುಡಿ', label_en: 'Old Stone Structure', icon: '🪨' },
    { id: 'kindergarden', label_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ', label_en: 'Anganwadi Center', icon: '👶' },
    { id: 'temple1', label_kn: 'ಕಲ್ಲೇಶ್ವರ ಗುಡಿ (ವಿದ್ಯುತ್ ಗೋಪುರ)', label_en: 'Village Shrine & Pylon', icon: '⚡' }
  ];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '36px' }}>
      {/* 1. CLEAN TOP HEADER WITH COMPACT SEGMENTED SWITCHER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          padding: '4px 2px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              MTG VILLAGE
            </h2>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '8px'
              }}
            >
              3D DIORAMA
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ, ಕರ್ನಾಟಕ • 3D ವೈಮಾನಿಕ ಮಾದರಿ' : 'Muttagundi, Karnataka, India • 3D Aerial Miniature Model'}
          </span>
        </div>

        {/* View Switcher: 2D Map vs 3D Village */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onNavigateToMap && (
            <button
              onClick={onNavigateToMap}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '8px 16px',
                color: '#CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#CBD5E1';
              }}
            >
              <MapIcon size={15} color="#3B82F6" />
              <span>{isKannada ? '🗺️ 2D ನಕ್ಷೆ & ಜಿಪಿಎಸ್' : '🗺️ 2D Map & GPS'}</span>
            </button>
          )}

          {/* Reference Image Inspector Button */}
          <button
            onClick={() => setShowDioramaModal(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '20px',
              padding: '8px 14px',
              color: '#FBBF24',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Inspect Master Visual Reference"
          >
            <Sparkles size={14} />
            <span>{isKannada ? 'ಕಲಾ ನೋಟ' : 'Art View'}</span>
          </button>
        </div>
      </div>

      {/* 2. [ LARGE 3D VILLAGE DIORAMA VIEWPORT ] */}
      <div
        className="glass-card"
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '14px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          background: '#070F1E',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(16, 185, 129, 0.1)',
          position: 'relative',
          height: 'calc(100vh - 240px)',
          minHeight: '520px',
          maxHeight: '740px'
        }}
      >
        <Village3DScene
          selectedId={selectedLandmarkId}
          onSelect={handle3DLandmarkSelect}
          isKannada={isKannada}
        />
      </div>

      {/* 3. COMPACT LANDMARK FOCUS PILLS [Temple] [Plantation] [Hall] [Stone] ... */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '6px',
            scrollbarWidth: 'none'
          }}
        >
          {quickLandmarkPills.map((item) => {
            const isSelected = selectedLandmarkId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handle3DLandmarkSelect(item.id)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '7px 15px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
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

      {/* 4. CLEAN NON-INTRUSIVE BUILDING INSPECTION DRAWER (Positioned beneath 3D canvas) */}
      {selectedLocation && isInspectorOpen && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${selectedLocation.color || '#10B981'}`,
            borderRadius: '20px',
            padding: '16px 20px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.2s ease',
            position: 'relative'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsInspectorOpen(false)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Dismiss details"
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: `${selectedLocation.color || '#10B981'}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  border: `1px solid ${selectedLocation.color || '#10B981'}44`
                }}
              >
                {selectedLocation.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    {isKannada ? selectedLocation.name_kn : selectedLocation.name_en}
                  </h3>
                  {selectedLocation.verified && (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.78rem', marginTop: '2px' }}>
                  <MapPin size={13} color={selectedLocation.color || '#10B981'} />
                  <span>{isKannada ? selectedLocation.distance_kn : selectedLocation.distance_en}</span>
                  <span>•</span>
                  <span>{selectedLocation.coords.lat.toFixed(4)}° N, {selectedLocation.coords.lng.toFixed(4)}° E</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {onNavigateToMap && (
                <button
                  onClick={onNavigateToMap}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '20px',
                    padding: '7px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <MapIcon size={14} />
                  <span>{isKannada ? '2D ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ' : 'View on 2D Map'}</span>
                </button>
              )}

              <a
                href={selectedLocation.map_url || `https://www.google.com/maps/search/?api=1&query=${selectedLocation.coords.lat},${selectedLocation.coords.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Compass size={14} />
                <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ದಾರಿ' : 'Google Maps Directions'}</span>
              </a>
            </div>
          </div>

          <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.5, margin: '10px 0 0 0' }}>
            {isKannada ? selectedLocation.desc_kn : selectedLocation.desc_en}
          </p>
        </div>
      )}

      {/* 5. MASTER DIORAMA ART REFERENCE MODAL */}
      {showDioramaModal && (
        <div
          onClick={() => setShowDioramaModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(5, 10, 20, 0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '820px',
              background: '#0B132B',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>🌟</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ 3D ವೈಮಾನಿಕ ಮಾದರಿ (Master Reference)' : 'Muttagundi 3D Diorama Master View'}
                </h3>
              </div>
              <button
                onClick={() => setShowDioramaModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden' }}>
              <img
                src="/diorama/mtg_reference_diorama.jpg"
                alt="MTG Village 3D Diorama Reference"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#020617' }}
              />
            </div>

            <div style={{ padding: '14px 18px', fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.5 }}>
              {isKannada
                ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ, ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಾಲಯ, ಹಳೆಯ ಕಲ್ಲಿನ ಗುಡಿ, ಶಾಲೆ, ಅಡಿಕೆ ತೋಟ ಹಾಗೂ ಅಂಗನವಾಡಿ ಕೇಂದ್ರವನ್ನು ಒಳಗೊಂಡ ಕಲಾತ್ಮಕ 3D ಮಾದರಿ.'
                : 'Master 3D diorama illustrating the historic Sri Kalleshwara Swamy temple, ancient stone structure, village school, lush areca plantation, and community centers of Muttagundi.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
