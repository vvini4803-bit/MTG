import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { UserProfile, UserRole } from '../types';
import { Users, Search, Shield, Ban, CheckCircle2, ArrowLeft } from 'lucide-react';

interface UserManagementScreenProps {
  onBack: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const { currentUser, role: myRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    return dbService.subscribeUsers(setUsers);
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    await dbService.updateUserRole(uid, newRole);
  };

  const handleStatusChange = async (uid: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED') => {
    await dbService.updateUserStatus(uid, status);
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
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1000px' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Resident & RBAC Role Management</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Super Admin controller for assigning roles, permissions, and managing community access
          </p>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
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
            {filtered.map((u) => (
              <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{u.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ID: {u.uid.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <select
                    className="form-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                    style={{ height: '34px', fontSize: '0.78rem', padding: '4px 8px', width: 'auto' }}
                  >
                    <option value="USER">USER (Resident)</option>
                    <option value="VERIFIED_CONTRIBUTOR">VERIFIED_CONTRIBUTOR</option>
                    <option value="SPORTS_ORGANIZER">SPORTS_ORGANIZER</option>
                    <option value="EVENT_ORGANIZER">EVENT_ORGANIZER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
