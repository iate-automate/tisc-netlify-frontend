// Centralized API response patterns and utilities
import type { ApiResponse } from '@/types/index.js';

// Standard HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Standard response headers
export const RESPONSE_HEADERS = {
  JSON: { 'Content-Type': 'application/json' },
  JSON_UTF8: { 'Content-Type': 'application/json; charset=utf-8' },
  TEXT: { 'Content-Type': 'text/plain' },
  HTML: { 'Content-Type': 'text/html' }
} as const;

// Success response builder
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK,
  headers: Record<string, string> = RESPONSE_HEADERS.JSON
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };

  const jsonString = JSON.stringify(response);
  
  return new Response(jsonString, {
    status,
    headers
  });
}

// Error response builder
export function createErrorResponse(
  error: string,
  status: number = HTTP_STATUS.BAD_REQUEST,
  details?: any,
  headers: Record<string, string> = RESPONSE_HEADERS.JSON
): Response {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { details })
  };

  return new Response(JSON.stringify(response), {
    status,
    headers
  });
}

// Validation error response
export function createValidationErrorResponse(
  errors: string[],
  status: number = HTTP_STATUS.UNPROCESSABLE_ENTITY
): Response {
  return createErrorResponse(
    'Validation failed',
    status,
    { validationErrors: errors }
  );
}

// Authentication error responses
export function createAuthErrorResponse(
  message: string = 'Authentication required',
  status: number = HTTP_STATUS.UNAUTHORIZED
): Response {
  return createErrorResponse(message, status);
}

export function createForbiddenResponse(
  message: string = 'Insufficient permissions'
): Response {
  return createErrorResponse(message, HTTP_STATUS.FORBIDDEN);
}

// Not found response
export function createNotFoundResponse(
  resource: string = 'Resource'
): Response {
  return createErrorResponse(`${resource} not found`, HTTP_STATUS.NOT_FOUND);
}

// Internal server error response
export function createInternalErrorResponse(
  message: string = 'Internal server error'
): Response {
  return createErrorResponse(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

// Redirect response
export function createRedirectResponse(
  url: string,
  status: number = 302
): Response {
  return new Response(null, {
    status,
    headers: { Location: url }
  });
}

// Response with cookie
export function createResponseWithCookie<T = any>(
  data: T,
  cookieName: string,
  cookieValue: string,
  cookieOptions: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
  } = {}
): Response {
  const {
    maxAge = 60 * 60 * 24 * 5, // 5 days default
    httpOnly = true,
    secure = true,
    sameSite = 'Strict',
    path = '/'
  } = cookieOptions;

  const cookieString = `${cookieName}=${cookieValue}; HttpOnly=${httpOnly}; Secure=${secure}; SameSite=${sameSite}; Path=${path}; Max-Age=${maxAge}`;

  const response = createSuccessResponse(data);
  response.headers.set('Set-Cookie', cookieString);
  
  return response;
}

// Parse request body with error handling
export async function parseRequestBody<T = any>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

