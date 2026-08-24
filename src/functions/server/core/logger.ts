// Centralized logging system with consistent patterns
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

class Logger {
  private currentLevel: LogLevel;
  private service: string;

  constructor(service: string = 'TISUK-Portal', level: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    
    return `[${timestamp}] ${levelName} | ${this.service} | ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Specialized logging methods
  auth(message: string, context?: any): void {
    this.info(`[AUTH] ${message}`, context);
  }

  api(message: string, context?: any): void {
    this.info(`[API] ${message}`, context);
  }

  database(message: string, context?: any): void {
    this.info(`[DB] ${message}`, context);
  }

  security(message: string, context?: any): void {
    this.warn(`[SECURITY] ${message}`, context);
  }

  performance(message: string, context?: any): void {
    this.info(`[PERF] ${message}`, context);
  }
}

// Create service-specific loggers
export const logger = new Logger('TISUK-Portal');
export const authLogger = new Logger('Auth-Service');
export const apiLogger = new Logger('API-Service');
export const dbLogger = new Logger('Database-Service');

// Performance timing utility
export class PerformanceTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = performance.now();
    logger.debug(`Starting ${operation}`);
  }

  end(context?: any): number {
    const duration = performance.now() - this.startTime;
    logger.performance(`Completed ${this.operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...context
    });
    return duration;
  }
}

// Request logging middleware
export function logRequest(method: string, url: string, context?: any): void {
  apiLogger.info(`${method} ${url}`, context);
}

export function logResponse(method: string, url: string, status: number, duration?: number): void {
  const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
  const message = `${method} ${url} - ${status}`;
  const context = duration ? { duration: `${duration.toFixed(2)}ms` } : undefined;
  
  apiLogger.log(level, message, context);
}

// Error logging with context
export function logError(error: Error, context?: any): void {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
}

// Security event logging
export function logSecurityEvent(event: string, context?: any): void {
  logger.security(event, context);
}

// Authentication event logging
export function logAuthEvent(event: string, userId?: string, context?: any): void {
  authLogger.auth(event, {
    userId,
    ...context
  });
}
