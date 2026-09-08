export type Language = 'en' | 'kn';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'EVENT_ORGANIZER'
  | 'SPORTS_ORGANIZER'
  | 'VERIFIED_CONTRIBUTOR'
  | 'USER';

export interface UserProfile {
  uid: string;
  name: string;
  name_kn?: string;
  phone?: string;
  email?: string;
  role: UserRole;
  language: Language;
  photoUrl?: string;
  bio?: string;
  bio_kn?: string;
  account_status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  created_at: string;
  last_login: string;
  is_phone_verified?: boolean;
  community_category?: 'FARMER' | 'SPORTS' | 'STUDENT' | 'TEACHER' | 'ARTIST' | 'ACHIEVER' | 'PROFESSIONAL' | 'RESIDENT';
  allow_find_me?: boolean;
  privacy_find?: 'EVERYONE' | 'VILLAGE_MEMBERS' | 'NOBODY';
  privacy_message?: 'EVERYONE' | 'VILLAGE_MEMBERS' | 'NOBODY';
}

export type VerificationStatus =
  | 'VERIFIED'
  | 'COMMUNITY_REPORT'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED';

export type NewsCategory =
  | 'ROAD'
  | 'WATER'
  | 'ELECTRICITY'
  | 'WEATHER'
  | 'AGRICULTURE'
  | 'SPORTS'
  | 'FESTIVAL'
  | 'TEMPLE'
  | 'COMMUNITY'
  | 'ACHIEVEMENT'
  | 'EMERGENCY'
  | 'GENERAL';

export interface NewsItem {
  id: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  author_role: UserRole;
  title_en: string;
  title_kn: string;
  content_en: string;
  content_kn: string;
  category: NewsCategory;
  media_url?: string;
  media_type?: 'IMAGE' | 'VIDEO';
  location?: string;
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_by_name?: string;
  verified_at?: string;
  urgent: boolean;
  pinned: boolean;
  official_correction?: string;
  official_correction_kn?: string;
  reports_count: number;
  likes_count: number;
  liked_by: string[];
  comments_count: number;
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
}

export interface CommentItem {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  author_role: UserRole;
  text: string;
  created_at: string;
  likes_count: number;
  liked_by: string[];
  reports_count: number;
}

export type EventStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface EventItem {
  id: string;
  title_en: string;
  title_kn: string;
  description_en: string;
  description_kn: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_en: string;
  venue_kn: string;
  organizer_en: string;
  organizer_kn: string;
  organizer_phone?: string;
  cover_image: string;
  status: EventStatus;
  participants_count: number;
  registered_uids: string[];
  is_demo?: boolean;
}

export type SportType = 'CRICKET' | 'KABADDI' | 'VOLLEYBALL' | 'FOOTBALL' | 'LOCAL';

export interface Team {
  id: string;
  name_en: string;
  name_kn: string;
  captain_en: string;
  color: string;
}

export interface PointsRow {
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: string;
}

export interface MatchItem {
  id: string;
  tournament_id: string;
  sport: SportType;
  team_a: string;
  team_b: string;
  team_a_score: string;
  team_b_score: string;
  team_a_overs?: string;
  team_b_overs?: string;
  current_status_en: string;
  current_status_kn: string;
  summary_en: string;
  summary_kn: string;
  date: string;
  time: string;
  venue: string;
  is_live: boolean;
  top_scorer?: string;
  top_bowler?: string;
  raider_points?: string;
  last_updated: string;
}

export interface Tournament {
  id: string;
  name_en: string;
  name_kn: string;
  sport: SportType;
  year: number;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  teams: Team[];
  points_table: PointsRow[];
  matches: MatchItem[];
  is_demo?: boolean;
}

export interface CropItem {
  id: string;
  name_en: string;
  name_kn: string;
  category: 'MAIN' | 'SEASONAL';
  season_en: string;
  season_kn: string;
  soil_type_en: string;
  soil_type_kn: string;
  water_req_en: string;
  water_req_kn: string;
  cultivation_en: string;
  cultivation_kn: string;
  uses_en: string;
  uses_kn: string;
  advantages_en: string;
  advantages_kn: string;
  risks_en: string;
  risks_kn: string;
  verified: boolean;
  source: string;
  verified_date: string;
  image_url: string;
  is_demo?: boolean;
}

export interface TempleItem {
  id: string;
  name_en: string;
  name_kn: string;
  deity_en: string;
  deity_kn: string;
  history_en: string;
  history_kn: string;
  location_en: string;
  location_kn: string;
  timings_en: string;
  timings_kn: string;
  festivals_en: string;
  festivals_kn: string;
  special_pooja_en: string;
  special_pooja_kn: string;
  image_url: string;
  verified: boolean;
  source: string;
  is_demo?: boolean;
}

export type HistorySourceType =
  | 'HISTORICAL_FACT'
  | 'COMMUNITY_STORY'
  | 'LOCAL_TRADITION'
  | 'UNVERIFIED_STORY';

export interface HistoryItem {
  id: string;
  year: string;
  title_en: string;
  title_kn: string;
  content_en: string;
  content_kn: string;
  type: HistorySourceType;
  image_url?: string;
  verified: boolean;
  source: string;
  is_demo?: boolean;
}

export interface StoryItem {
  id: string;
  title_en: string;
  title_kn: string;
  storyteller_en: string;
  storyteller_kn: string;
  content_en: string;
  content_kn: string;
  category: 'FOLKLORE' | 'HERO' | 'FARMING' | 'CULTURE';
  type: HistorySourceType;
  author_id: string;
  verified: boolean;
  created_at: string;
  is_demo?: boolean;
}

export interface VillageStats {
  id: string;
  population: number;
  households: number;
  area_sqkm: number;
  literacy_rate: number;
  schools: number;
  temples: number;
  hospitals: number;
  agricultural_land_acres: number;
  main_crops_en: string;
  main_crops_kn: string;
  active_members: number;
  source: string;
  source_url?: string;
  last_verified: string;
  verified_by: string;
  is_demo?: boolean;
}

export interface AchievementItem {
  id: string;
  person_name_en: string;
  person_name_kn: string;
  category:
    | 'STUDENT'
    | 'FARMER'
    | 'ATHLETE'
    | 'ENTREPRENEUR'
    | 'ARTIST'
    | 'TEACHER'
    | 'COMMUNITY';
  title_en: string;
  title_kn: string;
  description_en: string;
  description_kn: string;
  year: number;
  photo_url: string;
  verified: boolean;
  consent_verified: boolean;
  is_demo?: boolean;
}

export interface GalleryItem {
  id: string;
  title_en: string;
  title_kn: string;
  category:
    | 'FESTIVAL'
    | 'NATURE'
    | 'AGRICULTURE'
    | 'SPORTS'
    | 'TEMPLE'
    | 'HERITAGE'
    | 'COMMUNITY';
  url: string;
  thumbnail_url?: string;
  media_type: 'IMAGE' | 'VIDEO';
  author_id: string;
  author_name: string;
  approved: boolean;
  likes_count: number;
  liked_by: string[];
  created_at: string;
  is_demo?: boolean;
}

export interface SocialLink {
  id: string;
  platform: 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'WEBSITE';
  url: string;
  label_en: string;
  label_kn: string;
  verified_official: boolean;
  handle_or_group: string;
  is_demo?: boolean;
}

export interface EmergencyAlert {
  id: string;
  title_en: string;
  title_kn: string;
  message_en: string;
  message_kn: string;
  issued_by_en: string;
  issued_by_kn: string;
  issued_at: string;
  active: boolean;
  contact_info: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  is_demo?: boolean;
}

export interface ReportItem {
  id: string;
  item_type: 'POST' | 'COMMENT' | 'USER' | 'MEDIA' | 'MESSAGE';
  item_id: string;
  item_title?: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  evidence?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string; // or 'ALL' for broadcasts
  title_en: string;
  title_kn: string;
  message_en: string;
  message_kn: string;
  type: 'EMERGENCY' | 'NEWS_VERIFIED' | 'EVENT' | 'SPORTS' | 'ADMIN' | 'SOCIAL';
  link_tab?: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  actor_name: string;
  target_id: string;
  target_type: string;
  details: string;
  timestamp: string;
}

export type ViewTab =
  | 'home'
  | 'news'
  | 'events'
  | 'sports'
  | 'profile'
  | 'people'
  | 'messages'
  | 'agriculture'
  | 'temples'
  | 'history'
  | 'stories'
  | 'stats'
  | 'achievements'
  | 'gallery'
  | 'social'
  | 'voice'
  | 'search'
  | 'notifications'
  | 'settings'
  | 'privacy'
  | 'reports'
  | 'admin'
  | 'analytics';

export interface Conversation {
  id: string;
  participants: string[];
  participant_names: Record<string, string>;
  participant_photos?: Record<string, string>;
  participant_roles?: Record<string, string>;
  last_message_text: string;
  last_message_at: string;
  last_sender_id: string;
  unread_counts: Record<string, number>;
  updated_at: string;
  is_demo?: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_photo?: string;
  text: string;
  media_url?: string;
  created_at: string;
  read_by: string[];
  status?: 'SENT' | 'DELIVERED' | 'READ';
  deleted?: boolean;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface UserPrivacySettings {
  allow_find_me: 'EVERYONE' | 'VILLAGE_MEMBERS' | 'NOBODY';
  allow_message_me: 'EVERYONE' | 'VILLAGE_MEMBERS' | 'NOBODY';
  profile_visibility: 'PUBLIC' | 'VILLAGE_MEMBERS';
  online_status_visible: boolean;
}
