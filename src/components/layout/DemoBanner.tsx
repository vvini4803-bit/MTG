import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Database, AlertTriangle, ShieldCheck } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const [isDemo, setIsDemo] = useState(dbService.getDemoMode());
  const { isKannada } = useLanguage();
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Poll or listen for demo mode updates
    const check = () => setIsDemo(dbService.getDemoMode());
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const handleToggle = () => {
    const nextState = !isDemo;
    dbService.setDemoMode(nextState);
    setIsDemo(nextState);
  };

  if (!isDemo) {
    return (
      <div style={{
        background: 'linear-gradient(90deg, #064E3B 0%, #0F5132 100%)',
        color: '#A7F3D0',
        padding: '6px 16px',
        fontSize: '0.78rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(16, 185, 129, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={14} color="#34D399" />
          <span>
            {isKannada
              ? 'ಉತ್ಪಾದನಾ ಮೋಡ್ ಸಕ್ರಿಯ: ನೈಜ ಗ್ರಾಮ ದಾಖಲೆಗಳು ಮಾತ್ರ ಲಭ್ಯ.'
              : 'PRODUCTION MODE ACTIVE: Real verified village records only.'}
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={handleToggle}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#FFFFFF',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            {isKannada ? 'ಡೆಮೊ ಡೇಟಾ ಲೋಡ್ ಮಾಡಿ' : 'Load Demo Data'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, #78350F 0%, #B45309 100%)',
      color: '#FEF3C7',
      padding: '6px 16px',
      fontSize: '0.78rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          background: '#DC2626',
          color: '#FFFFFF',
          fontWeight: 800,
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          letterSpacing: '0.05em'
        }}>
          DEMO DATA
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={13} />
          {isKannada
            ? 'ಅಭಿವೃದ್ಧಿ ಮೋಡ್: ಮಾದರಿ ಡೆಮೊ ಡೇಟಾ ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : 'Development Mode: Displaying labeled sample data.'}
        </span>
      </div>
      {isAdmin && (
        <button
          onClick={handleToggle}
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(254, 243, 199, 0.4)',
            color: '#FFFFFF',
            borderRadius: '4px',
            padding: '2px 10px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Switch to clean production mode where unverified fields show 'Information not available yet'"
        >
          <Database size={11} />
          {isKannada ? 'ನೈಜ ಉತ್ಪಾದನಾ ಮೋಡ್‌ಗೆ ಬದಲಾಯಿಸಿ' : 'Switch to Real Prod Mode'}
        </button>
      )}
    </div>
  );
};
