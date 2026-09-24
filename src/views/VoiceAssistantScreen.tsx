import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { VoiceOrb } from '../components/voice/VoiceOrb';
import { voiceAssistant, VoiceQueryResponse } from '../services/voiceService';
import { ViewTab } from '../types';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Globe,
  Sparkles,
  Loader2
} from 'lucide-react';

interface VoiceAssistantScreenProps {
  onNavigateTab: (tab: ViewTab) => void;
}

export const VoiceAssistantScreen: React.FC<VoiceAssistantScreenProps> = ({ onNavigateTab }) => {
  const { language, setLanguage, isKannada } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [response, setResponse] = useState<VoiceQueryResponse | null>(null);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOtherLang, setShowOtherLang] = useState(false);

  React.useEffect(() => {
    return () => {
      voiceAssistant.stopSpeaking();
      setIsSpeaking(false);
      setIsListening(false);
      setIsProcessing(false);
    };
  }, []);

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
      },
      (interim) => {
        setQueryText(interim);
      }
    );
  };

  const handleProcessQuery = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setLastQuery(text);
    setErrorMessage(null);
    setIsProcessing(true);
    voiceAssistant.stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await voiceAssistant.query(text, language);
      setResponse(res);
      setQueryText('');

      if (!isSpeechMuted) {
        const speechAnswer = language === 'kn' ? res.answer_kn : res.answer_en;
        setIsSpeaking(true);
        voiceAssistant.speak(
          speechAnswer,
          language,
          () => setIsSpeaking(false),
          () => setIsSpeaking(false)
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        isKannada
          ? 'ಉತ್ತರ ಪಡೆಯುವಲ್ಲಿ ಸಮಸ್ಯೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'Could not get answer. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayAudio = (lang: 'kn' | 'en') => {
    if (!response) return;
    voiceAssistant.stopSpeaking();
    const textToSpeak = lang === 'kn' ? response.answer_kn : response.answer_en;
    setIsSpeaking(true);
    voiceAssistant.speak(
      textToSpeak,
      lang,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleStopAudio = () => {
    voiceAssistant.stopSpeaking();
    setIsSpeaking(false);
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
    <div className="container" style={{ padding: '32px 16px', maxWidth: '640px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Sparkles size={18} color="#F59E0B" />
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.05em' }}>
          2026 DIGITAL VILLAGE VOICE ASSISTANT
        </span>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
        {isKannada ? 'ದ್ವಿಭಾಷಾ ಧ್ವನಿ ಸಹಾಯಕ' : 'Bilingual Village Voice Assistant'}
      </h1>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        {isKannada
          ? 'ನಮ್ಮ ಗ್ರಾಮದ ದೃಢೀಕೃತ ಮಾಹಿತಿ, ಕೃಷಿ, ದೇಗುಲಗಳು, ಶಿಕ್ಷಣ, ಅಥವಾ ಯಾವುದೇ ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ'
          : 'Ask any question about village news, farming, temples, education, or general topics'}
      </p>

      {/* Language switcher & Mute toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--glass-border)',
            padding: '6px 14px',
            borderRadius: '9999px',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Globe size={14} color="#10B981" />
          <span>{language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}</span>
        </button>

        <button
          onClick={() => {
            setIsSpeechMuted(!isSpeechMuted);
            if (!isSpeechMuted) voiceAssistant.stopSpeaking();
          }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--glass-border)',
            padding: '6px 14px',
            borderRadius: '9999px',
            color: isSpeechMuted ? 'var(--text-muted)' : 'var(--accent-emerald)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isSpeechMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span>{isSpeechMuted ? 'Voice Off' : 'Voice On'}</span>
        </button>
      </div>

      {/* Interactive 3D Soundwave Orb */}
      <div style={{ margin: '16px 0 24px' }}>
        <VoiceOrb isListening={isListening} isSpeaking={isSpeaking} size={200} />
        <p style={{
          fontSize: '0.92rem',
          color: isProcessing ? '#F59E0B' : isListening ? '#EF4444' : isSpeaking ? '#10B981' : 'var(--text-secondary)',
          fontWeight: 700,
          marginTop: '12px'
        }}>
          {isProcessing
            ? isKannada ? 'AI ಚಿಂತಿಸುತ್ತಿದೆ... ಉತ್ತರ ಸಿದ್ಧವಾಗುತ್ತಿದೆ' : 'AI is thinking... finding the best answer'
            : isListening
            ? isKannada ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ' : 'Listening... Speak now'
            : isSpeaking
            ? isKannada ? 'ಉತ್ತರಿಸುತ್ತಿದ್ದೇನೆ...' : 'Speaking answer...'
            : isKannada ? 'ಧ್ವನಿ ಬಟನ್ ಒತ್ತಿ ಅಥವಾ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ ಸಲ್ಲಿಸಿ' : 'Tap microphone or type & submit your question'}
        </p>
      </div>

      {/* Big Round Mic Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <button
          onClick={isListening ? () => setIsListening(false) : handleStartListening}
          disabled={isProcessing}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: isListening
              ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
              : isProcessing
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
            border: '3px solid rgba(255,255,255,0.3)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            boxShadow: isListening
              ? '0 0 30px rgba(239, 68, 68, 0.6)'
              : '0 0 30px rgba(16, 185, 129, 0.5)',
            transition: 'all 0.2s ease'
          }}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
      </div>

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          color: '#FCA5A5',
          fontSize: '0.82rem',
          marginBottom: '20px'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Response Box */}
      {response && (
        <div
          className="glass-card"
          style={{
            padding: '20px',
            marginBottom: '28px',
            textAlign: 'left',
            background: 'rgba(15, 23, 42, 0.75)',
            border: response.isVerified ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Q: "{lastQuery}"
            </span>
            {response.isVerified ? (
              <span className="badge badge-verified" style={{ fontSize: '0.68rem' }}>
                <ShieldCheck size={12} />
                {isKannada ? 'ದೃಢೀಕೃತ ಗ್ರಾಮ ಮಾಹಿತಿ' : 'VERIFIED RECORD'}
              </span>
            ) : (
              <span className="badge badge-pending" style={{ fontSize: '0.68rem' }}>
                <AlertCircle size={12} />
                {isKannada ? 'AI ಉತ್ತರ' : 'AI ANSWER'}
              </span>
            )}
          </div>

          <p style={{ fontSize: '1.02rem', color: '#FFFFFF', lineHeight: 1.65, marginBottom: '14px', fontWeight: 500 }}>
            {isKannada ? response.answer_kn : response.answer_en}
          </p>

          <div style={{ marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setShowOtherLang(!showOtherLang)}
              style={{
                background: 'none',
                border: 'none',
                color: '#34D399',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {showOtherLang
                ? isKannada ? '▼ ಅನುವಾದ ಮರೆಮಾಡಿ' : '▼ Hide translation'
                : isKannada ? '▶ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ನೋಡಿ (View English)' : '▶ ಕನ್ನಡದಲ್ಲಿ ನೋಡಿ (View Kannada)'}
            </button>
            {showOtherLang && (
              <div style={{
                marginTop: '8px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.88rem',
                color: '#CBD5E1',
                lineHeight: 1.55
              }}>
                {isKannada ? response.answer_en : response.answer_kn}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handlePlayAudio('kn')}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#34D399',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Volume2 size={14} />
                <span>🔊 ಕನ್ನಡ</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayAudio('en')}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#60A5FA',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Volume2 size={14} />
                <span>🔊 English</span>
              </button>

              {isSpeaking && (
                <button
                  type="button"
                  onClick={handleStopAudio}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#F87171',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⏹️ {isKannada ? 'ನಿಲ್ಲಿಸಿ' : 'Stop'}
                </button>
              )}
            </div>

            {response.navTab && (
              <button
                onClick={() => onNavigateTab(response.navTab as ViewTab)}
                className="btn-primary"
                style={{
                  fontSize: '0.78rem',
                  padding: '6px 14px',
                  minHeight: '34px',
                  gap: '4px'
                }}
              >
                <span>{isKannada ? 'ವಿಭಾಗಕ್ಕೆ ತೆರಳಿ' : 'Open Section'}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suggested Chips */}
      <div style={{ marginBottom: '24px', textAlign: 'left' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          {isKannada ? 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು:' : 'Suggested Questions:'}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setQueryText(p);
                handleProcessQuery(p);
              }}
              disabled={isProcessing}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input & Dedicated Submit Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleProcessQuery(queryText);
        }}
        style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}
      >
        <input
          type="text"
          className="form-input"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder={isKannada ? 'ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ (ಟೈಪ್ ಮಾಡಿ)...' : 'Ask any question (type here)...'}
          disabled={isProcessing}
          style={{ flex: 1, height: '50px', fontSize: '0.92rem', borderRadius: 'var(--radius-md)' }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{
            height: '50px',
            padding: '0 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 700,
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
            minWidth: '110px',
            cursor: (!queryText.trim() || isProcessing) ? 'not-allowed' : 'pointer',
            opacity: (!queryText.trim() || isProcessing) ? 0.7 : 1
          }}
          disabled={!queryText.trim() || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="spinner animate-spin" />
              <span>{isKannada ? 'ಸಲ್ಲಿಸುತ್ತಿದೆ...' : 'Submitting...'}</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>{isKannada ? 'ಸಲ್ಲಿಸಿ' : 'Submit'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
