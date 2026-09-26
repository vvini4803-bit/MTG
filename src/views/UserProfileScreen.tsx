import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, isSuperAdminEmail } from '../context/AuthContext';
import { UserRole } from '../types';
import { compressImage } from '../services/imageOptimizer';
import {
  User,
  Shield,
  Phone,
  Mail,
  Calendar,
  LogOut,
  Edit,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Users,
  MessageSquare,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Sparkles,
  Link,
  X,
  Loader2
} from 'lucide-react';

interface UserProfileScreenProps {
  onOpenLogin: () => void;
  onOpenCreateProfile: () => void;
  onNavigateToPeople?: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToAdmin?: () => void;
}

const VILLAGE_AVATARS = [
  { id: 'farmer', label_en: 'Farmer / Raitha', label_kn: 'ರೈತರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RameshFarmer&skinColor=edb98a,d08b5b,ae5d29' },
  { id: 'elder', label_en: 'Village Elder', label_kn: 'ಗ್ರಾಮ ಹಿರಿಯರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GramElder&facialHair=beardLight,moustacheMagnum' },
  { id: 'woman', label_en: 'Woman Leader', label_kn: 'ಮಹಿಳಾ ಮುಖಂಡರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LakshmiGowda&top=longHairCurvy' },
  { id: 'sports', label_en: 'Youth & Sports', label_kn: 'ಯುವಕರು/ಕ್ರೀಡೆ', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KiranSports&clothingGraphic=diamond' },
  { id: 'student', label_en: 'Student', label_kn: 'ವಿದ್ಯಾರ್ಥಿ', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaStudent&accessories=round' },
  { id: 'teacher', label_en: 'Teacher', label_kn: 'ಶಿಕ್ಷಕರು', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ManjunathTeacher&facialHair=moustacheFancy' },
  { id: 'temple', label_en: 'Temple Heritage', label_kn: 'ದೇವಾಲಯ ಸಂಸ್ಕೃತಿ', url: '/anime/temple_gopuram.jpg' },
  { id: 'school', label_en: 'Village School', label_kn: 'ಗ್ರಾಮ ಶಾಲೆ', url: '/anime/village_school.jpg' }
];

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  onOpenLogin,
  onOpenCreateProfile,
  onNavigateToPeople,
  onNavigateToMessages,
  onNavigateToAdmin
}) => {
  const { isKannada } = useLanguage();
  const {
    currentUser,
    logout,
    role,
    loginWithDemo,
    claimAdminRole,
    isAdmin,
    isModerator,
    updateProfile
  } = useAuth();

  const [hideContact, setHideContact] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimNotice, setClaimNotice] = useState('');

  // Photo Upload & Manager State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  const directFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdminUser = currentUser ? isSuperAdminEmail(currentUser.email, currentUser.name) : false;

  const handleProcessFile = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await compressImage(file, 400, 400, 0.85);
      await updateProfile({ photoUrl: result.dataUrl });
      setShowPhotoModal(false);
      setUploadSuccessNotice(
        isKannada
          ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಚಿತ್ರ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ! ಎಲ್ಲಾ ಸುದ್ದಿ, ಚರ್ಚೆ ಮತ್ತು ಗ್ರಾಮ ಪಟ್ಟಿಯಲ್ಲಿ ಇದು ಕಾಣಿಸುತ್ತದೆ.'
          : 'Profile photo uploaded successfully! Now visible across news, community directory, and messages.'
      );
      setTimeout(() => setUploadSuccessNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (directFileInputRef.current) directFileInputRef.current.value = '';
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
    }
  };

  const handleDirectFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
  };

  const handleSelectPreset = async (url: string) => {
    setIsUploading(true);
    try {
      await updateProfile({ photoUrl: url });
      setShowPhotoModal(false);
      setUploadSuccessNotice(
        isKannada
          ? 'ಪ್ರೊಫೈಲ್ ಅವತಾರ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ!'
          : 'Profile avatar updated successfully!'
      );
      setTimeout(() => setUploadSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    try {
      await updateProfile({ photoUrl: '' });
      setShowPhotoModal(false);
      setUploadSuccessNotice(
        isKannada ? 'ಪ್ರೊಫೈಲ್ ಚಿತ್ರ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.' : 'Profile photo removed.'
      );
      setTimeout(() => setUploadSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setIsUploading(true);
    try {
      await updateProfile({ photoUrl: customUrlInput.trim() });
      setShowPhotoModal(false);
      setCustomUrlInput('');
      setShowUrlField(false);
      setUploadSuccessNotice(
        isKannada ? 'ಪ್ರೊಫೈಲ್ ಚಿತ್ರ ನವೀಕರಿಸಲಾಗಿದೆ!' : 'Profile photo updated successfully!'
      );
      setTimeout(() => setUploadSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save photo link');
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container" style={{ padding: '40px 16px', maxWidth: '480px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '36px 20px' }}>
          <User size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            {isKannada ? 'ನಾಗರಿಕ ಲಾಗಿನ್' : 'Resident Sign In Required'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {isKannada
              ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಲು ಅಥವಾ ಸುದ್ದಿ ಪ್ರಕಟಿಸಲು ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಆಗಿ'
              : 'Sign in to access your posts, registered events, and community permissions'}
          </p>
          <button onClick={onOpenLogin} className="btn-primary" style={{ width: '100%', height: '48px' }}>
            {isKannada ? 'ಲಾಗಿನ್ / ಸೈನ್ ಅಪ್' : 'Sign In / Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '640px' }}>
      {/* Hidden file input for fast 1-tap direct upload */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleDirectFileInputChange}
        style={{ display: 'none' }}
      />

      <div className="glass-card" style={{ padding: '32px 24px', position: 'relative' }}>
        {/* Success Notice Banner */}
        {uploadSuccessNotice && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.12) 100%)',
              border: '1.5px solid #10B981',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#A7F3D0',
              fontSize: '0.86rem',
              fontWeight: 600,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
            }}
          >
            <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{uploadSuccessNotice}</span>
          </div>
        )}

        {/* Header Avatar & Name with Direct Photo Upload Camera Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* Avatar Container with Floating Camera Button Badge */}
          <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
            {currentUser.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt={currentUser.name}
                onClick={() => setShowPhotoModal(true)}
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--accent-emerald)',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                  cursor: 'pointer'
                }}
                title={isKannada ? 'ಫೋಟೋ ಬದಲಾಯಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click to change photo'}
              />
            ) : (
              <div
                onClick={() => setShowPhotoModal(true)}
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid var(--accent-emerald)',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer'
                }}
                title={isKannada ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click to upload photo'}
              >
                {currentUser.name.charAt(0)}
              </div>
            )}

            {/* Camera Badge Overlay */}
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                border: '2px solid #064E3B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                transition: 'transform 0.15s ease'
              }}
              title={isKannada ? 'ಫೋಟೋ ಬದಲಾಯಿಸಿ / ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload / Change Photo'}
            >
              <Camera size={15} />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                {isKannada && currentUser.name_kn ? currentUser.name_kn : currentUser.name}
              </h2>
              <span className="badge badge-verified" style={{ fontSize: '0.65rem' }}>
                {currentUser.account_status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#FBBF24',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                <Shield size={12} />
                ROLE: {role.replace('_', ' ')}
              </span>

              {/* Instant Photo Upload Action Button */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  color: '#34D399',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Camera size={13} />
                <span>{isKannada ? 'ಭಾವಚಿತ್ರ ಅಪ್‌ಲೋಡ್' : 'Upload Photo'}</span>
              </button>
            </div>

            {currentUser.bio && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {currentUser.bio}
              </p>
            )}
          </div>
        </div>

        {/* Contact Info & Privacy Toggle */}
        <div
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Private Contact Details
            </span>
            <button
              onClick={() => setHideContact(!hideContact)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {hideContact ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{hideContact ? 'Hidden from public' : 'Visible'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            {currentUser.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="var(--accent-emerald)" />
                <span>{hideContact ? '+91 ••••• ' + currentUser.phone.slice(-4) : currentUser.phone}</span>
              </div>
            )}
            {currentUser.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} color="#0284C7" />
                <span>{hideContact ? '••••••@' + currentUser.email.split('@')[1] : currentUser.email}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Calendar size={14} />
              <span>Resident member since {currentUser.created_at ? currentUser.created_at.split('T')[0] : '2025'}</span>
            </div>
          </div>
        </div>

        {/* 👥 Community & Private Messaging Hub */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px'
          }}
        >
          <h3
            style={{
              margin: '0 0 10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={16} color="var(--accent-emerald)" />
            <span>{isKannada ? 'ಗ್ರಾಮ ಸಮುದಾಯ ಮತ್ತು ಸಂಪರ್ಕ' : 'Village Community & Connections'}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={onNavigateToPeople}
              className="btn-primary"
              style={{
                fontSize: '0.82rem',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Users size={16} />
              <span>{isKannada ? '👥 ನಮ್ಮ ಗ್ರಾಮಸ್ಥರು' : '👥 Our People'}</span>
            </button>

            <button
              onClick={onNavigateToMessages}
              className="btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid rgba(16, 185, 129, 0.4)'
              }}
            >
              <MessageSquare size={16} color="var(--accent-emerald)" />
              <span>{isKannada ? '💬 ಸಂದೇಶಗಳು' : '💬 Messages'}</span>
            </button>
          </div>
        </div>

        {/* 👑 Super Admin Governance Hub / Claim Super Admin Desk */}
        {isSuperAdminUser && (
          <>
            {role === 'SUPER_ADMIN' ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>👑</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FBBF24' }}>
                        {isKannada ? 'ದೃಢೀಕರಿಸಿದ ಮುಖ್ಯ ಸೂಪರ್ ಅಡ್ಮಿನ್' : 'Verified Root Super Administrator'}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: '#FEF3C7' }}>
                        {currentUser.email || 'vvini@gmail.com'} • {isKannada ? 'ಸಂಪೂರ್ಣ ಗ್ರಾಮ ಆಡಳಿತ ಹಕ್ಕುಗಳು ಸಕ್ರಿಯ' : 'Full Village Governance & RBAC Access'}
                      </span>
                    </div>
                  </div>
                  {onNavigateToAdmin && (
                    <button
                      onClick={onNavigateToAdmin}
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      <span>🛡️</span>
                      <span>{isKannada ? 'ಆಡಳಿತ ಕೇಂದ್ರ ತೆರೆಯಿರಿ' : 'Open Admin Hub'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.05) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.4rem' }}>👑</span>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#FBBF24' }}>
                    {isKannada ? 'ಅಡ್ಮಿನ್ ಪಾತ್ರ ಪಡೆಯಿರಿ' : 'Claim Super Admin Role'}
                  </h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {isKannada
                    ? 'ಈ ಖಾತೆಯನ್ನು ಸೂಪರ್ ಅಡ್ಮಿನ್ ಆಗಿ ಮೇಲ್ದರ್ಜೆಗೇರಿಸಿ ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯತಿ ಆಡಳಿತ ನಿಯಂತ್ರಣಗಳನ್ನು ತಕ್ಷಣ ಪಡೆಯಿರಿ.'
                    : 'Elevate your session to Super Admin status to manage residents, verify news, and control all village portals.'}
                </p>

                {claimNotice && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', marginBottom: '10px' }}>
                    {claimNotice}
                  </div>
                )}

                <button
                  onClick={async () => {
                    setClaiming(true);
                    const res = await claimAdminRole(currentUser.email);
                    setClaiming(false);
                    setClaimNotice(res.message);
                  }}
                  disabled={claiming}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <span>👑</span>
                  <span>{claiming ? 'Activating...' : (isKannada ? 'ಸೂಪರ್ ಅಡ್ಮಿನ್ ಪಾತ್ರ ಪಡೆಯಿರಿ' : 'Claim Super Admin Role')}</span>
                </button>
              </div>
            )}

            {/* Quick Demo Role Switcher */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <UserCheck size={15} color="#F59E0B" />
                <strong style={{ fontSize: '0.82rem', color: '#FEF08A' }}>
                  Switch Test Role (RBAC Simulation)
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { r: 'SUPER_ADMIN', label: 'Super Admin' },
                  { r: 'MODERATOR', label: 'Moderator' },
                  { r: 'SPORTS_ORGANIZER', label: 'Sports Organizer' },
                  { r: 'USER', label: 'Resident' }
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => loginWithDemo(item.r as UserRole)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--glass-border)',
                      background: role === item.r ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.06)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: role === item.r ? 700 : 500
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <button onClick={onOpenCreateProfile} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Edit size={16} />
            <span>{isKannada ? 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ' : 'Edit Profile'}</span>
          </button>

          <button onClick={logout} className="btn-danger" style={{ fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span>{isKannada ? 'ಲಾಗ್ ಔಟ್' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* --- Sleek Profile Photo Management Modal --- */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಪ್ರೊಫೈಲ್ ಭಾವಚಿತ್ರ ನಿರ್ವಹಣೆ' : 'Manage Profile Photo'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isKannada ? 'ಗ್ರಾಮಸ್ಥರಿಗೆ ಸುಲಭವಾಗಿ ಗುರುತಿಸಲು ನಿಮ್ಮ ಫೋಟೋ ಸೇರಿಸಿ' : 'Upload your photo for instant recognition'}
                </span>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Hidden file input inside modal */}
            <input
              ref={modalFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDirectFileInputChange}
              style={{ display: 'none' }}
            />

            {/* Current Photo Preview */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto 12px' }}>
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--accent-emerald)',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontSize: '2.6rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid var(--accent-emerald)'
                    }}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                {isUploading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      gap: '4px'
                    }}
                  >
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Uploading...</span>
                  </div>
                )}
              </div>
              <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--text-primary)' }}>
                {currentUser.name}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {currentUser.photoUrl ? (isKannada ? 'ಕಸ್ಟಮ್ ಭಾವಚಿತ್ರ ಸಕ್ರಿಯ' : 'Custom photo active') : (isKannada ? 'ಯಾವುದೇ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿಲ್ಲ' : 'No custom photo set')}
              </span>
            </div>

            {/* Option 1: Direct File Upload from Device or Camera */}
            <div style={{ marginBottom: '18px' }}>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => modalFileInputRef.current?.click()}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Upload size={18} />
                <span>{isKannada ? '📸 ಮೊಬೈಲ್ / ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : '📸 Upload Photo from Device / Camera'}</span>
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center', marginTop: '6px' }}>
                {isKannada ? 'JPG, PNG, WebP ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಆಪ್ಟಿಮೈಸ್ ಆಗುತ್ತದೆ' : 'Auto-compressed & optimized for high-speed village loading'}
              </span>
            </div>

            {/* Option 2: Curated Village Avatar Presets */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Sparkles size={15} color="#F59E0B" />
                <strong style={{ fontSize: '0.82rem', color: '#FEF08A' }}>
                  {isKannada ? 'ಸಿದ್ಧ ಗ್ರಾಮಸ್ಥ ಅವತಾರ ಆಯ್ಕೆಮಾಡಿ:' : 'Or choose a recognized village avatar:'}
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {VILLAGE_AVATARS.map((avatar) => {
                  const isSelected = currentUser.photoUrl === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      disabled={isUploading}
                      onClick={() => handleSelectPreset(avatar.url)}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '2px solid var(--accent-emerald)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '8px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.label_en}
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: isSelected ? '#10B981' : 'var(--text-secondary)',
                          fontWeight: isSelected ? 800 : 500,
                          textAlign: 'center',
                          lineHeight: 1.2
                        }}
                      >
                        {isKannada ? avatar.label_kn : avatar.label_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Option 3: Paste Custom Image Web URL */}
            <div style={{ marginBottom: '16px' }}>
              {!showUrlField ? (
                <button
                  type="button"
                  onClick={() => setShowUrlField(true)}
                  style={{
                    background: 'transparent',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    width: '100%',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Link size={14} />
                  <span>{isKannada ? 'ವೆಬ್ ಇಮೇಜ್ ಲಿಂಕ್ ಸೇರಿಸಿ (URL)' : 'Paste Image Web Link (URL)'}</span>
                </button>
              ) : (
                <form onSubmit={handleSaveCustomUrl} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    className="form-input"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    style={{ flex: 1, height: '40px', fontSize: '0.82rem' }}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="btn-primary"
                    style={{ height: '40px', padding: '0 16px', fontSize: '0.82rem' }}
                  >
                    Save
                  </button>
                </form>
              )}
            </div>

            {/* Option 4: Remove photo if set */}
            {currentUser.photoUrl && (
              <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleRemovePhoto}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px'
                  }}
                >
                  <Trash2 size={14} />
                  <span>{isKannada ? 'ಪ್ರಸ್ತುತ ಫೋಟೋ ತೆಗೆದುಹಾಕಿ (ಮೂಲ ಅಕ್ಷರಕ್ಕೆ ಮರಳಿ)' : 'Remove Current Photo (Reset to initials)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
