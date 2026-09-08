import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import { Tournament, SportType } from '../types';
import { Trophy, Plus, ArrowLeft, Users, Calendar } from 'lucide-react';

interface TournamentManagementScreenProps {
  onBack: () => void;
}

export const TournamentManagementScreen: React.FC<TournamentManagementScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportType>('CRICKET');
  const [year, setYear] = useState(2026);

  useEffect(() => {
    return dbService.subscribeTournaments(setTournaments);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await dbService.addTournament({
      name_en: name,
      name_kn: name,
      sport,
      year: Number(year),
      status: 'UPCOMING',
      teams: [
        { id: 't_demo1', name_en: 'North Stars', name_kn: 'ಉತ್ತರ ಸ್ಟಾರ್ಸ್', captain_en: 'Sunil G', color: '#10B981' },
        { id: 't_demo2', name_en: 'South Warriors', name_kn: 'ದಕ್ಷಿಣ ವಾರಿಯರ್ಸ್', captain_en: 'Kiran K', color: '#F59E0B' }
      ],
      points_table: [],
      matches: []
    });

    setName('');
    setShowCreateModal(false);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Sports League & Tournament Management</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Configure tournaments, assign referees, manage team rosters, and schedule fixtures
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>Create New League</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {tournaments.map((t) => (
          <div key={t.id} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge badge-verified">{t.status}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.sport} • {t.year}</span>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              {t.name_en}
            </h3>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {t.teams.length} participating teams • {t.matches.length} scheduled fixtures
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {t.teams.map((team) => (
                <span
                  key={team.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${team.color}50`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}
                >
                  {team.name_en}
                </span>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                Scorekeeper Assigned: Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              Create Tournament
            </h3>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">League / Cup Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gramasiri Volleyball Cup 2026"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Sport Discipline</label>
                  <select
                    className="form-select"
                    value={sport}
                    onChange={(e) => setSport(e.target.value as SportType)}
                  >
                    <option value="CRICKET">Cricket (ಕ್ರಿಕೆಟ್)</option>
                    <option value="KABADDI">Kabaddi (ಕಬಡ್ಡಿ)</option>
                    <option value="VOLLEYBALL">Volleyball (ವಾಲಿಬಾಲ್)</option>
                    <option value="FOOTBALL">Football (ಫುಟ್ಬಾಲ್)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    className="form-input"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Launch Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
