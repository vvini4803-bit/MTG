import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { ReportItem } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ContentModerationScreenProps {
  onBack: () => void;
}

export const ContentModerationScreen: React.FC<ContentModerationScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    return dbService.subscribeReports(setReports);
  }, []);

  const handleResolve = async (id: string, action: 'RESOLVED' | 'DISMISSED') => {
    await dbService.resolveReport(id, action);
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
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

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Content Moderation & Incident Audit</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Review citizen flags, investigate potential spam or abusive remarks, and protect community integrity
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reports.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <p>All reports have been resolved. The platform is clean and in order.</p>
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              className="glass-card"
              style={{
                padding: '20px',
                borderLeft: rep.status === 'PENDING' ? '4px solid #EF4444' : '4px solid #10B981'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className={rep.status === 'PENDING' ? 'badge badge-urgent' : 'badge badge-verified'}>
                  {rep.status}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Filed: {rep.created_at}
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Target {rep.item_type}: "{rep.item_title || rep.item_id}"
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Reported Reason: <strong>{rep.reason}</strong>
              </p>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Reported by Citizen: <strong>{rep.reporter_name}</strong> (ID: {rep.reporter_id})
              </div>

              {rep.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleResolve(rep.id, 'RESOLVED')}
                    className="btn-danger"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
                  >
                    <Trash2 size={14} />
                    <span>Take Down Content & Resolve</span>
                  </button>

                  <button
                    onClick={() => handleResolve(rep.id, 'DISMISSED')}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
                  >
                    <XCircle size={14} />
                    <span>Dismiss Flag (Valid Content)</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
