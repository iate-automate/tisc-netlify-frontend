// UI Component Types

// Button Types
export interface ButtonProps {
  variant?: string;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface ButtonBackProps {
  variant?: string;
  label?: string;
  style?: 'button' | 'breadcrumb' | 'link';
  className?: string;
  href?: string;
}

// Loader Types
export interface LoaderProps {
  label?: string;
  variant?: 'naked' | 'block';
  height?: string | number;
  className?: string;
}

// Page Header Types
export interface PageHeaderProps {
  title: string;
  copy?: string;
  className?: string;
}

// Concertina Types
export interface ConcertinaProps {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  org?: string;
  responses?: string;
  trauma?: string;
}

// Applications Types (renamed from Concertina for clarity)
export interface ApplicationsProps {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  org?: string;
  responses?: string;
  trauma?: string;
}

// Form Types
export interface ActivateFormProps {
  onSuccess?: () => void;
}

export interface LoginFormProps {
  onSuccess?: () => void;
}

export interface ForgotFormProps {
  onSuccess?: () => void;
}

// Handbook Types
export interface HandbookViewerProps {
  className?: string;
}

// Account Types
export interface AccountDetailsProps {
  userData: any;
  uid: string | undefined;
}
