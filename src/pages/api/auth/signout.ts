import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Use Astro's cookies API to properly delete only TISUK cookies
  const cookieNames = [
    '__tisuk_session',
    '__tisuk_session_dev'
  ];
  
  cookieNames.forEach(cookieName => {
    cookies.delete(cookieName, { path: '/' });
  });
  
  const response = new Response(JSON.stringify({ 
    success: true, 
    redirect: '/account/signin' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  return response;
};
