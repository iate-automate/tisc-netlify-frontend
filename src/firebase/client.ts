// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { settings } from '@/config/settings.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: settings.firebase.publicApiKey,
  authDomain: "tisuk-web.firebaseapp.com",
  projectId: "tisuk-web",
  storageBucket: "tisuk-web.appspot.com",
  messagingSenderId: "288036585166",
  appId: "1:288036585166:web:86ac9afdedc5d8fdfc1a9f"
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth = getAuth(app);
