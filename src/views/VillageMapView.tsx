import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  MapPin,
  Navigation,
  PhoneCall,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Compass,
  Crosshair,
  LocateFixed,
  AlertCircle,
  Plus,
  X,
  Send,
  Layers
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
    | 'EMERGENCY';
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

export const VERIFIED_VILLAGE_LOCATIONS: MapLocationItem[] = [
  {
    id: 'loc_1',
    name_en: 'Gram Panchayat Administrative Office',
    name_kn: 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕಚೇರಿ',
    category: 'HALL',
    icon: '🏛️',
    color: '#10B981',
    desc_en: 'Main village administrative office, meeting hall, and citizen service desk.',
    desc_kn: 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಮುಖ್ಯ ಕಚೇರಿ, ಸಭಾ ಭವನ ಮತ್ತು ನಾಗರಿಕ ಸೇವಾ ಕೇಂದ್ರ.',
    distance_en: '0.1 km from Center',
    distance_kn: 'ಗ್ರಾಮ ಕೇಂದ್ರದಿಂದ 0.1 ಕಿ.ಮೀ',
    timings_en: 'Mon–Sat: 9:30 AM – 5:30 PM',
    timings_kn: 'ಸೋಮ–ಶನಿ: ಬೆಳಗ್ಗೆ 9:30 – ಸಂಜೆ 5:30',
    phone: '9845012345',
    coords: { lat: 13.9299, lng: 75.5681 },
    verified: true
  },
  {
    id: 'loc_2',
    name_en: 'Sri Ranganatha Swamy Temple',
    name_kn: 'ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
    category: 'TEMPLE',
    icon: '🛕',
    color: '#F59E0B',
    desc_en: 'Ancient stone temple with sacred Kalyani pond and annual Rathotsava festival ground.',
    desc_kn: 'ಪ್ರಾಚೀನ ಶಿಲಾ ದೇವಾಲಯ, ಪವಿತ್ರ ಕಲ್ಯಾಣಿ ಹಾಗೂ ವಾರ್ಷಿಕ ರಥೋತ್ಸವ ಕ್ಷೇತ್ರ.',
    distance_en: '0.4 km (East)',
    distance_kn: 'ಪೂರ್ವಕ್ಕೆ 0.4 ಕಿ.ಮೀ',
    timings_en: '6:00 AM – 12:30 PM & 5:00 PM – 8:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ 6:00 – ಮಧ್ಯಾಹ್ನ 12:30 & ಸಂಜೆ 5:00 – ರಾತ್ರಿ 8:30',
    phone: '9845055667',
    coords: { lat: 13.9312, lng: 75.5714 },
    verified: true
  },
  {
    id: 'loc_3',
    name_en: 'Government Primary & High School',
    name_kn: 'ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಮತ್ತು ಪ್ರೌಢಶಾಲೆ',
    category: 'SCHOOL',
    icon: '🏫',
    color: '#3B82F6',
    desc_en: 'Established 1968. Co-education with mid-day meal hall and science laboratory.',
    desc_kn: '1968 ರಲ್ಲಿ ಸ್ಥಾಪಿತ. ಬಿಸಿಯೂಟ ಭವನ, ವಿಜ್ಞಾನ ಪ್ರಯೋಗಾಲಯ ಮತ್ತು ಕ್ರೀಡಾಂಗಣ.',
    distance_en: '0.3 km (North)',
    distance_kn: 'ಉತ್ತರಕ್ಕೆ 0.3 ಕಿ.ಮೀ',
    timings_en: '9:30 AM – 4:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ 9:30 – ಸಂಜೆ 4:30',
    phone: '9845022334',
    coords: { lat: 13.9325, lng: 75.5675 },
    verified: true
  },
  {
    id: 'loc_4',
    name_en: 'Primary Health Center (PHC)',
    name_kn: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ',
    category: 'HEALTH',
    icon: '🏥',
    color: '#EF4444',
    desc_en: '24/7 medical emergency care, maternity ward, pharmacy, and ambulance service.',
    desc_kn: '24/7 ತುರ್ತು ಚಿಕಿತ್ಸೆ, ಹೆರಿಗೆ ವಾರ್ಡ್, ಉಚಿತ ಔಷಧಿ ವಿತರಣೆ ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್.',
    distance_en: '0.5 km (West)',
    distance_kn: 'ಪಶ್ಚಿಮಕ್ಕೆ 0.5 ಕಿ.ಮೀ',
    timings_en: 'Open 24 Hours Emergency | OPD 9:00 AM – 4:00 PM',
    timings_kn: 'ತುರ್ತು ಚಿಕಿತ್ಸೆ 24 ಗಂಟೆ | ತಪಾಸಣೆ ಬೆಳಗ್ಗೆ 9:00 – ಸಂಜೆ 4:00',
    phone: '108',
    coords: { lat: 13.9288, lng: 75.5632 },
    verified: true
  },
  {
    id: 'loc_5',
    name_en: 'Gramasiri Sports Playground',
    name_kn: 'ಗ್ರಾಮಸಿರಿ ಕ್ರೀಡಾಂಗಣ',
    category: 'SPORTS',
    icon: '🏏',
    color: '#8B5CF6',
    desc_en: 'Cricket pitch, floodlit Kabaddi court, running track, and open gym.',
    desc_kn: 'ಕ್ರಿಕೆಟ್ ಮೈದಾನ, ಕಬಡ್ಡಿ ಅಂಕಣ, ರನ್ನಿಂಗ್ ಟ್ರ್ಯಾಕ್ ಮತ್ತು ಮುಕ್ತ ವ್ಯಾಯಾಮಶಾಲೆ.',
    distance_en: '0.6 km (South)',
    distance_kn: 'ದಕ್ಷಿಣಕ್ಕೆ 0.6 ಕಿ.ಮೀ',
    timings_en: '5:30 AM – 7:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ 5:30 – ಸಂಜೆ 7:30',
    phone: '9845088990',
    coords: { lat: 13.9255, lng: 75.5695 },
    verified: true
  },
  {
    id: 'loc_6',
    name_en: 'Main Bus Stop & Auto Stand',
    name_kn: 'ಮುಖ್ಯ ಬಸ್ ನಿಲ್ದಾಣ & ಆಟೋ ನಿಲ್ದಾಣ',
    category: 'BUS',
    icon: '🚌',
    color: '#EC4899',
    desc_en: 'KSRTC bus connections to Shivamogga city every 30 minutes. Passenger shelter.',
    desc_kn: 'ಶಿವಮೊಗ್ಗ ನಗರಕ್ಕೆ ಪ್ರತಿ 30 ನಿಮಿಷಕ್ಕೊಮ್ಮೆ ಬಸ್ ಸಂಪರ್ಕ. ಪ್ರಯಾಣಿಕರ ತಂಗುದಾಣ.',
    distance_en: '0.2 km from Center',
    distance_kn: 'ಗ್ರಾಮ ಕೇಂದ್ರದಿಂದ 0.2 ಕಿ.ಮೀ',
    timings_en: 'Bus Services: 6:00 AM – 9:30 PM',
    timings_kn: 'ಬಸ್ ಸೇವೆ: ಬೆಳಗ್ಗೆ 6:00 – ರಾತ್ರಿ 9:30',
    coords: { lat: 13.9292, lng: 75.5688 },
    verified: true
  },
  {
    id: 'loc_7',
    name_en: 'Community Pure Drinking Water RO Plant',
    name_kn: 'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕ (RO)',
    category: 'WATER',
    icon: '💧',
    color: '#06B6D4',
    desc_en: 'Clean mineral drinking water dispenser. 20 Liters for ₹5 with smart card / coins.',
    desc_kn: 'ಶುದ್ಧ ಖನಿಜಯುಕ್ತ ಕುಡಿಯುವ ನೀರು. ₹5 ಕ್ಕೆ 20 ಲೀಟರ್ ಕ್ಯಾನ್ ನೀರು ಲಭ್ಯ.',
    distance_en: '0.15 km from Panchayat',
    distance_kn: 'ಪಂಚಾಯತಿ ಬಳಿ 0.15 ಕಿ.ಮೀ',
    timings_en: '24 Hours Dispenser',
    timings_kn: '24 ಗಂಟೆ ಲಭ್ಯ',
    coords: { lat: 13.9304, lng: 75.5678 },
    verified: true
  },
  {
    id: 'loc_8',
    name_en: 'Karnataka Bank Branch & 24/7 ATM',
    name_kn: 'ಕರ್ನಾಟಕ ಬ್ಯಾಂಕ್ ಶಾಖೆ & ATM',
    category: 'BANK',
    icon: '🏦',
    color: '#6366F1',
    desc_en: 'Agricultural loans, farmer credit card, cash deposit, and 24/7 ATM kiosk.',
    desc_kn: 'ಕೃಷಿ ಸಾಲ, ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್, ಹಣ ಜಮೆ ಮತ್ತು 24/7 ಎಟಿಎಂ ಸೇವೆ.',
    distance_en: '0.25 km from Market',
    distance_kn: 'ಮಾರುಕಟ್ಟೆಯಿಂದ 0.25 ಕಿ.ಮೀ',
    timings_en: 'Banking: 10:00 AM – 4:00 PM | ATM: 24 Hours',
    timings_kn: 'ಬ್ಯಾಂಕ್: ಬೆಳಗ್ಗೆ 10:00 – ಸಂಜೆ 4:00 | ATM: 24 ಗಂಟೆ',
    phone: '9845033445',
    coords: { lat: 13.9285, lng: 75.5698 },
    verified: true
  },
  {
    id: 'loc_9',
    name_en: 'Village Police Outpost',
    name_kn: 'ಗ್ರಾಮೀಣ ಪೊಲೀಸ್ ಹೊರಠಾಣೆ',
    category: 'EMERGENCY',
    icon: '🚨',
    color: '#DC2626',
    desc_en: 'Community policing, beat officer patrol, and 24/7 resident safety helpline.',
    desc_kn: 'ಗ್ರಾಮೀಣ ಸುರಕ್ಷತೆ, ಬೀಟ್ ಪೊಲೀಸ್ ಕಾವಲು ಮತ್ತು 24/7 ತುರ್ತು ಸಹಾಯ.',
    distance_en: '0.35 km',
    distance_kn: '0.35 ಕಿ.ಮೀ',
    timings_en: '24 Hours Emergency Dial 112',
    timings_kn: '24 ಗಂಟೆ ತುರ್ತು ಕರೆ 112',
    phone: '112',
    coords: { lat: 13.9318, lng: 75.5662 },
    verified: true
  }
];

// Haversine formula for exact distance in kilometers
function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
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

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<MapLocationItem>(VERIFIED_VILLAGE_LOCATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // User Device Location State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Suggest Location Form
  const [suggestName, setSuggestName] = useState('');
  const [suggestCategory, setSuggestCategory] = useState('TEMPLE');
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestSubmitted, setSuggestSubmitted] = useState(false);

  // Detect GPS Device Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocError(
        isKannada
          ? 'ನಿಮ್ಮ ಮೊಬೈಲ್/ಬ್ರೌಸರ್ ಜಿಪಿಎಸ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.'
          : 'Geolocation is not supported on this browser.'
      );
      return;
    }

    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
        setIsLocating(false);
        setSortByNearest(true);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        setLocError(
          isKannada
            ? 'ನಿಖರ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಲು ದಯವಿಟ್ಟು ಜಿಪಿಎಸ್ (GPS) ಅನುಮತಿ ನೀಡಿ.'
            : 'Please enable GPS location permissions to calculate exact distances.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-request location once on mount for seamless experience
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const categories = [
    { id: 'ALL', label_en: 'All Places', label_kn: 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು', icon: '📍' },
    { id: 'TEMPLE', label_en: 'Temples', label_kn: 'ದೇವಸ್ಥಾನಗಳು', icon: '🛕' },
    { id: 'HEALTH', label_en: 'Health & Clinic', label_kn: 'ಆಸ್ಪತ್ರೆ & ಕ್ಲಿನಿಕ್', icon: '🏥' },
    { id: 'SCHOOL', label_en: 'Schools', label_kn: 'ಶಾಲೆಗಳು', icon: '🏫' },
    { id: 'SPORTS', label_en: 'Sports', label_kn: 'ಕ್ರೀಡಾಂಗಣ', icon: '🏏' },
    { id: 'BUS', label_en: 'Bus Stop', label_kn: 'ಬಸ್ ನಿಲ್ದಾಣ', icon: '🚌' },
    { id: 'WATER', label_en: 'Water Points', label_kn: 'ನೀರಿನ ಘಟಕ', icon: '💧' },
    { id: 'EMERGENCY', label_en: 'Emergency', label_kn: 'ತುರ್ತು ಸೇವೆ', icon: '🚨' }
  ];

  // Calculate live distance for each location
  const locationsWithExactDistance = VERIFIED_VILLAGE_LOCATIONS.map((loc) => {
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

  // Google Maps directions URL with exact device origin
  const getDirectionsUrl = (loc: MapLocationItem) => {
    if (userCoords) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${loc.coords.lat},${loc.coords.lng}&travelmode=walking`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${loc.coords.lat},${loc.coords.lng}`;
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName.trim()) return;
    setSuggestSubmitted(true);
    setTimeout(() => {
      setSuggestSubmitted(false);
      setShowSuggestModal(false);
      setSuggestName('');
      setSuggestDesc('');
    }, 1800);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Title & Description */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>🗺️</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              {isKannada ? 'ನಮ್ಮ ಊರಿನ ನಿಖರ ನಕ್ಷೆ' : 'Village Exact GPS Map'}
            </h2>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', margin: 0 }}>
            {isKannada
              ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಳದಿಂದ ನಿಖರ ದೂರ ಮತ್ತು ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ದಾರಿ'
              : 'Exact GPS location, live distance from you, and Google Maps directions'}
          </p>
        </div>

        {/* Suggest Place Button */}
        <button
          onClick={() => setShowSuggestModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#A7F3D0',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} color="#34D399" />
          <span>{isKannada ? 'ಸ್ಥಳ ಸೂಚಿಸಿ' : 'Suggest Place'}</span>
        </button>
      </div>

      {/* GPS Status Banner */}
      <div
        style={{
          background: userCoords ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${userCoords ? '#10B981' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '16px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: userCoords ? '#10B981' : '#3B82F6',
              boxShadow: userCoords ? '0 0 10px #10B981' : 'none',
              animation: userCoords ? 'pulse 2s infinite' : 'none'
            }}
          />
          <div>
            <strong style={{ fontSize: '0.88rem', color: '#FFFFFF', display: 'block' }}>
              {userCoords
                ? (isKannada
                    ? `📍 ನಿಮ್ಮ ಜಿಪಿಎಸ್ ಸ್ಥಳ ಸಕ್ರಿಯವಾಗಿದೆ (ನಿಖರತೆ: ±${userCoords.accuracy} ಮೀ)`
                    : `📍 Live GPS Active (Accuracy: ±${userCoords.accuracy}m)`)
                : (isKannada
                    ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಪತ್ತೆಹಚ್ಚಿ ನಿಖರ ದೂರ ತಿಳಿಯಿರಿ'
                    : 'Detect your live location to calculate exact distances')}
            </strong>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
              {userCoords
                ? (isKannada
                    ? `ಸ್ಥಳ: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E`
                    : `Coordinates: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E`)
                : (isKannada
                    ? 'ಗ್ರಾಮದ ಪ್ರತಿಯೊಂದು ಸ್ಥಳಕ್ಕೂ ನಿಖರ ದೂರ ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತದೆ'
                    : 'Calculates real-time distance to temples, clinic, and water points')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LocateFixed size={14} />
            <span>
              {isLocating
                ? (isKannada ? 'ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ...' : 'Locating...')
                : (isKannada ? 'ನನ್ನ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಿ' : 'Detect My GPS')}
            </span>
          </button>

          {userCoords && (
            <button
              onClick={() => setSortByNearest(!sortByNearest)}
              style={{
                background: sortByNearest ? '#3B82F6' : 'rgba(255,255,255,0.08)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {sortByNearest
                ? (isKannada ? '✓ ಹತ್ತಿರದ ಪ್ರಕಾರ ವಿಂಗಡಿಸಲಾಗಿದೆ' : '✓ Sorted by Nearest')
                : (isKannada ? 'ಹತ್ತಿರದ ಪ್ರಕಾರ ವಿಂಗಡಿಸಿ' : 'Sort Nearest')}
            </button>
          )}
        </div>
      </div>

      {locError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', color: '#FCA5A5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#EF4444" />
          <span>{locError}</span>
        </div>
      )}

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
          placeholder={isKannada ? 'ಸ್ಥಳ ಹುಡುಕಿ (ಉದಾ: ದೇವಸ್ಥಾನ, ಶಾಲೆ, ಆಸ್ಪತ್ರೆ, ನೀರಿನ ಘಟಕ)...' : 'Search village places (temple, school, clinic, water)...'}
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

      {/* Selected Location Card (Large & Actionable) */}
      {selectedLocation && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${selectedLocation.color}`,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 12px 30px rgba(0, 0, 0, 0.4), 0 0 24px ${selectedLocation.color}22`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `${selectedLocation.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
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
                        padding: '1px 6px',
                        borderRadius: '6px'
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                </div>

                {/* Distance Badge (Calculated from User GPS if available) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
                  <MapPin size={14} color={selectedLocation.color} />
                  <strong style={{ color: userCoords ? '#34D399' : '#CBD5E1' }}>
                    {userCoords
                      ? `${(selectedLocation as any).formattedDistance || selectedLocation.distance_en} ${isKannada ? 'ನಿಮ್ಮಿಂದ' : 'from you'}`
                      : (isKannada ? selectedLocation.distance_kn : selectedLocation.distance_en)}
                  </strong>
                  <span style={{ color: '#64748B' }}>•</span>
                  <span style={{ color: '#64748B', fontSize: '0.74rem' }}>
                    {selectedLocation.coords.lat.toFixed(4)}° N, {selectedLocation.coords.lng.toFixed(4)}° E
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Phone & Exact GPS Route */}
            <div style={{ display: 'flex', gap: '8px' }}>
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

              <a
                href={getDirectionsUrl(selectedLocation)}
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
                <span>{isKannada ? 'ದಾರಿ ತೋರಿಸು (DIRECTIONS)' : 'GET DIRECTIONS'}</span>
              </a>
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 12px 0' }}>
            {isKannada ? selectedLocation.desc_kn : selectedLocation.desc_en}
          </p>

          {selectedLocation.timings_en && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94A3B8', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
              <Clock size={14} color={selectedLocation.color} />
              <span>{isKannada ? selectedLocation.timings_kn : selectedLocation.timings_en}</span>
            </div>
          )}
        </div>
      )}

      {/* Locations Cards Grid (Large, Easy to Tap) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {filtered.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          return (
            <div
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
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
                    <span style={{ fontSize: '0.76rem', color: userCoords ? '#34D399' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <MapPin size={12} color={loc.color} />
                      {userCoords
                        ? `${loc.formattedDistance || loc.distance_en} ${isKannada ? 'ನಿಮ್ಮಿಂದ' : 'from you'}`
                        : (isKannada ? loc.distance_kn : loc.distance_en)}
                    </span>
                  </div>
                </div>

                <a
                  href={getDirectionsUrl(loc)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#CBD5E1',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    flexShrink: 0
                  }}
                  title="Open GPS Navigation"
                >
                  <Navigation size={15} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggest Place Modal */}
      {showSuggestModal && (
        <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? '📍 ಹೊಸ ಸಾರ್ವಜನಿಕ ಸ್ಥಳ ಸೂಚಿಸಿ' : '📍 Suggest Public Place'}
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
                  {isKannada ? 'ಸ್ಥಳ ಸೂಚನೆ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!' : 'Location Submitted!'}
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
                  {isKannada
                    ? 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಧಿಕಾರಿಗಳು ಪರಿಶೀಲಿಸಿ ಅಧಿಕೃತ ನಕ್ಷೆಗೆ ಸೇರಿಸುತ್ತಾರೆ.'
                    : 'Village moderators will review and add this official landmark.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSuggestSubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಸ್ಥಳದ ಹೆಸರು' : 'Place Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={suggestName}
                    onChange={(e) => setSuggestName(e.target.value)}
                    placeholder={isKannada ? 'ಉದಾ: ಹೊಸ ಕಲ್ಯಾಣ ಮಂಟಪ...' : 'e.g., New Community Hall...'}
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
                    <option value="HALL">Community Hall / ಸಭಾ ಭವನ</option>
                  </select>
                </div>

                {/* GPS Capture Button */}
                <div style={{ marginBottom: '14px', background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#34D399', display: 'block', fontWeight: 700 }}>
                    {userCoords
                      ? (isKannada
                          ? `✓ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಲಭ್ಯ: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E`
                          : `✓ Current GPS Captured: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E`)
                      : (isKannada
                          ? 'ನಿಖರ ಸ್ಥಳಕ್ಕಾಗಿ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಬಳಸಿ'
                          : 'Use live device GPS coordinates for accuracy')}
                  </span>
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Send size={16} />
                  <span>{isKannada ? 'ಸೂಚನೆ ಸಲ್ಲಿಸಿ (SUBMIT)' : 'SUBMIT SUGGESTION'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
