import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceOrb } from './VoiceOrb';
import { voiceAssistant, VoiceQueryResponse } from '../../services/voiceService';
import { ViewTab } from '../../types';
import {
  X,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Globe
} from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ViewTab) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { language, setLanguage, isKannada } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [response, setResponse] = useState<VoiceQueryResponse | null>(null);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      voiceAssistant.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartListening = () => {
    setErrorMessage(null);
    setIsListening(true);
    voiceAssistant.stopSpeaking();
    setIsSpeaking(false);

    voiceAssistant.listen(
      language,
      (transcript) => {
        setIsListening(false);
        setQueryText(transcript);
        handleProcessQuery(transcript);
      },
      (err) => {
        setIsListening(false);
        setErrorMessage(
          isKannada
            ? 'ಧ್ವನಿ ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ.'
            : 'Could not capture speech. Please use the text input below.'
        );
      }
    );
  };

  const handleProcessQuery = async (text: string) => {
    if (!text.trim()) return;
    setLastQuery(text);
    setErrorMessage(null);

    const res = await voiceAssistant.query(text, language);
    setResponse(res);
    setQueryText('');

    if (!isSpeechMuted) {
      const speechAnswer = language === 'kn' ? res.answer_kn : res.answer_en;
      setIsSpeaking(true);
      voiceAssistant.speak(speechAnswer, language);
      setTimeout(() => setIsSpeaking(false), 5000);
    }
  };

  const samplePrompts = isKannada
    ? [
        'ಈಗ ನಮ್ಮ ಊರಲ್ಲಿ ಏನು ನಡೆಯುತ್ತಿದೆ?',
        'ಕ್ರಿಕೆಟ್ ಟೂರ್ನಮೆಂಟ್ ಯಾವಾಗ?',
        'ಕೃಷಿ ಮಾಹಿತಿ ತೋರಿಸು',
        'ನಮ್ಮ ದೇವಸ್ಥಾನಗಳ ಬಗ್ಗೆ ಹೇಳು',
        'ಗ್ರಾಮದ ಜನಸಂಖ್ಯೆ ಎಷ್ಟು?'
      ]
    : [
        'What is happening in our village today?',
        'When is the cricket tournament?',
        'Show agriculture information',
        'Tell me about our temples',
        'What is our village population?'
      ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          background: 'linear-gradient(180deg, #0D1629 0%, #080D1A 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              AI VOICE ASSISTANT
            </span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                padding: '2px 8px',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Globe size={12} color="#10B981" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setIsSpeechMuted(!isSpeechMuted);
                if (!isSpeechMuted) voiceAssistant.stopSpeaking();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: isSpeechMuted ? 'var(--text-muted)' : 'var(--accent-emerald)',
                cursor: 'pointer',
                padding: '4px'
              }}
              aria-label="Toggle voice readout"
            >
              {isSpeechMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              aria-label="Close Assistant"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 3D Animated Canvas Orb */}
        <div style={{ margin: '10px 0 20px' }}>
          <VoiceOrb isListening={isListening} isSpeaking={isSpeaking} size={160} />
          <p style={{
            fontSize: '0.82rem',
            color: isListening ? '#EF4444' : isSpeaking ? '#10B981' : 'var(--text-secondary)',
            fontWeight: 600,
            marginTop: '8px'
          }}>
            {isListening
              ? isKannada ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ' : 'Listening... speak now'
              : isSpeaking
              ? isKannada ? 'ಉತ್ತರಿಸುತ್ತಿದ್ದೇನೆ...' : 'Speaking answer...'
              : isKannada ? 'ಧ್ವನಿ ಬಟನ್ ಒತ್ತಿ ಪ್ರಶ್ನೆ ಕೇಳಿ' : 'Tap microphone or ask below'}
          </p>
        </div>

        {/* Mic Control Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={isListening ? () => setIsListening(false) : handleStartListening}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isListening
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening
                ? '0 0 24px rgba(239, 68, 68, 0.6)'
                : '0 0 24px rgba(16, 185, 129, 0.5)',
              transition: 'all 0.2s ease'
            }}
            aria-label="Toggle Microphone"
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: '0.78rem',
            color: '#FCA5A5',
            marginBottom: '14px'
          }}>
            {errorMessage}
          </div>
        )}

        {/* Response Box */}
        {response && (
          <div
            className="glass-card"
            style={{
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
              background: 'rgba(15, 23, 42, 0.7)',
              border: response.isVerified ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Q: "{lastQuery}"
              </span>
              {response.isVerified ? (
                <span className="badge badge-verified" style={{ fontSize: '0.65rem' }}>
                  <ShieldCheck size={11} />
                  {isKannada ? 'ದೃಢೀಕೃತ ಗ್ರಾಮ ಮಾಹಿತಿ' : 'VERIFIED RECORD'}
                </span>
              ) : (
                <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>
                  <AlertCircle size={11} />
                  {isKannada ? 'ದಾಖಲೆ ಪರಿಶೀಲಿಸಿಲ್ಲ' : 'UNVERIFIED'}
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.92rem', color: '#FFFFFF', lineHeight: 1.6, marginBottom: '12px' }}>
              {isKannada ? response.answer_kn : response.answer_en}
            </p>

            {response.navTab && (
              <button
                onClick={() => {
                  onNavigateTab(response.navTab as ViewTab);
                  onClose();
                }}
                className="btn-primary"
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  minHeight: '34px',
                  gap: '4px'
                }}
              >
                <span>{isKannada ? 'ವಿಭಾಗಕ್ಕೆ ತೆರಳಿ' : 'Open Section'}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}

        {/* Sample Prompts Chips */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            {isKannada ? 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು:' : 'Suggested Questions:'}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setQueryText(prompt);
                  handleProcessQuery(prompt);
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProcessQuery(queryText);
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="text"
            className="form-input"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={isKannada ? 'ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ...' : 'Type your question here...'}
            style={{ flex: 1, height: '44px' }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '48px', height: '44px', padding: 0 }}
            disabled={!queryText.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
