import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { SEED_USERS, isSuperAdminEmail } from '../services/seedData';
import { realtimeSync } from '../services/realtimeSync';
import { auth, db, googleProvider } from '../services/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export { isSuperAdminEmail };

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
  signInWithGoogle: () => Promise<AuthResult>;
  sendPhoneOtp: (phone: string, containerId?: string) => Promise<AuthResult>;
  verifyPhoneOtp: (otp: string) => Promise<AuthResult>;
  loginWithPhoneDirect?: (phone: string) => Promise<AuthResult>;
  confirmationResult: ConfirmationResult | null;
  loginWithEmail: (email: string, password?: string) => Promise<boolean>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  loginWithDemo: (role: UserRole) => void;
  registerUser: (data: Partial<UserProfile> & { name: string; phone?: string }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  claimAdminRole: (targetEmail?: string) => Promise<{ success: boolean; message: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
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
  signInWithGoogle: async () => ({ success: false }),
  sendPhoneOtp: async () => ({ success: false }),
  verifyPhoneOtp: async () => ({ success: false }),
  loginWithPhoneDirect: async () => ({ success: false }),
  confirmationResult: null,
  loginWithEmail: async () => false,
  loginWithPhone: async () => false,
  loginWithDemo: () => {},
  registerUser: async () => ({} as UserProfile),
  logout: async () => {},
  updateProfile: async () => {},
  claimAdminRole: async () => ({ success: false, message: '' }),
  sendPasswordReset: async () => ({ success: false, message: '' })
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gramasiri_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && isSuperAdminEmail(parsed.email, parsed.name)) {
          parsed.role = 'SUPER_ADMIN';
          parsed.account_status = 'ACTIVE';
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Sync active user in local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gramasiri_active_user', JSON.stringify(currentUser));
      realtimeSync.setCurrentUser(currentUser.uid);
    } else {
      localStorage.removeItem('gramasiri_active_user');
      realtimeSync.setCurrentUser(null);
    }
  }, [currentUser]);

  // Helper: Synchronize user profile with Firestore users/{uid}
  const syncUserProfileWithFirestore = async (
    firebaseUser: any,
    extraData: Partial<UserProfile> = {}
  ): Promise<UserProfile> => {
    let profile: UserProfile = {
      uid: firebaseUser.uid,
      name:
        extraData.name ||
        firebaseUser.displayName ||
        (firebaseUser.email ? firebaseUser.email.split('@')[0] : '') ||
        (firebaseUser.phoneNumber ? 'Resident ' + firebaseUser.phoneNumber.slice(-4) : 'Resident'),
      name_kn: extraData.name_kn || '',
      email: firebaseUser.email || extraData.email || '',
      phone: firebaseUser.phoneNumber || extraData.phone || '',
      photoUrl: firebaseUser.photoURL || extraData.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
      role: extraData.role || 'USER',
      language: extraData.language || 'kn',
      bio: extraData.bio || 'Resident of Muttagundi Village',
      bio_kn: extraData.bio_kn || 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ನಿವಾಸಿ',
      account_status: 'ACTIVE',
      created_at: firebaseUser.metadata?.creationTime || new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_phone_verified: Boolean(firebaseUser.phoneNumber || extraData.phone),
      community_category: extraData.community_category || 'RESIDENT',
      allow_find_me: extraData.allow_find_me !== false,
      privacy_find: extraData.privacy_find || 'EVERYONE',
      privacy_message: extraData.privacy_message || 'EVERYONE'
    };

    if (db) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const existingData = snap.data() as UserProfile;
          profile = {
            ...profile,
            ...existingData,
            last_login: new Date().toISOString()
          };
          await setDoc(userDocRef, { last_login: profile.last_login }, { merge: true });
        } else {
          await setDoc(userDocRef, profile, { merge: true });
        }
      } catch (dbErr) {
        console.warn('Firestore user profile sync (offline fallback):', dbErr);
      }
    }

    // Guarantee Super Admin role for vvini4803@gmail.com and admin identifiers
    const isDesignatedSuperAdmin =
      isSuperAdminEmail(profile.email, profile.name) ||
      isSuperAdminEmail(firebaseUser.email, firebaseUser.displayName);

    if (isDesignatedSuperAdmin) {
      profile.role = 'SUPER_ADMIN';
      profile.account_status = 'ACTIVE';
      if (db) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userDocRef, { role: 'SUPER_ADMIN', account_status: 'ACTIVE' }, { merge: true });
        } catch (e) {
          console.warn('Firestore super admin role sync fallback:', e);
        }
      }
    }

    return profile;
  };

  // Firebase Authentication State Listener
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfileWithFirestore(firebaseUser);
          setCurrentUser(profile);
          setUnverifiedEmail(null);
        } catch (e) {
          console.warn('User profile sync error:', e);
        }
      } else {
        // Keep demo login intact if active, otherwise clear currentUser
        setCurrentUser((prev) => (prev && prev.uid?.startsWith('usr_') ? prev : null));
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
   * Firebase Authentication: Email & Password Sign In
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

      const profile = await syncUserProfileWithFirestore(user);
      setCurrentUser(profile);
      setUnverifiedEmail(null);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signIn error:', err?.code, err?.message);
      return { success: false, error: 'Email or password is incorrect' };
    }
  };

  /**
   * Firebase Authentication: Email & Password Sign Up
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

      // Attempt sending verification email in background without blocking user login
      sendEmailVerification(user).catch((resendErr) => {
        console.warn('Verification email send notice:', resendErr?.code, resendErr?.message);
      });

      const profile = await syncUserProfileWithFirestore(user);
      setCurrentUser(profile);
      setUnverifiedEmail(null);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signUp error:', err?.code, err?.message);
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
   * Firebase Authentication: Google Sign-In (Popup)
   */
  const signInWithGoogle = async (): Promise<AuthResult> => {
    if (!auth) {
      return { success: false, error: 'Firebase Authentication is not available.' };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile = await syncUserProfileWithFirestore(user);
      setCurrentUser(profile);
      setUnverifiedEmail(null);
      return { success: true };
    } catch (err: any) {
      console.warn('Google sign-in error:', err?.code, err?.message);
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Google sign-in was cancelled.' };
      }
      if (err?.code === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: 'Domain not authorized. Please authorize localhost and your domain in Firebase Console > Authentication > Settings > Authorized domains.'
        };
      }
      return { success: false, error: err?.message || 'Google sign-in failed.' };
    }
  };

  /**
   * Firebase Authentication: Phone SMS OTP Request
   */
  const sendPhoneOtp = async (phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<AuthResult> => {
    if (!auth) {
      return { success: false, error: 'Firebase Authentication is not available.' };
    }

    let cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+91' + cleanPhone.replace(/^0+/, '');
    }

    if (cleanPhone.length < 12) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number' };
    }

    try {
      // Clear previous verifier instance if any
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
      }

      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, please try again.');
        }
      });

      (window as any).recaptchaVerifier = verifier;

      const confirmation = await signInWithPhoneNumber(auth, cleanPhone, verifier);
      setConfirmationResult(confirmation);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase sendPhoneOtp error:', err?.code, err?.message);
      if (err?.code === 'auth/billing-not-enabled') {
        return {
          success: false,
          error: 'Firebase requires Billing (Blaze Plan) to send real SMS. To test for FREE without billing: Add your number (+91 ' + cleanPhone.slice(-10) + ') under "Phone numbers for testing" in Firebase Console > Authentication > Sign-in method > Phone (with code 123456).'
        };
      }
      if (err?.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'Phone authentication or SMS for this region is not enabled in Firebase Console. Go to Firebase Console > Authentication > Settings > SMS Region Policy and enable India (+91), or add your number under "Phone numbers for testing".'
        };
      }
      if (err?.code === 'auth/invalid-phone-number') {
        return { success: false, error: 'Invalid phone number format.' };
      }
      if (err?.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many SMS requests. Please wait a few moments or try another method.' };
      }
      return { success: false, error: err?.message || 'Failed to send OTP SMS. Check phone auth settings in Firebase Console.' };
    }
  };

  /**
   * Firebase Authentication: Phone SMS OTP Verification
   */
  const verifyPhoneOtp = async (otp: string): Promise<AuthResult> => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      return { success: false, error: 'Enter a valid 6-digit OTP code' };
    }

    if (!confirmationResult) {
      return { success: false, error: 'No active OTP request. Please request OTP first.' };
    }

    try {
      const credential = await confirmationResult.confirm(cleanOtp);
      const user = credential.user;
      const profile = await syncUserProfileWithFirestore(user);
      setCurrentUser(profile);
      setConfirmationResult(null);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase verifyPhoneOtp error:', err?.code, err?.message);
      if (err?.code === 'auth/invalid-verification-code') {
        return { success: false, error: 'Invalid OTP code. Please check and re-enter.' };
      }
      if (err?.code === 'auth/code-expired') {
        return { success: false, error: 'OTP code expired. Please request a new OTP.' };
      }
      return { success: false, error: err?.message || 'OTP verification failed.' };
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
    setConfirmationResult(null);
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

  const loginWithPhoneDirect = async (phone: string): Promise<AuthResult> => {
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const uid = 'phone_' + cleanDigits;
    const profile: UserProfile = {
      uid,
      name: 'Resident (+91 ' + cleanDigits + ')',
      name_kn: 'ಗ್ರಾಮ ನಿವಾಸಿ (+91 ' + cleanDigits + ')',
      phone: '+91' + cleanDigits,
      email: '',
      role: 'USER',
      language: 'kn',
      photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanDigits}`,
      bio: 'Resident of Muttagundi Village',
      bio_kn: 'ಮುತ್ತಗುಂಡಿ ಗ್ರಾಮದ ನಿವಾಸಿ',
      account_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_phone_verified: true,
      community_category: 'RESIDENT',
      allow_find_me: true
    };
    if (db) {
      try {
        await setDoc(doc(db, 'users', uid), profile, { merge: true });
      } catch (e) {}
    }
    setCurrentUser(profile);
    return { success: true };
  };

  const loginWithDemo = (demoRole: UserRole) => {
    if (demoRole === 'SUPER_ADMIN' && currentUser && !isSuperAdminEmail(currentUser.email, currentUser.name)) {
      console.warn('Unauthorized attempt to elevate to SUPER_ADMIN');
      return;
    }
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

    if (db && newProfile.uid) {
      try {
        await setDoc(doc(db, 'users', newProfile.uid), newProfile, { merge: true });
      } catch (e) {
        console.warn('Firestore user save fallback:', e);
      }
    }

    setCurrentUser(newProfile);
    return newProfile;
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);

    if (db && currentUser.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
      } catch (e) {
        console.warn('Firestore profile update fallback:', e);
      }
    }
  };

  const claimAdminRole = async (targetEmail?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please sign in with your authorized admin account (vvini@gmail.com) first.'
      };
    }

    if (!isSuperAdminEmail(currentUser.email, currentUser.name)) {
      return {
        success: false,
        message: 'Access Denied: Only vvini@gmail.com / vvini4803@gmail.com can claim the Super Admin role.'
      };
    }

    const updated: UserProfile = {
      ...currentUser,
      role: 'SUPER_ADMIN',
      account_status: 'ACTIVE',
      last_login: new Date().toISOString()
    };

    setCurrentUser(updated);
    localStorage.setItem('gramasiri_active_user', JSON.stringify(updated));

    // Persist to Firestore
    if (db && currentUser.uid) {
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            role: 'SUPER_ADMIN',
            email: updated.email,
            account_status: 'ACTIVE',
            last_login: updated.last_login
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore claimAdminRole fallback:', e);
      }
    }

    return {
      success: true,
      message: 'Super Admin role successfully claimed and activated!'
    };
  };

  const sendPasswordReset = async (targetEmail: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your email address' };
    }
    if (!auth) {
      return { success: false, message: 'Authentication service unavailable' };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset link sent to ${cleanEmail}! Please check your Inbox and Spam folder.`
      };
    } catch (err: any) {
      console.warn('sendPasswordReset error:', err);
      let msg = err.message || 'Failed to send password reset email';
      if (err.code === 'auth/user-not-found') {
        msg = 'No user registered with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      return { success: false, message: msg };
    }
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
        signInWithGoogle,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginWithPhoneDirect,
        confirmationResult,
        loginWithEmail,
        loginWithPhone,
        loginWithDemo,
        registerUser,
        logout,
        updateProfile,
        claimAdminRole,
        sendPasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

