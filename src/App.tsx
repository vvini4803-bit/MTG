import React, { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { dbService } from './services/dbService';
import { NewsItem, EventItem, Tournament, MatchItem, CropItem, TempleItem, GalleryItem, EmergencyAlert } from './types';

// Layout & Hero
import { VillageHero } from './components/home/VillageHero';
import { ShareUpdateModal } from './components/news/ShareUpdateModal';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';

// Views for the 8 Pillars + Ask Village + Map + Profile
import { NewsFeedScreen } from './views/NewsFeedScreen';
import { EventsScreen } from './views/EventsScreen';
import { SportsScreen } from './views/SportsScreen';
import { AgricultureScreen } from './views/AgricultureScreen';
import { TemplesScreen } from './views/TemplesScreen';
import { GalleryScreen } from './views/GalleryScreen';
import { VillageMapView } from './views/VillageMapView';
import { VoiceAssistantScreen } from './views/VoiceAssistantScreen';
import { UserProfileScreen } from './views/UserProfileScreen';
import { AdminDashboardScreen } from './views/AdminDashboardScreen';
import { SearchScreen } from './views/SearchScreen';
import { NotificationsScreen } from './views/NotificationsScreen';

// Modals
import { NewsDetailModal } from './views/NewsDetailModal';
import { CommentsModal } from './views/CommentsModal';
import { EventDetailModal } from './views/EventDetailModal';
import { TournamentDetailModal } from './views/TournamentDetailModal';
import { LiveScoreModal } from './views/LiveScoreModal';
import { CropDetailModal } from './views/CropDetailModal';
import { TempleDetailModal } from './views/TempleDetailModal';
import { GalleryDetailModal } from './views/GalleryDetailModal';
import { SubmitReportModal } from './views/SubmitReportModal';
import { CommunityPeopleView } from './views/CommunityPeopleView';
import { ConversationsListView } from './views/ConversationsListView';
import { ChatModal } from './components/chat/ChatModal';
import { AuthModal } from './components/auth/AuthModal';

// Icons
import {
  Home,
  Newspaper,
  Calendar,
  Trophy,
  Wheat,
  Landmark,
  Camera,
  MapPin,
  Mic,
  User,
  Radio,
  Clock,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
  Users,
  Search as SearchIcon,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';

export type MainSection =
  | 'home'
  | 'news'
  | 'events'
  | 'sports'
  | 'agriculture'
  | 'temples'
  | 'photos'
  | 'map'
  | 'ask'
  | 'people'
  | 'messages'
  | 'profile'
  | 'admin'
  | 'search'
  | 'notifications';

export const App: React.FC = () => {
  const { language, setLanguage, isKannada } = useLanguage();
  const { currentUser, role, isAdmin, isModerator } = useAuth();

  // Active Main Navigation Section
  const [currentSection, setCurrentSection] = useState<MainSection>('home');

  // Real-time collections for previews and tickers
  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlert | null>(null);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [villageStats, setVillageStats] = useState(dbService['villageStats']);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [commentsNews, setCommentsNews] = useState<NewsItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [liveScoreTournament, setLiveScoreTournament] = useState<Tournament | null>(null);
  const [liveScoreMatch, setLiveScoreMatch] = useState<MatchItem | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [selectedTemple, setSelectedTemple] = useState<TempleItem | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);
  const [reportState, setReportState] = useState<{
    isOpen: boolean;
    itemType: 'POST' | 'COMMENT' | 'USER' | 'MEDIA';
    itemId: string;
    itemTitle?: string;
  }>({ isOpen: false, itemType: 'POST', itemId: '', itemTitle: '' });

  // Accordion state inside Home for village heritage
  const [openHeritageTab, setOpenHeritageTab] = useState<'NONE' | 'STATS' | 'HISTORY' | 'ACHIEVERS'>('NONE');

  // Private messaging state
  const [unreadMsgCount, setUnreadMsgCount] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatConvId, setActiveChatConvId] = useState<string>('');
  const [activeChatPartner, setActiveChatPartner] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubEmergency = dbService.subscribeEmergencyAlert(setEmergencyAlert);
    const unsubNews = dbService.subscribeNews((items) => setLatestNews(items.slice(0, 3)));
    const unsubEvents = dbService.subscribeEvents((items) => setUpcomingEvents(items.slice(0, 2)));
    const unsubTournaments = dbService.subscribeTournaments((items) => setActiveTournaments(items));
    return () => {
      unsubEmergency();
      unsubNews();
      unsubEvents();
      unsubTournaments();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUnreadMsgCount(0);
      return;
    }
    const unsubUnread = dbService.subscribeUnreadMessagesCount(currentUser.uid, setUnreadMsgCount);
    return () => unsubUnread();
  }, [currentUser]);

  const navigateTo = (section: MainSection) => {
    setCurrentSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'kn' ? 'en' : 'kn');
  };

  // The 8 Main Feature Cards Defined on Home
  const mainCards = [
    {
      id: 'news' as MainSection,
      title_en: 'NEWS',
      title_kn: 'ಗ್ರಾಮ ಸುದ್ದಿ',
      subtitle_en: 'Verified updates & notices',
      subtitle_kn: 'ದೃಢೀಕೃತ ಸುದ್ದಿ & ಪ್ರಕಟಣೆಗಳು',
      icon: '📰',
      color: '#10B981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.08) 100%)'
    },
    {
      id: 'events' as MainSection,
      title_en: 'EVENTS',
      title_kn: 'ಕಾರ್ಯಕ್ರಮಗಳು',
      subtitle_en: 'Festivals, sabhas & programs',
      subtitle_kn: 'ಜಾತ್ರೆ, ಉತ್ಸವ, ಸಭೆ & ದಿನಾಂಕಗಳು',
      icon: '📅',
      color: '#F59E0B',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%)'
    },
    {
      id: 'sports' as MainSection,
      title_en: 'SPORTS',
      title_kn: 'ಕ್ರೀಡೆ & ಟೂರ್ನಮೆಂಟ್',
      subtitle_en: 'Cricket & Kabaddi live scores',
      subtitle_kn: 'ಕ್ರಿಕೆಟ್ & ಕಬಡ್ಡಿ ಲೈವ್ ಸ್ಕೋರ್',
      icon: '🏏',
      color: '#8B5CF6',
      bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(109, 40, 217, 0.08) 100%)'
    },
    {
      id: 'agriculture' as MainSection,
      title_en: 'AGRICULTURE',
      title_kn: 'ಕೃಷಿ ಮಾಹಿತಿ',
      subtitle_en: 'Crops, MSP rates & power schedule',
      subtitle_kn: 'ಬೆಳೆಗಳು, ಧಾರಣೆ & ವಿದ್ಯುತ್ ವೇಳಾಪಟ್ಟಿ',
      icon: '🌾',
      color: '#84CC16',
      bgGradient: 'linear-gradient(135deg, rgba(132, 204, 22, 0.18) 0%, rgba(101, 163, 13, 0.08) 100%)'
    },
    {
      id: 'temples' as MainSection,
      title_en: 'TEMPLES',
      title_kn: 'ದೇವಸ್ಥಾನ & ಸಂಸ್ಕೃತಿ',
      subtitle_en: 'Pooja times & sacred traditions',
      subtitle_kn: 'ಪೂಜಾ ಸಮಯ, ಇತಿಹಾಸ & ಸೇವೆಗಳು',
      icon: '🛕',
      color: '#EC4899',
      bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18) 0%, rgba(190, 24, 93, 0.08) 100%)'
    },
    {
      id: 'photos' as MainSection,
      title_en: 'PHOTOS',
      title_kn: 'ಗ್ರಾಮ ಚಿತ್ರಗಳು',
      subtitle_en: 'Festivals, sports & village views',
      subtitle_kn: 'ಹಬ್ಬಗಳು, ಪ್ರಕೃತಿ & ಹಳೆಯ ಚಿತ್ರಗಳು',
      icon: '📸',
      color: '#06B6D4',
      bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(8, 145, 178, 0.08) 100%)'
    },
    {
      id: 'map' as MainSection,
      title_en: 'VILLAGE MAP',
      title_kn: 'ನಮ್ಮ ಊರಿನ ನಕ್ಷೆ',
      subtitle_en: '3D Village model, landmarks & live GPS navigation',
      subtitle_kn: '3D ಗ್ರಾಮ ಮಾದರಿ, ಪ್ರಮುಖ ಸ್ಥಳಗಳು & ಜಿಪಿಎಸ್ ದಾರಿ',
      icon: '🗺️',
      color: '#3B82F6',
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(29, 78, 216, 0.08) 100%)'
    },
    {
      id: 'ask' as MainSection,
      title_en: 'ASK VILLAGE',
      title_kn: 'ನಮ್ಮ ಊರನ್ನು ಕೇಳಿ',
      subtitle_en: 'AI voice assistant in Kannada/English',
      subtitle_kn: 'ಧ್ವನಿ ಸಹಾಯಕ — ಏನು ಬೇಕಾದರೂ ಕೇಳಿ',
      icon: '🎙️',
      color: '#10B981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(59, 130, 246, 0.14) 100%)'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#070F1E', color: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* 1. TOP STICKY HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(7, 15, 30, 0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 18px'
        }}
      >
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Village Brand */}
          <div
            onClick={() => navigateTo('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              🌾
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {isKannada ? 'ನಮ್ಮ ಮುತ್ತಗುಂಡಿ' : 'Muttagundi'}
              </h1>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
                {isKannada ? 'ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಪೋರ್ಟಲ್' : 'Digital Village Portal'}
              </span>
            </div>
          </div>

          {/* Quick Header Controls: Search + Messages + Voice + Language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search Button */}
            <button
              onClick={() => navigateTo('search')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Search / ಹುಡುಕಿ"
            >
              <SearchIcon size={18} />
            </button>

            {/* 💬 Discrete Messages Button with Live Unread Badge */}
            <button
              onClick={() => navigateTo('messages')}
              style={{
                position: 'relative',
                background: currentSection === 'messages' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                color: currentSection === 'messages' ? '#10B981' : '#CBD5E1',
                border: currentSection === 'messages' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={isKannada ? 'ಸಂದೇಶಗಳು (Messages)' : 'Private Messages'}
            >
              <MessageSquare size={18} />
              {unreadMsgCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #070F1E',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                  }}
                >
                  {unreadMsgCount}
                </span>
              )}
            </button>

            {/* Quick Ask Village Voice Button */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '24px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>🎙️</span>
              <span>{isKannada ? 'ಕೇಳಿ' : 'Ask'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 900,
                cursor: 'pointer'
              }}
              title="Switch Language / ಭಾಷೆ ಬದಲಾಯಿಸಿ"
            >
              {isKannada ? 'English' : 'ಕನ್ನಡ'}
            </button>

            {/* User Profile / Join Village Community Button */}
            {currentUser ? (
              <button
                onClick={() => navigateTo('profile')}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '24px',
                  padding: '4px 12px 4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
                title={isKannada ? 'ನನ್ನ ಪ್ರೊಫೈಲ್' : 'My Profile'}
              >
                <img
                  src={currentUser.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
                }}
              >
                <User size={15} />
                <span>{isKannada ? 'ನೋಂದಣಿ / ಲಾಗಿನ್' : 'Join / Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. EMERGENCY ALERT BANNER (High Priority Broadcast) */}
      {emergencyAlert && emergencyAlert.active && (
        <div
          style={{
            background: 'linear-gradient(90deg, #991B1B 0%, #B91C1C 100%)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderBottom: '2px solid #EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <div>
              <strong style={{ fontSize: '0.92rem', display: 'block' }}>
                {isKannada ? emergencyAlert.title_kn : emergencyAlert.title_en}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#FEE2E2' }}>
                {isKannada ? emergencyAlert.message_kn : emergencyAlert.message_en}
              </span>
            </div>
          </div>

          <a
            href={`tel:${emergencyAlert.contact_info}`}
            style={{
              background: '#FFFFFF',
              color: '#991B1B',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 900,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PhoneCall size={14} />
            <span>{emergencyAlert.contact_info}</span>
          </a>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <main style={{ flex: 1, maxWidth: '1080px', margin: '0 auto', width: '100%', padding: '16px 16px 90px 16px' }}>
        {/* ============================================================ */}
        {/* 🏠 SECTION 1: HOME SCREEN                                    */}
        {/* ============================================================ */}
        {currentSection === 'home' && (
          <div>
            {/* The Animated Village Hero Landscape */}
            <VillageHero />

            {/* 🔴 LIVE VILLAGE UPDATE (One or two real updates) */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                  <span>{isKannada ? 'ಲೈವ್ ಪ್ರಕಟಣೆ' : 'LIVE UPDATE'}</span>
                </div>
                <span style={{ fontSize: '0.88rem', color: '#E2E8F0', fontWeight: 600 }}>
                  {latestNews.length > 0
                    ? (isKannada ? latestNews[0].title_kn : latestNews[0].title_en)
                    : (isKannada ? 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಹೊಸ ಅಪ್‌ಡೇಟ್ ಇಲ್ಲ.' : 'No new updates right now.')}
                </span>
              </div>

              {latestNews.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedNews(latestNews[0]);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#34D399',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{isKannada ? 'ವಿವರ ನೋಡಿ' : 'View Detail'}</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* ⭐ THE 8 MAIN CARDS GRID (Large, Easy to Tap) */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '14px', color: '#FFFFFF' }}>
                {isKannada ? 'ಗ್ರಾಮದ ಮುಖ್ಯ ವಿಭಾಗಗಳು' : 'Village Core Services'}
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px'
                }}
              >
                {mainCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (card.id === 'ask') {
                        setIsVoiceModalOpen(true);
                      } else {
                        navigateTo(card.id);
                      }
                    }}
                    style={{
                      background: card.bgGradient,
                      border: `1px solid ${card.color}33`,
                      borderRadius: '20px',
                      padding: '22px 18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                    }}
                    className="card-3d"
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: `${card.color}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        flexShrink: 0,
                        border: `1px solid ${card.color}44`
                      }}
                    >
                      {card.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 4px 0', color: '#FFFFFF' }}>
                        {isKannada ? card.title_kn : card.title_en}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#CBD5E1', margin: 0, lineHeight: 1.4 }}>
                        {isKannada ? card.subtitle_kn : card.subtitle_en}
                      </p>
                    </div>

                    <ChevronRight size={20} color={card.color} style={{ opacity: 0.8 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* 🔴 LIVE NOW PREVIEW: Match / Program */}
            {activeTournaments.length > 0 && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏏</span>
                    <strong style={{ fontSize: '0.94rem', color: '#FFFFFF' }}>
                      {isKannada ? 'ಕ್ರೀಡಾ ಲೈವ್ ಸ್ಕೋರ್' : 'Live Sports Score'}
                    </strong>
                    <span style={{ background: '#EF4444', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                      LIVE
                    </span>
                  </div>
                  <button
                    onClick={() => navigateTo('sports')}
                    style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {isKannada ? 'ಎಲ್ಲಾ ಪಂದ್ಯಗಳು >' : 'View Tournament >'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
                    Warriors: 142/4 (16.2 ov) vs Strikers
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                    {isKannada ? 'ಗುರಿ: 165 ರನ್ | ಫೈನಲ್ ಭಾನುವಾರ' : 'Target: 165 | Final on Sunday'}
                  </span>
                </div>
              </div>
            )}

            {/* ℹ️ ABOUT OUR VILLAGE, 📖 HISTORY & 🏆 ACHIEVERS (NATURAL ACCORDION ON HOME) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '24px'
              }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 14px 0', color: '#FFFFFF' }}>
                {isKannada ? 'ಗ್ರಾಮದ ಮಾಹಿತಿ & ಇತಿಹಾಸ' : 'Village Heritage & Statistics'}
              </h2>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button
                  onClick={() => setOpenHeritageTab(openHeritageTab === 'STATS' ? 'NONE' : 'STATS')}
                  style={{
                    background: openHeritageTab === 'STATS' ? '#10B981' : 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ℹ️ {isKannada ? 'ಗ್ರಾಮ ಅಂಕಿಅಂಶ' : 'Village Stats'}
                </button>
                <button
                  onClick={() => setOpenHeritageTab(openHeritageTab === 'HISTORY' ? 'NONE' : 'HISTORY')}
                  style={{
                    background: openHeritageTab === 'HISTORY' ? '#10B981' : 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📖 {isKannada ? 'ಇತಿಹಾಸ & ಕಥೆಗಳು' : 'History & Story'}
                </button>
                <button
                  onClick={() => setOpenHeritageTab(openHeritageTab === 'ACHIEVERS' ? 'NONE' : 'ACHIEVERS')}
                  style={{
                    background: openHeritageTab === 'ACHIEVERS' ? '#10B981' : 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🏆 {isKannada ? 'ನಮ್ಮ ಸಾಧಕರು' : 'Our Achievers'}
                </button>
              </div>

              {/* Accordion Content 1: Statistics */}
              {openHeritageTab === 'STATS' && (
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{isKannada ? 'ಒಟ್ಟು ಜನಸಂಖ್ಯೆ' : 'Population'}</span>
                      <strong style={{ fontSize: '1.25rem', color: '#34D399', display: 'block' }}>{villageStats.population.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{isKannada ? 'ಮನೆಗಳು' : 'Households'}</span>
                      <strong style={{ fontSize: '1.25rem', color: '#FBBF24', display: 'block' }}>{villageStats.households}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{isKannada ? 'ಸಾಕ್ಷರತಾ ಪ್ರಮಾಣ' : 'Literacy Rate'}</span>
                      <strong style={{ fontSize: '1.25rem', color: '#60A5FA', display: 'block' }}>{villageStats.literacy_rate}%</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{isKannada ? 'ಕೃಷಿ ಭೂಮಿ' : 'Farming Land'}</span>
                      <strong style={{ fontSize: '1.25rem', color: '#A78BFA', display: 'block' }}>{villageStats.agricultural_land_acres} {isKannada ? 'ಎಕರೆ' : 'Acres'}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#10B981" />
                    <span>{isKannada ? 'ಮೂಲ: ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಧಿಕೃತ ದಾಖಲೆಗಳು • ಕೊನೆಯ ಪರಿಶೀಲನೆ: ಅಕ್ಟೋಬರ್ 2026' : 'Source: Official Panchayat Census • Last verified: Oct 2026'}</span>
                  </div>
                </div>
              )}

              {/* Accordion Content 2: History */}
              {openHeritageTab === 'HISTORY' && (
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '16px', fontSize: '0.88rem', lineHeight: 1.6, color: '#E2E8F0' }}>
                  <strong style={{ color: '#FBBF24', display: 'block', marginBottom: '6px' }}>
                    {isKannada ? 'ಗ್ರಾಮದ ಹಿನ್ನೆಲೆ (ಐತಿಹಾಸಿಕ ವಾಸ್ತವ)' : 'Historical Origins (Verified Facts)'}
                  </strong>
                  <p style={{ margin: '0 0 10px 0' }}>
                    {isKannada
                      ? 'ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ, ಹೊಸದುರ್ಗ ತಾಲೂಕಿನ ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮವು ಕೃಷಿ, ಧಾರ್ಮಿಕ ಪರಂಪರೆ ಮತ್ತು ಬಾಂಧವ್ಯದ ಹೆಮ್ಮೆಯ ಇತಿಹಾಸವನ್ನು ಹೊಂದಿದೆ.'
                      : 'Muttagundi village in Hosadurga Taluk, Chitradurga District is recognized for its agrarian traditions, sacred heritage, and strong community unity.'}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    🟢 MUTTAGUNDI HERITAGE
                  </span>
                </div>
              )}

              {/* Accordion Content 3: Achievers */}
              {openHeritageTab === 'ACHIEVERS' && (
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '16px 12px', color: '#94A3B8', fontSize: '0.86rem' }}>
                    <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>🏅</span>
                    <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '4px' }}>
                      {isKannada ? 'ಗ್ರಾಮದ ಸಾಧಕರ ನಾಮನಿರ್ದೇಶನ' : 'Village Achievers & Pride'}
                    </strong>
                    <span>
                      {isKannada
                        ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಕೃಷಿ, ಕ್ರೀಡೆ ಅಥವಾ ಶಿಕ್ಷಣ ಕ್ಷೇತ್ರದಲ್ಲಿ ಸಾಧನೆ ಮಾಡಿದವರ ವಿವರಗಳನ್ನು ಶೀಘ್ರದಲ್ಲೇ ಇಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗುತ್ತದೆ.'
                        : 'Nominations and profiles of achievers from Muttagundi in agriculture, sports, and education will be listed here.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 📰 SECTION 2: NEWS & SHARE UPDATE                            */}
        {/* ============================================================ */}
        {currentSection === 'news' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {isKannada ? 'ಗ್ರಾಮ ಸುದ್ದಿ & ಪ್ರಕಟಣೆಗಳು' : 'Village News & Announcements'}
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                  {isKannada ? 'ಪರಿಶೀಲಿತ ನೈಜ ಮಾಹಿತಿ ಮಾತ್ರ' : 'Strictly verified community reporting'}
                </span>
              </div>

              {/* ➕ SHARE UPDATE Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                }}
              >
                <span>➕</span>
                <span>{isKannada ? 'ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'SHARE UPDATE'}</span>
              </button>
            </div>

            <NewsFeedScreen
              onOpenCreatePost={() => setIsShareModalOpen(true)}
              onOpenNewsDetail={(news) => setSelectedNews(news)}
              onOpenComments={(news) => setCommentsNews(news)}
              onOpenReportModal={(type, id, title) => setReportState({ isOpen: true, itemType: type, itemId: id, itemTitle: title })}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* 📅 SECTION 3: EVENTS & FESTIVALS                             */}
        {/* ============================================================ */}
        {currentSection === 'events' && (
          <EventsScreen
            onOpenEventDetail={(event) => setSelectedEvent(event)}
            onOpenCreateEvent={() => navigateTo('admin')}
          />
        )}

        {/* ============================================================ */}
        {/* 🏏 SECTION 4: SPORTS                                         */}
        {/* ============================================================ */}
        {currentSection === 'sports' && (
          <SportsScreen
            onOpenTournamentDetail={(tournament) => setSelectedTournament(tournament)}
            onOpenLiveScoreModal={(tournament, match) => {
              setLiveScoreTournament(tournament);
              setLiveScoreMatch(match);
            }}
          />
        )}

        {/* ============================================================ */}
        {/* 🌾 SECTION 5: AGRICULTURE                                    */}
        {/* ============================================================ */}
        {currentSection === 'agriculture' && (
          <AgricultureScreen
            onOpenCropDetail={(crop) => setSelectedCrop(crop)}
            onOpenCreateCrop={() => navigateTo('admin')}
          />
        )}

        {/* ============================================================ */}
        {/* 🛕 SECTION 6: TEMPLES & CULTURE                              */}
        {/* ============================================================ */}
        {currentSection === 'temples' && (
          <TemplesScreen
            onOpenTempleDetail={(temple) => setSelectedTemple(temple)}
            onOpenCreateTemple={() => navigateTo('admin')}
          />
        )}

        {/* ============================================================ */}
        {/* 📸 SECTION 7: PHOTOS & GALLERY                               */}
        {/* ============================================================ */}
        {currentSection === 'photos' && (
          <GalleryScreen
            onOpenGalleryDetail={(item) => setSelectedGallery(item)}
          />
        )}

        {/* ============================================================ */}
        {/* 🗺️ SECTION 8: VILLAGE MAP                                    */}
        {/* ============================================================ */}
        {currentSection === 'map' && (
          <VillageMapView />
        )}

        {/* ============================================================ */}
        {/* 🤖🎙️ SECTION 9: ASK VILLAGE AI                               */}
        {/* ============================================================ */}
        {currentSection === 'ask' && (
          <VoiceAssistantScreen
            onNavigateTab={(tab) => {
              if (tab === 'news') navigateTo('news');
              else if (tab === 'events') navigateTo('events');
              else if (tab === 'sports') navigateTo('sports');
              else if (tab === 'agriculture') navigateTo('agriculture');
              else if (tab === 'temples') navigateTo('temples');
              else navigateTo('home');
            }}
          />
        )}

        {/* ============================================================ */}
        {/* 👥 SECTION: COMMUNITY PEOPLE DIRECTORY                       */}
        {/* ============================================================ */}
        {currentSection === 'people' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ← {isKannada ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to Home'}
              </button>
            </div>
            <CommunityPeopleView
              onOpenLogin={() => setIsAuthModalOpen(true)}
              onOpenChatWithUser={async (user) => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                try {
                  const conv = await dbService.getOrCreateConversation(
                    {
                      uid: currentUser.uid,
                      name: currentUser.name,
                      name_kn: currentUser.name_kn,
                      photoUrl: currentUser.photoUrl,
                      role: currentUser.role
                    },
                    {
                      uid: user.uid,
                      name: user.name,
                      name_kn: user.name_kn,
                      photoUrl: user.photoUrl,
                      role: user.role
                    }
                  );
                  setActiveChatConvId(conv.id);
                  setActiveChatPartner({
                    uid: user.uid,
                    name: user.name,
                    name_kn: user.name_kn,
                    photoUrl: user.photoUrl,
                    role: user.role,
                    community_category: user.community_category
                  });
                  setIsChatOpen(true);
                } catch (err: any) {
                  alert(err.message || 'Cannot start chat');
                }
              }}
              onBack={() => navigateTo('home')}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* 💬 SECTION: PRIVATE CONVERSATIONS LIST                       */}
        {/* ============================================================ */}
        {currentSection === 'messages' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ← {isKannada ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to Home'}
              </button>
            </div>
            <ConversationsListView
              onOpenLogin={() => setIsAuthModalOpen(true)}
              onOpenChat={(convId, partner) => {
                setActiveChatConvId(convId);
                setActiveChatPartner(partner);
                setIsChatOpen(true);
              }}
              onNavigateToPeople={() => navigateTo('people')}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* 👤 SECTION 10: USER PROFILE                                  */}
        {/* ============================================================ */}
        {currentSection === 'profile' && (
          <div>
            <UserProfileScreen
              onOpenLogin={() => setIsAuthModalOpen(true)}
              onOpenCreateProfile={() => setIsAuthModalOpen(true)}
              onNavigateToPeople={() => navigateTo('people')}
              onNavigateToMessages={() => navigateTo('messages')}
            />

            {/* Discrete Admin Dashboard Entry for Authorized Roles */}
            {(isAdmin || isModerator) && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  onClick={() => navigateTo('admin')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #F59E0B',
                    color: '#FBBF24',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🛡️ {isKannada ? 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಡ್ಮಿನ್ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ' : 'Open Panchayat Admin Portal'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 🛡️ SECTION 11: ADMIN PORTAL                                  */}
        {/* ============================================================ */}
        {currentSection === 'admin' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ← {isKannada ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to Home'}
              </button>
            </div>
            <AdminDashboardScreen
              onSelectAdminSubtab={() => {}}
              onNavigateTab={(tab) => {
                if (tab === 'news') navigateTo('news');
                else navigateTo('home');
              }}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* 🔍 SECTION 12: GLOBAL SEARCH                                 */}
        {/* ============================================================ */}
        {currentSection === 'search' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ← {isKannada ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to Home'}
              </button>
            </div>
            <SearchScreen
              onNavigateTab={(tab) => {
                if (tab === 'news') navigateTo('news');
                else if (tab === 'events') navigateTo('events');
                else if (tab === 'sports') navigateTo('sports');
                else if (tab === 'agriculture') navigateTo('agriculture');
                else if (tab === 'temples') navigateTo('temples');
                else navigateTo('home');
              }}
            />
          </div>
        )}
      </main>

      {/* 4. MOBILE BOTTOM 5-TAB NAVIGATION (WhatsApp-Simple) */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'rgba(7, 15, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 4px'
        }}
      >
        {/* Tab 1: Home */}
        <button
          onClick={() => navigateTo('home')}
          style={{
            background: 'none',
            border: 'none',
            color: currentSection === 'home' ? '#10B981' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          <Home size={22} color={currentSection === 'home' ? '#10B981' : '#94A3B8'} />
          <span>{isKannada ? 'ಮುಖಪುಟ' : 'Home'}</span>
        </button>

        {/* Tab 2: News */}
        <button
          onClick={() => navigateTo('news')}
          style={{
            background: 'none',
            border: 'none',
            color: currentSection === 'news' ? '#10B981' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          <Newspaper size={22} color={currentSection === 'news' ? '#10B981' : '#94A3B8'} />
          <span>{isKannada ? 'ಸುದ್ದಿ' : 'News'}</span>
        </button>

        {/* Tab 3: Events */}
        <button
          onClick={() => navigateTo('events')}
          style={{
            background: 'none',
            border: 'none',
            color: currentSection === 'events' ? '#10B981' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          <Calendar size={22} color={currentSection === 'events' ? '#10B981' : '#94A3B8'} />
          <span>{isKannada ? 'ಕಾರ್ಯಕ್ರಮ' : 'Events'}</span>
        </button>

        {/* Tab 4: Ask AI (Special Highlighted Button) */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            marginTop: '-14px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.5)',
            cursor: 'pointer'
          }}
          title="Ask Village / ನಮ್ಮ ಊರನ್ನು ಕೇಳಿ"
        >
          <Mic size={24} />
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => navigateTo('profile')}
          style={{
            background: 'none',
            border: 'none',
            color: currentSection === 'profile' ? '#10B981' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          <User size={22} color={currentSection === 'profile' ? '#10B981' : '#94A3B8'} />
          <span>{isKannada ? 'ಪ್ರೊಫೈಲ್' : 'Profile'}</span>
        </button>
      </nav>

      {/* 🎙️ Global Floating Voice Assistant Trigger (FAB) */}
      {currentSection !== 'ask' && !isVoiceModalOpen && (
        <button
          className="voice-fab"
          onClick={() => setIsVoiceModalOpen(true)}
          title={isKannada ? 'ಗ್ರಾಮ ಧ್ವನಿ ಸಹಾಯಕ (AI Voice Assistant)' : 'Village Voice Assistant (AI)'}
          aria-label="Open Voice Assistant"
        >
          <Mic size={28} />
        </button>
      )}

      {/* 5. MODALS */}
      {/* ➕ Share Update Modal (SPEAK, PHOTO, TYPE) */}
      <ShareUpdateModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onPostSubmitted={() => {
          dbService.subscribeNews((items) => setLatestNews(items.slice(0, 3)));
        }}
      />

      {/* 🎙️ Ask Village Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigateTab={(tab) => {
          setIsVoiceModalOpen(false);
          if (tab === 'news') navigateTo('news');
          else if (tab === 'events') navigateTo('events');
          else if (tab === 'sports') navigateTo('sports');
          else if (tab === 'agriculture') navigateTo('agriculture');
          else if (tab === 'temples') navigateTo('temples');
          else navigateTo('home');
        }}
      />

      {/* News Detail Modal */}
      <NewsDetailModal
        news={selectedNews}
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        onOpenComments={(news) => {
          setSelectedNews(null);
          setCommentsNews(news);
        }}
        onOpenReportModal={(type, id, title) => setReportState({ isOpen: true, itemType: type, itemId: id, itemTitle: title })}
      />

      {/* Comments Modal */}
      <CommentsModal
        news={commentsNews}
        isOpen={!!commentsNews}
        onClose={() => setCommentsNews(null)}
        onOpenReportModal={(type, id, title) => setReportState({ isOpen: true, itemType: type, itemId: id, itemTitle: title })}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Tournament Detail Modal */}
      <TournamentDetailModal
        tournament={selectedTournament}
        isOpen={!!selectedTournament}
        onClose={() => setSelectedTournament(null)}
      />

      {/* Live Score Modal */}
      <LiveScoreModal
        tournament={liveScoreTournament}
        match={liveScoreMatch}
        isOpen={!!liveScoreTournament && !!liveScoreMatch}
        onClose={() => {
          setLiveScoreTournament(null);
          setLiveScoreMatch(null);
        }}
      />

      {/* Crop Detail Modal */}
      <CropDetailModal
        crop={selectedCrop}
        isOpen={!!selectedCrop}
        onClose={() => setSelectedCrop(null)}
      />

      {/* Temple Detail Modal */}
      <TempleDetailModal
        temple={selectedTemple}
        isOpen={!!selectedTemple}
        onClose={() => setSelectedTemple(null)}
      />

      {/* Gallery Detail Modal */}
      <GalleryDetailModal
        item={selectedGallery}
        isOpen={!!selectedGallery}
        onClose={() => setSelectedGallery(null)}
        onOpenReportModal={(type, id, title) => setReportState({ isOpen: true, itemType: type, itemId: id, itemTitle: title })}
      />

      {/* Submit Report Modal */}
      <SubmitReportModal
        isOpen={reportState.isOpen}
        itemType={reportState.itemType}
        itemId={reportState.itemId}
        itemTitle={reportState.itemTitle}
        onClose={() => setReportState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 💬 WhatsApp-Simple Private Chat Modal */}
      {activeChatPartner && (
        <ChatModal
          isOpen={isChatOpen}
          conversationId={activeChatConvId}
          partnerUser={activeChatPartner}
          onClose={() => setIsChatOpen(false)}
          onNavigateToPeople={() => {
            setIsChatOpen(false);
            navigateTo('people');
          }}
        />
      )}

      {/* 🔐 Resident Registration & Sign In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default App;
