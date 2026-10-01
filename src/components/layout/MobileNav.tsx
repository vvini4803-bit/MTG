import React from 'react';
import { ViewTab } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Home, Newspaper, Wheat, Bot, User } from 'lucide-react';

interface MobileNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const { isKannada } = useLanguage();

  const tabs = [
    { id: 'home', label: isKannada ? 'ಮುಖಪುಟ' : 'Home', icon: Home },
    { id: 'farmer_summary', label: isKannada ? 'ರೈತ ಸಾರಾಂಶ' : 'Farmer AI', icon: Wheat },
    { id: 'farmer_live', label: isKannada ? 'AI ಲೈವ್ ಏಜೆಂಟ್' : 'AI Live Agent', icon: Bot },
    { id: 'news', label: isKannada ? 'ಸುದ್ದಿ' : 'News', icon: Newspaper },
    { id: 'profile', label: isKannada ? 'ಪ್ರೊಫೈಲ್' : 'Profile', icon: User }
  ];

  return (
    <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id as ViewTab)}
            className={`bottom-tab-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} color={isActive ? '#10B981' : 'var(--text-secondary)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
