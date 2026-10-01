import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  TalkAgentService,
  TalkAgentStatus,
  TalkMessage
} from '../../services/talkAgentService';
import {
  Bot,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Send,
  X,
  Volume2,
  Wheat,
  GraduationCap,
  Globe2,
  Landmark,
  HelpCircle,
  Radio
} from 'lucide-react';

interface TalkAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TalkAgentModal: React.FC<TalkAgentModalProps> = ({ isOpen, onClose }) => {
  const { isKannada } = useLanguage();

  const [agentService, setAgentService] = useState<TalkAgentService | null>(null);
  const [status, setStatus] = useState<TalkAgentStatus>('idle');
  const [interimText, setInterimText] = useState<string>('');
  const [messages, setMessages] = useState<TalkMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  // Initialize service when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      const svc = new TalkAgentService({
        onStatusChange: (newStatus) => setStatus(newStatus),
        onInterimText: (text) => setInterimText(text),
        onNewMessage: (msg) => setMessages((prev) => [...prev, msg]),
        onError: (err) => setErrorMessage(err)
      });
      setAgentService(svc);
      // Auto-start listening on open for immediate interactive experience
      svc.startListening();

      return () => {
        svc.stop();
      };
    } else {
      if (agentService) {
        agentService.stop();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleListening = () => {
    if (!agentService) return;
    if (status === 'listening') {
      agentService.stop();
    } else {
      agentService.startListening();
    }
  };

  const handleStopSpeaking = () => {
    if (agentService) {
      agentService.stopSpeaking();
      agentService.startListening();
    }
  };

  const handleSendText = () => {
    if (!inputText.trim() || !agentService) return;
    const q = inputText.trim();
    setInputText('');
    agentService.answerQuestion(q);
  };

  const handlePromptClick = (prompt: string) => {
    if (!agentService) return;
    agentService.answerQuestion(prompt);
  };

  const categories = [
    { id: 'all', icon: Sparkles, label_kn: 'ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳು', label_en: 'All Topics' },
    { id: 'agri', icon: Wheat, label_kn: 'ಕೃಷಿ & ಬೆಳೆಗಳು', label_en: 'Agriculture' },
    { id: 'edu', icon: GraduationCap, label_kn: 'ಶಿಕ್ಷಣ & ಭವಿಷ್ಯ', label_en: 'Education Future' },
    { id: 'gk', icon: Globe2, label_kn: 'ಸಾಮಾನ್ಯ ಜ್ಞಾನ', label_en: 'General Knowledge' },
    { id: 'hist', icon: Landmark, label_kn: 'ಇತಿಹಾಸ & ಕೋಟೆ', label_en: 'History' }
  ];

  const suggestedQuestions = [
    {
      cat: 'agri',
      label_kn: '🌱 ದಾಳಿಂಬೆ ರೋಗ ಮತ್ತು ಔಷಧೋಪಚಾರ ಏನು?',
      label_en: '🌱 Pomegranate disease remedies?',
      text: isKannada ? 'ದಾಳಿಂಬೆ ಬೆಳೆಗೆ ಬರುವ ದುಂಡಾಣು ರೋಗಕ್ಕೆ ಯಾವ ಔಷಧಿ ಮತ್ತು ಗೊಬ್ಬರ ಬಳಸಬೇಕು?' : 'What remedies should be used for pomegranate bacterial blight and pest control?'
    },
    {
      cat: 'edu',
      label_kn: '🎓 PUC ನಂತರ ಉತ್ತಮ ಕೋರ್ಸ್ ಮತ್ತು ಭವಿಷ್ಯ ಯಾವುದು?',
      label_en: '🎓 Best courses and careers after PUC?',
      text: isKannada ? 'ದ್ವಿತೀಯ ಪಿಯುಸಿ ನಂತರ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಉತ್ತಮ ಕೋರ್ಸ್‌ಗಳು ಮತ್ತು ಉದ್ಯೋಗ ಭವಿಷ್ಯವೇನು?' : 'What are the best courses and career paths after PUC?'
    },
    {
      cat: 'gk',
      label_kn: '🌍 ಸೂರ್ಯಗ್ರಹಣ ಹೇಗೆ ಸಂಭವಿಸುತ್ತದೆ?',
      label_en: '🌍 How does a solar eclipse happen?',
      text: isKannada ? 'ಸೂರ್ಯಗ್ರಹಣ ಹೇಗೆ ಸಂಭವಿಸುತ್ತದೆ? ಸರಳವಾಗಿ ವಿವರಿಸಿ' : 'How does a solar eclipse occur? Explain simply.'
    },
    {
      cat: 'hist',
      label_kn: '🏛️ ಚಿತ್ರದುರ್ಗ ಮದಕರಿ ನಾಯಕ ಮತ್ತು ಒನಕೆ ಓಬವ್ವ ಇತಿಹಾಸ',
      label_en: '🏛️ Chitradurga Fort & Obavva History',
      text: isKannada ? 'ಚಿತ್ರದುರ್ಗದ ಕಲ್ಲಿನ ಕೋಟೆ ಮತ್ತು ವೀರ ವನಿತೆ ಒನಕೆ ಓಬವ್ವನ ಸಾಹಸ ಇತಿಹಾಸ ತಿಳಿಸಿ' : 'Tell the heroic history of Chitradurga Fort and Onake Obavva.'
    },
    {
      cat: 'agri',
      label_kn: '🌾 ಗಂಗಾ ಕಲ್ಯಾಣ ಬೋರ್‌ವೆಲ್ ಯೋಜನೆ ವಿವರ',
      label_en: '🌾 Ganga Kalyana Borewell Scheme',
      text: isKannada ? 'ಕರ್ನಾಟಕ ಸರಕಾರದ ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆಯ ನಿಯಮಗಳು ಮತ್ತು ಸೌಲಭ್ಯಗಳೇನು?' : 'What are the eligibility criteria and benefits of Ganga Kalyana borewell scheme?'
    },
    {
      cat: 'edu',
      label_kn: '💼 ಪೊಲೀಸ್ ಮತ್ತು KPSC ಪರೀಕ್ಷೆಗೆ ಹೇಗೆ ಸಿದ್ಧತೆ ಮಾಡಬೇಕು?',
      label_en: '💼 How to prepare for KPSC and Police exams?',
      text: isKannada ? 'ಗ್ರಾಮೀಣ ಯುವಕರು ಪೊಲೀಸ್ ಮತ್ತು ಕೆಪಿಎಸ್‌ಸಿ ಸ್ಪರ್ಧಾತ್ಮಕ ಪರೀಕ್ಷೆಗಳಿಗೆ ಹೇಗೆ ಓದಬೇಕು?' : 'How should rural students prepare for KPSC and Police competitive exams?'
    }
  ];

  const filteredQuestions = selectedCategory === 'all'
    ? suggestedQuestions
    : suggestedQuestions.filter((q) => q.cat === selectedCategory);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(6, 15, 28, 0.99) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '26px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          color: '#F8FAFC'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.5)'
              }}
            >
              <Bot size={22} color="#FFFFFF" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {isKannada ? '🤖 ಟಾಕ್ ಏಜೆಂಟ್ ಲೈವ್' : '🤖 TALK AGENT LIVE'}
                </h3>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #EF4444',
                    color: '#EF4444',
                    borderRadius: '20px',
                    padding: '2px 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                  GEMINI LIVE
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: 0 }}>
                {isKannada
                  ? 'ಕೃಷಿ • ಶಿಕ್ಷಣ & ಭವಿಷ್ಯ • ಸಾಮಾನ್ಯ ಜ್ಞಾನ • ಇತಿಹಾಸ • ಯಾವುದೇ ಪ್ರಶ್ನೆ'
                  : 'Agriculture • Education • General Knowledge • History • Any Question'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#CBD5E1',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Pills (Agriculture, Education, GK, History, All) */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 16px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: isSelected ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#34D399' : '#CBD5E1',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={13} color={isSelected ? '#34D399' : '#94A3B8'} />
                <span>{isKannada ? cat.label_kn : cat.label_en}</span>
              </button>
            );
          })}
        </div>

        {/* Visualizer & Mic Centerpiece */}
        <div
          style={{
            padding: '16px 20px',
            textAlign: 'center',
            background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0) 70%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Animated Talking Orb */}
          <div
            onClick={handleToggleListening}
            style={{
              position: 'relative',
              width: '100px',
              height: '100px',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {/* Wave Pulse */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: status === 'speaking'
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0) 70%)'
                  : status === 'answering'
                  ? 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0) 70%)'
                  : status === 'listening'
                  ? 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0) 70%)'
                  : 'radial-gradient(circle, rgba(100, 116, 139, 0.2) 0%, rgba(100, 116, 139, 0) 70%)',
                animation: status !== 'idle' ? 'pulse 1.8s infinite' : 'none'
              }}
            />

            {/* Core Orb */}
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: status === 'speaking'
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : status === 'answering'
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : status === 'listening'
                  ? 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)'
                  : 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: status === 'speaking'
                  ? '0 0 28px rgba(16, 185, 129, 0.7)'
                  : status === 'listening'
                  ? '0 0 28px rgba(6, 182, 212, 0.7)'
                  : '0 8px 24px rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                zIndex: 2,
                transition: 'all 0.3s ease'
              }}
            >
              {status === 'speaking' ? (
                <Volume2 size={34} color="#FFFFFF" />
              ) : status === 'answering' ? (
                <Sparkles size={34} color="#FFFFFF" />
              ) : (
                <Mic size={34} color="#FFFFFF" />
              )}
            </div>
          </div>

          {/* Status Text Indicator */}
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: status === 'speaking' ? '#34D399' : status === 'answering' ? '#FBBF24' : '#38BDF8' }}>
            {status === 'speaking'
              ? (isKannada ? '🔊 ಟಾಕ್ ಏಜೆಂಟ್ ಮಾತನಾಡುತ್ತಿದೆ... ನಿಲ್ಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ' : '🔊 Speaking answer... Tap orb to interrupt')
              : status === 'answering'
              ? (isKannada ? '⚡ ಕ್ಷಣಾರ್ಧದಲ್ಲಿ ಉತ್ತರಿಸಲಾಗುತ್ತಿದೆ...' : '⚡ Answering within seconds from Gemini...')
              : status === 'listening'
              ? (isKannada ? '🎙️ ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ' : '🎙️ Listening... Ask your question now')
              : (isKannada ? 'ಮಾತನಾಡಲು ಮೈಕ್ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ' : 'Tap mic to ask any question')}
          </div>

          {/* Live Interim Speech Preview */}
          {interimText && (
            <div
              style={{
                marginTop: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '12px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                color: '#E0F2FE',
                fontStyle: 'italic',
                maxWidth: '440px',
                margin: '8px auto 0'
              }}
            >
              🎙️ "{interimText}"
            </div>
          )}

          {/* Interrupt button during speech */}
          {status === 'speaking' && (
            <button
              onClick={handleStopSpeaking}
              style={{
                marginTop: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                borderRadius: '16px',
                padding: '4px 14px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Square size={12} fill="#EF4444" />
              <span>{isKannada ? 'ನಿಲ್ಲಿಸಿ (Interrupt)' : 'Stop Voice'}</span>
            </button>
          )}

          {errorMessage && (
            <div style={{ marginTop: '8px', color: '#FCA5A5', fontSize: '0.75rem' }}>
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* Suggested Quick Question Pills */}
        <div style={{ padding: '10px 16px 4px', background: 'rgba(15, 23, 42, 0.3)' }}>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
            {isKannada ? 'ತಕ್ಷಣ ಕೇಳಬಹುದಾದ ಪ್ರಶ್ನೆಗಳು (Tap to ask):' : 'Quick Suggested Questions (Tap to ask):'}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              paddingBottom: '6px'
            }}
          >
            {filteredQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(q.text)}
                style={{
                  flexShrink: 0,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  fontSize: '0.74rem',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isKannada ? q.label_kn : q.label_en}
              </button>
            ))}
          </div>
        </div>

        {/* Conversational Transcript History */}
        <div
          style={{
            flex: 1,
            minHeight: '180px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'rgba(3, 7, 18, 0.5)'
          }}
        >
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#64748B', fontSize: '0.82rem', padding: '16px' }}>
              <Bot size={32} color="#475569" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0 }}>
                {isKannada
                  ? 'ಕೃಷಿ, ಶಿಕ್ಷಣ, ಸಾಮಾನ್ಯ ಜ್ಞಾನ, ಇತಿಹಾಸ ಅಥವಾ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ. ಕ್ಷಣಾರ್ಧದಲ್ಲಿ ಉತ್ತರ ನೀಡುತ್ತೇನೆ!'
                  : 'Ask any question about agriculture, education future, GK, history, or anything. Instant lively answer!'}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <span style={{ fontSize: '0.66rem', color: isUser ? '#34D399' : '#38BDF8', marginBottom: '2px', fontWeight: 700 }}>
                    {isUser ? (isKannada ? 'ನೀವು' : 'You') : (isKannada ? '🤖 ಟಾಕ್ ಏಜೆಂಟ್' : '🤖 Talk Agent')} • {m.timestamp}
                  </span>
                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                      border: `1px solid ${isUser ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                      fontSize: '0.86rem',
                      lineHeight: 1.45,
                      color: '#FFFFFF'
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Input Bar (Alternative to voice) */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.9)'
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder={isKannada ? 'ಕೃಷಿ, ಶಿಕ್ಷಣ, ಇತಿಹಾಸ ಅಥವಾ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ...' : 'Ask agriculture, education, history, or anything...'}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '8px 14px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />

          <button
            onClick={handleSendText}
            disabled={!inputText.trim()}
            style={{
              background: inputText.trim() ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: inputText.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
