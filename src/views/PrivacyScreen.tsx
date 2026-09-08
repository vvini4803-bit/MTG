import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const PrivacyScreen: React.FC = () => {
  const { isKannada } = useLanguage();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'PRIVACY' | 'TERMS' | 'GUIDELINES'>('PRIVACY');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = () => {
    setIsExporting(true);
    const data = dbService.exportCompleteDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gramasiri-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const handleDeleteAccount = () => {
    if (confirm(isKannada ? 'ಖಾತೆ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಎಲ್ಲಾ ವೈಯಕ್ತಿಕ ವಿವರಗಳು ಅಳಿಸಲ್ಪಡುತ್ತವೆ.' : 'Are you sure you want to delete your account? All private records will be erased.')) {
      logout();
      alert(isKannada ? 'ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.' : 'Your account has been deactivated.');
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ಗೌಪ್ಯತಾ ನೀತಿ & ಸಮುದಾಯ ನಿಯಮಗಳು' : 'Privacy Policy, Terms & Guidelines'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada
            ? 'ನಾಗರಿಕರ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ ರಕ್ಷಣೆ ಹಾಗೂ ಸಭ್ಯ ನಡವಳಿಕೆಯ ತತ್ವಗಳು'
            : 'Citizen data protection principles and respectful digital village conduct'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'PRIVACY', label_en: 'Privacy Policy', label_kn: 'ಗೌಪ್ಯತಾ ನೀತಿ' },
          { id: 'TERMS', label_en: 'Terms of Use', label_kn: 'ಬಳಕೆಯ ನಿಯಮಗಳು' },
          { id: 'GUIDELINES', label_en: 'Community Code', label_kn: 'ಸಮುದಾಯ ಸಂಹಿತೆ' }
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

      {/* Content Document */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '28px', lineHeight: 1.7, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {activeTab === 'PRIVACY' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Citizen Privacy & Data Protection Manifesto
            </h3>
            <p style={{ marginBottom: '12px' }}>
              1. <strong>Private Contact Shield:</strong> Mobile phone numbers, residential addresses, and email identifiers are never exposed publicly on community feeds or search results without explicit citizen consent.
            </p>
            <p style={{ marginBottom: '12px' }}>
              2. <strong>Zero Data Monetization:</strong> Gramasiri does not sell, trade, or share resident data with third-party advertising networks or commercial brokers.
            </p>
            <p style={{ marginBottom: '12px' }}>
              3. <strong>Right to Portability & Deletion:</strong> Any resident can download a complete portable copy of their activity records or request complete account erasure at any time.
            </p>
          </div>
        )}

        {activeTab === 'TERMS' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Terms of Super App Access
            </h3>
            <p style={{ marginBottom: '12px' }}>
              1. <strong>Responsible Submission:</strong> Citizens agree never to submit fabricated news, defamatory claims, altered photographs, or unauthorized emergency alerts.
            </p>
            <p style={{ marginBottom: '12px' }}>
              2. <strong>Verification Authority:</strong> The Gram Panchayat administration and authorized moderators reserve the sole right to review, edit corrections, or remove misinformation.
            </p>
          </div>
        )}

        {activeTab === 'GUIDELINES' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Community Etiquette Code
            </h3>
            <p style={{ marginBottom: '12px' }}>
              1. <strong>Mutual Respect:</strong> Maintain decency and dignity in discussions and comments across all wards, communities, and sporting events.
            </p>
            <p style={{ marginBottom: '12px' }}>
              2. <strong>Rumor Prevention:</strong> Always tag unverified rumors as "Community Report", never claim official government stamp without confirmation.
            </p>
          </div>
        )}
      </div>

      {/* Citizen Rights Actions */}
      {currentUser && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <strong style={{ fontSize: '0.92rem', color: '#FFFFFF', display: 'block' }}>
              Citizen Data Rights Management
            </strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Export your activity dump or delete your resident account
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportData} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
              <Download size={14} />
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </button>

            <button onClick={handleDeleteAccount} className="btn-danger" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
              <Trash2 size={14} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
