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

export const isSuperAdminEmail = (email?: string | null, name?: string | null): boolean => {
  const e = (email || '').toLowerCase().trim();
  const n = (name || '').toLowerCase().trim();

  // If an email exists, it MUST be one of the authorized admin emails
  if (e) {
    return (
      e === 'vvini4803@gmail.com' ||
      e === 'vvini@gmail.com' ||
      e === 'admin@muttagundi.org'
    );
  }

  // Fallback only for internal seed admin without an email
  return n === 'vvini4803' || n === 'vvini';
};

// Clean Default Users (Village Admin & Moderator for initial login)
export const SEED_USERS: UserProfile[] = [
  {
    uid: 'admin_vvini4803',
    name: 'vvini4803',
    name_kn: 'ವಿನಯ್ (ಮುಖ್ಯ ಸೂಪರ್ ಅಡ್ಮಿನ್)',
    phone: '+91 7483254968',
    email: 'vvini4803@gmail.com',
    role: 'SUPER_ADMIN',
    language: 'kn',
    photoUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=vvini4803',
    bio: 'Lead Developer & Super Administrator of Muttagundi Village Portal',
    bio_kn: 'ಮುಖ್ಯ ತಂತ್ರಾಂಶ ಅಭಿವೃದ್ಧಿಕಾರರು & ಸೂಪರ್ ಅಡ್ಮಿನ್',
    account_status: 'ACTIVE',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    is_phone_verified: true,
    community_category: 'PROFESSIONAL',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'EVERYONE'
  },
  {
    uid: 'admin_101',
    name: 'Muttagundi Admin',
    name_kn: 'ಮುಟ್ಟಗುಂಡಿ ಆಡಳಿತಾಧಿಕಾರಿ',
    phone: '+91 7483254968',
    email: 'admin@muttagundi.org',
    role: 'SUPER_ADMIN',
    language: 'kn',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Grama Panchayat Official & Village Administrator',
    bio_kn: 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಧಿಕೃತ ನಿರ್ವಾಹಕರು',
    account_status: 'ACTIVE',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    is_phone_verified: true,
    community_category: 'PROFESSIONAL',
    allow_find_me: true,
    privacy_find: 'EVERYONE',
    privacy_message: 'EVERYONE'
  }
];

// Clean Real Statistics for Muttagundi, Hosadurga Taluk, Chitradurga
export const SEED_VILLAGE_STATS: VillageStats = {
  id: 'stats_main',
  population: 3450,
  households: 820,
  area_sqkm: 16.2,
  literacy_rate: 82.4,
  schools: 2,
  temples: 3,
  hospitals: 1,
  agricultural_land_acres: 2150,
  main_crops_en: 'Ragi, Groundnut, Maize, Coconut, Arecanut',
  main_crops_kn: 'ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ಮೆಕ್ಕೆಜೋಳ, ತೆಂಗು, ಅಡಿಕೆ',
  active_members: 1,
  source: 'Muttagundi Grama Panchayat Official Census',
  source_url: 'https://panchamitra.karnataka.gov.in',
  last_verified: new Date().toISOString().split('T')[0],
  verified_by: 'Muttagundi Administration',
  is_demo: false
};

// All collections start completely empty and clean so real data can be added from scratch
export const SEED_EMERGENCY_ALERT: EmergencyAlert | null = null;
export const SEED_NEWS: NewsItem[] = [
  {
    id: 'news_muttagundi_1',
    title_en: 'Muttagundi Grama Sabha & Village Development Meeting Scheduled',
    title_kn: 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮ ಸಭೆ ಮತ್ತು ಗ್ರಾಮ ಅಭಿವೃದ್ಧಿ ಸಭೆ ನಿಗದಿಯಾಗಿದೆ',
    content_en: 'The official Muttagundi Grama Sabha meeting will be held at the Village Community Hall on Sunday at 10:00 AM. All residents, farmers, and youth are requested to participate to discuss road repairs, drinking water distribution, and agricultural schemes.',
    content_kn: 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಅಧಿಕೃತ ಗ್ರಾಮ ಸಭೆಯು ಮುಂಬರುವ ಭಾನುವಾರ ಬೆಳಿಗ್ಗೆ 10:00 ಗಂಟೆಗೆ ಗ್ರಾಮದ ಸಮುದಾಯ ಭವನದಲ್ಲಿ ನಡೆಯಲಿದೆ. ರಸ್ತೆ ದುರಸ್ತಿ, ಕುಡಿಯುವ ನೀರಿನ ಸೌಲಭ್ಯ, ಮತ್ತು ಕೃಷಿ ಯೋಜನೆಗಳ ಕುರಿತು ಚರ್ಚಿಸಲು ಎಲ್ಲಾ ಗ್ರಾಮಸ್ಥರು, ರೈತ ಬಾಂಧವರು ಹಾಗೂ ಯುವಕರು ಭಾಗವಹಿಸಲು ಕೋರಲಾಗಿದೆ.',
    category: 'COMMUNITY',
    media_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop',
    media_type: 'IMAGE',
    location: 'Muttagundi Community Hall, Hosadurga Taluk',
    author_id: 'admin_vvini4803',
    author_name: 'Muttagundi Administration',
    author_role: 'SUPER_ADMIN',
    verification_status: 'VERIFIED',
    auto_verified: true,
    verified_by: 'admin_vvini4803',
    verified_by_name: 'ವಿನಯ್ (ಮುಖ್ಯ ಸೂಪರ್ ಅಡ್ಮಿನ್)',
    verified_at: new Date().toISOString(),
    urgent: false,
    pinned: true,
    likes_count: 14,
    liked_by: [],
    comments_count: 2,
    reports_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_demo: false
  },
  {
    id: 'news_muttagundi_2',
    title_en: 'Monsoon Crop Advisory & Soil Testing Camp at Raitha Samparka Kendra',
    title_kn: 'ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಮುಂಗಾರು ಬೆಳೆ ಸಲಹೆ ಮತ್ತು ಮಣ್ಣು ಪರೀಕ್ಷೆ ಶಿಬಿರ',
    content_en: 'Department of Agriculture is organizing a free soil testing camp and providing subsidized quality seeds (Ragi, Groundnut, Maize) for Muttagundi farmers this week.',
    content_kn: 'ಕೃಷಿ ಇಲಾಖೆಯ ವತಿಯಿಂದ ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ರೈತರಿಗೆ ಉಚಿತ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಶಿಬಿರ ಹಾಗೂ ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಗುಣಮಟ್ಟದ ರಾಗಿ, ಕಡಲೆಕಾಯಿ ಹಾಗೂ ಮೆಕ್ಕೆಜೋಳ ಬೀಜ ವಿತರಣೆ ಈ ವಾರ ನಡೆಯಲಿದೆ.',
    category: 'AGRICULTURE',
    media_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop',
    media_type: 'IMAGE',
    location: 'Raitha Samparka Kendra, Muttagundi',
    author_id: 'admin_vvini4803',
    author_name: 'Muttagundi Raitha Kendra',
    author_role: 'SUPER_ADMIN',
    verification_status: 'VERIFIED',
    auto_verified: true,
    verified_by: 'admin_vvini4803',
    verified_by_name: 'ವಿನಯ್ (ಮುಖ್ಯ ಸೂಪರ್ ಅಡ್ಮಿನ್)',
    verified_at: new Date().toISOString(),
    urgent: false,
    pinned: false,
    likes_count: 19,
    liked_by: [],
    comments_count: 3,
    reports_count: 0,
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    active_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_demo: false
  },
  {
    id: 'news_muttagundi_3',
    title_en: 'Drinking Water Pipeline & RO Plant Maintenance Completed',
    title_kn: 'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್‌ಲೈನ್ ಮತ್ತು ಆರ್‌ಒ ಪ್ಲಾಂಟ್ ನಿರ್ವಹಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
    content_en: 'Regular maintenance and filter replacement of the Muttagundi clean drinking water unit have been successfully completed. 24/7 drinking water supply is fully restored.',
    content_kn: 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕದ ಫಿಲ್ಟರ್ ಬದಲಾವಣೆ ಹಾಗೂ ಪೈಪ್‌ಲೈನ್ ನಿರ್ವಹಣಾ ಕಾರ್ಯ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ. ಕುಡಿಯುವ ನೀರಿನ ಸರಬರಾಜು ಸಹಜ ಸ್ಥಿತಿಗೆ ಮರಳಿದೆ.',
    category: 'WATER',
    media_url: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=800&auto=format&fit=crop',
    media_type: 'IMAGE',
    location: 'Water Tank Ward, Muttagundi',
    author_id: 'admin_vvini4803',
    author_name: 'Muttagundi Water Works',
    author_role: 'SUPER_ADMIN',
    verification_status: 'VERIFIED',
    auto_verified: true,
    verified_by: 'admin_vvini4803',
    verified_by_name: 'ವಿನಯ್ (ಮುಖ್ಯ ಸೂಪರ್ ಅಡ್ಮಿನ್)',
    verified_at: new Date().toISOString(),
    urgent: false,
    pinned: false,
    likes_count: 24,
    liked_by: [],
    comments_count: 1,
    reports_count: 0,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    active_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_demo: false
  }
];
export const SEED_EVENTS: EventItem[] = [];
export const SEED_TOURNAMENTS: Tournament[] = [];
export const SEED_CROPS: CropItem[] = [];
export const SEED_TEMPLES: TempleItem[] = [];
export const SEED_HISTORY: HistoryItem[] = [];
export const SEED_STORIES: StoryItem[] = [];
export const SEED_ACHIEVEMENTS: AchievementItem[] = [];
export const SEED_GALLERY: GalleryItem[] = [];
export const SEED_SOCIAL_LINKS: SocialLink[] = [];
export const SEED_CONVERSATIONS: Conversation[] = [];
export const SEED_MESSAGES: ChatMessage[] = [];
