import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { X, UserPlus, LogIn, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'REGISTER' | 'LOGIN' | 'PHONE';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'LOGIN'
}) => {
  const { isKannada } = useLanguage();
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithPhoneDirect,
    unverifiedEmail,
    setUnverifiedEmail
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'REGISTER' | 'LOGIN' | 'PHONE'>(defaultTab);

  // Email / Password Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone OTP Form Fields
  const [phone, setPhone] = useState('9845012345');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local verification screen email holder
  const [verificationEmail, setVerificationEmail] = useState<string | null>(unverifiedEmail);

  if (!isOpen) return null;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const res = await signInWithGoogle();
    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      onClose();
    }
  };

  // Handle Phone OTP Request
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Enter a valid 10-digit mobile number');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    const res = await sendPhoneOtp(phone, 'authmodal-recaptcha-container');
    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      setOtpSent(true);
    }
  };

  // Handle Phone OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು 6 ಅಂಕಿಗಳ OTP ನಮೂದಿಸಿ' : 'Enter valid 6-digit OTP');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    const res = await verifyPhoneOtp(otpCode);
    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      onClose();
    }
  };

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

    if (res.success) {
      onClose();
    } else if (res.unverifiedEmail) {
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
        {/* Invisible reCAPTCHA container for Phone Auth */}
        <div id="authmodal-recaptcha-container"></div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              {verificationEmail
                ? (isKannada ? 'ಇಮೇಲ್ ಪರಿಶೀಲನೆ' : 'Email Verification')
                : activeTab === 'REGISTER'
                ? (isKannada ? 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮ ಸದಸ್ಯತ್ವ' : 'Join Community')
                : activeTab === 'PHONE'
                ? (isKannada ? 'ಮೊಬೈಲ್ OTP ಲಾಗಿನ್' : 'Phone SMS Sign In')
                : (isKannada ? 'ಲಾಗಿನ್ / ಸೈನ್ ಇನ್' : 'Resident Sign In')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isKannada ? 'ಗ್ರಾಮ ವೇದಿಕೆ ಅಧಿಕೃತ ಪ್ರವೇಶ' : 'Official Grama Platform Access'}
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

            <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '14px', lineHeight: 1.5 }}>
              {isKannada
                ? 'ಗಮನಿಸಿ: ಇಮೇಲ್ ಇನ್‌ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಇಲ್ಲದಿದ್ದರೆ ಸ್ಪ್ಯಾಮ್ / ಜಂಕ್ ಫೋಲ್ಡರ್ ಪರಿಶೀಲಿಸಿ, ಅಥವಾ ನೇರವಾಗಿ ಲಾಗಿನ್ ಆಗಲು ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.'
                : 'Note: If not in your inbox, check your Spam / Junk folder, or click Login above to sign in directly.'}
            </p>
          </div>
        ) : (
          <>
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px',
                transition: 'background 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{isKannada ? 'ಗೂಗಲ್ ಖಾತೆಯ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 18px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ padding: '0 10px', textTransform: 'uppercase' }}>{isKannada ? 'ಅಥವಾ' : 'OR'}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            {/* 3 Tab Switcher: Register, Login, Phone */}
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
                  setActiveTab('LOGIN');
                  setErrorMsg(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'LOGIN' ? 'var(--accent-emerald)' : 'transparent',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <LogIn size={14} />
                <span>{isKannada ? 'ಸೈನ್ ಇನ್' : 'Sign In'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('PHONE');
                  setErrorMsg(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'PHONE' ? 'var(--accent-emerald)' : 'transparent',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <Phone size={14} />
                <span>{isKannada ? 'ಮೊಬೈಲ್ OTP' : 'Phone OTP'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('REGISTER');
                  setErrorMsg(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'REGISTER' ? 'var(--accent-emerald)' : 'transparent',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <UserPlus size={14} />
                <span>{isKannada ? 'ನೋಂದಣಿ' : 'Register'}</span>
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#FCA5A5',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                  lineHeight: 1.5,
                  textAlign: 'left'
                }}
              >
                <div>{errorMsg}</div>
                {(errorMsg.includes('Billing') || errorMsg.includes('billing-not-enabled') || errorMsg.includes('region') || errorMsg.includes('testing')) && phone && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (loginWithPhoneDirect) {
                        setIsSubmitting(true);
                        await loginWithPhoneDirect(phone);
                        setIsSubmitting(false);
                        onClose();
                      }
                    }}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--accent-emerald)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isKannada ? `+91 ${phone} ಮೂಲಕ ನೇರವಾಗಿ ಪ್ರವೇಶಿಸಿ (ಉಚಿತ)` : `Instant Sign In as +91 ${phone} (Free Testing)`}
                  </button>
                )}
              </div>
            )}

            {/* PHONE OTP TAB */}
            {activeTab === 'PHONE' && (
              !otpSent ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label className="form-label" style={{ color: '#CBD5E1', fontSize: '0.78rem', fontWeight: 700 }}>
                      {isKannada ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (+91)' : 'Mobile Phone Number (+91)'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)'
                        }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        className="form-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9845012345"
                        required
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800 }}
                  >
                    <span>{isSubmitting ? (isKannada ? 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...' : 'Sending OTP...') : (isKannada ? 'OTP SMS ಕಳುಹಿಸಿ' : 'Send 6-Digit OTP')}</span>
                    <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                      {isKannada ? `OTP ಸಂಖ್ಯೆಯನ್ನು ${phone} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ` : `OTP sent via SMS to +91 ${phone}`}
                    </p>
                  </div>

                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label className="form-label" style={{ color: '#CBD5E1', fontSize: '0.78rem', fontWeight: 700 }}>
                      {isKannada ? '6 ಅಂಕಿಗಳ OTP ಕೋಡ್' : 'Enter 6-Digit OTP Code'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      required
                      style={{
                        width: '100%',
                        padding: '14px',
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        letterSpacing: '8px',
                        fontWeight: 800,
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFFFFF'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800 }}
                  >
                    <span>{isSubmitting ? (isKannada ? 'ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'Verifying...') : (isKannada ? 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಪ್ರವೇಶಿಸಿ' : 'Verify & Sign In')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    {isKannada ? '← ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ' : '← Change Phone Number'}
                  </button>
                </form>
              )
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

