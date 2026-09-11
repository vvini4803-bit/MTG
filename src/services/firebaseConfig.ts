import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyClTElD43FmV3MFiBGOvfJrOBv0ofcFzHU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mutthagundi-17.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mutthagundi-17",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mutthagundi-17.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "565999563658",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:565999563658:web:c649413257e69d61950e73"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.length > 5
);

let app: any = null;
let auth: any = null;
// Requirement: "Use Firebase Authentication only", "Do NOT use Firestore or Storage yet"
let db: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    console.info('Connected to live Firebase Authentication:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('Firebase initialization error:', error);
  }
} else {
  console.info('Running in offline auth mode');
}

export { app, auth, db, storage, firebaseConfig };
