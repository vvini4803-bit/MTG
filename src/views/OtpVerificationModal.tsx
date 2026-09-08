import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, RefreshCw, KeyRound } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  phone: string;
  onClose: () => void;
  onVerified: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  phone,
  onClose,
  onVerified
}) => {
  const { isKannada } = useLanguage();
  const { loginWithPhone } = useAuth();
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [timer, setTimer] = useState(45);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimer(45);
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg(isKannada ? 'ದಯವಿಟ್ಟು 6 ಅಂಕಿಗಳ OTP ನಮೂದಿಸಿ' : 'Please enter 6-digit OTP code');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    try {
      await loginWithPhone(phone, fullOtp);
      setIsVerifying(false);
      onVerified();
      onClose();
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMsg(err.message || 'Verification failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <KeyRound size={26} />
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
          {isKannada ? 'OTP ಪರಿಶೀಲನೆ' : 'Verify Mobile OTP'}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          {isKannada
            ? `+91 ${phone} ಸಂಖ್ಯೆಗೆ ಕಳುಹಿಸಲಾದ 6 ಅಂಕಿಗಳ ಕೋಡ್ ನಮೂದಿಸಿ`
            : `Enter the 6-digit code sent to +91 ${phone}`}
        </p>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px',
            fontSize: '0.75rem',
            color: '#34D399',
            marginBottom: '20px'
          }}
        >
          💡 {isKannada ? 'ಪರೀಕ್ಷಾ ಕೋಡ್: 123456' : 'Test Verification Code: 123456'}
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: 'var(--radius-md)',
              padding: '8px',
              color: '#FCA5A5',
              fontSize: '0.78rem',
              marginBottom: '16px'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: '44px',
                  height: '52px',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isVerifying}
            style={{ width: '100%', height: '48px', marginBottom: '16px' }}
          >
            <ShieldCheck size={18} />
            <span>{isVerifying ? 'Verifying...' : isKannada ? 'ದೃಢೀಕರಿಸಿ' : 'Verify & Continue'}</span>
          </button>
        </form>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {timer > 0 ? (
            <span>{isKannada ? `ಮರು ಕಳುಹಿಸಲು ${timer} ಸೆಕೆಂಡುಗಳು` : `Resend code in ${timer}s`}</span>
          ) : (
            <button
              onClick={() => setTimer(45)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-emerald)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={12} />
              <span>{isKannada ? 'ಮತ್ತೆ OTP ಕಳುಹಿಸಿ' : 'Resend OTP'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
