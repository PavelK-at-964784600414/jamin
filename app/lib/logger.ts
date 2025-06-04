/**
 * Production-safe logging utility
 * Automatically handles development vs production environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    // In development, log everything
    return true;
  }

  private sanitizeForProduction(data: any): any {
    if (!this.isProduction) return data;
    
    // Remove sensitive data in production
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'email', 'phone'];
      
      for (const key of sensitiveKeys) {
        if (key in sanitized) {
          sanitized[key] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    return data;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      const sanitizedContext = this.sanitizeForProduction(context);
      console.log(this.formatMessage('debug', message, sanitizedContext));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const sanitizedContext = this.sanitizeForProduction(context);
      console.info(this.formatMessage('info', message, sanitizedContext));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const sanitizedContext = this.sanitizeForProduction(context);
      console.warn(this.formatMessage('warn', message, sanitizedContext));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const sanitizedContext = this.sanitizeForProduction(context);
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? '[REDACTED]' : error.stack
      } : error;
      
      console.error(this.formatMessage('error', message, sanitizedContext));
      if (errorDetails) {
        console.error('Error details:', this.sanitizeForProduction(errorDetails));
      }
    }
  }

  // Component-specific loggers
  auth = {
    debug: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.debug(message, { ...context, component: 'auth' }),
    info: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.info(message, { ...context, component: 'auth' }),
    warn: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.warn(message, { ...context, component: 'auth' }),
    error: (message: string, error?: Error | any, context?: Omit<LogContext, 'component'>) => 
      this.error(message, error, { ...context, component: 'auth' })
  };

  s3 = {
    debug: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.debug(message, { ...context, component: 's3' }),
    info: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.info(message, { ...context, component: 's3' }),
    warn: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.warn(message, { ...context, component: 's3' }),
    error: (message: string, error?: Error | any, context?: Omit<LogContext, 'component'>) => 
      this.error(message, error, { ...context, component: 's3' })
  };

  audio = {
    debug: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.debug(message, { ...context, component: 'audio' }),
    info: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.info(message, { ...context, component: 'audio' }),
    warn: (message: string, context?: Omit<LogContext, 'component'>) => 
      this.warn(message, { ...context, component: 'audio' }),
    error: (message: string, error?: Error | any, context?: Omit<LogContext, 'component'>) => 
      this.error(message, error, { ...context, component: 'audio' })
  };
}

// Export singleton instance
export const logger = new Logger();

// Export for backward compatibility
export default logger;
