import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { compressImage } from '../../services/imageOptimizer';
import {
  X,
  Mic,
  MicOff,
  Camera,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Send,
  Sparkles
} from 'lucide-react';

interface ShareUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSubmitted?: () => void;
}

export const ShareUpdateModal: React.FC<ShareUpdateModalProps> = ({
  isOpen,
  onClose,
  onPostSubmitted
}) => {
  const { language, isKannada } = useLanguage();
  const { currentUser } = useAuth();

  // Mode: 'SPEAK' | 'PHOTO' | 'TYPE'
  const [activeMode, setActiveMode] = useState<'SPEAK' | 'PHOTO' | 'TYPE'>('SPEAK');

  // Input fields
  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('VILLAGE');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setHeadline('');
      setDetails('');
      setImagePreview(null);
      setIsRecording(false);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Speech-to-Text handler
  const handleToggleRecord = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        isKannada
          ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.'
          : 'Voice input is not supported on this browser. Please use Type.'
      );
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isKannada ? 'kn-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (!headline) {
          setHeadline(transcript);
        } else {
          setDetails((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
        setSpeechError(
          isKannada
            ? 'ಧ್ವನಿ ಗ್ರಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.'
            : 'Could not catch voice clearly. Please tap again.'
        );
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Image Upload handler with compression
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await compressImage(file, 1200, 900, 0.8);
      setImagePreview(optimized.dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) return;

    // Create new news record with COMMUNITY_REPORT status so it displays instantly
    await dbService.addNews({
      author_id: currentUser?.uid || 'guest_resident',
      author_name: currentUser?.name || (isKannada ? 'ಗ್ರಾಮಸ್ಥರು' : 'Village Resident'),
      author_role: currentUser?.role || 'USER',
      title_en: isKannada ? headline : headline,
      title_kn: isKannada ? headline : headline,
      content_en: details || headline,
      content_kn: details || headline,
      category: category as any,
      media_url: imagePreview || undefined,
      media_type: imagePreview ? 'IMAGE' : undefined,
      verification_status: 'COMMUNITY_REPORT', // Displayed as Community Report immediately
      urgent: false,
      pinned: false,
      is_demo: false
    });

    setIsSubmitted(true);
    setTimeout(() => {
      onPostSubmitted?.();
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>
              {isKannada ? 'ಗ್ರಾಮಸ್ಥರ ವರದಿ' : 'Community Contribution'}
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '2px 0 0 0' }}>
              {isKannada ? '➕ ಸುದ್ದಿ / ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳಿ' : '➕ Share Village Update'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '36px 12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              {isKannada ? 'ವರದಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!' : 'Report Submitted!'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              {isKannada
                ? 'ನಿಮ್ಮ ವರದಿಯನ್ನು 🟡 ಪರಿಶೀಲನೆ (CHECKING) ಹಂತದಲ್ಲಿ ಇರಿಸಲಾಗಿದೆ. ಗ್ರಾಮ ಪಂಚಾಯತಿ ಪರಿಶೀಲಿಸಿದ ಬಳಿಕ ಪ್ರಕಟವಾಗುತ್ತದೆ.'
                : 'Your report is now marked as 🟡 CHECKING. It will appear on the feed once reviewed by village moderators.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* The 3 User-Requested Options: SPEAK, PHOTO, TYPE */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '20px'
              }}
            >
              {/* Option 1: SPEAK */}
              <button
                type="button"
                onClick={() => setActiveMode('SPEAK')}
                style={{
                  background: activeMode === 'SPEAK' ? '#10B981' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${activeMode === 'SPEAK' ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                  color: activeMode === 'SPEAK' ? '#FFFFFF' : '#CBD5E1',
                  borderRadius: '16px',
                  padding: '16px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>🎙️</span>
                <span>{isKannada ? 'ಮಾತನಾಡಿ' : 'SPEAK'}</span>
              </button>

              {/* Option 2: PHOTO */}
              <button
                type="button"
                onClick={() => setActiveMode('PHOTO')}
                style={{
                  background: activeMode === 'PHOTO' ? '#10B981' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${activeMode === 'PHOTO' ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                  color: activeMode === 'PHOTO' ? '#FFFFFF' : '#CBD5E1',
                  borderRadius: '16px',
                  padding: '16px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>📷</span>
                <span>{isKannada ? 'ಫೋಟೋ' : 'PHOTO'}</span>
              </button>

              {/* Option 3: TYPE */}
              <button
                type="button"
                onClick={() => setActiveMode('TYPE')}
                style={{
                  background: activeMode === 'TYPE' ? '#10B981' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${activeMode === 'TYPE' ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                  color: activeMode === 'TYPE' ? '#FFFFFF' : '#CBD5E1',
                  borderRadius: '16px',
                  padding: '16px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>⌨️</span>
                <span>{isKannada ? 'ಬರೆಯಿರಿ' : 'TYPE'}</span>
              </button>
            </div>

            {/* SPEAK Interactive Mic Box */}
            {activeMode === 'SPEAK' && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '16px',
                  padding: '18px',
                  textAlign: 'center',
                  marginBottom: '18px'
                }}
              >
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: isRecording ? '#EF4444' : '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    cursor: 'pointer',
                    boxShadow: isRecording
                      ? '0 0 24px rgba(239, 68, 68, 0.6)'
                      : '0 8px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {isRecording ? <MicOff size={30} /> : <Mic size={30} />}
                </button>
                <strong style={{ fontSize: '0.94rem', color: '#F8FAFC', display: 'block' }}>
                  {isRecording
                    ? (isKannada ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇವೆ... ಮಾತನಾಡಿ' : 'Listening... Speak now')
                    : (isKannada ? 'ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಮಾಡಲು ಬಟನ್ ಒತ್ತಿರಿ' : 'Tap mic to speak in Kannada/English')}
                </strong>
                {speechError && (
                  <span style={{ fontSize: '0.78rem', color: '#FCA5A5', marginTop: '6px', display: 'block' }}>
                    {speechError}
                  </span>
                )}
              </div>
            )}

            {/* PHOTO Upload Box */}
            {activeMode === 'PHOTO' && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '2px dashed rgba(255,255,255,0.18)',
                  borderRadius: '16px',
                  padding: '18px',
                  textAlign: 'center',
                  marginBottom: '18px'
                }}
              >
                {imagePreview ? (
                  <div>
                    <img
                      src={imagePreview}
                      alt="Upload Preview"
                      style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '10px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      style={{
                        background: 'rgba(239,68,68,0.2)',
                        color: '#F87171',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isKannada ? 'ಫೋಟೋ ತೆಗೆದುಹಾಕಿ' : 'Remove Photo'}
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <Camera size={36} color="#10B981" style={{ margin: '0 auto 8px' }} />
                    <strong style={{ fontSize: '0.92rem', display: 'block', color: '#FFFFFF', marginBottom: '4px' }}>
                      {isKannada ? 'ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ / ಕ್ಯಾಮೆರಾ ಬಳಸಿ' : 'Take Photo or Choose File'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {isKannada ? 'ಗರಿಷ್ಠ 5MB (ಸ್ವಯಂಚಾಲಿತ ಕಂಪ್ರೆಷನ್)' : 'Auto-compressed high quality image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            )}

            {/* Review Headline (Speech converts here, or user types) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                {isKannada ? 'ಸುದ್ದಿ ಶೀರ್ಷಿಕೆ (ಮುಖ್ಯ ವಿಷಯ)' : 'Update Headline / Subject'} *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={isKannada ? 'ಉದಾ: ನಮ್ಮ ರಸ್ತೆಯಲ್ಲಿ ಮಳೆ ನೀರು ನಿಂತಿದೆ...' : 'e.g., Road repair needed near bus stand...'}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.94rem'
                }}
              />
            </div>

            {/* Optional Details */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
                {isKannada ? 'ವಿವರಗಳು (ಐಚ್ಛಿಕ)' : 'Additional Details (Optional)'}
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={isKannada ? 'ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಇಲ್ಲಿ ಬರೆಯಿರಿ...' : 'Describe location, issue, or details...'}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  resize: 'none'
                }}
              />
            </div>

            {/* Trust Status Notice */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.78rem',
                color: '#FCD34D'
              }}
            >
              <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
              <span>
                {isKannada
                  ? 'ದೃಢೀಕರಣ ನಿಯಮ: ಸಲ್ಲಿಕೆಯಾದ ಮಾಹಿತಿಯು ಮೊದಲು 🟡 CHECKING ಹಂತದಲ್ಲಿರುತ್ತದೆ. ಪಂಚಾಯತಿ ಅಧಿಕಾರಿಗಳು ಪರಿಶೀಲಿಸಿದ ಬಳಿಕ 🟢 VERIFIED ಆಗುತ್ತದೆ.'
                  : 'Trust System: Posts start as 🟡 CHECKING and community report. Official verification is granted only by authorized moderators.'}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!headline.trim()}
              style={{
                width: '100%',
                background: headline.trim() ? '#10B981' : 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 900,
                cursor: headline.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: headline.trim() ? '0 6px 20px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              <Send size={18} />
              <span>{isKannada ? 'ಸಲ್ಲಿಸಿ (SUBMIT)' : 'SUBMIT UPDATE'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
