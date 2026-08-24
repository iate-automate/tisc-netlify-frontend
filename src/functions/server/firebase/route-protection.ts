// Route protection utilities for authenticated and non-authenticated users
import { getAuthData } from './ssr.js';
import type { AuthState, RouteProtectionOptions, ProtectedRouteResult } from '@/types/index.js';

// Main route protection function
export async function protectRoute(
  request: Request, 
  options: RouteProtectionOptions = {}
): Promise<ProtectedRouteResult> {
  const {
    requireAuth = false,
    requireActive = true,
    redirectTo
  } = options;

  try {
    const authData = await getAuthData(request);
    
    // If route requires authentication
    if (requireAuth) {
      if (!authData.isAuthenticated) {
        return {
          allowed: false,
          redirect: redirectTo || '/account/signin',
          reason: 'Authentication required'
        };
      }
      
      // Check if user is active (if required)
      if (requireActive && !authData.userData?.isActive) {
        return {
          allowed: false,
          redirect: redirectTo || '/account',
          reason: 'Account not active',
          authData
        };
      }
    }
    
    return {
      allowed: true,
      authData
    };
    
  } catch (error) {
    console.error('Route protection error:', error);
    return {
      allowed: false,
      redirect: '/account/signin',
      reason: 'Authentication error'
    };
  }
}

// Convenience functions for common protection patterns
export async function requireAuth(request: Request, redirectTo?: string): Promise<ProtectedRouteResult> {
  return protectRoute(request, { requireAuth: true, redirectTo });
}

export async function requireActiveUser(request: Request, redirectTo?: string): Promise<ProtectedRouteResult> {
  return protectRoute(request, { requireAuth: true, requireActive: true, redirectTo });
}


// Middleware for Astro pages
export async function withAuthProtection(
  request: Request,
  options: RouteProtectionOptions = {}
): Promise<{ authData: AuthState; redirect?: Response }> {
  const result = await protectRoute(request, options);
  
  if (!result.allowed && result.redirect) {
    return {
      authData: result.authData || { user: null, userData: null, isAuthenticated: false },
      redirect: new Response(null, { status: 302, headers: { Location: result.redirect } })
    };
  }
  
  return {
    authData: result.authData || { user: null, userData: null, isAuthenticated: false }
  };
}
