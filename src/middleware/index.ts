import { defineMiddleware } from 'astro:middleware';
import { requireActiveUser } from '@/functions/server/firebase/route-protection';

// Whole-portal maintenance gate. Set MAINTENANCE_MODE=true in Netlify's environment
// variables (and redeploy, or trigger "Clear cache and deploy") to take the site down;
// unset it (or set to anything else) and redeploy to bring it back. No code change needed
// either way. This runs before every other check, so it covers API routes too, not just pages.
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

const maintenanceHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>TISC UK Practitioner Portal — Maintenance</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
           background: #f4f3f1; color: #2b2b2b; margin: 0; min-height: 100vh;
           display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { max-width: 480px; background: #fff; border-radius: 12px; padding: 40px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08); text-align: center; }
    h1 { font-size: 1.3rem; margin: 0 0 12px; }
    p { line-height: 1.5; color: #555; margin: 0 0 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>The Practitioner Portal is temporarily unavailable</h1>
    <p>We're carrying out planned maintenance. Please check back shortly.</p>
    <p>If you need urgent help, contact the TISC UK admissions team.</p>
  </div>
</body>
</html>`;

export const onRequest = defineMiddleware(async (context, next) => {
  if (MAINTENANCE_MODE) {
    return new Response(maintenanceHtml, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Retry-After': '3600'
      }
    });
  }

  const { pathname, search } = context.url;
  const returnTo = encodeURIComponent(pathname + search);
  
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
        const redirectUrl = `/account/signin?redirect=${returnTo}`;
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
      const redirectUrl = `/account/signin?redirect=${returnTo}`;
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