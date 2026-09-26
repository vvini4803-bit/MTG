import {
  NewsItem,
  EventItem,
  Tournament,
  MatchItem,
  CropItem,
  TempleItem,
  HistoryItem,
  StoryItem,
  VillageStats,
  AchievementItem,
  GalleryItem,
  SocialLink,
  EmergencyAlert,
  ReportItem,
  NotificationItem,
  AuditLog,
  UserProfile,
  CommentItem,
  VerificationStatus,
  Conversation,
  ChatMessage,
  UserBlock
} from '../types';
import {
  SEED_NEWS,
  SEED_EVENTS,
  SEED_TOURNAMENTS,
  SEED_CROPS,
  SEED_TEMPLES,
  SEED_HISTORY,
  SEED_STORIES,
  SEED_VILLAGE_STATS,
  SEED_ACHIEVEMENTS,
  SEED_GALLERY,
  SEED_SOCIAL_LINKS,
  SEED_EMERGENCY_ALERT,
  SEED_USERS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  isSuperAdminEmail
} from './seedData';
import { isFirebaseConfigured, db } from './firebaseConfig';
import { realtimeSync } from './realtimeSync';
import { notificationService } from './notificationService';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  limitToLast
} from 'firebase/firestore';
import {
  savePhotoPermanently,
  saveMultiplePhotosPermanently,
  getAllPermanentPhotos,
  deletePermanentPhoto
} from './persistentPhotoStorage';

export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Recursively removes undefined fields from an object so that Firestore setDoc/updateDoc
 * never throws "Unsupported field value: undefined".
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export function isWithinOneWeek(dateStr?: string): boolean {
  if (!dateStr) return true;
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return true;
  const now = Date.now();
  // Within past 7 days (or in future)
  return (now - timestamp) <= ONE_WEEK_MS;
}

export function getOneWeekStatus(dateStr?: string): {
  isWithinWeek: boolean;
  daysRemaining: number;
  expiryDateStr: string;
  labelEn: string;
  labelKn: string;
} {
  if (!dateStr) {
    return {
      isWithinWeek: true,
      daysRemaining: 7,
      expiryDateStr: '',
      labelEn: 'Active (This Week)',
      labelKn: 'ಈ ವಾರ ಸಕ್ರಿಯ'
    };
  }
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) {
    return {
      isWithinWeek: true,
      daysRemaining: 7,
      expiryDateStr: '',
      labelEn: 'Active (This Week)',
      labelKn: 'ಈ ವಾರ ಸಕ್ರಿಯ'
    };
  }
  const expiryTime = timestamp + ONE_WEEK_MS;
  const now = Date.now();
  const diffMs = expiryTime - now;
  const isWithinWeek = diffMs > 0;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const expiryDate = new Date(expiryTime);
  const expiryDateStr = expiryDate.toISOString().split('T')[0];

  return {
    isWithinWeek,
    daysRemaining,
    expiryDateStr,
    labelEn: isWithinWeek ? `Active (${daysRemaining}d left in week)` : 'Archived (Older than 1 week)',
    labelKn: isWithinWeek ? `ಈ ವಾರ ಸಕ್ರಿಯ (${daysRemaining} ದಿನ ಬಾಕಿ)` : 'ಹಿಂದಿನ ದಾಖಲೆ (1 ವಾರ ಮೀರಿದೆ)'
  };
}

class DatabaseService {
  private news: NewsItem[] = [];
  private events: EventItem[] = [];
  private tournaments: Tournament[] = [];
  private crops: CropItem[] = [];
  private temples: TempleItem[] = [];
  private history: HistoryItem[] = [];
  private stories: StoryItem[] = [];
  private villageStats: VillageStats = SEED_VILLAGE_STATS;
  private achievements: AchievementItem[] = [];
  private gallery: GalleryItem[] = [];
  private socialLinks: SocialLink[] = [];
  private emergencyAlert: EmergencyAlert | null = SEED_EMERGENCY_ALERT;
  private comments: CommentItem[] = [];
  private reports: ReportItem[] = [];
  private notifications: NotificationItem[] = [];
  private users: UserProfile[] = [];
  private conversations: Conversation[] = [];
  private messages: ChatMessage[] = [];
  private userBlocks: UserBlock[] = [];
  private auditLogs: AuditLog[] = [];
  private isDemoMode: boolean = true;

  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initLocalData();
    this.initRealtimeSync();
    this.initFirestoreSync();
  }

  private initLocalData() {
    const savedDemoMode = localStorage.getItem('gramasiri_demo_mode');
    this.isDemoMode = savedDemoMode !== null ? savedDemoMode === 'true' : false;

    // Load local collections (defaults to verified seed data)
    this.news = this.loadCollection('news', SEED_NEWS);
    if (this.news.length === 0 && SEED_NEWS.length > 0) {
      this.news = [...SEED_NEWS];
      this.saveCollection('news', this.news);
    }
    this.events = this.loadCollection('events', this.isDemoMode ? SEED_EVENTS : []);
    this.tournaments = this.loadCollection('tournaments', this.isDemoMode ? SEED_TOURNAMENTS : []);
    this.crops = this.loadCollection('crops', this.isDemoMode ? SEED_CROPS : []);
    const defaultTemples: TempleItem[] = [
      {
        id: 'temple_anjaneya_default',
        name_en: 'Sri Anjaneya Swamy Temple',
        name_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ',
        deity_en: 'Sri Rama Devru & Anjaneya Swamy',
        deity_kn: 'ಶ್ರೀ ರಾಮ ದೇವರು & ಆಂಜನೇಯ ಸ್ವಾಮಿ',
        timings_en: '6:30 AM - 1:00 PM and 5:00 PM - 8:30 PM',
        timings_kn: 'ಬೆಳಗ್ಗೆ ೬:೩೦ - ಮಧ್ಯಾಹ್ನ ೧:೦೦ ಮತ್ತು ಸಂಜೆ ೫:೦೦ - ೮:೩೦',
        location_en: 'Car Street, Central Muttagundi',
        location_kn: 'ತೇರು ಬೀದಿ, ಮಧ್ಯ ಮುಟ್ಟಗುಂಡಿ',
        history_en: 'Sri Anjaneya Swamy Temple – Muttagundi Sri Anjaneya Swamy Temple is a sacred center of devotion for the people of Muttagundi and neighboring taluks. Blessed with centuries of devotion, annual Hanuma Jayanthi, and grand Rathotsava.',
        history_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ – ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಭಕ್ತರ ಪವಿತ್ರ ಆರಾಧನಾ ಕೇಂದ್ರ. ಶತಮಾನಗಳ ಭಕ್ತಿ, ವಾರ್ಷಿಕ ಹನುಮ ಜಯಂತಿ ಮತ್ತು ಭವ್ಯ ರಥೋತ್ಸವದ ಇತಿಹಾಸವನ್ನು ಹೊಂದಿದೆ.',
        festivals_en: 'Annual Hanuma Jayanthi, Ramanavami & Rathotsava',
        festivals_kn: 'ವಾರ್ಷಿಕ ಹನುಮ ಜಯಂತಿ, ಶ್ರೀರಾಮನವಮಿ ಮತ್ತು ರಥೋತ್ಸವ',
        special_pooja_en: 'Saturday Special Abhisheka & Vada Male Seva',
        special_pooja_kn: 'ಶನಿವಾರ ವಿಶೇಷ ಅಭಿಷೇಕ ಮತ್ತು ವಡೆ ಮಾಲೆ ಸೇವೆ',
        image_url: '/anime/temple_gopuram.jpg',
        source: 'Muttagundi Grama Panchayat Heritage Register',
        verified: true,
        is_demo: false
      },
      {
        id: 'temple_kalleshwara_default',
        name_en: 'Sri Kalleshwara Swamy Temple',
        name_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಾಲಯ',
        deity_en: 'Lord Shiva (Kalleshwara)',
        deity_kn: 'ಶ್ರೀ ಈಶ್ವರ (ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ)',
        timings_en: '6:00 AM - 12:30 PM and 5:30 PM - 8:30 PM',
        timings_kn: 'ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦ ಮತ್ತು ಸಂಜೆ ೫:೩೦ - ೮:೩೦',
        location_en: 'Muttagundi Heritage Complex',
        location_kn: 'ಮುತ್ತಾಗೊಂದಿ ಪುರಾತನ ಬಡಾವಣೆ',
        history_en: 'Ancient stone temple dedicated to Lord Shiva with sacred Nandi pavilion and intricate Hoysala period stone pillars. Famed for peaceful spiritual vibrations.',
        history_kn: 'ಹೊಯ್ಸಳ ಕಾಲದ ಶಿಲ್ಪಕಲೆ, ನಂದಿ ಮಂಟಪ ಹಾಗೂ ಕೆತ್ತನೆಯ ಕಂಬಗಳನ್ನು ಹೊಂದಿರುವ ಪುರಾತನ ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಾಲಯ.',
        festivals_en: 'Maha Shivaratri & Karthika Somavara Deepotsava',
        festivals_kn: 'ಮಹಾ ಶಿವರಾತ್ರಿ ಮತ್ತು ಕಾರ್ತಿಕ ಸೋಮವಾರ ದೀಪೋತ್ಸವ',
        special_pooja_en: 'Pradosha Pooja & Rudrabhisheka',
        special_pooja_kn: 'ಪ್ರದೋಷ ಪೂಜೆ ಮತ್ತು ರುದ್ರಾಭಿಷೇಕ',
        image_url: '/anime/kalleshwara.jpg',
        source: 'Archaeological & Village Heritage Survey',
        verified: true,
        is_demo: false
      },
      {
        id: 'temple_thimmappa_default',
        name_en: 'Sri Lakshmi Thimmappa Swamy Temple',
        name_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
        deity_en: 'Sri Lakshmi Venkateshwara / Thimmappa',
        deity_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ವೆಂಕಟೇಶ್ವರ / ತಿಮ್ಮಪ್ಪ',
        timings_en: '6:00 AM - 12:00 PM and 5:00 PM - 8:00 PM',
        timings_kn: 'ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೦೦ ಮತ್ತು ಸಂಜೆ ೫:೦೦ - ೮:೦೦',
        location_en: 'Muttagundi Hillock Sanctuary',
        location_kn: 'ಮುತ್ತಾಗೊಂದಿ ಬೆಟ್ಟದ ಸನ್ನಿಧಿ',
        history_en: 'Venerated hillock temple blessing devotees across generations with peace, health, and prosperity.',
        history_kn: 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಭಕ್ತರ ಆರಾಧ್ಯ ದೈವ ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಾಲಯ. ಸಮೃದ್ಧಿ ಮತ್ತು ಕೃಪೆಗೆ ಪ್ರಸಿದ್ಧ.',
        festivals_en: 'Shravana Shanivara & Vaikunta Ekadashi',
        festivals_kn: 'ಶ್ರಾವಣ ಶನಿವಾರ ಮತ್ತು ವೈಕುಂಠ ಏಕಾದಶಿ ಮಹೋತ್ಸವ',
        special_pooja_en: 'Kalyanotsava & Maha Mangalarathi',
        special_pooja_kn: 'ಕಲ್ಯಾಣೋತ್ಸವ ಮತ್ತು ಮಹಾ ಮಂಗಳಾರತಿ',
        image_url: '/anime/stone_shrine.jpg',
        source: 'Muttagundi Grama Panchayat Heritage Register',
        verified: true,
        is_demo: false
      }
    ];

    this.temples = this.loadCollection('temples', defaultTemples);

    // Auto-migrate any legacy bedroom images to authentic temple imagery
    let templesModified = false;
    if (this.temples.length === 0) {
      this.temples = defaultTemples;
      templesModified = true;
    } else {
      this.temples = this.temples.map((t) => {
        if (
          !t.image_url ||
          t.image_url.includes('photo-1609766857041-ed402ea8069a') ||
          t.image_url.toLowerCase().includes('bedroom')
        ) {
          templesModified = true;
          return {
            ...t,
            image_url: '/anime/temple_gopuram.jpg'
          };
        }
        return t;
      });
    }
    if (templesModified) {
      this.saveCollection('temples', this.temples);
    }
    this.history = this.loadCollection('history', this.isDemoMode ? SEED_HISTORY : []);
    this.stories = this.loadCollection('stories', this.isDemoMode ? SEED_STORIES : []);
    this.villageStats = this.loadCollection('village_stats', this.isDemoMode ? SEED_VILLAGE_STATS : {
      ...SEED_VILLAGE_STATS,
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
      source: 'Muttagundi Grama Panchayat Official Records',
      last_verified: new Date().toISOString().split('T')[0],
      verified_by: 'Muttagundi Administration'
    });
    this.achievements = this.loadCollection('achievements', this.isDemoMode ? SEED_ACHIEVEMENTS : []);
    this.gallery = this.loadCollection('gallery', this.isDemoMode ? SEED_GALLERY : []);
    this.socialLinks = this.loadCollection('social_links', this.isDemoMode ? SEED_SOCIAL_LINKS : []);
    this.emergencyAlert = this.loadCollection('emergency_alert', this.isDemoMode ? SEED_EMERGENCY_ALERT : null);

    this.users = this.loadCollection('users', SEED_USERS);

    // Guarantee vvini4803@gmail.com is unconditionally Super Admin in users collection
    let hasVvini = false;
    this.users = this.users.map((u) => {
      if (isSuperAdminEmail(u.email, u.name) || u.uid === 'admin_vvini4803') {
        hasVvini = true;
        return {
          ...u,
          role: 'SUPER_ADMIN',
          account_status: 'ACTIVE',
          email: u.email || 'vvini4803@gmail.com'
        };
      }
      return u;
    });
    if (!hasVvini) {
      const defaultAdmin = SEED_USERS.find((u) => isSuperAdminEmail(u.email, u.name));
      if (defaultAdmin) {
        this.users.unshift(defaultAdmin);
      }
    }

    // Ensure all verified village residents from seed data exist in directory
    SEED_USERS.forEach((su) => {
      if (!this.users.some((u) => u.uid === su.uid)) {
        this.users.push(su);
      }
    });

    this.saveCollection('users', this.users);

    this.conversations = this.loadCollection('conversations', SEED_CONVERSATIONS);
    this.messages = this.loadCollection('messages', SEED_MESSAGES);
    this.userBlocks = this.loadCollection('user_blocks', []);
    this.notifications = this.loadCollection('notifications', []);

    // Ensure all stored user updates are auto-verified and have 1-week active status
    this.ensureAutoVerificationAndRetention();

    // Purge any explicit demo entries from previous sessions (never delete real user uploads)
    this.purgeStaleDemoData();

    // Hydrate permanent photos from IndexedDB (preserves all village photos without quota loss)
    this.initPersistentPhotos();

    // Migrate any legacy dummy contact numbers to +91 7483254968
    this.migrateContactPhoneNumbers();
  }

  private migrateContactPhoneNumbers() {
    try {
      let eventsModified = false;
      this.events = this.events.map((evt) => {
        if (!evt.organizer_phone || evt.organizer_phone.includes('98450') || evt.organizer_phone.includes('99000')) {
          eventsModified = true;
          return { ...evt, organizer_phone: '+91 7483254968' };
        }
        return evt;
      });
      if (eventsModified) {
        this.saveCollection('events', this.events);
      }

      let usersModified = false;
      this.users = this.users.map((u) => {
        if (u.phone && (u.phone.includes('98450') || u.phone.includes('99000'))) {
          usersModified = true;
          return { ...u, phone: '+91 7483254968' };
        }
        return u;
      });
      if (usersModified) {
        this.saveCollection('users', this.users);
      }
    } catch (e) {
      console.warn('Contact phone migration error:', e);
    }
  }

  private async initPersistentPhotos() {
    try {
      const permanentPhotos = await getAllPermanentPhotos();
      if (permanentPhotos && permanentPhotos.length > 0) {
        let merged = false;
        permanentPhotos.forEach((p) => {
          if (!this.gallery.some((g) => g.id === p.id)) {
            this.gallery.push(p);
            merged = true;
          }
        });
        if (merged) {
          this.gallery.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          this.saveCollection('gallery', this.gallery);
          this.emit('gallery', this.gallery);
        }
      }
      // Backup current gallery into IndexedDB permanently as well
      if (this.gallery.length > 0) {
        await saveMultiplePhotosPermanently(this.gallery);
      }
    } catch (err) {
      console.warn('Persistent photo storage hydration fallback:', err);
    }
  }

  private ensureAutoVerificationAndRetention() {
    try {
      let changed = false;
      this.news = this.news.map((item) => {
        const needsVerification = item.verification_status !== 'VERIFIED';
        const needsActiveUntil = !item.active_until;
        if (needsVerification || needsActiveUntil) {
          changed = true;
          return {
            ...item,
            verification_status: 'VERIFIED',
            auto_verified: true,
            active_until: item.active_until || new Date(new Date(item.created_at || Date.now()).getTime() + ONE_WEEK_MS).toISOString()
          };
        }
        return item;
      });
      if (changed) {
        this.saveCollection('news', this.news);
      }
    } catch (e) {
      console.warn('Could not auto-verify existing news:', e);
    }
  }

  private purgeStaleDemoData() {
    try {
      const keysToClean = ['news', 'events', 'tournaments', 'crops', 'temples', 'gallery', 'achievements', 'history', 'stories', 'notifications'];
      for (const k of keysToClean) {
        const itemStr = localStorage.getItem(`gramasiri_${k}`);
        if (itemStr) {
          const parsed = JSON.parse(itemStr);
          if (Array.isArray(parsed)) {
            // ONLY remove explicit demo items if demo mode is disabled; NEVER remove real user uploads!
            if (!this.isDemoMode) {
              const cleaned = parsed.filter((item: any) => !item.is_demo);
              if (cleaned.length !== parsed.length) {
                localStorage.setItem(`gramasiri_${k}`, JSON.stringify(cleaned));
                (this as any)[k] = cleaned;
                this.emit(k, cleaned);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not purge stale demo data', e);
    }
  }

  private initRealtimeSync() {
    realtimeSync.subscribe((envelope) => {
      switch (envelope.type) {
        case 'USER_REGISTERED':
        case 'USER_UPDATED': {
          const remoteUser: UserProfile = envelope.payload;
          if (!remoteUser || !remoteUser.uid) return;
          const idx = this.users.findIndex((u) => u.uid === remoteUser.uid);
          if (idx >= 0) {
            this.users[idx] = { ...this.users[idx], ...remoteUser };
          } else {
            this.users.push(remoteUser);
          }
          this.saveCollection('users', [...this.users]);
          break;
        }

        case 'NEWS_CREATED': {
          const item: NewsItem = envelope.payload;
          if (!item || !item.id) return;
          if (!this.news.some((n) => n.id === item.id)) {
            this.news = [item, ...this.news];
            this.saveCollection('news', this.news);
            this.emit('news', this.news);

            // Add notification record & trigger mobile push notification
            const notifItem: NotificationItem = {
              id: 'notif_' + Date.now(),
              user_id: 'ALL',
              title_en: (item.urgent ? '🚨 URGENT: ' : '📰 NEW: ') + item.title_en,
              title_kn: (item.urgent ? '🚨 ತುರ್ತು: ' : '📰 ಹೊಸ ಸುದ್ದಿ: ') + item.title_kn,
              message_en: (item.content_en || item.title_en).substring(0, 120),
              message_kn: (item.content_kn || item.title_kn).substring(0, 120),
              type: item.urgent ? 'EMERGENCY' : 'NEWS_VERIFIED',
              link_tab: 'news',
              read: false,
              created_at: new Date().toISOString()
            };
            this.notifications = [notifItem, ...this.notifications];
            this.saveCollection('notifications', this.notifications);
            this.emit('notifications', this.notifications);

            notificationService.sendNotification({
              title_kn: (item.urgent ? '🚨 ತುರ್ತು ಗ್ರಾಮ ಸುದ್ದಿ: ' : '📰 ಹೊಸ ಗ್ರಾಮ ಸುದ್ದಿ: ') + item.title_kn,
              title_en: (item.urgent ? '🚨 Urgent Village News: ' : '📰 Village News: ') + item.title_en,
              body_kn: (item.content_kn || item.title_kn).substring(0, 120),
              body_en: (item.content_en || item.title_en).substring(0, 120),
              section: 'news',
              itemId: item.id,
              urgent: item.urgent
            });
          }
          break;
        }

        case 'NEWS_VERIFIED': {
          const { newsId, status, verifiedByUid, verifiedByName, correction, correctionKn, urgent } = envelope.payload;
          const target = this.news.find((n) => n.id === newsId);
          if (target) {
            target.verification_status = status;
            target.verified_by = verifiedByUid;
            target.verified_by_name = verifiedByName;
            if (correction !== undefined) target.official_correction = correction;
            if (correctionKn !== undefined) target.official_correction_kn = correctionKn;
            if (urgent !== undefined) target.urgent = urgent;
            this.saveCollection('news', [...this.news]);
            this.emit('news', this.news);
          }
          break;
        }

        case 'NEWS_LIKED': {
          const { newsId, uid, isLiked } = envelope.payload;
          const target = this.news.find((n) => n.id === newsId);
          if (target) {
            if (isLiked && !target.liked_by.includes(uid)) {
              target.liked_by.push(uid);
              target.likes_count += 1;
            } else if (!isLiked && target.liked_by.includes(uid)) {
              target.liked_by = target.liked_by.filter((id) => id !== uid);
              target.likes_count = Math.max(0, target.likes_count - 1);
            }
            this.saveCollection('news', [...this.news]);
            this.emit('news', this.news);
          }
          break;
        }

        case 'EVENT_CREATED': {
          const evt: EventItem = envelope.payload;
          if (!evt || !evt.id) return;
          if (!this.events.some((e) => e.id === evt.id)) {
            this.events = [evt, ...this.events];
            this.saveCollection('events', this.events);
            this.emit('events', this.events);

            const notifItem: NotificationItem = {
              id: 'notif_' + Date.now(),
              user_id: 'ALL',
              title_en: '📅 NEW EVENT: ' + evt.title_en,
              title_kn: '📅 ಹೊಸ ಕಾರ್ಯಕ್ರಮ: ' + evt.title_kn,
              message_en: (evt.description_en || evt.title_en).substring(0, 120),
              message_kn: (evt.description_kn || evt.title_kn).substring(0, 120),
              type: 'EVENT',
              link_tab: 'events',
              read: false,
              created_at: new Date().toISOString()
            };
            this.notifications = [notifItem, ...this.notifications];
            this.saveCollection('notifications', this.notifications);
            this.emit('notifications', this.notifications);

            notificationService.sendNotification({
              title_kn: '📅 ಹೊಸ ಗ್ರಾಮ ಕಾರ್ಯಕ್ರಮ: ' + evt.title_kn,
              title_en: '📅 New Village Event: ' + evt.title_en,
              body_kn: (evt.description_kn || evt.title_kn).substring(0, 120),
              body_en: (evt.description_en || evt.title_en).substring(0, 120),
              section: 'events',
              itemId: evt.id
            });
          }
          break;
        }

        case 'PHOTO_ADDED': {
          const gal: GalleryItem = envelope.payload;
          if (!gal || !gal.id) return;
          if (!this.gallery.some((g) => g.id === gal.id)) {
            this.gallery = [gal, ...this.gallery];
            this.saveCollection('gallery', this.gallery);
            savePhotoPermanently(gal).catch(() => {});
          }
          break;
        }

        case 'PHOTO_LIKED': {
          const { photoId, uid, isLiked } = envelope.payload || {};
          const photo = this.gallery.find((g) => g.id === photoId);
          if (photo) {
            if (!Array.isArray(photo.liked_by)) photo.liked_by = [];
            if (isLiked && !photo.liked_by.includes(uid)) {
              photo.liked_by.push(uid);
              photo.likes_count = Math.max((photo.likes_count || 0) + 1, photo.liked_by.length);
            } else if (!isLiked && photo.liked_by.includes(uid)) {
              photo.liked_by = photo.liked_by.filter((id) => id !== uid);
              photo.likes_count = Math.max(0, (photo.likes_count || 1) - 1);
            }
            this.saveCollection('gallery', [...this.gallery]);
            this.emit('gallery', this.gallery);
            savePhotoPermanently(photo).catch(() => {});
          }
          break;
        }

        case 'COMMENT_ADDED': {
          const comment: CommentItem = envelope.payload;
          if (!comment || !comment.id) return;
          if (!this.comments.some((c) => c.id === comment.id)) {
            this.comments = [comment, ...this.comments];
            this.saveCollection('comments', this.comments);
            const post = this.news.find((n) => n.id === comment.post_id);
            if (post) {
              post.comments_count = Math.max(post.comments_count + 1, this.comments.filter((c) => c.post_id === post.id).length);
              this.saveCollection('news', [...this.news]);
              this.emit('news', this.news);
            }
            this.emit(`comments_${comment.post_id}`, this.comments.filter((c) => c.post_id === comment.post_id));
          }
          break;
        }

        case 'COMMENT_LIKED': {
          const { commentId, postId, uid, isLiked } = envelope.payload || {};
          const comment = this.comments.find((c) => c.id === commentId);
          if (comment) {
            if (!Array.isArray(comment.liked_by)) comment.liked_by = [];
            if (isLiked && !comment.liked_by.includes(uid)) {
              comment.liked_by.push(uid);
              comment.likes_count = Math.max((comment.likes_count || 0) + 1, comment.liked_by.length);
            } else if (!isLiked && comment.liked_by.includes(uid)) {
              comment.liked_by = comment.liked_by.filter((id) => id !== uid);
              comment.likes_count = Math.max(0, (comment.likes_count || 1) - 1);
            }
            this.saveCollection('comments', [...this.comments]);
            this.emit(`comments_${postId || comment.post_id}`, this.comments.filter((c) => c.post_id === (postId || comment.post_id)));
          }
          break;
        }

        case 'CROP_ADDED': {
          const crop: CropItem = envelope.payload;
          if (!crop || !crop.id) return;
          if (!this.crops.some((c) => c.id === crop.id)) {
            this.crops = [crop, ...this.crops];
            this.saveCollection('crops', this.crops);
            this.emit('crops', this.crops);

            const notifItem: NotificationItem = {
              id: 'notif_' + Date.now(),
              user_id: 'ALL',
              title_en: `🌾 Crop Guide: ${crop.name_en}`,
              title_kn: `🌾 ಕೃಷಿ ಮಾಹಿತಿ: ${crop.name_kn}`,
              message_en: crop.cultivation_en ? crop.cultivation_en.substring(0, 120) : 'Agricultural crop information updated.',
              message_kn: crop.cultivation_kn ? crop.cultivation_kn.substring(0, 120) : 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಕೃಷಿ ಬೆಳೆ ಮಾಹಿತಿ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.',
              type: 'SOCIAL',
              link_tab: 'agriculture',
              read: false,
              created_at: new Date().toISOString()
            };
            this.notifications = [notifItem, ...this.notifications];
            this.saveCollection('notifications', this.notifications);
            this.emit('notifications', this.notifications);

            notificationService.sendNotification({
              title_kn: `🌾 ಕೃಷಿ ಮಾಹಿತಿ: ${crop.name_kn}`,
              title_en: `🌾 Crop Guide: ${crop.name_en}`,
              body_kn: crop.cultivation_kn ? crop.cultivation_kn.substring(0, 120) : 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಕೃಷಿ ಬೆಳೆ ಮಾಹಿತಿ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.',
              body_en: crop.cultivation_en ? crop.cultivation_en.substring(0, 120) : 'Agricultural crop guide updated.',
              section: 'agriculture',
              itemId: crop.id
            });
          }
          break;
        }

        case 'TEMPLE_ADDED': {
          const t: TempleItem = envelope.payload;
          if (!t || !t.id) return;
          if (!this.temples.some((item) => item.id === t.id)) {
            this.temples = [t, ...this.temples];
            this.saveCollection('temples', this.temples);
            this.emit('temples', this.temples);
          }
          break;
        }

        case 'TOURNAMENT_CREATED': {
          const tourn: Tournament = envelope.payload;
          if (!tourn || !tourn.id) return;
          if (!this.tournaments.some((item) => item.id === tourn.id)) {
            this.tournaments = [tourn, ...this.tournaments];
            this.saveCollection('tournaments', this.tournaments);
            this.emit('tournaments', this.tournaments);
          }
          break;
        }

        case 'MATCH_SCORE_UPDATED': {
          const { tournamentId, matchId, updates } = envelope.payload;
          const tourn = this.tournaments.find((t) => t.id === tournamentId);
          if (tourn) {
            const match = tourn.matches.find((m) => m.id === matchId);
            if (match) {
              Object.assign(match, updates);
              this.saveCollection('tournaments', [...this.tournaments]);
              this.emit('tournaments', this.tournaments);

              notificationService.sendNotification({
                title_kn: `🏏 ಕ್ರೀಡಾ ಅಪ್‌ಡೇಟ್: ${match.team_a} vs ${match.team_b}`,
                title_en: `🏏 Match Score: ${match.team_a} vs ${match.team_b}`,
                body_kn: `ಸ್ಥಿತಿ: ${match.current_status_kn || 'ಲೈವ್'} | ${match.team_a_score || ''} - ${match.team_b_score || ''}`,
                body_en: `Status: ${match.current_status_en || 'Live'} | ${match.team_a_score || ''} - ${match.team_b_score || ''}`,
                section: 'sports',
                itemId: tournamentId
              });
            }
          }
          break;
        }

        case 'EMERGENCY_ALERT_UPDATED': {
          const alert: EmergencyAlert | null = envelope.payload;
          this.emergencyAlert = alert;
          this.saveCollection('emergency_alert', this.emergencyAlert);
          this.emit('emergency_alert', this.emergencyAlert);

          if (alert && alert.active) {
            const notifItem: NotificationItem = {
              id: 'notif_' + Date.now(),
              user_id: 'ALL',
              title_en: '🚨 EMERGENCY: ' + alert.title_en,
              title_kn: '🚨 ತುರ್ತು ಪ್ರಕಟಣೆ: ' + alert.title_kn,
              message_en: alert.message_en,
              message_kn: alert.message_kn,
              type: 'EMERGENCY',
              link_tab: 'home',
              read: false,
              created_at: new Date().toISOString()
            };
            this.notifications = [notifItem, ...this.notifications];
            this.saveCollection('notifications', this.notifications);
            this.emit('notifications', this.notifications);

            notificationService.sendNotification({
              title_kn: '🚨 ತುರ್ತು ಗ್ರಾಮ ಎಚ್ಚರಿಕೆ: ' + alert.title_kn,
              title_en: '🚨 Emergency Alert: ' + alert.title_en,
              body_kn: alert.message_kn,
              body_en: alert.message_en,
              section: 'home',
              urgent: true
            });
          }
          break;
        }

        case 'NOTIFICATION_CREATED': {
          const notif: NotificationItem = envelope.payload;
          if (!notif || !notif.id) return;
          if (!this.notifications.some((n) => n.id === notif.id)) {
            this.notifications = [notif, ...this.notifications];
            this.saveCollection('notifications', this.notifications);
            this.emit('notifications', this.notifications);

            notificationService.sendNotification({
              title_kn: notif.title_kn,
              title_en: notif.title_en,
              body_kn: notif.message_kn,
              body_en: notif.message_en,
              section: notif.link_tab || 'notifications',
              urgent: notif.type === 'EMERGENCY'
            });
          }
          break;
        }

        case 'CHAT_MESSAGE': {
          const payload = envelope.payload;
          const msg: ChatMessage = payload?.message || payload;
          if (!msg || !msg.id) return;
          if (!this.messages.some((m) => m.id === msg.id)) {
            this.messages = [...this.messages, msg];
            this.saveCollection('messages', this.messages);

            let conv = this.conversations.find((c) => c.id === msg.conversation_id);
            if (!conv && payload?.conversation) {
              const newConv = payload.conversation as Conversation;
              conv = newConv;
              this.conversations = [newConv, ...this.conversations];
            }
            if (conv) {
              conv.last_message_text = msg.media_url && !msg.text ? '📷 Photo' : (msg.text || '');
              conv.last_message_at = msg.created_at;
              conv.last_sender_id = msg.sender_id;
              conv.updated_at = msg.created_at;
              const recipientId = conv.participants.find((p) => p !== msg.sender_id);
              if (recipientId) {
                if (!conv.unread_counts) conv.unread_counts = {};
                conv.unread_counts[recipientId] = (conv.unread_counts[recipientId] || 0) + 1;
              }
              this.saveCollection('conversations', [...this.conversations]);
              this.emit('conversations', this.conversations);
            }

            this.emit('messages', this.messages);
            this.emit(`messages_${msg.conversation_id}`, this.messages.filter((m) => m.conversation_id === msg.conversation_id));
            this.emit('unread_messages', this.messages);

            // 🔔 Instant Notification Bell update at the exact time message/photo arrives!
            const recipientId = conv?.participants.find((p) => p !== msg.sender_id);
            const notifItem: NotificationItem = {
              id: 'notif_msg_' + msg.id,
              user_id: recipientId || 'ALL',
              title_kn: `💬 ${msg.sender_name} ಅವರಿಂದ ಹೊಸ ಸಂದೇಶ`,
              title_en: `💬 Message from ${msg.sender_name}`,
              message_kn: msg.media_url && !msg.text
                ? `📷 ${msg.sender_name} ನಿಮಗೆ ಒಂದು ಚಿತ್ರವನ್ನು ಕಳುಹಿಸಿದ್ದಾರೆ.`
                : `${msg.sender_name}: ${msg.text || 'ಹೊಸ ಸಂದೇಶ'}`,
              message_en: msg.media_url && !msg.text
                ? `📷 ${msg.sender_name} sent you a photo.`
                : `${msg.sender_name}: ${msg.text || 'New message'}`,
              type: 'MESSAGE',
              link_tab: 'messages',
              read: false,
              created_at: msg.created_at,
              sender_id: msg.sender_id,
              sender_name: msg.sender_name,
              conversation_id: msg.conversation_id
            };

            if (!this.notifications.some((n) => n.id === notifItem.id)) {
              this.notifications = [notifItem, ...this.notifications];
              this.saveCollection('notifications', this.notifications);
              this.emit('notifications', this.notifications);
            }

            // Immediately trigger sound chime, vibration, push notification, and in-app toast for recipient!
            const savedActive = typeof window !== 'undefined' ? localStorage.getItem('gramasiri_active_user') : null;
            const myUid = savedActive ? JSON.parse(savedActive).uid : null;
            const isForMe = !myUid || (recipientId && myUid === recipientId) || (conv?.participants.includes(myUid || ''));

            if (isForMe && msg.sender_id !== myUid) {
              notificationService.playMessageReceived();
              notificationService.sendNotification({
                title_kn: notifItem.title_kn,
                title_en: notifItem.title_en,
                body_kn: notifItem.message_kn,
                body_en: notifItem.message_en,
                section: 'messages',
                itemId: msg.conversation_id,
                urgent: false
              });
            }
          }
          break;
        }

        case 'MESSAGE_READ': {
          const { conversationId, readerId } = envelope.payload || {};
          if (conversationId && readerId) {
            let updated = false;
            this.messages.forEach((m) => {
              if (m.conversation_id === conversationId && m.sender_id !== readerId) {
                if (m.status !== 'READ') {
                  m.status = 'READ';
                  if (!m.read_by.includes(readerId)) m.read_by.push(readerId);
                  updated = true;
                }
              }
            });
            if (updated) {
              this.saveCollection('messages', this.messages);
              this.emit(`messages_${conversationId}`, this.messages.filter((m) => m.conversation_id === conversationId));
            }
          }
          break;
        }

        case 'SYNC_REQUEST': {
          if (this.users.length > 0 || this.news.length > 0 || this.events.length > 0 || this.gallery.length > 0) {
            realtimeSync.broadcast('SYNC_RESPONSE', {
              users: this.users,
              news: this.news,
              events: this.events,
              crops: this.crops,
              temples: this.temples,
              gallery: this.gallery,
              tournaments: this.tournaments
            });
          }
          break;
        }

        case 'SYNC_RESPONSE': {
          const data = envelope.payload;
          if (!data) return;
          if (Array.isArray(data.users)) {
            let uChanged = false;
            data.users.forEach((remU: UserProfile) => {
              if (!this.users.some((u) => u.uid === remU.uid)) {
                this.users.push(remU);
                uChanged = true;
              }
            });
            if (uChanged) this.saveCollection('users', [...this.users]);
          }
          if (Array.isArray(data.news)) {
            let nChanged = false;
            data.news.forEach((remN: NewsItem) => {
              if (!this.news.some((n) => n.id === remN.id)) {
                this.news.push(remN);
                nChanged = true;
              }
            });
            if (nChanged) {
              this.saveCollection('news', [...this.news]);
              this.emit('news', this.news);
            }
          }
          if (Array.isArray(data.events)) {
            let eChanged = false;
            data.events.forEach((remE: EventItem) => {
              if (!this.events.some((e) => e.id === remE.id)) {
                this.events.push(remE);
                eChanged = true;
              }
            });
            if (eChanged) this.saveCollection('events', [...this.events]);
          }
          if (Array.isArray(data.gallery)) {
            let gChanged = false;
            data.gallery.forEach((remG: GalleryItem) => {
              if (!this.gallery.some((g) => g.id === remG.id)) {
                this.gallery.push(remG);
                gChanged = true;
              }
            });
            if (gChanged) this.saveCollection('gallery', [...this.gallery]);
          }
          break;
        }
      }
    });
  }

  private initFirestoreSync() {
    if (!isFirebaseConfigured || !db) return;

    try {
      // 1. Live Firestore Conversations Sync across all users & devices
      const convsQuery = query(collection(db, 'conversations'), orderBy('updated_at', 'desc'), limit(100));
      onSnapshot(
        convsQuery,
        (snapshot) => {
          let changed = false;
          snapshot.docs.forEach((d) => {
            const data = { id: d.id, ...d.data() } as Conversation;
            const existingIdx = this.conversations.findIndex((c) => c.id === data.id);
            if (existingIdx >= 0) {
              const existing = this.conversations[existingIdx];
              if (new Date(data.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
                this.conversations[existingIdx] = { ...existing, ...data };
                changed = true;
              }
            } else {
              this.conversations.push(data);
              changed = true;
            }
          });
          if (changed) {
            this.saveCollection('conversations', this.conversations);
            this.emit('conversations', this.conversations);
          }
        },
        (err) => console.warn('Firestore conversations sync note:', err)
      );

      // 2. Live Firestore Messages Sync (all cross-user messages & photos!)
      const msgsQuery = query(collection(db, 'messages'), orderBy('created_at', 'asc'), limitToLast(300));
      onSnapshot(
        msgsQuery,
        (snapshot) => {
          let newMsgsAdded = false;
          const currentSavedUser = typeof window !== 'undefined' ? localStorage.getItem('gramasiri_active_user') : null;
          const currentUid = currentSavedUser ? JSON.parse(currentSavedUser).uid : null;

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const msg = { id: change.doc.id, ...change.doc.data() } as ChatMessage;
              if (!this.messages.some((m) => m.id === msg.id)) {
                this.messages.push(msg);
                newMsgsAdded = true;

                // Update conversation metadata if available
                const conv = this.conversations.find((c) => c.id === msg.conversation_id);
                if (conv) {
                  conv.last_message_text = msg.media_url && !msg.text ? '📷 Photo' : (msg.text || '');
                  conv.last_message_at = msg.created_at;
                  conv.last_sender_id = msg.sender_id;
                  conv.updated_at = msg.created_at;
                }

                // If sent recently (within last 45s) and targeted to current user, trigger alert
                const isFresh = Date.now() - new Date(msg.created_at).getTime() < 45000;
                if (isFresh && currentUid && msg.sender_id !== currentUid) {
                  const recipientId = conv?.participants.find((p) => p !== msg.sender_id);
                  if (recipientId === currentUid || conv?.participants.includes(currentUid)) {
                    // Create notification item in bell bar
                    const notifItem: NotificationItem = {
                      id: 'notif_msg_' + msg.id,
                      user_id: currentUid,
                      title_kn: `💬 ${msg.sender_name} ಅವರಿಂದ ಹೊಸ ಸಂದೇಶ`,
                      title_en: `💬 Message from ${msg.sender_name}`,
                      message_kn: msg.media_url && !msg.text ? `📷 ${msg.sender_name} ನಿಮಗೆ ಒಂದು ಚಿತ್ರವನ್ನು ಕಳುಹಿಸಿದ್ದಾರೆ.` : `${msg.sender_name}: ${msg.text || 'ಹೊಸ ಸಂದೇಶ'}`,
                      message_en: msg.media_url && !msg.text ? `📷 ${msg.sender_name} sent you a photo.` : `${msg.sender_name}: ${msg.text || 'New message'}`,
                      type: 'MESSAGE',
                      link_tab: 'messages',
                      read: false,
                      created_at: msg.created_at,
                      sender_id: msg.sender_id,
                      sender_name: msg.sender_name,
                      conversation_id: msg.conversation_id
                    };
                    if (!this.notifications.some((n) => n.id === notifItem.id)) {
                      this.notifications = [notifItem, ...this.notifications];
                      this.saveCollection('notifications', this.notifications);
                      this.emit('notifications', this.notifications);
                    }

                    notificationService.playMessageReceived();
                    notificationService.sendNotification({
                      title_kn: notifItem.title_kn,
                      title_en: notifItem.title_en,
                      body_kn: notifItem.message_kn,
                      body_en: notifItem.message_en,
                      section: 'messages',
                      itemId: msg.conversation_id,
                      urgent: false
                    });
                  }
                }

                this.emit(`messages_${msg.conversation_id}`, this.messages.filter((m) => m.conversation_id === msg.conversation_id));
              }
            }
          });

          if (newMsgsAdded) {
            this.saveCollection('messages', this.messages);
            this.emit('messages', this.messages);
            this.emit('unread_messages', this.messages);
            this.emit('conversations', this.conversations);
          }
        },
        (err) => console.warn('Firestore messages sync note:', err)
      );

      // 3. Live Firestore Notifications Sync
      const notifsQuery = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(100));
      onSnapshot(
        notifsQuery,
        (snapshot) => {
          let notifAdded = false;
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const item = { id: change.doc.id, ...change.doc.data() } as NotificationItem;
              if (!this.notifications.some((n) => n.id === item.id)) {
                this.notifications = [item, ...this.notifications];
                notifAdded = true;
              }
            }
          });
          if (notifAdded) {
            this.saveCollection('notifications', this.notifications);
            this.emit('notifications', this.notifications);
          }
        },
        (err) => console.warn('Firestore notifications sync note:', err)
      );
    } catch (e) {
      console.warn('Firestore initSync error:', e);
    }
  }

  private loadCollection<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(`gramasiri_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveCollection(key: string, data: any) {
    try {
      localStorage.setItem(`gramasiri_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`Local storage quota exceeded saving ${key}`, e);
    }
    this.emit(key, data);
  }

  private emit(key: string, data: any) {
    const subs = this.listeners.get(key);
    if (subs) {
      subs.forEach((cb) => cb(data));
    }
  }

  private subscribe<T>(key: string, initialData: T, callback: (data: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    callback(initialData);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  // --- DEMO MODE TOGGLE ---
  public getDemoMode(): boolean {
    return this.isDemoMode;
  }

  public setDemoMode(enable: boolean) {
    this.isDemoMode = enable;
    localStorage.setItem('gramasiri_demo_mode', String(enable));

    if (!enable) {
      // In strict production mode without demo data:
      this.news = this.news.filter((n) => !n.is_demo);
      this.events = this.events.filter((e) => !e.is_demo);
      this.crops = this.crops.filter((c) => !c.is_demo);
      this.temples = this.temples.filter((t) => !t.is_demo);
      this.history = this.history.filter((h) => !h.is_demo);
      this.stories = this.stories.filter((s) => !s.is_demo);
      this.achievements = this.achievements.filter((a) => !a.is_demo);
      this.gallery = this.gallery.filter((g) => !g.is_demo);
      this.socialLinks = this.socialLinks.filter((sl) => !sl.is_demo);
      this.tournaments = this.tournaments.filter((tr) => !tr.is_demo);
      this.emergencyAlert = this.emergencyAlert?.is_demo ? null : this.emergencyAlert;
      this.villageStats = {
        ...this.villageStats,
        population: 0,
        households: 0,
        area_sqkm: 0,
        schools: 0,
        temples: 0,
        main_crops_en: 'Information not available yet',
        main_crops_kn: 'ಮಾಹಿತಿ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ',
        source: 'Awaiting verified municipal data input',
        last_verified: new Date().toISOString().split('T')[0],
        verified_by: 'Pending Admin Entry'
      };
    } else {
      // Re-seed demo data
      this.news = SEED_NEWS;
      this.events = SEED_EVENTS;
      this.tournaments = SEED_TOURNAMENTS;
      this.crops = SEED_CROPS;
      this.temples = SEED_TEMPLES;
      this.history = SEED_HISTORY;
      this.stories = SEED_STORIES;
      this.villageStats = SEED_VILLAGE_STATS;
      this.achievements = SEED_ACHIEVEMENTS;
      this.gallery = SEED_GALLERY;
      this.socialLinks = SEED_SOCIAL_LINKS;
      this.emergencyAlert = SEED_EMERGENCY_ALERT;
    }

    this.saveCollection('news', this.news);
    this.saveCollection('events', this.events);
    this.saveCollection('tournaments', this.tournaments);
    this.saveCollection('crops', this.crops);
    this.saveCollection('temples', this.temples);
    this.saveCollection('history', this.history);
    this.saveCollection('stories', this.stories);
    this.saveCollection('village_stats', this.villageStats);
    this.saveCollection('achievements', this.achievements);
    this.saveCollection('gallery', this.gallery);
    this.saveCollection('social_links', this.socialLinks);
    this.saveCollection('emergency_alert', this.emergencyAlert);
    this.emit('demo_mode', this.isDemoMode);
  }

  // --- NEWS & COMMUNITY POSTS ---
  public getNews(): NewsItem[] {
    return this.news.length > 0 ? [...this.news] : [...SEED_NEWS];
  }

  public subscribeNews(callback: (news: NewsItem[]) => void): () => void {
    // 1. Immediately provide cached news
    const initialNews = this.news.length > 0 ? this.news : SEED_NEWS;
    callback(initialNews);

    // 2. Subscribe to local EventEmitter for instant optimistic UI updates
    const unsubLocal = this.subscribe('news', this.news, (items) => {
      callback(items);
    });

    // 3. Subscribe to Firestore real-time onSnapshot for cross-user/cloud live updates
    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'news'), orderBy('created_at', 'desc'));
        unsubFirestore = onSnapshot(
          q,
          (snapshot) => {
            const remoteItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem));
            if (remoteItems.length > 0) {
              // Merge remote items with local items, preserving any local items not yet synced
              const remoteIds = new Set(remoteItems.map((r) => r.id));
              const merged = [...remoteItems];
              for (const local of this.news) {
                if (!remoteIds.has(local.id)) {
                  merged.push(local);
                }
              }
              merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              this.news = merged;
              this.saveCollection('news', this.news);
              this.emit('news', this.news);
              callback(this.news);
            }
          },
          (err) => {
            console.warn('Firestore news listener fallback:', err);
          }
        );
      } catch (err) {
        console.warn('Firestore news listener fallback:', err);
      }
    }

    return () => {
      unsubLocal();
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  }

  public async addNews(newsItem: Omit<NewsItem, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'liked_by' | 'comments_count' | 'reports_count'>): Promise<NewsItem> {
    const now = new Date();
    const created_at = now.toISOString();
    const active_until = new Date(now.getTime() + ONE_WEEK_MS).toISOString();

    const newItem: NewsItem = {
      ...newsItem,
      id: 'news_' + Date.now(),
      created_at,
      updated_at: created_at,
      active_until,
      verification_status: 'VERIFIED', // Automatically verified for every upload!
      auto_verified: true,
      verified_by: newsItem.verified_by || newsItem.author_id,
      verified_by_name: newsItem.verified_by_name || newsItem.author_name,
      verified_at: newsItem.verified_at || created_at,
      likes_count: 0,
      liked_by: [],
      comments_count: 0,
      reports_count: 0,
      is_demo: false
    };

    // Clean undefined fields so setDoc never fails with Unsupported field value: undefined
    const cleanedItem = cleanFirestoreData(newItem);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'news', newItem.id), cleanedItem);
      } catch (e) {
        console.warn('Firestore setDoc failed, saving locally:', e);
      }
    }

    this.news = [newItem, ...this.news.filter((n) => n.id !== newItem.id)];
    this.saveCollection('news', this.news);
    this.emit('news', this.news);
    realtimeSync.broadcast('NEWS_CREATED', newItem);

    // Auto-generate notification item & trigger push notification across mobile
    this.addNotification({
      user_id: 'ALL',
      title_en: (newItem.urgent ? '🚨 URGENT: ' : '📰 NEW: ') + newItem.title_en,
      title_kn: (newItem.urgent ? '🚨 ತುರ್ತು: ' : '📰 ಹೊಸ ಸುದ್ದಿ: ') + newItem.title_kn,
      message_en: (newItem.content_en || newItem.title_en).substring(0, 120),
      message_kn: (newItem.content_kn || newItem.title_kn).substring(0, 120),
      type: newItem.urgent ? 'EMERGENCY' : 'NEWS_VERIFIED',
      link_tab: 'news'
    });

    this.logAudit('CREATE_NEWS', newItem.author_id, newItem.author_name, newItem.id, 'NEWS', `Created and auto-verified: ${newItem.title_en}`);
    return newItem;
  }

  public async verifyNews(
    newsId: string,
    status: VerificationStatus,
    verifiedByUid: string,
    verifiedByName: string,
    correction?: string,
    correctionKn?: string,
    urgent?: boolean
  ): Promise<void> {
    const target = this.news.find((n) => n.id === newsId);
    if (!target) return;

    target.verification_status = status;
    target.verified_by = verifiedByUid;
    target.verified_by_name = verifiedByName;
    target.verified_at = new Date().toISOString();
    target.updated_at = new Date().toISOString();
    if (correction !== undefined) target.official_correction = correction;
    if (correctionKn !== undefined) target.official_correction_kn = correctionKn;
    if (urgent !== undefined) target.urgent = urgent;

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'news', newsId), cleanFirestoreData({
          verification_status: status,
          verified_by: verifiedByUid,
          verified_by_name: verifiedByName,
          verified_at: target.verified_at,
          official_correction: target.official_correction,
          official_correction_kn: target.official_correction_kn,
          urgent: target.urgent
        }));
      } catch (e) {
        console.warn('Firestore verifyDoc error:', e);
      }
    }

    this.saveCollection('news', [...this.news]);
    this.emit('news', this.news);
    realtimeSync.broadcast('NEWS_VERIFIED', {
      newsId,
      status,
      verifiedByUid,
      verifiedByName,
      correction,
      correctionKn,
      urgent
    });
    this.logAudit('VERIFY_NEWS', verifiedByUid, verifiedByName, newsId, 'NEWS', `Set status to ${status}`);

    // If marked urgent or verified, trigger push notification
    if (status === 'VERIFIED' || urgent) {
      this.addNotification({
        user_id: 'ALL',
        title_en: `${urgent ? '🚨 URGENT: ' : '🟢 VERIFIED: '}${target.title_en}`,
        title_kn: `${urgent ? '🚨 ತುರ್ತು: ' : '🟢 ದೃಢೀಕೃತ: '}${target.title_kn}`,
        message_en: target.content_en.substring(0, 100) + '...',
        message_kn: target.content_kn.substring(0, 100) + '...',
        type: urgent ? 'EMERGENCY' : 'NEWS_VERIFIED',
        link_tab: 'news'
      });
    }
  }

  public async toggleLikeNews(newsId: string, uid: string): Promise<void> {
    const item = this.news.find((n) => n.id === newsId);
    if (!item) return;

    if (!Array.isArray(item.liked_by)) {
      item.liked_by = [];
    }
    const alreadyLiked = item.liked_by.includes(uid);
    if (alreadyLiked) {
      item.liked_by = item.liked_by.filter((id) => id !== uid);
      item.likes_count = Math.max(0, (item.likes_count || 1) - 1);
    } else {
      item.liked_by.push(uid);
      item.likes_count = (item.likes_count || 0) + 1;
    }

    this.saveCollection('news', [...this.news]);
    this.emit('news', this.news);
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'news', item.id), {
        likes_count: item.likes_count,
        liked_by: item.liked_by
      }).catch(() => {});
    }
    realtimeSync.broadcast('NEWS_LIKED', { newsId, uid, isLiked: !alreadyLiked });
  }

  public async deleteNews(newsId: string, uid: string, role: string): Promise<boolean> {
    const item = this.news.find((n) => n.id === newsId);
    if (!item) return false;

    // RBAC: Author or Admin/Moderator
    if (item.author_id !== uid && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized deletion attempt.');
    }

    this.news = this.news.filter((n) => n.id !== newsId);
    this.saveCollection('news', this.news);
    this.emit('news', this.news);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'news', newsId));
      } catch (e) {
        console.warn('Firestore deleteDoc error:', e);
      }
    }
    return true;
  }

  // --- COMMENTS ---
  public subscribeComments(postId: string, callback: (comments: CommentItem[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'comments'),
          where('post_id', '==', postId),
          orderBy('created_at', 'asc')
        );
        return onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CommentItem));
            if (items.length > 0) {
              callback(items);
            } else {
              callback(this.comments.filter((c) => c.post_id === postId));
            }
          },
          (err) => {
            console.warn('Firestore comments listener error (using local):', err);
            callback(this.comments.filter((c) => c.post_id === postId));
          }
        );
      } catch (e) {
        console.warn('Firestore comments query fallback:', e);
      }
    }
    const filtered = this.comments.filter((c) => c.post_id === postId);
    return this.subscribe(`comments_${postId}`, filtered, callback);
  }

  public async addComment(comment: Omit<CommentItem, 'id' | 'created_at' | 'likes_count' | 'liked_by' | 'reports_count'>): Promise<CommentItem> {
    const newComment: CommentItem = {
      ...comment,
      id: 'c_' + Date.now(),
      created_at: new Date().toISOString(),
      likes_count: 0,
      liked_by: [],
      reports_count: 0
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'comments', newComment.id), cleanFirestoreData(newComment));
      } catch (e) {
        console.warn('Firestore setDoc failed for comment:', e);
      }
    }

    this.comments = [newComment, ...this.comments];
    this.saveCollection('comments', this.comments);

    // Increment post/photo/story comment count
    const post = this.news.find((n) => n.id === comment.post_id);
    if (post) {
      post.comments_count = (post.comments_count || 0) + 1;
      this.saveCollection('news', [...this.news]);
      this.emit('news', this.news);
      if (isFirebaseConfigured && db) {
        updateDoc(doc(db, 'news', post.id), { comments_count: post.comments_count }).catch(() => {});
      }
    }

    const photo = this.gallery.find((g) => g.id === comment.post_id);
    if (photo) {
      photo.comments_count = (photo.comments_count || 0) + 1;
      this.saveCollection('gallery', [...this.gallery]);
      this.emit('gallery', this.gallery);
      if (isFirebaseConfigured && db) {
        updateDoc(doc(db, 'gallery', photo.id), { comments_count: photo.comments_count }).catch(() => {});
      }
    }

    const story = this.stories.find((s) => s.id === comment.post_id);
    if (story) {
      story.comments_count = (story.comments_count || 0) + 1;
      this.saveCollection('stories', [...this.stories]);
      this.emit('stories', this.stories);
      if (isFirebaseConfigured && db) {
        updateDoc(doc(db, 'stories', story.id), { comments_count: story.comments_count }).catch(() => {});
      }
    }

    this.emit(`comments_${comment.post_id}`, this.comments.filter((c) => c.post_id === comment.post_id));
    realtimeSync.broadcast('COMMENT_ADDED', newComment);
    return newComment;
  }

  public async toggleLikeComment(commentId: string, uid: string): Promise<void> {
    const item = this.comments.find((c) => c.id === commentId);
    if (!item) return;

    if (!Array.isArray(item.liked_by)) {
      item.liked_by = [];
    }
    const alreadyLiked = item.liked_by.includes(uid);
    if (alreadyLiked) {
      item.liked_by = item.liked_by.filter((id) => id !== uid);
      item.likes_count = Math.max(0, (item.likes_count || 1) - 1);
    } else {
      item.liked_by.push(uid);
      item.likes_count = (item.likes_count || 0) + 1;
    }

    this.saveCollection('comments', [...this.comments]);
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'comments', item.id), {
        likes_count: item.likes_count,
        liked_by: item.liked_by
      }).catch(() => {});
    }
    this.emit(`comments_${item.post_id}`, this.comments.filter((c) => c.post_id === item.post_id));
    realtimeSync.broadcast('COMMENT_LIKED', { commentId, postId: item.post_id, uid, isLiked: !alreadyLiked });
  }

  // --- EVENTS ---
  public subscribeEvents(callback: (events: EventItem[]) => void): () => void {
    const sanitizeEvents = (items: EventItem[]): EventItem[] => {
      return items.map((e) => {
        if (!e.organizer_phone || e.organizer_phone.includes('98450') || e.organizer_phone.includes('99000')) {
          return { ...e, organizer_phone: '+91 7483254968' };
        }
        return e;
      });
    };

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'events'), orderBy('event_date', 'asc'));
        return onSnapshot(
          q,
          (snapshot) => {
            const rawItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem));
            const items = sanitizeEvents(rawItems);
            if (items.length > 0) {
              this.events = items;
              this.saveCollection('events', items);
              callback(items);
            } else {
              callback(sanitizeEvents(this.events));
            }
          },
          (error) => {
            console.warn('Firestore events listener error (using local):', error);
            callback(sanitizeEvents(this.events));
          }
        );
      } catch (err) {
        console.warn('Firestore events listener fallback:', err);
      }
    }
    const cleanList = sanitizeEvents(this.events);
    return this.subscribe('events', cleanList, (updated) => callback(sanitizeEvents(updated)));
  }

  public async addEvent(event: Omit<EventItem, 'id' | 'participants_count' | 'registered_uids'>): Promise<EventItem> {
    const now = new Date();
    const cleanPhone = (!event.organizer_phone || event.organizer_phone.includes('98450') || event.organizer_phone.includes('99000'))
      ? '+91 7483254968'
      : event.organizer_phone;

    const newEvent: EventItem = {
      ...event,
      organizer_phone: cleanPhone,
      id: 'event_' + Date.now(),
      created_at: now.toISOString(),
      active_until: new Date(now.getTime() + ONE_WEEK_MS).toISOString(),
      participants_count: 0,
      registered_uids: [],
      is_demo: false
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'events', newEvent.id), cleanFirestoreData(newEvent));
      } catch (e) {
        console.warn('Firestore setDoc failed for event:', e);
      }
    }

    this.events = [newEvent, ...this.events];
    this.saveCollection('events', this.events);
    this.emit('events', this.events);
    realtimeSync.broadcast('EVENT_CREATED', newEvent);

    this.addNotification({
      user_id: 'ALL',
      title_en: '📅 NEW EVENT: ' + newEvent.title_en,
      title_kn: '📅 ಹೊಸ ಕಾರ್ಯಕ್ರಮ: ' + newEvent.title_kn,
      message_en: (newEvent.description_en || newEvent.title_en).substring(0, 120),
      message_kn: (newEvent.description_kn || newEvent.title_kn).substring(0, 120),
      type: 'EVENT',
      link_tab: 'events'
    });

    return newEvent;
  }

  public async registerForEvent(eventId: string, uid: string): Promise<boolean> {
    const evt = this.events.find((e) => e.id === eventId);
    if (!evt) return false;

    let isRegistered = false;
    if (!evt.registered_uids.includes(uid)) {
      evt.registered_uids.push(uid);
      evt.participants_count += 1;
      isRegistered = true;
    } else {
      // Unregister
      evt.registered_uids = evt.registered_uids.filter((id) => id !== uid);
      evt.participants_count = Math.max(0, evt.participants_count - 1);
      isRegistered = false;
    }

    this.saveCollection('events', [...this.events]);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'events', eventId), {
          registered_uids: evt.registered_uids,
          participants_count: evt.participants_count
        });
      } catch (e) {
        console.warn('Firestore updateDoc failed for event RSVP:', e);
      }
    }

    return isRegistered;
  }

  // --- SPORTS & LIVE SCORES ---
  public subscribeTournaments(callback: (tournaments: Tournament[]) => void): () => void {
    return this.subscribe('tournaments', this.tournaments, callback);
  }

  public async updateMatchScore(
    tournamentId: string,
    matchId: string,
    updates: Partial<MatchItem>
  ): Promise<void> {
    const tourn = this.tournaments.find((t) => t.id === tournamentId);
    if (!tourn) return;

    const match = tourn.matches.find((m) => m.id === matchId);
    if (!match) return;

    Object.assign(match, updates, { last_updated: new Date().toISOString() });
    this.saveCollection('tournaments', [...this.tournaments]);
    realtimeSync.broadcast('MATCH_SCORE_UPDATED', { tournamentId, matchId, updates });
  }

  public async addTournament(tourn: Omit<Tournament, 'id'>): Promise<Tournament> {
    const newTourn: Tournament = {
      ...tourn,
      id: 'tourn_' + Date.now(),
      is_demo: false
    };
    this.tournaments = [newTourn, ...this.tournaments];
    this.saveCollection('tournaments', this.tournaments);
    realtimeSync.broadcast('TOURNAMENT_CREATED', newTourn);
    return newTourn;
  }

  // --- AGRICULTURE & CROPS ---
  public subscribeCrops(callback: (crops: CropItem[]) => void): () => void {
    return this.subscribe('crops', this.crops, callback);
  }

  public async addCrop(crop: Omit<CropItem, 'id'>): Promise<CropItem> {
    const newCrop: CropItem = {
      ...crop,
      id: 'crop_' + Date.now(),
      is_demo: false
    };
    this.crops = [newCrop, ...this.crops];
    this.saveCollection('crops', this.crops);
    this.emit('crops', this.crops);
    realtimeSync.broadcast('CROP_ADDED', newCrop);

    this.addNotification({
      user_id: 'ALL',
      title_en: `🌾 Crop Guide: ${newCrop.name_en}`,
      title_kn: `🌾 ಕೃಷಿ ಮಾಹಿತಿ: ${newCrop.name_kn}`,
      message_en: newCrop.cultivation_en ? newCrop.cultivation_en.substring(0, 120) : 'Agricultural crop information updated.',
      message_kn: newCrop.cultivation_kn ? newCrop.cultivation_kn.substring(0, 120) : 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಕೃಷಿ ಬೆಳೆ ಮಾಹಿತಿ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.',
      type: 'SOCIAL',
      link_tab: 'agriculture'
    });

    return newCrop;
  }

  // --- TEMPLES & CULTURE ---
  public subscribeTemples(callback: (temples: TempleItem[]) => void): () => void {
    return this.subscribe('temples', this.temples, callback);
  }

  public async addTemple(temple: Omit<TempleItem, 'id'>): Promise<TempleItem> {
    const rawImage = temple.image_url?.trim() || '';
    const safeImage =
      !rawImage || rawImage.includes('photo-1609766857041-ed402ea8069a') || rawImage.toLowerCase().includes('bedroom')
        ? '/anime/temple_gopuram.jpg'
        : rawImage;

    const newTemple: TempleItem = {
      ...temple,
      image_url: safeImage,
      id: 'temple_' + Date.now(),
      is_demo: false
    };
    this.temples = [newTemple, ...this.temples];
    this.saveCollection('temples', this.temples);
    realtimeSync.broadcast('TEMPLE_ADDED', newTemple);
    return newTemple;
  }

  // --- HISTORY & STORIES ---
  public subscribeHistory(callback: (history: HistoryItem[]) => void): () => void {
    return this.subscribe('history', this.history, callback);
  }

  public subscribeStories(callback: (stories: StoryItem[]) => void): () => void {
    return this.subscribe('stories', this.stories, callback);
  }

  public async addHistory(item: Omit<HistoryItem, 'id'>): Promise<HistoryItem> {
    const newItem: HistoryItem = {
      ...item,
      id: 'hist_' + Date.now(),
      is_demo: false
    };
    this.history = [newItem, ...this.history];
    this.saveCollection('history', this.history);
    return newItem;
  }

  public async addStory(story: Omit<StoryItem, 'id' | 'created_at'>): Promise<StoryItem> {
    const newStory: StoryItem = {
      ...story,
      id: 'story_' + Date.now(),
      created_at: new Date().toISOString(),
      is_demo: false
    };
    this.stories = [newStory, ...this.stories];
    this.saveCollection('stories', this.stories);
    this.emit('stories', this.stories);
    return newStory;
  }

  public async toggleLikeStory(storyId: string, uid: string): Promise<void> {
    const item = this.stories.find((s) => s.id === storyId);
    if (!item) return;

    if (!Array.isArray(item.liked_by)) {
      item.liked_by = [];
    }
    const alreadyLiked = item.liked_by.includes(uid);
    if (alreadyLiked) {
      item.liked_by = item.liked_by.filter((id) => id !== uid);
      item.likes_count = Math.max(0, (item.likes_count || 1) - 1);
    } else {
      item.liked_by.push(uid);
      item.likes_count = (item.likes_count || 0) + 1;
    }

    this.saveCollection('stories', [...this.stories]);
    this.emit('stories', this.stories);
    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'stories', item.id), {
        likes_count: item.likes_count,
        liked_by: item.liked_by
      }).catch(() => {});
    }
  }

  // --- VILLAGE DATA & STATS ---
  public subscribeVillageStats(callback: (stats: VillageStats) => void): () => void {
    return this.subscribe('village_stats', this.villageStats, callback);
  }

  public async updateVillageStats(stats: Partial<VillageStats>, verifiedBy: string): Promise<void> {
    this.villageStats = {
      ...this.villageStats,
      ...stats,
      last_verified: new Date().toISOString().split('T')[0],
      verified_by: verifiedBy
    };
    this.saveCollection('village_stats', this.villageStats);
  }

  // --- ACHIEVEMENTS ---
  public subscribeAchievements(callback: (ach: AchievementItem[]) => void): () => void {
    return this.subscribe('achievements', this.achievements, callback);
  }

  public async addAchievement(ach: Omit<AchievementItem, 'id'>): Promise<AchievementItem> {
    const newAch: AchievementItem = {
      ...ach,
      id: 'ach_' + Date.now(),
      is_demo: false
    };
    this.achievements = [newAch, ...this.achievements];
    this.saveCollection('achievements', this.achievements);
    return newAch;
  }

  // --- GALLERY ---
  public subscribeGallery(callback: (gal: GalleryItem[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'gallery'), orderBy('created_at', 'desc'));
        return onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
            if (items.length > 0) {
              this.gallery = items;
              this.saveCollection('gallery', items);
              callback(items);
            } else {
              callback(this.gallery);
            }
          },
          (err) => {
            console.warn('Firestore gallery listener fallback:', err);
            callback(this.gallery);
          }
        );
      } catch (err) {
        console.warn('Firestore gallery query fallback:', err);
      }
    }
    return this.subscribe('gallery', this.gallery, callback);
  }

  public async addGalleryItem(item: Omit<GalleryItem, 'id' | 'likes_count' | 'liked_by' | 'created_at'>): Promise<GalleryItem> {
    const now = new Date();
    const newItem: GalleryItem = {
      ...item,
      id: 'gal_' + Date.now(),
      likes_count: 0,
      liked_by: [],
      created_at: now.toISOString(),
      active_until: new Date(now.getTime() + ONE_WEEK_MS).toISOString(),
      approved: true,
      is_demo: false
    };

    // Permanently save into IndexedDB (multi-gigabyte storage, immune to 5MB localStorage limits)
    try {
      await savePhotoPermanently(newItem);
    } catch (e) {
      console.warn('Persistent photo save error:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'gallery', newItem.id), cleanFirestoreData(newItem));
      } catch (e) {
        console.warn('Firestore gallery setDoc fallback:', e);
      }
    }

    this.gallery = [newItem, ...this.gallery];
    this.saveCollection('gallery', this.gallery);
    this.emit('gallery', this.gallery);
    realtimeSync.broadcast('PHOTO_ADDED', newItem);
    return newItem;
  }

  public async toggleLikeGalleryItem(itemId: string, uid: string): Promise<void> {
    const item = this.gallery.find((g) => g.id === itemId);
    if (!item) return;

    if (!Array.isArray(item.liked_by)) {
      item.liked_by = [];
    }
    const alreadyLiked = item.liked_by.includes(uid);
    if (alreadyLiked) {
      item.liked_by = item.liked_by.filter((id) => id !== uid);
      item.likes_count = Math.max(0, (item.likes_count || 1) - 1);
    } else {
      item.liked_by.push(uid);
      item.likes_count = (item.likes_count || 0) + 1;
    }

    this.saveCollection('gallery', [...this.gallery]);
    this.emit('gallery', this.gallery);
    savePhotoPermanently(item).catch(() => {});

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'gallery', item.id), {
        likes_count: item.likes_count,
        liked_by: item.liked_by
      }).catch(() => {});
    }

    realtimeSync.broadcast('PHOTO_LIKED', { photoId: itemId, uid, isLiked: !alreadyLiked });
  }

  public async deleteGalleryItem(itemId: string, uid: string, role: string): Promise<boolean> {
    const item = this.gallery.find((g) => g.id === itemId);
    if (!item) return false;

    if (item.author_id !== uid && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized deletion attempt.');
    }

    this.gallery = this.gallery.filter((g) => g.id !== itemId);
    this.saveCollection('gallery', this.gallery);
    this.emit('gallery', this.gallery);
    deletePermanentPhoto(itemId).catch(() => {});

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'gallery', itemId));
      } catch (e) {
        console.warn('Firestore gallery deleteDoc error:', e);
      }
    }
    return true;
  }

  // --- SOCIAL LINKS ---
  public subscribeSocialLinks(callback: (links: SocialLink[]) => void): () => void {
    return this.subscribe('social_links', this.socialLinks, callback);
  }

  public async addSocialLink(link: Omit<SocialLink, 'id'>): Promise<SocialLink> {
    const newLink: SocialLink = {
      ...link,
      id: 'soc_' + Date.now(),
      is_demo: false
    };
    this.socialLinks = [newLink, ...this.socialLinks];
    this.saveCollection('social_links', this.socialLinks);
    return newLink;
  }

  // --- EMERGENCY ALERT ---
  public subscribeEmergencyAlert(callback: (alert: EmergencyAlert | null) => void): () => void {
    return this.subscribe('emergency_alert', this.emergencyAlert, callback);
  }

  public async setEmergencyAlert(alert: EmergencyAlert | null): Promise<void> {
    this.emergencyAlert = alert;
    this.saveCollection('emergency_alert', this.emergencyAlert);
    this.emit('emergency_alert', this.emergencyAlert);
    realtimeSync.broadcast('EMERGENCY_ALERT_UPDATED', alert);

    if (alert && alert.active) {
      this.addNotification({
        user_id: 'ALL',
        title_en: '🚨 EMERGENCY: ' + alert.title_en,
        title_kn: '🚨 ತುರ್ತು ಪ್ರಕಟಣೆ: ' + alert.title_kn,
        message_en: alert.message_en,
        message_kn: alert.message_kn,
        type: 'EMERGENCY',
        link_tab: 'home'
      });
    }
  }

  // --- REPORTS ---
  public subscribeReports(callback: (reports: ReportItem[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'reports'), orderBy('created_at', 'desc'));
        return onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReportItem));
            if (items.length > 0) {
              this.reports = items;
              this.saveCollection('reports', items);
              callback(items);
            } else {
              callback(this.reports);
            }
          },
          (err) => {
            console.warn('Firestore reports listener error (using local):', err);
            callback(this.reports);
          }
        );
      } catch (e) {
        console.warn('Reports listener fallback:', e);
      }
    }
    return this.subscribe('reports', this.reports, callback);
  }

  public async createReport(report: Omit<ReportItem, 'id' | 'created_at' | 'status'>): Promise<ReportItem> {
    const newRep: ReportItem = {
      ...report,
      id: 'rep_' + Date.now(),
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'reports', newRep.id), cleanFirestoreData(newRep));
      } catch (e) {
        console.warn('Firestore setDoc failed for report:', e);
      }
    }

    this.reports = [newRep, ...this.reports];
    this.saveCollection('reports', this.reports);

    // Increment item report count if news
    if (report.item_type === 'POST') {
      const target = this.news.find((n) => n.id === report.item_id);
      if (target) {
        target.reports_count += 1;
        this.saveCollection('news', [...this.news]);
        if (isFirebaseConfigured && db) {
          updateDoc(doc(db, 'news', target.id), { reports_count: target.reports_count }).catch(() => {});
        }
      }
    }
    return newRep;
  }

  public async resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<void> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.status = status;
      this.saveCollection('reports', [...this.reports]);
      if (isFirebaseConfigured && db) {
        try {
          await updateDoc(doc(db, 'reports', reportId), { status });
        } catch (e) {
          console.warn('Firestore updateDoc failed for report:', e);
        }
      }
    }
  }

  // --- NOTIFICATIONS ---
  public subscribeNotifications(userId: string, callback: (notifs: NotificationItem[]) => void): () => void {
    const filterFn = (items: NotificationItem[]) => items.filter((n) => n.user_id === 'ALL' || n.user_id === userId);
    return this.subscribe('notifications', filterFn(this.notifications), (items) => callback(filterFn(items)));
  }

  public async addNotification(notif: Omit<NotificationItem, 'id' | 'created_at' | 'read'>): Promise<void> {
    const newNotif: NotificationItem = {
      ...notif,
      id: 'notif_' + Date.now(),
      read: false,
      created_at: new Date().toISOString()
    };
    this.notifications = [newNotif, ...this.notifications];
    this.saveCollection('notifications', this.notifications);
    this.emit('notifications', this.notifications);
    realtimeSync.broadcast('NOTIFICATION_CREATED', newNotif);

    // Trigger mobile notification tray, Web Audio chime, vibration, and in-app toast!
    notificationService.sendNotification({
      title_kn: newNotif.title_kn,
      title_en: newNotif.title_en,
      body_kn: newNotif.message_kn,
      body_en: newNotif.message_en,
      section: newNotif.link_tab || 'notifications',
      urgent: newNotif.type === 'EMERGENCY'
    });
  }

  public subscribeUnreadNotificationsCount(userId: string, callback: (count: number) => void): () => void {
    const calcCount = (items: NotificationItem[]) =>
      items.filter((n) => (n.user_id === 'ALL' || n.user_id === userId) && !n.read).length;

    callback(calcCount(this.notifications));
    return this.subscribe('notifications', this.notifications, (items) => {
      callback(calcCount(items));
    });
  }

  public async markAllNotificationsRead(userId: string): Promise<void> {
    this.notifications.forEach((n) => {
      if (n.user_id === 'ALL' || n.user_id === userId) {
        n.read = true;
      }
    });
    this.saveCollection('notifications', [...this.notifications]);
  }

  // --- USERS MANAGEMENT (RBAC) ---
  public subscribeUsers(callback: (users: UserProfile[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      try {
        return onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const items = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
            if (items.length > 0) {
              this.users = items;
              this.saveCollection('users', items);
              callback(items);
            } else {
              callback(this.users);
            }
          },
          (err) => {
            console.warn('Firestore users listener error (using local):', err);
            callback(this.users);
          }
        );
      } catch (e) {
        console.warn('Users listener fallback:', e);
      }
    }
    return this.subscribe('users', this.users, callback);
  }

  public async updateUserRole(uid: string, newRole: UserProfile['role']): Promise<void> {
    let u = this.users.find((user) => user.uid === uid);
    if (u) {
      u.role = newRole;
    } else {
      const fallbackUser: UserProfile = {
        uid,
        name: 'Resident ' + uid.slice(-4),
        role: newRole,
        language: 'kn',
        account_status: 'ACTIVE',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      this.users.push(fallbackUser);
      u = fallbackUser;
    }

    this.saveCollection('users', [...this.users]);
    this.emit('users', this.users);
    realtimeSync.broadcast('USER_UPDATED', u);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true }).catch(() => {});
    }

    // Update active user in localStorage if matching
    const active = localStorage.getItem('gramasiri_active_user');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        if (parsed.uid === uid) {
          parsed.role = newRole;
          localStorage.setItem('gramasiri_active_user', JSON.stringify(parsed));
        }
      } catch (e) {}
    }

    this.logAudit('UPDATE_USER_ROLE', 'admin', 'Super Admin', uid, 'USER', `Updated role to ${newRole}`);
  }

  public async assignRoleByEmail(
    email: string,
    role: UserProfile['role'],
    name?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address' };
    }

    let u = this.users.find((user) => user.email && user.email.toLowerCase() === cleanEmail);
    if (u) {
      u.role = role;
      if (name && !u.name) u.name = name;
    } else {
      const generatedUid = 'usr_pre_' + Date.now();
      const newUser: UserProfile = {
        uid: generatedUid,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: role,
        language: 'kn',
        account_status: 'ACTIVE',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      this.users.unshift(newUser);
      u = newUser;
    }

    this.saveCollection('users', [...this.users]);
    this.emit('users', this.users);
    realtimeSync.broadcast('USER_UPDATED', u);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'users', u.uid), { role, email: cleanEmail, name: u.name, account_status: 'ACTIVE' }, { merge: true }).catch(() => {});
    }

    this.logAudit('ASSIGN_ROLE_BY_EMAIL', 'admin', 'Super Admin', u.uid, 'USER', `Assigned role ${role} to ${cleanEmail}`);
    return { success: true, message: `Role ${role} assigned to ${cleanEmail} successfully!` };
  }

  public async updateUserStatus(uid: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'): Promise<void> {
    const u = this.users.find((user) => user.uid === uid);
    if (u) {
      u.account_status = status;
      this.saveCollection('users', [...this.users]);
      if (isFirebaseConfigured && db) {
        updateDoc(doc(db, 'users', uid), { account_status: status }).catch(() => {});
      }
      this.logAudit('UPDATE_USER_STATUS', 'admin', 'Super Admin', uid, 'USER', `Updated status to ${status}`);
    }
  }

  public async registerOrUpdateUser(profile: UserProfile): Promise<void> {
    const existingIndex = this.users.findIndex((u) => u.uid === profile.uid);
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...profile };
    } else {
      this.users.push(profile);
    }
    this.saveCollection('users', [...this.users]);

    if (isFirebaseConfigured && db && profile.uid) {
      try {
        await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
      } catch (e) {
        console.warn('Firestore registerOrUpdateUser error (using local):', e);
      }
    }

    realtimeSync.broadcast('USER_REGISTERED', profile);
  }

  public getUserProfile(uid: string): UserProfile | undefined {
    return this.users.find((u) => u.uid === uid);
  }

  /**
   * Updates user's avatar image and propagates it throughout all historical and active items:
   * users list, news posts authored, comments authored, gallery uploads, chat messages, and conversations.
   */
  public async syncUserPhoto(uid: string, photoUrl: string, name?: string): Promise<void> {
    if (!uid) return;

    // 1. Update in this.users
    const userIndex = this.users.findIndex((u) => u.uid === uid);
    if (userIndex >= 0) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        photoUrl,
        ...(name ? { name } : {})
      };
      this.saveCollection('users', [...this.users]);
    }

    // 2. Cascade update into News authored by this user
    let newsModified = false;
    this.news = this.news.map((item) => {
      if (item.author_id === uid && item.author_photo !== photoUrl) {
        newsModified = true;
        return { ...item, author_photo: photoUrl };
      }
      return item;
    });
    if (newsModified) {
      this.saveCollection('news', [...this.news]);
    }

    // 3. Cascade update into Comments authored by this user
    let commentsModified = false;
    this.comments = this.comments.map((c) => {
      if (c.author_id === uid && c.author_photo !== photoUrl) {
        commentsModified = true;
        return { ...c, author_photo: photoUrl };
      }
      return c;
    });
    if (commentsModified) {
      this.saveCollection('comments', [...this.comments]);
    }

    // 4. Cascade update into Conversations participant photos
    let convModified = false;
    this.conversations = this.conversations.map((conv) => {
      if (conv.participants.includes(uid)) {
        convModified = true;
        return {
          ...conv,
          participant_photos: {
            ...(conv.participant_photos || {}),
            [uid]: photoUrl
          }
        };
      }
      return conv;
    });
    if (convModified) {
      this.saveCollection('conversations', [...this.conversations]);
    }

    // 5. Cascade update into Messages sent by this user
    let msgsModified = false;
    this.messages = this.messages.map((m) => {
      if (m.sender_id === uid && m.sender_photo !== photoUrl) {
        msgsModified = true;
        return { ...m, sender_photo: photoUrl };
      }
      return m;
    });
    if (msgsModified) {
      this.saveCollection('messages', [...this.messages]);
    }

    // 6. Cascade update into Gallery items authored by this user
    let galleryModified = false;
    this.gallery = this.gallery.map((g) => {
      if (g.author_id === uid && g.author_photo !== photoUrl) {
        galleryModified = true;
        return { ...g, author_photo: photoUrl };
      }
      return g;
    });
    if (galleryModified) {
      this.saveCollection('gallery', [...this.gallery]);
    }

    // 7. Firestore sync if available
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', uid), { photoUrl, ...(name ? { name } : {}) }, { merge: true });
      } catch (e) {
        console.warn('Firestore syncUserPhoto warning:', e);
      }
    }

    // 8. Broadcast update
    realtimeSync.broadcast('USER_UPDATED', { uid, photoUrl, name });
  }

  public async updateUserPrivacy(
    uid: string,
    updates: {
      community_category?: UserProfile['community_category'];
      allow_find_me?: boolean;
      privacy_find?: UserProfile['privacy_find'];
      privacy_message?: UserProfile['privacy_message'];
      bio?: string;
      bio_kn?: string;
    }
  ): Promise<void> {
    const user = this.users.find((u) => u.uid === uid);
    if (user) {
      if (updates.community_category !== undefined) user.community_category = updates.community_category;
      if (updates.allow_find_me !== undefined) user.allow_find_me = updates.allow_find_me;
      if (updates.privacy_find !== undefined) user.privacy_find = updates.privacy_find;
      if (updates.privacy_message !== undefined) user.privacy_message = updates.privacy_message;
      if (updates.bio !== undefined) user.bio = updates.bio;
      if (updates.bio_kn !== undefined) user.bio_kn = updates.bio_kn;
      this.saveCollection('users', [...this.users]);
    }
  }

  /**
   * Returns list of discoverable community members.
   * Strips all private contact information (phone, email) for safety!
   */
  public getPublicCommunityUsers(currentUserId?: string): UserProfile[] {
    const blockedList = currentUserId ? this.getBlockedUsers(currentUserId) : [];

    return this.users
      .filter((u) => {
        // Only active users
        if (u.account_status !== 'ACTIVE') return false;
        // Check allow_find_me setting
        if (u.allow_find_me === false) return false;
        if (u.privacy_find === 'NOBODY') return false;
        if (!currentUserId && u.privacy_find === 'VILLAGE_MEMBERS') return false;
        // Don't show users who are blocked by current user or who blocked current user
        if (currentUserId) {
          if (blockedList.includes(u.uid)) return false;
          if (this.isUserBlocked(u.uid, currentUserId)) return false;
        }
        return true;
      })
      .map((u) => ({
        ...u,
        // STRICT PRIVACY PROTECTION: Never expose phone or email in public community directory
        phone: '',
        email: ''
      }));
  }

  // --- CONVERSATIONS & MESSAGING ---

  public subscribeConversations(userId: string, callback: (convs: Conversation[]) => void): () => void {
    const getFiltered = () => {
      const blocked = this.getBlockedUsers(userId);
      return this.conversations
        .filter((c) => {
          if (!c.participants.includes(userId)) return false;
          const otherId = c.participants.find((p) => p !== userId);
          if (otherId && (blocked.includes(otherId) || this.isUserBlocked(otherId, userId))) {
            return false;
          }
          return true;
        })
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    };

    return this.subscribe('conversations', getFiltered(), () => {
      callback(getFiltered());
    });
  }

  public subscribeMessages(conversationId: string, callback: (msgs: ChatMessage[]) => void): () => void {
    const getFiltered = () =>
      this.messages
        .filter((m) => m.conversation_id === conversationId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const unsubSpecific = this.subscribe(`messages_${conversationId}`, getFiltered(), () => {
      callback(getFiltered());
    });
    const unsubGeneral = this.subscribe('messages', getFiltered(), () => {
      callback(getFiltered());
    });

    return () => {
      unsubSpecific();
      unsubGeneral();
    };
  }

  public subscribeUnreadMessagesCount(userId: string, callback: (count: number) => void): () => void {
    const calcCount = () => {
      const blocked = this.getBlockedUsers(userId);
      return this.conversations
        .filter((c) => {
          if (!c.participants.includes(userId)) return false;
          const otherId = c.participants.find((p) => p !== userId);
          if (otherId && (blocked.includes(otherId) || this.isUserBlocked(otherId, userId))) {
            return false;
          }
          return true;
        })
        .reduce((sum, c) => sum + (c.unread_counts?.[userId] || 0), 0);
    };

    return this.subscribe('conversations', calcCount(), () => {
      callback(calcCount());
    });
  }

  public async getOrCreateConversation(
    userA: { uid: string; name: string; name_kn?: string; photoUrl?: string; role: any },
    userB: { uid: string; name: string; name_kn?: string; photoUrl?: string; role: any }
  ): Promise<Conversation> {
    if (this.isUserBlocked(userA.uid, userB.uid)) {
      throw new Error('Cannot start conversation with this user');
    }

    const convId = 'conv_' + [userA.uid, userB.uid].sort().join('_');
    let existing = this.conversations.find((c) => c.id === convId);

    if (!existing) {
      // Also look for any conversation with exactly both participants
      existing = this.conversations.find(
        (c) => c.participants.includes(userA.uid) && c.participants.includes(userB.uid) && c.participants.length === 2
      );
    }

    if (existing) {
      // Refresh participant details in case photos or names were updated
      existing.participant_names = {
        ...existing.participant_names,
        [userA.uid]: userA.name,
        [userB.uid]: userB.name
      };
      if (!existing.participant_photos) existing.participant_photos = {};
      if (userA.photoUrl) existing.participant_photos[userA.uid] = userA.photoUrl;
      if (userB.photoUrl) existing.participant_photos[userB.uid] = userB.photoUrl;

      if (!existing.participant_roles) existing.participant_roles = {};
      existing.participant_roles[userA.uid] = userA.role;
      existing.participant_roles[userB.uid] = userB.role;

      this.saveCollection('conversations', [...this.conversations]);
      return existing;
    }

    const newConv: Conversation = {
      id: convId,
      participants: [userA.uid, userB.uid],
      participant_names: {
        [userA.uid]: userA.name,
        [userB.uid]: userB.name
      },
      participant_photos: {
        ...(userA.photoUrl ? { [userA.uid]: userA.photoUrl } : {}),
        ...(userB.photoUrl ? { [userB.uid]: userB.photoUrl } : {})
      },
      participant_roles: {
        [userA.uid]: userA.role,
        [userB.uid]: userB.role
      },
      last_message_text: '',
      last_message_at: new Date().toISOString(),
      last_sender_id: userA.uid,
      updated_at: new Date().toISOString(),
      unread_counts: {
        [userA.uid]: 0,
        [userB.uid]: 0
      }
    };

    this.conversations = [newConv, ...this.conversations];
    this.saveCollection('conversations', this.conversations);
    if (isFirebaseConfigured && db) {
      try {
        setDoc(doc(db, 'conversations', newConv.id), cleanFirestoreData(newConv)).catch(() => {});
      } catch {}
    }
    return newConv;
  }

  public async sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    text: string;
    mediaUrl?: string;
  }): Promise<ChatMessage> {
    const conv = this.conversations.find((c) => c.id === params.conversationId);
    if (!conv) throw new Error('Conversation not found');

    const recipientId = conv.participants.find((p) => p !== params.senderId);
    if (recipientId && this.isUserBlocked(params.senderId, recipientId)) {
      throw new Error('Message cannot be sent to this user');
    }

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      conversation_id: params.conversationId,
      sender_id: params.senderId,
      sender_name: params.senderName,
      sender_photo: params.senderPhoto,
      text: params.text,
      media_url: params.mediaUrl,
      created_at: new Date().toISOString(),
      read_by: [params.senderId],
      status: 'SENT'
    };

    this.messages = [...this.messages, newMsg];
    this.saveCollection('messages', this.messages);

    // Update conversation metadata
    conv.last_message_text = params.mediaUrl && !params.text ? '📷 Photo' : params.text;
    conv.last_sender_id = params.senderId;
    conv.last_message_at = newMsg.created_at;
    conv.updated_at = newMsg.created_at;
    if (!conv.unread_counts) conv.unread_counts = {};
    if (recipientId) {
      conv.unread_counts[recipientId] = (conv.unread_counts[recipientId] || 0) + 1;
    }
    this.saveCollection('conversations', [...this.conversations]);
    this.emit('conversations', this.conversations);

    // 🔔 Create Notification for recipient in the Notification Bell Bar
    if (recipientId) {
      const notifItem: NotificationItem = {
        id: 'notif_msg_' + newMsg.id,
        user_id: recipientId,
        title_kn: `💬 ${params.senderName} ಅವರಿಂದ ಹೊಸ ಸಂದೇಶ`,
        title_en: `💬 Message from ${params.senderName}`,
        message_kn: params.mediaUrl && !params.text
          ? `📷 ${params.senderName} ನಿಮಗೆ ಒಂದು ಚಿತ್ರವನ್ನು ಕಳುಹಿಸಿದ್ದಾರೆ.`
          : `${params.senderName}: ${params.text || 'ಹೊಸ ಸಂದೇಶ'}`,
        message_en: params.mediaUrl && !params.text
          ? `📷 ${params.senderName} sent you a photo.`
          : `${params.senderName}: ${params.text || 'New message'}`,
        type: 'MESSAGE',
        link_tab: 'messages',
        read: false,
        created_at: newMsg.created_at,
        sender_id: params.senderId,
        sender_name: params.senderName,
        conversation_id: params.conversationId
      };

      this.notifications = [notifItem, ...this.notifications];
      this.saveCollection('notifications', this.notifications);
      this.emit('notifications', this.notifications);

      if (isFirebaseConfigured && db) {
        try {
          setDoc(doc(db, 'notifications', notifItem.id), cleanFirestoreData(notifItem)).catch(() => {});
        } catch {}
      }
    }

    if (isFirebaseConfigured && db) {
      try {
        setDoc(doc(db, 'messages', newMsg.id), cleanFirestoreData(newMsg)).catch(() => {});
        setDoc(doc(db, 'conversations', conv.id), cleanFirestoreData(conv)).catch(() => {});
      } catch {}
    }

    realtimeSync.broadcast('CHAT_MESSAGE', { message: newMsg, conversation: conv }, recipientId);
    this.emit('messages', this.messages);
    this.emit(`messages_${params.conversationId}`, this.messages.filter((m) => m.conversation_id === params.conversationId));
    this.emit('unread_messages', this.messages);

    return newMsg;
  }

  public getConversationById(conversationId: string): Conversation | undefined {
    return this.conversations.find((c) => c.id === conversationId);
  }

  public async markConversationRead(conversationId: string, userId: string): Promise<void> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    let convUpdated = false;
    if (conv && conv.unread_counts && conv.unread_counts[userId] > 0) {
      conv.unread_counts[userId] = 0;
      convUpdated = true;
    }

    // Mark messages as READ
    let msgsUpdated = false;
    this.messages.forEach((m) => {
      if (m.conversation_id === conversationId && m.sender_id !== userId) {
        if (!m.read_by.includes(userId)) {
          m.read_by.push(userId);
          m.status = 'READ';
          msgsUpdated = true;
        }
      }
    });

    // Mark related message notifications as read too!
    let notifsUpdated = false;
    this.notifications.forEach((n) => {
      if (n.type === 'MESSAGE' && n.conversation_id === conversationId && (n.user_id === userId || n.user_id === 'ALL')) {
        if (!n.read) {
          n.read = true;
          notifsUpdated = true;
        }
      }
    });

    if (convUpdated) {
      this.saveCollection('conversations', [...this.conversations]);
      this.emit('conversations', this.conversations);
      if (isFirebaseConfigured && db && conv) {
        try {
          setDoc(doc(db, 'conversations', conv.id), cleanFirestoreData(conv)).catch(() => {});
        } catch {}
      }
    }
    if (msgsUpdated) {
      this.saveCollection('messages', [...this.messages]);
      this.emit('messages', this.messages);
      this.emit(`messages_${conversationId}`, this.messages.filter((m) => m.conversation_id === conversationId));
      this.emit('unread_messages', this.messages);

      // Broadcast read receipt to other participant
      const partnerId = conv?.participants.find((p) => p !== userId);
      if (partnerId) {
        realtimeSync.broadcast('MESSAGE_READ', { conversationId, readerId: userId }, partnerId);
      }
    }
    if (notifsUpdated) {
      this.saveCollection('notifications', [...this.notifications]);
      this.emit('notifications', this.notifications);
    }
  }

  public async deleteMessage(messageId: string, conversationId: string, userId: string): Promise<boolean> {
    const index = this.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return false;

    // Only sender can delete their message
    if (this.messages[index].sender_id !== userId) {
      throw new Error('You can only delete your own messages');
    }

    this.messages.splice(index, 1);
    this.saveCollection('messages', [...this.messages]);

    // Recalculate last message for conversation if needed
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      const remainingMsgs = this.messages
        .filter((m) => m.conversation_id === conversationId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (remainingMsgs.length > 0) {
        const top = remainingMsgs[0];
        conv.last_message_text = top.media_url && !top.text ? '📷 Photo' : top.text;
        conv.last_sender_id = top.sender_id;
        conv.last_message_at = top.created_at;
      } else {
        conv.last_message_text = '';
      }
      this.saveCollection('conversations', [...this.conversations]);
    }

    return true;
  }

  // --- USER BLOCKING & PRIVACY ---

  public async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) return;
    if (!this.userBlocks.some((b) => b.blocker_id === blockerId && b.blocked_id === blockedId)) {
      const blockItem: UserBlock = {
        id: 'blk_' + Date.now(),
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString()
      };
      this.userBlocks = [blockItem, ...this.userBlocks];
      this.saveCollection('user_blocks', this.userBlocks);
      // Trigger conversation and count updates
      this.emit('conversations', this.conversations);
    }
  }

  public async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const lenBefore = this.userBlocks.length;
    this.userBlocks = this.userBlocks.filter((b) => !(b.blocker_id === blockerId && b.blocked_id === blockedId));
    if (this.userBlocks.length !== lenBefore) {
      this.saveCollection('user_blocks', this.userBlocks);
      this.emit('conversations', this.conversations);
    }
  }

  public isUserBlocked(userA: string, userB: string): boolean {
    return this.userBlocks.some(
      (b) =>
        (b.blocker_id === userA && b.blocked_id === userB) || (b.blocker_id === userB && b.blocked_id === userA)
    );
  }

  public getBlockedUsers(userId: string): string[] {
    return this.userBlocks.filter((b) => b.blocker_id === userId).map((b) => b.blocked_id);
  }

  public async reportUserOrMessage(
    reporterId: string,
    reporterName: string,
    targetType: 'USER' | 'MESSAGE',
    targetId: string,
    reason: string,
    details?: string
  ): Promise<void> {
    const report: ReportItem = {
      id: 'rep_' + Date.now(),
      item_type: targetType,
      item_id: targetId,
      item_title: `Community ${targetType} Report: ${reason}`,
      reporter_id: reporterId,
      reporter_name: reporterName,
      reason: details ? `${reason} — ${details}` : reason,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.reports = [report, ...this.reports];
    this.saveCollection('reports', this.reports);
    this.logAudit('REPORT_CREATED', reporterId, reporterName, targetId, targetType, `Reported for: ${reason}`);
  }

  // --- AUDIT LOGS ---
  private logAudit(action: string, actorId: string, actorName: string, targetId: string, targetType: string, details: string) {
    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      action,
      actor_id: actorId,
      actor_name: actorName,
      target_id: targetId,
      target_type: targetType,
      details,
      timestamp: new Date().toISOString()
    };
    this.auditLogs = [log, ...this.auditLogs];
    this.saveCollection('audit_logs', this.auditLogs);
  }

  public subscribeAuditLogs(callback: (logs: AuditLog[]) => void): () => void {
    return this.subscribe('audit_logs', this.auditLogs, callback);
  }

  // --- IMPORT & EXPORT ---
  public exportCompleteDatabase(): string {
    const dump = {
      export_date: new Date().toISOString(),
      village_stats: this.villageStats,
      news: this.news,
      events: this.events,
      tournaments: this.tournaments,
      crops: this.crops,
      temples: this.temples,
      history: this.history,
      stories: this.stories,
      achievements: this.achievements,
      gallery: this.gallery,
      social_links: this.socialLinks
    };
    return JSON.stringify(dump, null, 2);
  }

  public importDatabase(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (data.news && Array.isArray(data.news)) this.news = data.news;
      if (data.events && Array.isArray(data.events)) this.events = data.events;
      if (data.crops && Array.isArray(data.crops)) this.crops = data.crops;
      if (data.temples && Array.isArray(data.temples)) this.temples = data.temples;
      if (data.village_stats) this.villageStats = data.village_stats;

      this.saveCollection('news', this.news);
      this.saveCollection('events', this.events);
      this.saveCollection('crops', this.crops);
      this.saveCollection('temples', this.temples);
      this.saveCollection('village_stats', this.villageStats);
      return { success: true, message: 'Database imported and verified successfully.' };
    } catch (e: any) {
      return { success: false, message: 'Invalid JSON format: ' + e.message };
    }
  }
}

export const dbService = new DatabaseService();
