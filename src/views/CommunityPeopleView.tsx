import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { UserProfile } from '../types';
import { AadhaarResidentVerificationModal } from '../components/people/AadhaarResidentVerificationModal';
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
  Sparkles,
  MapPin,
  Award,
  ChevronDown
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
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [blockedUids, setBlockedUids] = useState<string[]>([]);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // User's own privacy preferences
  const [myAllowFindMe, setMyAllowFindMe] = useState<boolean>(currentUser?.allow_find_me !== false);
  const [myPrivacyFind, setMyPrivacyFind] = useState<string>(currentUser?.privacy_find || 'EVERYONE');
  const [myPrivacyMessage, setMyPrivacyMessage] = useState<string>(currentUser?.privacy_message || 'EVERYONE');
  const [myCategory, setMyCategory] = useState<string>(currentUser?.community_category || 'RESIDENT');

  // Load public users and blocked list
  const refreshData = () => {
    const publicUsers = dbService.getMuttagondiPeople(currentUser?.uid, false);
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

  useEffect(() => {
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
    refreshData();
  };

  const handleUnblock = async (uid: string) => {
    if (!currentUser) return;
    await dbService.unblockUser(currentUser.uid, uid);
    setBlockedUids(dbService.getBlockedUsers(currentUser.uid));
    refreshData();
  };

  const categories = [
    { id: 'ALL', label_en: 'All Categories', label_kn: 'ಎಲ್ಲಾ ವರ್ಗಗಳು', icon: '👥' },
    { id: 'FARMER', label_en: 'Farmers', label_kn: 'ರೈತರು', icon: '🌾' },
    { id: 'SPORTS', label_en: 'Sports / Youth', label_kn: 'ಕ್ರೀಡೆ / ಯುವಕರು', icon: '🏏' },
    { id: 'STUDENT', label_en: 'Students', label_kn: 'ವಿದ್ಯಾರ್ಥಿಗಳು', icon: '🎓' },
    { id: 'TEACHER', label_en: 'Teachers', label_kn: 'ಶಿಕ್ಷಕರು', icon: '👨‍🏫' },
    { id: 'ARTIST', label_en: 'Artists & Cultural', label_kn: 'ಕಲಾವಿದರು', icon: '🎨' },
    { id: 'ACHIEVER', label_en: 'Achievers', label_kn: 'ಸಾಧಕರು', icon: '🏆' },
    { id: 'PROFESSIONAL', label_en: 'Professionals', label_kn: 'ಉದ್ಯೋಗಿಗಳು', icon: '💼' }
  ];

  // Available village wards for filter
  const wardsList = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.ward_or_street) set.add(u.ward_or_street);
    });
    return Array.from(set);
  }, [users]);

  // Current user's verification status
  const isMyProfileVerified = currentUser?.aadhaar_verification?.is_verified === true;

  // Filtered residents list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Verified only filter
      if (filterVerifiedOnly) {
        if (u.aadhaar_verification?.is_verified !== true) return false;
      }

      // Ward filter
      if (selectedWard !== 'ALL') {
        if (u.ward_or_street !== selectedWard) return false;
      }

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
        const matchWard = u.ward_or_street?.toLowerCase().includes(q);
        const matchWardKn = u.ward_or_street_kn?.toLowerCase().includes(q);
        return matchName || matchNameKn || matchBio || matchBioKn || matchCat || matchWard || matchWardKn;
      }

      return true;
    });
  }, [users, filterVerifiedOnly, selectedWard, selectedCategory, searchQuery]);

  const verifiedResidentsCount = useMemo(() => {
    return users.filter((u) => u.aadhaar_verification?.is_verified === true).length;
  }, [users]);

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
        return { label: isKannada ? '👤 ನಿವಾಸಿ' : '👤 Resident', color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.08)' };
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '920px' }}>
      {/* --- HERO HEADER: MUTTAGONDI PEOPLE --- */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.08) 50%, rgba(245, 158, 11, 0.1) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Users size={26} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿಗಳು' : 'Muttagondi People'}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {isKannada ? 'ಅಧಿಕೃತ ಗ್ರಾಮ ನಿವಾಸಿಗಳ ವೇದಿಕೆ' : 'Official Village Citizen Directory'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Hosadurga Taluk, Chitradurga
                  </span>
                </div>
              </div>
            </div>

            <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
              {isKannada
                ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಅಧಿಕೃತ ಆಧಾರ್ ದೃಢೀಕೃತ ನಿವಾಸಿಗಳು, ರೈತರು, ಶಿಕ್ಷಕರು, ಕ್ರೀಡಾಪಟುಗಳು ಹಾಗೂ ಸಾಧಕರ ಪಟ್ಟಿ. ಗ್ರಾಮಸ್ಥರೊಂದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಪರ್ಕದಲ್ಲಿರಿ.'
                : 'Official directory of verified Muttagondi residents, farmers, educators, sports stars, and achievers authenticated via residence e-KYC.'}
            </p>
          </div>

          {/* Action CTAs on Top Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {currentUser ? (
              <>
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="btn-primary"
                  style={{
                    fontSize: '0.84rem',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isMyProfileVerified
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>
                    {isMyProfileVerified
                      ? isKannada
                        ? '✓ ಆಧಾರ್ ದೃಢೀಕೃತ ನಿವಾಸಿ'
                        : '✓ Verified Resident'
                      : isKannada
                      ? '+ ಆಧಾರ್ ನಿವಾಸ ದೃಢೀಕರಣ'
                      : '+ Verify My Residence'}
                  </span>
                </button>

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
                  title={isKannada ? 'ಗೌಪ್ಯತೆ ನಿಯಂತ್ರಣಗಳು' : 'Privacy Settings'}
                >
                  <Settings size={16} />
                  <span>{isKannada ? 'ಗೌಪ್ಯತೆ' : 'Privacy'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="btn-primary"
                style={{
                  fontSize: '0.84rem',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ShieldCheck size={18} />
                <span>{isKannada ? 'ಲಾಗಿನ್ & ನಿವಾಸ ದೃಢೀಕರಣ' : 'Login & Verify Residence'}</span>
              </button>
            )}
          </div>
        </div>

        {/* UIDAI Strict Privacy & Legal Guarantee Badge */}
        <div
          style={{
            marginTop: '20px',
            padding: '10px 16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Lock size={16} color="#10B981" style={{ flexShrink: 0 }} />
          <span>
            {isKannada
              ? '🔒 UIDAI ಗೌಪ್ಯತೆ ಖಾತರಿ: ಸಂಪೂರ್ಣ ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಥವಾ ಬಯೋಮೆಟ್ರಿಕ್ಸ್ ಅನ್ನು ಎಂದಿಗೂ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ ಅಥವಾ ಪ್ರದರ್ಶಿಸುವುದಿಲ್ಲ. ಕೇವಲ ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸದ ಅಧಿಕೃತ ದೃಢೀಕರಣ ಟೋಕನ್ ಮಾತ್ರ ದಾಖಲಾಗುತ್ತದೆ.'
              : '🔒 UIDAI Privacy Guarantee: Full 12-digit Aadhaar numbers and biometric data are never collected, stored, or displayed. Only voluntary residence verification tokens are recorded.'}
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
                {isKannada ? 'ನನ್ನ ಸಮುದಾಯ ವರ್ಗ' : 'My Community Category'}
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
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isKannada ? 'ನೀವು ಯಾರನ್ನೂ ನಿರ್ಬಂಧಿಸಿಲ್ಲ.' : 'No users blocked.'}
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
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <span style={{ fontSize: '0.78rem' }}>{bUid}</span>
                      <button
                        onClick={() => handleUnblock(bUid)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#10B981',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isKannada ? 'ಅನ್‌ಬ್ಲಾಕ್ ಮಾಡಿ' : 'Unblock'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- QUICK STATS & AADHAAR VERIFICATION TOGGLE BAR --- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '18px',
          flexWrap: 'wrap'
        }}
      >
        {/* Toggle Pills: All Residents vs Aadhaar Verified Only */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)'
          }}
        >
          <button
            onClick={() => setFilterVerifiedOnly(false)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: !filterVerifiedOnly ? 'var(--accent-emerald)' : 'transparent',
              color: !filterVerifiedOnly ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: !filterVerifiedOnly ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={14} />
            <span>{isKannada ? `ಎಲ್ಲಾ ನಿವಾಸಿಗಳು (${users.length})` : `All Residents (${users.length})`}</span>
          </button>

          <button
            onClick={() => setFilterVerifiedOnly(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: filterVerifiedOnly ? 'var(--accent-emerald)' : 'transparent',
              color: filterVerifiedOnly ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: filterVerifiedOnly ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={15} color={filterVerifiedOnly ? '#FFFFFF' : '#10B981'} />
            <span>
              {isKannada
                ? `✓ ಆಧಾರ್ ದೃಢೀಕೃತ (${verifiedResidentsCount})`
                : `✓ Aadhaar Verified (${verifiedResidentsCount})`}
            </span>
          </button>
        </div>

        {/* Ward / Street Filter Dropdown */}
        {wardsList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={15} color="#10B981" />
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">
                {isKannada ? 'ಎಲ್ಲಾ ಬೀದಿಗಳು / ವಾರ್ಡ್‌ಗಳು' : 'All Wards / Streets'}
              </option>
              {wardsList.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* --- SEARCH BAR --- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 16px',
          marginBottom: '16px'
        }}
      >
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder={
            isKannada
              ? 'ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿಗಳ ಹೆಸರು, ಬೀದಿ, ಅಥವಾ ವೃತ್ತಿ ಮೂಲಕ ಹುಡುಕಿ...'
              : 'Search Muttagondi people by name, street, or category...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          marginBottom: '22px',
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
              padding: '44px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              borderRadius: '20px'
            }}
          >
            <Users size={44} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#10B981' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '1.1rem' }}>
              {isKannada ? 'ಯಾವುದೇ ನಿವಾಸಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No Muttagondi Residents Found'}
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 16px' }}>
              {isKannada
                ? 'ಬೇರೆ ಕೀವರ್ಡ್ ಅಥವಾ ವರ್ಗದೊಂದಿಗೆ ಹುಡುಕಿ ನೋಡಿ, ಅಥವಾ ನಿಮ್ಮ ಆಧಾರ್ ನಿವಾಸವನ್ನು ದೃಢೀಕರಿಸಿ ಸೇರ್ಪಡೆಗೊಳ್ಳಿ.'
                : 'Try adjusting your search filters, or verify your residence to join the directory.'}
            </p>
            {currentUser ? (
              <button
                onClick={() => setIsVerificationModalOpen(true)}
                className="btn-primary"
                style={{ padding: '8px 22px', fontSize: '0.88rem' }}
              >
                {isKannada ? '+ ನನ್ನ ನಿವಾಸ ದೃಢೀಕರಿಸಿ' : '+ Verify My Residence'}
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="btn-primary"
                style={{ padding: '8px 22px', fontSize: '0.88rem' }}
              >
                {isKannada ? '+ ಮೊದಲ ಸದಸ್ಯರಾಗಿ ನೋಂದಾಯಿಸಿ' : '+ Register as First Resident'}
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isMe = currentUser?.uid === user.uid;
            const badge = getCategoryBadge(user.community_category);
            const isVerified = user.aadhaar_verification?.is_verified === true;

            return (
              <div
                key={user.uid}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '20px',
                  border: isMe
                    ? '1.5px solid rgba(16, 185, 129, 0.5)'
                    : isVerified
                    ? '1px solid rgba(16, 185, 129, 0.25)'
                    : '1px solid var(--glass-border)',
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)'
                    : 'var(--bg-card)',
                  boxShadow: isVerified
                    ? '0 6px 20px rgba(0, 0, 0, 0.18)'
                    : 'none',
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
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isVerified ? '2.5px solid #10B981' : '2px solid var(--glass-border)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: badge.color,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          flexShrink: 0,
                          border: isVerified ? '2.5px solid #10B981' : 'none'
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
                            fontSize: '1.02rem',
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

                      {/* Official Verified Resident Seal Badge */}
                      {isVerified && (
                        <div style={{ marginTop: '4px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(16, 185, 129, 0.14)',
                              color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}
                          >
                            <ShieldCheck size={13} />
                            <span>
                              {isKannada ? 'ಆಧಾರ್ ದೃಢೀಕೃತ ನಿವಾಸಿ' : 'Aadhaar Verified Resident'}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
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

                  {/* Village Ward / Street Location Pin */}
                  {(user.ward_or_street || user.ward_or_street_kn) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        color: 'var(--accent-emerald)',
                        marginBottom: '8px',
                        background: 'rgba(16, 185, 129, 0.06)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      <MapPin size={13} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>
                        {isKannada && user.ward_or_street_kn
                          ? user.ward_or_street_kn
                          : user.ward_or_street}
                      </span>
                    </div>
                  )}

                  {/* Bio snippet */}
                  <p
                    style={{
                      margin: '0 0 14px',
                      fontSize: '0.82rem',
                      lineHeight: 1.45,
                      color: 'var(--text-secondary)',
                      minHeight: '34px'
                    }}
                  >
                    {isKannada && user.bio_kn
                      ? user.bio_kn
                      : user.bio || (isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮಸ್ಥರು' : 'Muttagondi village resident')}
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
                        padding: '6px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={14} />
                      <span>{isKannada ? 'ನಿಮ್ಮ ನಿವಾಸಿ ಪ್ರೊಫೈಲ್' : 'Your resident profile'}</span>
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
                        fontSize: '0.84rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>{isKannada ? 'ಖಾಸಗಿ ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send Message'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Aadhaar Resident Verification Modal */}
      {isVerificationModalOpen && (
        <AadhaarResidentVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          onVerificationSuccess={() => {
            refreshData();
          }}
        />
      )}
    </div>
  );
};
