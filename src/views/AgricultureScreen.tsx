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
  TrendingUp
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

  useEffect(() => {
    return dbService.subscribeCrops(setCrops);
  }, []);

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

        {isAdmin && onOpenCreateCrop && (
          <button onClick={onOpenCreateCrop} className="btn-primary">
            <Plus size={18} />
            <span>{isKannada ? 'ಬೆಳೆ ಮಾಹಿತಿ ಸೇರಿಸಿ' : 'Add Crop Guide'}</span>
          </button>
        )}
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
    </div>
  );
};
