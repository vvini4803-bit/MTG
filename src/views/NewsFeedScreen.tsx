import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
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
  Flag
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return dbService.subscribeNews((items) => {
      setNewsList(items);
    });
  }, []);

  const categories: Array<{ id: string; label_en: string; label_kn: string }> = [
    { id: 'ALL', label_en: 'All Updates', label_kn: 'ಎಲ್ಲಾ ಅಪ್‌ಡೇಟ್‌ಗಳು' },
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

  const filteredNews = newsList.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (statusFilter !== 'ALL' && item.verification_status !== statusFilter) return false;
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
              ? 'ದೃಢೀಕೃತ ಪಂಚಾಯತಿ ಪ್ರಕಟಣೆಗಳು ಮತ್ತು ಸಮುದಾಯ ವರದಿಗಳು'
              : 'Grounded community reports, official updates, and verified news'}
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

      {/* Verification Notice Banner */}
      <div
        style={{
          background: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(2, 132, 199, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <ShieldCheck size={22} color="#38BDF8" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: '#BAE6FD', lineHeight: 1.5 }}>
          {isKannada
            ? 'ಮಾಹಿತಿ ಶುದ್ಧತೆಯ ನೀತಿ: ನಾಗರಿಕರು ಸಲ್ಲಿಸಿದ ಯಾವುದೇ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸದೆ ಸತ್ಯವೆಂದು ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ. ಪರಿಶೀಲನೆಯ ನಂತರ ಹಸಿರು ಬ್ಯಾಡ್ಜ್ ನೀಡಲಾಗುತ್ತದೆ.'
            : 'Responsible Reporting: Community posts are never automatically marked as true. Authorized moderators verify vital updates.'}
        </span>
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
          <option value="ALL">{isKannada ? 'ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು' : 'All Statuses'}</option>
          <option value="VERIFIED">🟢 {isKannada ? 'ದೃಢೀಕೃತ ಮಾತ್ರ' : 'Verified Only'}</option>
          <option value="COMMUNITY_REPORT">🔵 {isKannada ? 'ಸಮುದಾಯ ವರದಿ' : 'Community Reports'}</option>
          <option value="PENDING">🟡 {isKannada ? 'ಪರಿಶೀಲನೆ ಬಾಕಿ' : 'Pending Verification'}</option>
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

            return (
              <article
                key={item.id}
                onClick={() => onOpenNewsDetail(item)}
                className="glass-card glass-card-interactive card-3d"
                style={{ padding: '20px', cursor: 'pointer' }}
              >
                {/* Top Metabar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Status Badge */}
                    {item.verification_status === 'VERIFIED' && (
                      <span className="badge badge-verified">
                        <ShieldCheck size={12} />
                        {isKannada ? 'ದೃಢೀಕೃತ' : 'VERIFIED'}
                      </span>
                    )}
                    {item.verification_status === 'COMMUNITY_REPORT' && (
                      <span className="badge badge-community">
                        {isKannada ? 'ಸಮುದಾಯ ವರದಿ' : 'COMMUNITY REPORT'}
                      </span>
                    )}
                    {item.verification_status === 'PENDING' && (
                      <span className="badge badge-pending">
                        <Clock size={12} />
                        {isKannada ? 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' : 'PENDING'}
                      </span>
                    )}
                    {item.verification_status === 'REJECTED' && (
                      <span className="badge badge-rejected">
                        {isKannada ? 'ತಿರಸ್ಕೃತ' : 'REJECTED'}
                      </span>
                    )}

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
                    {item.created_at.replace('T', ' ').slice(0, 16)}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.author_name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      ({item.author_role.replace('_', ' ')})
                    </span>
                    {item.verified_by_name && (
                      <span style={{ color: '#34D399', fontSize: '0.7rem' }}>
                        ✓ {item.verified_by_name}
                      </span>
                    )}
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
