import type { APIRoute } from 'astro';
import { verifyUser } from '@/functions/server/firebase/api-auth';
import { settings } from '@/config/settings.js';
import { adminStorage } from '@/firebase/server';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify user authentication
    const auth = await verifyUser(request, cookies);
    if (!auth.success) {
      return auth.response!;
    }

    // Generate signed URLs for all AVIF files in handbook/avif/
    const bucketName = settings.firebase.storageBucket;
    const bucket = adminStorage.bucket(bucketName);
    
    try {
      // List all AVIF files in the handbook/avif directory
      const [files] = await bucket.getFiles({
        prefix: 'handbook/avif/',
        delimiter: '/'
      });

      // Filter for AVIF files and sort them
      const avifFiles = files
        .filter(file => file.name.endsWith('.avif'))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Generate signed URLs for each file
      const pages = await Promise.all(
        avifFiles.map(async (file, index) => {
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });
          
          // Extract page number from filename
          const match = file.name.match(/Page_(\d+)\.avif$/);
          const pageNumber = match ? parseInt(match[1], 10) : index + 1;
          
          return {
            page: pageNumber,
            url,
            filename: file.name.split('/').pop() // Just the filename
          };
        })
      );

      // Sort by page number
      pages.sort((a, b) => a.page - b.page);

      return new Response(JSON.stringify({ 
        success: true,
        pages,
        total: pages.length
      }), {
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
      return new Response('Handbook pages not found', { status: 404 });
    }

  } catch (error: any) {
    console.error('Error serving handbook pages:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
