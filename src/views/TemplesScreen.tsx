import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { TempleItem } from '../types';
import {
  Landmark,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';

interface TemplesScreenProps {
  onOpenTempleDetail: (temple: TempleItem) => void;
  onOpenCreateTemple?: () => void;
}

export const TemplesScreen: React.FC<TemplesScreenProps> = ({
  onOpenTempleDetail,
  onOpenCreateTemple
}) => {
  const { language, isKannada } = useLanguage();
  const { isAdmin } = useAuth();
  const [temples, setTemples] = useState<TempleItem[]>([]);

  useEffect(() => {
    return dbService.subscribeTemples(setTemples);
  }, []);

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ದೇವಾಲಯಗಳು & ಪಾರಂಪರಿಕ ತಾಣಗಳು' : 'Temples & Sacred Heritage'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಹೊಯ್ಸಳ ಕಾಲದ ಶಿಲ್ಪಕಲೆ, ಗ್ರಾಮ ದೇವತೆ ಸನ್ನಿಧಿಗಳು ಹಾಗೂ ಪೂಜಾ ವಿವರಗಳು'
              : 'Historic Hoysala sanctums, village guardian shrines, festival timings & traditions'}
          </p>
        </div>

        {isAdmin && onOpenCreateTemple && (
          <button onClick={onOpenCreateTemple} className="btn-primary">
            <Plus size={18} />
            <span>{isKannada ? 'ದೇಗುಲ ಸೇರಿಸಿ' : 'Add Temple Record'}</span>
          </button>
        )}
      </div>

      {/* Temples Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {temples.map((temple) => (
          <div
            key={temple.id}
            onClick={() => onOpenTempleDetail(temple)}
            className="glass-card glass-card-interactive card-3d"
            style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ height: '200px', position: 'relative' }}>
              <img src={temple.image_url} alt={temple.name_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                color: '#34D399',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={12} />
                {temple.verified ? 'Verified Heritage' : 'Awaiting Review'}
              </div>
            </div>

            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                {isKannada ? temple.name_kn : temple.name_en}
              </h2>

              <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600, marginBottom: '10px' }}>
                {isKannada ? temple.deity_kn : temple.deity_en}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                <Clock size={14} color="#10B981" />
                <span>{isKannada ? temple.timings_kn : temple.timings_en}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '14px' }}>
                <MapPin size={14} color="#0284C7" />
                <span>{isKannada ? temple.location_kn : temple.location_en}</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                {(isKannada ? temple.history_kn : temple.history_en).substring(0, 120)}...
              </p>

              <div style={{
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Source: {temple.source.split(' ')[0]}...</span>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                  {isKannada ? 'ವಿವರ ನೋಡಿ' : 'Explore'} →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
