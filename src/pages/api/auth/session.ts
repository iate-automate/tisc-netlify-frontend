import type { APIRoute } from 'astro';
import { createSessionCookie, verifySessionCookie } from '@/functions/server/firebase/auth.ts';
import { verifyUser } from '@/functions/server/firebase/api-auth';

function getSessionCookieName(url?: string): string {
  // Use project-specific cookie names
  if (!url || !url.includes('localhost:4321')) {
    return '__tisuk_session';
  }
  return '__tisuk_session_dev';
}

// Refresh session (POST) - only used by SessionManager for token refresh
export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Just verify the token is valid, don't create new cookies
    // The sessionManager only needs to know if the token refresh worked
    await createSessionCookie(token); // This validates the token
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Session refreshed successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Session refresh error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to refresh session' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Verify session (GET)
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Verify user authentication
    const auth = await verifyUser(request, cookies);
    if (!auth.success) {
      return auth.response!;
    }

    const authData = auth.authData!;
    
    return new Response(JSON.stringify({ 
      success: true, 
      user: authData.user,
      userData: authData.userData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to verify session' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
