import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { isSuperAdminEmail } from '../services/seedData';
import { UserProfile, UserRole } from '../types';
import { Users, Search, Shield, Ban, CheckCircle2, ArrowLeft, UserPlus, Sparkles } from 'lucide-react';

interface UserManagementScreenProps {
  onBack: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const { currentUser, role: myRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Quick Role Assign by Email State
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('MODERATOR');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    return dbService.subscribeUsers(setUsers);
  }, []);

  const handleRoleChange = async (uid: string, targetName: string, selectedRole: UserRole) => {
    await dbService.updateUserRole(uid, selectedRole);
    setFeedback(`Role for ${targetName} successfully updated to ${selectedRole}! Synced to Firestore.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatusChange = async (uid: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED') => {
    await dbService.updateUserStatus(uid, status);
  };

  const handleQuickAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setAssigning(true);
    const res = await dbService.assignRoleByEmail(newEmail, newRole, newName);
    setAssigning(false);
    if (res.success) {
      setFeedback(res.message);
      setNewEmail('');
      setNewName('');
      setShowAssignForm(false);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.name_kn && u.name_kn.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1040px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent-emerald)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          marginBottom: '16px'
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Admin Hub</span>
      </button>

      {feedback && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10B981',
            color: '#34D399',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>👑</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
              {isKannada ? 'ನಾಗರಿಕರು & ಪಾತ್ರಗಳ ನಿಯಂತ್ರಣ (RBAC)' : 'Resident & RBAC Role Management'}
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Super Admin Controller: Promote, demote, or assign roles for all village users
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="btn-primary"
            style={{
              padding: '10px 16px',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} />
            <span>{showAssignForm ? 'Close Form' : (isKannada ? '➕ ಹೊಸಬರಿಗೆ ರೋಲ್ ನೀಡಿ' : '➕ Assign Role by Email')}</span>
          </button>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email..."
              style={{ paddingLeft: '38px', height: '42px' }}
            />
          </div>
        </div>
      </div>

      {/* Quick Pre-assign Role by Email Panel */}
      {showAssignForm && (
        <form
          onSubmit={handleQuickAssign}
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={18} color="#FBBF24" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FBBF24' }}>
              {isKannada ? 'ಯಾವುದೇ ಇಮೇಲ್‌ಗೆ ರೋಲ್ ನಿಗದಿಪಡಿಸಿ' : 'Pre-Assign Role to Any Resident Email'}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Resident Gmail / Email *
              </label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="e.g. user@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Full Name (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh Gowda"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Assign Role (RBAC) *
              </label>
              <select
                className="form-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                style={{ height: '40px' }}
              >
                <option value="SUPER_ADMIN">👑 SUPER_ADMIN (Full Control)</option>
                <option value="ADMIN">🛡️ ADMIN (Panchayat Admin)</option>
                <option value="MODERATOR">⚖️ MODERATOR (News & Content)</option>
                <option value="SPORTS_ORGANIZER">🏆 SPORTS_ORGANIZER (Tournaments)</option>
                <option value="EVENT_ORGANIZER">📅 EVENT_ORGANIZER (Festivals)</option>
                <option value="VERIFIED_CONTRIBUTOR">⭐ VERIFIED_CONTRIBUTOR</option>
                <option value="USER">👤 USER (Regular Resident)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowAssignForm(false)}
              className="btn-secondary"
              style={{ fontSize: '0.82rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 20px' }}
            >
              {assigning ? 'Assigning...' : 'Assign Role & Save'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Citizen / Resident</th>
              <th style={{ padding: '14px 16px' }}>Role (RBAC)</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Contact</th>
              <th style={{ padding: '14px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isRoot = isSuperAdminEmail(u.email, u.name) || u.uid === 'admin_vvini4803';
              return (
                <tr
                  key={u.uid}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isRoot ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isRoot ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                          color: isRoot ? '#FBBF24' : '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800
                        }}
                      >
                        {isRoot ? '👑' : u.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{u.name}</strong>
                          {isRoot && (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                background: '#F59E0B',
                                color: '#000000',
                                fontWeight: 900,
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              ROOT OWNER
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ID: {u.uid.slice(0, 14)}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <select
                      className="form-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, u.name, e.target.value as UserRole)}
                      style={{ height: '34px', fontSize: '0.78rem', padding: '4px 8px', width: 'auto' }}
                    >
                      <option value="USER">USER (Resident)</option>
                      <option value="VERIFIED_CONTRIBUTOR">VERIFIED_CONTRIBUTOR</option>
                      <option value="SPORTS_ORGANIZER">SPORTS_ORGANIZER</option>
                      <option value="EVENT_ORGANIZER">EVENT_ORGANIZER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">👑 SUPER_ADMIN</option>
                    </select>
                  </td>

                <td style={{ padding: '14px 16px' }}>
                  <span className={u.account_status === 'ACTIVE' ? 'badge badge-verified' : 'badge badge-rejected'}>
                    {u.account_status}
                  </span>
                </td>

                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                  <div>{u.phone || 'No phone'}</div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email || 'No email'}</span>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  {u.account_status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleStatusChange(u.uid, 'SUSPENDED')}
                      style={{
                        background: 'none',
                        border: '1px solid #EF4444',
                        color: '#EF4444',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(u.uid, 'ACTIVE')}
                      style={{
                        background: 'none',
                        border: '1px solid #10B981',
                        color: '#10B981',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
