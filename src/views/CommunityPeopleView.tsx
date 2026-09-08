import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { UserProfile } from '../types';
import {
  Search,
  Users,
  MessageSquare,
  Shield,
  ShieldCheck,
  Settings,
  Lock,
  Eye,
  EyeOff,
  UserX,
  Check,
  Filter,
  UserCheck,
  Sparkles
} from 'lucide-react';

interface CommunityPeopleViewProps {
  onOpenLogin: () => void;
  onOpenChatWithUser: (user: UserProfile) => void;
  onBack?: () => void;
}

export const CommunityPeopleView: React.FC<CommunityPeopleViewProps> = ({
  onOpenLogin,
  onOpenChatWithUser,
  onBack
}) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [blockedUids, setBlockedUids] = useState<string[]>([]);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // User's own privacy preferences
  const [myAllowFindMe, setMyAllowFindMe] = useState<boolean>(currentUser?.allow_find_me !== false);
  const [myPrivacyFind, setMyPrivacyFind] = useState<string>(currentUser?.privacy_find || 'EVERYONE');
  const [myPrivacyMessage, setMyPrivacyMessage] = useState<string>(currentUser?.privacy_message || 'EVERYONE');
  const [myCategory, setMyCategory] = useState<string>(currentUser?.community_category || 'RESIDENT');

  // Load public users and blocked list
  useEffect(() => {
    const refreshData = () => {
      const publicUsers = dbService.getPublicCommunityUsers(currentUser?.uid);
      setUsers(publicUsers);

      if (currentUser) {
        setBlockedUids(dbService.getBlockedUsers(currentUser.uid));
        const profile = dbService.getUserProfile(currentUser.uid);
        if (profile) {
          setMyAllowFindMe(profile.allow_find_me !== false);
          setMyPrivacyFind(profile.privacy_find || 'EVERYONE');
          setMyPrivacyMessage(profile.privacy_message || 'EVERYONE');
          setMyCategory(profile.community_category || 'RESIDENT');
        }
      }
    };

    refreshData();

    // Subscribe to user list changes
    const unsub = dbService.subscribeUsers(() => {
      refreshData();
    });

    return () => unsub();
  }, [currentUser]);

  const handleSavePrivacy = async () => {
    if (!currentUser) return;
    await dbService.updateUserPrivacy(currentUser.uid, {
      allow_find_me: myAllowFindMe,
      privacy_find: myPrivacyFind as any,
      privacy_message: myPrivacyMessage as any,
      community_category: myCategory as any
    });

    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 2000);
    // Refresh directory
    setUsers(dbService.getPublicCommunityUsers(currentUser.uid));
  };

  const handleUnblock = async (uid: string) => {
    if (!currentUser) return;
    await dbService.unblockUser(currentUser.uid, uid);
    setBlockedUids(dbService.getBlockedUsers(currentUser.uid));
    setUsers(dbService.getPublicCommunityUsers(currentUser.uid));
  };

  const categories = [
    { id: 'ALL', label_en: 'All Residents', label_kn: 'ಎಲ್ಲಾ ಗ್ರಾಮಸ್ಥರು', icon: '👥' },
    { id: 'FARMER', label_en: 'Farmers', label_kn: 'ರೈತರು', icon: '🌾' },
    { id: 'SPORTS', label_en: 'Sports / Youth', label_kn: 'ಕ್ರೀಡೆ / ಯುವಕರು', icon: '🏏' },
    { id: 'STUDENT', label_en: 'Students', label_kn: 'ವಿದ್ಯಾರ್ಥಿಗಳು', icon: '🎓' },
    { id: 'TEACHER', label_en: 'Teachers', label_kn: 'ಶಿಕ್ಷಕರು', icon: '👨‍🏫' },
    { id: 'ARTIST', label_en: 'Artists & Cultural', label_kn: 'ಕಲಾವಿದರು', icon: '🎨' },
    { id: 'ACHIEVER', label_en: 'Achievers', label_kn: 'ಸಾಧಕರು', icon: '🏆' },
    { id: 'PROFESSIONAL', label_en: 'Professionals', label_kn: 'ಉದ್ಯೋಗಿಗಳು', icon: '💼' }
  ];

  // Filtered residents list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        if (u.community_category !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchNameKn = u.name_kn?.toLowerCase().includes(q);
        const matchBio = u.bio?.toLowerCase().includes(q);
        const matchBioKn = u.bio_kn?.toLowerCase().includes(q);
        const matchCat = u.community_category?.toLowerCase().includes(q);
        return matchName || matchNameKn || matchBio || matchBioKn || matchCat;
      }

      return true;
    });
  }, [users, selectedCategory, searchQuery]);

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'FARMER':
        return { label: isKannada ? '🌾 ರೈತರು' : '🌾 Farmer', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'SPORTS':
        return { label: isKannada ? '🏏 ಕ್ರೀಡೆ' : '🏏 Sports', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'STUDENT':
        return { label: isKannada ? '🎓 ವಿದ್ಯಾರ್ಥಿ' : '🎓 Student', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
      case 'TEACHER':
        return { label: isKannada ? '👨‍🏫 ಶಿಕ್ಷಕರು' : '👨‍🏫 Teacher', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
      case 'ARTIST':
        return { label: isKannada ? '🎨 ಕಲಾವಿದರು' : '🎨 Artist', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
      case 'ACHIEVER':
        return { label: isKannada ? '🏆 ಸಾಧಕರು' : '🏆 Achiever', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)' };
      case 'PROFESSIONAL':
        return { label: isKannada ? '💼 ಉದ್ಯೋಗಿ' : '💼 Professional', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' };
      default:
        return { label: isKannada ? '👤 ಗ್ರಾಮಸ್ಥರು' : '👤 Resident', color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.08)' };
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '860px' }}>
      {/* --- HERO HEADER --- */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isKannada ? '👥 ನಮ್ಮ ಗ್ರಾಮಸ್ಥರು' : '👥 Our People'}
                </h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  {isKannada ? 'ಗ್ರಾಮ ಸಮುದಾಯ ಸಂಪರ್ಕ ವೇದಿಕೆ' : 'Village Community & People Directory'}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '580px' }}>
              {isKannada
                ? 'ಗ್ರಾಮದ ನೋಂದಾಯಿತ ರೈತರು, ಕ್ರೀಡಾಪಟುಗಳು, ಶಿಕ್ಷಕರು ಹಾಗೂ ಸಾಧಕರನ್ನು ಹುಡುಕಿ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿ ಸಂದೇಶ ಕಳುಹಿಸಿ.'
                : 'Discover and connect with verified village farmers, sports champions, teachers, and achievers.'}
            </p>
          </div>

          {/* Privacy Settings Toggle Button */}
          {currentUser && (
            <button
              onClick={() => setShowPrivacySettings(!showPrivacySettings)}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px'
              }}
            >
              <Settings size={16} />
              <span>{isKannada ? 'ನನ್ನ ಗೌಪ್ಯತೆ ಸೆಟ್ಟಿಂಗ್ಸ್' : 'My Privacy Controls'}</span>
            </button>
          )}
        </div>

        {/* Strict Privacy Guarantee Box */}
        <div
          style={{
            marginTop: '16px',
            padding: '8px 14px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Lock size={14} color="#10B981" />
          <span>
            {isKannada
              ? 'ಗೌಪ್ಯತೆ ರಕ್ಷಣೆ: ಸಾರ್ವಜನಿಕ ಡೈರೆಕ್ಟರಿಯಲ್ಲಿ ಯಾರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ಎಂದಿಗೂ ಬಹಿರಂಗಗೊಳ್ಳುವುದಿಲ್ಲ.'
              : 'Privacy Protected: Resident phone numbers, emails, and exact home addresses are strictly confidential.'}
          </span>
        </div>
      </div>

      {/* --- USER PRIVACY CONTROLS PANEL --- */}
      {showPrivacySettings && currentUser && (
        <div
          className="glass-card"
          style={{
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'rgba(6, 78, 59, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10B981" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                {isKannada ? 'ನನ್ನ ಪ್ರೊಫೈಲ್ ಗೌಪ್ಯತೆ ಮತ್ತು ಗೋಚರತೆ' : 'My Community Visibility & Privacy'}
              </h3>
            </div>
            {settingsSavedMsg && (
              <span
                style={{
                  color: '#10B981',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Check size={14} /> {isKannada ? 'ಉಳಿಸಲಾಗಿದೆ!' : 'Saved!'}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {/* Allow Find Me Toggle */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {isKannada ? 'ಡೈರೆಕ್ಟರಿಯಲ್ಲಿ ನನ್ನನ್ನು ತೋರಿಸಿ' : 'Allow People to Find Me'}
                </span>
                <input
                  type="checkbox"
                  checked={myAllowFindMe}
                  onChange={(e) => setMyAllowFindMe(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {isKannada
                  ? 'ಇದನ್ನು ಆಫ್ ಮಾಡಿದರೆ ಇತರ ಗ್ರಾಮಸ್ಥರಿಗೆ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಕಾಣಿಸುವುದಿಲ್ಲ'
                  : 'Turn off to stay completely invisible in the community directory'}
              </p>
            </div>

            {/* Who can message me */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                {isKannada ? 'ಯಾರು ಸಂದೇಶ ಕಳುಹಿಸಬಹುದು?' : 'Who Can Message Me?'}
              </label>
              <select
                value={myPrivacyMessage}
                onChange={(e) => setMyPrivacyMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem'
                }}
              >
                <option value="EVERYONE">{isKannada ? 'ಎಲ್ಲಾ ಗ್ರಾಮಸ್ಥರು (Everyone)' : 'Everyone in Village'}</option>
                <option value="VILLAGE_MEMBERS">{isKannada ? 'ದೃಢೀಕೃತ ಸದಸ್ಯರು ಮಾತ್ರ (Verified Members)' : 'Verified Members Only'}</option>
                <option value="NOBODY">{isKannada ? 'ಯಾರೂ ಬೇಡ (Nobody)' : 'Nobody (Pause Messages)'}</option>
              </select>
            </div>

            {/* Voluntary Category */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                {isKannada ? 'ನನ್ನ ಸಮುದಾಯ ವರ್ಗ (ಐಚ್ಛಿಕ)' : 'My Community Role / Category'}
              </label>
              <select
                value={myCategory}
                onChange={(e) => setMyCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem'
                }}
              >
                <option value="FARMER">🌾 {isKannada ? 'ರೈತರು (Farmer)' : 'Farmer'}</option>
                <option value="SPORTS">🏏 {isKannada ? 'ಕ್ರೀಡಾಪಟು (Sports)' : 'Sports / Youth'}</option>
                <option value="STUDENT">🎓 {isKannada ? 'ವಿದ್ಯಾರ್ಥಿ (Student)' : 'Student'}</option>
                <option value="TEACHER">👨‍🏫 {isKannada ? 'ಶಿಕ್ಷಕರು (Teacher)' : 'Teacher'}</option>
                <option value="ARTIST">🎨 {isKannada ? 'ಕಲಾವಿದರು (Artist)' : 'Artist / Folk'}</option>
                <option value="ACHIEVER">🏆 {isKannada ? 'ಸಾಧಕರು (Achiever)' : 'Achiever'}</option>
                <option value="PROFESSIONAL">💼 {isKannada ? 'ಉದ್ಯೋಗಿ (Professional)' : 'Professional'}</option>
                <option value="RESIDENT">👤 {isKannada ? 'ಸಾಮಾನ್ಯ ನಿವಾಸಿ (Resident)' : 'Resident'}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setShowBlockedList(!showBlockedList)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F87171',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <UserX size={14} />
              <span>
                {isKannada ? `ನಿರ್ಬಂಧಿಸಿದವರು (${blockedUids.length})` : `Blocked Users (${blockedUids.length})`}
              </span>
            </button>

            <button
              onClick={handleSavePrivacy}
              className="btn-primary"
              style={{ padding: '6px 18px', fontSize: '0.82rem' }}
            >
              {isKannada ? 'ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಿ' : 'Save Settings'}
            </button>
          </div>

          {/* Blocked Users Section */}
          {showBlockedList && (
            <div
              style={{
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid var(--glass-border)'
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#F87171' }}>
                {isKannada ? 'ನೀವು ನಿರ್ಬಂಧಿಸಿದ ಬಳಕೆದಾರರು' : 'Blocked Users List'}
              </h4>
              {blockedUids.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {isKannada ? 'ಯಾರನ್ನೂ ನಿರ್ಬಂಧಿಸಿಲ್ಲ.' : 'You have not blocked any users.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {blockedUids.map((bUid) => (
                    <div
                      key={bUid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <span>ID: {bUid}</span>
                      <button
                        onClick={() => handleUnblock(bUid)}
                        style={{
                          background: '#EF4444',
                          border: 'none',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isKannada ? 'ಅನ್‌ಬ್ಲಾಕ್' : 'Unblock'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- SEARCH BAR --- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '16px'
        }}
      >
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isKannada
              ? 'ಹೆಸರು ಅಥವಾ ವೃತ್ತಿ ಮೂಲಕ ಹುಡುಕಿ... (Search by name or category)'
              : 'Search people by name, role, or interest...'
          }
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* --- CATEGORY PILLS --- */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
          scrollbarWidth: 'none'
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: '20px',
                border: isSelected ? '1px solid var(--accent-emerald)' : '1px solid var(--glass-border)',
                background: isSelected ? 'var(--accent-emerald)' : 'var(--bg-card)',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{cat.icon}</span>
              <span>{isKannada ? cat.label_kn : cat.label_en}</span>
            </button>
          );
        })}
      </div>

      {/* --- RESIDENTS DIRECTORY GRID --- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}
      >
        {filteredUsers.length === 0 ? (
          <div
            className="glass-card"
            style={{
              gridColumn: '1 / -1',
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>
              {isKannada ? 'ಯಾವುದೇ ಗ್ರಾಮಸ್ಥರು ಕಂಡುಬಂದಿಲ್ಲ' : 'No Residents Found'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              {isKannada
                ? 'ಬೇರೆ ಕೀವರ್ಡ್ ಅಥವಾ ವರ್ಗದೊಂದಿಗೆ ಹುಡುಕಿ ನೋಡಿ.'
                : 'Try adjusting your search query or category filter.'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isMe = currentUser?.uid === user.uid;
            const badge = getCategoryBadge(user.community_category);

            return (
              <div
                key={user.uid}
                className="glass-card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-lg)',
                  border: isMe
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid var(--glass-border)',
                  background: isMe ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* User Top Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                    {/* Avatar */}
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--glass-border)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          background: badge.color,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          flexShrink: 0
                        }}
                      >
                        {user.name.charAt(0)}
                      </div>
                    )}

                    {/* Name and Badges */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {isKannada && user.name_kn ? user.name_kn : user.name}
                        </h3>
                        {isMe && (
                          <span
                            style={{
                              background: 'var(--accent-emerald)',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {isKannada ? 'ನೀವು' : 'YOU'}
                          </span>
                        )}
                      </div>

                      {/* Voluntary Category Badge */}
                      <div style={{ marginTop: '4px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: badge.bg,
                            color: badge.color,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  <p
                    style={{
                      margin: '0 0 14px',
                      fontSize: '0.82rem',
                      lineHeight: 1.4,
                      color: 'var(--text-secondary)',
                      minHeight: '34px'
                    }}
                  >
                    {isKannada && user.bio_kn ? user.bio_kn : user.bio || (isKannada ? 'ಗ್ರಾಮಸ್ಥರು' : 'Village resident')}
                  </p>
                </div>

                {/* Card Action Button */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                  {isMe ? (
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '0.78rem',
                        color: 'var(--accent-emerald)',
                        fontWeight: 600,
                        padding: '6px 0'
                      }}
                    >
                      {isKannada ? '✓ ಇದು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್' : '✓ This is your profile'}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          onOpenLogin();
                        } else {
                          onOpenChatWithUser(user);
                        }
                      }}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>{isKannada ? 'ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send Message'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
