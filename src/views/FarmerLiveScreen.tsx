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
  Bot,
  Radio,
  HelpCircle,
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
  const [interimText, setInterimText] = useState<string>('');
  const [inputQuestion, setInputQuestion] = useState('');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (session) {
        session.endLive();
      }
    };
  }, [session]);

  const startSession = async () => {
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
      onInterimTranscript: (text) => {
        setInterimText(text);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onVolumeChange: (vol) => {
        setVolumeLevel(vol);
      }
    });

    setSession(liveSession);
    await liveSession.startLive(currentUser?.uid);
  };

  const handleEndLive = () => {
    if (session) {
      session.endLive();
    }
    setStatus('idle');
    setVolumeLevel(0);
    setInterimText('');
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

  const handleInterrupt = () => {
    if (session && status === 'speaking') {
      session.interruptPlayback();
    }
  };

  const handleSendText = async () => {
    if (!inputQuestion.trim()) return;
    const q = inputQuestion.trim();
    setInputQuestion('');

    if (session && status !== 'idle') {
      await session.sendTextMessage(q);
    } else {
      // If session not started, auto start and send
      await startSession();
      setTimeout(async () => {
        if (session) {
          await session.sendTextMessage(q);
        }
      }, 800);
    }
  };

  const handleQuestionPillClick = async (text: string) => {
    if (session && status !== 'idle') {
      await session.sendTextMessage(text);
    } else {
      await startSession();
      setTimeout(async () => {
        if (session) {
          await session.sendTextMessage(text);
        }
      }, 900);
    }
  };

  const sampleQuestions = [
    {
      label_kn: '🌱 ದಾಳಿಂಬೆ ಬೆಳೆಯ ರೋಗ & ಔಷಧೋಪಚಾರ',
      label_en: '🌱 Pomegranate Disease & Remedies',
      text: isKannada ? 'ದಾಳಿಂಬೆ ಬೆಳೆಗೆ ಬರುವ ದುಂಡಾಣು ರೋಗಕ್ಕೆ ಯಾವ ಔಷಧಿ ಮತ್ತು ಗೊಬ್ಬರ ಬಳಸಬೇಕು?' : 'What remedies and fertilizers should be used for pomegranate bacterial blight?'
    },
    {
      label_kn: '💰 ಈ ವರ್ಷ ನನ್ನ ಒಟ್ಟು ಲಾಭ / ಆದಾಯ ಎಷ್ಟು?',
      label_en: '💰 What is my profit & income this year?',
      text: isKannada ? 'ಈ ವರ್ಷ ನನ್ನ ಕೃಷಿಯ ಒಟ್ಟು ಆದಾಯ ಮತ್ತು ನಿವ್ವಳ ಲಾಭ ಎಷ್ಟು ಬಂದಿದೆ?' : 'What is my total farm income and net profit this year?'
    },
    {
      label_kn: '🌾 ಈ ಹಂಗಾಮಿಗೆ ಯಾವ ಬೆಳೆಗಳು ಉತ್ತಮ?',
      label_en: '🌾 Best crops for this season?',
      text: isKannada ? 'ನಮ್ಮ ಚಿತ್ರದುರ್ಗ ಹೊಸದುರ್ಗ ಭಾಗದಲ್ಲಿ ಈ ಹಂಗಾಮಿಗೆ ಯಾವ ಬೆಳೆ ಬೆಳೆಯುವುದು ಸೂಕ್ತ?' : 'Which crops are most suitable for this season in our Hosadurga Chitradurga region?'
    },
    {
      label_kn: '🏛️ ಸರಕಾರಿ ಗಂಗಾ ಕಲ್ಯಾಣ & ಕೃಷಿ ಯೋಜನೆಗಳು',
      label_en: '🏛️ Government Ganga Kalyana & Farming Schemes',
      text: isKannada ? 'ರೈತರಿಗೆ ಸಿಗುವ ಗಂಗಾ ಕಲ್ಯಾಣ ಬೋರ್‌ವೆಲ್ ಮತ್ತು ಪಿಎಂ ಕಿಸಾನ್ ಯೋಜನೆಯ ವಿವರ ತಿಳಿಸಿ' : 'Explain Ganga Kalyana borewell scheme and PM-Kisan benefits for farmers.'
    },
    {
      label_kn: '🎓 ಮಗ/ಮಗಳ ಶಿಕ್ಷಣ ವೆಚ್ಚ ಎಷ್ಟು?',
      label_en: '🎓 How much spent on education?',
      text: isKannada ? 'ನನ್ನ ಕುಟುಂಬದ ಶಿಕ್ಷಣ ಮತ್ತು ಕಾಲೇಜು ಶುಲ್ಕಕ್ಕೆ ಎಷ್ಟು ಖರ್ಚಾಗಿದೆ?' : 'How much did I spend on family education and college fees?'
    },
    {
      label_kn: '🏦 ಸಾಲದ ಬಾಕಿ ಮೊತ್ತ & ಮಾಸಿಕ ಕಂತು',
      label_en: '🏦 Loan balance & monthly payment?',
      text: isKannada ? 'ನನ್ನ ಸಾಲದ ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತ ಎಷ್ಟು ಮತ್ತು ಬಡ್ಡಿ ವಿವರ ತಿಳಿಸಿ' : 'What is my remaining loan amount and interest details?'
    },
    {
      label_kn: '💧 ಹನಿ ನೀರಾವರಿ ನಿರ್ವಹಣೆ ಸಲಹೆ',
      label_en: '💧 Drip irrigation maintenance tips',
      text: isKannada ? 'ಬೇಸಿಗೆಯಲ್ಲಿ ಹನಿ ನೀರಾವರಿ ಪೈಪ್ ಮತ್ತು ಫಿಲ್ಟರ್ ಹೇಗೆ ನಿರ್ವಹಿಸಬೇಕು?' : 'How to maintain drip irrigation pipes and filters in summer?'
    },
    {
      label_kn: '📊 2025 ಮತ್ತು 2026 ವರ್ಷಗಳ ಹೋಲಿಕೆ',
      label_en: '📊 Compare 2025 & 2026 Records',
      text: isKannada ? '2025 ಮತ್ತು 2026 ವರ್ಷಗಳ ನನ್ನ ಕೃಷಿ ಆದಾಯ ಮತ್ತು ಲಾಭವನ್ನು ಹೋಲಿಸಿ ತಿಳಿಸಿ' : 'Compare my 2025 and 2026 farming income and profit.'
    }
  ];

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '12px 16px 90px', color: '#F8FAFC' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
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
          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            background: status === 'speaking'
              ? 'rgba(16, 185, 129, 0.25)'
              : status === 'listening'
              ? 'rgba(6, 182, 212, 0.25)'
              : status === 'thinking'
              ? 'rgba(245, 158, 11, 0.25)'
              : 'rgba(100, 116, 139, 0.2)',
            border: `1.5px solid ${
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
              backgroundColor: status === 'speaking' ? '#10B981' : status === 'listening' ? '#06B6D4' : '#F59E0B',
              boxShadow: status !== 'idle' ? '0 0 8px currentColor' : 'none'
            }} />
            <span>
              {status === 'speaking'
                ? (isKannada ? 'AI ಮಾತನಾಡುತ್ತಿದೆ...' : 'AI Speaking...')
                : status === 'thinking'
                ? (isKannada ? 'ಯೋಚಿಸುತ್ತಿದೆ...' : 'Thinking & Generating...')
                : status === 'listening'
                ? (isKannada ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ (ನಿರಂತರ)...' : 'Listening (Continuous)...')
                : status === 'paused'
                ? (isKannada ? 'ವಿರಾಮ' : 'Paused')
                : status === 'connecting'
                ? (isKannada ? 'ಸಂಪರ್ಕಿಸುತ್ತಿದೆ...' : 'Connecting...')
                : (isKannada ? 'ಸಿದ್ಧವಾಗಿದೆ' : 'Ready')}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            color: '#38BDF8',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '4px 10px',
            borderRadius: '999px',
            fontWeight: 800
          }}>
            <Radio size={12} color="#38BDF8" />
            <span>GEMINI LIVE</span>
          </div>
        </div>
      </div>

      {/* Main AI Talking Agent Visualizer Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 15, 28, 0.98) 100%)',
        border: '1.5px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '26px',
        padding: '24px 20px',
        textAlign: 'center',
        boxShadow: '0 16px 50px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        {/* Decorative corner glows */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.2)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.2)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '6px'
        }}>
          <Bot size={26} color="#10B981" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
            {isKannada ? '🤖 ಎಂಟಿಜಿ AI ಲೈವ್ ಟಾಕಿಂಗ್ ಏಜೆಂಟ್' : '🤖 MTG AI TALKING AGENT LIVE'}
          </h2>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          {isKannada
            ? 'ಜೆಮಿನಿ AI ಲೈವ್ ಸ್ಟ್ರೀಮಿಂಗ್ • ನಿರಂತರ ಸಂಭಾಷಣೆ • ಕನ್ನಡ & ಇಂಗ್ಲಿಷ್ • ರೈತರಿಗೆ, ಬಳಕೆದಾರರಿಗೆ ನೈಜ ಸಮಯದ ಉತ್ತರ'
            : 'Gemini AI Live Streaming • Continuous Spoken Conversation • Kannada & English • Answers All Questions Lively'}
        </p>

        {/* Private Data Connection Status Badge */}
        <div style={{ marginBottom: '18px' }}>
          {currentUser ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontSize: '0.74rem',
              fontWeight: 700
            }}>
              <ShieldCheck size={14} color="#10B981" />
              {isKannada ? 'ಖಾಸಗಿ ಕೃಷಿ & ಕುಟುಂಬ ದಾಖಲೆಗಳು ಸಂಪರ್ಕಗೊಂಡಿವೆ (Private Data Connected)' : 'Private Farmer Records Connected'}
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#FBBF24',
              fontSize: '0.74rem',
              fontWeight: 700
            }}>
              <Sparkles size={13} color="#FBBF24" />
              {isKannada ? 'ಗ್ರಾಮ & ಕೃಷಿ ಲೈವ್ ಮೋಡ್ • ಖಾಸಗಿ ಲೆಕ್ಕಾಚಾರಕ್ಕೆ ಲಾಗಿನ್ ಆಗಿ' : 'Village & Farming Live Mode • Sign in to connect private farm records'}
            </span>
          )}
        </div>

        {/* Dynamic Pulsing Orb / Talking Avatar */}
        <div
          onClick={handleInterrupt}
          title={status === 'speaking' ? 'Tap to interrupt AI' : undefined}
          style={{
            position: 'relative',
            width: '130px',
            height: '130px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: status === 'speaking' ? 'pointer' : 'default'
          }}
        >
          {/* Animated Volume Wave Ring 1 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: status === 'speaking'
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0) 70%)'
              : status === 'listening'
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(6, 182, 212, 0) 70%)'
              : 'radial-gradient(circle, rgba(100, 116, 139, 0.2) 0%, rgba(100, 116, 139, 0) 70%)',
            transform: `scale(${1 + volumeLevel * 0.5})`,
            transition: 'transform 0.08s ease-out'
          }} />

          {/* Animated Wave Ring 2 */}
          <div style={{
            position: 'absolute',
            inset: '-10px',
            borderRadius: '50%',
            border: `1.5px dashed ${status === 'speaking' ? '#10B981' : status === 'listening' ? '#06B6D4' : 'rgba(255, 255, 255, 0.15)'}`,
            opacity: status === 'idle' ? 0.3 : 0.8,
            animation: status === 'listening' || status === 'speaking' ? 'spin 12s linear infinite' : 'none'
          }} />

          {/* Central Avatar Orb */}
          <div style={{
            width: '92px',
            height: '92px',
            borderRadius: '50%',
            background: status === 'speaking'
              ? 'linear-gradient(135deg, #10B981 0%, #047857 100%)'
              : status === 'thinking'
              ? 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)'
              : status === 'listening'
              ? 'linear-gradient(135deg, #06B6D4 0%, #0369A1 100%)'
              : 'linear-gradient(135deg, #334155 0%, #0F172A 100%)',
            boxShadow: status === 'speaking'
              ? '0 0 35px rgba(16, 185, 129, 0.7)'
              : status === 'listening'
              ? '0 0 35px rgba(6, 182, 212, 0.7)'
              : '0 8px 30px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            border: '2.5px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            {status === 'speaking' ? (
              <Volume2 size={40} color="#FFFFFF" />
            ) : status === 'thinking' ? (
              <Sparkles size={40} color="#FFFFFF" />
            ) : (
              <Mic size={40} color="#FFFFFF" />
            )}
          </div>
        </div>

        {/* Spoken Interim Feedback */}
        {interimText && (
          <div style={{
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '12px',
            padding: '8px 16px',
            maxWidth: '520px',
            margin: '0 auto 16px',
            color: '#E0F2FE',
            fontSize: '0.88rem',
            fontStyle: 'italic'
          }}>
            🎙️ "{interimText}"
          </div>
        )}

        {/* Live Status Description */}
        <p style={{
          fontSize: '0.86rem',
          fontWeight: 700,
          color: status === 'speaking' ? '#34D399' : status === 'listening' ? '#38BDF8' : '#FCD34D',
          margin: '0 0 16px 0'
        }}>
          {status === 'speaking'
            ? (isKannada ? '🔊 AI ಮಾತನಾಡುತ್ತಿದೆ... ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಮಾತನಾಡಿ ನಿಲ್ಲಿಸಬಹುದು' : '🔊 AI is speaking... Speak anytime to interrupt')
            : status === 'thinking'
            ? (isKannada ? '⚡ ಜೆಮಿನಿ AI ಉತ್ತರ ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ...' : '⚡ Gemini AI is thinking & crafting answer...')
            : status === 'listening'
            ? (isKannada ? '🎙️ ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ನಿರಂತರವಾಗಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ' : '🎙️ Listening continuously... Speak your question anytime')
            : (isKannada ? 'ಲೈವ್ ಪ್ರಾರಂಭಿಸಲು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ' : 'Press button below to start live conversation')}
        </p>

        {/* Live Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {status === 'idle' ? (
            <button
              onClick={startSession}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 34px',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(16, 185, 129, 0.45)',
                transition: 'all 0.2s ease'
              }}
            >
              <Mic size={22} />
              <span>{isKannada ? '🎙️ AI ಲೈವ್ ಪ್ರಾರಂಭಿಸಿ (Start Live)' : '🎙️ Start AI Live Agent'}</span>
            </button>
          ) : (
            <>
              {/* Mute Button */}
              <button
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                style={{
                  background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1.5px solid ${isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.18)'}`,
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

              {/* Pause / Resume Button */}
              <button
                onClick={handleTogglePause}
                title={isPaused ? 'Resume' : 'Pause'}
                style={{
                  background: isPaused ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1.5px solid ${isPaused ? '#F59E0B' : 'rgba(255, 255, 255, 0.18)'}`,
                  color: isPaused ? '#F59E0B' : '#FFFFFF',
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

              {/* Interrupt / Stop Speaking Button (visible during speech) */}
              {status === 'speaking' && (
                <button
                  onClick={handleInterrupt}
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1.5px solid #38BDF8',
                    color: '#38BDF8',
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
                  <Square size={16} />
                  <span>{isKannada ? 'ನಿಲ್ಲಿಸಿ (Interrupt)' : 'Stop Speech'}</span>
                </button>
              )}

              {/* End Live Button */}
              <button
                onClick={handleEndLive}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1.5px solid #EF4444',
                  color: '#EF4444',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Square size={16} fill="#EF4444" />
                <span>{isKannada ? '🛑 ಮುಕ್ತಾಯಗೊಳಿಸಿ (Stop Live)' : '🛑 End Live'}</span>
              </button>
            </>
          )}
        </div>

        {errorMessage && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#FCA5A5',
            textAlign: 'left'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}
      </div>

      {/* Suggested Quick Question Pills for Farmers & Villagers */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          color: '#94A3B8',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <Sparkles size={14} color="#10B981" />
          <span>{isKannada ? 'ತಕ್ಷಣ ಕೇಳಬಹುದಾದ ಪ್ರಶ್ನೆಗಳು (Quick Voice Prompts):' : 'Suggested Questions (Tap to Ask):'}</span>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none'
        }}>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuestionPillClick(q.text)}
              style={{
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                padding: '8px 14px',
                fontSize: '0.78rem',
                color: '#E2E8F0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {isKannada ? q.label_kn : q.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* Live Conversation Transcript History */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '16px',
        minHeight: '260px',
        maxHeight: '440px',
        overflowY: 'auto',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: '#64748B',
            padding: '30px 10px'
          }}>
            <Bot size={40} color="#475569" style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              {isKannada
                ? 'ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಲು "AI ಲೈವ್ ಪ್ರಾರಂಭಿಸಿ" ಒತ್ತಿ ಮತ್ತು ಸಹಜವಾಗಿ ಮಾತನಾಡಿ.'
                : 'Tap "Start AI Live Agent" to begin speaking. The agent will listen and respond continuously.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    color: '#6EE7B7',
                    textAlign: 'center',
                    margin: '4px 0'
                  }}
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  fontSize: '0.7rem',
                  color: isUser ? '#34D399' : '#38BDF8',
                  marginBottom: '3px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isUser ? (
                    <>
                      <span>{isKannada ? 'ನೀವು (You)' : 'You'}</span>
                      <span>• {msg.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <Bot size={13} />
                      <span>{isKannada ? 'ಎಂಟಿಜಿ AI ಲೈವ್' : 'MTG AI Agent'}</span>
                      <span>• {msg.timestamp}</span>
                    </>
                  )}
                </div>

                <div style={{
                  background: isUser
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  border: `1px solid ${isUser ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '12px 16px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Text Input Bar (Alternative to speaking) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1.5px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '6px 8px 6px 14px',
        alignItems: 'center',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}>
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          placeholder={isKannada ? 'ಟೈಪ್ ಮಾಡಲು ಬಯಸಿದರೆ ಇಲ್ಲಿ ಬರೆಯಿರಿ...' : 'Type here if you prefer typing...'}
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
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputQuestion.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
