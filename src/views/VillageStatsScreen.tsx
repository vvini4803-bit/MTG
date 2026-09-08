import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { VillageStats } from '../types';
import {
  BarChart3,
  Users,
  Home,
  GraduationCap,
  Landmark,
  HeartPulse,
  Wheat,
  ShieldCheck,
  ExternalLink,
  Edit3,
  Save,
  CheckCircle2
} from 'lucide-react';

export const VillageStatsScreen: React.FC = () => {
  const { language, isKannada } = useLanguage();
  const { isAdmin, currentUser } = useAuth();
  const [stats, setStats] = useState<VillageStats>(dbService['villageStats']);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [pop, setPop] = useState(stats.population);
  const [hh, setHh] = useState(stats.households);
  const [area, setArea] = useState(stats.area_sqkm);
  const [schools, setSchools] = useState(stats.schools);
  const [temples, setTemples] = useState(stats.temples);
  const [hospitals, setHospitals] = useState(stats.hospitals);
  const [source, setSource] = useState(stats.source);

  useEffect(() => {
    return dbService.subscribeVillageStats((s) => {
      setStats(s);
      setPop(s.population);
      setHh(s.households);
      setArea(s.area_sqkm);
      setSchools(s.schools);
      setTemples(s.temples);
      setHospitals(s.hospitals);
      setSource(s.source);
    });
  }, []);

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await dbService.updateVillageStats(
      {
        population: Number(pop),
        households: Number(hh),
        area_sqkm: Number(area),
        schools: Number(schools),
        temples: Number(temples),
        hospitals: Number(hospitals),
        source: source
      },
      currentUser.name
    );
    setIsEditing(false);
  };

  const statCards = [
    { label_en: 'Total Population', label_kn: 'ಒಟ್ಟು ಜನಸಂಖ್ಯೆ', val: stats.population.toLocaleString(), icon: Users, color: '#10B981' },
    { label_en: 'Households', label_kn: 'ಒಟ್ಟು ಕುಟುಂಬಗಳು', val: stats.households.toLocaleString(), icon: Home, color: '#F59E0B' },
    { label_en: 'Geographic Area', label_kn: 'ಭೌಗೋಳಿಕ ವಿಸ್ತೀರ್ಣ', val: `${stats.area_sqkm} sq.km`, icon: Landmark, color: '#0284C7' },
    { label_en: 'Literacy Rate', label_kn: 'ಸಾಕ್ಷರತಾ ಪ್ರಮಾಣ', val: `${stats.literacy_rate}%`, icon: GraduationCap, color: '#8B5CF6' },
    { label_en: 'Educational Schools', label_kn: 'ಶಾಲೆಗಳು / ಶಿಕ್ಷಣ', val: stats.schools, icon: GraduationCap, color: '#14B8A6' },
    { label_en: 'Temples & Heritage', label_kn: 'ದೇವಾಲಯಗಳು', val: stats.temples, icon: Landmark, color: '#EC4899' },
    { label_en: 'Healthcare Centers', label_kn: 'ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು', val: stats.hospitals, icon: HeartPulse, color: '#EF4444' },
    { label_en: 'Agricultural Farmland', label_kn: 'ಕೃಷಿ ಭೂಮಿ (ಎಕರೆ)', val: `${stats.agricultural_land_acres} acres`, icon: Wheat, color: '#84CC16' }
  ];

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ಗ್ರಾಮದ ಅಧಿಕೃತ ಅಂಕಿಅಂಶ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Verified Village Data & Demographics'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಪಂಚಾಯತಿ ಆದಾಯ ದಾಖಲೆಗಳು ಮತ್ತು ಜನಗಣತಿಯಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಮಾಹಿತಿ'
              : 'Grounded municipal census and land records verified by village authorities'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
            style={{ height: '42px' }}
          >
            <Edit3 size={16} />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Official Stats'}</span>
          </button>
        )}
      </div>

      {/* Verification Stamp Box */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '4px solid var(--accent-emerald)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#10B981" />
            <strong style={{ fontSize: '0.9rem', color: '#34D399' }}>Official Verification Badge</strong>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Verified by: <strong>{stats.verified_by}</strong> • Source: <em>{stats.source}</em>
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Last Verified: <strong>{stats.last_verified}</strong>
        </div>
      </div>

      {/* Edit Form for Admin */}
      {isEditing && (
        <form onSubmit={handleSaveStats} className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', color: '#F59E0B' }}>
            Update Village Census & Public Assets
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Population</label>
              <input type="number" className="form-input" value={pop} onChange={(e) => setPop(Number(e.target.value))} />
            </div>
            <div>
              <label className="form-label">Households</label>
              <input type="number" className="form-input" value={hh} onChange={(e) => setHh(Number(e.target.value))} />
            </div>
            <div>
              <label className="form-label">Area (sq.km)</label>
              <input type="number" step="0.1" className="form-input" value={area} onChange={(e) => setArea(Number(e.target.value))} />
            </div>
            <div>
              <label className="form-label">Schools Count</label>
              <input type="number" className="form-input" value={schools} onChange={(e) => setSchools(Number(e.target.value))} />
            </div>
            <div>
              <label className="form-label">Temples Count</label>
              <input type="number" className="form-input" value={temples} onChange={(e) => setTemples(Number(e.target.value))} />
            </div>
            <div>
              <label className="form-label">Hospitals Count</label>
              <input type="number" className="form-input" value={hospitals} onChange={(e) => setHospitals(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Data Source Citation</label>
            <input type="text" className="form-input" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '8px 24px' }}>
            <Save size={16} />
            <span>Save Verified Statistics</span>
          </button>
        </form>
      )}

      {/* Statistics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="glass-card card-3d"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: `${c.color}20`,
                  border: `1px solid ${c.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={26} color={c.color} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  {isKannada ? c.label_kn : c.label_en}
                </span>
                <strong style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {c.val}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
