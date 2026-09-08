import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { AchievementItem } from '../types';
import { Award, ShieldCheck, Plus, Sparkles, UserCheck } from 'lucide-react';

export const AchievementsScreen: React.FC = () => {
  const { language, isKannada } = useLanguage();
  const { isModerator } = useAuth();
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [catFilter, setCatFilter] = useState<string>('ALL');

  useEffect(() => {
    return dbService.subscribeAchievements(setAchievements);
  }, []);

  const categories = [
    { id: 'ALL', label_en: 'All Achievers', label_kn: 'ಎಲ್ಲಾ ಸಾಧಕರು' },
    { id: 'ATHLETE', label_en: 'Athletes', label_kn: 'ಕ್ರೀಡಾಪಟುಗಳು' },
    { id: 'FARMER', label_en: 'Farmers', label_kn: 'ಪ್ರಗತಿಪರ ರೈತರು' },
    { id: 'STUDENT', label_en: 'Students', label_kn: 'ವಿದ್ಯಾರ್ಥಿಗಳು' },
    { id: 'ARTIST', label_en: 'Artists & Culture', label_kn: 'ಕಲಾವಿದರು' }
  ];

  const filtered = achievements.filter((a) => {
    if (catFilter !== 'ALL' && a.category !== catFilter) return false;
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ಗ್ರಾಮದ ಕೀರ್ತಿ & ಹೆಮ್ಮೆಯ ಸಾಧಕರು' : 'Village Achievements & Pride of Our Soil'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada
            ? 'ರಾಜ್ಯ, ರಾಷ್ಟ್ರೀಯ ಮಟ್ಟದಲ್ಲಿ ಗ್ರಾಮದ ಹೆಸರು ಬೆಳಗಿಸಿದ ಸಾಧಕರ ಅಧಿಕೃತ ಗೌರವ ದಾಖಲೆ'
            : 'Moderator-verified achievements of our students, farmers, athletes, and artists'}
        </p>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              background: catFilter === c.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: catFilter === c.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: catFilter === c.id ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {isKannada ? c.label_kn : c.label_en}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {filtered.map((item) => {
          const pName = language === 'kn' ? item.person_name_kn : item.person_name_en;
          const aTitle = language === 'kn' ? item.title_kn : item.title_en;
          const aDesc = language === 'kn' ? item.description_kn : item.description_en;

          return (
            <div
              key={item.id}
              className="glass-card card-3d"
              style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <img
                  src={item.photo_url}
                  alt={pName}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #EC4899',
                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
                  }}
                />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{pName}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#EC4899', fontWeight: 700, textTransform: 'uppercase' }}>
                    {item.category} • {item.year}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(236, 72, 153, 0.08)',
                  borderLeft: '3px solid #EC4899',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#FCE7F3',
                  marginBottom: '14px'
                }}
              >
                🏆 {aTitle}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginBottom: '16px' }}>
                {aDesc}
              </p>

              <div style={{
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399' }}>
                  <ShieldCheck size={13} /> Verified Profile
                </span>
                <span>Profile Consent: Verified</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
