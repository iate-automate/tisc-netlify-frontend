import { adminAuth } from '@/firebase/server';
import { getUserByRecordId } from '@/functions/server/airtable/users.ts';
import { logger, logAuthEvent } from '@/functions/server/core/logger.ts';
import { AppError } from '@/functions/server/core/errors.ts';
import type { UserData } from '@/types/index.js';

// Create session cookie from Firebase ID token
export async function createSessionCookie(idToken: string, expiresIn: number = 60 * 60 * 24 * 14 * 1000): Promise<string> {
  try {
    if (!idToken) {
      throw new Error('ID token is required');
    }
    
    // Firebase session cookies can be up to 2 weeks, but we need to ensure
    // the ID token is fresh. Let's use a more reasonable 7 days for development
    const maxExpiration = 60 * 60 * 24 * 7 * 1000; // 7 days in milliseconds
    const actualExpiration = Math.min(expiresIn, maxExpiration);
    
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: actualExpiration });
    
    if (!sessionCookie) {
      throw new Error('Failed to create session cookie - no cookie returned');
    }
    
    return sessionCookie;
  } catch (error: any) {
    logger.error('Error creating session cookie', { error: error.message, code: error.code });
    
    // Provide more specific error messages
    if (error.code === 'auth/invalid-id-token') {
      throw new AppError('Invalid authentication token', 401);
    } else if (error.code === 'auth/id-token-expired') {
      throw new AppError('Authentication token has expired', 401);
    } else if (error.code === 'auth/user-disabled') {
      throw new AppError('User account has been disabled', 403);
    }
    
    throw new AppError('Failed to create session cookie', 500);
  }
}

// Verify session cookie and get user data
export async function verifySessionCookie(sessionCookie: string): Promise<{ user: any; userData: UserData | null }> {
  try {
    if (!sessionCookie) {
      return { user: null, userData: null };
    }
    
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    if (!decodedClaims || !decodedClaims.uid) {
      return { user: null, userData: null };
    }
    
    // Get user data using the Airtable record ID from displayName (direct lookup)
    if (!decodedClaims.name) {
      logger.error('No record ID found in displayName', { uid: decodedClaims.uid });
      return { user: null, userData: null };
    }
    
    logger.info('Fetching user data from Airtable', { recordId: decodedClaims.name });
    const userData = await getUserByRecordId(decodedClaims.name);
    
    if (!userData.success) {
      console.warn(`User data not found in Airtable for UID: ${decodedClaims.uid}`);
    }
    
    return {
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        emailVerified: decodedClaims.email_verified
      },
      userData: userData.success && userData.data ? userData.data : null
    };
  } catch (error: any) {
    // For expired/invalid session cookies, return null instead of throwing errors
    // This is expected behavior for unauthenticated users
    if (error.code === 'auth/session-cookie-expired' || 
        error.code === 'auth/session-cookie-revoked' || 
        error.code === 'auth/invalid-session-cookie') {
      logger.info('No valid session cookie found. User logged out.');
      return { user: null, userData: null };
    }
    
    // Only throw errors for unexpected issues
    logger.error('Unexpected error verifying session cookie', { code: error.code, message: error.message });
    throw new AppError('Authentication error', 500);
  }
} 
