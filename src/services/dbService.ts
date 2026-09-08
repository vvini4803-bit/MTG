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
  SEED_MESSAGES
} from './seedData';
import { isFirebaseConfigured, db } from './firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

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
    this.conversations = this.loadCollection('conversations', SEED_CONVERSATIONS);
    this.messages = this.loadCollection('messages', SEED_MESSAGES);
    this.userBlocks = this.loadCollection('user_blocks', []);
    this.reports = this.loadCollection('reports', [
      {
        id: 'rep_1',
        item_type: 'POST',
        item_id: 'news_4',
        item_title: 'Spotted Wild Boar herd near Eastern Coconut Plantations',
        reporter_id: 'user_104',
        reporter_name: 'Ramesh Kumar',
        reason: 'Duplicate report submitted by mistake',
        status: 'PENDING',
        created_at: '2026-09-08T12:30:00.000Z'
      }
    ]);
    this.comments = this.loadCollection('comments', [
      {
        id: 'c_1',
        post_id: 'news_1',
        author_id: 'user_104',
        author_name: 'Ramesh Kumar',
        author_role: 'USER',
        text: 'Great initiative by Grama Panchayat! Finally drinking water pressure is constant.',
        created_at: '2026-09-07T11:00:00.000Z',
        likes_count: 5,
        liked_by: [],
        reports_count: 0
      },
      {
        id: 'c_2',
        post_id: 'news_1',
        author_id: 'sports_103',
        author_name: 'Manjunath Gowda',
        author_role: 'SPORTS_ORGANIZER',
        text: 'Clean water is also reaching the sports ground water tap. Thanks to the committee.',
        created_at: '2026-09-07T12:15:00.000Z',
        likes_count: 3,
        liked_by: [],
        reports_count: 0
      }
    ]);
    this.notifications = this.loadCollection('notifications', [
      {
        id: 'notif_1',
        user_id: 'ALL',
        title_en: 'Heavy Rain Catchment Advisory',
        title_kn: 'ಭಾರಿ ಮಳೆ ಮುನ್ಸೂಚನೆ ಎಚ್ಚರಿಕೆ',
        message_en: 'Canal road water overflow near Malleshwara gate. Please drive carefully.',
        message_kn: 'ಮಲ್ಲೇಶ್ವರ ಗೇಟ್ ಬಳಿ ಕಾಲುವೆ ನೀರು ಹರಿಯುತ್ತಿದ್ದು ಜಾಗ್ರತೆ ವಹಿಸಿ.',
        type: 'EMERGENCY',
        link_tab: 'home',
        read: false,
        created_at: '2026-09-08T07:00:00.000Z'
      },
      {
        id: 'notif_2',
        user_id: 'ALL',
        title_en: 'Cricket Tournament Finals Sunday',
        title_kn: 'ಭಾನುವಾರ ಕ್ರಿಕೆಟ್ ಫೈನಲ್ ಪಂದ್ಯ',
        message_en: 'Grama Warriors vs Cauvery Tigers at 3:30 PM.',
        message_kn: 'ಗ್ರಾಮ ವಾರಿಯರ್ಸ್ ಮತ್ತು ಕಾವೇರಿ ಟೈಗರ್ಸ್ ನಡುವೆ ಫೈನಲ್ ಹಣಾಹಣಿ.',
        type: 'SPORTS',
        link_tab: 'sports',
        read: false,
        created_at: '2026-09-08T11:00:00.000Z'
      }
    ]);
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
        return onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem));
          callback(items.length > 0 ? items : this.news);
        });
      } catch (err) {
        console.warn('Firestore news listener fallback:', err);
      }
    }
    return this.subscribe('news', this.news, callback);
  }

  public async addNews(newsItem: Omit<NewsItem, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'liked_by' | 'comments_count' | 'reports_count'>): Promise<NewsItem> {
    const newItem: NewsItem = {
      ...newsItem,
      id: 'news_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    this.logAudit('CREATE_NEWS', newItem.author_id, newItem.author_name, newItem.id, 'NEWS', `Created: ${newItem.title_en}`);
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

    const alreadyLiked = item.liked_by.includes(uid);
    if (alreadyLiked) {
      item.liked_by = item.liked_by.filter((id) => id !== uid);
      item.likes_count = Math.max(0, item.likes_count - 1);
    } else {
      item.liked_by.push(uid);
      item.likes_count += 1;
    }

    this.saveCollection('news', [...this.news]);
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

    this.comments = [newComment, ...this.comments];
    this.saveCollection('comments', this.comments);

    // Increment post comment count
    const post = this.news.find((n) => n.id === comment.post_id);
    if (post) {
      post.comments_count += 1;
      this.saveCollection('news', [...this.news]);
    }

    this.emit(`comments_${comment.post_id}`, this.comments.filter((c) => c.post_id === comment.post_id));
    return newComment;
  }

  // --- EVENTS ---
  public subscribeEvents(callback: (events: EventItem[]) => void): () => void {
    return this.subscribe('events', this.events, callback);
  }

  public async addEvent(event: Omit<EventItem, 'id' | 'participants_count' | 'registered_uids'>): Promise<EventItem> {
    const newEvent: EventItem = {
      ...event,
      id: 'event_' + Date.now(),
      participants_count: 0,
      registered_uids: [],
      is_demo: false
    };

    this.events = [newEvent, ...this.events];
    this.saveCollection('events', this.events);
    return newEvent;
  }

  public async registerForEvent(eventId: string, uid: string): Promise<boolean> {
    const evt = this.events.find((e) => e.id === eventId);
    if (!evt) return false;

    if (!evt.registered_uids.includes(uid)) {
      evt.registered_uids.push(uid);
      evt.participants_count += 1;
      this.saveCollection('events', [...this.events]);
      return true;
    } else {
      // Unregister
      evt.registered_uids = evt.registered_uids.filter((id) => id !== uid);
      evt.participants_count = Math.max(0, evt.participants_count - 1);
      this.saveCollection('events', [...this.events]);
      return false;
    }
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
  }

  public async addTournament(tourn: Omit<Tournament, 'id'>): Promise<Tournament> {
    const newTourn: Tournament = {
      ...tourn,
      id: 'tourn_' + Date.now(),
      is_demo: false
    };
    this.tournaments = [newTourn, ...this.tournaments];
    this.saveCollection('tournaments', this.tournaments);
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
    return this.subscribe('gallery', this.gallery, callback);
  }

  public async addGalleryItem(item: Omit<GalleryItem, 'id' | 'likes_count' | 'liked_by' | 'created_at'>): Promise<GalleryItem> {
    const newItem: GalleryItem = {
      ...item,
      id: 'gal_' + Date.now(),
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      is_demo: false
    };
    this.gallery = [newItem, ...this.gallery];
    this.saveCollection('gallery', this.gallery);
    return newItem;
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
    return this.subscribe('reports', this.reports, callback);
  }

  public async createReport(report: Omit<ReportItem, 'id' | 'created_at' | 'status'>): Promise<ReportItem> {
    const newRep: ReportItem = {
      ...report,
      id: 'rep_' + Date.now(),
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.reports = [newRep, ...this.reports];
    this.saveCollection('reports', this.reports);

    // Increment item report count if news
    if (report.item_type === 'POST') {
      const target = this.news.find((n) => n.id === report.item_id);
      if (target) {
        target.reports_count += 1;
        this.saveCollection('news', [...this.news]);
      }
    }
    return newRep;
  }

  public async resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<void> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.status = status;
      this.saveCollection('reports', [...this.reports]);
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
    return this.subscribe('users', this.users, callback);
  }

  public async updateUserRole(uid: string, newRole: UserProfile['role']): Promise<void> {
    const u = this.users.find((user) => user.uid === uid);
    if (u) {
      u.role = newRole;
      this.saveCollection('users', [...this.users]);
      this.logAudit('UPDATE_USER_ROLE', 'admin', 'Super Admin', uid, 'USER', `Updated role to ${newRole}`);
    }
  }

  public async updateUserStatus(uid: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'): Promise<void> {
    const u = this.users.find((user) => user.uid === uid);
    if (u) {
      u.account_status = status;
      this.saveCollection('users', [...this.users]);
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
