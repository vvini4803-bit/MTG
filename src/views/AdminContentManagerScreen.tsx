import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { NewsItem, TempleItem, MapLocationItem } from '../types';
import { EditNewsModal } from './EditNewsModal';
import { EditTempleModal } from './EditTempleModal';
import { EditMapLocationModal } from './EditMapLocationModal';
import { CreatePostModal } from './CreatePostModal';
import { triggerHapticFeedback } from '../services/deviceIdentity';
import {
  ShieldCheck,
  Newspaper,
  Landmark,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Search,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Phone,
  Radio,
  CheckCircle2,
  X
} from 'lucide-react';

interface AdminContentManagerScreenProps {
  onBackToDashboard: () => void;
}

export const AdminContentManagerScreen: React.FC<AdminContentManagerScreenProps> = ({
  onBackToDashboard
}) => {
  const { isKannada } = useLanguage();
  const { role, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'news' | 'temples' | 'map'>('news');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [templeList, setTempleList] = useState<TempleItem[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocationItem[]>([]);

  // Modal states
  const [selectedNewsToEdit, setSelectedNewsToEdit] = useState<NewsItem | null>(null);
  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);

  const [selectedTempleToEdit, setSelectedTempleToEdit] = useState<TempleItem | null>(null);
  const [templeModalMode, setTempleModalMode] = useState<'add' | 'edit'>('edit');
  const [isTempleModalOpen, setIsTempleModalOpen] = useState(false);

  const [selectedLocationToEdit, setSelectedLocationToEdit] = useState<MapLocationItem | null>(null);
  const [mapModalMode, setMapModalMode] = useState<'add' | 'edit'>('edit');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  useEffect(() => {
    const unsubNews = dbService.subscribeNews(setNewsList);
    const unsubTemples = dbService.subscribeTemples(setTempleList);
    const unsubMap = dbService.subscribeMapLocations(setMapLocations);

    return () => {
      unsubNews();
      unsubTemples();
      unsubMap();
    };
  }, []);

  // Filtered lists
  const q = searchQuery.toLowerCase().trim();

  const filteredNews = newsList.filter((n) => {
    if (!q) return true;
    return (
      n.title_en?.toLowerCase().includes(q) ||
      n.title_kn?.toLowerCase().includes(q) ||
      n.author_name?.toLowerCase().includes(q) ||
      n.category?.toLowerCase().includes(q)
    );
  });

  const filteredTemples = templeList.filter((t) => {
    if (!q) return true;
    return (
      t.name_en?.toLowerCase().includes(q) ||
      t.name_kn?.toLowerCase().includes(q) ||
      t.deity_en?.toLowerCase().includes(q) ||
      t.deity_kn?.toLowerCase().includes(q)
    );
  });

  const filteredLocations = mapLocations.filter((l) => {
    if (!q) return true;
    return (
      l.name_en?.toLowerCase().includes(q) ||
      l.name_kn?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1080px' }}>
      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button
            onClick={onBackToDashboard}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-emerald)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              marginBottom: '6px'
            }}
          >
            ← {isKannada ? 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Admin Hub'}
          </button>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0 }}>
            {isKannada ? '👑 ಪೋಸ್ಟ್, ಸುದ್ದಿ, ದೇವಾಲಯ & ನಕ್ಷೆ ನಿರ್ವಹಣೆ' : '👑 Posts, News, Temples & Map Management'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isKannada
              ? 'ಗ್ರಾಮದ ಎಲ್ಲಾ ಪೋಸ್ಟ್‌ಗಳು, ಪ್ರಕಟಣೆಗಳು, ದೇವಾಲಯಗಳ ಪಟ್ಟಿ ಹಾಗೂ ನಕ್ಷೆ ಸ್ಥಳಗಳನ್ನು ಸೇರಿಸಿ, ತಿದ್ದುಪಡಿ ಮಾಡಿ ಅಥವಾ ಅಳಿಸಿ.'
              : 'Add, edit, correct, or delete any village post, news announcement, temple record, or map landmark.'}
          </p>
        </div>

        {/* Action Button for Active Tab */}
        <div>
          {activeTab === 'news' && (
            <button
              onClick={() => setIsAddNewsOpen(true)}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              <span>{isKannada ? 'ಹೊಸ ಸುದ್ದಿ ಪ್ರಕಟಿಸಿ' : 'Add News / Post'}</span>
            </button>
          )}

          {activeTab === 'temples' && (
            <button
              onClick={() => {
                setSelectedTempleToEdit(null);
                setTempleModalMode('add');
                setIsTempleModalOpen(true);
              }}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              <span>{isKannada ? 'ಹೊಸ ದೇವಾಲಯ ಸೇರಿಸಿ' : 'Add Temple'}</span>
            </button>
          )}

          {activeTab === 'map' && (
            <button
              onClick={() => {
                setSelectedLocationToEdit(null);
                setMapModalMode('add');
                setIsMapModalOpen(true);
              }}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              <span>{isKannada ? 'ಹೊಸ ನಕ್ಷೆ ಸ್ಥಳ ಸೇರಿಸಿ' : 'Add Map Location'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Main Content Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '14px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => {
            setActiveTab('news');
            triggerHapticFeedback();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: activeTab === 'news' ? '1.5px solid #10B981' : '1px solid var(--glass-border)',
            background: activeTab === 'news' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            color: activeTab === 'news' ? '#34D399' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Newspaper size={18} />
          <span>{isKannada ? 'ಸುದ್ದಿ & ಪೋಸ್ಟ್‌ಗಳು' : 'News & Posts'}</span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '2px 7px', borderRadius: '10px' }}>
            {newsList.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('temples');
            triggerHapticFeedback();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: activeTab === 'temples' ? '1.5px solid #EC4899' : '1px solid var(--glass-border)',
            background: activeTab === 'temples' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            color: activeTab === 'temples' ? '#F472B6' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Landmark size={18} />
          <span>{isKannada ? 'ದೇವಾಲಯಗಳು' : 'Temples & Shrines'}</span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '2px 7px', borderRadius: '10px' }}>
            {templeList.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('map');
            triggerHapticFeedback();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: activeTab === 'map' ? '1.5px solid #0284C7' : '1px solid var(--glass-border)',
            background: activeTab === 'map' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            color: activeTab === 'map' ? '#38BDF8' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <MapPin size={18} />
          <span>{isKannada ? 'ಗ್ರಾಮದ ನಕ್ಷೆ & ಸ್ಥಳಗಳು' : 'Map & Landmarks'}</span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '2px 7px', borderRadius: '10px' }}>
            {mapLocations.length}
          </span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search
          size={18}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          className="form-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === 'news'
              ? isKannada ? 'ಸುದ್ದಿ ಅಥವಾ ಲೇಖಕರ ಹೆಸರು ಹುಡುಕಿ...' : 'Search posts or authors...'
              : activeTab === 'temples'
              ? isKannada ? 'ದೇವಾಲಯ ಅಥವಾ ಪ್ರಧಾನ ದೈವ ಹುಡುಕಿ...' : 'Search temples or deities...'
              : isKannada ? 'ನಕ್ಷೆ ಸ್ಥಳ ಅಥವಾ ವಿಭಾಗ ಹುಡುಕಿ...' : 'Search map landmarks or categories...'
          }
          style={{ paddingLeft: '42px', height: '44px' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* 📰 TAB 1: NEWS & POSTS MANAGEMENT                            */}
      {/* ============================================================ */}
      {activeTab === 'news' && (
        <div>
          {filteredNews.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>{isKannada ? 'ಯಾವುದೇ ಸುದ್ದಿ ಕಂಡುಬಂದಿಲ್ಲ.' : 'No matching news posts found.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredNews.map((item) => (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: '280px' }}>
                    {item.media_url ? (
                      <img
                        src={item.media_url}
                        alt="media"
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          border: '1px solid var(--glass-border)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Newspaper size={24} color="#10B981" />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span className="badge badge-verified" style={{ fontSize: '0.68rem' }}>
                          {item.category}
                        </span>
                        {item.urgent && (
                          <span className="badge badge-urgent" style={{ fontSize: '0.68rem' }}>
                            🚨 URGENT
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          📅 {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          By: <strong>{item.author_name}</strong>
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 4px', color: '#FFFFFF' }}>
                        {isKannada ? item.title_kn : item.title_en}
                      </h3>

                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.4 }}>
                        {(isKannada ? item.content_kn : item.content_en).substring(0, 140)}...
                      </p>

                      {/* Official Correction Preview if present */}
                      {item.official_correction && (
                        <div
                          style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderLeft: '3px solid #F59E0B',
                            padding: '4px 8px',
                            fontSize: '0.74rem',
                            color: '#FBBF24',
                            borderRadius: '0 4px 4px 0'
                          }}
                        >
                          <strong>{isKannada ? 'ಅಧಿಕೃತ ಸ್ಪಷ್ಟನೆ:' : 'Admin Note:'}</strong> {isKannada && item.official_correction_kn ? item.official_correction_kn : item.official_correction}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => setSelectedNewsToEdit(item)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34D399',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title={isKannada ? 'ತಿದ್ದುಪಡಿ / ಸ್ಪಷ್ಟನೆ' : 'Edit / Correction'}
                    >
                      <Edit3 size={14} />
                      <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit / Correction'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        const confirmPrompt = isKannada
                          ? `ಈ ಪೋಸ್ಟ್ ಅನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವೇ?`
                          : `Are you sure you want to delete this post?`;
                        if (!window.confirm(confirmPrompt)) return;
                        await dbService.deleteNews(item.id, currentUser?.uid || '', role);
                        triggerHapticFeedback();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#EF4444',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title={isKannada ? 'ಅಳಿಸಿ' : 'Delete'}
                    >
                      <Trash2 size={14} />
                      <span>{isKannada ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 🛕 TAB 2: TEMPLES MANAGEMENT                                 */}
      {/* ============================================================ */}
      {activeTab === 'temples' && (
        <div>
          {filteredTemples.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>{isKannada ? 'ಯಾವುದೇ ದೇವಾಲಯ ಕಂಡುಬಂದಿಲ್ಲ.' : 'No matching temple records found.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredTemples.map((temple) => (
                <div
                  key={temple.id}
                  className="glass-card"
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ height: '140px', position: 'relative' }}>
                    <img
                      src={temple.image_url || '/anime/temple_gopuram.jpg'}
                      alt={temple.name_en}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        display: 'flex',
                        gap: '6px'
                      }}
                    >
                      <button
                        onClick={() => {
                          setSelectedTempleToEdit(temple);
                          setTempleModalMode('edit');
                          setIsTempleModalOpen(true);
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.7)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit3 size={13} color="#34D399" />
                        <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={async () => {
                          const confirmPrompt = isKannada
                            ? `"${temple.name_kn || temple.name_en}" ದೇವಾಲಯವನ್ನು ಅಳಿಸಲು ಖಚಿತವೇ?`
                            : `Delete temple "${temple.name_en}"?`;
                          if (!window.confirm(confirmPrompt)) return;
                          await dbService.deleteTemple(temple.id, currentUser?.uid, role);
                          triggerHapticFeedback();
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.85)',
                          border: 'none',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{isKannada ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px', color: '#FFFFFF' }}>
                      {isKannada ? temple.name_kn : temple.name_en}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                      🛕 {isKannada ? temple.deity_kn : temple.deity_en}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1, marginBottom: '12px' }}>
                      {(isKannada ? temple.history_kn : temple.history_en).substring(0, 110)}...
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '8px' }}>
                      🕒 {isKannada ? temple.timings_kn : temple.timings_en}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 🗺️ TAB 3: MAP LANDMARKS MANAGEMENT                           */}
      {/* ============================================================ */}
      {activeTab === 'map' && (
        <div>
          {filteredLocations.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>{isKannada ? 'ಯಾವುದೇ ನಕ್ಷೆ ಸ್ಥಳ ಕಂಡುಬಂದಿಲ್ಲ.' : 'No matching map landmarks found.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="glass-card"
                  style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{loc.icon}</span>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                            {isKannada ? loc.name_kn : loc.name_en}
                          </h3>
                          <span style={{ fontSize: '0.72rem', color: loc.color, fontWeight: 700 }}>
                            {loc.category} • {isKannada ? loc.distance_kn : loc.distance_en}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '10px' }}>
                      {isKannada ? loc.desc_kn : loc.desc_en}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      <span>📍 GPS: {loc.coords?.lat?.toFixed(4)}, {loc.coords?.lng?.toFixed(4)}</span>
                      {loc.timings_kn && <span>🕒 {isKannada ? loc.timings_kn : loc.timings_en}</span>}
                      {loc.phone && <span>📞 {loc.phone}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                    {loc.map_url ? (
                      <a
                        href={loc.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: '#38BDF8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>Google Maps</span>
                      </a>
                    ) : <div />}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setSelectedLocationToEdit(loc);
                          setMapModalMode('edit');
                          setIsMapModalOpen(true);
                        }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#34D399',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit3 size={12} />
                        <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={async () => {
                          const confirmPrompt = isKannada
                            ? `"${loc.name_kn || loc.name_en}" ಸ್ಥಳವನ್ನು ಅಳಿಸಲು ಖಚಿತವೇ?`
                            : `Delete landmark "${loc.name_en}"?`;
                          if (!window.confirm(confirmPrompt)) return;
                          await dbService.deleteMapLocation(loc.id, currentUser?.uid, role);
                          triggerHapticFeedback();
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#EF4444',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>{isKannada ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit News Modal */}
      <EditNewsModal
        news={selectedNewsToEdit}
        isOpen={Boolean(selectedNewsToEdit)}
        onClose={() => setSelectedNewsToEdit(null)}
      />

      {/* Add News Modal */}
      <CreatePostModal
        isOpen={isAddNewsOpen}
        onClose={() => setIsAddNewsOpen(false)}
        onPostCreated={() => setIsAddNewsOpen(false)}
      />

      {/* Edit Temple Modal */}
      <EditTempleModal
        temple={selectedTempleToEdit}
        mode={templeModalMode}
        isOpen={isTempleModalOpen}
        onClose={() => {
          setIsTempleModalOpen(false);
          setSelectedTempleToEdit(null);
        }}
      />

      {/* Edit Map Location Modal */}
      <EditMapLocationModal
        location={selectedLocationToEdit}
        mode={mapModalMode}
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setSelectedLocationToEdit(null);
        }}
      />
    </div>
  );
};
