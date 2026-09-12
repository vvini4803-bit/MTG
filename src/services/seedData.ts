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

// Clean Default Users (Village Admin & Moderator for initial login)
export const SEED_USERS: UserProfile[] = [
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
export const SEED_NEWS: NewsItem[] = [];
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
