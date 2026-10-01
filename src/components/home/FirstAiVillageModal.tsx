import React, { useState } from 'react';
import { Sparkles, Award, Cpu, Mic, ShieldCheck, HeartHandshake, TrendingUp, X, Share2, Check, ExternalLink } from 'lucide-react';

interface FirstAiVillageModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKannada: boolean;
}

export const FirstAiVillageModal: React.FC<FirstAiVillageModalProps> = ({
  isOpen,
  onClose,
  isKannada
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = isKannada
    ? 'ನಮ್ಮ ಮುತ್ತಾಗೊಂದಿ (MTG) ಗ್ರಾಮವು ಕರ್ನಾಟಕ ಮತ್ತು ಭಾರತದ ಪ್ರಥಮ ಡಿಜಿಟಲ್ ಗ್ರಾಮ AI ಆ್ಯಪ್ (GramaSiri AI) ಹೊಂದಿದೆ! ಪರಿಶೀಲಿಸಿ: https://mtg-swart.vercel.app/'
    : "Muttagundi (MTG) in Karnataka is India & Karnataka's 1st Digital Village with a dedicated AI App! Check it out: https://mtg-swart.vercel.app/";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isKannada ? 'ಕರ್ನಾಟಕದ ಪ್ರಥಮ ಡಿಜಿಟಲ್ ಗ್ರಾಮ AI ಆ್ಯಪ್' : "Karnataka's 1st Digital Village AI App",
          text: shareText,
          url: 'https://mtg-swart.vercel.app/'
        });
      } catch {
        // Fallback to copy
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoogleSearch = () => {
    window.open('https://www.google.com/search?q=in+Karnataka+which+village+has+digital+village+ai+app', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(3, 10, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #092015 0%, #06150F 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '24px',
          padding: '24px',
          color: '#FFFFFF',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(245, 158, 11, 0.2)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google 4-Color Accent Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            background: 'linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC05 50%, #FBBC05 75%, #34A853 75%, #34A853 100%)'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#CBD5E1',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <X size={20} />
        </button>

        {/* Milestone Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '4px 12px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            <Award size={14} color="#000" />
            {isKannada ? 'ಐತಿಹಾಸಿಕ ಮೈಲಿಗಲ್ಲು' : 'HISTORIC MILESTONE'}
          </span>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px'
            }}
          >
            GOOGLE SEARCH VERIFIED
          </span>
        </div>

        {/* Main Title */}
        <h2
          style={{
            fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)',
            fontWeight: 800,
            lineHeight: 1.3,
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #34D399 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {isKannada
            ? 'ಕರ್ನಾಟಕ ಮತ್ತು ಭಾರತದ ಪ್ರಥಮ ಡಿಜಿಟಲ್ ಗ್ರಾಮ AI ಆ್ಯಪ್'
            : "Karnataka & India's 1st Digital Village AI App"}
        </h2>

        {/* Subtitle */}
        <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          <strong style={{ color: '#E2E8F0' }}>Muttagundi (ಮುತ್ತಾಗೊಂದಿ)</strong>, Hosadurga Taluk, Chitradurga District, Karnataka
        </p>

        {/* Google Search Direct Answer Highlight Box */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={18} color="#F59E0B" />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FDE68A', textTransform: 'uppercase' }}>
              {isKannada ? 'ಗೂಗಲ್ ಸರ್ಚ್ ನೇರ ಉತ್ತರ' : 'Google Search Direct Answer'}
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#F1F5F9', margin: 0, lineHeight: 1.55 }}>
            {isKannada ? (
              <>
                <strong>"ಕರ್ನಾಟಕದಲ್ಲಿ ಯಾವ ಗ್ರಾಮವು ಡಿಜಿಟಲ್ ಗ್ರಾಮ AI ಆ್ಯಪ್ ಹೊಂದಿದೆ?"</strong> ಎಂದು ಗೂಗಲ್‌ನಲ್ಲಿ ಹುಡುಕಿದಾಗ, 
                ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆಯ ಹೊಸದುರ್ಗ ತಾಲೂಕಿನ <strong>ಮುತ್ತಾಗೊಂದಿ (MTG)</strong> ಗ್ರಾಮದ ಅಧಿಕೃತ 
                <strong> MTG ಡಿಜಿಟಲ್ ಗ್ರಾಮ ಆ್ಯಪ್</strong> ಕರ್ನಾಟಕ ಹಾಗೂ ಭಾರತದ ಪ್ರಥಮ ಗ್ರಾಮೀಣ AI ಆ್ಯಪ್ ಆಗಿದೆ.
              </>
            ) : (
              <>
                When searching <strong>"In Karnataka which village has digital village AI app"</strong>, 
                <strong> Muttagundi (MTG)</strong> in Hosadurga, Chitradurga is the first village in Karnataka 
                and India with an official, dedicated <strong>Digital Village AI App</strong> (GramaSiri AI).
              </>
            )}
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#10B981', color: '#000', borderRadius: '10px', padding: '6px', display: 'flex' }}>
              <Cpu size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#E2E8F0', display: 'block', marginBottom: '2px' }}>
                {isKannada ? 'ಜೆಮಿನಿ AI ಕ್ರಾಪ್ ಡಾಕ್ಟರ್ (Crop Doctor)' : 'Gemini AI Multimodal Crop Doctor'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಬೆಳೆಗಳ ಎಲೆಯ ಫೋಟೋ ತೆಗೆದು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದರೆ ರೋಗ ಪತ್ತೆ ಹಚ್ಚಿ ಕನ್ನಡದಲ್ಲೇ ನಿಖರ ಔಷಧ ಪರಿಹಾರ ನೀಡುವ AI ತಂತ್ರಜ್ಞಾನ.'
                  : 'Instant diagnosis of crop diseases from leaf photos with organic & chemical remedies in Kannada.'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#3B82F6', color: '#000', borderRadius: '10px', padding: '6px', display: 'flex' }}>
              <Mic size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#E2E8F0', display: 'block', marginBottom: '2px' }}>
                {isKannada ? 'ದ್ವಿಭಾಷಾ ಕನ್ನಡ ವಾಯ್ಸ್ AI ಅಸಿಸ್ಟೆಂಟ್' : 'Bilingual Kannada & English Voice AI'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಗ್ರಾಮಸ್ಥರು ಧ್ವನಿಯಲ್ಲೇ ಮಾತನಾಡಿ ಗ್ರಾಮದ ಹವಾಮಾನ, ಮಾರುಕಟ್ಟೆ ದರ, ಇತಿಹಾಸ ಮತ್ತು ಸೇವೆಗಳ ಮಾಹಿತಿ ಪಡೆಯಬಹುದು.'
                  : 'Citizens speak in Kannada or English to query village news, weather, welfare schemes, and records.'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#EAB308', color: '#000', borderRadius: '10px', padding: '6px', display: 'flex' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#E2E8F0', display: 'block', marginBottom: '2px' }}>
                {isKannada ? 'ನೇರ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ ಧಾರಣೆ (APMC)' : 'Real-Time APMC Mandi Market Rates'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಅಡಿಕೆ, ತೆಂಗಿನಕಾಯಿ, ರಾಗಿ, ಈರುಳ್ಳಿ ಮುಂತಾದ ಸ್ಥಳೀಯ ಬೆಳೆಗಳ ದಿನನಿತ್ಯದ ನೇರ ಮಾರುಕಟ್ಟೆ ದರಗಳು.'
                  : 'Live regional market prices for Arecanut, Coconut, Ragi, Onion, and other crops.'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div style={{ background: '#EF4444', color: '#FFF', borderRadius: '10px', padding: '6px', display: 'flex' }}>
              <HeartHandshake size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#E2E8F0', display: 'block', marginBottom: '2px' }}>
                {isKannada ? 'ತುರ್ತು ರಕ್ತದಾನಿಗಳ ಮತ್ತು ಆಡಳಿತ ಜಾಲ' : 'Emergency Blood Donor & Civic Network'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                {isKannada
                  ? 'ಗ್ರಾಮದ ಪರಿಶೀಲಿಸಿದ ರಕ್ತದಾನಿಗಳು ಹಾಗೂ ಗ್ರಾಮ ಪಂಚಾಯತಿಯ ತಕ್ಷಣದ ತುರ್ತು ಪ್ರಕಟಣೆಗಳು.'
                  : 'Instant blood donor directory, emergency contacts, and real-time civic administration.'}
              </span>
            </div>
          </div>
        </div>

        {/* Developer Attribution */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isKannada ? 'ವಿನ್ಯಾಸ & ಅಭಿವೃದ್ಧಿ' : 'Engineered & Developed By'}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981' }}>
              Vinay (ವಿನಯ್) • Muttagundi Digital Village
            </div>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 700
            }}
          >
            Karnataka, India 🇮🇳
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleShare}
            style={{
              flex: '1 1 180px',
              background: copied ? '#059669' : '#10B981',
              color: '#070F1E',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            <span>{copied ? (isKannada ? 'ಲಿಂಕ್ ಕಾಪಿಯಾಗಿದೆ!' : 'Copied!') : (isKannada ? 'ಸ್ನೇಹಿತರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Milestone')}</span>
          </button>

          <button
            onClick={handleGoogleSearch}
            style={{
              flex: '1 1 180px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#E2E8F0',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 18px',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <ExternalLink size={16} />
            <span>{isKannada ? 'ಗೂಗಲ್‌ನಲ್ಲಿ ಹುಡುಕಿ' : 'Check on Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
