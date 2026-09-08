import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { ReportItem } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Flag,
  AlertCircle
} from 'lucide-react';

interface ReportsScreenProps {
  // Can be viewed standalone or triggered
}

export const ReportsScreen: React.FC<ReportsScreenProps> = () => {
  const { isKannada } = useLanguage();
  const { isModerator, currentUser } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    return dbService.subscribeReports(setReports);
  }, []);

  const handleResolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    await dbService.resolveReport(id, status);
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '840px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ವರದಿಗಳು & ಸಮುದಾಯ ಪರಿಶೀಲನೆ' : 'Content Reports & Grievance Desk'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada
            ? 'ತಪ್ಪು ಮಾಹಿತಿ, ಅಸಭ್ಯ ವಿಷಯ ಅಥವಾ ನಕಲಿ ಪ್ರಕಟಣೆಗಳ ಮೇಲಿನ ಕ್ರಮಗಳ ದಾಖಲೆ'
            : 'Track community reports on misinformation, inappropriate media, and resolution audits'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {reports.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <p>{isKannada ? 'ಯಾವುದೇ ಬಾಕಿ ವರದಿಗಳಿಲ್ಲ' : 'No active reports or complaints pending'}</p>
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              className="glass-card"
              style={{
                padding: '20px',
                borderLeft: rep.status === 'PENDING' ? '4px solid #F59E0B' : '4px solid #10B981'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className={rep.status === 'PENDING' ? 'badge badge-pending' : 'badge badge-verified'}>
                  {rep.status}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {rep.created_at.split('T')[0]}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>
                Reported {rep.item_type}: {rep.item_title || rep.item_id}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Reason: <strong>{rep.reason}</strong>
              </p>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '14px' }}>
                Filed by: {rep.reporter_name}
              </span>

              {isModerator && rep.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleResolve(rep.id, 'RESOLVED')}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Resolve & Take Action</span>
                  </button>

                  <button
                    onClick={() => handleResolve(rep.id, 'DISMISSED')}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
                  >
                    <XCircle size={14} />
                    <span>Dismiss False Report</span>
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
