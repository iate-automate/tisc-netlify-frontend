// Centralized error handling and logging
import { createInternalErrorResponse, createErrorResponse } from './responses.js';

// Custom error types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: any) {
    super(message, 422, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
  }
}

// Error handler for API endpoints
export function handleApiError(error: any): Response {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    context: error.context,
    timestamp: new Date().toISOString()
  });

  // Handle known operational errors
  if (error instanceof AppError) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.context
    );
  }

  // Handle Firebase Auth errors
  if (error.code && error.code.startsWith('auth/')) {
    const authErrorMessages: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'User account has been disabled',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Invalid password',
      'auth/email-already-in-use': 'Email address is already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-id-token': 'Invalid authentication token',
      'auth/id-token-expired': 'Authentication token has expired',
      'auth/session-cookie-expired': 'Session has expired',
      'auth/session-cookie-revoked': 'Session has been revoked',
      'auth/invalid-session-cookie': 'Invalid session cookie'
    };

    const message = authErrorMessages[error.code] || 'Authentication error';
    const statusCode = error.code.includes('expired') || error.code.includes('revoked') ? 401 : 400;

    return createErrorResponse(message, statusCode);
  }

  // Handle Airtable API errors
  if (error.message && error.message.includes('Airtable API error')) {
    return createErrorResponse(
      'External service error',
      503,
      { service: 'Airtable' }
    );
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return createErrorResponse(
      error.message || 'Validation failed',
      422,
      error.details
    );
  }

  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return createErrorResponse(
      'Network error - please try again',
      503
    );
  }

  // Default to internal server error
  return createInternalErrorResponse();
}

// Async error wrapper for API endpoints
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error; // Re-throw to be handled by the API endpoint
    }
  };
}

// Validation helper
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
