import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import {
  Database,
  ArrowLeft,
  Upload,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface VillageDataManagementScreenProps {
  onBack: () => void;
}

export const VillageDataManagementScreen: React.FC<VillageDataManagementScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const [isDemo, setIsDemo] = useState(dbService.getDemoMode());
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleToggleDemoMode = () => {
    const next = !isDemo;
    dbService.setDemoMode(next);
    setIsDemo(next);
  };

  const handleExport = () => {
    const jsonStr = dbService.exportCompleteDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gramasiri-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const res = dbService.importDatabase(importJsonText);
    setImportStatus(res.message);
    if (res.success) {
      setImportJsonText('');
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '840px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent-emerald)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          marginBottom: '16px'
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Admin Hub</span>
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          Village Data Controller & Production Switch
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Toggle between development sample data and real municipal production state, or import records
        </p>
      </div>

      {/* Production vs Demo Mode Switcher Card */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '28px',
          border: isDemo ? '1px solid #F59E0B' : '1px solid #10B981'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Database size={20} color={isDemo ? '#F59E0B' : '#10B981'} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {isDemo ? 'Development Demo Mode: ON' : 'Production Real-Data Mode: ACTIVE'}
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
              {isDemo
                ? 'Displaying labeled sample seed data for festivals, news, and sports. Switch to Production to remove sample records so unverified fields display "Information not available yet".'
                : 'Zero sample data. All fields display verified municipal records or indicate "Awaiting verification".'}
            </p>
          </div>

          <button
            onClick={handleToggleDemoMode}
            className={isDemo ? 'btn-primary' : 'btn-gold'}
            style={{ padding: '10px 20px' }}
          >
            {isDemo ? 'Switch to Real Production Mode' : 'Restore Demo Test Data'}
          </button>
        </div>
      </div>

      {/* Export / Backup Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
              Export Complete Village Database
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Download a complete verified JSON backup of all news, events, crops, temples, and statistics
            </p>
          </div>
          <button onClick={handleExport} className="btn-secondary" style={{ padding: '8px 18px' }}>
            <Download size={16} />
            <span>Download Backup (JSON)</span>
          </button>
        </div>
      </div>

      {/* Real Data Import Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
          Import Real Municipal / Panchayat Data
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Paste verified JSON data exported from municipal revenue or agricultural portals to update database collections
        </p>

        {importStatus && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: '#34D399',
              fontSize: '0.82rem',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="form-group">
          <textarea
            className="form-textarea"
            rows={5}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder='{"village_stats": { ... }, "news": [ ... ], "crops": [ ... ]}'
          />
        </div>

        <button
          onClick={handleImport}
          className="btn-primary"
          disabled={!importJsonText.trim()}
          style={{ padding: '8px 20px' }}
        >
          <Upload size={16} />
          <span>Validate & Import Data</span>
        </button>
      </div>
    </div>
  );
};
