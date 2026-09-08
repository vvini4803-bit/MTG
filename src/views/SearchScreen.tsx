import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import { ViewTab } from '../types';
import {
  Search as SearchIcon,
  Newspaper,
  Calendar,
  Trophy,
  Wheat,
  Landmark,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SearchScreenProps {
  onNavigateTab: (tab: ViewTab) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onNavigateTab }) => {
  const { language, isKannada } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Search indexed datasets
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [temples, setTemples] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    dbService.subscribeNews(setNews);
    dbService.subscribeEvents(setEvents);
    dbService.subscribeCrops(setCrops);
    dbService.subscribeTemples(setTemples);
    dbService.subscribeHistory(setHistory);
    dbService.subscribeAchievements(setAchievements);
  }, []);

  const q = query.toLowerCase().trim();

  // Aggregate search results
  const results: Array<{
    id: string;
    title: string;
    snippet: string;
    category: string;
    tab: ViewTab;
    icon: any;
    color: string;
  }> = [];

  if (q) {
    // News
    if (activeCategory === 'ALL' || activeCategory === 'NEWS') {
      news.forEach((n) => {
        if (
          n.title_en.toLowerCase().includes(q) ||
          n.title_kn.toLowerCase().includes(q) ||
          n.content_en.toLowerCase().includes(q) ||
          n.content_kn.toLowerCase().includes(q)
        ) {
          results.push({
            id: n.id,
            title: isKannada ? n.title_kn : n.title_en,
            snippet: (isKannada ? n.content_kn : n.content_en).substring(0, 90) + '...',
            category: 'News',
            tab: 'news',
            icon: Newspaper,
            color: '#10B981'
          });
        }
      });
    }

    // Events
    if (activeCategory === 'ALL' || activeCategory === 'EVENTS') {
      events.forEach((e) => {
        if (
          e.title_en.toLowerCase().includes(q) ||
          e.title_kn.toLowerCase().includes(q) ||
          e.venue_en.toLowerCase().includes(q)
        ) {
          results.push({
            id: e.id,
            title: isKannada ? e.title_kn : e.title_en,
            snippet: `${e.date} • ${isKannada ? e.venue_kn : e.venue_en}`,
            category: 'Events',
            tab: 'events',
            icon: Calendar,
            color: '#0284C7'
          });
        }
      });
    }

    // Crops
    if (activeCategory === 'ALL' || activeCategory === 'AGRICULTURE') {
      crops.forEach((c) => {
        if (
          c.name_en.toLowerCase().includes(q) ||
          c.name_kn.toLowerCase().includes(q) ||
          c.uses_en.toLowerCase().includes(q)
        ) {
          results.push({
            id: c.id,
            title: isKannada ? c.name_kn : c.name_en,
            snippet: `${isKannada ? c.season_kn : c.season_en} • ${isKannada ? c.water_req_kn : c.water_req_en}`,
            category: 'Agriculture',
            tab: 'agriculture',
            icon: Wheat,
            color: '#16A34A'
          });
        }
      });
    }

    // Temples
    if (activeCategory === 'ALL' || activeCategory === 'TEMPLES') {
      temples.forEach((t) => {
        if (
          t.name_en.toLowerCase().includes(q) ||
          t.name_kn.toLowerCase().includes(q) ||
          t.deity_en.toLowerCase().includes(q)
        ) {
          results.push({
            id: t.id,
            title: isKannada ? t.name_kn : t.name_en,
            snippet: `${isKannada ? t.deity_kn : t.deity_en} • ${isKannada ? t.location_kn : t.location_en}`,
            category: 'Temples',
            tab: 'temples',
            icon: Landmark,
            color: '#F59E0B'
          });
        }
      });
    }

    // Achievements
    if (activeCategory === 'ALL' || activeCategory === 'ACHIEVEMENTS') {
      achievements.forEach((a) => {
        if (
          a.person_name_en.toLowerCase().includes(q) ||
          a.person_name_kn.toLowerCase().includes(q) ||
          a.title_en.toLowerCase().includes(q)
        ) {
          results.push({
            id: a.id,
            title: isKannada ? a.person_name_kn : a.person_name_en,
            snippet: `${a.category} • ${isKannada ? a.title_kn : a.title_en}`,
            category: 'Achievements',
            tab: 'achievements',
            icon: Award,
            color: '#EC4899'
          });
        }
      });
    }

    // History
    if (activeCategory === 'ALL' || activeCategory === 'HISTORY') {
      history.forEach((h) => {
        if (
          h.title_en.toLowerCase().includes(q) ||
          h.title_kn.toLowerCase().includes(q) ||
          h.year.toLowerCase().includes(q)
        ) {
          results.push({
            id: h.id,
            title: isKannada ? h.title_kn : h.title_en,
            snippet: `${h.year} • ${h.type}`,
            category: 'History',
            tab: 'history',
            icon: BookOpen,
            color: '#8B5CF6'
          });
        }
      });
    }
  }

  const searchCategories = [
    { id: 'ALL', label: isKannada ? 'ಎಲ್ಲವೂ' : 'All' },
    { id: 'NEWS', label: isKannada ? 'ಸುದ್ದಿ' : 'News' },
    { id: 'EVENTS', label: isKannada ? 'ಕಾರ್ಯಕ್ರಮಗಳು' : 'Events' },
    { id: 'AGRICULTURE', label: isKannada ? 'ಕೃಷಿ' : 'Agriculture' },
    { id: 'TEMPLES', label: isKannada ? 'ದೇವಸ್ಥಾನಗಳು' : 'Temples' },
    { id: 'ACHIEVEMENTS', label: isKannada ? 'ಸಾಧಕರು' : 'Achievements' },
    { id: 'HISTORY', label: isKannada ? 'ಇತಿಹಾಸ' : 'History' }
  ];

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ಸಮಗ್ರ ಗ್ರಾಮ ಸರ್ಚ್' : 'Global Village Search'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada
            ? 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸುದ್ದಿ, ಬೆಳೆಗಳು, ದೇಗುಲಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಿ'
            : 'Search across verified news, events, crops, temples, and achievements'}
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <SearchIcon size={20} color="var(--accent-emerald)" style={{ position: 'absolute', left: '16px', top: '16px' }} />
        <input
          type="text"
          className="form-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isKannada ? 'ಉದಾ: ರಾಗಿ, ಚನ್ನಕೇಶವ, ಕ್ರಿಕೆಟ್, ನೀರು...' : 'e.g. Ragi, Chennakeshava, Cricket, Water...'}
          style={{ paddingLeft: '48px', height: '52px', fontSize: '1rem' }}
          autoFocus
        />
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '24px' }}>
        {searchCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--glass-border)',
              background: activeCategory === c.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: activeCategory === c.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeCategory === c.id ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Results List */}
      {!q ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <SearchIcon size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{isKannada ? 'ಹುಡುಕಲು ಮೇಲೆ ಕೀವರ್ಡ್ ಟೈಪ್ ಮಾಡಿ' : 'Type a keyword above to search across our village database'}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>{isKannada ? 'ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No verified records found matching your query'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Found {results.length} results:
          </span>
          {results.map((res, i) => {
            const Icon = res.icon;
            return (
              <div
                key={i}
                onClick={() => onNavigateTab(res.tab)}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: `${res.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={20} color={res.color} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: res.color, textTransform: 'uppercase' }}>
                      {res.category}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>
                    {res.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {res.snippet}
                  </p>
                </div>

                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
