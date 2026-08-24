/**
 * Client-side authentication functions
 * These functions use Firebase client SDK and call the API endpoints
 */

import { signInWithEmailAndPassword, signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/firebase/client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ActivationData {
  email: string;
  password: string;
  portalActivationKey: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirect?: string;
  error?: string;
}

export interface UserData {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  organization?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  activationKey?: string;
  recordId: string;
}

/**
 * Login user with email and password using Firebase client SDK
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // Use Firebase client SDK to authenticate
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const idToken = await userCredential.user.getIdToken();

    // Send ID token to server for verification and session creation
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Login failed. Please try again.'
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      message: data.message,
      redirect: data.redirect || '/resources'
    };

  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle Firebase auth errors
    if (error.code && error.code.startsWith('auth/')) {
      const authErrorMessages: Record<string, string> = {
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/user-not-found': 'No account found with this email address',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
        'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection and try again.',
        'auth/invalid-login-credentials': 'Invalid email or password. Please check your credentials and try again.',
        'auth/operation-not-allowed': 'Login is currently disabled. Please contact support.'
      };

      const message = authErrorMessages[error.code] || error.message || 'Login failed. Please try again.';
      return {
        success: false,
        error: message
      };
    }
    
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
}

/**
 * Activate user account with activation key
 */
export async function activateAccount(data: ActivationData): Promise<AuthResponse> {
  try {
    // Create Firebase user and register (validation happens server-side)
    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        portalActivationKey: data.portalActivationKey
      })
    });

    if (!registerResponse.ok) {
      const registerData = await registerResponse.json();
      return {
        success: false,
        error: registerData.error || 'Activation failed. Please try again.'
      };
    }

    const registerResult = await registerResponse.json();

    // If server returned a custom token, sign in with it to obtain an ID token
    if (registerResult.customToken) {
      const cred = await signInWithCustomToken(auth, registerResult.customToken);
      const idToken = await cred.user.getIdToken();

      // Exchange ID token for a session cookie
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        return {
          success: false,
          error: verifyData.error || 'Activation succeeded but sign-in failed. Please sign in.'
        };
      }
    }

    return {
      success: true,
      message: registerResult.message || 'Account activated successfully!',
      redirect: registerResult.redirect || '/resources'
    };

  } catch (error: any) {
    console.error('Activation network error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
}

/**
 * Sign out user using Firebase client SDK
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    console.log('🚪 CLIENT: Starting sign out...');
    
    // Sign out from Firebase client SDK
    await firebaseSignOut(auth);
    
    // Clear server-side session cookie
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'include'
    });

    console.log('🚪 CLIENT: Sign out response received', { status: response.status, ok: response.ok });

    if (!response.ok) {
      console.log('🚪 CLIENT: Server sign out failed, but client sign out succeeded');
      // Still return success since Firebase sign out worked
    }

    const data = await response.json();
    console.log('🚪 CLIENT: Sign out successful', data);

    return {
      success: true,
      message: 'Signed out successfully',
      redirect: data.redirect || '/account/signin'
    };

  } catch (error: any) {
    console.error('🚪 CLIENT: Sign out error', error);
    return {
      success: false,
      error: 'Sign out failed. Please try again.'
    };
  }
}

/**
 * Get current user data
 */
export async function getCurrentUser(): Promise<{ success: boolean; user?: UserData; error?: string }> {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to get user data'
      };
    }

    const userData = await response.json();

    return {
      success: true,
      user: userData
    };

  } catch (error: any) {
    console.error('Get user network error:', error);
    return {
      success: false,
      error: 'Network error getting user data'
    };
  }
}
