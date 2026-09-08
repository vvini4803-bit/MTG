import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/dbService';
import { SocialLink } from '../types';
import {
  MessageCircle,
  Globe,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const YoutubeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#EF4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill={color} />
  </svg>
);

const InstagramIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#EC4899' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#3B82F6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const SocialMediaScreen: React.FC = () => {
  const { language, isKannada } = useLanguage();
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    return dbService.subscribeSocialLinks(setLinks);
  }, []);

  const getPlatformIcon = (platform: SocialLink['platform']) => {
    switch (platform) {
      case 'YOUTUBE':
        return <YoutubeIcon size={24} color="#EF4444" />;
      case 'INSTAGRAM':
        return <InstagramIcon size={24} color="#EC4899" />;
      case 'FACEBOOK':
        return <FacebookIcon size={24} color="#3B82F6" />;
      case 'WHATSAPP':
        return <MessageCircle size={24} color="#22C55E" />;
      default:
        return <Globe size={24} color="#10B981" />;
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ಗ್ರಾಮದ ಅಧಿಕೃತ ಸಾಮಾಜಿಕ ಜಾಲತಾಣ ಸಂಪರ್ಕ' : 'Official Village Social Media Hub'}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {isKannada
            ? 'ಗ್ರಾಮ ಪಂಚಾಯತ್ ಹಾಗೂ ಸಮುದಾಯದ ದೃಢೀಕೃತ ಅಧಿಕೃತ ಚಾನೆಲ್‌ಗಳು ಮಾತ್ರ'
            : 'Verified official panchayat channels, youth community, and broadcast groups'}
        </p>
      </div>

      {/* Safety Notice */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <ShieldCheck size={22} color="#10B981" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: '#A7F3D0', lineHeight: 1.5 }}>
          {isKannada
            ? 'ಸುರಕ್ಷತಾ ಮಾಹಿತಿ: ಇಲ್ಲಿ ಪಟ್ಟಿ ಮಾಡಲಾದ ಎಲ್ಲಾ ಲಿಂಕ್‌ಗಳು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಆಡಳಿತದಿಂದ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟ ಅಧಿಕೃತ ಪುಟಗಳಾಗಿವೆ.'
            : 'Security Guarantee: Only verified official communication channels verified by the village administration are published here.'}
        </span>
      </div>

      {/* Links List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {links.map((link) => {
          const label = language === 'kn' ? link.label_kn : link.label_en;
          return (
            <div
              key={link.id}
              className="glass-card card-3d"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {getPlatformIcon(link.platform)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{label}</h3>
                    {link.verified_official && (
                      <span className="badge badge-verified" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        OFFICIAL
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {link.handle_or_group}
                  </span>
                </div>
              </div>

              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem', textDecoration: 'none' }}
              >
                <span>{isKannada ? 'ತೆರೆಯಿರಿ' : 'Join / Visit'}</span>
                <ExternalLink size={14} />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
