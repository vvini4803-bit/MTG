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
  AadhaarVerificationRecord,
  CommentItem,
  VerificationStatus,
  Conversation,
  ChatMessage,
  UserBlock,
  MapLocationItem,
  CommitteeMember,
  CommitteeContribution,
  CommitteeLoan,
  LoanRepayment,
  CommitteeExpense,
  CommitteeTransaction,
  CommitteeAuditLog,
  CommitteeSummary,
  CommitteeRole
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
  SEED_COMMITTEE_MEMBERS,
  SEED_COMMITTEE_CONTRIBUTIONS,
  SEED_COMMITTEE_LOANS,
  SEED_COMMITTEE_EXPENSES,
  SEED_COMMITTEE_TRANSACTIONS,
  SEED_COMMITTEE_AUDIT_LOGS,
  isSuperAdminEmail
} from './seedData';
import { MUTTAGONDI_GOVERNMENT_PEOPLE, GovernmentVillageResident } from './muttagondiGovernmentPeopleData';
import { VERIFIED_VILLAGE_LOCATIONS } from './defaultMapLocations';
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
  private mapLocations: MapLocationItem[] = [];
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
  private committeeMembers: CommitteeMember[] = [];
  private committeeContributions: CommitteeContribution[] = [];
  private committeeLoans: CommitteeLoan[] = [];
  private committeeExpenses: CommitteeExpense[] = [];
  private committeeTransactions: CommitteeTransaction[] = [];
  private committeeAuditLogs: CommitteeAuditLog[] = [];
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
    this.mapLocations = this.loadCollection('map_locations', VERIFIED_VILLAGE_LOCATIONS);
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

    // 🏛️ Initialize MTG Committee Financial Collections (Real Database Records Only)
    const cleanCommitteeKey = 'gramasiri_committee_real_v3';
    if (!localStorage.getItem(cleanCommitteeKey)) {
      localStorage.removeItem('gramasiri_committee_members');
      localStorage.removeItem('gramasiri_committee_contributions');
      localStorage.removeItem('gramasiri_committee_loans');
      localStorage.removeItem('gramasiri_committee_expenses');
      localStorage.removeItem('gramasiri_committee_transactions');
      localStorage.removeItem('gramasiri_committee_audit_logs');
      localStorage.setItem(cleanCommitteeKey, 'true');
    }

    this.committeeMembers = this.loadCollection('committee_members', []);
    this.committeeContributions = this.loadCollection('committee_contributions', []);
    this.committeeLoans = this.loadCollection('committee_loans', []);
    this.committeeExpenses = this.loadCollection('committee_expenses', []);
    this.committeeTransactions = this.loadCollection('committee_transactions', []);
    this.committeeAuditLogs = this.loadCollection('committee_audit_logs', []);

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

        case 'COMMENT_DELETED': {
          const { commentId, postId } = envelope.payload || {};
          if (!commentId) return;
          const target = this.comments.find((c) => c.id === commentId);
          if (target) {
            this.comments = this.comments.filter((c) => c.id !== commentId);
            this.saveCollection('comments', this.comments);
            const pId = postId || target.post_id;
            const post = this.news.find((n) => n.id === pId);
            if (post) {
              post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
              this.saveCollection('news', [...this.news]);
              this.emit('news', this.news);
            }
            this.emit(`comments_${pId}`, this.comments.filter((c) => c.post_id === pId));
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

        case 'MESSAGE_DELETED': {
          const { messageId, conversationId } = envelope.payload || {};
          if (!messageId) return;
          const idx = this.messages.findIndex((m) => m.id === messageId);
          if (idx >= 0) {
            this.messages.splice(idx, 1);
            this.saveCollection('messages', [...this.messages]);
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
              this.emit('conversations', this.conversations);
            }
            this.emit('messages', this.messages);
            this.emit(`messages_${conversationId}`, this.messages.filter((m) => m.conversation_id === conversationId));
            this.emit('unread_messages', this.messages);
          }
          break;
        }

        case 'COMMITTEE_UPDATED': {
          const { collectionName, item } = envelope.payload || {};
          if (collectionName && item) {
            if (collectionName === 'committee_members') {
              const idx = this.committeeMembers.findIndex((m) => m.id === item.id);
              if (idx >= 0) this.committeeMembers[idx] = item;
              else this.committeeMembers.push(item);
              this.saveCollection('committee_members', this.committeeMembers);
              this.emit('committee_members', this.committeeMembers);
            } else if (collectionName === 'committee_contributions') {
              const idx = this.committeeContributions.findIndex((c) => c.id === item.id);
              if (idx >= 0) this.committeeContributions[idx] = item;
              else this.committeeContributions.push(item);
              this.saveCollection('committee_contributions', this.committeeContributions);
              this.emit('committee_contributions', this.committeeContributions);
            } else if (collectionName === 'committee_loans') {
              const idx = this.committeeLoans.findIndex((l) => l.id === item.id);
              if (idx >= 0) this.committeeLoans[idx] = item;
              else this.committeeLoans.push(item);
              this.saveCollection('committee_loans', this.committeeLoans);
              this.emit('committee_loans', this.committeeLoans);
            } else if (collectionName === 'committee_expenses') {
              const idx = this.committeeExpenses.findIndex((e) => e.id === item.id);
              if (idx >= 0) this.committeeExpenses[idx] = item;
              else this.committeeExpenses.push(item);
              this.saveCollection('committee_expenses', this.committeeExpenses);
              this.emit('committee_expenses', this.committeeExpenses);
            } else if (collectionName === 'committee_transactions') {
              const idx = this.committeeTransactions.findIndex((t) => t.id === item.id);
              if (idx >= 0) this.committeeTransactions[idx] = item;
              else this.committeeTransactions = [item, ...this.committeeTransactions];
              this.saveCollection('committee_transactions', this.committeeTransactions);
              this.emit('committee_transactions', this.committeeTransactions);
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
      setDoc(
        doc(db, 'news', item.id),
        {
          likes_count: item.likes_count,
          liked_by: item.liked_by
        },
        { merge: true }
      ).catch(() => {});
    }

    realtimeSync.broadcast('NEWS_LIKED', { newsId, uid, isLiked: !alreadyLiked });

    // Notify author of post if liked by someone else
    if (!alreadyLiked && item.author_id && item.author_id !== uid) {
      const activeUserStr = typeof window !== 'undefined' ? localStorage.getItem('gramasiri_active_user') : null;
      let likerName = 'A resident';
      let likerNameKn = 'ಗ್ರಾಮಸ್ಥರು';
      if (activeUserStr) {
        try {
          const parsed = JSON.parse(activeUserStr);
          if (parsed.name) likerName = parsed.name;
          if (parsed.name_kn || parsed.name) likerNameKn = parsed.name_kn || parsed.name;
        } catch {}
      } else {
        const guestName = typeof window !== 'undefined' ? localStorage.getItem('gramasiri_resident_name') : null;
        if (guestName) {
          likerName = guestName;
          likerNameKn = guestName;
        }
      }

      this.addNotification({
        user_id: item.author_id,
        title_en: `❤️ ${likerName} liked your post`,
        title_kn: `❤️ ${likerNameKn} ನಿಮ್ಮ ಪೋಸ್ಟ್ ಇಷ್ಟಪಟ್ಟಿದ್ದಾರೆ`,
        message_en: `Your news update "${item.title_en}" received a new like!`,
        message_kn: `ನಿಮ್ಮ "${item.title_kn}" ಸುದ್ದಿಗೆ ಹೊಸ ಮೆಚ್ಚುಗೆ (Like) ಬಂದಿದೆ!`,
        type: 'SOCIAL',
        link_tab: 'news'
      }).catch(() => {});
    }
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

  public async updateNews(
    newsId: string,
    updates: Partial<NewsItem>,
    uid?: string,
    role?: string
  ): Promise<boolean> {
    const item = this.news.find((n) => n.id === newsId);
    if (!item) return false;

    // RBAC: Author or Admin/Moderator
    if (uid && role && item.author_id !== uid && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized update attempt.');
    }

    const updatedItem: NewsItem = {
      ...item,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.news = this.news.map((n) => (n.id === newsId ? updatedItem : n));
    this.saveCollection('news', this.news);
    this.emit('news', this.news);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'news', newsId), cleanFirestoreData(updates));
      } catch (e) {
        console.warn('Firestore updateNews error:', e);
      }
    }

    realtimeSync.broadcast('NEWS_UPDATED' as any, updatedItem);
    return true;
  }

  // --- COMMENTS ---
  public subscribeComments(postId: string, callback: (comments: CommentItem[]) => void): () => void {
    const getFiltered = () =>
      this.comments
        .filter((c) => c.post_id === postId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // 1. Immediately provide cached/local comments
    callback(getFiltered());

    // 2. Subscribe to local EventEmitter for instant optimistic UI updates on add & like
    const unsubLocal = this.subscribe(`comments_${postId}`, getFiltered(), () => {
      callback(getFiltered());
    });

    // 3. Subscribe to Firestore real-time onSnapshot WITHOUT requiring composite index
    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'comments'),
          where('post_id', '==', postId)
        );
        unsubFirestore = onSnapshot(
          q,
          (snapshot) => {
            let changed = false;
            snapshot.docChanges().forEach((change) => {
              const remote = { id: change.doc.id, ...change.doc.data() } as CommentItem;
              if (change.type === 'removed') {
                const prevLen = this.comments.length;
                this.comments = this.comments.filter((c) => c.id !== remote.id);
                if (this.comments.length !== prevLen) {
                  changed = true;
                }
              } else {
                const idx = this.comments.findIndex((c) => c.id === remote.id);
                if (idx >= 0) {
                  if (JSON.stringify(this.comments[idx]) !== JSON.stringify(remote)) {
                    this.comments[idx] = { ...this.comments[idx], ...remote };
                    changed = true;
                  }
                } else {
                  this.comments.push(remote);
                  changed = true;
                }
              }
            });
            if (changed) {
              this.saveCollection('comments', this.comments);
              callback(getFiltered());
            }
          },
          (err) => {
            console.warn('Firestore comments query fallback:', err);
          }
        );
      } catch (e) {
        console.warn('Firestore comments query fallback:', e);
      }
    }

    return () => {
      unsubLocal();
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  }

  public async addComment(comment: Omit<CommentItem, 'id' | 'created_at' | 'likes_count' | 'liked_by' | 'reports_count'>): Promise<CommentItem> {
    const newComment: CommentItem = {
      ...comment,
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
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
        setDoc(doc(db, 'news', post.id), { comments_count: post.comments_count }, { merge: true }).catch(() => {});
      }

      // Send notification to author of post if commented by someone else
      if (post.author_id && post.author_id !== comment.author_id) {
        this.addNotification({
          user_id: post.author_id,
          title_en: `💬 New comment from ${comment.author_name}`,
          title_kn: `💬 ${comment.author_name} ಅವರಿಂದ ಹೊಸ ಪ್ರತಿಕ್ರಿಯೆ`,
          message_en: `On "${post.title_en}": ${comment.text.substring(0, 60)}...`,
          message_kn: `"${post.title_kn}" ಸುದ್ದಿಗೆ: ${comment.text.substring(0, 60)}...`,
          type: 'SOCIAL',
          link_tab: 'news'
        }).catch(() => {});
      }
    }

    const photo = this.gallery.find((g) => g.id === comment.post_id);
    if (photo) {
      photo.comments_count = (photo.comments_count || 0) + 1;
      this.saveCollection('gallery', [...this.gallery]);
      this.emit('gallery', this.gallery);
      if (isFirebaseConfigured && db) {
        setDoc(doc(db, 'gallery', photo.id), { comments_count: photo.comments_count }, { merge: true }).catch(() => {});
      }
    }

    const story = this.stories.find((s) => s.id === comment.post_id);
    if (story) {
      story.comments_count = (story.comments_count || 0) + 1;
      this.saveCollection('stories', [...this.stories]);
      this.emit('stories', this.stories);
      if (isFirebaseConfigured && db) {
        setDoc(doc(db, 'stories', story.id), { comments_count: story.comments_count }, { merge: true }).catch(() => {});
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
      setDoc(
        doc(db, 'comments', item.id),
        {
          likes_count: item.likes_count,
          liked_by: item.liked_by
        },
        { merge: true }
      ).catch(() => {});
    }
    this.emit(`comments_${item.post_id}`, this.comments.filter((c) => c.post_id === item.post_id));
    realtimeSync.broadcast('COMMENT_LIKED', { commentId, postId: item.post_id, uid, isLiked: !alreadyLiked });
  }

  public async deleteComment(commentId: string, uid: string, role: string): Promise<boolean> {
    const item = this.comments.find((c) => c.id === commentId);
    if (!item) return false;

    // Only comment author or admin/moderator can delete
    if (item.author_id !== uid && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized deletion attempt.');
    }

    this.comments = this.comments.filter((c) => c.id !== commentId);
    this.saveCollection('comments', this.comments);

    // Decrement post comment count
    const post = this.news.find((n) => n.id === item.post_id);
    if (post) {
      post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
      this.saveCollection('news', [...this.news]);
      this.emit('news', this.news);
      if (isFirebaseConfigured && db) {
        setDoc(doc(db, 'news', post.id), { comments_count: post.comments_count }, { merge: true }).catch(() => {});
      }
    }

    this.emit(`comments_${item.post_id}`, this.comments.filter((c) => c.post_id === item.post_id));
    realtimeSync.broadcast('COMMENT_DELETED', { commentId, postId: item.post_id });

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'comments', commentId));
      } catch (e) {
        console.warn('Firestore deleteComment error:', e);
      }
    }

    return true;
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
    this.emit('temples', this.temples);
    realtimeSync.broadcast('TEMPLE_ADDED', newTemple);
    return newTemple;
  }

  public async updateTemple(
    templeId: string,
    updates: Partial<TempleItem>,
    _uid?: string,
    role?: string
  ): Promise<boolean> {
    const temple = this.temples.find((t) => t.id === templeId);
    if (!temple) return false;

    if (role && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized temple update attempt.');
    }

    const updatedTemple: TempleItem = {
      ...temple,
      ...updates
    };

    this.temples = this.temples.map((t) => (t.id === templeId ? updatedTemple : t));
    this.saveCollection('temples', this.temples);
    this.emit('temples', this.temples);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'temples', templeId), cleanFirestoreData(updates));
      } catch (e) {
        console.warn('Firestore updateTemple error:', e);
      }
    }

    realtimeSync.broadcast('TEMPLE_UPDATED' as any, updatedTemple);
    return true;
  }

  public async deleteTemple(
    templeId: string,
    _uid?: string,
    role?: string
  ): Promise<boolean> {
    const temple = this.temples.find((t) => t.id === templeId);
    if (!temple) return false;

    if (role && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized temple deletion attempt.');
    }

    this.temples = this.temples.filter((t) => t.id !== templeId);
    this.saveCollection('temples', this.temples);
    this.emit('temples', this.temples);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'temples', templeId));
      } catch (e) {
        console.warn('Firestore deleteTemple error:', e);
      }
    }

    realtimeSync.broadcast('TEMPLE_DELETED' as any, { templeId });
    return true;
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
    callback(this.gallery);
    const unsubLocal = this.subscribe('gallery', this.gallery, callback);

    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'gallery'), orderBy('created_at', 'desc'));
        unsubFirestore = onSnapshot(
          q,
          (snapshot) => {
            const remoteItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
            if (remoteItems.length > 0) {
              const remoteIds = new Set(remoteItems.map((r) => r.id));
              const merged = [...remoteItems];
              for (const local of this.gallery) {
                if (!remoteIds.has(local.id)) {
                  merged.push(local);
                }
              }
              merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              this.gallery = merged;
              this.saveCollection('gallery', this.gallery);
              this.emit('gallery', this.gallery);
              callback(this.gallery);
            }
          },
          (err) => {
            console.warn('Firestore gallery listener fallback:', err);
          }
        );
      } catch (err) {
        console.warn('Firestore gallery query fallback:', err);
      }
    }

    return () => {
      unsubLocal();
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
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
      setDoc(
        doc(db, 'gallery', item.id),
        {
          likes_count: item.likes_count,
          liked_by: item.liked_by
        },
        { merge: true }
      ).catch(() => {});
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

  // --- MAP LOCATIONS & LANDMARKS ---
  public subscribeMapLocations(callback: (locs: MapLocationItem[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      try {
        const q = collection(db, 'map_locations');
        return onSnapshot(
          q,
          (snapshot) => {
            const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MapLocationItem));
            if (remote.length > 0) {
              const remoteIds = new Set(remote.map((r) => r.id));
              const merged = [...remote];
              for (const loc of this.mapLocations) {
                if (!remoteIds.has(loc.id)) {
                  merged.push(loc);
                }
              }
              this.mapLocations = merged;
              this.saveCollection('map_locations', this.mapLocations);
              callback(this.mapLocations);
            } else {
              callback(this.mapLocations);
            }
          },
          (err) => {
            console.warn('Map locations listener fallback:', err);
            callback(this.mapLocations);
          }
        );
      } catch (e) {
        console.warn('Map locations query fallback:', e);
      }
    }
    return this.subscribe('map_locations', this.mapLocations, callback);
  }

  public async addMapLocation(item: Omit<MapLocationItem, 'id'>): Promise<MapLocationItem> {
    const newLoc: MapLocationItem = {
      ...item,
      id: 'loc_' + Date.now(),
      verified: item.verified ?? true,
      is_demo: false
    };

    this.mapLocations = [newLoc, ...this.mapLocations];
    this.saveCollection('map_locations', this.mapLocations);
    this.emit('map_locations', this.mapLocations);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'map_locations', newLoc.id), cleanFirestoreData(newLoc));
      } catch (e) {
        console.warn('Firestore setDoc failed for map location:', e);
      }
    }

    realtimeSync.broadcast('MAP_LOCATION_ADDED' as any, newLoc);
    return newLoc;
  }

  public async updateMapLocation(
    locationId: string,
    updates: Partial<MapLocationItem>,
    _uid?: string,
    role?: string
  ): Promise<boolean> {
    const loc = this.mapLocations.find((l) => l.id === locationId);
    if (!loc) return false;

    if (role && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized map location update attempt.');
    }

    const updatedLoc: MapLocationItem = {
      ...loc,
      ...updates
    };

    this.mapLocations = this.mapLocations.map((l) => (l.id === locationId ? updatedLoc : l));
    this.saveCollection('map_locations', this.mapLocations);
    this.emit('map_locations', this.mapLocations);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'map_locations', locationId), cleanFirestoreData(updates));
      } catch (e) {
        console.warn('Firestore updateDoc failed for map location:', e);
      }
    }

    realtimeSync.broadcast('MAP_LOCATION_UPDATED' as any, updatedLoc);
    return true;
  }

  public async deleteMapLocation(
    locationId: string,
    _uid?: string,
    role?: string
  ): Promise<boolean> {
    const loc = this.mapLocations.find((l) => l.id === locationId);
    if (!loc) return false;

    if (role && !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) {
      throw new Error('Unauthorized map location deletion attempt.');
    }

    this.mapLocations = this.mapLocations.filter((l) => l.id !== locationId);
    this.saveCollection('map_locations', this.mapLocations);
    this.emit('map_locations', this.mapLocations);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'map_locations', locationId));
      } catch (e) {
        console.warn('Firestore deleteDoc failed for map location:', e);
      }
    }

    realtimeSync.broadcast('MAP_LOCATION_DELETED' as any, { locationId });
    return true;
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

  /**
   * Save Aadhaar village residence verification for user
   */
  public async setAadhaarResidenceVerification(
    uid: string,
    record: AadhaarVerificationRecord,
    isMuttagondi: boolean
  ): Promise<void> {
    const user = this.users.find((u) => u.uid === uid);
    if (user) {
      user.aadhaar_verification = record;
      user.is_muttagondi_resident = isMuttagondi;
      if (record.ward_or_street) {
        user.ward_or_street = record.ward_or_street;
      }
      if (record.ward_or_street_kn) {
        user.ward_or_street_kn = record.ward_or_street_kn;
      }
      this.saveCollection('users', [...this.users]);

      if (isFirebaseConfigured && db) {
        try {
          const userDoc = doc(db, 'users', uid);
          await updateDoc(userDoc, {
            aadhaar_verification: record,
            is_muttagondi_resident: isMuttagondi,
            ward_or_street: record.ward_or_street || '',
            ward_or_street_kn: record.ward_or_street_kn || ''
          });
        } catch (err) {
          console.warn('[dbService] setAadhaarResidenceVerification firestore sync:', err);
        }
      }
    }
  }

  /**
   * Returns list of Muttagondi People (Aadhaar verified residents & village community)
   * Enforces strict UIDAI privacy: NEVER exposes full Aadhaar numbers, masked Aadhaar is hidden,
   * sensitive biometrics are impossible to query.
   */
  public getMuttagondiPeople(currentUserId?: string, onlyAadhaarVerified: boolean = false): UserProfile[] {
    const publicUsers = this.getPublicCommunityUsers(currentUserId);
    return publicUsers
      .filter((u) => {
        if (onlyAadhaarVerified) {
          return u.aadhaar_verification?.is_verified === true && u.is_muttagondi_resident === true;
        }
        // Include residents of Muttagondi
        return u.is_muttagondi_resident !== false;
      })
      .map((u) => ({
        ...u,
        phone: '', // Stripped for privacy
        email: '', // Stripped for privacy
        // Ensure sensitive fields are NEVER leaked in public list
        aadhaar_verification: u.aadhaar_verification
          ? {
              ...u.aadhaar_verification,
              masked_aadhaar: 'XXXX-XXXX-****' // Sanitized for public directory
            }
          : undefined
      }));
  }

  /**
   * Returns official government register of Muttagondi village residents
   * Integrated with Karnataka Kutumba & Grama Panchayat Citizen database.
   * Loads from persistent storage if customized/imported by village administrators.
   */
  public getGovernmentVillageResidents(): GovernmentVillageResident[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('gramasiri_government_residents');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[dbService] getGovernmentVillageResidents parse error:', err);
      }
    }
    return MUTTAGONDI_GOVERNMENT_PEOPLE;
  }

  /**
   * Persists a custom/imported list of real village residents (e.g. from CEO Karnataka Electoral Roll / Kellodu GP)
   */
  public saveGovernmentVillageResidents(residents: GovernmentVillageResident[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gramasiri_government_residents', JSON.stringify(residents));
      } catch (err) {
        console.warn('[dbService] saveGovernmentVillageResidents error:', err);
      }
    }
  }

  /**
   * Adds a single verified real resident to the village directory
   */
  public addGovernmentVillageResident(resident: GovernmentVillageResident): void {
    const current = this.getGovernmentVillageResidents();
    const updated = [resident, ...current];
    this.saveGovernmentVillageResidents(updated);
  }

  /**
   * Updates an existing resident's information
   */
  public updateGovernmentVillageResident(resident: GovernmentVillageResident): void {
    const current = this.getGovernmentVillageResidents();
    const idx = current.findIndex(r => r.id === resident.id);
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = resident;
      this.saveGovernmentVillageResidents(updated);
    }
  }

  /**
   * Deletes a resident record from the active roll
   */
  public deleteGovernmentVillageResident(id: string): void {
    const current = this.getGovernmentVillageResidents();
    const updated = current.filter(r => r.id !== id);
    this.saveGovernmentVillageResidents(updated);
  }

  /**
   * Resets the village residents list back to the Census 2011 baseline
   */
  public resetGovernmentVillageResidents(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gramasiri_government_residents');
    }
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

    callback(getFiltered());

    const unsubLocal = this.subscribe('conversations', getFiltered(), () => {
      callback(getFiltered());
    });

    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', userId)
        );
        unsubFirestore = onSnapshot(
          q,
          (snapshot) => {
            let changed = false;
            snapshot.docs.forEach((doc) => {
              const remoteConv = { id: doc.id, ...doc.data() } as Conversation;
              const idx = this.conversations.findIndex((c) => c.id === remoteConv.id);
              if (idx >= 0) {
                if (new Date(remoteConv.updated_at).getTime() >= new Date(this.conversations[idx].updated_at).getTime()) {
                  this.conversations[idx] = { ...this.conversations[idx], ...remoteConv };
                  changed = true;
                }
              } else {
                this.conversations.push(remoteConv);
                changed = true;
              }
            });
            if (changed) {
              this.saveCollection('conversations', this.conversations);
              callback(getFiltered());
            }
          },
          (err) => console.warn('Firestore user conversations note:', err)
        );
      } catch (e) {
        console.warn('Firestore user conversations listener error:', e);
      }
    }

    return () => {
      unsubLocal();
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  }

  public subscribeMessages(conversationId: string, callback: (msgs: ChatMessage[]) => void): () => void {
    const getFiltered = () =>
      this.messages
        .filter((m) => m.conversation_id === conversationId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    callback(getFiltered());

    const unsubSpecific = this.subscribe(`messages_${conversationId}`, getFiltered(), () => {
      callback(getFiltered());
    });
    const unsubGeneral = this.subscribe('messages', getFiltered(), () => {
      callback(getFiltered());
    });

    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'messages'),
          where('conversation_id', '==', conversationId)
        );
        unsubFirestore = onSnapshot(
          q,
          (snapshot) => {
            let changed = false;
            snapshot.docChanges().forEach((change) => {
              const remoteMsg = { id: change.doc.id, ...change.doc.data() } as ChatMessage;
              if (change.type === 'removed') {
                const prevLen = this.messages.length;
                this.messages = this.messages.filter((m) => m.id !== remoteMsg.id);
                if (this.messages.length !== prevLen) {
                  changed = true;
                }
              } else {
                const existingIdx = this.messages.findIndex((m) => m.id === remoteMsg.id);
                if (existingIdx >= 0) {
                  if (JSON.stringify(this.messages[existingIdx]) !== JSON.stringify(remoteMsg)) {
                    this.messages[existingIdx] = remoteMsg;
                    changed = true;
                  }
                } else {
                  this.messages.push(remoteMsg);
                  changed = true;
                }
              }
            });
            if (changed) {
              this.saveCollection('messages', this.messages);
              callback(getFiltered());
            }
          },
          (err) => console.warn('Firestore messages for conv note:', err)
        );
      } catch (e) {
        console.warn('Firestore messages for conv listener error:', e);
      }
    }

    return () => {
      unsubSpecific();
      unsubGeneral();
      if (unsubFirestore) {
        unsubFirestore();
      }
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

    this.emit('messages', this.messages);
    this.emit(`messages_${conversationId}`, this.messages.filter((m) => m.conversation_id === conversationId));
    this.emit('conversations', this.conversations);
    this.emit('unread_messages', this.messages);
    realtimeSync.broadcast('MESSAGE_DELETED', { messageId, conversationId });

    if (isFirebaseConfigured && db) {
      try {
        deleteDoc(doc(db, 'messages', messageId)).catch(() => {});
        if (conv) {
          setDoc(doc(db, 'conversations', conv.id), cleanFirestoreData(conv), { merge: true }).catch(() => {});
        }
      } catch (e) {
        console.warn('Firestore deleteMessage note:', e);
      }
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

  // ==========================================
  // 🏛️ MTG COMMITTEE & FINANCIAL MANAGEMENT API
  // ==========================================

  public getCommitteeSummary(): CommitteeSummary {
    const confirmedContributions = this.committeeContributions
      .filter((c) => c.status === 'PAID')
      .reduce((acc, c) => acc + (c.amount_paid || 0), 0);

    const otherIncome = this.committeeTransactions
      .filter((t) => t.type === 'OTHER_INCOME' && t.direction === 'IN' && t.status === 'COMPLETED')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const totalExpenses = this.committeeExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalLoansIssued = this.committeeLoans.reduce((acc, l) => acc + (l.principal_amount || 0), 0);

    // Total Fund per Requirement 4: SUM(actual confirmed member contributions) + other verified income - actual expenses - actual loan disbursements
    const totalFundCollected = confirmedContributions + otherIncome - totalExpenses - totalLoansIssued;

    const activeLoans = this.committeeLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'PARTIALLY_PAID' || l.status === 'OVERDUE');
    const activeLoansCount = activeLoans.length;

    const totalPrincipalRepaid = this.committeeLoans.reduce((acc, l) => {
      const repPrincipal = (l.repayments || []).reduce((rAcc, r) => rAcc + (r.principal_portion || 0), 0);
      return acc + repPrincipal;
    }, 0);

    // Outstanding Loans per Requirement 6: actual loan principal - actual confirmed repayments
    const outstandingLoanAmount = Math.max(0, totalLoansIssued - totalPrincipalRepaid);

    // Interest Earned per Requirement 6: actual confirmed interest payments
    const interestEarned = this.committeeLoans.reduce((acc, l) => {
      const repInterest = (l.repayments || []).reduce((rAcc, r) => rAcc + (r.interest_portion || 0), 0);
      return acc + repInterest;
    }, 0);

    // Available Balance per Requirement 6: calculated from verified transactions
    const availableBalance = Math.max(0, confirmedContributions + totalPrincipalRepaid + interestEarned + otherIncome - totalLoansIssued - totalExpenses);

    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentMonthContribs = this.committeeContributions.filter((c) => c.month === currentMonth);
    const pendingContribs = currentMonthContribs.filter((c) => c.status === 'PENDING' || c.amount_paid < c.expected_amount);
    const pendingContributionsCount = pendingContribs.length;
    const pendingContributionsAmount = pendingContribs.reduce((acc, c) => acc + Math.max(0, c.expected_amount - c.amount_paid), 0);

    return {
      totalFundCollected,
      activeLoansCount,
      outstandingLoanAmount,
      interestEarned,
      totalExpenses,
      availableBalance,
      pendingContributionsCount,
      pendingContributionsAmount,
      totalMembersCount: this.committeeMembers.length,
      activeMembersCount: this.committeeMembers.filter((m) => m.status === 'ACTIVE').length,
      monthlyTarget: this.committeeMembers.filter((m) => m.status === 'ACTIVE').length * 1000
    };
  }

  // --- FIRST ADMIN & ROLE CHECKING ---
  public hasCommitteeAdmin(): boolean {
    return this.committeeMembers.some((m) => m.role === 'ADMIN' && m.status === 'ACTIVE');
  }

  public async setupFirstAdmin(params: {
    name: string;
    name_kn?: string;
    phone: string;
    email?: string;
    address?: string;
    userId?: string;
  }): Promise<CommitteeMember> {
    if (this.hasCommitteeAdmin()) {
      throw new Error('Committee Admin account already exists. Only existing Admin can assign roles.');
    }

    const firstAdmin: CommitteeMember = {
      id: 'mem_' + Date.now(),
      user_id: params.userId,
      name: params.name.trim(),
      name_kn: params.name_kn?.trim(),
      phone: params.phone.trim(),
      email: params.email?.trim(),
      address: params.address || 'Muttagundi Village',
      joining_date: new Date().toISOString().split('T')[0],
      role: 'ADMIN',
      role_kn: 'ಅಡ್ಮಿನ್ (ಮುಖ್ಯಸ್ಥರು)',
      status: 'ACTIVE',
      total_contributed: 0,
      active_loans_count: 0,
      outstanding_loan_balance: 0,
      created_at: new Date().toISOString()
    };

    this.committeeMembers = [firstAdmin];
    this.saveCollection('committee_members', this.committeeMembers);

    await this.addAuditLog({
      action: 'SETUP_FIRST_ADMIN',
      action_kn: 'ಮೊದಲ ಸಮಿತಿ ಅಡ್ಮಿನ್ ಸ್ಥಾಪಿಸಲಾಗಿದೆ',
      actor_id: params.userId || firstAdmin.id,
      actor_name: firstAdmin.name,
      actor_role: 'ADMIN',
      target_id: firstAdmin.id,
      target_type: 'MEMBER',
      new_value: `${firstAdmin.name} (ADMIN)`,
      details: 'Established the initial Committee Admin account.'
    });

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_members', firstAdmin.id), cleanFirestoreData(firstAdmin)).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_members', item: firstAdmin });
    return firstAdmin;
  }

  // --- MEMBERS ---
  public subscribeCommitteeMembers(callback: (members: CommitteeMember[]) => void): () => void {
    return this.subscribe('committee_members', this.committeeMembers, callback);
  }

  public async addCommitteeMember(
    member: Omit<CommitteeMember, 'id' | 'created_at' | 'total_contributed' | 'active_loans_count' | 'outstanding_loan_balance'>,
    actorId: string,
    actorName: string,
    actorRole: CommitteeRole = 'ADMIN'
  ): Promise<CommitteeMember> {
    if (this.hasCommitteeAdmin() && actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin or Vice Admin can add members.');
    }
    if (actorRole === 'VICE_ADMIN' && member.role === 'ADMIN') {
      throw new Error('Unauthorized: Vice Admin cannot assign Admin role.');
    }

    const assignedRole: CommitteeRole = member.role || 'MEMBER';
    const roleKn = assignedRole === 'ADMIN' ? 'ಅಡ್ಮಿನ್ (ಮುಖ್ಯಸ್ಥರು)' : assignedRole === 'VICE_ADMIN' ? 'ಉಪ ಅಡ್ಮಿನ್' : 'ಸದಸ್ಯರು';

    const newMember: CommitteeMember = {
      ...member,
      id: 'mem_' + Date.now(),
      role: assignedRole,
      role_kn: member.role_kn || roleKn,
      total_contributed: 0,
      active_loans_count: 0,
      outstanding_loan_balance: 0,
      created_at: new Date().toISOString()
    };

    this.committeeMembers = [...this.committeeMembers, newMember];
    this.saveCollection('committee_members', this.committeeMembers);

    await this.addAuditLog({
      action: 'ADD_MEMBER',
      action_kn: 'ಹೊಸ ಸಮಿತಿ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      target_id: newMember.id,
      target_type: 'MEMBER',
      new_value: `${newMember.name} (${newMember.role})`
    });

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_members', newMember.id), cleanFirestoreData(newMember)).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_members', item: newMember });
    return newMember;
  }

  public async updateCommitteeMember(
    id: string,
    updates: Partial<CommitteeMember>,
    actorId: string,
    actorName: string,
    actorRole: CommitteeRole = 'ADMIN'
  ): Promise<CommitteeMember | null> {
    if (actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin or Vice Admin can update member information.');
    }

    const idx = this.committeeMembers.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const oldMember = this.committeeMembers[idx];

    // Security constraints for Vice Admin
    if (actorRole === 'VICE_ADMIN') {
      if (oldMember.role === 'ADMIN') {
        throw new Error('Unauthorized: Vice Admin cannot modify Admin account.');
      }
      if (updates.role && updates.role !== oldMember.role) {
        throw new Error('Unauthorized: Only Admin can change roles.');
      }
    }

    if (updates.role && updates.role !== oldMember.role && actorRole !== 'ADMIN') {
      throw new Error('Unauthorized: Only Admin can change member roles.');
    }

    const updated: CommitteeMember = { ...oldMember, ...updates };
    if (updates.role) {
      updated.role_kn = updates.role === 'ADMIN' ? 'ಅಡ್ಮಿನ್ (ಮುಖ್ಯಸ್ಥರು)' : updates.role === 'VICE_ADMIN' ? 'ಉಪ ಅಡ್ಮಿನ್' : 'ಸದಸ್ಯರು';
    }

    this.committeeMembers[idx] = updated;
    this.saveCollection('committee_members', [...this.committeeMembers]);

    await this.addAuditLog({
      action: 'UPDATE_MEMBER',
      action_kn: 'ಸದಸ್ಯರ ವಿವರ ನವೀಕರಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      target_id: id,
      target_type: 'MEMBER',
      previous_value: oldMember.role !== updated.role ? `Role: ${oldMember.role}` : `${oldMember.name}`,
      new_value: oldMember.role !== updated.role ? `Role: ${updated.role}` : `${updated.name}`,
      details: updates.role ? `Changed role from ${oldMember.role} to ${updated.role}` : undefined
    });

    await this.notifyCommitteeUpdate(
      `Member Updated: ${updated.name}`,
      `ಸದಸ್ಯರ ವಿವರ ನವೀಕರಣ: ${updated.name}`,
      `${actorName} (${actorRole}) updated details for ${updated.name} (${updated.role}).`,
      `${actorName} (${actorRole}) ${updated.name} ಅವರ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿದ್ದಾರೆ (${updated.role_kn || updated.role}).`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_members', id), cleanFirestoreData(updated), { merge: true }).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_members', item: updated });
    return updated;
  }

  public async notifyCommitteeUpdate(
    titleEn: string,
    titleKn: string,
    messageEn: string,
    messageKn: string
  ): Promise<void> {
    try {
      await this.addNotification({
        user_id: 'ALL',
        title_en: `🏛️ MTG Committee: ${titleEn}`,
        title_kn: `🏛️ ಎಂಟಿಜಿ ಸಮಿತಿ: ${titleKn}`,
        message_en: messageEn,
        message_kn: messageKn,
        type: 'ADMIN',
        link_tab: 'committee'
      });
    } catch (e) {
      console.warn('Failed to broadcast committee notification:', e);
    }
  }

  public async toggleMemberStatus(id: string, actorId: string, actorName: string, actorRole: CommitteeRole = 'ADMIN'): Promise<boolean> {
    if (actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin or Vice Admin can deactivate or activate members.');
    }
    const member = this.committeeMembers.find((m) => m.id === id);
    if (!member) return false;
    if (member.role === 'ADMIN') {
      if (actorRole === 'VICE_ADMIN') {
        throw new Error('Unauthorized: Vice Admin cannot modify Admin status.');
      }
      const activeAdmins = this.committeeMembers.filter(m => m.role === 'ADMIN' && m.status === 'ACTIVE');
      if (activeAdmins.length <= 1 && member.status === 'ACTIVE') {
        throw new Error('Cannot deactivate the sole Admin.');
      }
    }
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.updateCommitteeMember(id, { status: newStatus }, actorId, actorName, actorRole);
    return true;
  }

  public async deleteCommitteeMember(id: string, actorId: string, actorName: string, actorRole: CommitteeRole = 'ADMIN'): Promise<boolean> {
    if (actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin or Vice Admin can remove members.');
    }
    const member = this.committeeMembers.find((m) => m.id === id);
    if (!member) return false;
    if (member.role === 'ADMIN') {
      throw new Error('Cannot delete the main Admin account.');
    }
    this.committeeMembers = this.committeeMembers.filter(m => m.id !== id);
    this.saveCollection('committee_members', this.committeeMembers);

    await this.addAuditLog({
      action: 'REMOVE_MEMBER',
      action_kn: 'ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      target_id: id,
      target_type: 'MEMBER',
      previous_value: `${member.name} (${member.role})`,
      new_value: 'DELETED'
    });

    await this.notifyCommitteeUpdate(
      `Member Removed`,
      `ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ`,
      `${actorName} (${actorRole}) removed member ${member.name} from MTG Committee.`,
      `${actorName} (${actorRole}) ${member.name} ಅವರನ್ನು ಸಮಿತಿಯಿಂದ ತೆಗೆದುಹಾಕಿದ್ದಾರೆ.`
    );

    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, 'committee_members', id)).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_members', item: { id, deleted: true } });
    return true;
  }

  // --- MONTHLY CONTRIBUTIONS ---
  public subscribeCommitteeContributions(callback: (contributions: CommitteeContribution[]) => void): () => void {
    return this.subscribe('committee_contributions', this.committeeContributions, callback);
  }

  public async recordContributionPayment(params: {
    contributionId?: string;
    memberId: string;
    month: string;
    amount: number;
    referenceId?: string;
    receiptUrl?: string;
    notes?: string;
    collectedBy: string;
  }, actorId: string, actorName: string): Promise<CommitteeContribution> {
    const member = this.committeeMembers.find((m) => m.id === params.memberId);
    const memberName = member ? member.name : 'Unknown Member';

    let item: CommitteeContribution;
    if (params.contributionId) {
      const idx = this.committeeContributions.findIndex((c) => c.id === params.contributionId);
      if (idx >= 0) {
        item = {
          ...this.committeeContributions[idx],
          amount_paid: params.amount,
          status: 'PAID',
          payment_date: new Date().toISOString().split('T')[0],
          reference_id: params.referenceId || 'REF-' + Date.now().toString().substring(7),
          receipt_url: params.receiptUrl,
          notes: params.notes,
          collected_by: params.collectedBy
        };
        this.committeeContributions[idx] = item;
      } else {
        item = this.createContributionRecord(params, memberName);
        this.committeeContributions.push(item);
      }
    } else {
      const existing = this.committeeContributions.find((c) => c.member_id === params.memberId && c.month === params.month);
      if (existing) {
        existing.amount_paid = params.amount;
        existing.status = 'PAID';
        existing.payment_date = new Date().toISOString().split('T')[0];
        existing.reference_id = params.referenceId || 'REF-' + Date.now().toString().substring(7);
        existing.receipt_url = params.receiptUrl;
        existing.notes = params.notes;
        existing.collected_by = params.collectedBy;
        item = existing;
      } else {
        item = this.createContributionRecord(params, memberName);
        this.committeeContributions.push(item);
      }
    }

    // Update member's total contribution
    if (member) {
      member.total_contributed = (member.total_contributed || 0) + params.amount;
      this.saveCollection('committee_members', [...this.committeeMembers]);
    }

    this.saveCollection('committee_contributions', [...this.committeeContributions]);

    // Record Transaction
    await this.addTransaction({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      member_id: params.memberId,
      member_name: memberName,
      type: 'FUND_CONTRIBUTION',
      type_kn: 'ಮಾಸಿಕ ನಿಧಿ ಪಾವತಿ',
      amount: params.amount,
      direction: 'IN',
      description: `Monthly fund contribution for ${params.month} by ${memberName}`,
      reference_id: params.referenceId || item.reference_id,
      receipt_url: params.receiptUrl,
      created_by: actorName,
      status: 'COMPLETED'
    });

    await this.addAuditLog({
      action: 'RECORD_CONTRIBUTION',
      action_kn: 'ಮಾಸಿಕ ನಿಧಿ ಪಾವತಿ ದಾಖಲಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      target_id: item.id,
      target_type: 'CONTRIBUTION',
      new_value: `₹${params.amount} by ${memberName} for ${params.month}`
    });

    await this.notifyCommitteeUpdate(
      `Fund Payment Recorded: ₹${params.amount}`,
      `ವಂತಿಗೆ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ: ₹${params.amount}`,
      `${actorName} recorded ₹${params.amount} contribution from ${memberName} for ${params.month}.`,
      `${actorName} ${memberName} ಅವರಿಂದ ${params.month} ತಿಂಗಳ ₹${params.amount} ವಂತಿಗೆ ದಾಖಲಿಸಿದ್ದಾರೆ.`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_contributions', item.id), cleanFirestoreData(item)).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_contributions', item });
    return item;
  }

  public async updateCommitteeContribution(
    id: string,
    updates: Partial<CommitteeContribution>,
    actorId: string,
    actorName: string,
    actorRole: CommitteeRole = 'ADMIN'
  ): Promise<CommitteeContribution> {
    if (actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin and Vice Admin can update contributions.');
    }
    const idx = this.committeeContributions.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Contribution not found');
    const oldContrib = this.committeeContributions[idx];
    const updated: CommitteeContribution = { ...oldContrib, ...updates };

    const diff = (updated.amount_paid || 0) - (oldContrib.amount_paid || 0);
    if (diff !== 0) {
      const member = this.committeeMembers.find((m) => m.id === updated.member_id);
      if (member) {
        member.total_contributed = Math.max(0, (member.total_contributed || 0) + diff);
        this.saveCollection('committee_members', [...this.committeeMembers]);
      }
    }

    this.committeeContributions[idx] = updated;
    this.saveCollection('committee_contributions', [...this.committeeContributions]);

    await this.addAuditLog({
      action: 'UPDATE_CONTRIBUTION',
      action_kn: 'ಮಾಸಿಕ ನಿಧಿ ವಿವರ ನವೀಕರಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      target_id: id,
      target_type: 'CONTRIBUTION',
      previous_value: `₹${oldContrib.amount_paid} (${oldContrib.status})`,
      new_value: `₹${updated.amount_paid} (${updated.status})`,
      details: `Updated by ${actorName} (${actorRole})`
    });

    await this.notifyCommitteeUpdate(
      `Fund Contribution Updated`,
      `ಮಾಸಿಕ ವಂತಿಗೆ ನವೀಕರಿಸಲಾಗಿದೆ`,
      `${actorName} (${actorRole}) updated contribution for ${updated.member_name} (${updated.month}): ₹${updated.amount_paid} (${updated.status}).`,
      `${actorName} (${actorRole}) ${updated.member_name} ರ ${updated.month} ತಿಂಗಳ ವಂತಿಕೆಯನ್ನು ನವೀಕರಿಸಿದ್ದಾರೆ: ₹${updated.amount_paid}.`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_contributions', id), cleanFirestoreData(updated), { merge: true }).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_contributions', item: updated });
    return updated;
  }

  private createContributionRecord(params: {
    memberId: string;
    month: string;
    amount: number;
    referenceId?: string;
    receiptUrl?: string;
    notes?: string;
    collectedBy: string;
  }, memberName: string): CommitteeContribution {
    return {
      id: 'cnt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      member_id: params.memberId,
      member_name: memberName,
      month: params.month,
      month_label_en: params.month,
      month_label_kn: params.month,
      expected_amount: 1000,
      amount_paid: params.amount,
      status: 'PAID',
      payment_date: new Date().toISOString().split('T')[0],
      reference_id: params.referenceId || 'REF-' + Date.now().toString().substring(7),
      receipt_url: params.receiptUrl,
      notes: params.notes,
      collected_by: params.collectedBy,
      created_at: new Date().toISOString()
    };
  }

  // --- LOANS ---
  public subscribeCommitteeLoans(callback: (loans: CommitteeLoan[]) => void): () => void {
    return this.subscribe('committee_loans', this.committeeLoans, callback);
  }

  public async createLoan(params: {
    memberId: string;
    principalAmount: number;
    interestRatePercent: number; // e.g. 2 for 2% monthly
    interestType?: 'SIMPLE_MONTHLY' | 'FLAT_YEARLY';
    tenureMonths: number;
    purpose?: string;
  }, actorId: string, actorName: string): Promise<CommitteeLoan> {
    const member = this.committeeMembers.find((m) => m.id === params.memberId);
    if (!member) throw new Error('Member not found');

    const totalInterest = Math.round(params.principalAmount * (params.interestRatePercent / 100) * params.tenureMonths);
    const totalPayable = params.principalAmount + totalInterest;
    const monthlyDue = Math.round(totalPayable / params.tenureMonths);

    const loanDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + params.tenureMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newLoan: CommitteeLoan = {
      id: 'loan_' + Date.now(),
      loan_number: 'LN-' + new Date().getFullYear() + '-' + String(this.committeeLoans.length + 1).padStart(3, '0'),
      member_id: params.memberId,
      member_name: member.name,
      principal_amount: params.principalAmount,
      loan_date: loanDate,
      interest_rate_percent: params.interestRatePercent,
      interest_type: params.interestType || 'SIMPLE_MONTHLY',
      tenure_months: params.tenureMonths,
      monthly_due_amount: monthlyDue,
      due_date: dueDate,
      total_interest_payable: totalInterest,
      total_amount_payable: totalPayable,
      amount_paid: 0,
      remaining_principal: params.principalAmount,
      remaining_interest: totalInterest,
      status: 'ACTIVE',
      purpose: params.purpose || 'Agricultural / Household Development',
      repayments: [],
      created_at: new Date().toISOString()
    };

    member.active_loans_count = (member.active_loans_count || 0) + 1;
    member.outstanding_loan_balance = (member.outstanding_loan_balance || 0) + totalPayable;
    this.saveCollection('committee_members', [...this.committeeMembers]);

    this.committeeLoans = [newLoan, ...this.committeeLoans];
    this.saveCollection('committee_loans', this.committeeLoans);

    // Record Transaction (LOAN_ISSUED)
    await this.addTransaction({
      date: loanDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      member_id: member.id,
      member_name: member.name,
      type: 'LOAN_ISSUED',
      type_kn: 'ಸಾಲ ಮಂಜೂರು',
      amount: params.principalAmount,
      direction: 'OUT',
      description: `Loan ${newLoan.loan_number} issued to ${member.name} for ${newLoan.purpose}`,
      reference_id: newLoan.loan_number,
      created_by: actorName,
      status: 'COMPLETED'
    });

    await this.addAuditLog({
      action: 'CREATE_LOAN',
      action_kn: 'ಹೊಸ ಸಾಲ ನೀಡಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      target_id: newLoan.id,
      target_type: 'LOAN',
      new_value: `${newLoan.loan_number} - ₹${params.principalAmount} to ${member.name}`
    });

    await this.notifyCommitteeUpdate(
      `New Loan Issued: ₹${params.principalAmount}`,
      `ಹೊಸ ಸಾಲ ನೀಡಲಾಗಿದೆ: ₹${params.principalAmount}`,
      `${actorName} approved & issued loan of ₹${params.principalAmount} (${newLoan.loan_number}) to ${member.name}.`,
      `${actorName} ${member.name} ಅವರಿಗೆ ₹${params.principalAmount} ಸಾಲ (${newLoan.loan_number}) ಮಂಜೂರು ಮಾಡಿದ್ದಾರೆ.`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_loans', newLoan.id), cleanFirestoreData(newLoan)).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_loans', item: newLoan });
    return newLoan;
  }

  public async updateCommitteeLoan(
    id: string,
    updates: Partial<CommitteeLoan>,
    actorId: string,
    actorName: string,
    actorRole: CommitteeRole = 'ADMIN'
  ): Promise<CommitteeLoan> {
    if (actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin and Vice Admin can update loans.');
    }
    const idx = this.committeeLoans.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Loan not found');
    const oldLoan = this.committeeLoans[idx];
    const updated: CommitteeLoan = { ...oldLoan, ...updates };

    const member = this.committeeMembers.find((m) => m.id === updated.member_id);
    if (member) {
      const allMemberLoans = this.committeeLoans.map((l) => (l.id === id ? updated : l)).filter((l) => l.member_id === member.id);
      member.active_loans_count = allMemberLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'PARTIALLY_PAID').length;
      member.outstanding_loan_balance = allMemberLoans.reduce((sum, l) => sum + (l.remaining_principal || 0) + (l.remaining_interest || 0), 0);
      this.saveCollection('committee_members', [...this.committeeMembers]);
    }

    this.committeeLoans[idx] = updated;
    this.saveCollection('committee_loans', [...this.committeeLoans]);

    await this.addAuditLog({
      action: 'UPDATE_LOAN',
      action_kn: 'ಸಾಲದ ವಿವರ ನವೀಕರಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      target_id: id,
      target_type: 'LOAN',
      previous_value: `${oldLoan.loan_number}: Principal ₹${oldLoan.principal_amount}, Status: ${oldLoan.status}`,
      new_value: `${updated.loan_number}: Principal ₹${updated.principal_amount}, Status: ${updated.status}`,
      details: `Updated by ${actorName} (${actorRole})`
    });

    await this.notifyCommitteeUpdate(
      `Loan ${updated.loan_number} Updated`,
      `ಸಾಲ ${updated.loan_number} ನವೀಕರಿಸಲಾಗಿದೆ`,
      `${actorName} (${actorRole}) updated loan details for ${updated.member_name} (${updated.loan_number}). Status: ${updated.status}.`,
      `${actorName} (${actorRole}) ${updated.member_name} ರ ಸಾಲದ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿದ್ದಾರೆ (${updated.loan_number}). ಸ್ಥಿತಿ: ${updated.status}.`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_loans', id), cleanFirestoreData(updated), { merge: true }).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_loans', item: updated });
    return updated;
  }

  public async recordLoanRepayment(params: {
    loanId: string;
    amount: number;
    principalPortion?: number;
    interestPortion?: number;
    referenceId?: string;
    receiptUrl?: string;
    notes?: string;
    receivedBy: string;
  }, actorId: string, actorName: string): Promise<LoanRepayment> {
    const loan = this.committeeLoans.find((l) => l.id === params.loanId);
    if (!loan) throw new Error('Loan not found');

    const member = this.committeeMembers.find((m) => m.id === loan.member_id);

    // Calculate portion split if not explicitly provided
    let principalPortion = params.principalPortion;
    let interestPortion = params.interestPortion;
    if (principalPortion === undefined || interestPortion === undefined) {
      const remainingInt = loan.remaining_interest || 0;
      if (params.amount <= remainingInt) {
        interestPortion = params.amount;
        principalPortion = 0;
      } else {
        interestPortion = remainingInt;
        principalPortion = params.amount - remainingInt;
      }
    }

    const repayment: LoanRepayment = {
      id: 'rep_' + Date.now(),
      loan_id: loan.id,
      member_id: loan.member_id,
      member_name: loan.member_name,
      amount: params.amount,
      principal_portion: principalPortion,
      interest_portion: interestPortion,
      payment_date: new Date().toISOString().split('T')[0],
      reference_id: params.referenceId || 'REP-' + Date.now().toString().substring(7),
      receipt_url: params.receiptUrl,
      received_by: params.receivedBy,
      notes: params.notes,
      created_at: new Date().toISOString()
    };

    loan.repayments = [...(loan.repayments || []), repayment];
    loan.amount_paid += params.amount;
    loan.remaining_principal = Math.max(0, loan.remaining_principal - principalPortion);
    loan.remaining_interest = Math.max(0, loan.remaining_interest - interestPortion);

    if (loan.remaining_principal === 0 && loan.remaining_interest === 0) {
      loan.status = 'FULLY_PAID';
      if (member) {
        member.active_loans_count = Math.max(0, (member.active_loans_count || 1) - 1);
      }
    } else {
      loan.status = 'PARTIALLY_PAID';
    }

    if (member) {
      member.outstanding_loan_balance = Math.max(0, (member.outstanding_loan_balance || 0) - params.amount);
      this.saveCollection('committee_members', [...this.committeeMembers]);
    }

    this.saveCollection('committee_loans', [...this.committeeLoans]);

    // Record Transactions
    if (principalPortion > 0) {
      await this.addTransaction({
        date: repayment.payment_date,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        member_id: loan.member_id,
        member_name: loan.member_name,
        type: 'LOAN_REPAYMENT',
        type_kn: 'ಸಾಲ ಅಸಲು ಮರುಪಾವತಿ',
        amount: principalPortion,
        direction: 'IN',
        description: `Principal repayment on ${loan.loan_number} by ${loan.member_name}`,
        reference_id: repayment.reference_id,
        receipt_url: params.receiptUrl,
        created_by: actorName,
        status: 'COMPLETED'
      });
    }

    if (interestPortion > 0) {
      await this.addTransaction({
        date: repayment.payment_date,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        member_id: loan.member_id,
        member_name: loan.member_name,
        type: 'INTEREST_PAYMENT',
        type_kn: 'ಸಾಲ ಬಡ್ಡಿ ಸಂಗ್ರಹ',
        amount: interestPortion,
        direction: 'IN',
        description: `Interest collection on ${loan.loan_number} by ${loan.member_name}`,
        reference_id: repayment.reference_id + '-INT',
        receipt_url: params.receiptUrl,
        created_by: actorName,
        status: 'COMPLETED'
      });
    }

    await this.addAuditLog({
      action: 'RECORD_REPAYMENT',
      action_kn: 'ಸಾಲ ಮರುಪಾವತಿ ದಾಖಲಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      target_id: loan.id,
      target_type: 'LOAN',
      new_value: `₹${params.amount} on ${loan.loan_number} (Status: ${loan.status})`
    });

    await this.notifyCommitteeUpdate(
      `Loan Repayment: ₹${params.amount}`,
      `ಸಾಲ ಮರುಪಾವತಿ: ₹${params.amount}`,
      `${actorName} recorded repayment of ₹${params.amount} on ${loan.loan_number} (${loan.member_name}). Remaining: ₹${loan.remaining_principal + loan.remaining_interest}.`,
      `${actorName} ${loan.loan_number} ಸಾಲಕ್ಕೆ ₹${params.amount} ಮರುಪಾವತಿ ದಾಖಲಿಸಿದ್ದಾರೆ (${loan.member_name}). ಬಾಕಿ: ₹${loan.remaining_principal + loan.remaining_interest}.`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_loans', loan.id), cleanFirestoreData(loan), { merge: true }).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_loans', item: loan });
    return repayment;
  }

  // --- EXPENSES ---
  public subscribeCommitteeExpenses(callback: (expenses: CommitteeExpense[]) => void): () => void {
    return this.subscribe('committee_expenses', this.committeeExpenses, callback);
  }

  public async addExpense(
    expense: Omit<CommitteeExpense, 'id' | 'created_at'>,
    actorId: string,
    actorName: string
  ): Promise<CommitteeExpense> {
    const newExpense: CommitteeExpense = {
      ...expense,
      id: 'exp_' + Date.now(),
      created_at: new Date().toISOString()
    };

    this.committeeExpenses = [newExpense, ...this.committeeExpenses];
    this.saveCollection('committee_expenses', this.committeeExpenses);

    // Record Transaction
    await this.addTransaction({
      date: newExpense.date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'EXPENSE',
      type_kn: 'ಸಮಿತಿ ವೆಚ್ಚ',
      amount: newExpense.amount,
      direction: 'OUT',
      description: `[${newExpense.category}] ${newExpense.description}`,
      reference_id: newExpense.id,
      receipt_url: newExpense.receipt_url,
      created_by: actorName,
      status: 'COMPLETED'
    });

    await this.addAuditLog({
      action: 'ADD_EXPENSE',
      action_kn: 'ಹೊಸ ವೆಚ್ಚ ದಾಖಲಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      target_id: newExpense.id,
      target_type: 'EXPENSE',
      new_value: `₹${newExpense.amount} for ${newExpense.description}`
    });

    await this.notifyCommitteeUpdate(
      `New Expense: ₹${newExpense.amount}`,
      `ಹೊಸ ಸಮಿತಿ ವೆಚ್ಚ: ₹${newExpense.amount}`,
      `${actorName} recorded committee expense: ₹${newExpense.amount} for ${newExpense.description} (${newExpense.category}).`,
      `${actorName} ₹${newExpense.amount} ಸಮಿತಿ ವೆಚ್ಚವನ್ನು ದಾಖಲಿಸಿದ್ದಾರೆ: ${newExpense.description}.`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_expenses', newExpense.id), cleanFirestoreData(newExpense)).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_expenses', item: newExpense });
    return newExpense;
  }

  public async updateCommitteeExpense(
    id: string,
    updates: Partial<CommitteeExpense>,
    actorId: string,
    actorName: string,
    actorRole: CommitteeRole = 'ADMIN'
  ): Promise<CommitteeExpense> {
    if (actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin and Vice Admin can update expenses.');
    }
    const idx = this.committeeExpenses.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    const oldExpense = this.committeeExpenses[idx];
    const updated: CommitteeExpense = { ...oldExpense, ...updates };

    this.committeeExpenses[idx] = updated;
    this.saveCollection('committee_expenses', [...this.committeeExpenses]);

    // Also update associated transaction if exists
    const txn = this.committeeTransactions.find((t) => t.reference_id === id);
    if (txn) {
      txn.amount = updated.amount;
      txn.description = `[${updated.category}] ${updated.description}`;
      txn.date = updated.date;
      this.saveCollection('committee_transactions', [...this.committeeTransactions]);
    }

    await this.addAuditLog({
      action: 'UPDATE_EXPENSE',
      action_kn: 'ವೆಚ್ಚದ ವಿವರ ನವೀಕರಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      target_id: id,
      target_type: 'EXPENSE',
      previous_value: `₹${oldExpense.amount} - ${oldExpense.description}`,
      new_value: `₹${updated.amount} - ${updated.description}`,
      details: `Updated by ${actorName} (${actorRole})`
    });

    await this.notifyCommitteeUpdate(
      `Expense Updated: ₹${updated.amount}`,
      `ಸಮಿತಿ ವೆಚ್ಚ ನವೀಕರಿಸಲಾಗಿದೆ: ₹${updated.amount}`,
      `${actorName} (${actorRole}) updated expense: ₹${updated.amount} for ${updated.description}.`,
      `${actorName} (${actorRole}) ಸಮಿತಿ ವೆಚ್ಚವನ್ನು ನವೀಕರಿಸಿದ್ದಾರೆ: ₹${updated.amount} (${updated.description}).`
    );

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_expenses', id), cleanFirestoreData(updated), { merge: true }).catch(() => {});
    }

    realtimeSync.broadcast('COMMITTEE_UPDATED', { collectionName: 'committee_expenses', item: updated });
    return updated;
  }

  public async deleteExpense(expenseId: string, actorId: string, actorName: string, actorRole: CommitteeRole = 'ADMIN'): Promise<boolean> {
    if (actorRole !== 'ADMIN' && actorRole !== 'VICE_ADMIN') {
      throw new Error('Unauthorized: Only Admin and Vice Admin can delete expenses.');
    }
    const idx = this.committeeExpenses.findIndex((e) => e.id === expenseId);
    if (idx === -1) return false;
    const target = this.committeeExpenses[idx];
    this.committeeExpenses = this.committeeExpenses.filter((e) => e.id !== expenseId);
    this.saveCollection('committee_expenses', this.committeeExpenses);

    await this.addAuditLog({
      action: 'DELETE_EXPENSE',
      action_kn: 'ವೆಚ್ಚ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ',
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      target_id: expenseId,
      target_type: 'EXPENSE',
      previous_value: `₹${target.amount} - ${target.description}`
    });

    await this.notifyCommitteeUpdate(
      `Expense Removed`,
      `ಸಮಿತಿ ವೆಚ್ಚ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ`,
      `${actorName} (${actorRole}) removed expense of ₹${target.amount} (${target.description}).`,
      `${actorName} (${actorRole}) ₹${target.amount} ವೆಚ್ಚವನ್ನು ರದ್ದುಗೊಳಿಸಿದ್ದಾರೆ (${target.description}).`
    );

    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, 'committee_expenses', expenseId)).catch(() => {});
    }

    return true;
  }

  // --- TRANSACTIONS ---
  public subscribeCommitteeTransactions(callback: (txns: CommitteeTransaction[]) => void): () => void {
    return this.subscribe('committee_transactions', this.committeeTransactions, callback);
  }

  public async addTransaction(txn: Omit<CommitteeTransaction, 'id' | 'created_at'>): Promise<CommitteeTransaction> {
    const newTxn: CommitteeTransaction = {
      ...txn,
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString()
    };

    this.committeeTransactions = [newTxn, ...this.committeeTransactions];
    this.saveCollection('committee_transactions', this.committeeTransactions);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_transactions', newTxn.id), cleanFirestoreData(newTxn)).catch(() => {});
    }

    return newTxn;
  }

  // --- AUDIT LOGS ---
  public subscribeCommitteeAuditLogs(callback: (logs: CommitteeAuditLog[]) => void): () => void {
    return this.subscribe('committee_audit_logs', this.committeeAuditLogs, callback);
  }

  public async addAuditLog(log: Omit<CommitteeAuditLog, 'id' | 'timestamp'>): Promise<CommitteeAuditLog> {
    const newLog: CommitteeAuditLog = {
      ...log,
      id: 'audit_' + Date.now(),
      timestamp: new Date().toISOString()
    };

    this.committeeAuditLogs = [newLog, ...this.committeeAuditLogs];
    this.saveCollection('committee_audit_logs', this.committeeAuditLogs);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'committee_audit_logs', newLog.id), cleanFirestoreData(newLog)).catch(() => {});
    }

    return newLog;
  }
}

export const dbService = new DatabaseService();

