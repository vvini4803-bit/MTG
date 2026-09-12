import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Mail, Shield, UserCheck, ArrowRight, Check, Lock, UserPlus, LogIn, User } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
  onOpenOtp: (phone: string) => void;
  onOpenCreateProfile: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onOpenCreateProfile
}) => {
  const { isKannada } = useLanguage();
  const {
    loginWithDemo,
    signInWithEmail,
    signUpWithEmail,
    unverifiedEmail,
    setUnverifiedEmail,
    claimAdminRole
  } = useAuth();

  const [emailMode, setEmailMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(unverifiedEmail);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Email or password is incorrect');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    if (emailMode === 'REGISTER') {
      const res = await signUpWithEmail(email, password);
      setIsLoading(false);
      if (res.success) {
        onSuccess();
      } else if (res.unverifiedEmail) {
        setVerificationEmail(res.unverifiedEmail);
        setUnverifiedEmail(res.unverifiedEmail);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } else {
      const res = await signInWithEmail(email, password);
      setIsLoading(false);
      if (res.unverifiedEmail) {
        setVerificationEmail(res.unverifiedEmail);
        setUnverifiedEmail(res.unverifiedEmail);
      } else if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success) {
        onSuccess();
      }
    }
  };

  const handleDemoSelect = (role: UserRole) => {
    loginWithDemo(role);
    onSuccess();
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '40px 16px' }}>
      <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <img
          src="/logo.png"
          alt="Muttagundi Village MTG Logo"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(245, 158, 11, 0.6)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            margin: '0 auto 16px'
          }}
        />

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'ಗ್ರಾಮಸಿರಿ ಪ್ರವೇಶ' : 'Citizen Portal Access'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {isKannada
            ? 'ಸುದ್ದಿ ಪ್ರಕಟಣೆ, ವರದಿ ಹಾಗೂ ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಲಾಗಿನ್ ಆಗಿ'
            : 'Secure access for news posting, event RSVP, and village updates'}
        </p>

        {/* Mode Toggle (Sign In / Register) */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setEmailMode('LOGIN');
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: emailMode === 'LOGIN' ? 'var(--accent-emerald)' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={15} />
            <span>{isKannada ? 'ಸೈನ್ ಇನ್' : 'Sign In'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmailMode('REGISTER');
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: emailMode === 'REGISTER' ? 'var(--accent-emerald)' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={15} />
            <span>{isKannada ? 'ಹೊಸ ಖಾತೆ ನೋಂದಣಿ' : 'Register Account'}</span>
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              color: '#FCA5A5',
              fontSize: '0.82rem',
              marginBottom: '16px',
              textAlign: 'left',
              lineHeight: 1.5
            }}
          >
            {errorMsg}
          </div>
        )}

        {verificationEmail ? (
          <div style={{ textAlign: 'center', padding: '12px 4px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '1.6rem'
              }}
            >
              ✉️
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '10px' }}>
              {isKannada ? 'ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ' : 'Verify Your Email'}
            </h3>

            <p
              style={{
                fontSize: '0.9rem',
                color: '#E2E8F0',
                lineHeight: 1.6,
                marginBottom: '22px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '14px 12px'
              }}
            >
              We have sent you a verification email to <strong style={{ color: '#60A5FA' }}>{verificationEmail}</strong>. Please verify it and log in.
            </p>

            <button
              type="button"
              onClick={() => {
                setVerificationEmail(null);
                setUnverifiedEmail(null);
                setEmailMode('LOGIN');
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
          <form onSubmit={handleEmailSubmit}>
            {emailMode === 'REGISTER' && (
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '14px' }}>
                <label className="form-label">{isKannada ? 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು' : 'Full Name (Optional)'}</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Gowda"
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">{isKannada ? 'ಇಮೇಲ್ ವಿಳಾಸ' : 'Email Address'}</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">{isKannada ? 'ಪಾಸ್‌ವರ್ಡ್' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ width: '100%', height: '48px', fontSize: '0.95rem', marginBottom: '16px' }}
            >
              <span>
                {isLoading
                  ? 'Checking...'
                  : emailMode === 'REGISTER'
                  ? isKannada
                    ? 'ನೋಂದಾಯಿಸಿ (Sign Up)'
                    : 'Sign Up'
                  : isKannada
                  ? 'ಪ್ರವೇಶಿಸಿ (Sign In)'
                  : 'Sign In'}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Demo Roles Instant Access */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--glass-border)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <UserCheck size={15} color="#F59E0B" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {isKannada ? 'ತ್ವರಿತ ಡೆಮೊ ರೋಲ್ ಆಯ್ಕೆ (RBAC ಪರೀಕ್ಷೆಗಾಗಿ):' : 'Instant Demo Role Test Login:'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoSelect('SUPER_ADMIN')}
              className="btn-secondary"
              style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Shield size={13} color="#10B981" />
              <span>Panchayat Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('MODERATOR')}
              className="btn-secondary"
              style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Shield size={13} color="#F59E0B" />
              <span>Content Moderator</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('SPORTS_ORGANIZER')}
              className="btn-secondary"
              style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Shield size={13} color="#0284C7" />
              <span>Sports Organizer</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('USER')}
              className="btn-secondary"
              style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Check size={13} color="#A855F7" />
              <span>Resident Farmer</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onOpenCreateProfile}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-emerald)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isKannada ? '+ ಹೊಸ ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ' : '+ Create New Resident Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
