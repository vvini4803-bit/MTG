import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Tournament } from '../types';
import { X, Trophy, Award, Shield } from 'lucide-react';

interface TournamentDetailModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({
  tournament,
  isOpen,
  onClose
}) => {
  const { language, isKannada } = useLanguage();

  if (!isOpen || !tournament) return null;

  const title = language === 'kn' ? tournament.name_kn : tournament.name_en;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Participating Teams Badges */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
            {isKannada ? 'ಭಾಗವಹಿಸುವ ತಂಡಗಳು' : 'Participating Teams'}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tournament.teams.map((team) => (
              <span
                key={team.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${team.color}50`,
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: team.color }} />
                <span>{isKannada ? team.name_kn : team.name_en}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({team.captain_en})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Points Table */}
        {tournament.points_table.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
              {isKannada ? 'ಅಂಕಪಟ್ಟಿ (Points Table)' : 'Standings & Points Table'}
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px' }}>Team</th>
                    <th style={{ padding: '8px' }}>P</th>
                    <th style={{ padding: '8px' }}>W</th>
                    <th style={{ padding: '8px' }}>L</th>
                    <th style={{ padding: '8px' }}>PTS</th>
                    <th style={{ padding: '8px' }}>NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.points_table.map((row, idx) => (
                    <tr key={row.team_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: idx < 2 ? '#34D399' : 'var(--text-primary)' }}>
                        {idx + 1}. {row.team_name}
                      </td>
                      <td style={{ padding: '8px' }}>{row.played}</td>
                      <td style={{ padding: '8px' }}>{row.won}</td>
                      <td style={{ padding: '8px' }}>{row.lost}</td>
                      <td style={{ padding: '8px', fontWeight: 800, color: '#FEF08A' }}>{row.points}</td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{row.nrr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fixtures list */}
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
            {isKannada ? 'ಪಂದ್ಯಗಳ ಪಟ್ಟಿ' : 'Match Schedule & Results'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tournament.matches.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>{m.team_a} vs {m.team_b}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                    {m.date} at {m.venue}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, color: '#FEF08A' }}>{m.team_a_score} - {m.team_b_score}</span>
                  <span style={{ fontSize: '0.7rem', color: m.is_live ? '#EF4444' : 'var(--text-muted)', display: 'block' }}>
                    {m.is_live ? '🔴 LIVE' : 'Scheduled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
