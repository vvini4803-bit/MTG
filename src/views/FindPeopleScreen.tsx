import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { UserProfile, UserRole } from '../types';
import { compressImage } from '../services/imageOptimizer';
import { triggerHapticFeedback } from '../services/deviceIdentity';
import {
  Users,
  Search,
  MessageSquare,
  Image as ImageIcon,
  Edit3,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Wheat,
  Home,
  Trophy,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  X,
  UserCheck,
  Camera,
  RefreshCw,
  Check
} from 'lucide-react';

interface FindPeopleScreenProps {
  onBack: () => void;
  onOpenLogin: () => void;
  onOpenChat: (partner: {
    uid: string;
    name: string;
    name_kn?: string;
    photoUrl?: string;
    role?: string;
    community_category?: string;
  }) => void;
  onOpenChatWithImage?: (
    partner: {
      uid: string;
      name: string;
      name_kn?: string;
      photoUrl?: string;
      role?: string;
      community_category?: string;
    },
    imageDataUrl: string
  ) => void;
}

type CategoryFilter = 'ALL' | 'FARMER' | 'RESIDENT' | 'SPORTS' | 'COMMITTEE';

const isRealMember = (u: any): boolean => {
  if (!u || !u.uid) return false;
  const MOCK_UIDS = ['admin_101', 'usr_ramesh_farmer', 'usr_manju_sports', 'usr_sowmya_teacher', 'usr_basavaraj_resident'];
  if (MOCK_UIDS.includes(u.uid)) return false;
  if (
    u.uid.startsWith('usr_ramesh') ||
    u.uid.startsWith('usr_manju') ||
    u.uid.startsWith('usr_sowmya') ||
    u.uid.startsWith('usr_basavaraj')
  ) {
    return false;
  }
  return true;
};

export const FindPeopleScreen: React.FC<FindPeopleScreenProps> = ({
  onBack,
  onOpenLogin,
  onOpenChat,
  onOpenChatWithImage
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, updateProfile } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const all = dbService.getAllUsers().filter(isRealMember);
    const userMap = new Map<string, UserProfile>();
    all.forEach((u) => userMap.set(u.uid, u));
    const active = localStorage.getItem('gramasiri_active_user');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        if (parsed?.uid && isRealMember(parsed) && !userMap.has(parsed.uid)) {
          userMap.set(parsed.uid, parsed);
        }
      } catch {}
    }
    return Array.from(userMap.values());
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  // Edit Name Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameKn, setEditNameKn] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Direct Image Staging State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetPartnerForImage, setTargetPartnerForImage] = useState<UserProfile | null>(null);

  // Subscribe to real-time users from Firestore (Real Users Only)
  useEffect(() => {
    const unsub = dbService.subscribeUsers((updatedUsers) => {
      const realOnly = (updatedUsers || []).filter(isRealMember);
      const userMap = new Map<string, UserProfile>();
      realOnly.forEach((u) => userMap.set(u.uid, u));
      if (currentUser && isRealMember(currentUser) && !userMap.has(currentUser.uid)) {
        userMap.set(currentUser.uid, currentUser);
      }
      setUsers(Array.from(userMap.values()));
    });
    return () => unsub();
  }, [currentUser]);

  const handleOpenEditName = (user: UserProfile) => {
    setEditingUser(user);
    setEditNameEn(user.name || '');
    setEditNameKn(user.name_kn || '');
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const trimmedEn = editNameEn.trim();
    const trimmedKn = editNameKn.trim();

    if (!trimmedEn) {
      alert(isKannada ? 'ದಯವಿಟ್ಟು ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter a name');
      return;
    }

    setIsSavingName(true);
    try {
      await dbService.updateUserName(editingUser.uid, trimmedEn, trimmedKn || undefined);

      // If current user is editing their own name, update AuthContext too
      if (currentUser && currentUser.uid === editingUser.uid) {
        await updateProfile({ name: trimmedEn, name_kn: trimmedKn || undefined });
      }

      // Update in local state immediately
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === editingUser.uid ? { ...u, name: trimmedEn, name_kn: trimmedKn || u.name_kn } : u
        )
      );

      triggerHapticFeedback();
      const msg = isKannada
        ? `${trimmedEn} ಅವರ ಹೆಸರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ!`
        : `Name for ${trimmedEn} updated successfully!`;
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 3500);

      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  // Direct send image handler: opens file picker for a specific partner
  const handleInitiateSendImage = (partner: UserProfile) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setTargetPartnerForImage(partner);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPartnerForImage) return;

    try {
      const compressed = await compressImage(file, 640, 640, 0.70);
      triggerHapticFeedback();

      const partnerPayload = {
        uid: targetPartnerForImage.uid,
        name: targetPartnerForImage.name,
        name_kn: targetPartnerForImage.name_kn,
        photoUrl: targetPartnerForImage.photoUrl,
        role: targetPartnerForImage.role,
        community_category: targetPartnerForImage.community_category
      };

      if (onOpenChatWithImage) {
        onOpenChatWithImage(partnerPayload, compressed.dataUrl);
      } else {
        onOpenChat(partnerPayload);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to process photo');
    } finally {
      setTargetPartnerForImage(null);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    // Only real users (no mock/random accounts)
    if (!isRealMember(u)) return false;

    // Category Filter
    if (categoryFilter === 'FARMER' && u.community_category !== 'FARMER') return false;
    if (categoryFilter === 'RESIDENT' && u.community_category && u.community_category !== 'RESIDENT') return false;
    if (categoryFilter === 'SPORTS' && u.community_category !== 'SPORTS') return false;
    if (categoryFilter === 'COMMITTEE' && u.role !== 'ADMIN' && u.role !== 'MODERATOR' && u.role !== 'SUPER_ADMIN') return false;

    // Search query matching
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = u.name?.toLowerCase().includes(query);
    const knNameMatch = u.name_kn?.toLowerCase().includes(query);
    const emailMatch = u.email?.toLowerCase().includes(query);
    const phoneMatch = u.phone?.toLowerCase().includes(query);
    const categoryMatch = u.community_category?.toLowerCase().includes(query);
    const roleMatch = u.role?.toLowerCase().includes(query);

    return nameMatch || knNameMatch || emailMatch || phoneMatch || categoryMatch || roleMatch;
  });

  const getCategoryBadge = (cat?: string, role?: string) => {
    if (role === 'ADMIN' || role === 'MODERATOR' || role === 'SUPER_ADMIN') {
      return {
        label: isKannada ? '🛡️ ಗ್ರಾಮ ಆಡಳಿತ / ಸಮಿತಿ' : '🛡️ Committee & Admin',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.15)'
      };
    }
    switch (cat) {
      case 'FARMER':
        return {
          label: isKannada ? '🌾 ರೈತರು' : '🌾 Farmer',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)'
        };
      case 'SPORTS':
        return {
          label: isKannada ? '🏆 ಕ್ರೀಡಾಪಟು / ಯುವಕರು' : '🏆 Sports & Youth',
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.15)'
        };
      case 'STUDENT':
        return {
          label: isKannada ? '🎓 ವಿದ್ಯಾರ್ಥಿ' : '🎓 Student',
          color: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.15)'
        };
      case 'TEACHER':
        return {
          label: isKannada ? '📚 ಶಿಕ್ಷಕರು' : '📚 Teacher',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)'
        };
      case 'ACHIEVER':
        return {
          label: isKannada ? '⭐ ಸಾಧಕರು' : '⭐ Achiever',
          color: '#EAB308',
          bg: 'rgba(234, 179, 8, 0.15)'
        };
      case 'ARTIST':
        return {
          label: isKannada ? '🎨 ಕಲಾವಿದರು' : '🎨 Artist',
          color: '#EC4899',
          bg: 'rgba(236, 72, 153, 0.15)'
        };
      case 'PROFESSIONAL':
        return {
          label: isKannada ? '💼 ಉದ್ಯೋಗಿ' : '💼 Professional',
          color: '#6366F1',
          bg: 'rgba(99, 102, 241, 0.15)'
        };
      case 'RESIDENT':
      default:
        return {
          label: isKannada ? '🏡 ಗ್ರಾಮಸ್ಥರು' : '🏡 Village Resident',
          color: '#06B6D4',
          bg: 'rgba(6, 182, 212, 0.15)'
        };
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      {/* Hidden file input for direct photo pick */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Top Navigation Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={16} />
          <span>{isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10B981',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Users size={14} />
            <span>
              {users.length} {isKannada ? 'ಗ್ರಾಮಸ್ಥರು' : 'Logged-in Members'}
            </span>
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '20px',
          padding: '22px',
          marginBottom: '20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.4)',
              flexShrink: 0
            }}
          >
            <Users size={28} color="#FFFFFF" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.02em'
              }}
            >
              {isKannada ? '👥 ಗ್ರಾಮಸ್ಥರನ್ನು ಹುಡುಕಿ & ಡೈರೆಕ್ಟರಿ' : '👥 Find People & Village Directory'}
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.84rem',
                color: '#CBD5E1',
                lineHeight: 1.4
              }}
            >
              {isKannada
                ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಲಾಗಿನ್ ಆದ ಎಲ್ಲಾ ಸದಸ್ಯರ ಪಟ್ಟಿ — ಸಂದೇಶ ಕಳುಹಿಸಿ, ಫೋಟೋ ಶೇರ್ ಮಾಡಿ & ಹೆಸರು ನವೀಕರಿಸಿ.'
                : 'All registered & logged-in community members — message directly, send photos, and update names.'}
            </p>
          </div>
        </div>

        {/* Instant Search Bar */}
        <div style={{ position: 'relative', marginTop: '16px' }}>
          <Search
            size={18}
            color="#94A3B8"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isKannada
                ? 'ಹೆಸರು, ಫೋನ್, ಇಮೇಲ್ ಅಥವಾ ವಿಭಾಗದಿಂದ ಹುಡುಕಿ...'
                : 'Search by name, phone, email, or category...'
            }
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '12px 16px 12px 42px',
              color: '#F8FAFC',
              fontSize: '0.92rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s ease'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#CBD5E1',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '14px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}
        >
          {[
            { id: 'ALL', labelKn: 'ಎಲ್ಲರೂ', labelEn: 'All' },
            { id: 'FARMER', labelKn: '🌾 ರೈತರು', labelEn: '🌾 Farmers' },
            { id: 'RESIDENT', labelKn: '🏡 ಗ್ರಾಮಸ್ಥರು', labelEn: '🏡 Residents' },
            { id: 'SPORTS', labelKn: '🏏 ಕ್ರೀಡೆ & ಯುವಕರು', labelEn: '🏏 Sports & Youth' },
            { id: 'COMMITTEE', labelKn: '🛡️ ಸಮಿತಿ & ಅಡ್ಮಿನ್', labelEn: '🛡️ Committee/Admin' }
          ].map((pill) => {
            const isSelected = categoryFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setCategoryFilter(pill.id as CategoryFilter)}
                style={{
                  whiteSpace: 'nowrap',
                  background: isSelected
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#FFFFFF' : '#CBD5E1',
                  border: isSelected ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none'
                }}
              >
                {isKannada ? pill.labelKn : pill.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
            border: '1px solid #34D399',
            borderRadius: '14px',
            padding: '12px 18px',
            color: '#FFFFFF',
            fontSize: '0.88rem',
            fontWeight: 700,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#94A3B8'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Users size={32} color="#64748B" />
          </div>
          <h3 style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '1.1rem' }}>
            {isKannada ? 'ನೈಜ ನೋಂದಾಯಿತ ಗ್ರಾಮಸ್ಥರು ಲಭ್ಯವಿಲ್ಲ' : 'No Registered Members Found'}
          </h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto', color: '#94A3B8', lineHeight: 1.5 }}>
            {isKannada
              ? 'ಕೇವಲ ನಿಜವಾಗಿ ಲಾಗಿನ್ ಆದ ಮತ್ತು ನೋಂದಾಯಿತ ಗ್ರಾಮಸ್ಥರು ಮಾತ್ರ ಈ ಡೈರೆಕ್ಟರಿಯಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಾರೆ.'
              : 'Only real authenticated community members appear in this directory once they sign in.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}
        >
          {filteredUsers.map((user) => {
            const badge = getCategoryBadge(user.community_category, user.role);
            const isMe = currentUser?.uid === user.uid;

            return (
              <div
                key={user.uid}
                className="glass-card"
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  border: isMe ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isMe ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Top Section: Avatar & Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name}
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid rgba(16, 185, 129, 0.4)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.3rem',
                          border: '2px solid rgba(16, 185, 129, 0.4)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Online / Active Indicator */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#10B981',
                        border: '2.5px solid #0F172A',
                        boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)'
                      }}
                      title="Active Member"
                    />
                  </div>

                  {/* Name and Badges */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user.name}
                      </h3>
                      {isMe && (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.25)',
                            color: '#34D399',
                            border: '1px solid #10B981',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}
                        >
                          {isKannada ? 'ನೀವು' : 'You'}
                        </span>
                      )}
                    </div>

                    {/* Kannada Name if available */}
                    {user.name_kn && user.name_kn !== user.name && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#38BDF8', fontWeight: 600 }}>
                        {user.name_kn}
                      </p>
                    )}

                    {/* Community Category Badge */}
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.color}40`,
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* User Meta (Phone / Email if available) */}
                    {(user.phone || user.email) && (
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: '0.74rem',
                          color: '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {user.phone ? (
                          <>
                            <Phone size={11} />
                            <span>{user.phone}</span>
                          </>
                        ) : (
                          <>
                            <Mail size={11} />
                            <span>{user.email}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons: Rename, Message, Send Image */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {/* ✏️ Change Name Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditName(user)}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title={isKannada ? 'ಹೆಸರು ಬದಲಾಯಿಸಿ' : 'Change Name'}
                  >
                    <Edit3 size={14} color="#FBBF24" />
                    <span>{isKannada ? 'ಹೆಸರು ಬದಲಿಸಿ' : 'Rename'}</span>
                  </button>

                  {/* 💬 Message Button */}
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          onOpenLogin();
                          return;
                        }
                        onOpenChat({
                          uid: user.uid,
                          name: user.name,
                          name_kn: user.name_kn,
                          photoUrl: user.photoUrl,
                          role: user.role,
                          community_category: user.community_category
                        });
                      }}
                      style={{
                        flex: 1.2,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <MessageSquare size={15} />
                      <span>{isKannada ? 'ಸಂದೇಶ' : 'Message'}</span>
                    </button>
                  )}

                  {/* 📷 Quick Send Image Button */}
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleInitiateSendImage(user)}
                      style={{
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        color: '#38BDF8',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                      title={isKannada ? 'ಚಿತ್ರ ಕಳುಹಿಸಿ' : 'Send Image'}
                    >
                      <ImageIcon size={15} />
                      <span>{isKannada ? 'ಚಿತ್ರ' : 'Photo'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* ✏️ MODAL: CHANGE USER NAME                                   */}
      {/* ============================================================ */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setEditingUser(null)}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1.5px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Edit3 size={20} color="#F59E0B" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {isKannada ? 'ಹೆಸರು ಬದಲಾಯಿಸಿ' : 'Change User Name'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    UID: {editingUser.uid.slice(0, 12)}...
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target User Info Header */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {editingUser.photoUrl ? (
                <img
                  src={editingUser.photoUrl}
                  alt={editingUser.name}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#10B981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {editingUser.name.charAt(0)}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {editingUser.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  {editingUser.email || editingUser.phone || (isKannada ? 'ಗ್ರಾಮಸ್ಥ ಸದಸ್ಯ' : 'Village Member')}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveName}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  {isKannada ? 'ಹೆಸರು (ಇಂಗ್ಲಿಷ್) *' : 'Display Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  placeholder="e.g. Vinay Kumar"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  {isKannada ? 'ಕನ್ನಡ ಹೆಸರು (ಐಚ್ಛಿಕ)' : 'Kannada Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={editNameKn}
                  onChange={(e) => setEditNameKn(e.target.value)}
                  placeholder="ಉದಾಹರಣೆ: ವಿನಯ್ ಕುಮಾರ್"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#CBD5E1',
                    borderRadius: '12px',
                    padding: '11px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSavingName || !editNameEn.trim()}
                  style={{
                    flex: 1.5,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '11px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: isSavingName || !editNameEn.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {isSavingName ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      <span>{isKannada ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{isKannada ? 'ಹೆಸರು ಉಳಿಸಿ' : 'Save Name'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindPeopleScreen;
