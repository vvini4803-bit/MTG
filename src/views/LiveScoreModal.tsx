import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Tournament, MatchItem } from '../types';
import { X, Radio, Edit3, CheckCircle, Save } from 'lucide-react';

interface LiveScoreModalProps {
  tournament: Tournament | null;
  match: MatchItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveScoreModal: React.FC<LiveScoreModalProps> = ({
  tournament,
  match,
  isOpen,
  onClose
}) => {
  const { isKannada } = useLanguage();
  const { isSportsOrganizer } = useAuth();

  const [teamAScore, setTeamAScore] = useState(match?.team_a_score || '');
  const [teamBScore, setTeamBScore] = useState(match?.team_b_score || '');
  const [statusEn, setStatusEn] = useState(match?.current_status_en || '');
  const [statusKn, setStatusKn] = useState(match?.current_status_kn || '');
  const [summaryEn, setSummaryEn] = useState(match?.summary_en || '');
  const [isLive, setIsLive] = useState(match?.is_live || false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !match || !tournament) return null;

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await dbService.updateMatchScore(tournament.id, match.id, {
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      current_status_en: statusEn,
      current_status_kn: statusKn || statusEn,
      summary_en: summaryEn,
      summary_kn: summaryEn,
      is_live: isLive
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {match.is_live && (
              <span className="badge badge-urgent" style={{ fontSize: '0.68rem' }}>
                <Radio size={12} />
                LIVE SCOREBOARD
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {tournament.name_en}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Big Match Scorecard */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(2, 132, 199, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>{match.team_a}</h3>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FEF08A' }}>
                {match.team_a_score}
              </span>
            </div>

            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              VS
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>{match.team_b}</h3>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FEF08A' }}>
                {match.team_b_score}
              </span>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#86EFAC',
            display: 'inline-block'
          }}>
            {isKannada ? match.current_status_kn : match.current_status_en}
          </div>

          {match.summary_en && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              {isKannada ? match.summary_kn : match.summary_en}
            </p>
          )}

          {/* Performers */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {match.top_scorer && <span>🏏 Batsman: <strong>{match.top_scorer}</strong></span>}
            {match.top_bowler && <span>🎯 Bowler: <strong>{match.top_bowler}</strong></span>}
            {match.raider_points && <span>🤼 Raider: <strong>{match.raider_points}</strong></span>}
          </div>
        </div>

        {/* Authorized Sports Organizer Score Updater Form */}
        {isSportsOrganizer && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Edit3 size={15} color="#F59E0B" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FBBF24' }}>
                {isKannada ? 'ಲೈವ್ ಸ್ಕೋರ್ ನವೀಕರಣ ಪ್ಯಾನೆಲ್ (ಆಯೋಜಕರಿಗೆ ಮಾತ್ರ)' : 'Live Score Editor (Sports Organizer)'}
              </span>
            </div>

            <form onSubmit={handleUpdateScore}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">{match.team_a} Score</label>
                  <input
                    type="text"
                    className="form-input"
                    value={teamAScore}
                    onChange={(e) => setTeamAScore(e.target.value)}
                    placeholder="e.g. 118/4 (10 ov)"
                  />
                </div>
                <div>
                  <label className="form-label">{match.team_b} Score</label>
                  <input
                    type="text"
                    className="form-input"
                    value={teamBScore}
                    onChange={(e) => setTeamBScore(e.target.value)}
                    placeholder="e.g. 92/6 (8.2 ov)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Current Match Status Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={statusEn}
                  onChange={(e) => setStatusEn(e.target.value)}
                  placeholder="e.g. Needs 27 runs in 10 balls"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Commentary Summary</label>
                <input
                  type="text"
                  className="form-input"
                  value={summaryEn}
                  onChange={(e) => setSummaryEn(e.target.value)}
                  placeholder="e.g. Chethan Gowda batting on 34* (18b)"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="checkbox"
                  id="live-toggle"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                />
                <label htmlFor="live-toggle" style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 600 }}>
                  Mark Match as Currently LIVE (broadcasts red banner)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {savedSuccess && (
                  <span style={{ fontSize: '0.78rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Score updated live!
                  </span>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving}
                  style={{ marginLeft: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <Save size={15} />
                  <span>{isSaving ? 'Updating...' : 'Save Live Score'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
