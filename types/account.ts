// Account and Authentication Types

// User Types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface UserData {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: 'trainer' | 'delegate';
  organization?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  activationKey?: string;
  applications?: string[];
  recordId?: string; // Airtable record ID
}

// Auth State
export interface AuthState {
  user: User | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  loading?: boolean;
}

// Auth API Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ActivationData {
  email: string;
  password: string;
  portalActivationKey: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirect?: string;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
  userData?: UserData;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  user?: User;
  userData?: UserData;
}

export interface TokenValidation {
  valid: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

// Auth Context
export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, activationKey: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
  phone?: string;
  activationKey?: string;
}

// API Auth Types
export interface ApiAuthResult {
  success: boolean;
  authData?: AuthState;
  response?: Response; // 401 response if unauthorized
}
