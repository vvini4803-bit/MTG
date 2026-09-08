import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { SEED_USERS } from '../services/seedData';
import { dbService } from '../services/dbService';

import { realtimeSync } from '../services/realtimeSync';

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
  registerUser: (data: Partial<UserProfile> & { name: string; phone?: string }) => Promise<UserProfile>;
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
  registerUser: async () => ({} as UserProfile),
  logout: () => {},
  updateProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start as saved active user or null (guest) so visitors can register their own unique profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gramasiri_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gramasiri_active_user', JSON.stringify(currentUser));
      dbService.registerOrUpdateUser(currentUser);
      realtimeSync.setCurrentUser(currentUser.uid);
    } else {
      localStorage.removeItem('gramasiri_active_user');
      realtimeSync.setCurrentUser(null);
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

  const registerUser = async (data: Partial<UserProfile> & { name: string; phone?: string }): Promise<UserProfile> => {
    const newProfile: UserProfile = {
      uid: data.uid || ('usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      name: data.name.trim(),
      name_kn: data.name_kn?.trim(),
      phone: data.phone || '',
      email: data.email || '',
      role: data.role || 'USER',
      language: data.language || 'kn',
      photoUrl: data.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
      bio: data.bio || 'Resident of Muttagundi Village',
      bio_kn: data.bio_kn || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ನಿವಾಸಿ',
      account_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_phone_verified: !!data.phone,
      community_category: data.community_category || 'RESIDENT',
      allow_find_me: data.allow_find_me !== false,
      privacy_find: data.privacy_find || 'EVERYONE',
      privacy_message: data.privacy_message || 'EVERYONE'
    };
    setCurrentUser(newProfile);
    return newProfile;
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) {
      if (data.name) {
        await registerUser(data as any);
      }
      return;
    }
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
        registerUser,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
