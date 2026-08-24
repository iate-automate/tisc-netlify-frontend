import type { APIRoute } from 'astro';
import { adminAuth } from '@/firebase/server';
import { updateUserWithFirebaseUid, validatePortalActivationKey } from '@/functions/server/airtable/users.js';
import { parseRequestBody } from '@/functions/server/core/responses.js';
import { handleApiError } from '@/functions/server/core/errors.js';
import { AuthValidator } from '@/functions/server/core/validation.js';
import { logAuthEvent, logRequest, logResponse, PerformanceTimer } from '@/functions/server/core/logger.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  const timer = new PerformanceTimer('Register API');
  
  try {
    // Parse and validate request
    const body = await parseRequestBody(request);
    
    
    const validation = AuthValidator.validateActivation(body);
    
    if (!validation.isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.errors.join(', '),
        details: { validationErrors: validation.errors }
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email, password, portalActivationKey, activationKey, recordId } = body;
    // Support both new and legacy field names
    const key = portalActivationKey || activationKey || recordId;
    logRequest('POST', '/api/auth/register', { email, portalActivationKey: key });

    // Validate the portal activation key first
    const validationResult = await validatePortalActivationKey(key);
    
    if (!validationResult.success) {
      logAuthEvent('Registration blocked - invalid activation key', undefined, { email, key, error: validationResult.error });
      const response = new Response(JSON.stringify({
        success: false,
        error: validationResult.error || 'Invalid portal activation key'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
      // Clear any existing session cookie to avoid stale sessions
      const isDev = process.env.NODE_ENV === 'development';
      const cookieName = isDev ? '__tisuk_session_dev' : '__tisuk_session';
      const secureFlag = isDev ? '' : 'Secure; ';
      response.headers.append('Set-Cookie', `${cookieName}=; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=0`);
      return response;
    }

    // Create Firebase user with displayName set to the Airtable record ID using Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: key // Set displayName to the Airtable record ID
    });

    // Generate a custom token for the user. Client will sign in with this to get an ID token.
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    // Register user in Airtable
    const airtableResult = await updateUserWithFirebaseUid(key, userRecord.uid);

    if (!airtableResult.success) {
      throw new Error(airtableResult.error || 'Failed to update user in Airtable');
    }

    // Log successful activation
    logAuthEvent('Account activation successful', userRecord.uid, { email });
    logResponse('POST', '/api/auth/register', 200, timer.end());

    // Return success with custom token; client will sign in and call /api/auth/verify to mint session cookie
    const response = new Response(JSON.stringify({
      success: true,
      message: 'Account activated successfully',
      redirect: '/resources',
      customToken
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Clear any previous session cookie to ensure a clean sign-in next
    const isDev = process.env.NODE_ENV === 'development';
    const cookieName = isDev ? '__tisuk_session_dev' : '__tisuk_session';
    const secureFlag = isDev ? '' : 'Secure; ';
    response.headers.set('Set-Cookie', `${cookieName}=; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=0`);

    return response;

  } catch (error: any) {
    logAuthEvent('Account activation failed', undefined, { error: error.message });
    logResponse('POST', '/api/auth/register', error.statusCode || 500, timer.end());
    return handleApiError(error);
  }
};
