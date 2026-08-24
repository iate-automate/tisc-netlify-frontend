import type { APIRoute } from 'astro';
import { verifyUser } from '@/functions/server/firebase/api-auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify user authentication
    const auth = await verifyUser(request, cookies);
    if (!auth.success) {
      return auth.response!;
    }

    const userData = auth.authData!.userData;

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
