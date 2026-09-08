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
  Users
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

  useEffect(() => {
    return dbService.subscribeTournaments(setTournaments);
  }, []);

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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ಗ್ರಾಮ ಕ್ರೀಡಾ ಹಬ್ & ಲೈವ್ ಸ್ಕೋರ್' : 'Village Sports & Tournaments'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada
            ? 'ಗ್ರಾಮೋತ್ಸವ ಕ್ರಿಕೆಟ್ ಲೀಗ್, ಕಬಡ್ಡಿ ಪಂದ್ಯಾವಳಿ ಮತ್ತು ನೇರ ಪ್ರಸಾರ'
            : 'Gramotsava Premier League, Kabaddi challenges, fixtures & live scoreboard'}
        </p>
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
    </div>
  );
};
