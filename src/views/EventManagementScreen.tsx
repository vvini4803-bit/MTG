import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import { EventItem } from '../types';
import { Calendar, Plus, ArrowLeft, Users, Clock, MapPin, Check } from 'lucide-react';

interface EventManagementScreenProps {
  onBack: () => void;
}

export const EventManagementScreen: React.FC<EventManagementScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-10-05');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('02:00 PM');
  const [venue, setVenue] = useState('Panchayat Sabha Bhavana');
  const [organizer, setOrganizer] = useState('Grama Panchayat');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    return dbService.subscribeEvents(setEvents);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await dbService.addEvent({
      title_en: title,
      title_kn: title,
      description_en: desc || 'Official village event program.',
      description_kn: desc || 'ಅಧಿಕೃತ ಗ್ರಾಮ ಕಾರ್ಯಕ್ರಮ.',
      date,
      start_time: startTime,
      end_time: endTime,
      venue_en: venue,
      venue_kn: venue,
      organizer_en: organizer,
      organizer_kn: organizer,
      cover_image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
      status: 'UPCOMING'
    });

    setTitle('');
    setDesc('');
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Event & Festival Management</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Schedule cultural festivals, official Grama Sabhas, and manage registration rosters
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>Create New Event</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {events.map((evt) => (
          <div key={evt.id} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-verified" style={{ fontSize: '0.68rem' }}>
                {evt.status}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.date}</span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
              {evt.title_en}
            </h3>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {evt.venue_en} • {evt.start_time}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              {evt.description_en.substring(0, 100)}...
            </p>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                <Users size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {evt.participants_count} Attending
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Organizer: {evt.organizer_en}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              Create New Village Event
            </h3>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grama Sabha Annual Budget Meeting"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="text"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="text"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Agenda</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Details and agenda for attendees..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
