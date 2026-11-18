import type { APIRoute } from 'astro';
import { createSuccessResponse } from '@/functions/server/core/responses.ts';
import { handleApiError } from '@/functions/server/core/errors.ts';
import { logRequest, logResponse, PerformanceTimer } from '@/functions/server/core/logger.ts';
import { apiFetch } from '@/functions/server/core/fetch.ts';
import { settings } from '@/config/settings.js';
import { verifyUser } from '@/functions/server/firebase/api-auth.ts';
import { canAccessCourse } from '@/functions/server/firebase/course-access.ts';

function getSessionCookie(cookies: any): string | null {
  for (const name of ['__tisuk_session', '__tisuk_session_dev']) {
    const value = cookies.get(name)?.value;
    if (value) return value;
  }
  return null;
}

function parseRegistersPayload(raw: unknown): { courseId?: string } | null {
  if (raw == null) return null;

  // Client currently JSON.stringifies the register payload once more inside { registers }.
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (typeof raw === 'object') {
    return raw as { courseId?: string };
  }

  return null;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const timer = new PerformanceTimer('Registers API');

  try {
    const auth = await verifyUser(request, cookies);
    if (!auth.success) {
      logResponse('POST', '/api/courses/registers', 401, timer.end());
      return auth.response!;
    }

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

    const payload = parseRegistersPayload(registers);
    const courseId = payload?.courseId;

    if (!courseId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Course id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allowed = await canAccessCourse(auth.authData?.userData, courseId);
    if (!allowed) {
      logResponse('POST', '/api/courses/registers', 403, timer.end());
      return new Response(JSON.stringify({
        success: false,
        error: 'Not authorised for this course'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logRequest('POST', '/api/courses/registers', { hasRegisters: !!registers, courseId });

    const sessionCookie = getSessionCookie(cookies);
    const response = await apiFetch(`${settings.firebase.functionsApiUrl}/registers`, {
      method: 'POST',
      headers: sessionCookie
        ? { Authorization: `Bearer ${sessionCookie}` }
        : undefined,
      body: JSON.stringify({ registers })
    });

    logResponse('POST', '/api/courses/registers', 200, timer.end());
    return createSuccessResponse(response.data, 'Registers updated successfully');

  } catch (error: any) {
    logResponse('POST', '/api/courses/registers', error.statusCode || 500, timer.end());
    return handleApiError(error);
  }
};
