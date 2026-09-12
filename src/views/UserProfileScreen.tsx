import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
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
  MessageSquare
} from 'lucide-react';

interface UserProfileScreenProps {
  onOpenLogin: () => void;
  onOpenCreateProfile: () => void;
  onNavigateToPeople?: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToAdmin?: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  onOpenLogin,
  onOpenCreateProfile,
  onNavigateToPeople,
  onNavigateToMessages,
  onNavigateToAdmin
}) => {
  const { isKannada } = useLanguage();
  const { currentUser, logout, role, loginWithDemo, claimAdminRole, isAdmin, isModerator } = useAuth();
  const [hideContact, setHideContact] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimNotice, setClaimNotice] = useState('');

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
          <button onClick={onOpenLogin} className="btn-primary" style={{ width: '100%', height: '48px', marginBottom: '12px' }}>
            {isKannada ? 'ಲಾಗಿನ್ / ಸೈನ್ ಅಪ್' : 'Sign In / Register'}
          </button>
          <button
            onClick={() => claimAdminRole('vvini4803@gmail.com')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid #F59E0B',
              color: '#FBBF24',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>👑</span>
            <span>{isKannada ? 'vvini4803@gmail.com ಅಡ್ಮಿನ್ ಲಾಗಿನ್' : 'Login as Super Admin (vvini4803@gmail.com)'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '640px' }}>
      <div className="glass-card" style={{ padding: '32px 24px', position: 'relative' }}>
        {/* Header Avatar & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {currentUser.photoUrl ? (
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--accent-emerald)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
              }}
            />
          ) : (
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontSize: '2rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {currentUser.name.charAt(0)}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                {isKannada && currentUser.name_kn ? currentUser.name_kn : currentUser.name}
              </h2>
              <span className="badge badge-verified" style={{ fontSize: '0.65rem' }}>
                {currentUser.account_status}
              </span>
            </div>

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
                fontWeight: 700,
                marginBottom: '6px'
              }}
            >
              <Shield size={12} />
              ROLE: {role.replace('_', ' ')}
            </span>

            {currentUser.bio && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
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
              <span>Resident member since {currentUser.created_at.split('T')[0]}</span>
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
        {role === 'SUPER_ADMIN' || currentUser.email?.toLowerCase().includes('vvini4803') ? (
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
                    vvini4803@gmail.com • {isKannada ? 'ಸಂಪೂರ್ಣ ಗ್ರಾಮ ಆಡಳಿತ ಹಕ್ಕುಗಳು ಸಕ್ರಿಯ' : 'Full Village Governance & RBAC Access'}
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
                {isKannada ? 'vvini4803@gmail.com ಅಡ್ಮಿನ್ ಪಾತ್ರ ಪಡೆಯಿರಿ' : 'Claim Super Admin Role (vvini4803@gmail.com)'}
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
                const res = await claimAdminRole('vvini4803@gmail.com');
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

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onOpenCreateProfile} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Edit size={16} />
            <span>Edit Profile</span>
          </button>

          <button onClick={logout} className="btn-danger" style={{ fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span>{isKannada ? 'ಲಾಗ್ ಔಟ್' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
