import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { X, Flag, AlertCircle, ShieldCheck } from 'lucide-react';

interface SubmitReportModalProps {
  isOpen: boolean;
  itemType: 'POST' | 'COMMENT' | 'USER' | 'MEDIA';
  itemId: string;
  itemTitle?: string;
  onClose: () => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  itemType,
  itemId,
  itemTitle,
  onClose
}) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('MISINFORMATION');
  const [customNotes, setCustomNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    await dbService.createReport({
      item_type: itemType,
      item_id: itemId,
      item_title: itemTitle,
      reporter_id: currentUser.uid,
      reporter_name: currentUser.name,
      reason: `${reason}: ${customNotes.trim()}`
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flag size={18} color="#EF4444" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {isKannada ? 'ವಿಷಯ ವರದಿ ಮಾಡಿ' : 'Report Content to Moderators'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#10B981' }}>
            <ShieldCheck size={40} style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Report Received</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Village moderators have been alerted and will review this content.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Reporting {itemType}: <strong>"{itemTitle || itemId}"</strong>
            </p>

            <div className="form-group">
              <label className="form-label">{isKannada ? 'ವರದಿಯ ಕಾರಣ' : 'Reason for Report *'}</label>
              <select
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="MISINFORMATION">Unverified Misinformation / Rumor (ವದಂತಿ)</option>
                <option value="ABUSIVE_LANGUAGE">Disrespectful / Abusive Language (ಅಸಭ್ಯ ಭಾಷೆ)</option>
                <option value="INAPPROPRIATE_MEDIA">Inappropriate / Unrelated Media (ಅಸಂಬದ್ಧ ಫೋಟೋ)</option>
                <option value="SPAM">Commercial Spam / Duplicate (ಸ್ಪ್ಯಾಮ್)</option>
                <option value="OTHER">Other Reason (ಇತರ ಕಾರಣ)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{isKannada ? 'ಹೆಚ್ಚುವರಿ ವಿವರಗಳು' : 'Additional Evidence / Details'}</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Explain what is misleading or incorrect..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-danger">
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
