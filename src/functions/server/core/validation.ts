// Centralized validation patterns and utilities
import { ValidationError, validateRequired, validateEmail, validatePassword } from './errors.js';
import { logger } from './logger.js';
import type { ValidationResult, ValidationRule } from '@/types/index.js';

// Generic validator class
export class Validator<T = any> {
  private rules: ValidationRule<T>[] = [];
  private data: T;

  constructor(data: T) {
    this.data = data;
  }

  // Add validation rule
  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  // Add required field validation
  required(field: keyof T, message?: string): this {
    return this.addRule({
      field: field as string,
      validator: (value) => value !== null && value !== undefined && value !== '',
      message: message || `${String(field)} is required`,
      required: true
    });
  }

  // Add email validation
  email(field: keyof T, message?: string): this {
    return this.addRule({
      field: field as string,
      validator: (value) => typeof value === 'string' && validateEmail(value),
      message: message || `${String(field)} must be a valid email address`,
      required: true
    });
  }

  // Add password validation
  password(field: keyof T, message?: string): this {
    return this.addRule({
      field: field as string,
      validator: (value) => {
        if (typeof value !== 'string') return false;
        const result = validatePassword(value);
        return result.valid;
      },
      message: message || `${String(field)} does not meet requirements`,
      required: true
    });
  }

  // Add string length validation
  minLength(field: keyof T, min: number, message?: string): this {
    return this.addRule({
      field: field as string,
      validator: (value) => typeof value === 'string' && value.length >= min,
      message: message || `${String(field)} must be at least ${min} characters long`,
      required: true
    });
  }

  maxLength(field: keyof T, max: number, message?: string): this {
    return this.addRule({
      field: field as string,
      validator: (value) => typeof value === 'string' && value.length <= max,
      message: message || `${String(field)} must be no more than ${max} characters long`,
      required: true
    });
  }

  // Add custom validation
  custom(field: keyof T, validator: (value: any, data: T) => boolean | string, message: string): this {
    return this.addRule({
      field: field as string,
      validator,
      message,
      required: true
    });
  }

  // Validate all rules
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      const value = (this.data as any)[rule.field];
      
      // Check if field is required and missing
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push(rule.message);
        continue;
      }

      // Skip validation if field is not required and empty
      if (!rule.required && (value === null || value === undefined || value === '')) {
        continue;
      }

      // Run validator
      const result = rule.validator(value, this.data);
      if (result === false) {
        errors.push(rule.message);
      } else if (typeof result === 'string') {
        errors.push(result);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate and throw if invalid
  validateOrThrow(): void {
    const result = this.validate();
    if (!result.isValid) {
      throw new ValidationError('Validation failed', { errors: result.errors });
    }
  }
}

// Predefined validators for common use cases
export class AuthValidator extends Validator {
  // Login form validation
  static validateLogin(data: { email: string; password: string }): ValidationResult {
    return new Validator(data)
      .required('email', 'Email is required')
      .email('email', 'Please enter a valid email address')
      .required('password', 'Password is required')
      .minLength('password', 1, 'Password is required')
      .validate();
  }

  // Account activation form validation
  static validateActivation(data: {
    email: string;
    password: string;
    portalActivationKey?: string;
    activationKey?: string; // Legacy support
    recordId?: string; // Legacy support
  }): ValidationResult {
    const validator = new Validator(data)
      .required('email', 'Email is required')
      .email('email', 'Please enter a valid email address')
      .required('password', 'Password is required');
    
    // Check for portal activation key (new) or legacy fields
    if (data.portalActivationKey) {
      validator.required('portalActivationKey', 'Portal activation key is required');
    } else if (data.activationKey) {
      validator.required('activationKey', 'Portal activation key is required');
    } else if (data.recordId) {
      validator.required('recordId', 'Portal activation key is required');
    } else {
      // If none of the key fields are present, add a generic error
      return {
        isValid: false,
        errors: ['Portal activation key is required']
      };
    }
    
    return validator.validate();
  }

  // Password reset validation
  static validatePasswordReset(data: { email: string }): ValidationResult {
    return new Validator(data)
      .required('email', 'Email is required')
      .email('email', 'Please enter a valid email address')
      .validate();
  }
}

// User data validation
export class UserValidator extends Validator {
  static validateUserData(data: {
    firstName: string;
    lastName: string;
    email: string;
    organization?: string;
    phone?: string;
  }): ValidationResult {
    return new Validator(data)
      .required('firstName', 'First name is required')
      .minLength('firstName', 1, 'First name is required')
      .maxLength('firstName', 50, 'First name is too long')
      .required('lastName', 'Last name is required')
      .minLength('lastName', 1, 'Last name is required')
      .maxLength('lastName', 50, 'Last name is too long')
      .required('email', 'Email is required')
      .email('email', 'Please enter a valid email address')
      .custom('organization', (value) => {
        if (value && typeof value === 'string' && value.length > 100) {
          return 'Organization name is too long';
        }
        return true;
      }, 'Organization name is too long')
      .custom('phone', (value) => {
        if (value && typeof value === 'string') {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            return 'Please enter a valid phone number';
          }
        }
        return true;
      }, 'Please enter a valid phone number')
      .validate();
  }
}

// API request validation
export class ApiValidator extends Validator {
  static validateRequest(data: any, requiredFields: string[]): ValidationResult {
    const validator = new Validator(data);
    
    requiredFields.forEach(field => {
      validator.required(field as keyof typeof data);
    });
    
    return validator.validate();
  }
}

// Environment validation
export class EnvironmentValidator {
  static validateRequired(requiredVars: string[]): ValidationResult {
    const errors: string[] = [];
    
    requiredVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        errors.push(`Missing environment variable: ${varName}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Validation middleware for API endpoints
export function withValidation<T = any>(
  validator: (data: T) => ValidationResult
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const data = args[0];
      const result = validator(data);
      
      if (!result.isValid) {
        throw new ValidationError('Validation failed', { errors: result.errors });
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Sanitization utilities
export class Sanitizer {
  static sanitizeString(value: string): string {
    return value.trim().replace(/[<>]/g, '');
  }

  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d\+\-\(\)\s]/g, '');
  }
}
