import type { APIRoute } from 'astro';
import { createSuccessResponse } from '@/functions/server/core/responses.ts';
import { handleApiError } from '@/functions/server/core/errors.ts';
import { logRequest, logResponse, PerformanceTimer } from '@/functions/server/core/logger.ts';
import { apiFetch } from '@/functions/server/core/fetch.ts';
import { settings } from '@/config/settings.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  const timer = new PerformanceTimer('Registers API');
  
  try {
    const body = await request.json();
    const { registers } = body;

    if (!registers) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Registers data is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logRequest('POST', '/api/courses/registers', { hasRegisters: !!registers });

    // Call external API (this would be your existing Firebase function or external service)
    const response = await apiFetch(`${settings.firebase.functionsApiUrl}/registers`, {
      method: 'POST',
      body: JSON.stringify({ registers })
    });

    logResponse('POST', '/api/courses/registers', 200, timer.end());
    return createSuccessResponse(response.data, 'Registers updated successfully');

  } catch (error: any) {
    logResponse('POST', '/api/courses/registers', error.statusCode || 500, timer.end());
    return handleApiError(error);
  }
};
