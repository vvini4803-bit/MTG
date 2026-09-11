import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { realtimeSync } from '../services/realtimeSync';
import { Village3DScene, LandmarkId } from '../components/3d/Village3DScene';
import {
  MapPin,
  Navigation,
  PhoneCall,
  Search,
  CheckCircle2,
  ExternalLink,
  Clock,
  Compass,
  LocateFixed,
  AlertCircle,
  Plus,
  X,
  Send,
  Layers,
  Share2,
  Maximize2,
  RefreshCw
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
}

// Authentic Verified Landmarks for Muttagundi, Hosadurga Taluk, Chitradurga District
export const VERIFIED_VILLAGE_LOCATIONS: MapLocationItem[] = [
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
    phone: '+91 98450 00001',
    coords: { lat: 13.8052, lng: 76.2915 },
    verified: true
  },
  {
    id: 'mtg_temple_anjaneya',
    name_en: 'Sri Anjaneya Swamy Temple',
    name_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ',
    category: 'TEMPLE',
    icon: '🛕',
    color: '#F59E0B',
    desc_en: 'Sacred shrine of Lord Anjaneya Swamy with regular pooja and festival celebrations.',
    desc_kn: 'ಗ್ರಾಮದ ಪವಿತ್ರ ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ಸನ್ನಿಧಿ ಹಾಗೂ ವಿಶೇಷ ಪೂಜಾ ಕೈಂಕರ್ಯಗಳು.',
    distance_en: 'East Ward',
    distance_kn: 'ಪೂರ್ವ ಬಡಾವಣೆ',
    timings_en: '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦ & ಸಂಜೆ ೫:೩೦ - ೮:೩೦',
    coords: { lat: 13.8061, lng: 76.2928 },
    verified: true
  },
  {
    id: 'mtg_temple_kalle_devar',
    name_en: 'Kalle Devar Gudi',
    name_kn: 'ಕಲ್ಲೇ ದೇವರ ಗುಡಿ',
    category: 'TEMPLE',
    icon: '🛕',
    color: '#8B5CF6',
    desc_en: 'Traditional sacred village deity shrine of Kalle Devaru.',
    desc_kn: 'ಗ್ರಾಮದ ಶ್ರದ್ಧಾ ಕೇಂದ್ರವಾದ ಕಲ್ಲೇ ದೇವರ ಗುಡಿ ಮತ್ತು ವಾರ್ಷಿಕ ಪೂಜಾ ಆಚರಣೆ.',
    distance_en: 'South Side',
    distance_kn: 'ದಕ್ಷಿಣ ಭಾಗ',
    timings_en: 'Open all day for darshan',
    timings_kn: 'ದಿನವಿಡೀ ದರ್ಶನ ಲಭ್ಯ',
    coords: { lat: 13.8070, lng: 76.2935 },
    verified: true
  },
  {
    id: 'mtg_school',
    name_en: 'Govt Primary School Muttagondi',
    name_kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ತಾಗೊಂದಿ',
    category: 'SCHOOL',
    icon: '🏫',
    color: '#3B82F6',
    desc_en: 'Primary education center, mid-day meal scheme, and children classrooms.',
    desc_kn: 'ಪ್ರಾಥಮಿಕ ಶಿಕ್ಷಣ, ಮಕ್ಕಳಿಗೆ ಬಿಸಿಯೂಟ ಮತ್ತು ಆಟದ ಮೈದಾನ.',
    distance_en: 'School Road',
    distance_kn: 'ಶಾಲೆ ರಸ್ತೆ',
    timings_en: '9:30 AM - 4:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೯:೩೦ - ಸಂಜೆ ೪:೩೦',
    coords: { lat: 13.8040, lng: 76.2905 },
    verified: true
  },
  {
    id: 'mtg_anganwadi',
    name_en: 'Anganwadi Kendra Muttagondi',
    name_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ',
    category: 'HEALTH',
    icon: '👶',
    color: '#FFB3D9',
    desc_en: 'Early childhood nutrition, preschool education, and mother & child welfare care.',
    desc_kn: 'ಮಕ್ಕಳ ಪೌಷ್ಟಿಕ ಆಹಾರ, ಶಾಲಾಪೂರ್ವ ಶಿಕ್ಷಣ ಹಾಗೂ ತಾಯಿ-ಮಕ್ಕಳ ಆರೈಕೆ ಕೇಂದ್ರ.',
    distance_en: 'Hospital Road',
    distance_kn: 'ಆಸ್ಪತ್ರೆ ರಸ್ತೆ',
    timings_en: '9:00 AM - 4:00 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ ೯:೦೦ - ಸಂಜೆ ೪:೦೦',
    phone: '108',
    coords: { lat: 13.8035, lng: 76.2898 },
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
    coords: { lat: 13.8048, lng: 76.2920 },
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
    coords: { lat: 13.8070, lng: 76.2935 },
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
    coords: { lat: 13.8055, lng: 76.2885 },
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
  const R = 6371; // Earth's radius in km
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

export const VillageMapView: React.FC = () => {
  const { isKannada } = useLanguage();

  const [locations, setLocations] = useState<MapLocationItem[]>(() => {
    try {
      const saved = localStorage.getItem('muttagundi_map_locations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep user-added custom places and ensure latest verified locations are always up-to-date
          const customPlaces = parsed.filter(
            (p: MapLocationItem) => !p.verified || !VERIFIED_VILLAGE_LOCATIONS.some((v) => v.id === p.id)
          );
          return [...VERIFIED_VILLAGE_LOCATIONS, ...customPlaces];
        }
      }
    } catch {}
    return VERIFIED_VILLAGE_LOCATIONS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<MapLocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Device Exact Location State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Map view mode: '3d', 'roadmap', or 'satellite'
  const [viewMode, setViewMode] = useState<'3d' | 'roadmap' | 'satellite'>('3d');
  const [isFocusedOnUser, setIsFocusedOnUser] = useState(false);

  // Sync selection from 3D Village model to locations list
  const handle3DLandmarkSelect = (landmarkId: LandmarkId) => {
    let match: MapLocationItem | undefined;
    if (landmarkId === 'temple') {
      match = locations.find((l) => l.id.includes('anjaneya') || (l.category === 'TEMPLE' && !l.id.includes('kalle')));
    } else if (landmarkId === 'temple1') {
      match = locations.find((l) => l.id.includes('kalle') || l.category === 'TEMPLE');
    } else if (landmarkId === 'panchayat') {
      match = locations.find((l) => l.category === 'HALL' || l.id.includes('panchayat') || l.id.includes('community'));
    } else if (landmarkId === 'school') {
      match = locations.find((l) => l.category === 'SCHOOL' || l.id.includes('school'));
    } else if (landmarkId === 'kindergarden' || landmarkId === 'clinic') {
      match = locations.find((l) => l.category === 'HEALTH' || l.id.includes('anganwadi') || l.id.includes('health'));
    } else if (landmarkId === 'farms') {
      match = locations.find((l) => l.category === 'FARM' || l.id.includes('farm'));
    } else if (landmarkId === 'water') {
      match = locations.find((l) => l.category === 'WATER' || l.id.includes('water'));
    } else if (landmarkId === 'sports') {
      match = locations.find((l) => l.category === 'SPORTS' || l.id.includes('sports'));
    }

    if (match) {
      setSelectedLocation(match);
      setIsFocusedOnUser(false);
    }
  };

  // Suggest Location Form
  const [suggestName, setSuggestName] = useState('');
  const [suggestCategory, setSuggestCategory] = useState('TEMPLE');
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestPhone, setSuggestPhone] = useState('');
  const [suggestTimings, setSuggestTimings] = useState('');
  const [suggestLat, setSuggestLat] = useState<string>('');
  const [suggestLng, setSuggestLng] = useState<string>('');
  const [suggestSubmitted, setSuggestSubmitted] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // Save locations locally and setup initial selected location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0]);
    }
  }, [locations]);

  // Listen for realtime cloud updates if another villager adds a place
  useEffect(() => {
    const unsub = realtimeSync.subscribe((envelope) => {
      if (envelope.type === ('MAP_LOCATION_ADDED' as any)) {
        const newPlace: MapLocationItem = envelope.payload;
        if (newPlace && newPlace.id) {
          setLocations((prev) => {
            if (prev.some((p) => p.id === newPlace.id)) return prev;
            const next = [newPlace, ...prev];
            localStorage.setItem('muttagundi_map_locations', JSON.stringify(next));
            return next;
          });
        }
      }
    });
    return () => unsub();
  }, []);

  // Detect user's current live location with high accuracy GPS
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocError(
        isKannada
          ? 'ನಿಮ್ಮ ಸಾಧನ ಅಥವಾ ಬ್ರೌಸರ್ ಜಿಪಿಎಸ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.'
          : 'Geolocation is not supported on this browser.'
      );
      return;
    }

    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        };
        setUserCoords(coords);
        setIsLocating(false);
        setSortByNearest(true);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        setLocError(
          isKannada
            ? 'ನಿಖರ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಲು ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಜಿಪಿಎಸ್ (Location) ಅನುಮತಿ ನೀಡಿ.'
            : 'Please allow Location/GPS permission in your browser to detect your exact position.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Toggle Continuous Live GPS Tracking
  const toggleLiveTracking = () => {
    if (isWatchingLocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatchingLocation(false);
    } else {
      if (!navigator.geolocation) return;
      setIsWatchingLocation(true);
      setLocError(null);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
          });
        },
        (err) => {
          console.warn('Watch location error:', err);
          setIsWatchingLocation(false);
        },
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }
  };

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Request location on first view
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const categories = [
    { id: 'ALL', label_en: 'All Places', label_kn: 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು', icon: '📍' },
    { id: 'TEMPLE', label_en: 'Temples', label_kn: 'ದೇವಸ್ಥಾನಗಳು', icon: '🛕' },
    { id: 'HEALTH', label_en: 'Health Center', label_kn: 'ಆಸ್ಪತ್ರೆ', icon: '🏥' },
    { id: 'SCHOOL', label_en: 'Schools', label_kn: 'ಶಾಲೆಗಳು', icon: '🏫' },
    { id: 'WATER', label_en: 'Water Points', label_kn: 'ನೀರಿನ ಘಟಕ', icon: '💧' },
    { id: 'BUS', label_en: 'Bus Stops', label_kn: 'ಬಸ್ ನಿಲ್ದಾಣ', icon: '🚌' },
    { id: 'HALL', label_en: 'Panchayat & Halls', label_kn: 'ಪಂಚಾಯತಿ / ಭವನ', icon: '🏛️' },
    { id: 'SPORTS', label_en: 'Sports Ground', label_kn: 'ಕ್ರೀಡಾಂಗಣ', icon: '🏏' }
  ];

  // Calculate live distance for each location
  const locationsWithExactDistance = locations.map((loc) => {
    if (!userCoords) return { ...loc, exactKm: null, formattedDistance: null };
    const km = calculateHaversineDistanceKm(userCoords.lat, userCoords.lng, loc.coords.lat, loc.coords.lng);
    let formatted = '';
    if (km < 1) {
      const meters = Math.round(km * 1000);
      formatted = isKannada ? `${meters} ಮೀಟರ್` : `${meters} m`;
    } else {
      formatted = isKannada ? `${km.toFixed(1)} ಕಿ.ಮೀ` : `${km.toFixed(1)} km`;
    }
    return { ...loc, exactKm: km, formattedDistance: formatted };
  });

  // Filter & Sort
  let filtered = locationsWithExactDistance.filter((loc) => {
    const matchesCategory = selectedCategory === 'ALL' || loc.category === selectedCategory;
    const matchesSearch =
      loc.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.name_kn.includes(searchQuery) ||
      loc.desc_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.desc_kn.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (sortByNearest && userCoords) {
    filtered.sort((a, b) => (a.exactKm || 999) - (b.exactKm || 999));
  }

  // Active Coordinates to display on map
  const activeLat = isFocusedOnUser && userCoords ? userCoords.lat : selectedLocation?.coords.lat || 13.8052;
  const activeLng = isFocusedOnUser && userCoords ? userCoords.lng : selectedLocation?.coords.lng || 76.2915;

  // Google Maps Directions link from user's current GPS location
  const getGoogleMapsDirectionsUrl = (loc: MapLocationItem, mode: 'driving' | 'walking' = 'driving') => {
    if (userCoords) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${loc.coords.lat},${loc.coords.lng}&travelmode=${mode}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${loc.coords.lat},${loc.coords.lng}`;
  };

  // Google Maps Native App launcher (deep link for mobile)
  const getGoogleMapsAppUrl = (lat: number, lng: number, label: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`;
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName.trim()) return;

    const lat = suggestLat ? parseFloat(suggestLat) : userCoords ? userCoords.lat : 13.8052;
    const lng = suggestLng ? parseFloat(suggestLng) : userCoords ? userCoords.lng : 76.2915;

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

    // Broadcast in real-time so other villagers see it immediately
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
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>🗺️</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              {isKannada ? 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ ನಕ್ಷೆ & ಜಿಪಿಎಸ್' : 'Muttagundi Village Map & GPS'}
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0 }}>
            {isKannada
              ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ, ಗ್ರಾಮದ ದೇವಸ್ಥಾನಗಳು, ಶಾಲೆ, ಆಸ್ಪತ್ರೆ ಹಾಗೂ ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ದಾರಿ'
              : 'Live device GPS tracking, local village landmarks, and turn-by-turn Google Maps navigation'}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              if (userCoords) {
                setSuggestLat(userCoords.lat.toFixed(6));
                setSuggestLng(userCoords.lng.toFixed(6));
              }
              setShowSuggestModal(true);
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
            <span>{isKannada ? 'ಹೊಸ ಸ್ಥಳ ಸೇರಿಸಿ' : '+ Add Place'}</span>
          </button>
        </div>
      </div>

      {/* Live GPS Device Location Status Bar */}
      <div
        style={{
          background: userCoords ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${userCoords ? '#10B981' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '16px',
          padding: '14px 18px',
          marginBottom: '16px',
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
              {/* Show My Location on Map button */}
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

              {/* Direct Open in Google Maps */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${userCoords.lat},${userCoords.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60A5FA',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ExternalLink size={14} />
                <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ನನ್ನ ಸ್ಥಾನ' : 'Google Maps'}</span>
              </a>

              {/* Toggle Live Tracking */}
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

      {/* 🗺️ INTERACTIVE EMBEDDED GOOGLE MAP VIEWER */}
      <div
        className="glass-card"
        style={{
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: '#0B1528'
        }}
      >
        {/* Map Controls Top Bar */}
        <div
          style={{
            padding: '12px 18px',
            background: 'rgba(7, 15, 30, 0.9)',
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
            {/* View Mode Toggle: 3D Village vs Roadmap vs Satellite */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '2px' }}>
              <button
                onClick={() => setViewMode('3d')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: viewMode === '3d' ? '#10B981' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>🌐</span>
                <span>{isKannada ? '3D ಗ್ರಾಮ' : '3D Village'}</span>
              </button>
              <button
                onClick={() => setViewMode('roadmap')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: viewMode === 'roadmap' ? '#10B981' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.76rem',
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
                  padding: '5px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: viewMode === 'satellite' ? '#10B981' : 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>🛰️</span>
                <span>{isKannada ? 'ಉಪಗ್ರಹ' : 'Satellite'}</span>
              </button>
            </div>

            {/* Open Active in Google Maps Native App */}
            <a
              href={getGoogleMapsAppUrl(activeLat, activeLng, isFocusedOnUser ? 'My Location' : selectedLocation?.name_en || 'Muttagundi')}
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

        {/* View Mode Display: 3D Scene OR Embedded Google Map Iframe */}
        {viewMode === '3d' ? (
          <div style={{ width: '100%', position: 'relative' }}>
            <Village3DScene
              selectedId={selectedLocation?.id}
              onSelect={handle3DLandmarkSelect}
              isKannada={isKannada}
            />
          </div>
        ) : (
          <div style={{ width: '100%', height: '380px', position: 'relative', background: '#0F1D36' }}>
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
        )}
      </div>

      {/* Search Input */}
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

      {/* Selected Location Card (Full Directions & Actions) */}
      {selectedLocation && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
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

            {/* Google Maps Actions */}
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
                <span>{isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ವಾಹನ ದಾರಿ' : 'Drive Directions'}</span>
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

      {/* Locations Cards Grid */}
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
                          ? `${loc.formattedDistance || loc.distance_en} ${isKannada ? 'ನಿಮ್ಮಿಂದ' : 'from you'}`
                          : (isKannada ? loc.distance_kn : loc.distance_en)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Google Maps Button */}
                  <a
                    href={getGoogleMapsDirectionsUrl(loc, 'driving')}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60A5FA',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      flexShrink: 0
                    }}
                    title={isKannada ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ದಾರಿ' : 'Google Maps Directions'}
                  >
                    <Navigation size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggest / Add Place Modal */}
      {showSuggestModal && (
        <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {isKannada ? '📍 ಹೊಸ ಸಾರ್ವಜನಿಕ ಸ್ಥಳ ಸೇರಿಸಿ' : '📍 Add Landmark with GPS'}
              </h3>
              <button
                onClick={() => setShowSuggestModal(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {suggestSubmitted ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {isKannada ? 'ಸ್ಥಳ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!' : 'Landmark Successfully Added!'}
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
                  {isKannada
                    ? 'ಸ್ಥಳವು ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ ನಕ್ಷೆಯಲ್ಲಿ ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಲಿಂಕ್‌ನೊಂದಿಗೆ ಪ್ರಕಟವಾಗಿದೆ.'
                    : 'This place is now published with Google Maps navigation for all villagers.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSuggestSubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಸ್ಥಳದ ಹೆಸರು *' : 'Place Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={suggestName}
                    onChange={(e) => setSuggestName(e.target.value)}
                    placeholder={isKannada ? 'ಉದಾ: ಶ್ರೀ ರಂಗನಾಥ ದೇವಾಲಯ, ಶಾಲೆ, ಆಸ್ಪತ್ರೆ...' : 'e.g., Primary Health Center, Sri Temple...'}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವಿಭಾಗ' : 'Category'}
                  </label>
                  <select
                    value={suggestCategory}
                    onChange={(e) => setSuggestCategory(e.target.value)}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF' }}
                  >
                    <option value="TEMPLE">Temple / ದೇವಸ್ಥಾನ</option>
                    <option value="SCHOOL">School / ಶಾಲೆ</option>
                    <option value="HEALTH">Health Center / ಆಸ್ಪತ್ರೆ</option>
                    <option value="WATER">Water Point / ನೀರಿನ ಘಟಕ</option>
                    <option value="BUS">Bus Stop / ಬಸ್ ನಿಲ್ದಾಣ</option>
                    <option value="HALL">Panchayat / Community Hall</option>
                    <option value="SPORTS">Sports Ground / ಮೈದಾನ</option>
                    <option value="EMERGENCY">Emergency / ತುರ್ತು</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವಿವರಣೆ' : 'Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={suggestDesc}
                    onChange={(e) => setSuggestDesc(e.target.value)}
                    placeholder={isKannada ? 'ಸ್ಥಳದ ಬಗ್ಗೆ ಮಾಹಿತಿ...' : 'Details about this village place...'}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF' }}
                  />
                </div>

                {/* GPS Coordinates Auto-Capture */}
                <div style={{ marginBottom: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px 14px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34D399' }}>
                      {userCoords
                        ? (isKannada ? '✓ ಲೈವ್ ಜಿಪಿಎಸ್ ಪತ್ತೆಯಾಗಿದೆ' : '✓ Live Device GPS Ready')
                        : (isKannada ? 'ಜಿಪಿಎಸ್ ನಿರ್ದೇಶಾಂಕಗಳು' : 'GPS Coordinates')}
                    </span>
                    {userCoords && (
                      <button
                        type="button"
                        onClick={() => {
                          setSuggestLat(userCoords.lat.toFixed(6));
                          setSuggestLng(userCoords.lng.toFixed(6));
                        }}
                        style={{
                          background: '#10B981',
                          color: '#070F1E',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {isKannada ? 'ನನ್ನ ಜಿಪಿಎಸ್ ಬಳಸಿ' : 'Use My GPS'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Latitude</label>
                      <input
                        type="text"
                        value={suggestLat}
                        onChange={(e) => setSuggestLat(e.target.value)}
                        placeholder="e.g. 13.8052"
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 8px', color: '#FFFFFF', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Longitude</label>
                      <input
                        type="text"
                        value={suggestLng}
                        onChange={(e) => setSuggestLng(e.target.value)}
                        placeholder="e.g. 76.2915"
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 8px', color: '#FFFFFF', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 800, fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Send size={16} />
                  <span>{isKannada ? 'ಸ್ಥಳ ಪ್ರಕಟಿಸಿ (SAVE & SHARE)' : 'SAVE LANDMARK TO MAP'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
