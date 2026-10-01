import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  GeminiLiveSession,
  LiveStatus,
  LiveMessage
} from '../services/geminiLiveService';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Send,
  Sparkles,
  ArrowLeft,
  Volume2,
  ShieldCheck,
  Wheat,
  RotateCcw
} from 'lucide-react';

interface FarmerLiveScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const FarmerLiveScreen: React.FC<FarmerLiveScreenProps> = ({ onBack, onNavigateTab }) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  const [session, setSession] = useState<GeminiLiveSession | null>(null);
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (session) {
        session.endLive();
      }
    };
  }, [session]);

  const startSession = async () => {
    if (!currentUser) return;
    setErrorMessage(null);

    const liveSession = new GeminiLiveSession({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'listening') setIsPaused(false);
        if (newStatus === 'paused') setIsPaused(true);
      },
      onTranscriptUpdate: (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onVolumeChange: (vol) => {
        setVolumeLevel(vol);
      }
    });

    setSession(liveSession);
    await liveSession.startLive(currentUser.uid);
  };

  const handleEndLive = () => {
    if (session) {
      session.endLive();
    }
    setStatus('idle');
    setVolumeLevel(0);
  };

  const handleToggleMute = () => {
    if (session) {
      const muted = session.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleTogglePause = () => {
    if (session) {
      const paused = session.togglePause();
      setIsPaused(paused);
    }
  };

  const handleSendText = async () => {
    if (!inputQuestion.trim() || !session) return;
    const q = inputQuestion.trim();
    setInputQuestion('');
    await session.sendTextMessage(q);
  };

  const sampleQuestions = [
    {
      label_kn: '💰 ಈ ವರ್ಷ ನನ್ನ net profit ಎಷ್ಟು?',
      label_en: '💰 What was my net profit this year?',
      text: isKannada ? 'ಈ ವರ್ಷ ನನ್ನ net profit ಎಷ್ಟು?' : 'What is my net profit this year?'
    },
    {
      label_kn: '🌱 ದಾಳಿಂಬೆ ಬೆಳೆಯಿಂದ ಎಷ್ಟು ಲಾಭ?',
      label_en: '🌱 Pomegranate crop profit & expense?',
      text: isKannada ? 'ದಾಳಿಂಬೆ ಬೆಳೆಯಿಂದ ಎಷ್ಟು ಆದಾಯ ಮತ್ತು ಲಾಭ ಬಂದಿದೆ?' : 'How much profit did I make from pomegranate this year?'
    },
    {
      label_kn: '🎓 ಮಗ/ಮಗಳ ಶಿಕ್ಷಣಕ್ಕೆ ಎಷ್ಟು ಖರ್ಚಾಗಿದೆ?',
      label_en: '🎓 How much spent on education?',
      text: isKannada ? 'ಶಿಕ್ಷಣಕ್ಕಾಗಿ ಎಷ್ಟು ಖರ್ಚಾಗಿದೆ?' : 'How much did I spend on education fees?'
    },
    {
      label_kn: '🏦 ಸಾಲದ ಮೊತ್ತ ಎಷ್ಟು ಬಾಕಿ ಇದೆ?',
      label_en: '🏦 How much loan is remaining?',
      text: isKannada ? 'ನನ್ನ ಸಾಲ ಎಷ್ಟು ಬಾಕಿ ಇದೆ ಮತ್ತು ಎಷ್ಟು ಪಾವತಿಸಲಾಗಿದೆ?' : 'How much loan is remaining and what is the interest paid?'
    },
    {
      label_kn: '📊 2025 ಮತ್ತು 2026 ಆದಾಯ ಹೋಲಿಕೆ',
      label_en: '📊 Compare 2025 & 2026',
      text: isKannada ? '2025 ಮತ್ತು 2026 ವರ್ಷಗಳ ಆದಾಯ ಮತ್ತು ಲಾಭ ಹೋಲಿಕೆ ಮಾಡಿ' : 'Compare my 2025 and 2026 income and profit.'
    }
  ];

  if (!currentUser) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#F8FAFC' }}>
        <div style={{
          maxWidth: '460px',
          margin: '40px auto',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '20px',
          padding: '32px 20px',
          backdropFilter: 'blur(16px)'
        }}>
          <Wheat size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            {isKannada ? '🔒 ಖಾಸಗಿ ರೈತ & ಕುಟುಂಬ AI' : '🔒 Private MTG Farmer AI Live'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
            {isKannada
              ? 'ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ. ನಿಮ್ಮ ಕೃಷಿ, ಹಣಕಾಸು ಮತ್ತು ಕುಟುಂಬದ ಖಾಸಗಿ ದಾಖಲೆಗಳನ್ನು ಕೇವಲ ನೀವು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.'
              : 'Please sign in to access your personal encrypted farming and family records. Only you can access your private data.'}
          </p>
          <button
            onClick={onBack}
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ← {isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '12px 16px 80px', color: '#F8FAFC' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          {isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: status === 'speaking'
              ? 'rgba(16, 185, 129, 0.2)'
              : status === 'listening'
              ? 'rgba(6, 182, 212, 0.2)'
              : status === 'thinking'
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(100, 116, 139, 0.2)',
            border: `1px solid ${
              status === 'speaking'
                ? '#10B981'
                : status === 'listening'
                ? '#06B6D4'
                : status === 'thinking'
                ? '#F59E0B'
                : '#64748B'
            }`,
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status === 'speaking' ? '#10B981' : status === 'listening' ? '#06B6D4' : '#F59E0B'
            }} />
            <span>
              {status === 'speaking'
                ? (isKannada ? 'ಮಾತನಾಡುತ್ತಿದೆ...' : 'Speaking...')
                : status === 'thinking'
                ? (isKannada ? 'ಯೋಚಿಸುತ್ತಿದೆ...' : 'Thinking...')
                : status === 'listening'
                ? (isKannada ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ...' : 'Listening...')
                : status === 'paused'
                ? (isKannada ? 'ವಿರಾಮ' : 'Paused')
                : status === 'connecting'
                ? (isKannada ? 'ಸಂಪರ್ಕಿಸುತ್ತಿದೆ...' : 'Connecting...')
                : (isKannada ? 'ಸಿದ್ಧವಾಗಿದೆ' : 'Idle')}
            </span>
          </div>

          <div style={{
            fontSize: '0.68rem',
            color: '#93C5FD',
            background: 'rgba(66, 133, 244, 0.12)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: 700
          }}>
            Gemini Live
          </div>
        </div>
      </div>

      {/* Main Live Card Visualizer */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 15, 30, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '24px',
        padding: '24px 20px',
        textAlign: 'center',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '6px'
        }}>
          <Wheat size={22} color="#10B981" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {isKannada ? '🤖 ಎಂಟಿಜಿ ರೈತ AI ಲೈವ್' : '🤖 MTG FARMER AI LIVE'}
          </h2>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 20px 0' }}>
          {isKannada
            ? 'ನೈಜ ಸಮಯದ ಧ್ವನಿ ಸಂಭಾಷಣೆ • ಕನ್ನಡ & ಇಂಗ್ಲಿಷ್ • ನಿಮ್ಮ ಖಾಸಗಿ ಕೃಷಿ & ಕುಟುಂಬ ದಾಖಲೆಗಳು'
            : 'Real-Time Voice AI • Kannada & English • Exclusively for your private records'}
        </p>

        {/* Pulsing Orb & Audio Waves */}
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Animated Background Ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: status === 'speaking'
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0) 70%)'
              : status === 'listening'
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0) 70%)'
              : 'radial-gradient(circle, rgba(100, 116, 139, 0.2) 0%, rgba(100, 116, 139, 0) 70%)',
            transform: `scale(${1 + volumeLevel * 0.4})`,
            transition: 'transform 0.1s ease-out'
          }} />

          {/* Central Button / Icon */}
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: status === 'speaking'
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : status === 'thinking'
              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
              : status === 'listening'
              ? 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)'
              : 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            {status === 'speaking' ? (
              <Volume2 size={36} color="#FFFFFF" />
            ) : status === 'thinking' ? (
              <Sparkles size={36} color="#FFFFFF" />
            ) : (
              <Mic size={36} color="#FFFFFF" />
            )}
          </div>
        </div>

        {/* Live Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {status === 'idle' ? (
            <button
              onClick={startSession}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 28px',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Mic size={20} />
              {isKannada ? '🎙️ ಲೈವ್ ಪ್ರಾರಂಭಿಸಿ (Start Live)' : '🎙️ Start Gemini Live'}
            </button>
          ) : (
            <>
              {/* Mute Button */}
              <button
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                style={{
                  background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: isMuted ? '#EF4444' : '#FFFFFF',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                <span>{isMuted ? (isKannada ? 'ಮೈಕ್ ಮ್ಯೂಟ್' : 'Muted') : (isKannada ? 'ಮೈಕ್ ಆನ್' : 'Mute')}</span>
              </button>

              {/* Pause/Resume Button */}
              <button
                onClick={handleTogglePause}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                <span>{isPaused ? (isKannada ? 'ಮುಂದುವರಿಸಿ' : 'Resume') : (isKannada ? 'ವಿರಾಮ' : 'Pause')}</span>
              </button>

              {/* Stop Live Button */}
              <button
                onClick={handleEndLive}
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
                }}
              >
                <Square size={16} />
                <span>{isKannada ? '🛑 ಲೈವ್ ಮುಕ್ತಾಯ' : '🛑 End Live'}</span>
              </button>
            </>
          )}
        </div>

        {errorMessage && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '0.8rem'
          }}>
            {errorMessage}
          </div>
        )}
      </div>

      {/* Quick Questions Pills */}
      <div style={{ marginBottom: '18px' }}>
        <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 8px 4px', fontWeight: 700 }}>
          {isKannada ? '💡 ನೀವು ಕೇಳಬಹುದಾದ ಪ್ರಶ್ನೆಗಳು (ಟ್ಯಾಪ್ ಮಾಡಿ):' : '💡 Example Questions (Tap to ask):'}
        </p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={async () => {
                if (!session) {
                  await startSession();
                }
                if (session) {
                  await session.sendTextMessage(q.text);
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                color: '#E2E8F0',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {isKannada ? q.label_kn : q.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Transcript Log */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '16px',
        minHeight: '220px',
        maxHeight: '340px',
        overflowY: 'auto',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748B', margin: 'auto', fontSize: '0.85rem' }}>
            <Sparkles size={24} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.6 }} />
            {isKannada
              ? 'ಲೈವ್ ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ ಪ್ರಶ್ನೆಯನ್ನು ಕೆಳಗೆ ಬರೆಯಿರಿ...'
              : 'Start live or type your question below...'}
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : m.sender === 'ai' ? 'flex-start' : 'center',
                maxWidth: m.sender === 'system' ? '100%' : '82%',
                background: m.sender === 'user'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%)'
                  : m.sender === 'ai'
                  ? 'rgba(30, 41, 59, 0.85)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: m.sender === 'user'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : m.sender === 'ai'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : 'none',
                borderRadius: m.sender === 'system' ? '8px' : '14px',
                padding: '8px 14px',
                fontSize: '0.84rem',
                color: m.sender === 'system' ? '#94A3B8' : '#F8FAFC',
                textAlign: m.sender === 'system' ? 'center' : 'left'
              }}
            >
              {m.sender !== 'system' && (
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: m.sender === 'user' ? '#34D399' : '#38BDF8',
                  marginBottom: '2px'
                }}>
                  {m.sender === 'user' ? (isKannada ? 'ನೀವು' : 'You') : '🤖 MTG Farmer AI'}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{m.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Text Message Input Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '6px 8px 6px 14px'
      }}>
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendText();
          }}
          placeholder={isKannada ? 'ಕೃಷಿ, ಲಾಭ, ವೆಚ್ಚ, ಕುಟುಂಬದ ಬಗ್ಗೆ ಕೇಳಿ...' : 'Ask about crops, profit, loans, family...'}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: '0.88rem'
          }}
        />
        <button
          onClick={handleSendText}
          disabled={!inputQuestion.trim()}
          style={{
            background: inputQuestion.trim() ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputQuestion.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s'
          }}
        >
          <Send size={18} />
        </button>
      </div>

      {/* Privacy Badge footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '16px',
        fontSize: '0.72rem',
        color: '#64748B'
      }}>
        <ShieldCheck size={14} color="#10B981" />
        <span>
          {isKannada
            ? 'ಕಟ್ಟುನಿಟ್ಟಾದ ಗೌಪ್ಯತೆ: ನಿಮ್ಮ ಡೇಟಾ ಕೇವಲ ನಿಮ್ಮ ಲಾಗಿನ್ ಐಡಿಗೆ ಸೀಮಿತವಾಗಿದೆ.'
            : 'Strict Privacy: Isolated to your authenticated account only. Never exposed publicly.'}
        </span>
      </div>
    </div>
  );
};
