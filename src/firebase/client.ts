// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { settings } from '@/config/settings.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: settings.firebase.publicApiKey,
  authDomain: settings.firebase.authDomain,
  projectId: settings.firebase.projectId,
  storageBucket: settings.firebase.storageBucket.replace(/^gs:\/\//, ''),
  messagingSenderId: settings.firebase.messagingSenderId,
  appId: settings.firebase.appId
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth = getAuth(app);
