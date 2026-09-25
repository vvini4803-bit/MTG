import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Trash2
} from 'lucide-react';

interface VoiceAssistantScreenProps {
  onNavigateTab: (tab: ViewTab) => void;
}

interface AssistantMessageItem {
  id: string;
  query: string;
  response: VoiceQueryResponse;
  timestamp: Date;
  isExpanded: boolean;
  showOtherLang: boolean;
}

export const VoiceAssistantScreen: React.FC<VoiceAssistantScreenProps> = ({ onNavigateTab }) => {
  const { language, setLanguage, isKannada } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [messages, setMessages] = useState<AssistantMessageItem[]>([]);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
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
      }
    );
  };

  const handleProcessQuery = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setErrorMessage(null);
    setIsProcessing(true);
    voiceAssistant.stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await voiceAssistant.query(text, language);
      const newMsg: AssistantMessageItem = {
        id: 'msg_' + Date.now(),
        query: text.trim(),
        response: res,
        timestamp: new Date(),
        isExpanded: true,
        showOtherLang: false
      };

      setMessages((prev) => [...prev, newMsg]);
      setQueryText('');

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);

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

  const toggleExpandMessage = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const nextState = !m.isExpanded;
          if (nextState) {
            setTimeout(() => {
              itemRefs.current[msgId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 80);
          }
          return { ...m, isExpanded: nextState };
        }
        return m;
      })
    );
  };

  const toggleMessageLang = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, showOtherLang: !m.showOtherLang } : m))
    );
  };

  const handlePlayAudio = (text: string, lang: 'kn' | 'en') => {
    voiceAssistant.stopSpeaking();
    setIsSpeaking(true);
    voiceAssistant.speak(
      text,
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
        'ದೇವಸ್ಥಾನಗಳ ದರ್ಶನ ಸಮಯ ಯಾವಾಗ?',
        'ಕೃಷಿ ಮಾಹಿತಿ ಮತ್ತು ಬೆಳೆ ಸಲಹೆಗಳು',
        'ಕ್ರಿಕೆಟ್ ಟೂರ್ನಮೆಂಟ್ ವೇಳಾಪಟ್ಟಿ',
        'ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿ ಎಲ್ಲಿದೆ?'
      ]
    : [
        'What is happening in our village today?',
        'Temple darshan timings and pooja',
        'Show agriculture and crop tips',
        'When is the cricket tournament?',
        'Where is the Grama Panchayat office?'
      ];

  const getDetailedInfo = (category: string, isKn: boolean) => {
    const cat = (category || '').toUpperCase();
    if (cat.includes('TEMPLE') || cat.includes('ದೇವಸ್ಥಾನ')) {
      return {
        timing: isKn ? 'ಮುಂಜಾನೆ ೬:೦೦ - ೧೨:೩೦ ಮತ್ತು ಸಂಜೆ ೫:೩೦ - ೮:೩೦' : '6:00 AM - 12:30 PM & 5:30 PM - 8:30 PM',
        location: isKn ? 'ಮುತ್ತಾಗೊಂದಿ ರಥ ಬೀದಿ ಮತ್ತು ಹೆರಿಟೇಜ್ ಕಾಂಪ್ಲೆಕ್ಸ್' : 'Car Street & Heritage Sanctum, Muttagundi',
        guideline: isKn
          ? 'ಪ್ರತಿದಿನ ಮಹಾ ಮಂಗಳಾರತಿ, ನೈವೇದ್ಯ ಮತ್ತು ವಾರದ ಶನಿವಾರ, ಸೋಮವಾರ ವಿಶೇಷ ಪೂಜೆ ನಡೆಯುತ್ತದೆ. ಭಕ್ತರಿಗೆ ಅನ್ನದಾಸೋಹ ವ್ಯವಸ್ಥೆ ಇರುತ್ತದೆ.'
          : 'Daily Maha Mangalarathi & Archana. Special pooja sevas conducted on Mondays & Saturdays with prasada distribution.',
        tab: 'temples' as ViewTab,
        tabName: isKn ? 'ದೇವಾಲಯಗಳ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Temples Section'
      };
    } else if (cat.includes('AGRICULTURE') || cat.includes('ಕೃಷಿ')) {
      return {
        timing: isKn ? 'ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ: ಬೆಳಗ್ಗೆ ೧೦:೦೦ - ಸಂಜೆ ೫:೩೦' : 'Raitha Samparka Kendra: 10:00 AM - 5:30 PM',
        location: isKn ? 'ಕೃಷಿ ಸೇವಾ ಕೇಂದ್ರ, ಹೊಸದುರ್ಗ ರಸ್ತೆ, ಮುತ್ತಾಗೊಂದಿ' : 'Krishi Seva Center, Hosadurga Road, Muttagundi',
        guideline: isKn
          ? 'ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ತೆಂಗು, ಮೆಕ್ಕೆಜೋಳ ಬೆಳೆಗಳಿಗೆ ಹನಿ ನೀರಾವರಿ, ಕೀಟನಾಶಕ ನಿಯಂತ್ರಣ ಹಾಗೂ ಕೃಷಿ ಇಲಾಖೆಯ ಸಬ್ಸಿಡಿ ಯೋಜನೆಗಳ ವಿವರ ಲಭ್ಯವಿದೆ.'
          : 'Drip irrigation subsidies, soil testing reports, and certified seed distribution schedules available through Panchayat Agri Desk.',
        tab: 'agriculture' as ViewTab,
        tabName: isKn ? 'ಕೃಷಿ ವಿಭಾಗ ತೆರೆಯಿರಿ' : 'Open Agriculture Section'
      };
    } else if (cat.includes('SPORTS') || cat.includes('ಕ್ರೀಡೆ')) {
      return {
        timing: isKn ? 'ಪಂದ್ಯಾವಳಿ ಸಮಯ: ಬೆಳಗ್ಗೆ ೮:೦೦ - ಸಂಜೆ ೬:೦೦' : 'Tournament Match Hours: 8:00 AM - 6:00 PM',
        location: isKn ? 'ಮುತ್ತಾಗೊಂದಿ ಸರ್ಕಾರಿ ಶಾಲಾ ಮೈದಾನ' : 'Muttagundi Village Ground',
        guideline: isKn
          ? 'ಗ್ರಾಮ ಮಟ್ಟದ ಕ್ರಿಕೆಟ್ ಹಾಗೂ ಕಬಡ್ಡಿ ಲೀಗ್ ಪಂದ್ಯಗಳು ನೇರ ಪ್ರಸಾರ ಸ್ಕೋರ್ ಕಾರ್ಡ್ ನವೀಕರಣದೊಂದಿಗೆ ಲಭ್ಯವಿವೆ.'
          : 'Village cricket & kabaddi tournaments with live ball-by-ball score tracking and digital team roster registers.',
        tab: 'sports' as ViewTab,
        tabName: isKn ? 'ಕ್ರೀಡಾ ವಿಭಾಗ ತೆರೆಯಿರಿ' : 'Open Sports Section'
      };
    } else if (cat.includes('EVENTS') || cat.includes('ಕಾರ್ಯಕ್ರಮ')) {
      return {
        timing: isKn ? 'ಕಾರ್ಯಕ್ರಮ ಸಮಯ: ಬೆಳಿಗ್ಗೆ ೯:೦೦ ರಿಂದ ಸಂಜೆ' : 'Event Schedule: 9:00 AM onwards',
        location: isKn ? 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಸಭಾಂಗಣ / ರಂಗಮಂದಿರ' : 'Grama Panchayat Community Hall, Muttagundi',
        guideline: isKn
          ? 'ಗ್ರಾಮದ ಪ್ರಮುಖ ಹಬ್ಬಗಳು, ಆರೋಗ್ಯ ಶಿಬಿರ, ಸರ್ಕಾರಿ ಯೋಜನೆ ನೋಂದಣಿ ಹಾಗೂ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳ ದೃಢೀಕೃತ ವಿವರಗಳು.'
          : 'Official community assemblies, health camps, citizen felicitation, and festive cultural gatherings.',
        tab: 'events' as ViewTab,
        tabName: isKn ? 'ಕಾರ್ಯಕ್ರಮಗಳ ಪುಟ ತೆರೆಯಿರಿ' : 'Open Events Section'
      };
    } else {
      return {
        timing: isKn ? 'ಪಂಚಾಯತ್ ಕಚೇರಿ: ೧೦:೦೦ AM - ೫:೩೦ PM' : 'Panchayat Desk: 10:00 AM - 5:30 PM',
        location: isKn ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಪಂಚಾಯತಿ, ಹೊಸದುರ್ಗ ತಾಲೂಕು' : 'Muttagundi Grama Panchayat, Hosadurga Taluk',
        guideline: isKn
          ? 'ಗ್ರಾಮದ ೨೦೨೬ ಅಧಿಕೃತ ದೃಢೀಕೃತ ದಾಖಲೆಗಳೊಂದಿಗೆ ಈ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಲಾಗಿದೆ. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗೆ ಪಂಚಾಯತ್ ಸಹಾಯವಾಣಿಯನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.'
          : 'This response is verified against Muttagundi 2026 digital village heritage and administration registry.',
        tab: 'news' as ViewTab,
        tabName: isKn ? 'ಗ್ರಾಮ ಸುದ್ದಿ ನೋಡಿ' : 'View Village News'
      };
    }
  };

  return (
    <div
      className="container"
      style={{
        padding: '24px 16px 80px',
        maxWidth: '680px',
        textAlign: 'center',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Sparkles size={18} color="#F59E0B" />
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.05em' }}>
          2026 DIGITAL VILLAGE VOICE ASSISTANT
        </span>
      </div>

      <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>
        {isKannada ? 'ದ್ವಿಭಾಷಾ ಧ್ವನಿ ಸಹಾಯಕ' : 'Bilingual Village Voice Assistant'}
      </h1>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
        {isKannada
          ? 'ನಮ್ಮ ಗ್ರಾಮದ ದೃಢೀಕೃತ ಮಾಹಿತಿ, ಕೃಷಿ, ದೇಗುಲಗಳು, ಶಿಕ್ಷಣ, ಅಥವಾ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ'
          : 'Ask any question about village news, farming, temples, education, or general topics'}
      </p>

      {/* Language switcher & Mute toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
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

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '6px 12px',
              borderRadius: '9999px',
              color: '#F87171',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} />
            <span>{isKannada ? 'ಚಾಟ್ ತೆರವು' : 'Clear'}</span>
          </button>
        )}
      </div>

      {/* Interactive 3D Soundwave Orb (Pass-through for touch scrolling) */}
      <div style={{ margin: '8px 0 16px' }}>
        <VoiceOrb isListening={isListening} isSpeaking={isSpeaking} size={150} />
        <p style={{
          fontSize: '0.9rem',
          color: isProcessing ? '#F59E0B' : isListening ? '#EF4444' : isSpeaking ? '#10B981' : 'var(--text-secondary)',
          fontWeight: 700,
          marginTop: '10px'
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

      {/* Round Mic Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={isListening ? () => setIsListening(false) : handleStartListening}
          disabled={isProcessing}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isListening
              ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
              : isProcessing
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
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
          padding: '10px 14px',
          color: '#FCA5A5',
          fontSize: '0.82rem',
          marginBottom: '18px'
        }}>
          {errorMessage}
        </div>
      )}

      {/* 📜 CONVERSATION MESSAGES LIST WITH SMOOTH SCROLLING AT ANY POINT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', textAlign: 'left' }}>
        {messages.map((item) => {
          const answer = language === 'kn' ? item.response.answer_kn : item.response.answer_en;
          const otherAnswer = language === 'kn' ? item.response.answer_en : item.response.answer_kn;
          const detail = getDetailedInfo(item.response.category, isKannada);

          return (
            <div
              key={item.id}
              ref={(el) => { itemRefs.current[item.id] = el; }}
              className="glass-card"
              style={{
                padding: '18px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: item.response.isVerified ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Question Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    Q
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                    "{item.query}"
                  </span>
                </div>

                {item.response.isVerified ? (
                  <span className="badge badge-verified" style={{ fontSize: '0.66rem' }}>
                    <ShieldCheck size={11} />
                    {isKannada ? 'ದೃಢೀಕೃತ ಮಾಹಿತಿ' : 'VERIFIED'}
                  </span>
                ) : (
                  <span className="badge badge-pending" style={{ fontSize: '0.66rem' }}>
                    <AlertCircle size={11} />
                    {isKannada ? 'AI ಉತ್ತರ' : 'AI ANSWER'}
                  </span>
                )}
              </div>

              {/* Main Answer - Tapping anywhere expands details */}
              <div
                onClick={() => toggleExpandMessage(item.id)}
                style={{ cursor: 'pointer' }}
                title={isKannada ? 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ' : 'Tap to toggle details'}
              >
                <p style={{
                  fontSize: '0.98rem',
                  color: '#FFFFFF',
                  lineHeight: 1.65,
                  marginBottom: '12px',
                  fontWeight: 500
                }}>
                  {answer}
                </p>
              </div>

              {/* Controls bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(item.response.answer_kn, 'kn')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: '#34D399',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Listen in Kannada"
                  >
                    <Volume2 size={13} />
                    <span>🔊 ಕನ್ನಡ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayAudio(item.response.answer_en, 'en')}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: '#60A5FA',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Listen in English"
                  >
                    <Volume2 size={13} />
                    <span>🔊 English</span>
                  </button>

                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={handleStopAudio}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: '#F87171',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⏹️ {isKannada ? 'ನಿಲ್ಲಿಸಿ' : 'Stop'}
                    </button>
                  )}
                </div>

                {/* 🔍 VIEW MORE DETAILS TOGGLE */}
                <button
                  type="button"
                  onClick={() => toggleExpandMessage(item.id)}
                  style={{
                    background: item.isExpanded ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: item.isExpanded ? '1px solid #F59E0B' : '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    color: item.isExpanded ? '#FBBF24' : '#E2E8F0',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{item.isExpanded ? (isKannada ? 'ವಿವರ ಮರೆಮಾಡಿ' : 'Hide Details') : (isKannada ? '🔍 ವಿವರ ನೋಡಿ (View Details)' : '🔍 View More Details')}</span>
                  {item.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* 📖 EXPANDED DETAILS ACCORDION */}
              {item.isExpanded && (
                <div style={{
                  marginTop: '10px',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  fontSize: '0.84rem',
                  color: '#E2E8F0',
                  lineHeight: 1.55
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Clock size={15} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                          {isKannada ? 'ಸಮಯ / ಕಾರ್ಯಾಚರಣೆ' : 'Schedule / Timings'}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>{detail.timing}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin size={15} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                          {isKannada ? 'ಸ್ಥಳ / ವಿಳಾಸ' : 'Location / Landmark'}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>{detail.location}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    marginBottom: '12px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10B981'
                  }}>
                    <div style={{ fontSize: '0.74rem', color: '#34D399', fontWeight: 700, marginBottom: '4px' }}>
                      {isKannada ? 'ಪಂಚಾಯತ್ ಮಾರ್ಗದರ್ಶನ & ಸಲಹೆ' : 'Village Administration Advisory'}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                      {detail.guideline}
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => toggleMessageLang(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38BDF8',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {item.showOtherLang
                        ? isKannada ? '▼ ಅನುವಾದ ಮುಚ್ಚಿ' : '▼ Hide translation'
                        : isKannada ? '▶ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ನೋಡಿ (View in English)' : '▶ ಕನ್ನಡದಲ್ಲಿ ನೋಡಿ (View in Kannada)'}
                    </button>
                    {item.showOtherLang && (
                      <div style={{
                        marginTop: '6px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        color: '#CBD5E1'
                      }}>
                        {otherAnswer}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                    <button
                      onClick={() => {
                        const targetTab = (item.response.navTab as ViewTab) || detail.tab;
                        onNavigateTab(targetTab);
                      }}
                      className="btn-primary"
                      style={{
                        fontSize: '0.78rem',
                        padding: '6px 14px',
                        minHeight: '34px',
                        gap: '6px'
                      }}
                    >
                      <span>{detail.tabName}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          {isKannada ? 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು (ಟ್ಯಾಪ್ ಮಾಡಿ):' : 'Suggested Questions (Tap to ask):'}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setQueryText(prompt);
                handleProcessQuery(prompt);
              }}
              disabled={isProcessing}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleProcessQuery(queryText);
        }}
        style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}
      >
        <input
          type="text"
          className="form-input"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder={isKannada ? 'ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ (ಟೈಪ್ ಮಾಡಿ)...' : 'Ask any village question (type here)...'}
          disabled={isProcessing}
          style={{ flex: 1, height: '48px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{
            height: '48px',
            padding: '0 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            minWidth: '110px',
            cursor: (!queryText.trim() || isProcessing) ? 'not-allowed' : 'pointer',
            opacity: (!queryText.trim() || isProcessing) ? 0.7 : 1
          }}
          disabled={!queryText.trim() || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="spinner animate-spin" />
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

export default VoiceAssistantScreen;
