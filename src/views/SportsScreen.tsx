import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Tournament, MatchItem, SportType } from '../types';
import {
  Trophy,
  Radio,
  Flame,
  Calendar,
  ChevronRight,
  Edit3,
  Award,
  Users,
  Plus,
  X
} from 'lucide-react';

interface SportsScreenProps {
  onOpenTournamentDetail: (tournament: Tournament) => void;
  onOpenLiveScoreModal: (tournament: Tournament, match: MatchItem) => void;
}

export const SportsScreen: React.FC<SportsScreenProps> = ({
  onOpenTournamentDetail,
  onOpenLiveScoreModal
}) => {
  const { language, isKannada } = useLanguage();
  const { isSportsOrganizer } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournName, setTournName] = useState('');
  const [sportType, setSportType] = useState<SportType>('CRICKET');
  const [year, setYear] = useState(2026);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [venue, setVenue] = useState('');

  useEffect(() => {
    return dbService.subscribeTournaments(setTournaments);
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournName.trim()) return;

    const t1 = team1.trim() || (isKannada ? 'ತಂಡ ೧' : 'Team A');
    const t2 = team2.trim() || (isKannada ? 'ತಂಡ ೨' : 'Team B');

    await dbService.addTournament({
      name_en: tournName.trim(),
      name_kn: tournName.trim(),
      sport: sportType,
      year: Number(year) || 2026,
      status: 'UPCOMING',
      teams: [
        { id: 'team_' + Date.now() + '_1', name_en: t1, name_kn: t1, captain_en: 'Captain 1', color: '#10B981' },
        { id: 'team_' + Date.now() + '_2', name_en: t2, name_kn: t2, captain_en: 'Captain 2', color: '#F59E0B' }
      ],
      points_table: [],
      matches: [
        {
          id: 'match_' + Date.now(),
          tournament_id: 'tourn_' + Date.now(),
          sport: sportType,
          team_a: t1,
          team_b: t2,
          team_a_score: '0/0',
          team_b_score: '0/0',
          date: new Date().toISOString().split('T')[0],
          time: '04:00 PM',
          venue: venue.trim() || 'Muttagundi Sports Ground',
          is_live: false,
          current_status_en: 'Match scheduled',
          current_status_kn: 'ಪಂದ್ಯ ನಿಗದಿಯಾಗಿದೆ',
          summary_en: 'Upcoming village clash',
          summary_kn: 'ಮುಂಬರುವ ಗ್ರಾಮ ಪಂದ್ಯ',
          last_updated: new Date().toISOString()
        }
      ]
    });

    setShowCreateModal(false);
    setTournName('');
    setTeam1('');
    setTeam2('');
    setVenue('');
  };

  const sportsTabs: Array<{ id: SportType | 'ALL'; label_en: string; label_kn: string }> = [
    { id: 'ALL', label_en: 'All Sports', label_kn: 'ಎಲ್ಲಾ ಕ್ರೀಡೆಗಳು' },
    { id: 'CRICKET', label_en: '🏏 Cricket', label_kn: '🏏 ಕ್ರಿಕೆಟ್' },
    { id: 'KABADDI', label_en: '🤼 Kabaddi', label_kn: '🤼 ಕಬಡ್ಡಿ' },
    { id: 'VOLLEYBALL', label_en: '🏐 Volleyball', label_kn: '🏐 ವಾಲಿಬಾಲ್' },
    { id: 'FOOTBALL', label_en: '⚽ Football', label_kn: '⚽ ಫುಟ್ಬಾಲ್' }
  ];

  const filteredTournaments = tournaments.filter((t) => {
    if (selectedSport !== 'ALL' && t.sport !== selectedSport) return false;
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ಗ್ರಾಮ ಕ್ರೀಡಾ ಹಬ್ & ಲೈವ್ ಸ್ಕೋರ್' : 'Village Sports & Tournaments'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಗ್ರಾಮೋತ್ಸವ ಕ್ರಿಕೆಟ್ ಲೀಗ್, ಕಬಡ್ಡಿ ಪಂದ್ಯಾವಳಿ ಮತ್ತು ನೇರ ಪ್ರಸಾರ'
              : 'Cricket challenges, Kabaddi cups, fixtures & live ball-by-ball scoreboards'}
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>{isKannada ? 'ಪಂದ್ಯಾವಳಿ ಸೇರಿಸಿ' : 'Add Tournament'}</span>
        </button>
      </div>

      {/* Sport Selector Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        {sportsTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedSport(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              background: selectedSport === tab.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: selectedSport === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: selectedSport === tab.id ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isKannada ? tab.label_kn : tab.label_en}
          </button>
        ))}
      </div>

      {/* Tournaments List */}
      {filteredTournaments.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Trophy size={42} color="#F59E0B" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            {isKannada ? 'ಯಾವುದೇ ಪಂದ್ಯಾವಳಿಗಳಿಲ್ಲ' : 'No Tournaments Scheduled Yet'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
            {isKannada
              ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಕ್ರಿಕೆಟ್, ಕಬಡ್ಡಿ ಅಥವಾ ವಾಲಿಬಾಲ್ ಪಂದ್ಯಾವಳಿಗಳನ್ನು ಹೊಸದಾಗಿ ಆಯೋಜಿಸಿ.'
              : 'Add village cricket, kabaddi, or volleyball tournaments and live ball-by-ball scoreboards.'}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} />
            <span>{isKannada ? 'ಮೊದಲ ಪಂದ್ಯಾವಳಿ ಸೇರಿಸಿ' : 'Add First Tournament'}</span>
          </button>
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {filteredTournaments.map((tourn) => (
          <div key={tourn.id} className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trophy size={22} color="#F59E0B" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {isKannada ? tourn.name_kn : tourn.name_en}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {tourn.sport} • {tourn.year} • {tourn.teams.length} Teams
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>
                  {tourn.status}
                </span>
                <button
                  onClick={() => onOpenTournamentDetail(tourn)}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '34px' }}
                >
                  <span>{isKannada ? 'ಪಾಯಿಂಟ್ಸ್ ಟೇಬಲ್ & ವೇಳಾಪಟ್ಟಿ' : 'Points Table & Fixtures'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Matches in Tournament */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {tourn.matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => onOpenLiveScoreModal(tourn, match)}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: match.is_live ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    {match.is_live ? (
                      <span className="badge badge-urgent" style={{ fontSize: '0.65rem' }}>
                        <Radio size={11} />
                        LIVE SCORE
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {match.date} • {match.time}
                      </span>
                    )}

                    {isSportsOrganizer && (
                      <span style={{ fontSize: '0.7rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Edit3 size={11} /> Edit Score
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{match.team_a}</span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FEF08A' }}>
                      {match.team_a_score}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{match.team_b}</span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FEF08A' }}>
                      {match.team_b_score}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: match.is_live ? '#86EFAC' : 'var(--text-muted)', lineHeight: 1.4 }}>
                    {isKannada ? match.current_status_kn : match.current_status_en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? '🏏 ಹೊಸ ಕ್ರೀಡಾ ಪಂದ್ಯಾವಳಿ ಸೇರಿಸಿ' : '🏏 Create Tournament / League'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTournament}>
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಪಂದ್ಯಾವಳಿಯ ಹೆಸರು' : 'Tournament Title *'}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={tournName}
                  onChange={(e) => setTournName(e.target.value)}
                  placeholder="e.g. Muttagundi Cricket League 2026"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಕ್ರೀಡೆ' : 'Sport'}</label>
                <select
                  className="form-select"
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value as SportType)}
                >
                  <option value="CRICKET">🏏 Cricket (ಕ್ರಿಕೆಟ್)</option>
                  <option value="KABADDI">🤼 Kabaddi (ಕಬಡ್ಡಿ)</option>
                  <option value="VOLLEYBALL">🏐 Volleyball (ವಾಲಿಬಾಲ್)</option>
                  <option value="FOOTBALL">⚽ Football (ಫುಟ್ಬಾಲ್)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ವರ್ಷ' : 'Year'}</label>
                <input
                  type="number"
                  className="form-input"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">{isKannada ? 'ತಂಡ ೧' : 'Team 1'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={team1}
                    onChange={(e) => setTeam1(e.target.value)}
                    placeholder="e.g. Muttagundi Warriors"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isKannada ? 'ತಂಡ ೨' : 'Team 2'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={team2}
                    onChange={(e) => setTeam2(e.target.value)}
                    placeholder="e.g. Chitradurga Tigers"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಕ್ರೀಡಾಂಗಣ / ಸ್ಥಳ' : 'Venue / Ground'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Muttagundi High School Playground"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary">
                  {isKannada ? 'ಪಂದ್ಯಾವಳಿ ಉಳಿಸಿ' : 'Save Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
