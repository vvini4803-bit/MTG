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
  Plus,
  X
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [deityEn, setDeityEn] = useState('');
  const [deityKn, setDeityKn] = useState('');
  const [timingsEn, setTimingsEn] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [historyEn, setHistoryEn] = useState('');

  useEffect(() => {
    return dbService.subscribeTemples(setTemples);
  }, []);

  const handleAddTemple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    await dbService.addTemple({
      name_en: nameEn.trim(),
      name_kn: nameKn.trim() || nameEn.trim(),
      deity_en: deityEn.trim() || 'Lord Shiva / Vishnu / Grama Devathe',
      deity_kn: deityKn.trim() || (nameKn.trim() ? 'ಗ್ರಾಮ ದೇವತೆ / ಶ್ರೀ ಸ್ವಾಮಿ' : 'Lord Shiva / Vishnu'),
      timings_en: timingsEn.trim() || '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
      timings_kn: nameKn.trim() ? (timingsEn.trim() || 'ಬೆಳಗ್ಗೆ ೬:೦೦ - ೧೨:೩೦ & ಸಂಜೆ ೫:೩೦ - ೮:೩೦') : '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
      location_en: locationEn.trim() || 'Muttagundi Village',
      location_kn: locationEn.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ',
      history_en: historyEn.trim() || 'Sacred historic temple and center of devotion for Muttagundi residents.',
      history_kn: historyEn.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮಸ್ಥರ ಪವಿತ್ರ ಆರಾಧನಾ ಕೇಂದ್ರ ಮತ್ತು ಐತಿಹಾಸಿಕ ತಾಣ.',
      festivals_en: 'Annual Rathotsava / Jaatre & Karthika Deepotsava',
      festivals_kn: 'ವಾರ್ಷಿಕ ರಥೋತ್ಸವ, ಜಾತ್ರೆ ಮತ್ತು ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ',
      special_pooja_en: 'Sankranti, Ugadi & Maha Shivaratri Special Pooja',
      special_pooja_kn: 'ಸಂಕ್ರಾಂತಿ, ಯುಗಾದಿ ಮತ್ತು ಮಹಾ ಶಿವರಾತ್ರಿ ವಿಶೇಷ ಪೂಜೆ',
      image_url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80',
      source: 'Muttagundi Grama Panchayat Heritage Register',
      verified: true
    });

    setShowAddModal(false);
    setNameEn('');
    setNameKn('');
    setDeityEn('');
    setDeityKn('');
    setTimingsEn('');
    setLocationEn('');
    setHistoryEn('');
  };

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

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>{isKannada ? 'ದೇಗುಲ ಸೇರಿಸಿ' : 'Add Temple Record'}</span>
        </button>
      </div>

      {/* Temples Grid */}
      {temples.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Landmark size={42} color="#EC4899" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            {isKannada ? 'ಯಾವುದೇ ದೇವಾಲಯಗಳ ಮಾಹಿತಿ ಇಲ್ಲ' : 'No Temple Records Added Yet'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
            {isKannada
              ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ, ವೀರಭದ್ರೇಶ್ವರ ಅಥವಾ ಗ್ರಾಮ ದೇವತೆ ಸನ್ನಿಧಿಯ ಇತಿಹಾಸ ಮತ್ತು ಪೂಜಾ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ.'
              : 'Add temple history, daily darshan pooja timings, and annual jaatre dates for Muttagundi.'}
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} />
            <span>{isKannada ? 'ಮೊದಲ ದೇಗುಲ ಸೇರಿಸಿ' : 'Add First Temple'}</span>
          </button>
        </div>
      ) : (
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
      )}

      {/* Add Temple Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? '🛕 ಹೊಸ ದೇವಾಲಯದ ವಿವರ ಸೇರಿಸಿ' : '🛕 Add Temple Record'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTemple}>
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ದೇಗುಲದ ಹೆಸರು (English)' : 'Temple Name (English) *'}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Sri Ranganatha Swamy Temple"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ದೇಗುಲದ ಹೆಸರು (ಕನ್ನಡ)' : 'Temple Name (Kannada)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={nameKn}
                  onChange={(e) => setNameKn(e.target.value)}
                  placeholder="ಉದಾ: ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ ದೇವಾಲಯ"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಮುಖ್ಯ ದೇವರು / ಅಧಿದೇವತೆ' : 'Main Deity'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={deityEn}
                  onChange={(e) => setDeityEn(e.target.value)}
                  placeholder="e.g. Sri Ranganatha Swamy / Veerabhadreshwara"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಪೂಜಾ ಸಮಯ / ದರ್ಶನ' : 'Pooja / Darshan Timings'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={timingsEn}
                  onChange={(e) => setTimingsEn(e.target.value)}
                  placeholder="e.g. 6:30 AM - 12:00 PM & 5:30 PM - 8:30 PM"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಸ್ಥಳ / ವಿಳಾಸ' : 'Location'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={locationEn}
                  onChange={(e) => setLocationEn(e.target.value)}
                  placeholder="e.g. Car Street / Lake Bund, Muttagundi"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ದೇವಾಲಯದ ಇತಿಹಾಸ & ಹಿನ್ನೆಲೆ' : 'Temple History & Significance'}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={historyEn}
                  onChange={(e) => setHistoryEn(e.target.value)}
                  placeholder={isKannada ? 'ದೇಗುಲದ ಸಂಪ್ರದಾಯ, ಜಾತ್ರೆ ಮತ್ತು ಇತಿಹಾಸ...' : 'Historic origins, architecture, annual festival and traditions...'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary">
                  {isKannada ? 'ದೇಗುಲ ಉಳಿಸಿ (SAVE)' : 'Save Temple'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
