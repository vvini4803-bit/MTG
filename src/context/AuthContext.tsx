import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { SEED_USERS } from '../services/seedData';
import { dbService } from '../services/dbService';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole;
  isAdmin: boolean;
  isModerator: boolean;
  isSportsOrganizer: boolean;
  isEventOrganizer: boolean;
  hasRole: (requiredRole: UserRole) => boolean;
  loginWithDemo: (role: UserRole) => void;
  loginWithEmail: (email: string) => Promise<boolean>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  role: 'USER',
  isAdmin: false,
  isModerator: false,
  isSportsOrganizer: false,
  isEventOrganizer: false,
  hasRole: () => false,
  loginWithDemo: () => {},
  loginWithEmail: async () => false,
  loginWithPhone: async () => false,
  logout: () => {},
  updateProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Super Admin in dev so user has immediate access to test everything, or stored user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gramasiri_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return SEED_USERS[0]; // Start logged in as Basavaraj Patel (SUPER_ADMIN)
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gramasiri_active_user', JSON.stringify(currentUser));
      dbService.registerOrUpdateUser(currentUser);
    } else {
      localStorage.removeItem('gramasiri_active_user');
    }
  }, [currentUser]);

  const role: UserRole = currentUser ? currentUser.role : 'USER';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isModerator = isAdmin || role === 'MODERATOR';
  const isSportsOrganizer = isAdmin || role === 'SPORTS_ORGANIZER';
  const isEventOrganizer = isAdmin || role === 'EVENT_ORGANIZER';

  const hasRole = (requiredRole: UserRole): boolean => {
    if (role === 'SUPER_ADMIN') return true;
    if (role === 'ADMIN' && requiredRole !== 'SUPER_ADMIN') return true;
    return role === requiredRole;
  };

  const loginWithDemo = (demoRole: UserRole) => {
    const matched = SEED_USERS.find((u) => u.role === demoRole) || SEED_USERS[0];
    setCurrentUser(matched);
  };

  const loginWithEmail = async (email: string): Promise<boolean> => {
    const matched = SEED_USERS.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setCurrentUser(matched);
      return true;
    }
    // Create new standard user
    const newUser: UserProfile = {
      uid: 'user_' + Date.now(),
      name: email.split('@')[0],
      email: email,
      role: 'USER',
      language: 'en',
      account_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_phone_verified: false
    };
    setCurrentUser(newUser);
    return true;
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<boolean> => {
    if (otp !== '123456' && otp.length !== 6) {
      throw new Error('Invalid OTP. For test verification, use 123456');
    }
    const matched = SEED_USERS.find((u) => u.phone && u.phone.includes(phone.slice(-5)));
    if (matched) {
      setCurrentUser(matched);
      return true;
    }
    const newUser: UserProfile = {
      uid: 'user_' + Date.now(),
      name: 'Resident ' + phone.slice(-4),
      phone: phone,
      role: 'USER',
      language: 'kn',
      account_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_phone_verified: true
    };
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        role,
        isAdmin,
        isModerator,
        isSportsOrganizer,
        isEventOrganizer,
        hasRole,
        loginWithDemo,
        loginWithEmail,
        loginWithPhone,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
