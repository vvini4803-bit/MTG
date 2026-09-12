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
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import {
  savePhotoPermanently,
  saveMultiplePhotosPermanently,
  getAllPermanentPhotos,
  deletePermanentPhoto
} from './persistentPhotoStorage';

export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
  }

  private initLocalData() {
    const savedDemoMode = localStorage.getItem('gramasiri_demo_mode');
    this.isDemoMode = savedDemoMode !== null ? savedDemoMode === 'true' : false;

    // Load local collections (empty by default in clean production mode unless saved or toggled)
    this.news = this.loadCollection('news', this.isDemoMode ? SEED_NEWS : []);
    this.events = this.loadCollection('events', this.isDemoMode ? SEED_EVENTS : []);
    this.tournaments = this.loadCollection('tournaments', this.isDemoMode ? SEED_TOURNAMENTS : []);
    this.crops = this.loadCollection('crops', this.isDemoMode ? SEED_CROPS : []);
    this.temples = this.loadCollection('temples', this.isDemoMode ? SEED_TEMPLES : []);
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
          }
          break;
        }

        case 'EVENT_CREATED': {
          const evt: EventItem = envelope.payload;
          if (!evt || !evt.id) return;
          if (!this.events.some((e) => e.id === evt.id)) {
            this.events = [evt, ...this.events];
            this.saveCollection('events', this.events);
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
          }
          break;
        }

        case 'TEMPLE_ADDED': {
          const t: TempleItem = envelope.payload;
          if (!t || !t.id) return;
          if (!this.temples.some((item) => item.id === t.id)) {
            this.temples = [t, ...this.temples];
            this.saveCollection('temples', this.temples);
          }
          break;
        }

        case 'TOURNAMENT_CREATED': {
          const tourn: Tournament = envelope.payload;
          if (!tourn || !tourn.id) return;
          if (!this.tournaments.some((item) => item.id === tourn.id)) {
            this.tournaments = [tourn, ...this.tournaments];
            this.saveCollection('tournaments', this.tournaments);
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
            }
          }
          break;
        }

        case 'CHAT_MESSAGE': {
          const msg: ChatMessage = envelope.payload;
          if (!msg || !msg.id) return;
          if (!this.messages.some((m) => m.id === msg.id)) {
            this.messages = [...this.messages, msg];
            this.saveCollection('messages', this.messages);

            let conv = this.conversations.find((c) => c.id === msg.conversation_id);
            if (conv) {
              conv.last_message_text = msg.text || (msg.media_url ? '📷 Photo' : '');
              conv.last_message_at = msg.created_at;
              conv.last_sender_id = msg.sender_id;
              conv.updated_at = msg.created_at;
              const recipientId = conv.participants.find((p) => p !== msg.sender_id);
              if (recipientId) {
                if (!conv.unread_counts) conv.unread_counts = {};
                conv.unread_counts[recipientId] = (conv.unread_counts[recipientId] || 0) + 1;
              }
              this.saveCollection('conversations', [...this.conversations]);
            }
            this.emit(`messages_${msg.conversation_id}`, this.messages.filter((m) => m.conversation_id === msg.conversation_id));
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
            if (nChanged) this.saveCollection('news', [...this.news]);
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
  public subscribeNews(callback: (news: NewsItem[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'news'), orderBy('created_at', 'desc'));
        return onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem));
            callback(items.length > 0 ? items : this.news);
          },
          (err) => {
            console.warn('Firestore news listener fallback:', err);
            callback(this.news);
          }
        );
      } catch (err) {
        console.warn('Firestore news listener fallback:', err);
      }
    }
    return this.subscribe('news', this.news, callback);
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

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'news', newItem.id), newItem);
      } catch (e) {
        console.warn('Firestore setDoc failed, saving locally:', e);
      }
    }

    this.news = [newItem, ...this.news];
    this.saveCollection('news', this.news);
    realtimeSync.broadcast('NEWS_CREATED', newItem);
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
        await updateDoc(doc(db, 'news', newsId), {
          verification_status: status,
          verified_by: verifiedByUid,
          verified_by_name: verifiedByName,
          verified_at: target.verified_at,
          official_correction: target.official_correction,
          official_correction_kn: target.official_correction_kn,
          urgent: target.urgent
        });
      } catch (e) {
        console.warn('Firestore verifyDoc error:', e);
      }
    }

    this.saveCollection('news', [...this.news]);
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
        await setDoc(doc(db, 'comments', newComment.id), newComment);
      } catch (e) {
        console.warn('Firestore setDoc failed for comment:', e);
      }
    }

    this.comments = [newComment, ...this.comments];
    this.saveCollection('comments', this.comments);

    // Increment post comment count
    const post = this.news.find((n) => n.id === comment.post_id);
    if (post) {
      post.comments_count += 1;
      this.saveCollection('news', [...this.news]);
      this.emit('news', this.news);
      if (isFirebaseConfigured && db) {
        updateDoc(doc(db, 'news', post.id), { comments_count: post.comments_count }).catch(() => {});
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
        await setDoc(doc(db, 'events', newEvent.id), newEvent);
      } catch (e) {
        console.warn('Firestore setDoc failed for event:', e);
      }
    }

    this.events = [newEvent, ...this.events];
    this.saveCollection('events', this.events);
    realtimeSync.broadcast('EVENT_CREATED', newEvent);
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
    realtimeSync.broadcast('CROP_ADDED', newCrop);
    return newCrop;
  }

  // --- TEMPLES & CULTURE ---
  public subscribeTemples(callback: (temples: TempleItem[]) => void): () => void {
    return this.subscribe('temples', this.temples, callback);
  }

  public async addTemple(temple: Omit<TempleItem, 'id'>): Promise<TempleItem> {
    const newTemple: TempleItem = {
      ...temple,
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
    return newStory;
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
        await setDoc(doc(db, 'gallery', newItem.id), newItem);
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
        await setDoc(doc(db, 'reports', newRep.id), newRep);
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

    return this.subscribe('messages', getFiltered(), () => {
      callback(getFiltered());
    });
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
    realtimeSync.broadcast('CHAT_MESSAGE', newMsg, recipientId);
    this.emit(`messages_${params.conversationId}`, this.messages.filter((m) => m.conversation_id === params.conversationId));

    return newMsg;
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

    if (convUpdated) this.saveCollection('conversations', [...this.conversations]);
    if (msgsUpdated) this.saveCollection('messages', [...this.messages]);
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
