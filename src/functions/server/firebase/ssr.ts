import { verifySessionCookie } from './auth.js';
import type { AuthState } from '@/types/index.js';

// Get authentication data from request (for SSR)
export async function getAuthData(request: Request): Promise<AuthState> {
  // Try both cookie names
  const cookieNames = ['__tisuk_session', '__tisuk_session_dev'];
  let sessionCookie = null;

  for (const cookieName of cookieNames) {
    const cookie = request.headers.get('cookie')?.match(new RegExp(`${cookieName}=([^;]+)`))?.[1];
    if (cookie) {
      sessionCookie = cookie;
      break;
    }
  }
  
  if (!sessionCookie) {
    return {
      user: null,
      userData: null,
      isAuthenticated: false
    };
  }

  const authData = await verifySessionCookie(sessionCookie);
  
  // Check if user is active in Airtable
  const isActive = authData.userData?.isActive === true;
  
  return {
    user: authData.user,
    userData: authData.userData,
    isAuthenticated: !!authData.userData && isActive
  };
}

// Check if user has required role
export function hasRole(userData: any, requiredRoles: string[]): boolean {
  if (!userData || !userData.role) {
    return false;
  }
  return requiredRoles.includes(userData.role);
}

// Require authentication and redirect if not authenticated
export function requireAuth(authData: AuthState, redirectTo: string): string | null {
  if (!authData.isAuthenticated) {
    return redirectTo;
  }
  return null;
}

// Require specific role and redirect if not authorized
export function requireRole(authData: AuthState, requiredRoles: string[], redirectTo: string): string | null {
  if (!authData.isAuthenticated) {
    return redirectTo;
  }
  
  if (!hasRole(authData.userData, requiredRoles)) {
    return '/unauthorized';
  }
  
  return null;
} 
