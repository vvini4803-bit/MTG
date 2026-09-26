import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Sunset,
  Eye,
  Layers
} from 'lucide-react';

interface Village3DViewProps {
  onNavigateToMap?: () => void;
}

type TimeOfDay = 'day' | 'sunset' | 'night';
type ViewMode = 'diorama' | 'mesh3d';

interface LandmarkHotspot {
  id: LandmarkId;
  label_kn: string;
  label_en: string;
  icon: string;
  leftPct: number; // percentage X on master image
  topPct: number;  // percentage Y on master image
  focusZoom: number;
  focusPanX: number;
  focusPanY: number;
}

const LANDMARK_HOTSPOTS: LandmarkHotspot[] = [
  {
    id: 'temple',
    label_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ (ಗೋಪುರ)',
    label_en: 'Sri Anjaneya Swamy Temple (Gopuram)',
    icon: '🛕',
    leftPct: 23,
    topPct: 58,
    focusZoom: 1.6,
    focusPanX: 28,
    focusPanY: -10
  },
  {
    id: 'shrine',
    label_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
    label_en: 'Sri Lakshmi Thimmappa Swamy Temple',
    icon: '🛕',
    leftPct: 19,
    topPct: 24,
    focusZoom: 1.7,
    focusPanX: 32,
    focusPanY: 26
  },
  {
    id: 'school',
    label_kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ',
    label_en: 'Govt Lower Primary School',
    icon: '🏫',
    leftPct: 52,
    topPct: 26,
    focusZoom: 1.65,
    focusPanX: -2,
    focusPanY: 24
  },
  {
    id: 'farms',
    label_kn: 'ಅಡಿಕೆ & ತೆಂಗಿನ ತೋಟ',
    label_en: 'Areca Nut Plantation',
    icon: '🌴',
    leftPct: 84,
    topPct: 24,
    focusZoom: 1.6,
    focusPanX: -34,
    focusPanY: 24
  },
  {
    id: 'temple1',
    label_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ಗುಡಿ (ವಿದ್ಯುತ್ ಗೋಪುರ)',
    label_en: 'Sri Kalleshwara Temple & Pylon',
    icon: '⚡',
    leftPct: 65,
    topPct: 62,
    focusZoom: 1.7,
    focusPanX: -18,
    focusPanY: -14
  },
  {
    id: 'kindergarden',
    label_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ',
    label_en: 'Anganwadi Kendra',
    icon: '👶',
    leftPct: 84,
    topPct: 82,
    focusZoom: 1.75,
    focusPanX: -35,
    focusPanY: -32
  }
];

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

  const [viewMode, setViewMode] = useState<ViewMode>('diorama');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<LandmarkId>('temple');
  const [selectedLocation, setSelectedLocation] = useState<MapLocationItem | null>(() => {
    return locations.find((l) => l.id === 'mtg_temple_anjaneya' || l.id.includes('anjaneya')) || locations[0] || null;
  });

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [showHotspotTags, setShowHotspotTags] = useState(true);

  // Interactive 3D Spatial Canvas States (for Master Diorama)
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const startDragRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });

  // Sync selection from 3D Village model to locations list
  const handleSelectLandmark = useCallback((landmarkId: LandmarkId, shouldFocus = true) => {
    setSelectedLandmarkId(landmarkId);
    setIsInspectorOpen(true);

    let match: MapLocationItem | undefined;
    if (landmarkId === 'temple') {
      // Sri Anjaneya Swamy Temple (The colorful tiered Gopuram temple)
      match = locations.find((l) => l.id === 'mtg_temple_anjaneya' || l.id.includes('anjaneya') || l.name_kn.includes('ಆಂಜನೇಯ'));
    } else if (landmarkId === 'shrine') {
      // Sri Lakshmi Thimmappa Swamy Temple (Sacred historic stone shrine)
      match = locations.find((l) => l.id === 'mtg_temple_thimmappa' || l.id.includes('thimmappa') || l.name_kn.includes('ತಿಮ್ಮಪ್ಪ'));
    } else if (landmarkId === 'school' || landmarkId === 'panchayat') {
      // Government Lower Primary School
      match = locations.find((l) => l.id === 'mtg_school' || l.id.includes('school') || l.name_kn.includes('ಶಾಲೆ'));
    } else if (landmarkId === 'temple1') {
      // Sri Kalleshwara Swamy Temple (Kalle Devaru) & Pylon
      match = locations.find((l) => l.id === 'mtg_temple_kalle_devar' || l.id.includes('kalle'));
    } else if (landmarkId === 'kindergarden') {
      // Anganwadi Kendra
      match = locations.find((l) => l.id === 'mtg_anganwadi' || l.id.includes('anganwadi') || l.category === 'HEALTH');
    } else if (landmarkId === 'farms') {
      // Areca Nut & Coconut Plantation
      match = locations.find((l) => l.id.includes('plantation') || l.id.includes('farm') || l.category === 'FARM');
    } else if (landmarkId === 'water') {
      match = locations.find((l) => l.id.includes('water') || l.category === 'WATER');
    }

    if (match) {
      setSelectedLocation(match);
    }

    // In diorama mode, optionally animate focus onto landmark
    if (shouldFocus && viewMode === 'diorama') {
      const spot = LANDMARK_HOTSPOTS.find((h) => h.id === landmarkId);
      if (spot) {
        setZoom(spot.focusZoom);
        setPan({ x: spot.focusPanX, y: spot.focusPanY });
      }
    }
  }, [locations, viewMode]);

  const resetDioramaView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setTilt({ x: 0, y: 0 });
  };

  // Pointer interactions for 3D Tilt & Pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startDragRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      // Gentle mouse hover tilt effect when not dragging
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({
        x: -ny * 8, // slight vertical tilt
        y: nx * 10   // slight horizontal tilt
      });
      return;
    }

    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;

    if (zoom > 1.05) {
      // Pan when zoomed in
      setPan({
        x: startPanRef.current.x + dx * 0.15,
        y: startPanRef.current.y + dy * 0.15
      });
    } else {
      // 3D Tilt perspective shift when in full view
      setTilt({
        x: Math.max(-14, Math.min(14, -dy * 0.15)),
        y: Math.max(-16, Math.min(16, dx * 0.15))
      });
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(1.0, Math.min(2.5, prev - e.deltaY * 0.002)));
  };

  // CSS Filter by time of day
  const getLightingFilter = () => {
    if (timeOfDay === 'sunset') {
      return 'sepia(0.28) saturate(1.35) hue-rotate(-15deg) brightness(0.96)';
    }
    if (timeOfDay === 'night') {
      return 'brightness(0.62) saturate(1.22) hue-rotate(185deg) contrast(1.18)';
    }
    return 'brightness(1.03) saturate(1.08) contrast(1.02)';
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '36px' }}>
      {/* 1. TOP HEADER WITH MODE SELECTOR */}
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
                background: viewMode === 'diorama' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: viewMode === 'diorama' ? '#FBBF24' : '#34D399',
                border: viewMode === 'diorama' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.35)',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '8px'
              }}
            >
              {viewMode === 'diorama' ? 'MASTER DIORAMA' : '3D ORBIT MESH'}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            {isKannada
              ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ, ಹೊಸದುರ್ಗ • ಡಿಜಿಟಲ್ ಟ್ವಿನ್ 3D ಮಾದರಿ'
              : 'Muttagundi Village, Hosadurga • Digital Twin 3D Environment'}
          </span>
        </div>

        {/* View Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Toggle between Master Diorama & 3D Orbit Mesh */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <button
              onClick={() => setViewMode('diorama')}
              style={{
                background: viewMode === 'diorama' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'transparent',
                color: viewMode === 'diorama' ? '#FFFFFF' : '#CBD5E1',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: viewMode === 'diorama' ? '0 2px 10px rgba(245, 158, 11, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={14} />
              <span>{isKannada ? '🌟 ಮಾಸ್ಟರ್ ನೋಟ' : '🌟 Master Diorama'}</span>
            </button>
            <button
              onClick={() => setViewMode('mesh3d')}
              style={{
                background: viewMode === 'mesh3d' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'transparent',
                color: viewMode === 'mesh3d' ? '#FFFFFF' : '#CBD5E1',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: viewMode === 'mesh3d' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Layers size={14} />
              <span>{isKannada ? '🌐 360° ಮಾದರಿ' : '🌐 360° Mesh'}</span>
            </button>
          </div>

          {/* 2D Map navigation button */}
          {onNavigateToMap && (
            <button
              onClick={onNavigateToMap}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '7px 14px',
                color: '#CBD5E1',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <MapIcon size={14} color="#3B82F6" />
              <span>{isKannada ? '🗺️ 2D ನಕ್ಷೆ' : '🗺️ 2D Map'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. [ MASTER DIORAMA / 3D VIEWPORT ] */}
      <div
        className="glass-card"
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '14px',
          border: '1.5px solid rgba(251, 191, 36, 0.35)',
          background: '#050D1A',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.1)',
          position: 'relative',
          height: 'calc(100vh - 250px)',
          minHeight: '520px',
          maxHeight: '740px',
          perspective: '1200px'
        }}
      >
        {viewMode === 'diorama' ? (
          /* ========================================================================= */
          /* 🌟 MASTER REFERENCE INTERACTIVE 3D DIORAMA (100% VISUAL FIDELITY)         */
          /* ========================================================================= */
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: timeOfDay === 'night'
                ? 'radial-gradient(ellipse at 50% 30%, #0f172a 0%, #020617 100%)'
                : timeOfDay === 'sunset'
                ? 'radial-gradient(ellipse at 50% 30%, #431407 0%, #1e1b4b 100%)'
                : 'radial-gradient(ellipse at 50% 35%, #bae6fd 0%, #e0f2fe 45%, #7dd3fc 100%)'
            }}
          >
            {/* The 3D Responsive Spatial Container with perspective & tilt */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`,
                transformStyle: 'preserve-3d',
                transition: isDraggingRef.current ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: getLightingFilter()
              }}
            >
              {/* THE MASTER PHOTOGRAPH AS VISUAL SOURCE OF TRUTH */}
              <img
                src="/diorama/mtg_reference_diorama.jpg?v=2"
                alt="MTG Village 3D Master Diorama"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              />

              {/* NIGHT MODE LIGHTING OVERLAY: GLOWING TEMPLE & BUILDING WINDOWS */}
              {timeOfDay === 'night' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none'
                  }}
                >
                  {/* Temple Kalasha & Gopuram Golden Glow */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '22%',
                      top: '46%',
                      width: '60px',
                      height: '60px',
                      background: 'radial-gradient(circle, rgba(251, 191, 36, 0.95) 0%, rgba(245, 158, 11, 0.4) 45%, transparent 70%)',
                      filter: 'blur(4px)',
                      borderRadius: '50%'
                    }}
                  />
                  {/* School Veranda Lights */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '52%',
                      top: '25%',
                      width: '80px',
                      height: '35px',
                      background: 'radial-gradient(ellipse, rgba(254, 240, 138, 0.9) 0%, rgba(245, 158, 11, 0.3) 50%, transparent 80%)',
                      filter: 'blur(5px)',
                      borderRadius: '50%'
                    }}
                  />
                  {/* Anganwadi Lights */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '84%',
                      top: '80%',
                      width: '50px',
                      height: '30px',
                      background: 'radial-gradient(ellipse, rgba(254, 240, 138, 0.9) 0%, rgba(56, 189, 248, 0.4) 50%, transparent 80%)',
                      filter: 'blur(4px)',
                      borderRadius: '50%'
                    }}
                  />
                </div>
              )}

              {/* INTERACTIVE LANDMARK HOTSPOT PINS & RINGS */}
              {LANDMARK_HOTSPOTS.map((hotspot) => {
                const isSelected = selectedLandmarkId === hotspot.id;
                return (
                  <div
                    key={hotspot.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLandmark(hotspot.id, true);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${hotspot.leftPct}%`,
                      top: `${hotspot.topPct}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={isKannada ? hotspot.label_kn : hotspot.label_en}
                  >
                    {/* Pulsing Target Halo */}
                    <div
                      style={{
                        position: 'relative',
                        width: isSelected ? '42px' : '34px',
                        height: isSelected ? '42px' : '34px',
                        borderRadius: '50%',
                        background: isSelected
                          ? 'radial-gradient(circle, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.8) 100%)'
                          : 'rgba(15, 23, 42, 0.82)',
                        border: isSelected ? '2.5px solid #FFFFFF' : '2px solid rgba(251, 191, 36, 0.75)',
                        boxShadow: isSelected
                          ? '0 0 25px rgba(245, 158, 11, 0.9), 0 0 10px #FFFFFF'
                          : '0 4px 14px rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isSelected ? '1.25rem' : '1.05rem',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <span>{hotspot.icon}</span>

                      {/* Ripple animation around selected */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: '-8px',
                            borderRadius: '50%',
                            border: '2px solid rgba(251, 191, 36, 0.7)',
                            animation: 'pulse 1.8s infinite'
                          }}
                        />
                      )}
                    </div>

                    {/* Landmark Tag Label */}
                    {showHotspotTags && (
                      <div
                        style={{
                          background: isSelected ? 'rgba(245, 158, 11, 0.96)' : 'rgba(15, 23, 42, 0.85)',
                          color: isSelected ? '#000000' : '#FFFFFF',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          whiteSpace: 'nowrap',
                          border: isSelected ? '1px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
                          transition: 'all 0.2s ease',
                          pointerEvents: 'none'
                        }}
                      >
                        {isKannada ? hotspot.label_kn : hotspot.label_en}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* TOP-RIGHT ON-CANVAS DIORAMA CONTROLS */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(7, 15, 30, 0.85)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '4px 8px',
                zIndex: 35
              }}
            >
              {/* Lighting Switcher */}
              <button
                onClick={() => setTimeOfDay(timeOfDay === 'day' ? 'sunset' : timeOfDay === 'sunset' ? 'night' : 'day')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '5px 10px',
                  color: '#FFFFFF',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Toggle Time of Day Lighting"
              >
                <span>{timeOfDay === 'day' ? '☀️' : timeOfDay === 'sunset' ? '🌅' : '🌙'}</span>
                <span>{timeOfDay === 'day' ? (isKannada ? 'ಹಗಲು' : 'Day') : timeOfDay === 'sunset' ? (isKannada ? 'ಸಂಜೆ' : 'Sunset') : (isKannada ? 'ರಾತ್ರಿ' : 'Night')}</span>
              </button>

              {/* Tag Visibility */}
              <button
                onClick={() => setShowHotspotTags(!showHotspotTags)}
                style={{
                  background: showHotspotTags ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  border: showHotspotTags ? '1px solid rgba(59, 130, 246, 0.5)' : 'none',
                  borderRadius: '14px',
                  padding: '5px 9px',
                  color: showHotspotTags ? '#93C5FD' : '#94A3B8',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="Toggle Landmark Names"
              >
                🏷️
              </button>

              {/* Zoom In */}
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '5px 9px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>

              {/* Zoom Out */}
              <button
                onClick={() => setZoom((z) => Math.max(1.0, z - 0.25))}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '5px 9px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>

              {/* Reset to Full View */}
              <button
                onClick={resetDioramaView}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '5px 9px',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Reset View"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* BOTTOM GESTURE HINT */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                background: 'rgba(7, 15, 30, 0.82)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.7rem',
                color: '#CBD5E1',
                zIndex: 35,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>👆 {isKannada ? 'ಎಳೆದು 3D ತಿರುಗಿಸಿ' : 'Drag to tilt in 3D'}</span>
              <span>•</span>
              <span>🔍 {isKannada ? 'ಸ್ಕ್ರಾಲ್ ಮಾಡಿ ಜೂಮ್' : 'Scroll / pinch to zoom'}</span>
              <span>•</span>
              <span>🏛️ {isKannada ? 'ಕಟ್ಟಡ ಮುಟ್ಟಿ' : 'Tap landmark'}</span>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 🌐 360° WEBGL PROCEDURAL MESH MODEL (ALTERNATIVE ROTATING VIEW)           */
          /* ========================================================================= */
          <Village3DScene
            selectedId={selectedLandmarkId}
            onSelect={(id) => handleSelectLandmark(id, false)}
            isKannada={isKannada}
          />
        )}
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
          {LANDMARK_HOTSPOTS.map((item) => {
            const isSelected = selectedLandmarkId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectLandmark(item.id, true)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.25) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  border: isSelected ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
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
                  boxShadow: isSelected ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
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
    </div>
  );
};
