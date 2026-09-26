import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { realtimeSync } from '../services/realtimeSync';
import { backNavigation } from '../services/backNavigation';
import { EditMapLocationModal } from './EditMapLocationModal';
import {
  MapPin,
  Navigation,
  PhoneCall,
  Search,
  ExternalLink,
  Clock,
  Compass,
  LocateFixed,
  AlertCircle,
  Plus,
  X,
  Send,
  Layers,
  Sparkles,
  Map as MapIcon,
  ChevronRight,
  Edit3,
  Trash2
} from 'lucide-react';

export interface MapLocationItem {
  id: string;
  name_en: string;
  name_kn: string;
  category:
    | 'TEMPLE'
    | 'SCHOOL'
    | 'HEALTH'
    | 'SPORTS'
    | 'HALL'
    | 'BUS'
    | 'SHOP'
    | 'BANK'
    | 'WATER'
    | 'EMERGENCY'
    | 'FARM';
  icon: string;
  color: string;
  desc_en: string;
  desc_kn: string;
  distance_en: string;
  distance_kn: string;
  timings_en?: string;
  timings_kn?: string;
  phone?: string;
  coords: { lat: number; lng: number };
  verified: boolean;
  map_url?: string;
  anime_image?: string;
  anime_title_en?: string;
  anime_title_kn?: string;
}

// Authentic Verified Landmarks for Muttagundi, Hosadurga Taluk, Chitradurga District
export const VERIFIED_VILLAGE_LOCATIONS: MapLocationItem[] = [
  {
    id: 'mtg_temple_thimmappa',
    name_en: 'Sri Lakshmi Thimmappa Swamy Temple',
    name_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
    category: 'TEMPLE',
    icon: '🛕',
    color: '#059669',
    desc_en: 'Sacred historic shrine of Lord Sri Lakshmi Thimmappa Swamy in Muttagundi, revered village deity and holy pilgrimage site.',
    desc_kn: 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ಪವಿತ್ರ ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ, ಗ್ರಾಮಸ್ಥರ ಆರಾಧ್ಯ ದೈವ ಹಾಗೂ ಭಕ್ತರ ಶ್ರದ್ಧಾ ಕೇಂದ್ರ.',
    distance_en: 'North-East Side',
    distance_kn: 'ಈಶಾನ್ಯ ಭಾಗ',
    timings_en: 'Open all day for darshan',
    timings_kn: 'ದಿನವಿಡೀ ದರ್ಶನ ಲಭ್ಯ',
    coords: { lat: 13.7572, lng: 76.3342 },
    map_url: 'https://maps.app.goo.gl/aekVSfTPkpzUh2hj9?g_st=aw',
    verified: true,
    anime_image: '/anime/stone_shrine.jpg',
    anime_title_en: 'Sri Lakshmi Thimmappa Swamy Temple (Anime 3D)',
    anime_title_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ (ಅನಿಮೆ 3D)'
  },
  {
    id: 'mtg_temple_anjaneya',
    name_en: 'Sri Anjaneya Swamy Temple (Gopuram)',
    name_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ (ಗೋಪುರ)',
    category: 'TEMPLE',
    icon: '🛕',
    color: '#F59E0B',
    desc_en: 'Sacred shrine of Lord Anjaneya Swamy with ornate colorful Dravidian tiered Gopuram and regular pooja celebrations.',
    desc_kn: 'ಗ್ರಾಮದ ಪವಿತ್ರ ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ಸನ್ನಿಧಿ, ವರ್ಣರಂಜಿತ ದ್ರಾವಿಡ ಶೈಲಿಯ ಶಿಖರ ಗೋಪುರ ಹಾಗೂ ವಿಶೇಷ ಪೂಜಾ ಕೈಂಕರ್ಯಗಳು.',
    distance_en: 'East Ward',
    distance_kn: 'ಪೂರ್ವ ಬಡಾವಣೆ',
    timings_en: '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦ & ಸಂಜೆ ೫:೩೦ - ೮:೩೦',
    coords: { lat: 13.7565, lng: 76.3340 },
    map_url: 'https://maps.app.goo.gl/njPyjtKZy3bfkx4s8?g_st=ac',
    verified: true,
    anime_image: '/anime/temple_gopuram.jpg',
    anime_title_en: 'Sri Anjaneya Swamy Gopuram (Anime 3D)',
    anime_title_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ ಗೋಪುರ (ಅನಿಮೆ 3D)'
  },
  {
    id: 'mtg_temple_kalle_devar',
    name_en: 'Sri Kalleshwara Swamy Temple (Kalle Devaru)',
    name_kn: 'ಕಲ್ಲೇ ದೇವರ ಗುಡಿ (ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ)',
    category: 'TEMPLE',
    icon: '🛕',
    color: '#8B5CF6',
    desc_en: 'Traditional sacred village deity stone shrine of Sri Kalleshwara Swamy, beside the electric tower and water pond.',
    desc_kn: 'ಗ್ರಾಮದ ಶ್ರದ್ಧಾ ಕೇಂದ್ರವಾದ ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ (ಕಲ್ಲೇ ದೇವರ ಗುಡಿ), ವಿದ್ಯುತ್ ಗೋಪುರ ಮತ್ತು ಕೆರೆಯ ಸನ್ನಿಧಿ.',
    distance_en: 'South Side',
    distance_kn: 'ದಕ್ಷಿಣ ಭಾಗ',
    timings_en: 'Open all day for darshan',
    timings_kn: 'ದಿನವಿಡೀ ದರ್ಶನ ಲಭ್ಯ',
    coords: { lat: 13.756878, lng: 76.333628 },
    map_url: 'https://maps.app.goo.gl/6P79MeqguXf8jnMm6?g_st=ac',
    verified: true,
    anime_image: '/anime/kalleshwara.jpg',
    anime_title_en: 'Sri Kalleshwara Swamy Temple (Anime 3D)',
    anime_title_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ಗುಡಿ & ಗೋಪುರ (ಅನಿಮೆ 3D)'
  },
  {
    id: 'mtg_school',
    name_en: 'Govt Lower Primary School Muttagondi',
    name_kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ತಾಗೊಂದಿ',
    category: 'SCHOOL',
    icon: '🏫',
    color: '#3B82F6',
    desc_en: 'Village lower primary school with Karnataka flag insignia, classrooms, shaded veranda, and mid-day meal scheme.',
    desc_kn: 'ಕನ್ನಡ ಧ್ವಜ ಲಾಂಛನವಿರುವ ಗ್ರಾಮದ ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ, ಮಕ್ಕಳಿಗೆ ಬಿಸಿಯೂಟ ಮತ್ತು ಶಾಲಾ ಆವರಣ.',
    distance_en: 'School Road',
    distance_kn: 'ಶಾಲೆ ರಸ್ತೆ',
    timings_en: '9:30 AM - 4:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೯:೩೦ - ಸಂಜೆ ೪:೩೦',
    coords: { lat: 13.7554, lng: 76.3330 },
    map_url: 'https://maps.app.goo.gl/fcnALXpVzfTrZ3UG6?g_st=aw',
    verified: true,
    anime_image: '/anime/school.jpg',
    anime_title_en: 'Govt Lower Primary School Muttagondi (Anime 3D)',
    anime_title_kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ (ಅನಿಮೆ 3D)'
  },
  {
    id: 'mtg_anganwadi',
    name_en: 'Anganwadi Kendra Muttagondi',
    name_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ',
    category: 'HEALTH',
    icon: '👶',
    color: '#EC4899',
    desc_en: 'Early childhood nutrition, preschool education, cheerful painted educational facade, and mother-child care.',
    desc_kn: 'ಚಿಣ್ಣರ ವರ್ಣರಂಜಿತ ಶಾಲಾಪೂರ್ವ ಶಿಕ್ಷಣ, ಪೌಷ್ಟಿಕ ಆಹಾರ ಹಾಗೂ ತಾಯಿ-ಮಕ್ಕಳ ಆರೈಕೆ ಕೇಂದ್ರ.',
    distance_en: 'Hospital Road',
    distance_kn: 'ಆಸ್ಪತ್ರೆ ರಸ್ತೆ',
    timings_en: '9:00 AM - 4:00 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೯:೦೦ - ಸಂಜೆ ೪:೦೦',
    phone: '108',
    coords: { lat: 13.755753, lng: 76.333753 },
    map_url: 'https://maps.app.goo.gl/macDiSpwTv3XUxNfA?g_st=ac',
    verified: true,
    anime_image: '/anime/anganwadi.jpg',
    anime_title_en: 'Anganwadi Children Center (Anime 3D)',
    anime_title_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ (ಅನಿಮೆ 3D)'
  },
  {
    id: 'mtg_panchayat',
    name_en: 'Muttagondi Community Hall & Shops',
    name_kn: 'ಮುತ್ತಾಗೊಂದಿ ಸಮುದಾಯ ಭವನ & ಅಂಗಡಿಗಳು',
    category: 'HALL',
    icon: '🏛️',
    color: '#10B981',
    desc_en: 'Village community hall, public meetings, gathering space, and local shops.',
    desc_kn: 'ಗ್ರಾಮ ಸಮುದಾಯ ಭವನ, ಸಾರ್ವಜನಿಕ ಸಭೆಗಳು, ಶುಭ ಸಮಾರಂಭ ಹಾಗೂ ಸ್ಥಳೀಯ ಅಂಗಡಿಗಳು.',
    distance_en: 'Village Center',
    distance_kn: 'ಗ್ರಾಮ ಕೇಂದ್ರ',
    timings_en: '8:00 AM - 9:00 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೮:೦೦ - ರಾತ್ರಿ ೯:೦೦',
    phone: '+91 7483254968',
    coords: { lat: 13.7562, lng: 76.3335 },
    map_url: 'https://maps.app.goo.gl/sAMg2991XNuzLqNt6?g_st=ac',
    verified: true
  },
  {
    id: 'mtg_water_plant',
    name_en: 'Shuddha Neeru Ghataka (RO Water Plant)',
    name_kn: 'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕ',
    category: 'WATER',
    icon: '💧',
    color: '#06B6D4',
    desc_en: '24/7 clean drinking water dispensing facility for all village families.',
    desc_kn: 'ಗ್ರಾಮಸ್ಥರಿಗೆ ೨೪ ಗಂಟೆ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕ.',
    distance_en: 'Near Tank Bund',
    distance_kn: 'ಕೆರೆ ಏರಿ ಹತ್ತಿರ',
    timings_en: '24 Hours Open',
    timings_kn: '೨೪ ಗಂಟೆ ಲಭ್ಯ',
    coords: { lat: 13.7560, lng: 76.3332 },
    verified: true
  },
  {
    id: 'mtg_bus_stop',
    name_en: 'Muttagundi Bus Stop (Hosadurga Road)',
    name_kn: 'ಮುತ್ತಗುಂಡಿ ಬಸ್ ನಿಲ್ದಾಣ (ಹೊಸದುರ್ಗ ಮುಖ್ಯರಸ್ತೆ)',
    category: 'BUS',
    icon: '🚌',
    color: '#EC4899',
    desc_en: 'KSRTC and private bus connectivity to Hosadurga, Chitradurga and Holalkere.',
    desc_kn: 'ಹೊಸದುರ್ಗ, ಚಿತ್ರದುರ್ಗ ಹಾಗೂ ಹೊಳಲ್ಕೆರೆಗೆ ನೇರ ಬಸ್ ಸಂಪರ್ಕ ನಿಲ್ದಾಣ.',
    distance_en: 'Main Road Junction',
    distance_kn: 'ಮುಖ್ಯ ರಸ್ತೆ ವೃತ್ತ',
    timings_en: 'Frequent Buses 6:00 AM - 9:00 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೬:೦೦ ರಿಂದ ರಾತ್ರಿ ೯:೦೦ ರವರೆಗೆ ಬಸ್ ಸಂಚಾರ',
    coords: { lat: 13.7570, lng: 76.3345 },
    verified: true
  },
  {
    id: 'mtg_farms',
    name_en: 'Arecanut & Coconut Farms',
    name_kn: 'ಅಡಿಕೆ ಮತ್ತು ತೆಂಗಿನ ತೋಟ',
    category: 'FARM',
    icon: '🌴',
    color: '#16A34A',
    desc_en: 'Lush green arecanut plantations, coconut groves, and drip-irrigated farmland.',
    desc_kn: 'ಸಮೃದ್ಧ ಹಸಿರಿನ ಅಡಿಕೆ ತೋಟಗಳು, ತೆಂಗಿನ ಮರಗಳು ಹಾಗೂ ಹನಿ ನೀರಾವರಿ ಕೃಷಿ ಭೂಮಿ.',
    distance_en: 'West & South Outskirts',
    distance_kn: 'ಪಶ್ಚಿಮ ಮತ್ತು ದಕ್ಷಿಣ ಹೊರವಲಯ',
    timings_en: 'Open Field Area',
    timings_kn: 'ಮುಕ್ತ ಕೃಷಿ ಪ್ರದೇಶ',
    coords: { lat: 13.7550, lng: 76.3320 },
    verified: true
  }
];

export function getCategoryIcon(cat: string): string {
  switch (cat) {
    case 'TEMPLE': return '🛕';
    case 'SCHOOL': return '🏫';
    case 'HEALTH': return '🏥';
    case 'SPORTS': return '🏏';
    case 'BUS': return '🚌';
    case 'WATER': return '💧';
    case 'BANK': return '🏦';
    case 'HALL': return '🏛️';
    case 'EMERGENCY': return '🚨';
    case 'FARM': return '🌴';
    default: return '📍';
  }
}

export function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'TEMPLE': return '#F59E0B';
    case 'SCHOOL': return '#3B82F6';
    case 'HEALTH': return '#EF4444';
    case 'SPORTS': return '#8B5CF6';
    case 'BUS': return '#EC4899';
    case 'WATER': return '#06B6D4';
    case 'BANK': return '#6366F1';
    case 'HALL': return '#10B981';
    case 'EMERGENCY': return '#DC2626';
    case 'FARM': return '#16A34A';
    default: return '#10B981';
  }
}

// Haversine formula for exact distance in kilometers
function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface VillageMapViewProps {
  onNavigateTo3D?: () => void;
}

export const VillageMapView: React.FC<VillageMapViewProps> = ({ onNavigateTo3D }) => {
  const { isKannada } = useLanguage();

  const [locations, setLocations] = useState<MapLocationItem[]>(() => {
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

  const { isAdmin, isModerator, currentUser, role } = useAuth();
  const [editingLocation, setEditingLocation] = useState<MapLocationItem | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<MapLocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Device GPS State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Map view mode: 'roadmap' or 'satellite' (simple 2D toggle)
  const [viewMode, setViewMode] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isFocusedOnUser, setIsFocusedOnUser] = useState(false);

  // Suggest Modal Form
  const [suggestName, setSuggestName] = useState('');
  const [suggestCategory, setSuggestCategory] = useState('SHOP');
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestPhone, setSuggestPhone] = useState('');
  const [suggestTimings, setSuggestTimings] = useState('');
  const [suggestLat, setSuggestLat] = useState('');
  const [suggestLng, setSuggestLng] = useState('');
  const [suggestSubmitted, setSuggestSubmitted] = useState(false);

  // Back navigation modal hooks
  useEffect(() => {
    if (editingLocation) {
      const dismiss = backNavigation.pushModal('editLocationModal', () => setEditingLocation(null));
      return () => dismiss();
    }
  }, [editingLocation]);

  useEffect(() => {
    if (isAddLocationModalOpen) {
      const dismiss = backNavigation.pushModal('isAddLocationModalOpen', () => setIsAddLocationModalOpen(false));
      return () => dismiss();
    }
  }, [isAddLocationModalOpen]);

  // Subscribe to real-time synchronized map locations from dbService & Firestore
  useEffect(() => {
    const unsub = dbService.subscribeMapLocations((items) => {
      setLocations(items);
    });
    return unsub;
  }, []);

  // One-time GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocError(isKannada ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಜಿಪಿಎಸ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ' : 'Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy)
        });
        setIsLocating(false);
        setSortByNearest(true);
      },
      (error) => {
        setIsLocating(false);
        let msg = isKannada ? 'ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಲು ವಿಫಲವಾಗಿದೆ' : 'Unable to retrieve location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = isKannada ? 'ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಥಳಾವಕಾಶ (Location) ಅನುಮತಿ ನೀಡಿ' : 'Please allow Location permission in your browser/device settings';
        } else if (error.code === error.TIMEOUT) {
          msg = isKannada ? 'ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚುವ ಸಮಯ ಮೀರಿದೆ. ಮರುಪ್ರಯತ್ನಿಸಿ.' : 'Location request timed out. Please retry.';
        }
        setLocError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  // Toggle Continuous Watch
  const toggleLiveTracking = () => {
    if (isWatchingLocation) {
      setIsWatchingLocation(false);
      return;
    }
    if (!navigator.geolocation) return;

    setIsWatchingLocation(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
      },
      () => {
        setIsWatchingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const categories = [
    { id: 'ALL', label_en: 'All Places', label_kn: 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು', icon: '📍' },
    { id: 'TEMPLE', label_en: 'Temples', label_kn: 'ದೇವಸ್ಥಾನಗಳು', icon: '🛕' },
    { id: 'SCHOOL', label_en: 'Schools', label_kn: 'ಶಾಲೆಗಳು', icon: '🏫' },
    { id: 'HEALTH', label_en: 'Health & Anganwadi', label_kn: 'ಆರೋಗ್ಯ & ಅಂಗನವಾಡಿ', icon: '👶' },
    { id: 'WATER', label_en: 'Water Plants', label_kn: 'ಕುಡಿಯುವ ನೀರು', icon: '💧' },
    { id: 'HALL', label_en: 'Community Hall', label_kn: 'ಭವನ & ಅಂಗಡಿ', icon: '🏛️' },
    { id: 'BUS', label_en: 'Bus Stops', label_kn: 'ಬಸ್ ನಿಲ್ದಾಣ', icon: '🚌' },
    { id: 'FARM', label_en: 'Agriculture', label_kn: 'ಕೃಷಿ & ತೋಟ', icon: '🌴' }
  ];

  // Filter and sort locations
  const filtered = locations
    .filter((loc) => {
      const matchCat = selectedCategory === 'ALL' || loc.category === selectedCategory;
      const matchSearch =
        loc.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.name_kn.includes(searchQuery) ||
        loc.desc_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.desc_kn.includes(searchQuery);
      return matchCat && matchSearch;
    })
    .map((loc) => {
      if (userCoords) {
        const km = calculateHaversineDistanceKm(
          userCoords.lat,
          userCoords.lng,
          loc.coords.lat,
          loc.coords.lng
        );
        let distText = `${km.toFixed(2)} km`;
        if (km < 1) {
          distText = `${Math.round(km * 1000)} meters`;
        }
        return { ...loc, exactKm: km, formattedDistance: distText };
      }
      return { ...loc, exactKm: 999, formattedDistance: loc.distance_en };
    });

  if (sortByNearest && userCoords) {
    filtered.sort((a, b) => (a.exactKm || 999) - (b.exactKm || 999));
  }

  // Active Coordinates to display on map
  const activeLat = isFocusedOnUser && userCoords ? userCoords.lat : selectedLocation?.coords.lat || 13.7562;
  const activeLng = isFocusedOnUser && userCoords ? userCoords.lng : selectedLocation?.coords.lng || 76.3335;

  // Google Maps Directions link from user's current GPS location
  const getGoogleMapsDirectionsUrl = (loc: MapLocationItem, mode: 'driving' | 'walking' = 'driving') => {
    if (userCoords) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${loc.coords.lat},${loc.coords.lng}&travelmode=${mode}`;
    }
    if (loc.map_url) {
      return loc.map_url;
    }
    return `https://www.google.com/maps/search/?api=1&query=${loc.coords.lat},${loc.coords.lng}`;
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName.trim()) return;

    const lat = suggestLat ? parseFloat(suggestLat) : userCoords ? userCoords.lat : 13.7562;
    const lng = suggestLng ? parseFloat(suggestLng) : userCoords ? userCoords.lng : 76.3335;

    const newLoc: MapLocationItem = {
      id: 'loc_' + Date.now(),
      name_en: suggestName.trim(),
      name_kn: suggestName.trim(),
      category: suggestCategory as any,
      icon: getCategoryIcon(suggestCategory),
      color: getCategoryColor(suggestCategory),
      desc_en: suggestDesc.trim() || 'Landmark in Muttagundi, Hosadurga',
      desc_kn: suggestDesc.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ಸಾರ್ವಜನಿಕ ಸ್ಥಳ',
      distance_en: 'Muttagundi',
      distance_kn: 'ಮುತ್ತಗುಂಡಿ',
      timings_en: suggestTimings.trim() || undefined,
      timings_kn: suggestTimings.trim() || undefined,
      phone: suggestPhone.trim() || undefined,
      coords: { lat, lng },
      verified: true
    };

    const updated = [newLoc, ...locations];
    setLocations(updated);
    setSelectedLocation(newLoc);
    localStorage.setItem('muttagundi_map_locations', JSON.stringify(updated));

    realtimeSync.broadcast('MAP_LOCATION_ADDED' as any, newLoc);

    setSuggestSubmitted(true);
    setTimeout(() => {
      setSuggestSubmitted(false);
      setShowSuggestModal(false);
      setSuggestName('');
      setSuggestDesc('');
      setSuggestPhone('');
      setSuggestTimings('');
      setSuggestLat('');
      setSuggestLng('');
    }, 1200);
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
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: '18px',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.28) 0%, rgba(37, 99, 235, 0.2) 100%)',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            fontWeight: 900,
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
          }}
        >
          <MapIcon size={18} color="#60A5FA" />
          <span>{isKannada ? '🗺️ ಗ್ರಾಮ ನಕ್ಷೆ & ಜಿಪಿಎಸ್ (ಸಕ್ರಿಯ)' : '🗺️ Village Map & GPS (Active)'}</span>
        </button>

        <button
          onClick={onNavigateTo3D}
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
          <Sparkles size={18} color="#FBBF24" />
          <span>{isKannada ? '🌐 3D ಗ್ರಾಮ ದರ್ಶನಕ್ಕೆ ಹೋಗಿ' : '🌐 Switch to 3D Village View'}</span>
        </button>
      </div>

      {/* 2. SECTION TITLE & DESCRIPTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>🗺️</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ನಕ್ಷೆ & ಜಿಪಿಎಸ್' : 'Muttagundi Village Map & GPS'}
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0 }}>
            {isKannada
              ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಳ, ಗ್ರಾಮದ ಪ್ರಮುಖ ಸ್ಥಳಗಳು, ನಿಖರ ದೂರ ಮತ್ತು ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ದಾರಿ'
              : 'Live device GPS tracking, local village landmarks, and turn-by-turn Google Maps navigation'}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onNavigateTo3D && (
            <button
              onClick={onNavigateTo3D}
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#A78BFA',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🌐</span>
              <span>{isKannada ? '3D ಗ್ರಾಮ ದರ್ಶನ' : '3D Village View'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (userCoords) {
                setSuggestLat(userCoords.lat.toFixed(6));
                setSuggestLng(userCoords.lng.toFixed(6));
              }
              if (isAdmin || isModerator) {
                setIsAddLocationModalOpen(true);
              } else {
                setShowSuggestModal(true);
              }
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            <span>
              {isKannada
                ? (isAdmin || isModerator ? 'ಹೊಸ ಸ್ಥಳ ಸೇರಿಸಿ (Admin)' : 'ಹೊಸ ಸ್ಥಳ ಸೂಚಿಸಿ')
                : (isAdmin || isModerator ? '+ Add Landmark' : '+ Add Place')}
            </span>
          </button>
        </div>
      </div>

      {/* 3. LIVE GPS DEVICE LOCATION STATUS BAR */}
      <div
        style={{
          background: userCoords ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${userCoords ? '#10B981' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '18px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: userCoords ? '#10B981' : '#3B82F6',
              boxShadow: userCoords ? '0 0 12px #10B981' : 'none',
              animation: 'pulse 1.8s infinite'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '0.92rem', color: '#FFFFFF' }}>
                {userCoords
                  ? (isKannada
                      ? `📍 ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಳ ಲಭ್ಯವಿದೆ (ನಿಖರತೆ: ±${userCoords.accuracy} ಮೀ)`
                      : `📍 Live GPS Detected (Accuracy: ±${userCoords.accuracy}m)`)
                  : (isKannada
                      ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಿ ನಿಖರ ದೂರ ಮತ್ತು ದಾರಿ ತಿಳಿಯಿರಿ'
                      : 'Detect your current GPS location to find exact distances')}
              </strong>
              {isWatchingLocation && (
                <span
                  style={{
                    background: '#10B981',
                    color: '#070F1E',
                    fontWeight: 900,
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  LIVE TRACKING
                </span>
              )}
            </div>

            <span style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
              {userCoords
                ? (isKannada
                    ? `ಸ್ಥಳಾಂಕ: ${userCoords.lat.toFixed(5)}° N, ${userCoords.lng.toFixed(5)}° E (ಮುತ್ತಗುಂಡಿ, ಹೊಸದುರ್ಗ)`
                    : `Coordinates: ${userCoords.lat.toFixed(5)}° N, ${userCoords.lng.toFixed(5)}° E (Hosadurga Taluk)`)
                : (isKannada
                    ? 'ಮೊಬೈಲ್ ಅಥವಾ ಬ್ರೌಸರ್ ಸ್ಥಳಾವಕಾಶ ಸಕ್ರಿಯಗೊಳಿಸಿ'
                    : 'Turn on device location permissions for real-time turn-by-turn guidance')}
            </span>
          </div>
        </div>

        {/* Location Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="btn-primary"
            style={{
              padding: '7px 14px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LocateFixed size={15} />
            <span>
              {isLocating
                ? (isKannada ? 'ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ...' : 'Locating...')
                : (isKannada ? 'ನನ್ನ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಿ' : 'Detect My Location')}
            </span>
          </button>

          {userCoords && (
            <>
              <button
                onClick={() => setIsFocusedOnUser(true)}
                style={{
                  background: isFocusedOnUser ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {isKannada ? '🎯 ನಕ್ಷೆಯಲ್ಲಿ ನನ್ನ ಸ್ಥಾನ' : '🎯 Show Me on Map'}
              </button>

              <button
                onClick={toggleLiveTracking}
                style={{
                  background: isWatchingLocation ? '#EF4444' : 'rgba(255,255,255,0.06)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {isWatchingLocation
                  ? (isKannada ? 'ಟ್ರ್ಯಾಕಿಂಗ್ ನಿಲ್ಲಿಸಿ' : 'Stop Live')
                  : (isKannada ? 'ಲೈವ್ ಟ್ರ್ಯಾಕ್' : 'Live Track')}
              </button>
            </>
          )}
        </div>
      </div>

      {locError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#FCA5A5', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} color="#EF4444" />
          <span>{locError}</span>
        </div>
      )}

      {/* 4. 🗺️ CLEAN EMBEDDED GOOGLE MAP VIEWER */}
      <div
        className="glass-card"
        style={{
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: '#0B1528'
        }}
      >
        {/* Map Header Controls */}
        <div
          style={{
            padding: '12px 18px',
            background: 'rgba(7, 15, 30, 0.92)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>
              {isFocusedOnUser ? '📍' : selectedLocation ? selectedLocation.icon : '🏛️'}
            </span>
            <div>
              <strong style={{ fontSize: '0.92rem', color: '#FFFFFF', display: 'block' }}>
                {isFocusedOnUser
                  ? (isKannada ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಾನ' : 'Your Live GPS Location')
                  : (selectedLocation ? (isKannada ? selectedLocation.name_kn : selectedLocation.name_en) : 'Muttagundi Village')}
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                {activeLat.toFixed(4)}° N, {activeLng.toFixed(4)}° E • {isKannada ? 'ಹೊಸದುರ್ಗ ತಾಲೂಕು, ಚಿತ್ರದುರ್ಗ' : 'Hosadurga, Chitradurga'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* View Mode Toggle: Roadmap vs Satellite */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '2px' }}>
              <button
                onClick={() => setViewMode('roadmap')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: viewMode === 'roadmap' ? '#10B981' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>🗺️</span>
                <span>{isKannada ? 'ರಸ್ತೆ ನಕ್ಷೆ' : 'Road Map'}</span>
              </button>
              <button
                onClick={() => setViewMode('satellite')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: viewMode === 'satellite' ? '#10B981' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>🛰️</span>
                <span>{isKannada ? 'ಉಪಗ್ರಹ ನೋಟ' : 'Satellite'}</span>
              </button>
            </div>

            {/* Open Active in Google Maps Native App */}
            <a
              href={
                isFocusedOnUser && userCoords
                  ? `https://www.google.com/maps/search/?api=1&query=${userCoords.lat},${userCoords.lng}`
                  : (selectedLocation?.map_url || `https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`)
              }
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                borderRadius: '14px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
              }}
            >
              <ExternalLink size={14} />
              <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಆಪ್‌ನಲ್ಲಿ ನೋಡಿ' : 'Open Google Maps App'}</span>
            </a>
          </div>
        </div>

        {/* Embedded Google Map Iframe */}
        <div style={{ width: '100%', height: '420px', position: 'relative', background: '#0F1D36' }}>
          <iframe
            title="Google Maps Village Viewer"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${activeLat},${activeLng}&t=${viewMode === 'satellite' ? 'k' : 'm'}&z=16&ie=UTF8&iwloc=&output=embed`}
          />
        </div>
      </div>

      {/* 5. SEARCH & CATEGORY PILLS */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search
          size={18}
          color="#94A3B8"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isKannada ? 'ಸ್ಥಳ ಹುಡುಕಿ (ದೇವಸ್ಥಾನ, ಶಾಲೆ, ಆಸ್ಪತ್ರೆ, ನೀರಿನ ಘಟಕ, ಬಸ್)...' : 'Search village places (temple, school, clinic, water, bus)...'}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 14px 12px 42px',
            color: '#FFFFFF',
            fontSize: '0.92rem'
          }}
        />
      </div>

      {/* Category Pills Strip */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '16px'
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#FFFFFF' : '#CBD5E1',
                border: `1px solid ${isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '24px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{cat.icon}</span>
              <span>{isKannada ? cat.label_kn : cat.label_en}</span>
            </button>
          );
        })}
      </div>

      {/* 6. SELECTED LOCATION CARD */}
      {selectedLocation && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${selectedLocation.color}`,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 12px 30px rgba(0, 0, 0, 0.4), 0 0 24px ${selectedLocation.color}22`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '12px' }}>
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
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
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

                {/* Distance Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '0.84rem', marginTop: '4px' }}>
                  <MapPin size={15} color={selectedLocation.color} />
                  <strong style={{ color: userCoords ? '#34D399' : '#CBD5E1' }}>
                    {userCoords
                      ? `${(selectedLocation as any).formattedDistance || selectedLocation.distance_en} ${isKannada ? 'ನಿಮ್ಮ ಸ್ಥಳದಿಂದ' : 'from your GPS'}`
                      : (isKannada ? selectedLocation.distance_kn : selectedLocation.distance_en)}
                  </strong>
                  <span style={{ color: '#64748B' }}>•</span>
                  <span style={{ color: '#64748B', fontSize: '0.78rem' }}>
                    {selectedLocation.coords.lat.toFixed(4)}° N, {selectedLocation.coords.lng.toFixed(4)}° E
                  </span>
                </div>
              </div>
            </div>

            {/* Google Maps Actions & 3D Jump */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedLocation.phone && (
                <a
                  href={`tel:${selectedLocation.phone}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PhoneCall size={14} color="#34D399" />
                  <span>{isKannada ? 'ಕರೆ' : 'Call'}</span>
                </a>
              )}

              {/* Official Google Maps Link */}
              {selectedLocation.map_url && (
                <a
                  href={selectedLocation.map_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '8px 16px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  <ExternalLink size={15} />
                  <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಲಿಂಕ್' : 'View on Google Maps'}</span>
                </a>
              )}

              {/* Driving Directions */}
              <a
                href={getGoogleMapsDirectionsUrl(selectedLocation, 'driving')}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: selectedLocation.color,
                  color: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: `0 4px 14px ${selectedLocation.color}44`
                }}
              >
                <Compass size={16} />
                <span>{isKannada ? 'ವಾಹನ ದಾರಿ' : 'Drive Directions'}</span>
              </a>

              {/* Walking Directions */}
              <a
                href={getGoogleMapsDirectionsUrl(selectedLocation, 'walking')}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '24px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Navigation size={14} />
                <span>{isKannada ? 'ಕಾಲುದಾರಿ' : 'Walk'}</span>
              </a>

              {/* View in 3D Village Button */}
              {onNavigateTo3D && (
                <button
                  onClick={onNavigateTo3D}
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
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
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  <span>🌐</span>
                  <span>{isKannada ? '3D ಗ್ರಾಮದಲ್ಲಿ ನೋಡಿ' : 'View in 3D'}</span>
                </button>
              )}

              {/* Admin Actions: Edit & Delete */}
              {(isAdmin || isModerator) && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLocation(selectedLocation);
                    }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.16)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#F59E0B',
                      borderRadius: '24px',
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit3 size={14} />
                    <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmMsg = isKannada
                        ? `ಈ ಸ್ಥಳವನ್ನು (${selectedLocation.name_kn || selectedLocation.name_en}) ನಕ್ಷೆಯಿಂದ ಖಚಿತವಾಗಿ ಅಳಿಸಬೇಕೇ?`
                        : `Are you sure you want to delete "${selectedLocation.name_en}" from the map?`;
                      if (window.confirm(confirmMsg)) {
                        await dbService.deleteMapLocation(selectedLocation.id, currentUser?.uid, role || 'ADMIN');
                        setSelectedLocation(null);
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#EF4444',
                      borderRadius: '24px',
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>{isKannada ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 12px 0' }}>
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

      {/* 7. LOCATIONS DIRECTORY CARDS GRID */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <MapPin size={42} color="#10B981" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            {isKannada ? 'ಯಾವುದೇ ಸ್ಥಳ ಕಂಡುಬಂದಿಲ್ಲ' : 'No Places Found'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px' }}>
            {isKannada
              ? 'ಬೇರೆ ಕೀವರ್ಡ್ ಬಳಸಿ ಹುಡುಕಿ ಅಥವಾ ಹೊಸ ಸ್ಥಳವನ್ನು ನಕ್ಷೆಗೆ ಸೇರಿಸಿ.'
              : 'Try searching another keyword, or add a landmark using your GPS.'}
          </p>
          <button onClick={() => setShowSuggestModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} />
            <span>{isKannada ? 'ಸ್ಥಳ ಸೇರಿಸಿ' : 'Add Landmark'}</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => {
                  setSelectedLocation(loc);
                  setIsFocusedOnUser(false);
                }}
                style={{
                  background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isSelected ? loc.color : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 4px 20px ${loc.color}22` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{loc.icon}</span>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 2px 0', color: '#FFFFFF' }}>
                        {isKannada ? loc.name_kn : loc.name_en}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: userCoords ? '#34D399' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                        <MapPin size={13} color={loc.color} />
                        {userCoords
                          ? `${(loc as any).formattedDistance} ${isKannada ? 'ದೂರ' : 'away'}`
                          : (isKannada ? loc.distance_kn : loc.distance_en)}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      background: `${loc.color}22`,
                      color: loc.color,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${loc.color}44`
                    }}
                  >
                    {loc.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#CBD5E1', margin: '10px 0 12px', lineHeight: 1.4 }}>
                  {isKannada ? loc.desc_kn : loc.desc_en}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {loc.timings_en || (isKannada ? 'ಯಾವಾಗಲೂ ಲಭ್ಯ' : 'Always open')}
                  </span>
                  <a
                    href={getGoogleMapsDirectionsUrl(loc, 'driving')}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '12px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Compass size={12} />
                    <span>{isKannada ? 'ದಾರಿ' : 'Directions'}</span>
                  </a>
                </div>

                {/* Admin Actions: Edit & Delete */}
                {(isAdmin || isModerator) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px dashed rgba(245, 158, 11, 0.3)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLocation(loc);
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(245, 158, 11, 0.16)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        color: '#F59E0B',
                        borderRadius: '8px',
                        padding: '5px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit3 size={12} />
                      <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmMsg = isKannada
                          ? `ಈ ಸ್ಥಳವನ್ನು (${loc.name_kn || loc.name_en}) ನಕ್ಷೆಯಿಂದ ಖಚಿತವಾಗಿ ಅಳಿಸಬೇಕೇ?`
                          : `Are you sure you want to delete "${loc.name_en}" from map?`;
                        if (window.confirm(confirmMsg)) {
                          await dbService.deleteMapLocation(loc.id, currentUser?.uid, role || 'ADMIN');
                          if (selectedLocation?.id === loc.id) {
                            setSelectedLocation(null);
                          }
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#EF4444',
                        borderRadius: '8px',
                        padding: '5px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={isKannada ? 'ಅಳಿಸಿ' : 'Delete'}
                    >
                      <Trash2 size={12} />
                      <span>{isKannada ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 8. ADD NEW PLACE MODAL */}
      {showSuggestModal && (
        <div
          onClick={() => setShowSuggestModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(7, 15, 30, 0.85)',
            backdropFilter: 'blur(10px)',
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
              maxWidth: '520px',
              background: '#0B132B',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>📍</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {isKannada ? 'ಗ್ರಾಮ ನಕ್ಷೆಗೆ ಹೊಸ ಸ್ಥಳ ಸೇರಿಸಿ' : 'Add Landmark to Village Map'}
                </h3>
              </div>
              <button
                onClick={() => setShowSuggestModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {suggestSubmitted ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
                <h4 style={{ color: '#10B981', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                  {isKannada ? 'ಸ್ಥಳ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!' : 'Landmark Added Successfully!'}
                </h4>
                <p style={{ color: '#94A3B8', fontSize: '0.84rem' }}>
                  {isKannada ? 'ಗ್ರಾಮಸ್ಥರಿಗೆ ಈಗ ನಕ್ಷೆಯಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.' : 'It is now visible on the village map.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSuggestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಸ್ಥಳದ ಹೆಸರು *' : 'Place Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={suggestName}
                    onChange={(e) => setSuggestName(e.target.value)}
                    placeholder={isKannada ? 'ಉದಾ: ಶ್ರೀ ಬಸವೇಶ್ವರ ದೇವಸ್ಥಾನ, ಮುತ್ತು ಮೆಡಿಕಲ್ಸ್...' : 'e.g. Sri Basaveshwara Temple, Muthu Medicals...'}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      {isKannada ? 'ವರ್ಗ *' : 'Category *'}
                    </label>
                    <select
                      value={suggestCategory}
                      onChange={(e) => setSuggestCategory(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="TEMPLE">{isKannada ? '🛕 ದೇವಸ್ಥಾನ' : '🛕 Temple'}</option>
                      <option value="SCHOOL">{isKannada ? '🏫 ಶಾಲೆ / ಕಾಲೇಜು' : '🏫 School'}</option>
                      <option value="HEALTH">{isKannada ? '🏥 ಆಸ್ಪತ್ರೆ / ಕ್ಲಿನಿಕ್' : '🏥 Health'}</option>
                      <option value="SHOP">{isKannada ? '🛒 ಅಂಗಡಿ / ಮಾರುಕಟ್ಟೆ' : '🛒 Shop'}</option>
                      <option value="WATER">{isKannada ? '💧 ನೀರಿನ ಘಟಕ' : '💧 Water'}</option>
                      <option value="BUS">{isKannada ? '🚌 ಬಸ್ ನಿಲ್ದಾಣ' : '🚌 Bus Stop'}</option>
                      <option value="HALL">{isKannada ? '🏛️ ಭವನ / ಸಮುದಾಯ' : '🏛️ Community Hall'}</option>
                      <option value="FARM">{isKannada ? '🌴 ಕೃಷಿ ಕ್ಷೇತ್ರ' : '🌴 Farm'}</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      {isKannada ? 'ಸಂಪರ್ಕ ಫೋನ್ (ಐಚ್ಛಿಕ)' : 'Phone (Optional)'}
                    </label>
                    <input
                      type="tel"
                      value={suggestPhone}
                      onChange={(e) => setSuggestPhone(e.target.value)}
                      placeholder="+91..."
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವಿವರಣೆ' : 'Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={suggestDesc}
                    onChange={(e) => setSuggestDesc(e.target.value)}
                    placeholder={isKannada ? 'ಈ ಸ್ಥಳದ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ...' : 'Brief details about this location...'}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      Latitude (ಅಕ್ಷಾಂಶ)
                    </label>
                    <input
                      type="text"
                      value={suggestLat}
                      onChange={(e) => setSuggestLat(e.target.value)}
                      placeholder="13.7562"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: '0.84rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      Longitude (ರೇಖಾಂಶ)
                    </label>
                    <input
                      type="text"
                      value={suggestLng}
                      onChange={(e) => setSuggestLng(e.target.value)}
                      placeholder="76.3335"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: '0.84rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(false)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 18px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      padding: '10px 22px',
                      fontSize: '0.86rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={15} />
                    <span>{isKannada ? 'ಸ್ಥಳ ಸೇರಿಸಿ' : 'Save Landmark'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 🗺️ Admin Edit & Add Map Location Modals */}
      <EditMapLocationModal
        location={editingLocation}
        mode="edit"
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        onSaved={() => setEditingLocation(null)}
        onDeleted={() => {
          if (selectedLocation?.id === editingLocation?.id) {
            setSelectedLocation(null);
          }
          setEditingLocation(null);
        }}
      />

      <EditMapLocationModal
        location={null}
        mode="add"
        isOpen={isAddLocationModalOpen}
        onClose={() => setIsAddLocationModalOpen(false)}
        onSaved={(newLoc) => {
          setSelectedLocation(newLoc);
          setIsAddLocationModalOpen(false);
        }}
      />
    </div>
  );
};
