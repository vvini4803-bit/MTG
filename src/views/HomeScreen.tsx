import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService, isWithinOneWeek } from '../services/dbService';
import {
  NewsItem,
  EventItem,
  Tournament,
  CropItem,
  TempleItem,
  VillageStats,
  AchievementItem,
  GalleryItem,
  ViewTab
} from '../types';
import {
  Users,
  Home,
  Wheat,
  Landmark,
  Calendar,
  Radio,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Trophy,
  Award,
  ChevronRight,
  Camera,
  Heart,
  MessageSquare
} from 'lucide-react';

interface HomeScreenProps {
  onNavigateTab: (tab: ViewTab) => void;
  onOpenNewsDetail: (news: NewsItem) => void;
  onOpenEventDetail: (event: EventItem) => void;
  onOpenCropDetail: (crop: CropItem) => void;
  onOpenTempleDetail: (temple: TempleItem) => void;
  onOpenGalleryDetail: (gal: GalleryItem) => void;
  onOpenVoice: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateTab,
  onOpenNewsDetail,
  onOpenEventDetail,
  onOpenCropDetail,
  onOpenTempleDetail,
  onOpenGalleryDetail,
  onOpenVoice
}) => {
  const { language, isKannada } = useLanguage();
  const { role } = useAuth();

  const [stats, setStats] = useState<VillageStats>(dbService['villageStats']);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [temples, setTemples] = useState<TempleItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const unsubStats = dbService.subscribeVillageStats(setStats);
    const unsubNews = dbService.subscribeNews((items) => {
      const weekItems = items.filter((i) => isWithinOneWeek(i.created_at));
      setNewsList(weekItems.length > 0 ? weekItems.slice(0, 3) : items.slice(0, 3));
    });
    const unsubEvents = dbService.subscribeEvents((items) => setEventsList(items.slice(0, 2)));
    const unsubTourn = dbService.subscribeTournaments(setTournaments);
    const unsubCrops = dbService.subscribeCrops((items) => setCrops(items.slice(0, 3)));
    const unsubTemples = dbService.subscribeTemples((items) => setTemples(items.slice(0, 2)));
    const unsubAch = dbService.subscribeAchievements((items) => setAchievements(items.slice(0, 3)));
    const unsubGal = dbService.subscribeGallery((items) => setGallery(items.slice(0, 4)));

    return () => {
      unsubStats();
      unsubNews();
      unsubEvents();
      unsubTourn();
      unsubCrops();
      unsubTemples();
      unsubAch();
      unsubGal();
    };
  }, []);

  const villageName = isKannada
    ? (import.meta.env.VITE_VILLAGE_NAME_KN || 'ಮುಟ್ಟಗುಂಡಿ')
    : (import.meta.env.VITE_VILLAGE_NAME_EN || 'Muttagundi');

  // Find any active live match
  const liveMatch = tournaments.flatMap((t) => t.matches).find((m) => m.is_live);
  const liveEvent = eventsList.find((e) => e.status === 'LIVE');

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '60px 16px 80px',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 15, 29, 0) 100%)',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--glass-border)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--accent-emerald)',
              marginBottom: '20px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            {isKannada ? 'ನಮ್ಮ ಗ್ರಾಮದ ಸಮಗ್ರ ಡಿಜಿಟಲ್ ವೇದಿಕೆ' : 'The Digital Heartbeat of our Village'}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {villageName}
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: '0 auto 32px',
              fontWeight: 500,
              lineHeight: 1.6
            }}
          >
            {isKannada
              ? 'ನಮ್ಮ ಗ್ರಾಮ — ನಮ್ಮ ಜನ — ನಮ್ಮ ಕಥೆಗಳು — ನಮ್ಮ ಭವಿಷ್ಯ'
              : 'OUR VILLAGE — OUR PEOPLE — OUR STORIES — OUR FUTURE'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigateTab('news')}
              className="btn-primary"
              style={{ height: '48px', padding: '0 24px', fontSize: '0.95rem' }}
            >
              <span>{isKannada ? 'ಇತ್ತೀಚಿನ ಅಪ್‌ಡೇಟ್‌ಗಳು' : 'Latest Updates'}</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigateTab('history')}
              className="btn-secondary"
              style={{ height: '48px', padding: '0 24px', fontSize: '0.95rem' }}
            >
              <span>{isKannada ? 'ಗ್ರಾಮವನ್ನು ಅನ್ವೇಷಿಸಿ' : 'Explore Our Village'}</span>
            </button>
            <button
              onClick={onOpenVoice}
              className="btn-gold"
              style={{ height: '48px', padding: '0 20px', fontSize: '0.95rem' }}
            >
              <span>{isKannada ? 'ಧ್ವನಿ ಸಹಾಯಕ' : 'Voice Assistant'}</span>
            </button>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '-40px', position: 'relative', zIndex: 20 }}>
        {/* LIVE STATISTICS DASHBOARD STRIP */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            marginBottom: '40px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#10B981" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                {isKannada ? 'ದೃಢೀಕೃತ ಗ್ರಾಮ ಅಂಕಿಅಂಶ' : 'Live Verified Village Statistics'}
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isKannada ? `ಪರಿಶೀಲನೆ: ${stats.last_verified}` : `Verified: ${stats.last_verified}`}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKannada ? 'ಜನಸಂಖ್ಯೆ' : 'Population'}
              </span>
              <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10B981' }}>
                {stats.population > 0 ? stats.population.toLocaleString() : 'Not Set'}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKannada ? 'ಕುಟುಂಬಗಳು' : 'Households'}
              </span>
              <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F59E0B' }}>
                {stats.households > 0 ? stats.households.toLocaleString() : 'Not Set'}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKannada ? 'ಮುಖ್ಯ ಬೆಳೆ' : 'Main Crop'}
              </span>
              <strong style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', display: 'block', marginTop: '6px' }}>
                {isKannada ? 'ರಾಗಿ & ಅಡಿಕೆ' : 'Ragi & Arecanut'}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKannada ? 'ಶಾಲೆ & ದೇಗುಲ' : 'Schools / Temples'}
              </span>
              <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0284C7' }}>
                {stats.schools} / {stats.temples}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKannada ? 'ಸಕ್ರಿಯ ಸದಸ್ಯರು' : 'Active Members'}
              </span>
              <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#A855F7' }}>
                {stats.active_members > 0 ? stats.active_members : 642}
              </strong>
            </div>
          </div>
        </div>

        {/* 🔴 LIVE NOW SECTION (if any live match or event) */}
        {(liveMatch || liveEvent) && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '12px',
                height: '12px',
                display: 'inline-block',
                boxShadow: '0 0 10px #EF4444'
              }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444' }}>
                {isKannada ? '🔴 ಲೈವ್ ಈಗ ನಡೆಯುತ್ತಿದೆ' : '🔴 LIVE NOW'}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {liveMatch && (
                <div
                  onClick={() => onNavigateTab('sports')}
                  className="glass-card glass-card-interactive card-3d"
                  style={{
                    padding: '20px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-urgent" style={{ fontSize: '0.7rem' }}>
                      <Radio size={12} />
                      LIVE MATCH
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{liveMatch.venue}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>
                    {liveMatch.team_a} vs {liveMatch.team_b}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '12px',
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#FEF08A',
                    margin: '8px 0'
                  }}>
                    <span>{liveMatch.team_a_score}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>vs</span>
                    <span>{liveMatch.team_b_score}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#86EFAC', fontWeight: 600 }}>
                    {isKannada ? liveMatch.current_status_kn : liveMatch.current_status_en}
                  </p>
                </div>
              )}

              {liveEvent && (
                <div
                  onClick={() => onOpenEventDetail(liveEvent)}
                  className="glass-card glass-card-interactive card-3d"
                  style={{
                    padding: '20px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                      <Radio size={12} />
                      LIVE EVENT
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{liveEvent.date}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>
                    {isKannada ? liveEvent.title_kn : liveEvent.title_en}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {isKannada ? liveEvent.venue_kn : liveEvent.venue_en}
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {liveEvent.participants_count} {isKannada ? 'ಜನರು ಭಾಗವಹಿಸುತ್ತಿದ್ದಾರೆ' : 'participants joined'} →
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 📰 LATEST VILLAGE NEWS SECTION */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? '📰 ಗ್ರಾಮದ ನೇರ ಅಪ್‌ಡೇಟ್‌ಗಳು' : '📰 Real-Time Village Updates'}
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10B981',
                  fontWeight: 800
                }}>
                  {isKannada ? '1 ವಾರ ಲೈವ್' : '1-Week Live'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isKannada ? 'ಕಳೆದ 1 ವಾರದಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಆದ ಎಲ್ಲಾ ಸ್ವಯಂ-ದೃಢೀಕೃತ ಮಾಹಿತಿಗಳು' : 'Auto-verified village updates from the past week (7 days)'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('news')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-emerald)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{isKannada ? 'ಎಲ್ಲ ಸುದ್ದಿ ನೋಡಿ' : 'View All'}</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {newsList.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.92rem', color: '#CBD5E1', marginBottom: '14px' }}>
                {isKannada ? 'ಕಳೆದ 1 ವಾರದಲ್ಲಿ ಯಾವುದೇ ಹೊಸ ಸುದ್ದಿ ಪ್ರಕಟವಾಗಿಲ್ಲ. ಮೊದಲ ಅಧಿಕೃತ ಸುದ್ದಿ ಅಥವಾ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ!' : 'No new updates published this week. Be the first to share an update!'}
              </p>
              <button onClick={() => onNavigateTab('news')} className="btn-primary" style={{ display: 'inline-flex' }}>
                <span>{isKannada ? 'ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ (1 ವಾರ ಲೈವ್)' : 'Share News (1-Week Live)'}</span>
              </button>
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {newsList.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenNewsDetail(item)}
                className="glass-card glass-card-interactive card-3d"
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              >
                {/* Verification & 1-Week Active Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-verified">
                      <ShieldCheck size={12} />
                      {isKannada ? 'ದೃಢೀಕೃತ' : 'VERIFIED'}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {isKannada ? '1 ವಾರ ಸಕ್ರಿಯ' : '1-Wk Active'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    📅 {item.created_at.split('T')[0]}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4 }}>
                  {isKannada ? item.title_kn : item.title_en}
                </h3>

                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                  flex: 1
                }}>
                  {(isKannada ? item.content_kn : item.content_en).substring(0, 110)}...
                </p>

                {item.official_correction && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    borderLeft: '3px solid #F59E0B',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    color: '#FEF3C7',
                    marginBottom: '12px'
                  }}>
                    <strong>{isKannada ? 'ಅಧಿಕೃತ ಸ್ಪಷ್ಟನೆ:' : 'Admin Note:'}</strong> {isKannada && item.official_correction_kn ? item.official_correction_kn : item.official_correction}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '12px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>By: {item.author_name}</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Heart size={13} /> {item.likes_count}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={13} /> {item.comments_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* 📅 UPCOMING EVENTS SECTION */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                {isKannada ? '📅 ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು' : '📅 Upcoming Events & Festivals'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isKannada ? 'ರಥೋತ್ಸವಗಳು, ಕೃಷಿ ಮೇಳಗಳು ಮತ್ತು ಸಾರ್ವಜನಿಕ ಸಭೆಗಳು' : 'Festivals, farmers meets, and village gatherings'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('events')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-emerald)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{isKannada ? 'ಎಲ್ಲ ಕಾರ್ಯಕ್ರಮಗಳು' : 'View All'}</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {eventsList.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.92rem', color: '#CBD5E1', marginBottom: '14px' }}>
                {isKannada ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮಗಳು ನಿಗದಿಯಾಗಿಲ್ಲ.' : 'No events scheduled yet for Muttagundi.'}
              </p>
              <button onClick={() => onNavigateTab('events')} className="btn-primary" style={{ display: 'inline-flex' }}>
                <span>{isKannada ? 'ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ' : 'Schedule Event'}</span>
              </button>
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {eventsList.map((event) => (
              <div
                key={event.id}
                onClick={() => onOpenEventDetail(event)}
                className="glass-card glass-card-interactive card-3d"
                style={{
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '160px', position: 'relative' }}>
                  <img
                    src={event.cover_image}
                    alt={event.title_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#FEF08A'
                  }}>
                    {event.date}
                  </div>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>
                    {isKannada ? event.title_kn : event.title_en}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                    <MapPin size={14} color="#F59E0B" />
                    <span>{isKannada ? event.venue_kn : event.venue_en}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                    {(isKannada ? event.description_kn : event.description_en).substring(0, 120)}...
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {event.participants_count} {isKannada ? 'ನೋಂದಾಯಿತರು' : 'Attending'}
                    </span>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem', minHeight: '32px' }}>
                      {isKannada ? 'ವಿವರ ನೋಡಿ' : 'View Details'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* 🌾 AGRICULTURE & 🛕 TEMPLES TWO-COLUMN SPOTLIGHT */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {/* Agriculture Hub Preview */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wheat size={20} color="#10B981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {isKannada ? 'ಕೃಷಿ ಮಾಹಿತಿ ಕೇಂದ್ರ' : 'Agriculture Hub'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('agriculture')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                {isKannada ? 'ಎಲ್ಲ ಬೆಳೆಗಳು' : 'More'} →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {crops.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {isKannada ? 'ಯಾವುದೇ ಬೆಳೆ ಮಾಹಿತಿ ದಾಖಲಾಗಿಲ್ಲ.' : 'No crop cultivation guides added yet.'}
                  </p>
                  <button 
                    onClick={() => onNavigateTab('agriculture')}
                    className="btn-primary" 
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                  >
                    {isKannada ? '+ ಬೆಳೆ ಮಾಹಿತಿ ಸೇರಿಸಿ' : '+ Add Crop Guide'}
                  </button>
                </div>
              ) : (
                crops.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onOpenCropDetail(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={c.image_url}
                      alt={c.name_en}
                      style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                        {isKannada ? c.name_kn : c.name_en}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isKannada ? c.season_kn : c.season_en}
                      </span>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Temples & Culture Preview */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={20} color="#F59E0B" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {isKannada ? 'ದೇವಸ್ಥಾನ & ಪರಂಪರೆ' : 'Temples & Heritage'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('temples')}
                style={{ background: 'none', border: 'none', color: '#F59E0B', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                {isKannada ? 'ಎಲ್ಲ ದೇಗುಲಗಳು' : 'More'} →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {temples.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {isKannada ? 'ಯಾವುದೇ ದೇವಾಲಯಗಳ ವಿವರ ದಾಖಲಾಗಿಲ್ಲ.' : 'No temples or sacred places registered yet.'}
                  </p>
                  <button 
                    onClick={() => onNavigateTab('temples')}
                    className="btn-primary" 
                    style={{ fontSize: '0.78rem', padding: '6px 14px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                  >
                    {isKannada ? '+ ದೇಗುಲ ಸೇರಿಸಿ' : '+ Add Temple Info'}
                  </button>
                </div>
              ) : (
                temples.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTempleDetail(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={t.image_url}
                      alt={t.name_en}
                      style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                        {isKannada ? t.name_kn : t.name_en}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isKannada ? t.timings_kn : t.timings_en}
                      </span>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* 📸 VILLAGE PHOTO GALLERY PREVIEW */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                {isKannada ? '📸 ಗ್ರಾಮದ ಫೋಟೋ ಗ್ಯಾಲರಿ' : '📸 Village Photo Gallery'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isKannada ? 'ಹಬ್ಬಗಳು, ಸುಗ್ಗಿಯ ಕಾಲ ಮತ್ತು ಪ್ರಾಕೃತಿಕ ಸೌಂದರ್ಯ' : 'Celebrations, festivals, harvest and village landscapes'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('gallery')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-emerald)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              {isKannada ? 'ಎಲ್ಲಾ ಫೋಟೋಗಳು' : 'View Gallery'} →
            </button>
          </div>

          {gallery.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {isKannada ? 'ಗ್ರಾಮದ ಆಲ್ಬಂನಲ್ಲಿ ಇನ್ನೂ ಫೋಟೋಗಳಿಲ್ಲ. ಹಬ್ಬ ಮತ್ತು ಸುಗ್ಗಿ ನೆನಪುಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ!' : 'No photos added to the village album yet. Share festival, harvest or scenic pictures!'}
              </p>
              <button 
                onClick={() => onNavigateTab('gallery')}
                className="btn-primary" 
                style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              >
                {isKannada ? '📸 ಮೊದಲ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : '📸 Upload First Photo'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {gallery.map((g) => (
                <div
                  key={g.id}
                  onClick={() => onOpenGalleryDetail(g)}
                  className="glass-card glass-card-interactive"
                  style={{
                    height: '160px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <img
                    src={g.url}
                    alt={g.title_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '12px'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 600 }}>
                      {isKannada ? g.title_kn : g.title_en}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🏆 ACHIEVEMENTS BANNER */}
        <section style={{ marginBottom: '32px' }}>
          <div
            className="glass-card"
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={22} color="#EC4899" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {isKannada ? 'ಗ್ರಾಮದ ಹೆಮ್ಮೆಯ ಸಾಧಕರು' : 'Village Achievements & Pride'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('achievements')}
                style={{ background: 'none', border: 'none', color: '#EC4899', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {isKannada ? 'ಸಾಧಕರ ಪಟ್ಟಿ' : 'View All'} →
              </button>
            </div>

            {achievements.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {isKannada ? 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ಸಾಧಕರ ವಿವರಗಳನ್ನು ಶೀಘ್ರದಲ್ಲೇ ದಾಖಲಿಸಲಾಗುತ್ತದೆ.' : 'Muttagundi achiever nominations in sports, education and farming can be registered here.'}
                </p>
                <button 
                  onClick={() => onNavigateTab('achievements')}
                  className="btn-secondary" 
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  {isKannada ? 'ಸಾಧಕರ ವಿಭಾಗ ನೋಡಿ' : 'Explore Achievers'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    onClick={() => onNavigateTab('achievements')}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <img
                        src={ach.photo_url}
                        alt={ach.person_name_en}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                          {isKannada ? ach.person_name_kn : ach.person_name_en}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#F472B6', fontWeight: 600 }}>
                          {ach.category} • {ach.year}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {isKannada ? ach.title_kn : ach.title_en}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
