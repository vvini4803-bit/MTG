import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { SEED_USERS } from '../services/seedData';
import { realtimeSync } from '../services/realtimeSync';
import { auth } from '../services/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

export interface AuthResult {
  success: boolean;
  unverifiedEmail?: string;
  error?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole;
  isAdmin: boolean;
  isModerator: boolean;
  isSportsOrganizer: boolean;
  isEventOrganizer: boolean;
  hasRole: (requiredRole: UserRole) => boolean;
  unverifiedEmail: string | null;
  setUnverifiedEmail: (email: string | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  loginWithEmail: (email: string, password?: string) => Promise<boolean>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  loginWithDemo: (role: UserRole) => void;
  registerUser: (data: Partial<UserProfile> & { name: string; phone?: string }) => Promise<UserProfile>;
  logout: () => Promise<void>;
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
  unverifiedEmail: null,
  setUnverifiedEmail: () => {},
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  loginWithEmail: async () => false,
  loginWithPhone: async () => false,
  loginWithDemo: () => {},
  registerUser: async () => ({} as UserProfile),
  logout: async () => {},
  updateProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Sync active user in local storage (No Firestore database calls)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gramasiri_active_user', JSON.stringify(currentUser));
      realtimeSync.setCurrentUser(currentUser.uid);
    } else {
      localStorage.removeItem('gramasiri_active_user');
      realtimeSync.setCurrentUser(null);
    }
  }, [currentUser]);

  // Firebase Authentication State Listener
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.emailVerified) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Resident'),
            email: firebaseUser.email || '',
            role: 'USER',
            language: 'en',
            account_status: 'ACTIVE',
            created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
            last_login: new Date().toISOString(),
            is_phone_verified: false
          };
          setCurrentUser(profile);
          setUnverifiedEmail(null);
        } else {
          // If email is not verified, do NOT keep user signed in
          signOut(auth).catch(() => {});
          setCurrentUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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

  /**
   * Firebase Authentication Sign In
   * Requirements:
   * - If credentials are incorrect, show: "Email or password is incorrect"
   * - If user logs in and their email is not verified, block access and show verification screen
   */
  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email or password is incorrect' };
    }

    if (!auth) {
      return { success: false, error: 'Firebase Authentication is not available.' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Check Email Verification
      if (!user.emailVerified) {
        // Send verification email
        try {
          await sendEmailVerification(user);
        } catch (resendErr) {
          console.warn('Verification email resend throttled:', resendErr);
        }
        // Block access & sign out
        await signOut(auth);
        setUnverifiedEmail(cleanEmail);
        return { success: false, unverifiedEmail: cleanEmail };
      }

      // Verified: Authenticate user in memory only (no Firestore writes)
      const userProfile: UserProfile = {
        uid: user.uid,
        name: user.displayName || cleanEmail.split('@')[0],
        email: user.email || cleanEmail,
        role: 'USER',
        language: 'en',
        account_status: 'ACTIVE',
        created_at: user.metadata.creationTime || new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_phone_verified: false
      };

      setCurrentUser(userProfile);
      setUnverifiedEmail(null);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signIn error:', err?.code, err?.message);
      // Requirement: "If credentials are incorrect, show: Email or password is incorrect"
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-email'
      ) {
        return { success: false, error: 'Email or password is incorrect' };
      }
      return { success: false, error: 'Email or password is incorrect' };
    }
  };

  /**
   * Firebase Authentication Sign Up
   * Requirements:
   * - Users can sign up using email and password
   * - If the email already exists, show: "User already exists. Please sign in"
   * - When a user registers with email/password, do not sign them in automatically.
   * - Send a verification email and show verification screen
   * - Do NOT save user profile data to Firestore
   */
  const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter valid email and password' };
    }

    if (!auth) {
      return { success: false, error: 'Firebase Authentication is not available.' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Do NOT sign them in automatically
      await signOut(auth);

      setUnverifiedEmail(cleanEmail);
      return { success: false, unverifiedEmail: cleanEmail };
    } catch (err: any) {
      console.warn('Firebase signUp error:', err?.code, err?.message);
      // Requirement: "If the email already exists, show: User already exists. Please sign in"
      if (err?.code === 'auth/email-already-in-use') {
        return { success: false, error: 'User already exists. Please sign in' };
      }
      if (err?.code === 'auth/weak-password') {
        return { success: false, error: 'Password should be at least 6 characters' };
      }
      return { success: false, error: err?.message || 'Registration failed' };
    }
  };

  /**
   * Logout button that signs the user out and returns to the auth screen
   */
  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    setCurrentUser(null);
    setUnverifiedEmail(null);
    localStorage.removeItem('gramasiri_active_user');
  };

  // Backward compatibility methods
  const loginWithEmail = async (email: string, password?: string): Promise<boolean> => {
    if (password) {
      const res = await signInWithEmail(email, password);
      return res.success;
    }
    return false;
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

  const loginWithDemo = (demoRole: UserRole) => {
    const matched = SEED_USERS.find((u) => u.role === demoRole) || SEED_USERS[0];
    setCurrentUser(matched);
  };

  const registerUser = async (data: Partial<UserProfile> & { name: string; phone?: string }): Promise<UserProfile> => {
    const newProfile: UserProfile = {
      uid: data.uid || ('usr_' + Date.now()),
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
        unverifiedEmail,
        setUnverifiedEmail,
        signInWithEmail,
        signUpWithEmail,
        loginWithEmail,
        loginWithPhone,
        loginWithDemo,
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
