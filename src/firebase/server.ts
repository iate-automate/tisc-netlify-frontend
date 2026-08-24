import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { validateEnvironmentOnStartup } from '@/functions/server/firebase/validation.js';
import { settings } from '@/config/settings.js';

// Validate environment variables on startup
validateEnvironmentOnStartup();

// Initialize Firebase Admin if not already initialized
export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert({
        projectId: settings.firebase.projectId,
        clientEmail: settings.firebase.clientEmail,
        privateKey: import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      storageBucket: settings.firebase.storageBucket
    });
  }
  return getApps()[0];
}

// Export initialized auth and storage instances
const app = initializeFirebaseAdmin();
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
