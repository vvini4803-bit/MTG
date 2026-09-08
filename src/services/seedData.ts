import {
  NewsItem,
  EventItem,
  Tournament,
  CropItem,
  TempleItem,
  HistoryItem,
  StoryItem,
  VillageStats,
  AchievementItem,
  GalleryItem,
  SocialLink,
  EmergencyAlert,
  UserProfile,
  Conversation,
  ChatMessage
} from '../types';

export const SEED_USERS: UserProfile[] = [
  {
    uid: 'admin_101',
    name: 'Basavaraj Patel',
    name_kn: 'ಬಸವರಾಜ್ ಪಟೇಲ್',
    phone: '+91 98450 12345',
    email: 'admin@gramasiri.org',
    role: 'SUPER_ADMIN',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Village Council President & Social Worker',
    bio_kn: 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಧ್ಯಕ್ಷರು ಹಾಗೂ ಸಮಾಜ ಸೇವಕರು',
    account_status: 'ACTIVE',
    created_at: '2025-01-01T00:00:00.000Z',
    last_login: '2026-09-08T18:00:00.000Z',
    is_phone_verified: true,
    community_category: 'ACHIEVER',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'VILLAGE_MEMBERS'
  },
  {
    uid: 'mod_102',
    name: 'Sharada Kulkarni',
    name_kn: 'ಶಾರದಾ ಕುಲಕರ್ಣಿ',
    phone: '+91 94480 23456',
    email: 'moderator@gramasiri.org',
    role: 'MODERATOR',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    bio: 'High School Headmistress & Content Moderator',
    bio_kn: 'ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯಿನಿ',
    account_status: 'ACTIVE',
    created_at: '2025-02-10T00:00:00.000Z',
    last_login: '2026-09-08T17:30:00.000Z',
    is_phone_verified: true,
    community_category: 'TEACHER',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'VILLAGE_MEMBERS'
  },
  {
    uid: 'sports_103',
    name: 'Manjunath Gowda',
    name_kn: 'ಮಂಜುನಾಥ್ ಗೌಡ',
    phone: '+91 98800 34567',
    email: 'sports@gramasiri.org',
    role: 'SPORTS_ORGANIZER',
    language: 'en',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Village Youth Club Sports Secretary & Kabaddi Captain',
    bio_kn: 'ಯುವಕ ಸಂಘದ ಕ್ರೀಡಾ ಕಾರ್ಯದರ್ಶಿ & ಕಬಡ್ಡಿ ನಾಯಕ',
    account_status: 'ACTIVE',
    created_at: '2025-03-15T00:00:00.000Z',
    last_login: '2026-09-08T18:15:00.000Z',
    is_phone_verified: true,
    community_category: 'SPORTS',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'EVERYONE'
  },
  {
    uid: 'user_104',
    name: 'Ramesh Kumar',
    name_kn: 'ರಮೇಶ್ ಕುಮಾರ್',
    phone: '+91 99001 45678',
    email: 'ramesh.farmer@gmail.com',
    role: 'USER',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Progressive Farmer, Millets & Arecanut grower',
    bio_kn: 'ಪ್ರಗತಿಪರ ರೈತರು, ಸಿರಿಧಾನ್ಯ ಮತ್ತು ಅಡಿಕೆ ಬೆಳೆಗಾರರು',
    account_status: 'ACTIVE',
    created_at: '2025-05-20T00:00:00.000Z',
    last_login: '2026-09-08T16:45:00.000Z',
    is_phone_verified: true,
    community_category: 'FARMER',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'EVERYONE'
  },
  {
    uid: 'user_105',
    name: 'Kavitha Devi',
    name_kn: 'ಕವಿತಾ ದೇವಿ',
    phone: '+91 94812 56789',
    email: 'kavitha.organic@gmail.com',
    role: 'USER',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Organic Dairy Farmer & Self-Help Group Leader',
    bio_kn: 'ಸಾವಯವ ಹೈನುಗಾರಿಕೆ ಹಾಗೂ ಸ್ತ್ರೀ ಶಕ್ತಿ ಸಂಘದ ಮುಖಂಡರು',
    account_status: 'ACTIVE',
    created_at: '2025-06-10T00:00:00.000Z',
    last_login: '2026-09-08T15:20:00.000Z',
    is_phone_verified: true,
    community_category: 'FARMER',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'VILLAGE_MEMBERS'
  },
  {
    uid: 'user_106',
    name: 'Naveen Kumar G.',
    name_kn: 'ನವೀನ್ ಕುಮಾರ್ ಜಿ.',
    phone: '+91 97405 88990',
    email: 'naveen.student@gmail.com',
    role: 'USER',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    bio: 'B.Sc Agriculture Student & Village Youth volunteer',
    bio_kn: 'ಬಿ.ಎಸ್ಸಿ ಕೃಷಿ ವಿದ್ಯಾರ್ಥಿ ಮತ್ತು ಗ್ರಾಮ ಯುವ ಸ್ವಯಂಸೇವಕ',
    account_status: 'ACTIVE',
    created_at: '2025-07-01T00:00:00.000Z',
    last_login: '2026-09-08T14:10:00.000Z',
    is_phone_verified: true,
    community_category: 'STUDENT',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'EVERYONE'
  },
  {
    uid: 'user_107',
    name: 'Anasuya Hegde',
    name_kn: 'ಅನಸೂಯಾ ಹೆಗಡೆ',
    phone: '+91 96112 34567',
    email: 'anasuya.yakshagana@gmail.com',
    role: 'USER',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
    bio: 'Yakshagana Artist & Folk Singer (District Awardee)',
    bio_kn: 'ಯಕ್ಷಗಾನ ಕಲಾವಿದೆ ಮತ್ತು ಜಾನಪದ ಗಾಯಕಿ (ಜಿಲ್ಲಾ ಪ್ರಶಸ್ತಿ ಪುರಸ್ಕೃತೆ)',
    account_status: 'ACTIVE',
    created_at: '2025-04-12T00:00:00.000Z',
    last_login: '2026-09-08T11:00:00.000Z',
    is_phone_verified: true,
    community_category: 'ARTIST',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'VILLAGE_MEMBERS'
  },
  {
    uid: 'user_108',
    name: 'Dr. Srinivas Murthy',
    name_kn: 'ಡಾ. ಶ್ರೀನಿವಾಸ್ ಮೂರ್ತಿ',
    phone: '+91 98440 99887',
    email: 'dr.srinivas@gramasiri.org',
    role: 'USER',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    bio: 'Primary Health Center Medical Officer (Hon. Advisor)',
    bio_kn: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದ ವೈದ್ಯಾಧಿಕಾರಿ',
    account_status: 'ACTIVE',
    created_at: '2025-01-20T00:00:00.000Z',
    last_login: '2026-09-08T09:30:00.000Z',
    is_phone_verified: true,
    community_category: 'ACHIEVER',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'VILLAGE_MEMBERS'
  }
];

export const SEED_VILLAGE_STATS: VillageStats = {
  id: 'stats_main',
  population: 4820,
  households: 1120,
  area_sqkm: 18.5,
  literacy_rate: 84.6,
  schools: 4,
  temples: 6,
  hospitals: 2,
  agricultural_land_acres: 2450,
  main_crops_en: 'Ragi (Finger Millet), Arecanut, Coconut, Paddy, Pepper',
  main_crops_kn: 'ರಾಗಿ, ಅಡಿಕೆ, ತೆಂಗು, ಭತ್ತ, ಕರಿಮೆಣಸು',
  active_members: 642,
  source: 'Gram Panchayat Digital Census & Revenue Records 2025-26',
  source_url: 'https://panchamitra.karnataka.gov.in',
  last_verified: '2026-08-15',
  verified_by: 'Basavaraj Patel (Panchayat Development Officer)',
  is_demo: true
};

export const SEED_EMERGENCY_ALERT: EmergencyAlert = {
  id: 'alert_001',
  title_en: 'Monsoon Stream Overflow Warning - Bypass Road Notice',
  title_kn: 'ಮಳೆಯ ನೀರಿನ ಹರಿವು ಹೆಚ್ಚಳ - ಬೈಪಾಸ್ ರಸ್ತೆ ಬಳಕೆ ಸೂಚನೆ',
  message_en:
    'Due to torrential rain in the Western Ghats catchment, the northern canal culvert near Malleshwara gate is temporarily waterlogged. Commuters must use the South Link bypass road.',
  message_kn:
    'ಪಶ್ಚಿಮ ಘಟ್ಟಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆಯಿಂದಾಗಿ ಮಲ್ಲೇಶ್ವರ ಗೇಟ್ ಬಳಿಯ ಉತ್ತರ ಕಾಲುವೆ ಸೇತುವೆ ಮೇಲೆ ನೀರು ಹರಿಯುತ್ತಿದ್ದು, ಸಾರ್ವಜನಿಕರು ದಕ್ಷಿಣ ಬೈಪಾಸ್ ರಸ್ತೆ ಬಳಸಲು ಕೋರಲಾಗಿದೆ.',
  issued_by_en: 'Grama Panchayat Emergency Cell & Village Accountant',
  issued_by_kn: 'ಗ್ರಾಮ ಪಂಚಾಯತ್ ವಿಪತ್ತು ನಿರ್ವಹಣಾ ಕೋಶ',
  issued_at: '2026-09-08T06:30:00.000Z',
  active: true,
  contact_info: 'Helpline: +91 8172 268100 / 112',
  level: 'WARNING',
  is_demo: true
};

export const SEED_NEWS: NewsItem[] = [
  {
    id: 'news_1',
    author_id: 'admin_101',
    author_name: 'Basavaraj Patel',
    author_role: 'SUPER_ADMIN',
    title_en: 'New Solar Powered Community Borewell Commissioned at Gandhi Nagar',
    title_kn: 'ಗಾಂಧಿನಗರದಲ್ಲಿ ಹೊಸ ಸೌರಶಕ್ತಿ ಚಾಲಿತ ಸಮುದಾಯ ಕೊಳವೆಬಾವಿ ಉದ್ಘಾಟನೆ',
    content_en:
      'The Gram Panchayat has successfully inaugurated the 7.5 HP solar water pump station providing uninterrupted drinking water to over 240 households in Gandhi Nagar. Water testing results confirm pure potable grade.',
    content_kn:
      'ಗಾಂಧಿನಗರದ 240ಕ್ಕೂ ಹೆಚ್ಚು ಕುಟುಂಬಗಳಿಗೆ ನಿರಂತರ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು ಒದಗಿಸಲು 7.5 ಹೆಚ್‌ಪಿ ಸೌರ ವಿದ್ಯುತ್ ಚಾಲಿತ ಕೊಳವೆಬಾವಿಯನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್ ವತಿಯಿಂದ ಯಶಸ್ವಿಯಾಗಿ ಉದ್ಘಾಟಿಸಲಾಗಿದೆ.',
    category: 'WATER',
    media_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800',
    media_type: 'IMAGE',
    location: 'Gandhi Nagar Ward 3',
    verification_status: 'VERIFIED',
    verified_by: 'admin_101',
    verified_by_name: 'Village Administration',
    verified_at: '2026-09-07T10:00:00.000Z',
    urgent: false,
    pinned: true,
    reports_count: 0,
    likes_count: 48,
    liked_by: ['user_104'],
    comments_count: 5,
    created_at: '2026-09-07T09:30:00.000Z',
    updated_at: '2026-09-07T10:00:00.000Z',
    is_demo: true
  },
  {
    id: 'news_2',
    author_id: 'user_104',
    author_name: 'Ramesh Kumar',
    author_role: 'USER',
    title_en: 'KPTCL Electricity Transformer Maintenance this Thursday from 10 AM to 4 PM',
    title_kn: 'ಗುರುವಾರ ಬೆಳಗ್ಗೆ 10 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ ಕೆಪಿಟಿಸಿಎಲ್ ವಿದ್ಯುತ್ ಪರಿವರ್ತಕ ದುರಸ್ತಿ',
    content_en:
      'Linemen have informed that annual feeder maintenance will occur on the main 11kV agricultural feeder this Thursday. Farmers with irrigation pump schedules are advised to plan accordingly.',
    content_kn:
      'ಮುಖ್ಯ 11ಕೆವಿ ಕೃಷಿ ಫೀಡರ್‌ನಲ್ಲಿ ವಾರ್ಷಿಕ ನಿರ್ವಹಣಾ ಕಾರ್ಯ ನಡೆಯಲಿದ್ದು, ಗುರುವಾರ ಬೆಳಗ್ಗೆ 10 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ ವಿದ್ಯುತ್ ಸರಬರಾಜು ಇರುವುದಿಲ್ಲ ಎಂದು ಲೈನ್‌ಮ್ಯಾನ್ ತಿಳಿಸಿದ್ದಾರೆ.',
    category: 'ELECTRICITY',
    media_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
    media_type: 'IMAGE',
    location: 'Main Feeder Station',
    verification_status: 'COMMUNITY_REPORT',
    verified_by: undefined,
    verified_at: undefined,
    urgent: false,
    pinned: false,
    official_correction: 'KPTCL Assistant Engineer confirmed shutdown is only for Feeder 2 (Agricultural). Domestic supply will remain active.',
    official_correction_kn: 'ಕೆಪಿಟಿಸಿಎಲ್ ಇಂಜಿನಿಯರ್ ಸ್ಪಷ್ಟನೆ: ವಿದ್ಯುತ್ ಕಡಿತ ಕೇವಲ ಕೃಷಿ ಫೀಡರ್‌ಗೆ ಮಾತ್ರ ಅನ್ವಯ, ಮನೆಗಳಿಗೆ ವಿದ್ಯುತ್ ಇರಲಿದೆ.',
    reports_count: 0,
    likes_count: 32,
    liked_by: [],
    comments_count: 3,
    created_at: '2026-09-08T08:00:00.000Z',
    updated_at: '2026-09-08T09:15:00.000Z',
    is_demo: true
  },
  {
    id: 'news_3',
    author_id: 'sports_103',
    author_name: 'Manjunath Gowda',
    author_role: 'SPORTS_ORGANIZER',
    title_en: 'Gramotsava Cricket Tournament 2026 Finals Scheduled for Coming Sunday',
    title_kn: 'ಗ್ರಾಮೋತ್ಸವ ಕ್ರಿಕೆಟ್ ಟೂರ್ನಮೆಂಟ್ 2026 ಫೈನಲ್ ಪಂದ್ಯ ಈ ಭಾನುವಾರ',
    content_en:
      'After thrilling semi-finals, Grama Warriors and Cauvery Tigers will clash in the Grand Finale of the Gramotsava Cricket Cup at the Government High School Grounds. Live score will be broadcasted on this app.',
    content_kn:
      'ರೋಚಕ ಸೆಮಿಫೈನಲ್ ಪಂದ್ಯಗಳ ನಂತರ ಗ್ರಾಮ ವಾರಿಯರ್ಸ್ ಮತ್ತು ಕಾವೇರಿ ಟೈಗರ್ಸ್ ತಂಡಗಳು ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲಾ ಮೈದಾನದಲ್ಲಿ ಫೈನಲ್ ಪಂದ್ಯದಲ್ಲಿ ಮುಖಾಮುಖಿಯಾಗಲಿವೆ.',
    category: 'SPORTS',
    media_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
    media_type: 'IMAGE',
    location: 'High School Ground',
    verification_status: 'VERIFIED',
    verified_by: 'mod_102',
    verified_by_name: 'Sharada Kulkarni (Sports Committee)',
    verified_at: '2026-09-08T11:00:00.000Z',
    urgent: false,
    pinned: false,
    reports_count: 0,
    likes_count: 65,
    liked_by: ['admin_101'],
    comments_count: 8,
    created_at: '2026-09-08T10:45:00.000Z',
    updated_at: '2026-09-08T11:00:00.000Z',
    is_demo: true
  },
  {
    id: 'news_4',
    author_id: 'user_104',
    author_name: 'Ramesh Kumar',
    author_role: 'USER',
    title_en: 'Spotted Wild Boar herd near Eastern Coconut Plantations',
    title_kn: 'ಪೂರ್ವ ಭಾಗದ ತೆಂಗಿನ ತೋಟಗಳ ಬಳಿ ಕಾಡುಹಂದಿಗಳ ಹಿಂಡು ಪತ್ತೆ',
    content_en:
      'A herd of wild boars was seen damaging root trenches near Sri Rameshwara temple stream. Forest guard has been alerted.',
    content_kn:
      'ಶ್ರೀ ರಾಮೇಶ್ವರ ದೇವಸ್ಥಾನದ ಕಾಲುವೆ ಸಮೀಪದ ತೋಟಗಳಲ್ಲಿ ಕಾಡುಹಂದಿಗಳು ಕಾಣಿಸಿಕೊಂಡಿದ್ದು, ಅರಣ್ಯ ರಕ್ಷಕರಿಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.',
    category: 'AGRICULTURE',
    verification_status: 'PENDING',
    urgent: false,
    pinned: false,
    reports_count: 0,
    likes_count: 14,
    liked_by: [],
    comments_count: 2,
    created_at: '2026-09-08T12:00:00.000Z',
    updated_at: '2026-09-08T12:00:00.000Z',
    is_demo: true
  }
];

export const SEED_EVENTS: EventItem[] = [
  {
    id: 'event_1',
    title_en: 'Annual Sri Chennakeshava Swamy Brahmarathotsava 2026',
    title_kn: 'ವಾರ್ಷಿಕ ಶ್ರೀ ಚನ್ನಕೇಶವ ಸ್ವಾಮಿ ಬ್ರಹ್ಮ ರಥೋತ್ಸವ ೨೦೨೬',
    description_en:
      'The premier grand village chariot festival featuring traditional Mangala Vadya, Maha Mangalarathi, grand procession, Prasada distribution, and cultural Yakshagana night.',
    description_kn:
      'ಗ್ರಾಮದ ಪ್ರಮುಖ ಧಾರ್ಮಿಕ ಉತ್ಸವ: ಶ್ರೀ ಚನ್ನಕೇಶವ ಸ್ವಾಮಿಯ ಬ್ರಹ್ಮ ರಥೋತ್ಸವ, ಮಹಾ ಮಂಗಳಾರತಿ, ರಥ ಎಳೆಯುವುದು, ಅನ್ನಸಂತರ್ಪಣೆ ಮತ್ತು ರಾತ್ರಿ ಯಕ್ಷಗಾನ ಬಯಲಾಟ.',
    date: '2026-09-24',
    start_time: '08:30 AM',
    end_time: '11:30 PM',
    venue_en: 'Sri Chennakeshava Temple Sannidhi, Car Street',
    venue_kn: 'ಶ್ರೀ ಚನ್ನಕೇಶವ ದೇವಸ್ಥಾನದ ಸನ್ನಿಧಿ, ರಥಬೀದಿ',
    organizer_en: 'Temple Dharmadarshi Trust & Village Elders Committee',
    organizer_kn: 'ದೇವಸ್ಥಾನ ಧರ್ಮದರ್ಶಿ ಮಂಡಳಿ',
    organizer_phone: '+91 94480 11223',
    cover_image: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800',
    status: 'UPCOMING',
    participants_count: 380,
    registered_uids: ['admin_101', 'user_104'],
    is_demo: true
  },
  {
    id: 'event_2',
    title_en: 'Gramotsava Inter-Ward Cricket Championship - Semi Finals',
    title_kn: 'ಗ್ರಾಮೋತ್ಸವ ವಾರ್ಡ್ ಮಟ್ಟದ ಕ್ರಿಕೆಟ್ ಚಾಂಪಿಯನ್‌ಶಿಪ್ - ಸೆಮಿಫೈನಲ್ಸ್',
    description_en:
      '12-over tennis ball cricket tournament featuring 8 ward teams competing for the prestigious Gramasiri Rolling Trophy and cash prizes.',
    description_kn:
      'ಗ್ರಾಮಸಿರಿ ರೋಲಿಂಗ್ ಟ್ರೋಫಿಗಾಗಿ 8 ವಾರ್ಡ್ ತಂಡಗಳ ನಡುವೆ ನಡೆಯುವ 12 ಓವರ್‌ಗಳ ಕ್ರಿಕೆಟ್ ಪಂದ್ಯಾವಳಿ.',
    date: '2026-09-12',
    start_time: '09:00 AM',
    end_time: '05:30 PM',
    venue_en: 'Government PU College Ground',
    venue_kn: 'ಸರ್ಕಾರಿ ಪದವಿಪೂರ್ವ ಕಾಲೇಜು ಮೈದಾನ',
    organizer_en: 'Gramasiri Youth & Sports Association',
    organizer_kn: 'ಗ್ರಾಮಸಿರಿ ಯುವಕ ಮತ್ತು ಕ್ರೀಡಾ ಸಂಘ',
    organizer_phone: '+91 98800 34567',
    cover_image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
    status: 'LIVE',
    participants_count: 120,
    registered_uids: ['sports_103'],
    is_demo: true
  },
  {
    id: 'event_3',
    title_en: 'Organic Millets & Soil Health Workshop (Krishi Samvada)',
    title_kn: 'ಸಾವಯವ ಸಿರಿಧಾನ್ಯ ಮತ್ತು ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಯಾಗಾರ (ಕೃಷಿ ಸಂವಾದ)',
    description_en:
      'Expert agricultural scientists from GKVK and University of Agricultural Sciences will guide farmers on soil nutrient balancing, drip fertigation, and high-yield ragi varieties.',
    description_kn:
      'ಕೃಷಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ವಿಜ್ಞಾನಿಗಳಿಂದ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ರಕ್ಷಣೆ, ಹನಿ ನೀರಾವರಿ ಮತ್ತು ಅಧಿಕ ಇಳುವರಿ ರಾಗಿ ತಳಿಗಳ ಬಗ್ಗೆ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಹಾಗೂ ತರಬೇತಿ.',
    date: '2026-09-28',
    start_time: '10:30 AM',
    end_time: '02:00 PM',
    venue_en: 'Raitha Samparka Kendra (Farmers Center)',
    venue_kn: 'ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ, ಮಾರುಕಟ್ಟೆ ರಸ್ತೆ',
    organizer_en: 'Department of Agriculture & Grama Panchayat',
    organizer_kn: 'ಕೃಷಿ ಇಲಾಖೆ ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯತ್',
    cover_image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
    status: 'UPCOMING',
    participants_count: 85,
    registered_uids: ['user_104'],
    is_demo: true
  }
];

export const SEED_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourn_cricket_2026',
    name_en: 'Gramasiri Premier Cricket League 2026',
    name_kn: 'ಗ್ರಾಮಸಿರಿ ಪ್ರೀಮಿಯರ್ ಕ್ರಿಕೆಟ್ ಲೀಗ್ ೨೦೨೬',
    sport: 'CRICKET',
    year: 2026,
    status: 'LIVE',
    teams: [
      { id: 't1', name_en: 'Grama Warriors', name_kn: 'ಗ್ರಾಮ ವಾರಿಯರ್ಸ್', captain_en: 'Manjunath G', color: '#16A34A' },
      { id: 't2', name_en: 'Cauvery Tigers', name_kn: 'ಕಾವೇರಿ ಟೈಗರ್ಸ್', captain_en: 'Chethan Gowda', color: '#EA580C' },
      { id: 't3', name_en: 'Sahyadri Strikers', name_kn: 'ಸಹ್ಯಾದ್ರಿ ಸ್ಟ್ರೈಕರ್ಸ್', captain_en: 'Praveen K', color: '#2563EB' },
      { id: 't4', name_en: 'Keshava Kings', name_kn: 'ಕೇಶವ ಕಿಂಗ್ಸ್', captain_en: 'Suresh Babu', color: '#9333EA' }
    ],
    points_table: [
      { team_id: 't1', team_name: 'Grama Warriors', played: 3, won: 3, lost: 0, points: 6, nrr: '+1.850' },
      { team_id: 't2', team_name: 'Cauvery Tigers', played: 3, won: 2, lost: 1, points: 4, nrr: '+0.620' },
      { team_id: 't3', team_name: 'Sahyadri Strikers', played: 3, won: 1, lost: 2, points: 2, nrr: '-0.450' },
      { team_id: 't4', team_name: 'Keshava Kings', played: 3, won: 0, lost: 3, points: 0, nrr: '-1.920' }
    ],
    matches: [
      {
        id: 'match_101',
        tournament_id: 'tourn_cricket_2026',
        sport: 'CRICKET',
        team_a: 'Grama Warriors',
        team_b: 'Cauvery Tigers',
        team_a_score: '118/4 (10.0 ov)',
        team_b_score: '92/6 (8.2 ov)',
        team_a_overs: '10.0',
        team_b_overs: '8.2',
        current_status_en: 'Cauvery Tigers need 27 runs in 10 balls',
        current_status_kn: 'ಕಾವೇರಿ ಟೈಗರ್ಸ್‌ಗೆ ಗೆಲುವಿಗೆ 10 ಎಸೆತಗಳಲ್ಲಿ 27 ರನ್ ಬೇಕು',
        summary_en: 'Live: Chethan Gowda batting on 34* (18b). Bowler: Manjunath G (2/18).',
        summary_kn: 'ಚೇತನ್ ಗೌಡ 34* ಬ್ಯಾಟಿಂಗ್. ಬೌಲರ್: ಮಂಜುನಾಥ್ 2/18.',
        date: '2026-09-08',
        time: '04:00 PM',
        venue: 'PU College Ground',
        is_live: true,
        top_scorer: 'Chethan Gowda (34*)',
        top_bowler: 'Manjunath G (2/18 in 2.2 ov)',
        last_updated: '2026-09-08T18:25:00.000Z'
      }
    ],
    is_demo: true
  },
  {
    id: 'tourn_kabaddi_2026',
    name_en: 'Gramotsava Pro Kabaddi Trophy 2026',
    name_kn: 'ಗ್ರಾಮೋತ್ಸವ ಪ್ರೊ ಕಬಡ್ಡಿ ಟ್ರೋಫಿ ೨೦೨೬',
    sport: 'KABADDI',
    year: 2026,
    status: 'UPCOMING',
    teams: [
      { id: 'kb1', name_en: 'Hemavathi Bulls', name_kn: 'ಹೇಮಾವತಿ ಬುಲ್ಸ್', captain_en: 'Naveen Kumar', color: '#DC2626' },
      { id: 'kb2', name_en: 'Hoysala Lions', name_kn: 'ಹೊಯ್ಸಳ ಲಯನ್ಸ್', captain_en: 'Raghu R', color: '#D97706' }
    ],
    points_table: [],
    matches: [
      {
        id: 'match_201',
        tournament_id: 'tourn_kabaddi_2026',
        sport: 'KABADDI',
        team_a: 'Hemavathi Bulls',
        team_b: 'Hoysala Lions',
        team_a_score: '28',
        team_b_score: '24',
        current_status_en: 'Match scheduled for Saturday evening 6:00 PM',
        current_status_kn: 'ಶನಿವಾರ ಸಂಜೆ 6:00 ಕ್ಕೆ ಪಂದ್ಯ ಆರಂಭ',
        summary_en: 'First round knockout match under floodlights.',
        summary_kn: 'ಹೊನಲು ಬೆಳಕಿನ ಪ್ರಥಮ ಸುತ್ತಿನ ನಾಕೌಟ್ ಪಂದ್ಯ.',
        date: '2026-09-13',
        time: '06:00 PM',
        venue: 'Village Youth Club Court',
        is_live: false,
        raider_points: 'Naveen Kumar (11 pts)',
        last_updated: '2026-09-08T12:00:00.000Z'
      }
    ],
    is_demo: true
  }
];

export const SEED_CROPS: CropItem[] = [
  {
    id: 'crop_1',
    name_en: 'Ragi (Finger Millet)',
    name_kn: 'ರಾಗಿ (ಸಿರಿಧಾನ್ಯ)',
    category: 'MAIN',
    season_en: 'Kharif (June – November)',
    season_kn: 'ಮುಂಗಾರು (ಜೂನ್ – ನವೆಂಬರ್)',
    soil_type_en: 'Red loamy, well-drained fertile soils',
    soil_type_kn: 'ಕೆಂಪು ಜೇಡಿ ಮತ್ತು ಮರಳು ಮಿಶ್ರಿತ ಗೋಡು ಮಣ್ಣು',
    water_req_en: 'Moderate to drought tolerant (350–500 mm)',
    water_req_kn: 'ಮಿತ ನೀರು ಸಾಕು, ಬರ ನಿರೋಧಕ (೩೫೦-೫೦೦ ಮಿ.ಮೀ)',
    cultivation_en:
      'Direct sowing or nursery transplanting. Best suited varieties: MR-1, GPU-28, ML-365. Seed rate: 5 kg/acre. Requires organic compost application at field preparation.',
    cultivation_kn:
      'ನಾಟಿ ಅಥವಾ ಕೂರಿಗೆ ಬಿತ್ತನೆ. ಪ್ರಮುಖ ತಳಿಗಳು: ಎಂ.ಆರ್-೧, ಜಿ.ಪಿ.ಯು-೨೮, ಎಂ.ಎಲ್-೩೬೫. ಎಕರೆಗೆ ೫ ಕೆ.ಜಿ ಬಿತ್ತನೆ ಬೀಜ. ಚೆನ್ನಾಗಿ ಕಳಿತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಬಳಕೆ ಉಪಯುಕ್ತ.',
    uses_en: 'Staple nutrition: Ragi Mudde, porridge, malt, flour for rotis and dosas. Extremely high in calcium and fiber.',
    uses_kn: 'ರಾಗಿ ಮುದ್ದೆ, ಗಂಜಿ, ಅಂಬಲಿ, ರೊಟ್ಟಿ, ದೋಸೆ. ಅಧಿಕ ಕ್ಯಾಲ್ಸಿಯಂ ಮತ್ತು ನಾರಿನಂಶ ಭರಿತ.',
    advantages_en: 'Extremely resilient to dry spells; minimal pest attacks; excellent market price through MSP procurement centers.',
    advantages_kn: 'ಕಡಿಮೆ ನೀರಿನಲ್ಲಿ ಉತ್ತಮ ಇಳುವರಿ, ಕೀಟಬಾಧೆ ಕಡಿಮೆ, ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆ (MSP) ಮೂಲಕ ಖಚಿತ ಖರೀದಿ.',
    risks_en: 'Excessive stagnant rain during ear-head maturity causes grain blackening. Stem borer in early stage.',
    risks_kn: 'ತೆನೆ ಬರುವ ಹಂತದಲ್ಲಿ ಅತಿಯಾದ ಮಳೆ ಬಂದರೆ ಕಾಳು ಕಪ್ಪಾಗುವ ಸಂಭವ.',
    verified: true,
    source: 'University of Agricultural Sciences, Bangalore & Raitha Samparka Kendra',
    verified_date: '2026-06-10',
    image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
    is_demo: true
  },
  {
    id: 'crop_2',
    name_en: 'Arecanut (Supari)',
    name_kn: 'ಅಡಿಕೆ (ತೋಟಗಾರಿಕೆ)',
    category: 'MAIN',
    season_en: 'Perennial Commercial Plantation',
    season_kn: 'ಬಹುವಾರ್ಷಿಕ ವಾಣಿಜ್ಯ ಬೆಳೆ',
    soil_type_en: 'Deep laterite and well-drained clay loams',
    soil_type_kn: 'ಆಳವಾದ ಕೆಂಪು ಜಂಬಿಟ್ಟಿಗೆ ಮತ್ತು ಗೋಡು ಮಣ್ಣು',
    water_req_en: 'High moisture, regular drip irrigation (15–20 liters/palm/day)',
    water_req_kn: 'ನಿಯಮಿತ ಹನಿ ನೀರಾವರಿ ಅಗತ್ಯ (ದಿನಕ್ಕೆ ೧೫-೨೦ ಲೀಟರ್ ಪ್ರತಿ ಮರಕ್ಕೆ)',
    cultivation_en:
      'Planted at 9x9 feet spacing. Companion cropping with black pepper on trunks and banana as nurse crop. Requires regular potassium-rich fertilization.',
    cultivation_kn:
      '೯x೯ ಅಡಿ ಅಂತರದಲ್ಲಿ ಸಸಿ ನಾಟಿ. ಅಡಿಕೆ ಮರಗಳಿಗೆ ಕರಿಮೆಣಸಿನ ಬಳ್ಳಿ ಹಬ್ಬಿಸುವುದು ಮತ್ತು ಬಾಳೆ ಅಂತರಬೆಳೆ. ಪೊಟ್ಯಾಶ್ ಮತ್ತು ಬೇವಿನ ಹಿಂಡಿ ಪೋಷಣೆ.',
    uses_en: 'Masticatory nut, traditional ceremonial functions, herbal extracts and export.',
    uses_kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಪೂಜೆಗಳು, ಔಷಧೀಯ ಉತ್ಪನ್ನಗಳು ಮತ್ತು ವಾಣಿಜ್ಯ ಮಾರಾಟ.',
    advantages_en: 'High multi-year recurring cash return once established; inter-cropping provides secondary revenue.',
    advantages_kn: 'ದೀರ್ಘಾವಧಿಯ ಲಾಭದಾಯಕ ವಾಣಿಜ್ಯ ಬೆಳೆ, ಮೆಣಸು ಮತ್ತು ಏಲಕ್ಕಿ ಉಪ ಆದಾಯ.',
    risks_en: 'Koleroga (Fruit rot disease) during peak monsoons; yellow leaf disease (YLD); borewell depletion.',
    risks_kn: 'ಮಳೆಗಾಲದಲ್ಲಿ ಕೊಳೆರೋಗ (ಬೋರ್ಡೋ ದ್ರಾವಣ ಸಿಂಪಡಣೆ ಅಗತ್ಯ), ಹಳದಿ ಎಲೆ ರೋಗ.',
    verified: true,
    source: 'Central Plantation Crops Research Institute (CPCRI) & Horticulture Dept',
    verified_date: '2026-05-20',
    image_url: 'https://images.unsplash.com/photo-1598512752271-33f913a5af13?w=800',
    is_demo: true
  },
  {
    id: 'crop_3',
    name_en: 'Paddy (Rice)',
    name_kn: 'ಭತ್ತ',
    category: 'SEASONAL',
    season_en: 'Kharif & Rabi Wetland',
    season_kn: 'ಮುಂಗಾರು & ಹಿಂಗಾರು ತರಿ ಬೆಳೆ',
    soil_type_en: 'Clayey soils capable of water retention',
    soil_type_kn: 'ನೀರು ಹಿಡಿದಿಟ್ಟುಕೊಳ್ಳುವ ಜೇಡಿ ಮಣ್ಣು',
    water_req_en: 'High water requirement (1200–1400 mm)',
    water_req_kn: 'ಹೆಚ್ಚು ನೀರಿನ ಅಗತ್ಯ (೧೨೦೦-೧೪೦೦ ಮಿ.ಮೀ)',
    cultivation_en: 'System of Rice Intensification (SRI) or traditional puddle transplanting. Variety: Jaya, BPT-5204.',
    cultivation_kn: 'ಶ್ರೀ ಪದ್ಧತಿ ಅಥವಾ ಸಾಂಪ್ರದಾಯಿಕ ನಾಟಿ ಪದ್ಧತಿ. ತಳಿಗಳು: ಜಯ, ಸೋನಾ ಮಸೂರಿ (ಬಿಪಿಟಿ-೫೨೦೪).',
    uses_en: 'Primary village staple; straw utilized as cattle fodder.',
    uses_kn: 'ದೈನಂದಿನ ಆಹಾರ, ಭತ್ತದ ಹುಲ್ಲು ಜಾನುವಾರುಗಳಿಗೆ ಮೇವು.',
    advantages_en: 'Guaranteed household food security; high demand for organic brown rice.',
    advantages_kn: 'ಕುಟುಂಬದ ಆಹಾರ ಭದ್ರತೆ, ಸ್ಥಳೀಯ ಗಿರಣಿಗಳಲ್ಲಿ ಸುಲಭ ಸಂಸ್ಕರಣೆ.',
    risks_en: 'Blast disease in damp weather; dependence on lake canal water release.',
    risks_kn: 'ತೆನೆ ಬೆಂಕಿ ರೋಗ, ಕಾಲುವೆ ನೀರಿನ ಲಭ್ಯತೆಯ ಮೇಲಿನ ಅವಲಂಬನೆ.',
    verified: true,
    source: 'District Agriculture Training Institute',
    verified_date: '2026-06-15',
    image_url: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800',
    is_demo: true
  }
];

export const SEED_TEMPLES: TempleItem[] = [
  {
    id: 'temple_1',
    name_en: 'Sri Chennakeshava Swamy Temple',
    name_kn: 'ಶ್ರೀ ಚನ್ನಕೇಶವ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
    deity_en: 'Lord Maha Vishnu (Chennakeshava)',
    deity_kn: 'ಶ್ರೀ ಮಹಾವಿಷ್ಣು (ಚನ್ನಕೇಶವ)',
    history_en:
      'Constructed during the late Hoysala period around 1184 CE under King Veera Ballala II. Built on a star-shaped soapstone platform with intricate lathe-turned pillars, ceiling carvings depicting Dashavatara, and a majestic Dwajasthambha.',
    history_kn:
      'ಹೊಯ್ಸಳ ದೊರೆ ವೀರ ಬಲ್ಲಾಳ-೨ ರ ಕಾಲದಲ್ಲಿ (ಸುಮಾರು ಕ್ರಿ.ಶ. ೧೧೮೪) ನಿರ್ಮಾಣಗೊಂಡ ಐತಿಹಾಸಿಕ ತಾರಾಕಾರದ ದೇವಸ್ಥಾನ. ಸುಂದರ ಕಂಬಗಳು, ದಶಾವತಾರ ಶಿಲ್ಪಕಲೆ ಮತ್ತು ಎತ್ತರದ ಧ್ವಜಸ್ತಂಭವನ್ನು ಹೊಂದಿದೆ.',
    location_en: 'Car Street, Village Center, East Gate',
    location_kn: 'ರಥಬೀದಿ, ಗ್ರಾಮದ ಕೇಂದ್ರ ಭಾಗ, ಪೂರ್ವ ದ್ವಾರ',
    timings_en: 'Morning: 06:00 AM – 12:30 PM | Evening: 05:30 PM – 08:30 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ: ೦೬:೦೦ – ೧೨:೩೦ | ಸಂಜೆ: ೦೫:೩೦ – ೦೮:೩೦',
    festivals_en: 'Brahmarathotsava (Phalguna month), Vaikuntha Ekadashi, Krishna Janmashtami',
    festivals_kn: 'ಬ್ರಹ್ಮ ರಥೋತ್ಸವ (ಫಾಲ್ಗುಣ ಮಾಸ), ವೈಕುಂಠ ಏಕಾದಶಿ, ಶ್ರೀಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮಿ',
    special_pooja_en: 'Special Sahasranama Archana and Maha Prasada on every Saturday and Ekadashi',
    special_pooja_kn: 'ಪ್ರತಿ ಶನಿವಾರ ಮತ್ತು ಏಕಾದಶಿಯಂದು ಸಹಸ್ರನಾಮ ಅರ್ಚನೆ ಮತ್ತು ಮಹಾ ಪ್ರಸಾದ ವಿನಿಯೋಗ',
    image_url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800',
    verified: true,
    source: 'Karnataka State Archaeology Department Epigraphia Carnatica Vol. V',
    is_demo: true
  },
  {
    id: 'temple_2',
    name_en: 'Sri Rameshwara Temple (Eshwara)',
    name_kn: 'ಶ್ರೀ ರಾಮೇಶ್ವರ ದೇವಸ್ಥಾನ',
    deity_en: 'Lord Shiva (Rameshwara Linga)',
    deity_kn: 'ಶ್ರೀ ಶಿವ (ರಾಮೇಶ್ವರ ಲಿಂಗ)',
    history_en:
      'Located on the scenic northern banks of the village lake. Features an ancient Kalyani (sacred water stepwell) and inscriptions commending water conservation works commissioned in 1432 CE during the Vijayanagara Empire.',
    history_kn:
      'ಗ್ರಾಮದ ಕೆರೆಯ ಉತ್ತರ ದಡದಲ್ಲಿರುವ ಪುರಾತನ ಶಿವಾಲಯ. ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ಕಾಲದ (ಕ್ರಿ.ಶ. ೧೪೩೨) ಸುಂದರ ಮೆಟ್ಟಿಲು ಬಾವಿ (ಕಲ್ಯಾಣಿ) ಮತ್ತು ಕೆರೆ ನಿರ್ಮಾಣದ ಶಾಸನ ಇಲ್ಲಿದೆ.',
    location_en: 'North Lake Bund, Near Banyan Grove',
    location_kn: 'ಉತ್ತರ ಕೆರೆ ಏರಿ, ಆಲದ ಮರದ ಬಳಿ',
    timings_en: 'Morning: 06:30 AM – 11:30 AM | Evening: 05:00 PM – 08:00 PM',
    timings_kn: 'ಬೆಳಗ್ಗೆ: ೦೬:೩೦ – ೧೧:೩೦ | ಸಂಜೆ: ೦೫:೦೦ – ೦೮:೦೦',
    festivals_en: 'Maha Shivaratri, Karthika Somavara Deepotsava, Laksha Deepotsava',
    festivals_kn: 'ಮಹಾ ಶಿವರಾತ್ರಿ, ಕಾರ್ತಿಕ ಸೋಮವಾರದ ದೀಪೋತ್ಸವ, ಲಕ್ಷ ದೀಪೋತ್ಸವ',
    special_pooja_en: 'Rudrabhisheka on Pradosha days and every Monday morning',
    special_pooja_kn: 'ಪ್ರದೋಷ ಕಾಲದಲ್ಲಿ ಹಾಗೂ ಸೋಮವಾರ ಬೆಳಗ್ಗೆ ರುದ್ರಾಭಿಷೇಕ',
    image_url: 'https://images.unsplash.com/photo-1621682372775-533449e550ed?w=800',
    verified: true,
    source: 'Heritage Preservation Cell & Temple Records',
    is_demo: true
  },
  {
    id: 'temple_3',
    name_en: 'Grama Devathe Sri Mariyamma Temple',
    name_kn: 'ಗ್ರಾಮ ದೇವತೆ ಶ್ರೀ ಮಾರಿಯಮ್ಮ ದೇವಸ್ಥಾನ',
    deity_en: 'Grama Devathe (Village Guardian Goddess)',
    deity_kn: 'ಗ್ರಾಮ ದೇವತೆ (ಗ್ರಾಮ ರಕ್ಷಕಿ)',
    history_en:
      'The sacred guardian deity revered by every household of the village. The sanctum was established by the founding families over three centuries ago to protect the settlement from epidemics and natural calamities.',
    history_kn:
      'ಗ್ರಾಮದ ಸಮಸ್ತ ಜನರ ರಕ್ಷಕಿಯಾಗಿ ಪೂಜಿಸಲ್ಪಡುವ ತಾಯಿ. ಮೂರು ಶತಮಾನಗಳ ಹಿಂದೆ ಗ್ರಾಮ ಸ್ಥಾಪಕರ ಕುಟುಂಬಗಳಿಂದ ಗ್ರಾಮ ರಕ್ಷಣೆಗಾಗಿ ಪ್ರತಿಷ್ಠಾಪಿಸಲ್ಪಟ್ಟ ಶಕ್ತಿ ಕ್ಷೇತ್ರ.',
    location_en: 'Village South Gateway, Grama Kanteerava Circle',
    location_kn: 'ದಕ್ಷಿಣ ಪ್ರವೇಶ ದ್ವಾರ, ಕಂಠೀರವ ವೃತ್ತದ ಬಳಿ',
    timings_en: 'Tuesday & Friday: Full day (07:00 AM – 09:00 PM) | Other days: 07:00 AM – 12:00 PM',
    timings_kn: 'ಮಂಗಳವಾರ & ಶುಕ್ರವಾರ: ಬೆಳಗ್ಗೆ ೦೭:೦೦ ರಿಂದ ರಾತ್ರಿ ೦೯:೦೦ | ಇತರ ದಿನ: ೦೭:೦೦ – ೧೨:೦೦',
    festivals_en: 'Grama Jatre (Held triennially in Chaitra month), Navaratri Puja',
    festivals_kn: 'ಗ್ರಾಮ ಜಾತ್ರೆ (ಮೂರು ವರ್ಷಕ್ಕೊಮ್ಮೆ ಚೈತ್ರ ಮಾಸದಲ್ಲಿ), ನವರಾತ್ರಿ ಉತ್ಸವ',
    special_pooja_en: 'Kunkumarchana and Tambila Seva every Tuesday and Friday',
    special_pooja_kn: 'ಪ್ರತಿ ಮಂಗಳವಾರ ಮತ್ತು ಶುಕ್ರವಾರ ಕುಂಕುಮಾರ್ಚನೆ ಮತ್ತು ತಂಬಿಲ ಸೇವೆ',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
    verified: true,
    source: 'Grama Samithi Heritage Oral Archive & Trustees',
    is_demo: true
  }
];

export const SEED_HISTORY: HistoryItem[] = [
  {
    id: 'hist_1',
    year: '1184 CE',
    title_en: 'Hoysala Inscription & Founding of the Sacred Settlement',
    title_kn: 'ಹೊಯ್ಸಳ ಶಾಸನ ಮತ್ತು ಗ್ರಾಮದ ಉಗಮ',
    content_en:
      'A stone inscription discovered near the lake sluice records the grant of land (Agrahara) by King Veera Ballala II to learned scholars and artisans for temple upkeep and watershed maintenance.',
    content_kn:
      'ಕೆರೆಯ ಕೋಡಿ ಬಳಿ ದೊರೆತ ಶಿಲಾಶಾಸನದ ಪ್ರಕಾರ, ಹೊಯ್ಸಳ ದೊರೆ ವೀರ ಬಲ್ಲಾಳ-೨ ರ ಆಳ್ವಿಕೆಯಲ್ಲಿ ದೇವಸ್ಥಾನ ಮತ್ತು ಜಲಮೂಲಗಳ ರಕ್ಷಣೆಗಾಗಿ ಅಗ್ರಹಾರ ಭೂದಾನ ನೀಡಿದ ಉಲ್ಲೇಖವಿದೆ.',
    type: 'HISTORICAL_FACT',
    verified: true,
    source: 'Epigraphia Carnatica Vol. V, Inscription No. 72',
    is_demo: true
  },
  {
    id: 'hist_2',
    year: '1952',
    title_en: 'First Primary Government School Established by Villagers',
    title_kn: 'ಗ್ರಾಮಸ್ಥರ ಸಹಭಾಗಿತ್ವದಲ್ಲಿ ಪ್ರಥಮ ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಆರಂಭ',
    content_en:
      'Elders of the village pooled donations and volunteered physical labor (Shramadana) to build the first tiled two-room school building, bringing formal education to surrounding hamlets.',
    content_kn:
      'ಗ್ರಾಮದ ಹಿರಿಯರು ಶ್ರಮದಾನ ಮತ್ತು ವಂತಿಗೆ ಸಂಗ್ರಹಿಸಿ ಹೆಂಚಿನ ಎರಡು ಕೊಠಡಿಗಳ ಶಾಲಾ ಕಟ್ಟಡ ನಿರ್ಮಿಸಿ ಸುತ್ತಮುತ್ತಲಿನ ಹಳ್ಳಿಗಳ ಮಕ್ಕಳಿಗೆ ಅಕ್ಷರ ದಾಸೋಹ ಆರಂಭಿಸಿದರು.',
    type: 'HISTORICAL_FACT',
    verified: true,
    source: 'Grama Panchayat Resolution Book 1952',
    is_demo: true
  },
  {
    id: 'hist_3',
    year: '1976',
    title_en: 'Village Electrification and Installation of Lift Irrigation',
    title_kn: 'ಗ್ರಾಮಕ್ಕೆ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಮತ್ತು ಏತ ನೀರಾವರಿ ಯೋಜನೆ',
    content_en:
      'Under the state rural development mission, 120 electric poles connected the village to the state grid, powering the first community agricultural lift irrigation pumps from the Hemavathi canal basin.',
    content_kn:
      'ರಾಜ್ಯ ಗ್ರಾಮೀಣ ವಿದ್ಯುದೀಕರಣ ಯೋಜನೆಯಡಿ ಗ್ರಾಮಕ್ಕೆ ವಿದ್ಯುತ್ ಲೈನ್‌ಗಳು ತಲುಪಿ, ಹೇಮಾವತಿ ಉಪಕಾಲುವೆಯಿಂದ ಪ್ರಥಮ ಏತ ನೀರಾವರಿ ಪಂಪ್‌ಗಳು ಚಾಲನೆಗೊಂಡವು.',
    type: 'HISTORICAL_FACT',
    verified: true,
    source: 'KPTCL Rural Division Archive',
    is_demo: true
  },
  {
    id: 'hist_4',
    year: 'Ancient Folk Legend',
    title_en: 'Legend of the Sacred Guardian Banyan Tree',
    title_kn: 'ಪವಿತ್ರ ಕಲ್ಪವೃಕ್ಷ ಆಲದ ಮರದ ಸ್ಥಳೀಯ ಐತಿಹ್ಯ',
    content_en:
      'Local folklore recounts that wandering rishis meditated beneath the giant 300-year-old banyan tree near the northern lake, blessing the village never to experience severe famine.',
    content_kn:
      'ಗ್ರಾಮದ ಉತ್ತರ ಭಾಗದಲ್ಲಿರುವ ೩೦೦ ವರ್ಷ ಹಳೆಯ ದೊಡ್ಡ ಆಲದ ಮರದ ಕೆಳಗೆ ಪುರಾತನ ಋಷಿಗಳು ತಪಸ್ಸು ಮಾಡಿ, ಈ ಗ್ರಾಮಕ್ಕೆ ಬರಗಾಲ ಬಾರದಂತೆ ಆಶೀರ್ವದಿಸಿದರೆಂಬ ನಂಬಿಕೆ ಹಿರಿಯರಿಂದ ನಡೆದುಬಂದಿದೆ.',
    type: 'LOCAL_TRADITION',
    verified: true,
    source: 'Village Oral Folklore Tradition (Clearly designated as Community Tradition, not official archaeological fact)',
    is_demo: true
  }
];

export const SEED_STORIES: StoryItem[] = [
  {
    id: 'story_1',
    title_en: 'The Golden Harvest of 1982: How the Village Overcame Drought',
    title_kn: '೧೯೮೨ರ ಬಂಗಾರದ ಬೆಳೆ: ಬರಗಾಲವನ್ನು ಎದುರಿಸಿದ ಗ್ರಾಮದ ಕಥೆ',
    storyteller_en: 'Recorded from Elder Subbanna (Age 84)',
    storyteller_kn: 'ಹಿರಿಯರಾದ ಸುಬ್ಬಣ್ಣ (೮೪ ವರ್ಷ) ಅವರ ನೆನಪುಗಳಿಂದ',
    content_en:
      'In the severe monsoon deficit of 1982, every family joined hands to deepen the silted lake bed using bullock carts. The water retained from a single late shower saved the entire winter ragi crop.',
    content_kn:
      '೧೯೮೨ರಲ್ಲಿ ಮಳೆ ಕೈಕೊಟ್ಟಾಗ ಗ್ರಾಮದ ಪ್ರತಿ ಮನೆಯವರೂ ಎತ್ತಿನ ಗಾಡಿಗಳೊಂದಿಗೆ ಕೆರೆಯ ಹೂಳೆತ್ತುವ ಕಾರ್ಯದಲ್ಲಿ ಕೈಜೋಡಿಸಿದರು. ನಂತರ ಬಂದ ಒಂದು ಮಳೆಯ ನೀರನ್ನು ಕೆರೆಯಲ್ಲಿ ಹಿಡಿದಿಟ್ಟು ಇಡೀ ಗ್ರಾಮದ ರಾಗಿ ಬೆಳೆ ಉಳಿಸಿಕೊಂಡ ರೋಚಕ ಕಥೆ.',
    category: 'HERO',
    type: 'COMMUNITY_STORY',
    author_id: 'mod_102',
    verified: true,
    created_at: '2026-08-01',
    is_demo: true
  }
];

export const SEED_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach_1',
    person_name_en: 'Kavitha M. Gowda',
    person_name_kn: 'ಕವಿತಾ ಎಂ. ಗೌಡ',
    category: 'ATHLETE',
    title_en: 'Gold Medalist - Karnataka State Under-19 400m Track & Field',
    title_kn: 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಮಟ್ಟದ ಅಂಡರ್-೧೯ ೪೦೦ ಮೀಟರ್ ಓಟದ ಚಿನ್ನದ ಪದಕ ವಿಜೇತೆ',
    description_en:
      'Daughter of agricultural laborer Manjunath, trained on our village school ground without synthetic tracks. Selected to represent Karnataka at the National Youth Games.',
    description_kn:
      'ನಮ್ಮ ಗ್ರಾಮದ ಸರ್ಕಾರಿ ಶಾಲಾ ಮೈದಾನದಲ್ಲಿ ಅಭ್ಯಾಸ ನಡೆಸಿ ರಾಜ್ಯ ಮಟ್ಟದಲ್ಲಿ ೪೦೦ ಮೀಟರ್ ಓಟದಲ್ಲಿ ಪ್ರಥಮ ಸ್ಥಾನ ಗಳಿಸಿ ರಾಷ್ಟ್ರೀಯ ಕ್ರೀಡಾಕೂಟಕ್ಕೆ ಆಯ್ಕೆಯಾದ ಗ್ರಾಮದ ಹೆಮ್ಮೆಯ ಮಗಳು.',
    year: 2026,
    photo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    verified: true,
    consent_verified: true,
    is_demo: true
  },
  {
    id: 'ach_2',
    person_name_en: 'Shivanna Bettappa',
    person_name_kn: 'ಶಿವಣ್ಣ ಬೆಟ್ಟಪ್ಪ',
    category: 'FARMER',
    title_en: 'State Krishi Pandit Award for Zero-Budget Natural Farming',
    title_kn: 'ಶೂನ್ಯ ಬಂಡವಾಳ ನೈಸರ್ಗಿಕ ಕೃಷಿಗಾಗಿ ರಾಜ್ಯ ಕೃಷಿ ಪಂಡಿತ ಪ್ರಶಸ್ತಿ ಪುರಸ್ಕೃತರು',
    description_en:
      'Transformed 4 acres of degraded land into an integrated organic paradise using Jeevamrutha and multi-tier cropping, hosting over 500 visiting farmers annually.',
    description_kn:
      '೪ ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಸಂಪೂರ್ಣ ನೈಸರ್ಗಿಕ ಕೃಷಿ ಪದ್ಧತಿಯಲ್ಲಿ ಜೀವಾಮೃತ ಬಳಸಿ ಯಶಸ್ವಿ ತೋಟಗಾರಿಕೆ ಮಾಡಿ ವಾರ್ಷಿಕ ನೂರಾರು ರೈತರಿಗೆ ಉಚಿತ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತಿರುವ ಆದರ್ಶ ಕೃಷಿಕರು.',
    year: 2025,
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    verified: true,
    consent_verified: true,
    is_demo: true
  },
  {
    id: 'ach_3',
    person_name_en: 'Ananya S. Rao',
    person_name_kn: 'ಅನನ್ಯಾ ಎಸ್. ರಾವ್',
    category: 'STUDENT',
    title_en: 'District Rank 2 in Karnataka SSLC Board Examination (622/625)',
    title_kn: 'ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಜಿಲ್ಲೆಗೆ ದ್ವಿತೀಯ ಸ್ಥಾನ (೬೨೨/೬೨೫)',
    description_en:
      'Studied throughout in the local Government Model Higher Primary and High School, achieving a historic score for the taluk.',
    description_kn:
      'ಗ್ರಾಮದ ಸರ್ಕಾರಿ ಪ್ರೌಢಶಾಲೆಯಲ್ಲಿ ಕನ್ನಡ ಮಾಧ್ಯಮದಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡಿ ೬೨೫ಕ್ಕೆ ೬೨೨ ಅಂಕ ಗಳಿಸಿ ತಾಲೂಕಿಗೆ ಕೀರ್ತಿ ತಂದ ಪ್ರತಿಭಾನ್ವಿತೆ.',
    year: 2026,
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
    verified: true,
    consent_verified: true,
    is_demo: true
  }
];

export const SEED_GALLERY: GalleryItem[] = [
  {
    id: 'gal_1',
    title_en: 'Dawn over the Village Lake & Banyan Grove',
    title_kn: 'ಮುಂಜಾನೆಯ ಗ್ರಾಮದ ಕೆರೆ ಮತ್ತು ಆಲದ ಮರದ ದೃಶ್ಯ',
    category: 'NATURE',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000',
    media_type: 'IMAGE',
    author_id: 'admin_101',
    author_name: 'Basavaraj Patel',
    approved: true,
    likes_count: 54,
    liked_by: [],
    created_at: '2026-09-01',
    is_demo: true
  },
  {
    id: 'gal_2',
    title_en: 'Golden Paddy Harvest Season Celebration',
    title_kn: 'ಭತ್ತದ ಕಟಾವಿನ ಸಂಭ್ರಮ',
    category: 'AGRICULTURE',
    url: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=1000',
    media_type: 'IMAGE',
    author_id: 'user_104',
    author_name: 'Ramesh Kumar',
    approved: true,
    likes_count: 72,
    liked_by: [],
    created_at: '2026-08-25',
    is_demo: true
  },
  {
    id: 'gal_3',
    title_en: 'Car Street Illuminated for Annual Rathotsava',
    title_kn: 'ರಥೋತ್ಸವದ ಸಂದರ್ಭದಲ್ಲಿ ದೀಪಾಲಂಕೃತ ರಥಬೀದಿ',
    category: 'FESTIVAL',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000',
    media_type: 'IMAGE',
    author_id: 'mod_102',
    author_name: 'Sharada Kulkarni',
    approved: true,
    likes_count: 88,
    liked_by: [],
    created_at: '2026-08-10',
    is_demo: true
  },
  {
    id: 'gal_4',
    title_en: 'Local Youth Cricket Match in Full Swing',
    title_kn: 'ಶಾಲಾ ಮೈದಾನದಲ್ಲಿ ಯುವಕರ ಕ್ರಿಕೆಟ್ ಪಂದ್ಯಾವಳಿ',
    category: 'SPORTS',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000',
    media_type: 'IMAGE',
    author_id: 'sports_103',
    author_name: 'Manjunath Gowda',
    approved: true,
    likes_count: 41,
    liked_by: [],
    created_at: '2026-09-04',
    is_demo: true
  }
];

export const SEED_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'soc_1',
    platform: 'YOUTUBE',
    url: 'https://youtube.com',
    label_en: 'Gramasiri Official Village Channel (Live Fest & Meetings)',
    label_kn: 'ಗ್ರಾಮಸಿರಿ ಅಧಿಕೃತ ಯೂಟ್ಯೂಬ್ ಚಾನೆಲ್ (ನೇರ ಪ್ರಸಾರ & ಸಭೆಗಳು)',
    verified_official: true,
    handle_or_group: '@GramasiriOfficial',
    is_demo: true
  },
  {
    id: 'soc_2',
    platform: 'WHATSAPP',
    url: 'https://whatsapp.com',
    label_en: 'Gramasiri Citizens Official Announcement Community',
    label_kn: 'ಗ್ರಾಮಸಿರಿ ನಾಗರಿಕರ ಅಧಿಕೃತ ವಾಟ್ಸಾಪ್ ಕಮ್ಯೂನಿಟಿ',
    verified_official: true,
    handle_or_group: 'Gramasiri Verified Community (1,450 members)',
    is_demo: true
  },
  {
    id: 'soc_3',
    platform: 'INSTAGRAM',
    url: 'https://instagram.com',
    label_en: 'Gramasiri Heritage & Cultural Society',
    label_kn: 'ಗ್ರಾಮಸಿರಿ ಸಾಂಸ್ಕೃತಿಕ ಮತ್ತು ಯುವ ಸಂಘಟನಾ ವೇದಿಕೆ',
    verified_official: true,
    handle_or_group: '@gramasiri_heritage',
    is_demo: true
  },
  {
    id: 'soc_4',
    platform: 'FACEBOOK',
    url: 'https://facebook.com',
    label_en: 'Gramasiri Raitha Samparka & Krishi Sahakara Sangha',
    label_kn: 'ಗ್ರಾಮಸಿರಿ ರೈತ ಸಂಪರ್ಕ ಮತ್ತು ಕೃಷಿ ಸಹಕಾರ ಸಂಘ',
    verified_official: true,
    handle_or_group: 'Gramasiri Raitha Vedike',
    is_demo: true
  }
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_admin_user104',
    participants: ['admin_101', 'user_104'],
    participant_names: {
      admin_101: 'Basavaraj Patel',
      user_104: 'Ramesh Kumar'
    },
    participant_photos: {
      admin_101: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      user_104: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    participant_roles: {
      admin_101: 'SUPER_ADMIN',
      user_104: 'USER'
    },
    last_message_text: 'ನಮಸ್ಕಾರ ಬಸವರಾಜ್ ಅವರೇ, ನಾಳಿನ ರಾಗಿ ಕಟಾವು ಯಂತ್ರದ ಸಬ್ಸಿಡಿ ಸಭೆಗೆ ಹಾಜರಾಗಬಹುದೇ?',
    last_message_at: '2026-09-08T16:30:00.000Z',
    last_sender_id: 'user_104',
    unread_counts: {
      admin_101: 1,
      user_104: 0
    },
    updated_at: '2026-09-08T16:30:00.000Z'
  },
  {
    id: 'conv_admin_sports103',
    participants: ['admin_101', 'sports_103'],
    participant_names: {
      admin_101: 'Basavaraj Patel',
      sports_103: 'Manjunath Gowda'
    },
    participant_photos: {
      admin_101: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      sports_103: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    participant_roles: {
      admin_101: 'SUPER_ADMIN',
      sports_103: 'SPORTS_ORGANIZER'
    },
    last_message_text: 'Ground lighting and floodlights arrangement is completed for the State Level Kabaddi Cup!',
    last_message_at: '2026-09-08T17:15:00.000Z',
    last_sender_id: 'sports_103',
    unread_counts: {
      admin_101: 0,
      sports_103: 0
    },
    updated_at: '2026-09-08T17:15:00.000Z'
  }
];

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_001',
    conversation_id: 'conv_admin_user104',
    sender_id: 'admin_101',
    sender_name: 'Basavaraj Patel',
    sender_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    text: 'ನಮಸ್ಕಾರ ರಮೇಶ್ ಅವರೇ, ಈ ಬಾರಿಯ ಸಿರಿಧಾನ್ಯ ಪ್ರೋತ್ಸಾಹಧನ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದೀರಾ?',
    created_at: '2026-09-08T15:45:00.000Z',
    read_by: ['admin_101', 'user_104'],
    status: 'READ'
  },
  {
    id: 'msg_002',
    conversation_id: 'conv_admin_user104',
    sender_id: 'user_104',
    sender_name: 'Ramesh Kumar',
    sender_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    text: 'ಹೌದು ಅಧ್ಯಕ್ಷರೇ, ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕಚೇರಿಯಲ್ಲಿ ನಿನ್ನೆ ದಾಖಲೆ ಸಲ್ಲಿಸಿದ್ದೇನೆ.',
    created_at: '2026-09-08T16:05:00.000Z',
    read_by: ['admin_101', 'user_104'],
    status: 'READ'
  },
  {
    id: 'msg_003',
    conversation_id: 'conv_admin_user104',
    sender_id: 'user_104',
    sender_name: 'Ramesh Kumar',
    sender_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    text: 'ನಮಸ್ಕಾರ ಬಸವರಾಜ್ ಅವರೇ, ನಾಳಿನ ರಾಗಿ ಕಟಾವು ಯಂತ್ರದ ಸಬ್ಸಿಡಿ ಸಭೆಗೆ ಹಾಜರಾಗಬಹುದೇ?',
    created_at: '2026-09-08T16:30:00.000Z',
    read_by: ['user_104'],
    status: 'SENT'
  },
  {
    id: 'msg_004',
    conversation_id: 'conv_admin_sports103',
    sender_id: 'admin_101',
    sender_name: 'Basavaraj Patel',
    sender_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    text: 'Manjunath, how is the ground preparation going for the Dasara tournament?',
    created_at: '2026-09-08T16:50:00.000Z',
    read_by: ['admin_101', 'sports_103'],
    status: 'READ'
  },
  {
    id: 'msg_005',
    conversation_id: 'conv_admin_sports103',
    sender_id: 'sports_103',
    sender_name: 'Manjunath Gowda',
    sender_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    text: 'Ground lighting and floodlights arrangement is completed for the State Level Kabaddi Cup!',
    created_at: '2026-09-08T17:15:00.000Z',
    read_by: ['admin_101', 'sports_103'],
    status: 'READ'
  }
];

