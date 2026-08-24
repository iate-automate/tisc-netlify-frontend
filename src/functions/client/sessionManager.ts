/**
 * Session Manager - Simple session management using Firebase Auth
 */
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/client';

let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Refresh the session cookie by getting a new ID token from Firebase
 */
async function refreshSession(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // Get fresh ID token
    const idToken = await user.getIdToken(true); // Force refresh

    // Update session cookie
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken }),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
}

/**
 * Start automatic session refresh
 */
function startSessionRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  // Refresh every 60 minutes (Firebase tokens last 1 hour)
  refreshTimer = setInterval(async () => {
    const success = await refreshSession();
    if (!success) {
      stopSessionRefresh();
    }
  }, 60 * 60 * 1000);
}

/**
 * Stop automatic session refresh
 */
function stopSessionRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Initialize session management
 */
export function initSessionManager(): void {
  // Listen for Firebase Auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      startSessionRefresh();
    } else {
      stopSessionRefresh();
    }
  });
}