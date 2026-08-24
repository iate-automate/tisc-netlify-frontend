import type { APIRoute } from 'astro';
import { createSessionCookie } from '@/functions/server/firebase/auth.ts';
import { adminAuth } from '@/firebase/server';
import { parseRequestBody } from '@/functions/server/core/responses.ts';
import { handleApiError } from '@/functions/server/core/errors.ts';
import { getUserByRecordId } from '@/functions/server/airtable/users.js';
import { logAuthEvent, logRequest, logResponse, PerformanceTimer } from '@/functions/server/core/logger.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  const timer = new PerformanceTimer('Verify Token API');
  
  try {
    // Parse request body
    const body = await parseRequestBody(request);
    const { idToken } = body;

    if (!idToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID token is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logRequest('POST', '/api/auth/verify', { hasToken: !!idToken });

    // Verify the ID token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user record to access displayName (Airtable record ID)
    const userRecord = await adminAuth.getUser(uid);
    const recordId = userRecord.displayName;
    
    if (!recordId) {
      logAuthEvent('Login blocked - no record ID', uid, { email: userRecord.email });
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Account not properly configured. Please contact support.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch user data from Airtable using centralized function
    const userResult = await getUserByRecordId(recordId);
    
    if (!userResult.success) {
      logAuthEvent('Login blocked - Airtable fetch failed', uid, { email: userRecord.email, error: userResult.error });
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unable to verify account. Please contact support.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userData = userResult.data;
    
    if (!userData?.isActive) {
      logAuthEvent('Login blocked - inactive account', uid, { email: userRecord.email });
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Your account is not active. Please contact support.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);

    // Log successful verification
    logAuthEvent('Token verification successful', uid, { email: userRecord.email });
    logResponse('POST', '/api/auth/verify', 200, timer.end());

    // Return success with session cookie
    const response = new Response(JSON.stringify({
      success: true,
      redirect: '/resources'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    const isDev = process.env.NODE_ENV === 'development';
    const secureFlag = isDev ? '' : 'Secure; ';
    const cookieName = isDev ? '__tisuk_session_dev' : '__tisuk_session';
    response.headers.set('Set-Cookie', `${cookieName}=${sessionCookie}; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 14}`);

    return response;

  } catch (error: any) {
    logAuthEvent('Token verification failed', undefined, { error: error.message, code: error.code });
    logResponse('POST', '/api/auth/verify', error.statusCode || 500, timer.end());
    
    // Handle Firebase Auth errors specifically
    if (error.code && error.code.startsWith('auth/')) {
      const authErrorMessages: Record<string, string> = {
        'auth/invalid-id-token': 'Invalid authentication token. Please sign in again.',
        'auth/id-token-expired': 'Your session has expired. Please sign in again.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/user-not-found': 'Account not found. Please contact support.',
        'auth/invalid-argument': 'Invalid authentication data. Please try again.',
        'auth/network-request-failed': 'Network error. Please check your connection and try again.'
      };

      const message = authErrorMessages[error.code] || error.message || 'Authentication failed. Please try again.';
      
      return new Response(JSON.stringify({
        success: false,
        error: message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return handleApiError(error);
  }
};
