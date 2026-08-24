// Server-side Types

// Route Protection Types
export interface RouteProtectionOptions {
  requireAuth?: boolean;
  requireActive?: boolean;
  redirectTo?: string;
}

export interface ProtectedRouteResult {
  allowed: boolean;
  redirect?: string;
  authData?: import('./account').AuthState;
  reason?: string;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationRule<T = any> {
  field: string;
  validator: (value: T, data: any) => boolean | string;
  message: string;
  required?: boolean;
}

// Logger Types
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
  service?: string;
}
