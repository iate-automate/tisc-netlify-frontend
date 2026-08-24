// Centralized core utilities - single import point for all core functionality
export * from './responses.js';
export * from './errors.js';
export * from './logger.js';
export * from './fetch.js';
export * from './validation.js';

// Re-export commonly used patterns for convenience
export {
  // Response utilities
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createForbiddenResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
  createRedirectResponse,
  createResponseWithCookie,
  parseRequestBody,
  HTTP_STATUS,
  RESPONSE_HEADERS
} from './responses.js';

export {
  // Error handling
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  handleApiError,
  withErrorHandling,
  validateRequired,
  validateEmail,
  validatePassword
} from './errors.js';

export {
  // Logging
  logger,
  authLogger,
  apiLogger,
  dbLogger,
  PerformanceTimer,
  logRequest,
  logResponse,
  logError,
  logSecurityEvent,
  logAuthEvent,
  LogLevel
} from './logger.js';

export {
  // Data fetching
  enhancedFetch,
  airtableFetch,
  apiFetch,
  batchFetch,
  cachedFetch,
  clearCache
} from './fetch.js';

export {
  // Validation
  Validator,
  AuthValidator,
  UserValidator,
  ApiValidator,
  EnvironmentValidator,
  Sanitizer,
  withValidation
} from './validation.js';
