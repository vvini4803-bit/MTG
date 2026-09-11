import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { X, UserPlus, LogIn, Mail, Lock, User } from 'lucide-react';

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
  const { signInWithEmail, signUpWithEmail, unverifiedEmail, setUnverifiedEmail } = useAuth();

  const [activeTab, setActiveTab] = useState<'REGISTER' | 'LOGIN'>(defaultTab);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local verification screen email holder
  const [verificationEmail, setVerificationEmail] = useState<string | null>(unverifiedEmail);

  if (!isOpen) return null;

  // Handle Sign Up
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ' : 'Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await signUpWithEmail(email, password);
    setIsSubmitting(false);

    if (res.unverifiedEmail) {
      setVerificationEmail(res.unverifiedEmail);
      setUnverifiedEmail(res.unverifiedEmail);
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  // Handle Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Email or password is incorrect');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await signInWithEmail(email, password);
    setIsSubmitting(false);

    if (res.unverifiedEmail) {
      setVerificationEmail(res.unverifiedEmail);
      setUnverifiedEmail(res.unverifiedEmail);
    } else if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      // Redirect to dashboard (close modal)
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '460px',
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
              {verificationEmail
                ? (isKannada ? 'ಇಮೇಲ್ ಪರಿಶೀಲನೆ' : 'Email Verification')
                : activeTab === 'REGISTER'
                ? (isKannada ? 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ ಸದಸ್ಯತ್ವ' : 'Join Muttagundi Community')
                : (isKannada ? 'ಲಾಗಿನ್ / ಸೈನ್ ಇನ್' : 'Resident Sign In')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isKannada ? 'ಗ್ರಾಮ ವೇದಿಕೆ ಪ್ರವೇಶ' : 'Secure Citizen Access'}
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

        {/* EMAIL VERIFICATION SCREEN */}
        {verificationEmail ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                fontSize: '1.8rem'
              }}
            >
              ✉️
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
              {isKannada ? 'ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ' : 'Verify Your Email'}
            </h3>

            {/* Exact Required Verification Message */}
            <p
              style={{
                fontSize: '0.92rem',
                color: '#E2E8F0',
                lineHeight: 1.6,
                marginBottom: '26px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px 14px'
              }}
            >
              We have sent you a verification email to <strong style={{ color: '#60A5FA' }}>{verificationEmail}</strong>. Please verify it and log in.
            </p>

            {/* Login Button on Verification Screen */}
            <button
              onClick={() => {
                setVerificationEmail(null);
                setUnverifiedEmail(null);
                setActiveTab('LOGIN');
                setErrorMsg(null);
              }}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: 800
              }}
            >
              {isKannada ? 'ಲಾಗಿನ್ (Login)' : 'Login'}
            </button>
          </div>
        ) : (
          <>
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
                onClick={() => {
                  setActiveTab('REGISTER');
                  setErrorMsg(null);
                }}
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
                onClick={() => {
                  setActiveTab('LOGIN');
                  setErrorMsg(null);
                }}
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

            {/* Error Banner */}
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
                    {isKannada ? 'ನಿಮ್ಮ ಹೆಸರು (Name)' : 'Full Name (Optional)'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Gowda"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                    {isKannada ? 'ಇಮೇಲ್ ವಿಳಾಸ (Email) *' : 'Email Address *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                    {isKannada ? 'ಪಾಸ್‌ವರ್ಡ್ (Password) *' : 'Password *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
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
                    : (isKannada ? '✓ ನೋಂದಾಯಿಸಿ (Sign Up)' : '✓ Sign Up')}
                </button>
              </form>
            )}

            {/* LOGIN TAB */}
            {activeTab === 'LOGIN' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                    {isKannada ? 'ಇಮೇಲ್ ವಿಳಾಸ (Email)' : 'Email Address'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                    {isKannada ? 'ಪಾಸ್‌ವರ್ಡ್ (Password)' : 'Password'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
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
                    ? (isKannada ? 'ಪ್ರವೇಶಿಸಲಾಗುತ್ತಿದೆ...' : 'Signing In...')
                    : (isKannada ? 'ಸೈನ್ ಇನ್ (Sign In)' : 'Sign In')}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
