import type { APIRoute } from 'astro';
import { verifyUser } from '@/functions/server/firebase/api-auth';
import { settings } from '@/config/settings.js';
import { adminStorage, adminAuth } from '@/firebase/server';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify user authentication
    const auth = await verifyUser(request, cookies);
    if (!auth.success) {
      return auth.response!;
    }

    const authData = auth.authData!;

    // Generate signed URL for Firebase Storage
    const bucketName = settings.firebase.storageBucket;
    const bucket = adminStorage.bucket(bucketName);
    const file = bucket.file('handbook/TISUK_Handbook_0825.pdf');
    
    try {
      // Get the Firebase user from the session
      const firebaseUser = await adminAuth.getUser(authData.user!.uid);
      
      // Generate signed URL using Firebase Auth user context
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
        responseDisposition: 'inline; filename="TISUK_Handbook_0825.pdf"'
      });

      // Return the URL as JSON for PDF.js to use
      return new Response(JSON.stringify({ url: signedUrl }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (storageError) {
      console.error('Error accessing Firebase Storage:', storageError);
      return new Response('Handbook not found', { status: 404 });
    }

  } catch (error: any) {
    console.error('Error serving handbook:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
