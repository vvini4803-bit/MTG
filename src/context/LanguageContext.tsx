import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isKannada: boolean;
}

const translations: Record<string, { en: string; kn: string }> = {
  // Brand & Tagline
  appTitle: { en: 'Gramasiri', kn: 'ಗ್ರಾಮಸಿರಿ' },
  tagline: {
    en: 'OUR VILLAGE — OUR PEOPLE — OUR STORIES — OUR FUTURE',
    kn: 'ನಮ್ಮ ಗ್ರಾಮ — ನಮ್ಮ ಜನ — ನಮ್ಮ ಕಥೆಗಳು — ನಮ್ಮ ಭವಿಷ್ಯ'
  },
  demoDataWarning: {
    en: 'DEVELOPMENT MODE: SHOWING DEMO DATA. Switch to Production in Admin Panel.',
    kn: 'ಅಭಿವೃದ್ಧಿ ಮೋಡ್: ಡೆಮೊ ಡೇಟಾ ತೋರಿಸಲಾಗುತ್ತಿದೆ. ನಿರ್ವಾಹಕ ಫಲಕದಲ್ಲಿ ಉತ್ಪಾದನಾ ಮೋಡ್‌ಗೆ ಬದಲಾಯಿಸಿ.'
  },
  
  // Navigation
  navHome: { en: 'Home', kn: 'ಮುಖಪುಟ' },
  navNews: { en: 'News & Feed', kn: 'ಸುದ್ದಿ & ಫೀಡ್' },
  navEvents: { en: 'Events', kn: 'ಕಾರ್ಯಕ್ರಮಗಳು' },
  navSports: { en: 'Sports', kn: 'ಕ್ರೀಡೆ' },
  navProfile: { en: 'Profile', kn: 'ಪ್ರೊಫೈಲ್' },
  navAgriculture: { en: 'Agriculture', kn: 'ಕೃಷಿ' },
  navTemples: { en: 'Temples & Culture', kn: 'ದೇವಸ್ಥಾನ & ಸಂಸ್ಕೃತಿ' },
  navHistory: { en: 'History & Stories', kn: 'ಇತಿಹಾಸ & ಕಥೆಗಳು' },
  navStats: { en: 'Village Data', kn: 'ಗ್ರಾಮ ಅಂಕಿಅಂಶ' },
  navAchievements: { en: 'Achievements', kn: 'ಸಾಧನೆಗಳು' },
  navGallery: { en: 'Gallery', kn: 'ಗ್ಯಾಲರಿ' },
  navSocial: { en: 'Social Media', kn: 'ಸಾಮಾಜಿಕ ಜಾಲತಾಣ' },
  navVoice: { en: 'Voice Assistant', kn: 'ಧ್ವನಿ ಸಹಾಯಕ' },
  navSearch: { en: 'Search', kn: 'ಹುಡುಕಿ' },
  navNotifications: { en: 'Notifications', kn: 'ಸೂಚನೆಗಳು' },
  navSettings: { en: 'Settings', kn: 'ಸೆಟ್ಟಿಂಗ್ಸ್' },
  navPrivacy: { en: 'Privacy & Terms', kn: 'ಗೌಪ್ಯತೆ & ನಿಯಮಗಳು' },
  navAdmin: { en: 'Admin Portal', kn: 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್' },
  navAnalytics: { en: 'Analytics', kn: 'ವಿಶ್ಲೇಷಣೆ' },
  navMore: { en: 'More', kn: 'ಇನ್ನಷ್ಟು' },

  // Verification Badges
  badgeVerified: { en: 'VERIFIED', kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ' },
  badgeCommunityReport: { en: 'COMMUNITY REPORT', kn: 'ಸಮುದಾಯ ವರದಿ' },
  badgePending: { en: 'PENDING VERIFICATION', kn: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' },
  badgeRejected: { en: 'REJECTED', kn: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' },
  badgeUrgent: { en: 'URGENT ALERT', kn: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ' },
  badgeOfficial: { en: 'OFFICIAL ANNOUNCEMENT', kn: 'ಅಧಿಕೃತ ಪ್ರಕಟಣೆ' },
  badgeHistoricalFact: { en: 'Historical Fact', kn: 'ಐತಿಹಾಸಿಕ ಸತ್ಯ' },
  badgeCommunityStory: { en: 'Community Story', kn: 'ಸಮುದಾಯ ಕಥೆ' },
  badgeLocalTradition: { en: 'Local Tradition', kn: 'ಸ್ಥಳೀಯ ಸಂಪ್ರದಾಯ' },
  badgeUnverifiedStory: { en: 'Unverified Story', kn: 'ಪರಿಶೀಲಿಸದ ಕಥೆ' },

  // Actions
  login: { en: 'Sign In / Register', kn: 'ಲಾಗಿನ್ / ನೋಂದಣಿ' },
  logout: { en: 'Sign Out', kn: 'ಲಾಗ್ ಔಟ್' },
  exploreVillage: { en: 'Explore Our Village', kn: 'ನಮ್ಮ ಗ್ರಾಮವನ್ನು ಅನ್ವೇಷಿಸಿ' },
  latestUpdates: { en: 'Latest Updates', kn: 'ಇತ್ತೀಚಿನ ಅಪ್‌ಡೇಟ್‌ಗಳು' },
  createPost: { en: 'Post an Update', kn: 'ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' },
  reportPost: { en: 'Report', kn: 'ವರದಿ ಮಾಡಿ' },
  verifyNews: { en: 'Verify Item', kn: 'ದೃಢೀಕರಿಸಿ' },
  submit: { en: 'Submit', kn: 'ಸಲ್ಲಿಸಿ' },
  save: { en: 'Save', kn: 'ಉಳಿಸಿ' },
  cancel: { en: 'Cancel', kn: 'ರದ್ದುಮಾಡಿ' },
  filter: { en: 'Filter', kn: 'ಫಿಲ್ಟರ್' },
  all: { en: 'All', kn: 'ಎಲ್ಲವೂ' },
  registerNow: { en: 'Register / RSVP', kn: 'ನೋಂದಾಯಿಸಿ' },
  registered: { en: 'Registered', kn: 'ನೋಂದಾಯಿಸಲಾಗಿದೆ' },
  readMore: { en: 'Read More', kn: 'ಇನ್ನಷ್ಟು ಓದಿ' },
  close: { en: 'Close', kn: 'ಮುಚ್ಚಿ' },
  share: { en: 'Share', kn: 'ಹಂಚಿಕೊಳ್ಳಿ' },
  like: { en: 'Like', kn: 'ಮೆಚ್ಚು' },
  comment: { en: 'Comment', kn: 'ಪ್ರತಿಕ್ರಿಯೆ' },
  askVoice: { en: 'Ask Voice Assistant', kn: 'ಧ್ವನಿ ಸಹಾಯಕರನ್ನು ಕೇಳಿ' },

  // Live / Status
  liveNow: { en: 'LIVE NOW', kn: 'ನೇರ ಪ್ರಸಾರ' },
  upcomingEvents: { en: 'Upcoming Events', kn: 'ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು' },
  liveScores: { en: 'Live Scores', kn: 'ಲೈವ್ ಸ್ಕೋರ್' },
  noDataYet: { en: 'Information not available yet', kn: 'ಮಾಹಿತಿ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ' },
  awaitingVerification: { en: 'Awaiting verification by admin', kn: 'ನಿರ್ವಾಹಕರ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ' },
  offlineNotice: {
    en: "You're offline — showing the latest saved information.",
    kn: 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ — ಕೊನೆಯದಾಗಿ ಉಳಿಸಿದ ಮಾಹಿತಿಯನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
  },

  // Emergency
  emergencyBannerTitle: { en: 'OFFICIAL EMERGENCY ANNOUNCEMENT', kn: 'ಅಧಿಕೃತ ತುರ್ತು ಪ್ರಕಟಣೆ' },
  emergencyDisclaimer: {
    en: 'Please verify this information through official/local authorities.',
    kn: 'ದಯವಿಟ್ಟು ಈ ಮಾಹಿತಿಯನ್ನು ಅಧಿಕೃತ/ಸ್ಥಳೀಯ ಅಧಿಕಾರಿಗಳ ಮೂಲಕ ಪರಿಶೀಲಿಸಿ.'
  },

  // Stats
  population: { en: 'Population', kn: 'ಜನಸಂಖ್ಯೆ' },
  households: { en: 'Households', kn: 'ಕುಟುಂಬಗಳು' },
  mainCrop: { en: 'Main Crop', kn: 'ಮುಖ್ಯ ಬೆಳೆ' },
  landmarks: { en: 'Important Landmarks', kn: 'ಪ್ರಮುಖ ಸ್ಥಳಗಳು' },
  activeMembers: { en: 'Active Community Members', kn: 'ಸಕ್ರಿಯ ನಾಗರಿಕರು' },
  lastVerified: { en: 'Last Verified', kn: 'ಕೊನೆಯ ಬಾರಿ ಪರಿಶೀಲಿಸಿದ್ದು' },
  source: { en: 'Source', kn: 'ಮೂಲ' }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (k) => k,
  isKannada: false
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gramasiri_lang');
    return (saved === 'kn' ? 'kn' : 'en') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gramasiri_lang', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isKannada: language === 'kn'
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
