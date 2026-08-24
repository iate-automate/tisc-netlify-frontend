// API Authentication Helper
// Centralized authentication logic for API endpoints
import type { APIRoute } from 'astro';
import { verifySessionCookie } from './auth.js';
import { requireActiveUser } from './route-protection.js';
import type { AuthState, ApiAuthResult } from '@/types/index.js';

/**
 * Verify user authentication for API endpoints
 * Handles all the repetitive cookie checking and session verification
 */
export async function verifyUser(request: Request, cookies: any): Promise<ApiAuthResult> {
  try {
    // Check for session cookies (both dev and prod)
    const cookieNames = ['__tisuk_session', '__tisuk_session_dev'];
    let sessionCookie = null;

    for (const cookieName of cookieNames) {
      const cookie = cookies.get(cookieName)?.value;
      if (cookie) {
        sessionCookie = cookie;
        break;
      }
    }

    if (!sessionCookie) {
      return {
        success: false,
        response: new Response(JSON.stringify({
          success: false,
          error: 'No session cookie found'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      };
    }

    // Verify session and get user data
    const authData = await verifySessionCookie(sessionCookie);
    
    if (!authData.userData?.isActive) {
      return {
        success: false,
        response: new Response(JSON.stringify({
          success: false,
          error: 'Account not active'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      };
    }

    return {
      success: true,
      authData: {
        user: authData.user,
        userData: authData.userData,
        isAuthenticated: true
      }
    };

  } catch (error: any) {
    console.error('API authentication error:', error);
    return {
      success: false,
      response: new Response(JSON.stringify({
        success: false,
        error: 'Authentication failed'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
}

/**
 * Higher-order function to wrap API endpoints with authentication
 * Usage: export const GET = withAuth(originalHandler);
 */
export function withAuth(handler: (request: Request, cookies: any, authData: AuthState) => Promise<Response>): APIRoute {
  return async ({ request, cookies }) => {
    const auth = await verifyUser(request, cookies);
    
    if (!auth.success) {
      return auth.response!;
    }

    return handler(request, cookies, auth.authData!);
  };
}
