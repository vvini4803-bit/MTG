import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService, isWithinOneWeek, getOneWeekStatus } from '../services/dbService';
import { NewsItem, NewsCategory, VerificationStatus } from '../types';
import {
  Plus,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  AlertTriangle,
  Flame,
  CheckCircle,
  Flag,
  Calendar
} from 'lucide-react';

interface NewsFeedScreenProps {
  onOpenCreatePost: () => void;
  onOpenNewsDetail: (news: NewsItem) => void;
  onOpenComments: (news: NewsItem) => void;
  onOpenReportModal: (type: 'POST', id: string, title: string) => void;
}

export const NewsFeedScreen: React.FC<NewsFeedScreenProps> = ({
  onOpenCreatePost,
  onOpenNewsDetail,
  onOpenComments,
  onOpenReportModal
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, isModerator, isAdmin } = useAuth();

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'WEEK' | 'ALL'>('WEEK');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return dbService.subscribeNews((items) => {
      setNewsList(items);
    });
  }, []);

  const categories: Array<{ id: string; label_en: string; label_kn: string }> = [
    { id: 'ALL', label_en: 'All Categories', label_kn: 'ಎಲ್ಲಾ ವರ್ಗಗಳು' },
    { id: 'WATER', label_en: 'Water', label_kn: 'ನೀರು' },
    { id: 'ELECTRICITY', label_en: 'Electricity', label_kn: 'ವಿದ್ಯುತ್' },
    { id: 'ROAD', label_en: 'Road & Transport', label_kn: 'ರಸ್ತೆ & ಸಾರಿಗೆ' },
    { id: 'AGRICULTURE', label_en: 'Agriculture', label_kn: 'ಕೃಷಿ' },
    { id: 'SPORTS', label_en: 'Sports', label_kn: 'ಕ್ರೀಡೆ' },
    { id: 'FESTIVAL', label_en: 'Festival', label_kn: 'ಹಬ್ಬಗಳು' },
    { id: 'EMERGENCY', label_en: 'Emergency', label_kn: 'ತುರ್ತು' },
    { id: 'COMMUNITY', label_en: 'Community', label_kn: 'ಸಮುದಾಯ' }
  ];

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    await dbService.toggleLikeNews(id, currentUser.uid);
  };

  const activeWeekCount = newsList.filter((item) => isWithinOneWeek(item.created_at)).length;

  const filteredNews = newsList.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (statusFilter !== 'ALL' && item.verification_status !== statusFilter) return false;
    if (timeFilter === 'WEEK' && !isWithinOneWeek(item.created_at)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title_en.toLowerCase().includes(q) || item.title_kn.toLowerCase().includes(q);
      const matchContent = item.content_en.toLowerCase().includes(q) || item.content_kn.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '840px' }}>
      {/* Header & Post CTA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ಗ್ರಾಮದ ಸುದ್ದಿ & ನೇರ ಫೀಡ್' : 'Real-Time Village News & Feed'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಪ್ರತಿಯೊಬ್ಬರೂ ಮಾಹಿತಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು • ತಕ್ಷಣ ದೃಢೀಕರಣ (Auto-Verified) • 1 ವಾರ ಲೈವ್'
              : 'All residents can upload data • Auto-verified upon post • Visible to all for 1 week'}
          </p>
        </div>

        <button
          onClick={onOpenCreatePost}
          className="btn-primary"
          style={{ height: '44px', padding: '0 18px' }}
        >
          <Plus size={18} />
          <span>{isKannada ? 'ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'Post an Update'}</span>
        </button>
      </div>

      {/* 1-Week Active & Auto-Verification Notice Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 95, 70, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '18px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)'
        }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldCheck size={24} color="#10B981" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#10B981' }}>
              {isKannada ? '✓ ಸ್ವಯಂಚಾಲಿತ ಪರಿಶೀಲನೆ & 1 ವಾರ ಲೈವ್ ಸಂಗ್ರಹಣೆ' : '✓ Auto-Verified & 1-Week Live Storage'}
            </span>
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.3)',
              color: '#A7F3D0',
              fontWeight: 800
            }}>
              {activeWeekCount} {isKannada ? 'ಈ ವಾರ ಸಕ್ರಿಯ' : 'Active This Week'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#D1FAE5', margin: 0, lineHeight: 1.45 }}>
            {isKannada
              ? 'ಗ್ರಾಮಸ್ಥರು ಅಪ್‌ಲೋಡ್ ಮಾಡುವ ಎಲ್ಲಾ ಅಪ್‌ಡೇಟ್‌ಗಳು ತಕ್ಷಣವೇ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ದೃಢೀಕೃತಗೊಂಡು (Auto-Verified) ಅಪ್‌ಲೋಡ್ ದಿನದಿಂದ 1 ವಾರದವರೆಗೆ ಎಲ್ಲರಿಗೂ ಮುಂಭಾಗದಲ್ಲೇ ಸ್ಪಷ್ಟವಾಗಿ ಗೋಚರಿಸುತ್ತವೆ.'
              : 'All updates uploaded by residents are automatically verified upon post and prominently stored & visible to everyone for 1 week from upload day onwards.'}
          </p>
        </div>
      </div>

      {/* 1-Week Active vs All Time Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTimeFilter('WEEK')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '9999px',
            border: timeFilter === 'WEEK' ? '1.5px solid #10B981' : '1px solid var(--glass-border)',
            background: timeFilter === 'WEEK' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
            color: timeFilter === 'WEEK' ? '#10B981' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={15} />
          <span>{isKannada ? 'ಈ ವಾರದ ಅಪ್‌ಡೇಟ್‌ಗಳು (1 ವಾರ ಸಕ್ರಿಯ)' : 'Past 7 Days (1-Week Live)'}</span>
          <span style={{
            fontSize: '0.72rem',
            background: timeFilter === 'WEEK' ? '#10B981' : 'rgba(255,255,255,0.1)',
            color: timeFilter === 'WEEK' ? '#000000' : '#FFFFFF',
            padding: '1px 7px',
            borderRadius: '10px',
            fontWeight: 800
          }}>
            {activeWeekCount}
          </span>
        </button>

        <button
          onClick={() => setTimeFilter('ALL')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '9999px',
            border: timeFilter === 'ALL' ? '1.5px solid #0284C7' : '1px solid var(--glass-border)',
            background: timeFilter === 'ALL' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255,255,255,0.04)',
            color: timeFilter === 'ALL' ? '#38BDF8' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Clock size={15} />
          <span>{isKannada ? 'ಎಲ್ಲಾ ಅಪ್‌ಡೇಟ್‌ಗಳು (All Time)' : 'All Updates (All Time)'}</span>
          <span style={{
            fontSize: '0.72rem',
            background: timeFilter === 'ALL' ? '#0284C7' : 'rgba(255,255,255,0.1)',
            color: '#FFFFFF',
            padding: '1px 7px',
            borderRadius: '10px',
            fontWeight: 800
          }}>
            {newsList.length}
          </span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKannada ? 'ಸುದ್ದಿ ಅಥವಾ ಸ್ಥಳ ಹುಡುಕಿ...' : 'Search news, location, keyword...'}
            style={{ paddingLeft: '38px', height: '42px' }}
          />
        </div>

        {/* Verification Status Filter */}
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '170px', height: '42px' }}
        >
          <option value="ALL">{isKannada ? 'ಎಲ್ಲಾ ಅಪ್‌ಡೇಟ್‌ಗಳು' : 'All Updates'}</option>
          <option value="VERIFIED">🟢 {isKannada ? 'ದೃಢೀಕೃತ (Auto-Verified)' : 'Verified (Auto-Verified)'}</option>
          <option value="COMMUNITY_REPORT">🔵 {isKannada ? 'ಸಮುದಾಯ ವರದಿ' : 'Community Reports'}</option>
        </select>
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          scrollbarWidth: 'none'
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--glass-border)',
              background: selectedCategory === cat.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: selectedCategory === cat.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: selectedCategory === cat.id ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isKannada ? cat.label_kn : cat.label_en}
          </button>
        ))}
      </div>

      {/* News Items Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredNews.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>{isKannada ? 'ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ಸುದ್ದಿ ಲಭ್ಯವಿಲ್ಲ' : 'No updates found in this category'}</p>
          </div>
        ) : (
          filteredNews.map((item) => {
            const isLiked = currentUser ? item.liked_by.includes(currentUser.uid) : false;
            const weekStatus = getOneWeekStatus(item.created_at);

            return (
              <article
                key={item.id}
                onClick={() => onOpenNewsDetail(item)}
                className="glass-card glass-card-interactive card-3d"
                style={{ padding: '20px', cursor: 'pointer' }}
              >
                {/* Top Metabar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Auto-Verified Badge */}
                    <span className="badge badge-verified">
                      <ShieldCheck size={12} />
                      {isKannada ? 'ದೃಢೀಕೃತ (Auto-Verified)' : 'VERIFIED'}
                    </span>

                    {/* 1-Week Active Badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: weekStatus.isWithinWeek ? 'rgba(16, 185, 129, 0.18)' : 'rgba(148, 163, 184, 0.15)',
                        color: weekStatus.isWithinWeek ? '#34D399' : '#94A3B8',
                        border: `1px solid ${weekStatus.isWithinWeek ? 'rgba(16, 185, 129, 0.35)' : 'rgba(148, 163, 184, 0.2)'}`
                      }}
                    >
                      <Clock size={11} />
                      {isKannada ? weekStatus.labelKn : weekStatus.labelEn}
                    </span>

                    {item.urgent && (
                      <span className="badge badge-urgent">
                        🚨 {isKannada ? 'ತುರ್ತು' : 'URGENT'}
                      </span>
                    )}

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      • {item.category}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    📅 {item.created_at.replace('T', ' ').slice(0, 16)}
                  </span>
                </div>

                {/* Title */}
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.35 }}>
                  {isKannada ? item.title_kn : item.title_en}
                </h2>

                {/* Content */}
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                  {isKannada ? item.content_kn : item.content_en}
                </p>

                {/* Media Image if present */}
                {item.media_url && (
                  <div style={{
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    maxHeight: '340px',
                    marginBottom: '14px',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <img
                      src={item.media_url}
                      alt={item.title_en}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Official Correction Box */}
                {item.official_correction && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    borderLeft: '3px solid #F59E0B',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                    fontSize: '0.78rem',
                    color: '#FEF3C7'
                  }}>
                    <strong>{isKannada ? 'ಅಧಿಕೃತ ಪಂಚಾಯತಿ ಸ್ಪಷ್ಟನೆ:' : 'Official Admin Correction:'} </strong>
                    {isKannada && item.official_correction_kn ? item.official_correction_kn : item.official_correction}
                  </div>
                )}

                {/* Footer Bar: Author & Engagement */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '12px',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.author_name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      ({item.author_role.replace('_', ' ')})
                    </span>
                    <span style={{ color: '#34D399', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <CheckCircle size={12} /> {isKannada ? 'ಸ್ವಯಂ-ದೃಢೀಕೃತ' : 'Auto-Verified'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      onClick={(e) => handleLike(e, item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isLiked ? '#EF4444' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 600
                      }}
                    >
                      <Heart size={15} fill={isLiked ? '#EF4444' : 'none'} />
                      <span>{item.likes_count}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenComments(item);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 600
                      }}
                    >
                      <MessageSquare size={15} />
                      <span>{item.comments_count}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReportModal('POST', item.id, item.title_en);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Report misleading or incorrect info"
                    >
                      <Flag size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
