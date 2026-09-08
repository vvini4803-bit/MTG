import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { EventItem } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  PhoneCall,
  UserCheck,
  Share2,
  Check,
  Sparkles
} from 'lucide-react';

interface EventDetailModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose
}) => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(0);

  useEffect(() => {
    if (event && currentUser) {
      setIsRegistered(event.registered_uids.includes(currentUser.uid));
      setAttendeesCount(event.participants_count);
    }
  }, [event, currentUser]);

  if (!isOpen || !event) return null;

  const title = language === 'kn' ? event.title_kn : event.title_en;
  const description = language === 'kn' ? event.description_kn : event.description_en;
  const venue = language === 'kn' ? event.venue_kn : event.venue_en;
  const organizer = language === 'kn' ? event.organizer_kn : event.organizer_en;

  const handleRegister = async () => {
    if (!currentUser) {
      alert(isKannada ? 'ದಯವಿಟ್ಟು ನೋಂದಾಯಿಸಲು ಲಾಗಿನ್ ಆಗಿ' : 'Please log in to register');
      return;
    }

    const registered = await dbService.registerForEvent(event.id, currentUser.uid);
    setIsRegistered(registered);
    setAttendeesCount((prev) => (registered ? prev + 1 : Math.max(0, prev - 1)));

    if (registered) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '620px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'relative', height: '240px' }}>
          <img src={event.cover_image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              color: '#FFFFFF',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-verified">
              {event.status}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {event.date}
            </span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.3 }}>
            {title}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} color="#10B981" />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Time</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{event.start_time} – {event.end_time}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={18} color="#F59E0B" />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Venue</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{venue}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={18} color="#0284C7" />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Organizer</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{organizer}</span>
              </div>
            </div>

            {event.organizer_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PhoneCall size={18} color="#A855F7" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Contact</span>
                  <a href={`tel:${event.organizer_phone}`} style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-emerald)', textDecoration: 'none' }}>
                    {event.organizer_phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
            {description}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              {attendeesCount} {isKannada ? 'ನಾಗರಿಕರು ನೋಂದಾಯಿಸಿದ್ದಾರೆ' : 'Attending this event'}
            </span>

            <button
              onClick={handleRegister}
              className={isRegistered ? 'btn-secondary' : 'btn-primary'}
              style={{ padding: '10px 24px' }}
            >
              {isRegistered ? (
                <>
                  <Check size={16} color="#10B981" />
                  <span>{isKannada ? 'ನೋಂದಣಿ ರದ್ದುಮಾಡಿ' : 'Cancel RSVP'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{isKannada ? 'ನೋಂದಾಯಿಸಿ (RSVP)' : 'Register / RSVP'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
