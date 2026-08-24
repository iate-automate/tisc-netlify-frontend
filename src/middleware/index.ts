import { defineMiddleware } from 'astro:middleware';
import { requireActiveUser } from '@/functions/server/firebase/route-protection';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Define private routes that require authentication
  const privateRoutes = [
    '/resources',
    '/applications', 
    '/registers'
  ];
  
  // Check if the current path is a private route
  const isPrivateRoute = privateRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isPrivateRoute) {
    try {
      const protection = await requireActiveUser(context.request);
      
      if (!protection.allowed) {
        // Redirect to signin with the original path as a parameter
        const redirectUrl = `/account/signin?redirect=${encodeURIComponent(pathname)}`;
        return new Response(null, {
          status: 302,
          headers: {
            'Location': redirectUrl,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    } catch (error) {
      // If there's an error, redirect to signin
      const redirectUrl = `/account/signin?redirect=${encodeURIComponent(pathname)}`;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  }

  // For all other routes (including non-existent ones), just let Astro handle them naturally
  // This will result in 404 for pages that don't exist
  return next();
});