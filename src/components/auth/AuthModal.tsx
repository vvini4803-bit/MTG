import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole, UserProfile } from '../../types';
import { X, UserPlus, LogIn, Shield, Check, Phone, User, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'REGISTER' | 'LOGIN';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'REGISTER'
}) => {
  const { isKannada } = useLanguage();
  const { registerUser, loginWithDemo, loginWithEmail, loginWithPhone } = useAuth();

  const [activeTab, setActiveTab] = useState<'REGISTER' | 'LOGIN'>(defaultTab);

  // Registration Form State
  const [name, setName] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<UserProfile['community_category']>('RESIDENT');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  if (!isOpen) return null;

  const categories: Array<{ id: UserProfile['community_category']; label_en: string; label_kn: string; icon: string }> = [
    { id: 'FARMER', label_en: 'Farmer / Raitha', label_kn: 'ರೈತರು', icon: '🌾' },
    { id: 'SPORTS', label_en: 'Sports / Youth', label_kn: 'ಕ್ರೀಡಾಪಟು / ಯುವಕರು', icon: '🏏' },
    { id: 'STUDENT', label_en: 'Student', label_kn: 'ವಿದ್ಯಾರ್ಥಿ', icon: '🎓' },
    { id: 'TEACHER', label_en: 'Teacher / Educator', label_kn: 'ಶಿಕ್ಷಕರು', icon: '👩‍🏫' },
    { id: 'PROFESSIONAL', label_en: 'Merchant / Professional', label_kn: 'ವ್ಯಾಪಾರಿ / ವೃತ್ತಿಪರ', icon: '💼' },
    { id: 'RESIDENT', label_en: 'Village Resident', label_kn: 'ಗ್ರಾಮಸ್ಥರು', icon: '🏡' }
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ' : 'Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await registerUser({
        name: name.trim(),
        name_kn: nameKn.trim() || name.trim(),
        phone: phone.trim(),
        community_category: category,
        bio: bio.trim() || `Resident of Muttagundi Village (${category})`,
        bio_kn: bio.trim() || `ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ನಿವಾಸಿ (${category})`,
        role: 'USER'
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  const handleAdminQuickLogin = () => {
    loginWithDemo('SUPER_ADMIN');
    onClose();
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || loginPhone.length < 10) {
      setErrorMsg(isKannada ? 'ಮಾನ್ಯವಾದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Enter valid phone number');
      return;
    }

    if (!showOtpInput) {
      setShowOtpInput(true);
      return;
    }

    try {
      await loginWithPhone(loginPhone, loginOtp || '123456');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '480px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0F1D36 0%, #070F1E 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '28px 24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              {activeTab === 'REGISTER'
                ? (isKannada ? 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ ಸದಸ್ಯತ್ವ' : 'Join Muttagundi Community')
                : (isKannada ? 'ಲಾಗಿನ್ / ಸೈನ್ ಇನ್' : 'Resident Sign In')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isKannada ? 'ಸಂದೇಶ ಕಳುಹಿಸಲು ಮತ್ತು ನೈಜ-ಸಮಯದಲ್ಲಿ ಸಂವಾದ ನಡೆಸಲು' : 'To message and interact with residents in real time'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#CBD5E1',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <button
            onClick={() => { setActiveTab('REGISTER'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'REGISTER' ? 'var(--accent-emerald)' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} />
            <span>{isKannada ? 'ಹೊಸ ಸದಸ್ಯರ ನೋಂದಣಿ' : 'Register Profile'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('LOGIN'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'LOGIN' ? 'var(--accent-emerald)' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={16} />
            <span>{isKannada ? 'ಸೈನ್ ಇನ್' : 'Sign In'}</span>
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#FCA5A5',
              fontSize: '0.82rem',
              marginBottom: '16px'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* REGISTER TAB */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                {isKannada ? 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು (Name) *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Gowda / ಸುರೇಶ್"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                {isKannada ? 'ಕನ್ನಡದಲ್ಲಿ ಹೆಸರು (Name in Kannada)' : 'Name in Kannada (Optional)'}
              </label>
              <input
                type="text"
                value={nameKn}
                onChange={(e) => setNameKn(e.target.value)}
                placeholder="ಉದಾ: ರಮೇಶ್ ಗೌಡ"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                {isKannada ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Mobile Number)' : 'Mobile Phone (Optional / For Verification)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 XXXXX"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px', color: '#CBD5E1' }}>
                {isKannada ? 'ಗ್ರಾಮದಲ್ಲಿ ನಿಮ್ಮ ಪಾತ್ರ / ವರ್ಗ *' : 'Community Category / Identity *'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: category === c.id ? '2px solid var(--accent-emerald)' : '1px solid rgba(255,255,255,0.08)',
                      background: category === c.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: category === c.id ? '#10B981' : '#E2E8F0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <span>{c.icon}</span>
                    <span>{isKannada ? c.label_kn : c.label_en}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                {isKannada ? 'ನಿಮ್ಮ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತ ವಿವರ (Bio)' : 'Bio / About Yourself'}
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={isKannada ? 'ಉದಾ: ಕೃಷಿಕರು, ಹೊಸದುರ್ಗ ರಸ್ತೆ...' : 'e.g. Farmer cultivating ragi and coconut in Muttagundi'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: 800,
                marginTop: '6px'
              }}
            >
              {isSubmitting
                ? (isKannada ? 'ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ...' : 'Registering...')
                : (isKannada ? '✓ ನೋಂದಾಯಿಸಿ (Join Community)' : '✓ Register & Enter Portal')}
            </button>
          </form>
        )}

        {/* LOGIN TAB */}
        {activeTab === 'LOGIN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handlePhoneLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                  {isKannada ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Mobile Number'}
                </label>
                <input
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="98450 12345"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {showOtpInput && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                    {isKannada ? 'OTP (ಪರೀಕ್ಷಾರ್ಥ: 123456)' : 'Enter OTP (Test code: 123456)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    placeholder="123456"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      letterSpacing: '3px'
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 800 }}
              >
                {showOtpInput
                  ? (isKannada ? 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಲಾಗಿನ್ ಆಗಿ' : 'Verify & Sign In')
                  : (isKannada ? 'OTP ಪಡೆಯಿರಿ' : 'Send OTP')}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isKannada ? 'ಅಥವಾ' : 'OR'}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Quick Admin Access */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#F59E0B', fontWeight: 800, fontSize: '0.85rem', marginBottom: '6px' }}>
                <Shield size={16} />
                <span>{isKannada ? 'ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿ ಪ್ರವೇಶ' : 'Village Administration'}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {isKannada ? 'ಸುದ್ದಿ ದೃಢೀಕರಣ ಮತ್ತು ಗ್ರಾಮ ನಿರ್ವಹಣೆಗಾಗಿ ನೇರ ಲಾಗಿನ್' : 'Verify community news, notices and manage village content'}
              </p>
              <button
                onClick={handleAdminQuickLogin}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  borderColor: '#F59E0B',
                  color: '#F59E0B'
                }}
              >
                ⚡ {isKannada ? 'ಆಡಳಿತಾಧಿಕಾರಿಯಾಗಿ ಮುಂದುವರಿಯಿರಿ' : 'Login as Admin (Muttagundi Panchayat)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
