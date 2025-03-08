import { supabase } from '@/lib/supabase/client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  level: LogLevel;
  context?: Record<string, any>;
  timestamp?: string;
  user?: {
    id?: string;
    email?: string;
  };
  tags?: string[];
  organizationId?: string;
  sessionId?: string;
  environment?: string;
  version?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private logEndpoint: string | null = null;
  private bufferSize: number = 50;
  private logBuffer: LogPayload[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isDebugEnabled: boolean = false;
  private sessionId: string;
  private version: string;
  private environment: string;
  
  private constructor() {
    // Initialize logger configuration
    this.sessionId = this.generateSessionId();
    this.version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    this.environment = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';
    this.isDebugEnabled = process.env.NODE_ENV === 'development';
    
    if (typeof window !== 'undefined') {
      // Set up periodic flush in browser environment
      this.flushInterval = setInterval(() => this.flush(), 5000); // Flush every 5 seconds
      
      // Flush logs before page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.info('Network connection restored', { type: 'connectivity' });
        this.flush(); // Attempt to send any buffered logs
      });
      
      window.addEventListener('offline', () => {
        this.warn('Network connection lost', { type: 'connectivity' });
      });
    }
  }
  
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  public configure(options: { 
    endpoint?: string; 
    bufferSize?: number;
    debug?: boolean;
  }): void {
    if (options.endpoint) this.logEndpoint = options.endpoint;
    if (options.bufferSize) this.bufferSize = options.bufferSize;
    if (options.debug !== undefined) this.isDebugEnabled = options.debug;
  }
  
  private async getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email
        };
      }
    } catch (error) {
      console.warn('Failed to get current user for logging:', error);
    }
    return undefined;
  }
  
  private async getOrganizationId() {
    try {
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .single();
      return data?.organization_id;
    } catch (error) {
      return undefined;
    }
  }
  
  public async log(payload: Omit<LogPayload, 'timestamp'>): Promise<void> {
    const user = await this.getCurrentUser();
    const organizationId = await this.getOrganizationId();
    
    const fullPayload: LogPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      user,
      organizationId,
      sessionId: this.sessionId,
      environment: this.environment,
      version: this.version,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };
    
    // Console logging in development
    if (process.env.NODE_ENV === 'development' || this.isDebugEnabled) {
      const { level, message, ...rest } = fullPayload;
      console[level](`[${level.toUpperCase()}] ${message}`, rest);
    }
    
    // Add to buffer
    this.logBuffer.push(fullPayload);
    
    // Flush if buffer is full or on error
    if (payload.level === 'error' || this.logBuffer.length >= this.bufferSize) {
      await this.flush();
    }
  }
  
  public debug(message: string, context?: Record<string, any>, tags?: string[]): void {
    if (this.isDebugEnabled) {
      this.log({ level: 'debug', message, context, tags });
    }
  }
  
  public info(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log({ level: 'info', message, context, tags });
  }
  
  public warn(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log({ level: 'warn', message, context, tags });
  }
  
  public error(message: string, error?: Error, context?: Record<string, any>, tags?: string[]): void {
    const errorContext = error ? {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      cause: error.cause,
    } : context;
    
    this.log({ 
      level: 'error', 
      message, 
      context: errorContext, 
      tags: [...(tags || []), 'error']
    });
  }
  
  private async flush(): Promise<void> {
    if (!this.logBuffer.length || !this.logEndpoint) return;
    
    const logs = [...this.logBuffer];
    this.logBuffer = [];
    
    if (!this.logEndpoint) {
      // Store in Supabase if no endpoint configured
      try {
        await supabase.from('logs').insert(
          logs.map(log => ({
            ...log,
            metadata: {
              context: log.context,
              user: log.user,
              tags: log.tags,
            }
          }))
        );
        return;
      } catch (error) {
        console.error('Failed to store logs in Supabase:', error);
      }
    }
    
    try {
      const response = await fetch(this.logEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
        keepalive: true,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Retry buffer if not too large
      if (this.logBuffer.length + logs.length < this.bufferSize * 2) {
        this.logBuffer = [...logs, ...this.logBuffer];
      }
    }
  }
  
  public clearBuffer(): void {
    this.logBuffer = [];
  }
  
  public getSessionId(): string {
    return this.sessionId;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Set up global error handlers
if (typeof window !== 'undefined') {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logger.error(
      'Uncaught error',
      event.error,
      {
        message: event.message,
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      },
      ['uncaught']
    );
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    logger.error(
      'Unhandled promise rejection',
      error,
      {
        reason: event.reason,
      },
      ['unhandled-rejection']
    );
  });
  
  // Log performance metrics
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        logger.info('Page load performance', {
          type: 'performance',
          metrics: {
            loadTime: metrics.loadEventEnd - metrics.navigationStart,
            domReady: metrics.domContentLoadedEventEnd - metrics.navigationStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
          }
        });
      }, 0);
    });
  }
}