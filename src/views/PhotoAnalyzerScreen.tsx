import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { geminiService, PhotoAnalysisResult } from '../services/geminiService';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Info,
  HelpCircle,
  Stethoscope,
  Wheat,
  Landmark,
  Building2,
  Flame,
  Search
} from 'lucide-react';

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface PhotoAnalyzerScreenProps {
  onBack?: () => void;
}

export const PhotoAnalyzerScreen: React.FC<PhotoAnalyzerScreenProps> = ({ onBack }) => {
  const { language, setLanguage, isKannada } = useLanguage();

  // Active language for this screen (defaults to user's selected app language)
  const [activeLang, setActiveLang] = useState<'kn' | 'en'>(language === 'en' ? 'en' : 'kn');

  // Sync with global app language if it changes
  useEffect(() => {
    setActiveLang(language === 'en' ? 'en' : 'kn');
  }, [language]);

  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string } | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Conversational Follow-Up State
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState<boolean>(false);

  // Audio / Speech State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Hidden File Inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Scroll chat down when new message is added
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAskingFollowUp]);

  // Smart client-side image compression & optimization to max 1280px (fast upload & memory safe)
  const processAndSetImage = (file: File) => {
    setErrorMessage(null);
    setAnalysisResult(null);
    setChatHistory([]);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);

    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        activeLang === 'kn'
          ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಜ್ ಫೈಲ್ (JPG, PNG, WEBP) ಆಯ್ಕೆಮಾಡಿ.'
          : 'Please select a valid image file (JPG, PNG, WEBP).'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
          setSelectedImage(compressedDataUrl);
          setMimeType('image/jpeg');
          setImageMeta({
            name: file.name || 'Captured Photo',
            size: `${Math.round(compressedDataUrl.length * 0.75 / 1024)} KB`
          });
        }
      };
      img.onerror = () => {
        setErrorMessage(
          activeLang === 'kn'
            ? 'ಚಿತ್ರವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಂದು ಫೋಟೋ ಪ್ರಯತ್ನಿಸಿ.'
            : 'Unable to process image. Please try another photo.'
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndSetImage(file);
    }
    e.target.value = '';
  };

  // Run Gemini Multimodal Analysis
  const handleAnalyzePhoto = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);

    try {
      const result = await geminiService.analyzePhoto(selectedImage, mimeType);
      setAnalysisResult(result);

      // Initialize initial conversation summary
      const initialSummary =
        activeLang === 'kn'
          ? `ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ: ${result.what_i_see_kn} \n\nಮುಂದಿನ ಶಿಫಾರಸು: ${result.recommended_action_kn}`
          : `Analysis complete: ${result.what_i_see_en} \n\nRecommended: ${result.recommended_action_en}`;

      setChatHistory([
        {
          role: 'model',
          text: initialSummary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error('Photo analysis error:', err);
      setErrorMessage(
        activeLang === 'kn'
          ? 'ಫೋಟೋ ವಿಶ್ಲೇಷಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'Unable to analyze the photo right now. Please check your internet connection and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear / Delete Photo (Privacy Safe)
  const handleDeletePhoto = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setSelectedImage(null);
    setImageMeta(null);
    setAnalysisResult(null);
    setChatHistory([]);
    setErrorMessage(null);
  };

  // Follow-Up Question Submit (Text or Voice)
  const handleSendFollowUp = async (questionText?: string) => {
    const q = (questionText || followUpQuestion).trim();
    if (!q || !selectedImage || isAskingFollowUp) return;

    setFollowUpQuestion('');
    const userTurn: ChatTurn = {
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatHistory, userTurn];
    setChatHistory(newHistory);
    setIsAskingFollowUp(true);

    try {
      const aiReply = await geminiService.askPhotoFollowUp(
        selectedImage,
        mimeType,
        chatHistory.map((c) => ({ role: c.role, text: c.text })),
        q,
        activeLang
      );

      const modelTurn: ChatTurn = {
        role: 'model',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory([...newHistory, modelTurn]);

      if (isPlayingAudio) {
        speakText(aiReply);
      }
    } catch (err) {
      const errTurn: ChatTurn = {
        role: 'model',
        text:
          activeLang === 'kn'
            ? 'ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.'
            : 'Could not fetch reply. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory([...newHistory, errTurn]);
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  // Speech Recognition (Voice Input)
  const toggleVoiceInput = () => {
    if (isListeningVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(
        activeLang === 'kn'
          ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕ್ರೋಮ್ ಬ್ರೌಸರ್ ಬಳಸಿ.'
          : 'Voice input is not supported in this browser. Please use Chrome.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = activeLang === 'kn' ? 'kn-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setFollowUpQuestion(transcript);
          handleSendFollowUp(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e);
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListeningVoice(false);
    }
  };

  // Text to Speech (TTS)
  const speakText = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = activeLang === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchVoice = voices.find((v) =>
      activeLang === 'kn'
        ? v.lang.includes('kn') || v.name.toLowerCase().includes('kannada')
        : v.lang.includes('en-IN') || v.lang.includes('en')
    );
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayAnalysisAudio = () => {
    if (!analysisResult) return;
    const textToSpeak =
      activeLang === 'kn'
        ? `${analysisResult.what_i_see_kn}. ${analysisResult.analysis_kn}. ${analysisResult.recommended_action_kn}`
        : `${analysisResult.what_i_see_en}. ${analysisResult.analysis_en}. ${analysisResult.recommended_action_en}`;
    speakText(textToSpeak);
  };

  // Preset Sample Images for Immediate One-Click Demonstration
  const loadSample = (sampleType: 'LEAF' | 'TEMPLE' | 'NOTICE' | 'HEALTH' | 'TRACTOR') => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (sampleType === 'LEAF') {
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, 0, 600, 450);
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(300, 225, 200, 110, Math.PI / 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(260, 200, 35, 0, 2 * Math.PI);
      ctx.arc(330, 250, 40, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#86EFAC';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(170, 95);
      ctx.lineTo(430, 355);
      ctx.stroke();
    } else if (sampleType === 'TEMPLE') {
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(0, 0, 600, 450);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(200, 260, 200, 140);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(230, 180, 140, 80);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(260, 120, 80, 60);
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(300, 100, 16, 0, 2 * Math.PI);
      ctx.fill();
    } else if (sampleType === 'NOTICE') {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, 600, 450);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(80, 50, 440, 350);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('ಗ್ರಾಮ ಪಂಚಾಯತಿ ಪ್ರಕಟಣೆ', 150, 110);
      ctx.font = '16px sans-serif';
      ctx.fillText('ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಸಭೆ ದಿನಾಂಕ: 15-10-2026', 130, 160);
      ctx.fillText('ವಿಷಯ: ಕೃಷಿ ಸಹಾಯಧನ & ಬೆಳೆ ಪರಿಹಾರ ನೋಂದಣಿ', 130, 200);
      ctx.fillText('ಸಮಯ: ಬೆಳಗ್ಗೆ 10:30 ಗಂಟೆಗೆ ಗ್ರಾಮ ಪಂಚಾಯತಿ ಸಭಾಂಗಣ', 130, 240);
    } else if (sampleType === 'HEALTH') {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 600, 450);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(150, 80, 300, 290);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(270, 140, 60, 170);
      ctx.fillRect(215, 195, 170, 60);
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 600, 450);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(160, 200, 280, 120);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(220, 320, 55, 0, 2 * Math.PI);
      ctx.arc(380, 320, 40, 0, 2 * Math.PI);
      ctx.fill();
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedImage(dataUrl);
    setMimeType('image/jpeg');
    setImageMeta({
      name: `Demo_${sampleType.toLowerCase()}.jpg`,
      size: `${Math.round(dataUrl.length * 0.75 / 1024)} KB`
    });
    setAnalysisResult(null);
    setChatHistory([]);
    setErrorMessage(null);
  };

  // Helper for category badge visual
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'AGRICULTURE':
        return { icon: Wheat, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
      case 'HEALTHCARE':
        return { icon: Stethoscope, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
      case 'TEMPLE_VILLAGE':
        return { icon: Landmark, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'INFRASTRUCTURE':
        return { icon: Building2, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' };
      case 'DOCUMENT_OCR':
        return { icon: FileText, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' };
      case 'LIVESTOCK':
        return { icon: Flame, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' };
      case 'UNCLEAR':
        return { icon: HelpCircle, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' };
      default:
        return { icon: Search, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)' };
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 4px 60px' }}>
      {/* 1. TOP HEADER & LANGUAGE CONTROLS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
            >
              <ArrowLeft size={16} />
              <span>{activeLang === 'kn' ? 'ಹಿಂತಿರುಗಿ' : 'Back'}</span>
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔍</span>
              <span>{activeLang === 'kn' ? 'MTG AI ಫೋಟೋ ವಿಶ್ಲೇಷಕ' : 'MTG AI Photo Analyzer'}</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '3px 0 0 0' }}>
              {activeLang === 'kn'
                ? 'ಒಂದು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — ಗೂಗಲ್ ಜೆಮಿನಿ AI ಮೂಲಕ ಸಂಪೂರ್ಣ ವಿಶ್ಲೇಷಣೆ ಪಡೆಯಿರಿ'
                : 'Universal Multimodal AI Image Understanding powered by Google Gemini'}
            </p>
          </div>
        </div>

        {/* Bilingual Language Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            padding: '3px'
          }}
        >
          <button
            onClick={() => setActiveLang('kn')}
            style={{
              background: activeLang === 'kn' ? '#10B981' : 'transparent',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🇮🇳 ಕನ್ನಡ
          </button>
          <button
            onClick={() => setActiveLang('en')}
            style={{
              background: activeLang === 'en' ? '#10B981' : 'transparent',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* 2. PHOTO UPLOAD & PREVIEW SECTION */}
      {!selectedImage ? (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(15, 29, 54, 0.85) 0%, rgba(7, 15, 30, 0.95) 100%)',
            border: '1.5px dashed rgba(16, 185, 129, 0.4)',
            borderRadius: '24px',
            padding: '32px 20px',
            textAlign: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Camera size={36} color="#34D399" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '8px' }}>
            {activeLang === 'kn' ? 'ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ತೆಗೆಯಿರಿ' : 'Capture or Upload Photo'}
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#CBD5E1', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            {activeLang === 'kn'
              ? 'ಬೆಳೆ, ರೋಗದ ಎಲೆ, ದೇವಸ್ಥಾನ, ರಸ್ತೆ, ಆಸ್ಪತ್ರೆ, ಸರಕಾರಿ ಪತ್ರ ಅಥವಾ ಯಾವುದೇ ವಸ್ತುವಿನ ಫೋಟೋವನ್ನು ಜೆಮಿನಿ AI ತಕ್ಷಣವೇ ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.'
              : 'Upload any photo — crops, plant diseases, village temples, roads, documents/notices, livestock, or health signs for instant Gemini AI analysis.'}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 24px',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                transition: 'all 0.2s ease'
              }}
            >
              <Camera size={20} />
              <span>{activeLang === 'kn' ? '📷 ಕ್ಯಾಮರಾದಿಂದ ಫೋಟೋ ತೆಗೆಯಿರಿ' : '📷 Take Photo'}</span>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '14px 24px',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ImageIcon size={20} color="#38BDF8" />
              <span>{activeLang === 'kn' ? '🖼️ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ' : '🖼️ Choose from Gallery'}</span>
            </button>
          </div>

          {/* ⚡ Quick Preset Test Samples */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', marginTop: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activeLang === 'kn' ? '⚡ ತ್ವರಿತ ಡೆಮೋ ಪರೀಕ್ಷೆಗಾಗಿ ಒಂದು ಮಾದರಿ ಕ್ಲಿಕ್ ಮಾಡಿ' : '⚡ Or try with a sample photo to test:'}
            </span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => loadSample('LEAF')}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6EE7B7',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🌾 {activeLang === 'kn' ? 'ಬೆಳೆ ಎಲೆ / ರೋಗ' : 'Crop Leaf'}
              </button>
              <button
                onClick={() => loadSample('TEMPLE')}
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#FCD34D',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🛕 {activeLang === 'kn' ? 'ಗ್ರಾಮ ದೇವಸ್ಥಾನ' : 'Temple'}
              </button>
              <button
                onClick={() => loadSample('NOTICE')}
                style={{
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#D8B4FE',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📄 {activeLang === 'kn' ? 'ಪ್ರಕಟಣೆ ಪತ್ರ (OCR)' : 'Notice / OCR'}
              </button>
              <button
                onClick={() => loadSample('HEALTH')}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🏥 {activeLang === 'kn' ? 'ಆರೋಗ್ಯ / ಕ್ಲಿನಿಕ್' : 'Healthcare'}
              </button>
              <button
                onClick={() => loadSample('TRACTOR')}
                style={{
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93C5FD',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🚜 {activeLang === 'kn' ? 'ಕೃಷಿ ಸಲಕರಣೆ' : 'Tractor/Tool'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview Card */
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', maxHeight: '420px', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={selectedImage}
              alt="Selected Preview"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                display: 'block'
              }}
            />

            {/* Scanning Beam Animation when analyzing */}
            {isAnalyzing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(16, 185, 129, 0) 0%, rgba(16, 185, 129, 0.35) 50%, rgba(6, 182, 212, 0.45) 100%)',
                  animation: 'scanBeam 1.8s infinite ease-in-out',
                  pointerEvents: 'none'
                }}
              />
            )}
            <style>{`
              @keyframes scanBeam {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
              }
            `}</style>

            {/* Badge showing image size */}
            {imageMeta && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                📸 {imageMeta.name} • {imageMeta.size}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isAnalyzing}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer'
                }}
              >
                <RotateCcw size={15} />
                <span>{activeLang === 'kn' ? 'ಮತ್ತೆ ತೆಗೆಯಿರಿ' : 'Retake'}</span>
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={isAnalyzing}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer'
                }}
              >
                <ImageIcon size={15} />
                <span>{activeLang === 'kn' ? 'ಬದಲಾಯಿಸಿ' : 'Change Photo'}</span>
              </button>

              <button
                onClick={handleDeletePhoto}
                disabled={isAnalyzing}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer'
                }}
                title={activeLang === 'kn' ? 'ಫೋಟೋ ಅಳಿಸಿ (ಗೌಪ್ಯತೆ ರಕ್ಷಣೆ)' : 'Delete Photo (Privacy Protected)'}
              >
                <Trash2 size={15} />
                <span>{activeLang === 'kn' ? 'ಅಳಿಸಿ' : 'Delete'}</span>
              </button>
            </div>

            {/* Main Analyze Button */}
            {!analysisResult && (
              <button
                onClick={handleAnalyzePhoto}
                disabled={isAnalyzing}
                style={{
                  background: isAnalyzing
                    ? 'rgba(16, 185, 129, 0.5)'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px 28px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sparkles size={18} />
                <span>
                  {isAnalyzing
                    ? activeLang === 'kn'
                      ? 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...'
                      : 'Analyzing Photo...'
                    : activeLang === 'kn'
                    ? 'ಫೋಟೋ ವಿಶ್ಲೇಷಿಸಿ (Analyze)'
                    : 'Analyze Photo'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '20px',
            color: '#FCA5A5',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.88rem'
          }}
        >
          <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. GEMINI AI ANALYSIS RESULT VIEW */}
      {analysisResult && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(15, 29, 54, 0.95) 0%, rgba(7, 15, 30, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '24px',
            padding: '24px 20px',
            marginBottom: '28px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header row: Category Badge, Confidence, Voice Readout Button */}
          {(() => {
            const meta = getCategoryMeta(analysisResult.category);
            const CategoryIcon = meta.icon;

            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Category Pill */}
                  <div
                    style={{
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      color: meta.color,
                      borderRadius: '999px',
                      padding: '5px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CategoryIcon size={16} />
                    <span>
                      {activeLang === 'kn' ? analysisResult.category_label_kn : analysisResult.category_label_en}
                    </span>
                  </div>

                  {/* Confidence Pill */}
                  <div
                    style={{
                      background:
                        analysisResult.confidence === 'HIGH'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : analysisResult.confidence === 'MEDIUM'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${
                        analysisResult.confidence === 'HIGH'
                          ? 'rgba(16, 185, 129, 0.4)'
                          : analysisResult.confidence === 'MEDIUM'
                          ? 'rgba(245, 158, 11, 0.4)'
                          : 'rgba(239, 68, 68, 0.4)'
                      }`,
                      color:
                        analysisResult.confidence === 'HIGH'
                          ? '#6EE7B7'
                          : analysisResult.confidence === 'MEDIUM'
                          ? '#FCD34D'
                          : '#FCA5A5',
                      borderRadius: '999px',
                      padding: '4px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}
                  >
                    {activeLang === 'kn'
                      ? `ವಿಶ್ವಾಸಾರ್ಹತೆ: ${
                          analysisResult.confidence === 'HIGH'
                            ? 'ಹೆಚ್ಚು'
                            : analysisResult.confidence === 'MEDIUM'
                            ? 'ಮಧ್ಯಮ'
                            : 'ಕಡಿಮೆ'
                        }`
                      : `Confidence: ${analysisResult.confidence}`}
                  </div>
                </div>

                {/* 🔊 Voice Audio Readout Button */}
                <button
                  onClick={handlePlayAnalysisAudio}
                  style={{
                    background: isPlayingAudio ? '#EF4444' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${isPlayingAudio ? '#EF4444' : 'rgba(16, 185, 129, 0.4)'}`,
                    color: isPlayingAudio ? '#FFFFFF' : '#34D399',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title={activeLang === 'kn' ? 'ಧ್ವನಿ ಮೂಲಕ ಆಲಿಸಿ' : 'Listen with Audio'}
                >
                  {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>
                    {isPlayingAudio
                      ? activeLang === 'kn'
                        ? 'ನಿಲ್ಲಿಸಿ (Stop)'
                        : 'Stop Audio'
                      : activeLang === 'kn'
                      ? 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ'
                      : 'Listen (Voice)'}
                  </span>
                </button>
              </div>
            );
          })()}

          {/* 4 CORE SECTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. What I See */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>👁️</span>
                <strong style={{ fontSize: '0.92rem', color: '#38BDF8' }}>
                  {activeLang === 'kn' ? 'ಏನು ಕಾಣಿಸುತ್ತಿದೆ (What I See)' : 'What I See'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#F1F5F9', lineHeight: 1.6 }}>
                {activeLang === 'kn' ? analysisResult.what_i_see_kn : analysisResult.what_i_see_en}
              </p>
            </div>

            {/* 2. Analysis Details */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔬</span>
                <strong style={{ fontSize: '0.92rem', color: '#A78BFA' }}>
                  {activeLang === 'kn' ? 'ವಿವರವಾದ ವಿಶ್ಲೇಷಣೆ (Analysis)' : 'Detailed Analysis'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#E2E8F0', lineHeight: 1.6 }}>
                {activeLang === 'kn' ? analysisResult.analysis_kn : analysisResult.analysis_en}
              </p>
            </div>

            {/* 3. Possible Issue / Condition (if present) */}
            {(analysisResult.possible_issue_kn || analysisResult.possible_issue_en) && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <strong style={{ fontSize: '0.92rem', color: '#FBBF24' }}>
                    {activeLang === 'kn' ? 'ಸಂಭಾವ್ಯ ಸಮಸ್ಯೆ / ಸ್ಥಿತಿ (Possible Issue / Condition)' : 'Possible Issue / Condition'}
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#FEF3C7', lineHeight: 1.6 }}>
                  {activeLang === 'kn' ? analysisResult.possible_issue_kn : analysisResult.possible_issue_en}
                </p>
              </div>
            )}

            {/* 4. Recommended Action */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <strong style={{ fontSize: '0.92rem', color: '#34D399' }}>
                  {activeLang === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು (Recommended Action)' : 'Recommended Action'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#D1FAE5', lineHeight: 1.6 }}>
                {activeLang === 'kn' ? analysisResult.recommended_action_kn : analysisResult.recommended_action_en}
              </p>
            </div>

            {/* 📄 OCR Text Extracted Box (If Document) */}
            {analysisResult.detected_text && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#C084FC" />
                    <strong style={{ fontSize: '0.9rem', color: '#C084FC' }}>
                      {activeLang === 'kn' ? 'ಪತ್ತೆಯಾದ ಪಠ್ಯ (Extracted OCR Text)' : 'Detected OCR Text'}
                    </strong>
                  </div>
                  <button
                    onClick={() => {
                      if (analysisResult.detected_text) {
                        navigator.clipboard.writeText(analysisResult.detected_text);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      color: '#E2E8F0',
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedText ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    <span>{copiedText ? (activeLang === 'kn' ? 'ನಕಲಿಸಲಾಗಿದೆ' : 'Copied!') : (activeLang === 'kn' ? 'ಪಠ್ಯ ನಕಲಿಸಿ' : 'Copy Text')}</span>
                  </button>
                </div>
                <pre
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    color: '#F8FAFC',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }}
                >
                  {analysisResult.detected_text}
                </pre>
              </div>
            )}

            {/* Cautionary Safety Disclaimers (Domain Specific) */}
            {analysisResult.category === 'AGRICULTURE' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  color: '#FDE047'
                }}
              >
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>
                  {activeLang === 'kn'
                    ? '⚠️ ಸಂಭಾವ್ಯ ಕಾರಣ — ತೋಟ/ಜಮೀನಿನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳುವುದು ಅಗತ್ಯ. ಅಪಾಯಕಾರಿ ಕೀಟನಾಶಕ ಪ್ರಮಾಣಗಳನ್ನು ತಜ್ಞರ ಸಲಹೆಯಿಲ್ಲದೆ ಬಳಸಬೇಡಿ.'
                    : '⚠️ Possible cause — needs field confirmation. Do not apply chemical pesticides without official agricultural guidance.'}
                </span>
              </div>
            )}

            {analysisResult.category === 'HEALTHCARE' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  color: '#FCA5A5'
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  {activeLang === 'kn'
                    ? '⚠️ ಈ ಚಿತ್ರವು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವಲ್ಲ. ಸರಿಯಾದ ರೋಗನಿರ್ಣಯ ಮತ್ತು ಚಿಕಿತ್ಸೆಗಾಗಿ ದಯವಿಟ್ಟು ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                    : '⚠️ This image analysis is non-diagnostic. For a proper medical diagnosis, consult a qualified healthcare professional.'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CONVERSATIONAL FOLLOW-UP & GEMINI LIVE CHAT */}
      {selectedImage && analysisResult && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(7, 15, 30, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>💬</span>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {activeLang === 'kn' ? 'ಈ ಫೋಟೋದ ಬಗ್ಗೆ AI ಪ್ರಶ್ನಿಸಿ' : 'Ask AI About This Photo'}
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                  {activeLang === 'kn'
                    ? 'ಫೋಟೋ ಸಂದರ್ಭವನ್ನು ಉಳಿಸಿಕೊಂಡು AI ಜೊತೆ ಚಾಟ್ ಅಥವಾ ಧ್ವನಿ ಸಂಭಾಷಣೆ ನಡೆಸಿ'
                    : 'Multi-turn conversation retaining the image context'}
                </span>
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(activeLang === 'kn'
                ? ['ಪರಿಹಾರವೇನು?', 'ಇದಕ್ಕೆ ಯಾವ ಗೊಬ್ಬರ?', 'ಯಾವಾಗ ಬರುತ್ತದೆ?', 'ಸಂಕ್ಷಿಪ್ತವಾಗಿ ತಿಳಿಸಿ']
                : ['What should I do?', 'Is this safe?', 'What fertilizer?', 'Summarize it']
              ).map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendFollowUp(chip)}
                  disabled={isAskingFollowUp}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94A3B8',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation History Stream */}
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '10px 4px',
              marginBottom: '16px'
            }}
          >
            {chatHistory.map((turn, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: turn.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    background:
                      turn.role === 'user'
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : 'rgba(255, 255, 255, 0.07)',
                    border:
                      turn.role === 'user'
                        ? 'none'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius:
                      turn.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '12px 16px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: turn.role === 'user' ? '#A7F3D0' : '#38BDF8', fontWeight: 800 }}>
                      {turn.role === 'user'
                        ? activeLang === 'kn' ? '👤 ನೀವು' : '👤 You'
                        : '🤖 MTG AI'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: turn.role === 'user' ? '#D1FAE5' : '#64748B' }}>
                      {turn.timestamp}
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{turn.text}</div>
                </div>
              </div>
            ))}

            {isAskingFollowUp && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.07)',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '12px 18px',
                    color: '#94A3B8',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ animation: 'pulse 1s infinite' }}>✨</span>
                  <span>{activeLang === 'kn' ? 'AI ಯೋಚಿಸುತ್ತಿದೆ...' : 'AI is thinking...'}</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Follow-up Question Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendFollowUp();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '16px',
              padding: '6px 8px'
            }}
          >
            {/* Microphone Button (Voice Input) */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              style={{
                background: isListeningVoice ? '#EF4444' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: isListeningVoice ? '0 0 14px #EF4444' : 'none'
              }}
              title={
                isListeningVoice
                  ? activeLang === 'kn' ? 'ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ' : 'Stop Listening'
                  : activeLang === 'kn' ? 'ಧ್ವನಿ ಮೂಲಕ ಪ್ರಶ್ನಿಸಿ (ಕನ್ನಡ)' : 'Speak Question'
              }
            >
              {isListeningVoice ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              placeholder={
                isListeningVoice
                  ? activeLang === 'kn' ? '🎤 ಮಾತನಾಡಿ, ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : '🎤 Listening, please speak...'
                  : activeLang === 'kn' ? 'ಈ ಫೋಟೋ ಕುರಿತು ಪ್ರಶ್ನೆ ಕೇಳಿ...' : 'Ask question about this photo...'
              }
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                padding: '8px 4px'
              }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!followUpQuestion.trim() || isAskingFollowUp}
              style={{
                background: followUpQuestion.trim()
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: followUpQuestion.trim() ? '#FFFFFF' : '#64748B',
                cursor: followUpQuestion.trim() && !isAskingFollowUp ? 'pointer' : 'default',
                flexShrink: 0
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default PhotoAnalyzerScreen;
