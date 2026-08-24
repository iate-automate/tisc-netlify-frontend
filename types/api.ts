// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

// Fetch Types
export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface FetchResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  success: boolean;
}

// Resource Response Types
export interface ResourceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CourseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
