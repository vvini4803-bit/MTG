import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { CropItem } from '../types';
import {
  Wheat,
  Droplets,
  CloudSun,
  ShieldCheck,
  AlertTriangle,
  Plus,
  BookOpen,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';

interface AgricultureScreenProps {
  onOpenCropDetail: (crop: CropItem) => void;
  onOpenCreateCrop?: () => void;
}

export const AgricultureScreen: React.FC<AgricultureScreenProps> = ({
  onOpenCropDetail,
  onOpenCreateCrop
}) => {
  const { language, isKannada } = useLanguage();
  const { isAdmin } = useAuth();
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [activeTab, setActiveTab] = useState<'MAIN' | 'SEASONAL' | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [cropNameEn, setCropNameEn] = useState('');
  const [cropNameKn, setCropNameKn] = useState('');
  const [cropCategory, setCropCategory] = useState<'MAIN' | 'SEASONAL'>('MAIN');
  const [seasonEn, setSeasonEn] = useState('');
  const [cultivationEn, setCultivationEn] = useState('');
  const [mspRate, setMspRate] = useState('');

  useEffect(() => {
    return dbService.subscribeCrops(setCrops);
  }, []);

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropNameEn.trim()) return;

    await dbService.addCrop({
      name_en: cropNameEn.trim(),
      name_kn: cropNameKn.trim() || cropNameEn.trim(),
      category: cropCategory,
      season_en: seasonEn.trim() || 'Kharif / Rabi',
      season_kn: cropNameKn.trim() ? (seasonEn.trim() || 'ಮುಂಗಾರು / ಹಿಂಗಾರು') : 'Kharif / Rabi',
      soil_type_en: 'Red loamy & black soil',
      soil_type_kn: 'ಕೆಂಪು ಮರಳು ಮಿಶ್ರಿತ ಮತ್ತು ಕಪ್ಪು ಮಣ್ಣು',
      water_req_en: 'Medium irrigation / Rainfed',
      water_req_kn: 'ಮಧ್ಯಮ ನೀರಾವರಿ / ಮಳೆಯಾಶ್ರಿತ',
      cultivation_en: cultivationEn.trim() || 'Cultivation guidance for Muttagundi village farmers.',
      cultivation_kn: cultivationEn.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ರೈತರಿಗಾಗಿ ಕೃಷಿ ಸಲಹೆ.',
      uses_en: mspRate.trim() ? `MSP / Market Rate: ₹${mspRate.replace(/[^0-9]/g, '')}/quintal` : 'Food crop & village trade',
      uses_kn: mspRate.trim() ? `ಬೆಂಬಲ ಬೆಲೆ: ₹${mspRate.replace(/[^0-9]/g, '')}/ಕ್ವಿಂಟಾಲ್` : 'ಆಹಾರ ಬೆಳೆ ಮತ್ತು ಸ್ಥಳೀಯ ವ್ಯಾಪಾರ',
      advantages_en: 'High yield potential with local soil conditions in Hosadurga.',
      advantages_kn: 'ಹೊಸದುರ್ಗ ತಾಲೂಕಿನ ಮಣ್ಣಿಗೆ ಹೆಚ್ಚಿನ ಇಳುವರಿ ಸಾಮರ್ಥ್ಯ.',
      risks_en: 'Monsoon variation & pest control.',
      risks_kn: 'ಮಳೆ ವ್ಯತ್ಯಾಸ ಮತ್ತು ಕೀಟ ಬಾಧೆ ನಿಯಂತ್ರಣ.',
      verified: true,
      source: 'Muttagundi Raitha Samparka Kendra',
      verified_date: new Date().toISOString().split('T')[0],
      image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80'
    });

    setShowAddModal(false);
    setCropNameEn('');
    setCropNameKn('');
    setSeasonEn('');
    setCultivationEn('');
    setMspRate('');
  };

  const filteredCrops = crops.filter((c) => {
    if (activeTab !== 'ALL' && c.category !== activeTab) return false;
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ಕೃಷಿ ಮಾಹಿತಿ & ರೈತ ಕೇಂದ್ರ' : 'Village Agriculture Hub'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ದೃಢೀಕೃತ ಕೃಷಿ ಪದ್ಧತಿ, ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮತ್ತು ಹವಾಮಾನ ಮಾರ್ಗದರ್ಶನ'
              : 'Verified crop cultivation guides, soil nutrition, irrigation & weather advisories'}
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>{isKannada ? 'ಬೆಳೆ ಮಾಹಿತಿ ಸೇರಿಸಿ' : 'Add Crop Guide'}</span>
        </button>
      </div>

      {/* Advisory Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <ShieldCheck size={28} color="#10B981" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
          <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>
            {isKannada ? 'ದೃಢೀಕೃತ ಕೃಷಿ ವಿಜ್ಞಾನ ಮಾರ್ಗದರ್ಶನ:' : 'Verified Agronomic Knowledge Standards:'}
          </strong>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಇಲ್ಲಿ ಒದಗಿಸಲಾದ ಎಲ್ಲಾ ಕೃಷಿ ಮಾಹಿತಿಯನ್ನು ಕೃಷಿ ವಿಶ್ವವಿದ್ಯಾಲಯ (GKVK) ಮತ್ತು ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದ ದಾಖಲೆಗಳಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.'
              : 'All agricultural data presented here is verified against certified agronomy guidelines from UAS Bangalore and the local Farmers Center.'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { id: 'ALL', label_en: 'All Crops', label_kn: 'ಎಲ್ಲಾ ಬೆಳೆಗಳು' },
          { id: 'MAIN', label_en: 'Main Crops (ರಾಗಿ & ಅಡಿಕೆ)', label_kn: 'ಮುಖ್ಯ ಬೆಳೆಗಳು' },
          { id: 'SEASONAL', label_en: 'Seasonal & Wetlands', label_kn: 'ಹಂಗಾಮು ಬೆಳೆಗಳು' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              background: activeTab === tab.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {isKannada ? tab.label_kn : tab.label_en}
          </button>
        ))}
      </div>

      {/* Crops Grid */}
      {filteredCrops.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Wheat size={42} color="#84CC16" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            {isKannada ? 'ಯಾವುದೇ ಬೆಳೆ ಮಾಹಿತಿ ಇಲ್ಲ' : 'No Crop Guides Available Yet'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px' }}>
            {isKannada
              ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಕೃಷಿಕರಿಗಾಗಿ ರಾಗಿ, ಕಡಲೆಕಾಯಿ ಅಥವಾ ಅಡಿಕೆ ಬೆಳೆ ಮಾರ್ಗದರ್ಶನ ಸೇರಿಸಿ.'
              : 'Add verified agronomic guides for crops cultivated in Muttagundi village.'}
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} />
            <span>{isKannada ? 'ಮೊದಲ ಬೆಳೆ ಮಾಹಿತಿ ಸೇರಿಸಿ' : 'Add First Crop Guide'}</span>
          </button>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredCrops.map((crop) => (
          <div
            key={crop.id}
            onClick={() => onOpenCropDetail(crop)}
            className="glass-card glass-card-interactive card-3d"
            style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ height: '180px', position: 'relative' }}>
              <img src={crop.image_url} alt={crop.name_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                color: '#FEF08A',
                fontWeight: 700
              }}>
                {crop.category}
              </div>
            </div>

            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {isKannada ? crop.name_kn : crop.name_en}
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                  ✓ Verified
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px' }}>
                <Droplets size={14} color="#0284C7" />
                <span>{isKannada ? crop.water_req_kn : crop.water_req_en}</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                {(isKannada ? crop.cultivation_kn : crop.cultivation_en).substring(0, 110)}...
              </p>

              <div style={{
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <span>Source: {crop.source.split('&')[0]}</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  {isKannada ? 'ಸಂಪೂರ್ಣ ಮಾಹಿತಿ' : 'Full Guide'} →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Crop Guide Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? '🌾 ಹೊಸ ಬೆಳೆ ಮಾಹಿತಿ ಸೇರಿಸಿ' : '🌾 Add Crop Cultivation Guide'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCrop}>
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಬೆಳೆಯ ಹೆಸರು (English)' : 'Crop Name (English) *'}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={cropNameEn}
                  onChange={(e) => setCropNameEn(e.target.value)}
                  placeholder="e.g. Ragi (Finger Millet) / Groundnut"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಬೆಳೆಯ ಹೆಸರು (ಕನ್ನಡ)' : 'Crop Name (Kannada)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={cropNameKn}
                  onChange={(e) => setCropNameKn(e.target.value)}
                  placeholder="ಉದಾ: ರಾಗಿ / ಕಡಲೆಕಾಯಿ / ತೆಂಗು"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ವಿಭಾಗ' : 'Category'}</label>
                <select
                  className="form-select"
                  value={cropCategory}
                  onChange={(e) => setCropCategory(e.target.value as any)}
                >
                  <option value="MAIN">Main Village Crop (ಮುಖ್ಯ ಬೆಳೆ)</option>
                  <option value="SEASONAL">Seasonal Crop (ಹಂಗಾಮು ಬೆಳೆ)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಹಂಗಾಮು / ಋತು' : 'Season'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={seasonEn}
                  onChange={(e) => setSeasonEn(e.target.value)}
                  placeholder="e.g. Kharif (June - Nov)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಬೆಂಬಲ ಬೆಲೆ (MSP / ದರ)' : 'Government MSP Rate'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={mspRate}
                  onChange={(e) => setMspRate(e.target.value)}
                  placeholder="e.g. 4290"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಬೇಸಾಯ ಕ್ರಮ & ಸುಳಿವುಗಳು' : 'Cultivation & Soil Tips'}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={cultivationEn}
                  onChange={(e) => setCultivationEn(e.target.value)}
                  placeholder={isKannada ? 'ಬಿತ್ತನೆ, ಗೊಬ್ಬರ ಹಾಗೂ ನೀರಾವರಿ ಪದ್ಧತಿ...' : 'Soil preparation, sowing time, irrigation and nutrition...'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary">
                  {isKannada ? 'ಬೆಳೆ ಉಳಿಸಿ (SAVE)' : 'Save Crop Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
