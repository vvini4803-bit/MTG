import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import {
  aadhaarVerificationService,
  AadhaarConsentRequest
} from '../../services/aadhaarVerificationService';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  KeyRound,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Award
} from 'lucide-react';

interface AadhaarResidentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: () => void;
}

const VILLAGE_WARDS = [
  { id: 'ward_1', en: 'Kalleshwara Temple Road', kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ದೇವಸ್ಥಾನ ರಸ್ತೆ' },
  { id: 'ward_2', en: 'School Beedhi (Govt LPS Road)', kn: 'ಶಾಲೆ ಬೀದಿ (ಸರ್ಕಾರಿ ಶಾಲೆ ರಸ್ತೆ)' },
  { id: 'ward_3', en: 'Main Grama Beedhi', kn: 'ಮುಖ್ಯ ಗ್ರಾಮ ಬೀದಿ' },
  { id: 'ward_4', en: 'Farmers Colony (Krishi Beedhi)', kn: 'ರೈತರ ಕಾಲೋನಿ (ಕೃಷಿ ಬೀದಿ)' },
  { id: 'ward_5', en: 'Bus Stand Road', kn: 'ಬಸ್ ನಿಲ್ದಾಣ ರಸ್ತೆ' },
  { id: 'ward_6', en: 'Lake Embankment Road (Kere Yeri)', kn: 'ಕೆರೆ ಏರಿ ರಸ್ತೆ' },
  { id: 'ward_7', en: 'Panchayat Bhavan Road', kn: 'ಗ್ರಾಮ ಪಂಚಾಯತ್ ರಸ್ತೆ' }
];

export const AadhaarResidentVerificationModal: React.FC<AadhaarResidentVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationSuccess
}) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  // Wizard Steps: 1 = Legal Consent & Privacy, 2 = Masked Aadhaar & OTP, 3 = Ward & Address Confirmation, 4 = Success Certificate
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [last4Digits, setLast4Digits] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedWard, setSelectedWard] = useState(VILLAGE_WARDS[0]);
  const [customWard, setCustomWard] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationCertificate, setVerificationCertificate] = useState<any>(null);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    if (!last4Digits || last4Digits.length !== 4) {
      setErrorMsg(
        isKannada
          ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆಧಾರ್ ಸಂಖ್ಯೆಯ ಕೊನೆಯ 4 ಅಂಕಿಗಳನ್ನು ನಮೂದಿಸಿ.'
          : 'Please enter the last 4 digits of your Aadhaar number.'
      );
      return;
    }
    setErrorMsg(null);
    setOtpSent(true);
    // Simulate auto-fill OTP in sandbox mode for convenience
    setOtp('577533');
  };

  const handleVerifyResidence = async () => {
    if (!currentUser) return;
    if (!consentAgreed) {
      setErrorMsg(
        isKannada
          ? 'ಆಧಾರ್ ಕಾಯ್ದೆ 2016 ರ ಅನ್ವಯ ಮುಂದುವರಿಯಲು ಸ್ವಯಂಪ್ರೇರಿತ ಒಪ್ಪಿಗೆ ಅಗತ್ಯವಿದೆ.'
          : 'Voluntary consent under Aadhaar Act 2016 is required to proceed.'
      );
      return;
    }

    if (!otp || otp.length !== 6) {
      setErrorMsg(
        isKannada
          ? 'ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ OTP ನಮೂದಿಸಿ.'
          : 'Please enter the 6-digit Aadhaar verification OTP.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const finalWardEn = customWard.trim() ? customWard.trim() : selectedWard.en;
      const finalWardKn = customWard.trim() ? customWard.trim() : selectedWard.kn;

      const consentRequest: AadhaarConsentRequest = {
        uid: currentUser.uid,
        fullName: currentUser.name,
        maskedAadhaar: `XXXX-XXXX-${last4Digits}`,
        consentAgreed: true,
        declarationText:
          'I voluntarily consent to authenticate my residence details for the Muttagondi People directory in compliance with UIDAI regulations.',
        enteredAddress: {
          village: 'Muttagundi',
          taluk: 'Hosadurga',
          district: 'Chitradurga',
          pincode: '577533',
          wardOrStreet: finalWardEn,
          wardOrStreet_kn: finalWardKn
        }
      };

      const result = await aadhaarVerificationService.verifyResidentAddress(consentRequest, otp);

      if (!result.success || !result.isEligibleMuttagondiResident || !result.verificationRecord) {
        setErrorMsg(isKannada ? result.message_kn : result.message_en);
        setIsSubmitting(false);
        return;
      }

      // Persist to user record
      await dbService.setAadhaarResidenceVerification(
        currentUser.uid,
        result.verificationRecord,
        true
      );

      setVerificationCertificate(result.verificationRecord);
      setStep(4);
      onVerificationSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || (isKannada ? 'ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ.' : 'Verification failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          background: 'var(--bg-secondary)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          padding: '28px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Top Header with Indian National / Digital India Accents */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '12px',
              fontSize: '0.75rem',
              color: '#10B981',
              fontWeight: 700
            }}
          >
            <ShieldCheck size={14} />
            <span>
              {isKannada
                ? 'ಅಧಿಕೃತ ಗ್ರಾಮ ನಿವಾಸ ದೃಢೀಕರಣ (e-KYC)'
                : 'Official Village Residence e-KYC'}
            </span>
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿಗಳ ಪರಿಶೀಲನೆ' : 'Muttagondi Resident Verification'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {isKannada
              ? 'ಆಧಾರ್ ವಿಳಾಸದ ಆಧಾರದಲ್ಲಿ ಅಧಿಕೃತ ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿ ಡೈರೆಕ್ಟರಿಗೆ ಸೇರ್ಪಡೆಗೊಳ್ಳಿ'
              : 'Verify your Muttagondi village residence and join the verified citizen directory'}
          </p>
        </div>

        {/* Progress Tracker (Steps 1, 2, 3) */}
        {step < 4 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              padding: '0 10px'
            }}
          >
            {[
              { num: 1, label: isKannada ? 'ಒಪ್ಪಿಗೆ & ಗೌಪ್ಯತೆ' : 'Consent & Privacy' },
              { num: 2, label: isKannada ? 'ಆಧಾರ್ & OTP' : 'Masked Aadhaar' },
              { num: 3, label: isKannada ? 'ಬೀದಿ / ವಿಳಾಸ' : 'Village Ward' }
            ].map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isPast
                        ? '#10B981'
                        : isActive
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isPast || isActive ? '#FFFFFF' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: isActive ? '2px solid rgba(16, 185, 129, 0.5)' : 'none'
                    }}
                  >
                    {isPast ? '✓' : s.num}
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error message alert */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: LEGAL CONSENT & MANDATORY PRIVACY GUARANTEES */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Lock size={18} color="#10B981" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isKannada ? 'UIDAI ಕಾಯ್ದೆ ಮತ್ತು ಗೌಪ್ಯತೆ ನೀತಿ' : 'UIDAI Regulations & Strict Privacy Rules'}
                </h4>
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  fontSize: '0.8rem',
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)'
                }}
              >
                <li>
                  <strong>{isKannada ? 'ಪೂರ್ಣ ಸಂಖ್ಯೆ ಎಂದಿಗೂ ಉಳಿಯುವುದಿಲ್ಲ:' : 'Full Aadhaar Never Stored:'}</strong>{' '}
                  {isKannada
                    ? 'ನಿಮ್ಮ 12-ಅಂಕಿಯ ಆಧಾರ್ ಸಂಖ್ಯೆಯನ್ನು ಈ ಪೋರ್ಟಲ್ ಎಂದಿಗೂ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ ಅಥವಾ ಸಾರ್ವಜನಿಕವಾಗಿ ಪ್ರದರ್ಶಿಸುವುದಿಲ್ಲ.'
                    : 'Your full 12-digit Aadhaar number is NEVER stored in any database or exposed publicly.'}
                </li>
                <li>
                  <strong>{isKannada ? 'ಕೇವಲ ಮಾಸ್ಕ್ ಮಾಡಿದ ಟೋಕನ್:' : 'Masked Token Only:'}</strong>{' '}
                  {isKannada
                    ? 'ಕೇವಲ ಸುರಕ್ಷಿತ ಮಾಸ್ಕ್ ಸಂಖ್ಯೆ (XXXX-XXXX-1234) ಮತ್ತು ದೃಢೀಕೃತ ವಿಳಾಸವನ್ನು ಮಾತ್ರ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.'
                    : 'Only masked format (XXXX-XXXX-1234) and village eligibility are validated.'}
                </li>
                <li>
                  <strong>{isKannada ? 'ಸ್ವಯಂಪ್ರೇರಿತ ಪ್ರಕ್ರಿಯೆ:' : '100% Voluntary:'}</strong>{' '}
                  {isKannada
                    ? 'ಈ ದೃಢೀಕರಣವು ಸಂಪೂರ್ಣ ಸ್ವಯಂಪ್ರೇರಿತವಾಗಿದ್ದು, ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಅಧಿಕೃತ ನಿವಾಸಿ ಪಟ್ಟಿಯಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳಲು ಮಾತ್ರ ಬಳಕೆಯಾಗುತ್ತದೆ.'
                    : 'Verification is 100% voluntary to be recognized as an authentic resident of Muttagondi village.'}
                </li>
              </ul>
            </div>

            {/* Checkbox Agreement */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: consentAgreed ? '1px solid #10B981' : '1px solid var(--glass-border)',
                marginBottom: '24px'
              }}
            >
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  accentColor: '#10B981',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--text-primary)' }}>
                {isKannada
                  ? 'ನಾನು ಸ್ವಯಂಪ್ರೇರಿತವಾಗಿ ನನ್ನ ಆಧಾರ್ ನಿವಾಸ ವಿಳಾಸವನ್ನು ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಲು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ (ಆಧಾರ್ ಕಾಯ್ದೆ 2016 ರ ಪ್ರಕಾರ).'
                  : 'I voluntarily consent to authenticate my residence details for the Muttagondi People directory under the provisions of the Aadhaar Act, 2016.'}
              </span>
            </label>

            <button
              onClick={() => {
                if (!consentAgreed) {
                  setErrorMsg(
                    isKannada
                      ? 'ದಯವಿಟ್ಟು ಮುಂದುವರಿಯಲು ಮೇಲಿನ ಒಪ್ಪಿಗೆ ಚೆಕ್‌ಬಾಕ್ಸ್ ಆಯ್ಕೆಮಾಡಿ.'
                      : 'Please check the consent agreement to proceed.'
                  );
                  return;
                }
                setErrorMsg(null);
                setStep(2);
              }}
              disabled={!consentAgreed}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                opacity: consentAgreed ? 1 : 0.5,
                cursor: consentAgreed ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{isKannada ? 'ಮುಂದಿನ ಹಂತ: ಆಧಾರ್ ಪರಿಶೀಲನೆ' : 'Continue to Aadhaar Check'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: MASKED AADHAAR & SECURE OTP VERIFICATION */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                {isKannada
                  ? 'ಆಧಾರ್ ಸಂಖ್ಯೆಯ ಕೊನೆಯ 4 ಅಂಕಿಗಳು (Last 4 Digits Only)'
                  : 'Aadhaar Number (Last 4 Digits Only)'}
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '0.95rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                  XXXX - XXXX -
                </span>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={last4Digits}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setLast4Digits(clean);
                  }}
                  style={{
                    width: '70px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--accent-emerald)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '2px'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {isKannada
                  ? '🔒 ಕೇವಲ ಕೊನೆಯ 4 ಅಂಕಿಗಳು ಅಗತ್ಯವಿದೆ. ಸಂಪೂರ್ಣ 12 ಅಂಕಿಗಳನ್ನು ಎಂದಿಗೂ ನಮೂದಿಸಬೇಡಿ.'
                  : '🔒 Enter only the last 4 digits. Full 12 digits are never requested.'}
              </span>
            </div>

            {/* OTP Section */}
            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <KeyRound size={16} />
                <span>{isKannada ? 'OTP ಪಡೆಯಿರಿ (Send OTP)' : 'Send Verification OTP'}</span>
              </button>
            ) : (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10B981' }}>
                    {isKannada ? '✓ 6-ಅಂಕಿಯ OTP ಕಳುಹಿಸಲಾಗಿದೆ' : '✓ 6-Digit OTP Sent'}
                  </span>
                  <button
                    onClick={handleSendOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {isKannada ? 'ಮರುಕಳುಹಿಸಿ' : 'Resend'}
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="577533"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '1.2rem',
                    letterSpacing: '6px',
                    textAlign: 'center',
                    fontWeight: 700
                  }}
                />

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  {isKannada
                    ? 'ಡೆಮೊ/ಸ್ಯಾಂಡ್‌ಬಾಕ್ಸ್ ಮೋಡ್: 577533 ಕೋಡ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.'
                    : 'Authorized Sandbox Mode: 577533 pre-filled for instant verification.'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                {isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}
              </button>
              <button
                onClick={() => {
                  if (!last4Digits || last4Digits.length !== 4) {
                    setErrorMsg(
                      isKannada
                        ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆಧಾರ್ ಕೊನೆಯ 4 ಅಂಕಿಗಳನ್ನು ನಮೂದಿಸಿ.'
                        : 'Please enter the last 4 digits.'
                    );
                    return;
                  }
                  if (!otp || otp.length !== 6) {
                    setErrorMsg(
                      isKannada
                        ? 'ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ OTP ನಮೂದಿಸಿ.'
                        : 'Please enter the 6-digit OTP.'
                    );
                    return;
                  }
                  setErrorMsg(null);
                  setStep(3);
                }}
                disabled={!otp || otp.length !== 6}
                className="btn-primary"
                style={{
                  flex: 2,
                  padding: '10px',
                  opacity: otp && otp.length === 6 ? 1 : 0.5,
                  cursor: otp && otp.length === 6 ? 'pointer' : 'not-allowed'
                }}
              >
                {isKannada ? 'ವಿಳಾಸ ದೃಢೀಕರಣಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ' : 'Confirm Village Address'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: VILLAGE ADDRESS & WARD SELECTION */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '18px'
              }}
            >
              <h4 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isKannada ? 'ಪರಿಶೀಲಿಸಿದ ಆಧಾರ್ ಅಧಿಕೃತ ವಿಳಾಸ:' : 'Verified Official Address:'}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{isKannada ? 'ಗ್ರಾಮ:' : 'Village:'}</span>{' '}
                  <strong style={{ color: '#10B981' }}>Muttagundi (ಮುತ್ತಾಗೊಂದಿ)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{isKannada ? 'ತಾಲೂಕು:' : 'Taluk:'}</span>{' '}
                  <strong>Hosadurga (ಹೊಸದುರ್ಗ)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{isKannada ? 'ಜಿಲ್ಲೆ:' : 'District:'}</span>{' '}
                  <strong>Chitradurga (ಚಿತ್ರದುರ್ಗ)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{isKannada ? 'ಪಿನ್‌ಕೋಡ್:' : 'PIN:'}</span>{' '}
                  <strong>577533</strong>
                </div>
              </div>
            </div>

            {/* Village Ward / Street Picker */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {isKannada ? 'ನಿಮ್ಮ ಗ್ರಾಮದ ಬೀದಿ / ವಾರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ:' : 'Select Your Village Street / Ward:'}
              </label>

              <select
                value={selectedWard.id}
                onChange={(e) => {
                  const found = VILLAGE_WARDS.find((w) => w.id === e.target.value);
                  if (found) setSelectedWard(found);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                {VILLAGE_WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {isKannada ? w.kn : w.en}
                  </option>
                ))}
              </select>

              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder={
                    isKannada
                      ? 'ಅಥವಾ ಬೇರೆ ಬೀದಿ/ಮನೆ ಹೆಸರು ಬರೆಯಿರಿ (ಐಚ್ಛಿಕ)...'
                      : 'Or enter custom street/locality name (optional)...'
                  }
                  value={customWard}
                  onChange={(e) => setCustomWard(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                {isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}
              </button>
              <button
                onClick={handleVerifyResidence}
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  flex: 2,
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting ? (
                  <span>{isKannada ? 'ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'Verifying...'}</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>{isKannada ? 'ದೃಢೀಕರಿಸಿ ಸೇರ್ಪಡೆಗೊಳ್ಳಿ' : 'Complete Verification'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: CELEBRATORY OFFICIAL RESIDENT CERTIFICATE */}
        {/* ========================================================================= */}
        {step === 4 && verificationCertificate && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Award size={36} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isKannada ? 'ಅಭಿನಂದನೆಗಳು! ನಿವಾಸ ದೃಢೀಕರಣ ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Congratulations! Residence Verified'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isKannada
                ? 'ನೀವು ಅಧಿಕೃತವಾಗಿ ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ನಿವಾಸಿ ಎಂದು ದೃಢಪಟ್ಟಿದ್ದು, "ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿಗಳು" ಡೈರೆಕ್ಟರಿಗೆ ಸೇರ್ಪಡೆಗೊಂಡಿದ್ದೀರಿ.'
                : 'You have been officially authenticated as an authentic Muttagondi village resident and added to the Muttagondi People directory.'}
            </p>

            {/* Digital Residence Seal Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '16px',
                padding: '18px',
                textAlign: 'left',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                  ✓ OFFICIAL DIGITAL RESIDENCE SEAL
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>
                    {isKannada ? 'ಹೆಸರು' : 'Resident Name'}
                  </span>
                  <strong>{currentUser?.name}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>
                    {isKannada ? 'ಬೀದಿ / ವಾರ್ಡ್' : 'Ward / Street'}
                  </span>
                  <strong>{isKannada ? verificationCertificate.ward_or_street_kn : verificationCertificate.ward_or_street}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>
                    {isKannada ? 'ಗ್ರಾಮ / ತಾಲೂಕು' : 'Village / Taluk'}
                  </span>
                  <strong>Muttagundi, Hosadurga</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>
                    {isKannada ? 'ದೃಢೀಕರಣ ಕೋಡ್' : 'Verification Token'}
                  </span>
                  <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 700 }}>
                    {verificationCertificate.verification_token}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
            >
              {isKannada ? 'ಡೈರೆಕ್ಟರಿ ವೀಕ್ಷಿಸಿ' : 'View Muttagondi People Directory'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
