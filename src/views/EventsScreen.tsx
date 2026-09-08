import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { EventItem, EventStatus } from '../types';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Radio,
  X
} from 'lucide-react';

interface EventsScreenProps {
  onOpenEventDetail: (event: EventItem) => void;
  onOpenCreateEvent?: () => void;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({
  onOpenEventDetail,
  onOpenCreateEvent
}) => {
  const { language, isKannada } = useLanguage();
  const { currentUser, isEventOrganizer } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventTitleEn, setEventTitleEn] = useState('');
  const [eventTitleKn, setEventTitleKn] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCategory, setEventCategory] = useState<'FESTIVAL' | 'SABHA' | 'SPORTS' | 'AGRICULTURAL'>('FESTIVAL');

  useEffect(() => {
    return dbService.subscribeEvents(setEvents);
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitleEn.trim() || !eventDate) return;

    await dbService.addEvent({
      title_en: eventTitleEn.trim(),
      title_kn: eventTitleKn.trim() || eventTitleEn.trim(),
      description_en: eventDesc.trim() || 'Community program in Muttagundi village.',
      description_kn: eventDesc.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ಸಮುದಾಯ ಕಾರ್ಯಕ್ರಮ.',
      date: eventDate,
      start_time: eventTime.trim() || '10:00 AM',
      end_time: '01:00 PM',
      venue_en: eventVenue.trim() || 'Muttagundi Village Center',
      venue_kn: eventVenue.trim() || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ ಕೇಂದ್ರ',
      organizer_en: currentUser ? currentUser.name : 'Muttagundi Resident',
      organizer_kn: currentUser ? (currentUser.name_kn || currentUser.name) : 'ಮುತ್ತಗುಂಡಿ ನಿವಾಸಿ',
      organizer_phone: '+91 98450 00001',
      cover_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      status: 'UPCOMING'
    });

    setShowCreateModal(false);
    setEventTitleEn('');
    setEventTitleKn('');
    setEventDate('');
    setEventTime('');
    setEventVenue('');
    setEventDesc('');
  };

  const filteredEvents = events.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    return true;
  });

  const getRemainingDays = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return isKannada ? 'ಮುಕ್ತಾಯವಾಗಿದೆ' : 'Completed';
    if (days === 0) return isKannada ? 'ಇಂದು' : 'Today';
    return isKannada ? `ಇನ್ನೂ ${days} ದಿನಗಳು ಬಾಕಿ` : `${days} days left`;
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isKannada ? 'ಗ್ರಾಮದ ಕಾರ್ಯಕ್ರಮಗಳು & ಉತ್ಸವಗಳು' : 'Village Events & Festivals'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isKannada ? 'ಧಾರ್ಮಿಕ ಜಾತ್ರೆಗಳು, ಕ್ರೀಡಾಕೂಟ ಮತ್ತು ಸಮುದಾಯ ಸಭೆಗಳು' : 'Brahmarathotsava, Krishi Melas, Sports Meets & Community Assemblies'}
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>{isKannada ? 'ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ' : 'Add Event'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label_en: 'All Events', label_kn: 'ಎಲ್ಲಾ ಕಾರ್ಯಕ್ರಮಗಳು' },
          { id: 'UPCOMING', label_en: 'Upcoming', label_kn: 'ಮುಂಬರುವ' },
          { id: 'LIVE', label_en: '🔴 Live Now', label_kn: '🔴 ಲೈವ್' },
          { id: 'COMPLETED', label_en: 'Past Records', label_kn: 'ಮುಗಿದ ಕಾರ್ಯಕ್ರಮಗಳು' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              background: statusFilter === tab.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: statusFilter === tab.id ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {isKannada ? tab.label_kn : tab.label_en}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={42} color="var(--accent-emerald)" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            {isKannada ? 'ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮಗಳಿಲ್ಲ' : 'No Events Scheduled Yet'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
            {isKannada
              ? 'ಮುಟ್ಟಗುಂಡಿ ಗ್ರಾಮದ ಮುಂಬರುವ ಹಬ್ಬ, ಸಭೆ ಅಥವಾ ಜಾತ್ರೆ ಕಾರ್ಯಕ್ರಮವನ್ನು ಹೊಸದಾಗಿ ಸೇರಿಸಿ.'
              : 'Add upcoming temple festivals, village meetings, or sports tournaments for Muttagundi.'}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} />
            <span>{isKannada ? 'ಮೊದಲ ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ' : 'Add First Event'}</span>
          </button>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredEvents.map((evt) => {
          const isUserRegistered = currentUser ? evt.registered_uids.includes(currentUser.uid) : false;

          return (
            <div
              key={evt.id}
              onClick={() => onOpenEventDetail(evt)}
              className="glass-card glass-card-interactive card-3d"
              style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ height: '180px', position: 'relative' }}>
                <img src={evt.cover_image} alt={evt.title_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#FEF08A'
                }}>
                  {getRemainingDays(evt.date)}
                </div>

                {evt.status === 'LIVE' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Radio size={12} />
                    LIVE
                  </div>
                )}
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.3 }}>
                  {isKannada ? evt.title_kn : evt.title_en}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
                  <Calendar size={14} color="#10B981" />
                  <span>{evt.date} • {evt.start_time} - {evt.end_time}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '14px' }}>
                  <MapPin size={14} color="#F59E0B" />
                  <span>{isKannada ? evt.venue_kn : evt.venue_en}</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                  {(isKannada ? evt.description_kn : evt.description_en).substring(0, 130)}...
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '14px',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    <Users size={15} />
                    <span>{evt.participants_count} {isKannada ? 'ನೋಂದಾಯಿತರು' : 'Attending'}</span>
                  </div>

                  {isUserRegistered ? (
                    <span style={{ color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={15} />
                      {isKannada ? 'ನೋಂದಾಯಿಸಲಾಗಿದೆ' : 'Registered'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {isKannada ? 'ವಿವರಗಳನ್ನು ನೋಡಿ' : 'Details'} →
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? '📅 ಹೊಸ ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ' : '📅 Schedule Village Event'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಕಾರ್ಯಕ್ರಮದ ಶೀರ್ಷಿಕೆ (English)' : 'Event Title (English) *'}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={eventTitleEn}
                  onChange={(e) => setEventTitleEn(e.target.value)}
                  placeholder="e.g. Sri Ranganatha Swamy Brahmarathotsava"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಕಾರ್ಯಕ್ರಮದ ಶೀರ್ಷಿಕೆ (ಕನ್ನಡ)' : 'Event Title (Kannada)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={eventTitleKn}
                  onChange={(e) => setEventTitleKn(e.target.value)}
                  placeholder="ಉದಾ: ಶ್ರೀ ರಂಗನಾಥ ಸ್ವಾಮಿ ಬ್ರಹ್ಮ ರಥೋತ್ಸವ"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">{isKannada ? 'ದಿನಾಂಕ' : 'Date *'}</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isKannada ? 'ಸಮಯ' : 'Time'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ಸ್ಥಳ / ವೇದಿಕೆ' : 'Venue / Location'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. Temple Car Street / Gram Panchayat Hall"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ವಿಭಾಗ' : 'Category'}</label>
                <select
                  className="form-select"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as any)}
                >
                  <option value="FESTIVAL">Festival / ಜಾತ್ರೆ-ಹಬ್ಬ</option>
                  <option value="SABHA">Grama Sabha / ಗ್ರಾಮ ಸಭೆ</option>
                  <option value="SPORTS">Sports / ಕ್ರೀಡಾಕೂಟ</option>
                  <option value="AGRICULTURAL">Krishi Mela / ಕೃಷಿ ಮೇಳ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{isKannada ? 'ವಿವರಣೆ' : 'Description'}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder={isKannada ? 'ಕಾರ್ಯಕ್ರಮದ ಮುಖ್ಯ ಅಂಶಗಳು...' : 'Event itinerary and guest details...'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary">
                  {isKannada ? 'ಕಾರ್ಯಕ್ರಮ ಪ್ರಕಟಿಸಿ' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
