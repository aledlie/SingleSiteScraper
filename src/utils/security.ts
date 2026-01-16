/**
 * Security utilities and helpers
 * Centralized security functions for the application
 */

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 10,
  RATE_LIMIT_WINDOW: 60000, // 1 minute

  // Input limits
  MAX_URL_LENGTH: 2048,
  MAX_TEXT_LENGTH: 1_000_000,
  MAX_RESPONSE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_TEXT_RESPONSE_SIZE: 10 * 1024 * 1024, // 10MB

  // Timeout limits
  MIN_TIMEOUT: 1000, // 1 second
  MAX_TIMEOUT: 30000, // 30 seconds

  // SQL limits
  MAX_SQL_QUERY_LENGTH: 10000,
  MAX_PARAMETER_LENGTH: 1000,
  MAX_PARAMETER_COUNT: 50,

  // Blocked IP ranges (CIDR notation)
  BLOCKED_IP_RANGES: [
    '10.0.0.0/8',        // Private
    '172.16.0.0/12',     // Private
    '192.168.0.0/16',    // Private
    '127.0.0.0/8',       // Loopback
    '169.254.0.0/16',    // Link-local
    '224.0.0.0/4',       // Multicast
    '::1/128',           // IPv6 loopback
    'fc00::/7',          // IPv6 private
    'fe80::/10'          // IPv6 link-local
  ],

  // Dangerous ports
  BLOCKED_PORTS: [
    22, 23, 25, 53, 110, 143, 993, 995,  // System services
    3306, 5432, 27017, 6379, 11211,      // Databases
    9200, 9300,                          // Elasticsearch
    8080, 8443, 8000, 3000, 4000, 5000, // Common dev ports
    6443,                                // Kubernetes
    2375, 2376, 2377,                    // Docker
    5984, 5985                           // CouchDB, WinRM
  ]
} as const;

/**
 * Security headers for HTTP responses
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
} as const;

/**
 * Check if an IP address is in a blocked range
 */
export function isBlockedIP(ip: string): boolean {
  // IPv4 private ranges
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ip.match(ipv4Regex);
  
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number);
    
    // Check for invalid IPv4
    if (a > 255 || b > 255 || c > 255 || d > 255) {
      return true;
    }
    
    // Private and reserved ranges
    if (
      (a === 10) ||                           // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) ||   // 172.16.0.0/12
      (a === 192 && b === 168) ||            // 192.168.0.0/16
      (a === 169 && b === 254) ||            // 169.254.0.0/16 (link-local)
      (a === 127) ||                         // 127.0.0.0/8 (loopback)
      (a === 0) ||                           // 0.0.0.0/8
      (a >= 224)                             // Multicast and reserved
    ) {
      return true;
    }
  }
  
  // IPv6 checks
  if (ip.includes(':')) {
    const lowerIP = ip.toLowerCase();
    if (
      lowerIP === '::1' ||                    // Loopback
      lowerIP.startsWith('fc') ||             // Unique local fc00::/7
      lowerIP.startsWith('fd') ||             // Unique local fd00::/8
      lowerIP.startsWith('fe80:') ||          // Link-local
      lowerIP.startsWith('ff')                // Multicast
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate port number
 */
export function isBlockedPort(port: number | string): boolean {
  if (typeof port === 'string') {
    port = parseInt(port, 10);
  }
  
  if (isNaN(port) || port < 1 || port > 65535) {
    return true;
  }
  
  return SECURITY_CONFIG.BLOCKED_PORTS.includes(port);
}

/**
 * Security-aware sleep function with jitter
 */
export function secureDelay(baseMs: number): Promise<void> {
  // Add random jitter to prevent timing attacks
  const jitter = Math.random() * 1000; // 0-1000ms jitter
  const delay = Math.min(baseMs + jitter, 10000); // Cap at 10 seconds
  
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Generate secure random identifier
 */
export function generateSecureId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash sensitive data for logging
 */
export function hashForLogging(data: string): string {
  // Simple hash for logging purposes (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `#${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Security event logging
 */
export interface SecurityEvent {
  type: 'BLOCKED_URL' | 'BLOCKED_IP' | 'RATE_LIMIT' | 'INJECTION_ATTEMPT' | 'XSS_ATTEMPT';
  details: string;
  timestamp: Date;
  source?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents: number = 1000;

  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(fullEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY] ${fullEvent.type}: ${fullEvent.details}`);
    }
  }

  getEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByType(type: SecurityEvent['type'], limit: number = 100): SecurityEvent[] {
    return this.events.filter(e => e.type === type).slice(-limit);
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const securityLogger = new SecurityLogger();

/**
 * Rate limiter implementation
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  checkLimit(identifier: string, limit: number = SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE): boolean {
    const now = Date.now();
    const key = identifier;
    const current = this.requests.get(key);

    if (!current || now > current.resetTime) {
      this.requests.set(key, { 
        count: 1, 
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW 
      });
      return true;
    }

    if (current.count >= limit) {
      securityLogger.logEvent({
        type: 'RATE_LIMIT',
        details: `Rate limit exceeded for ${hashForLogging(identifier)}`,
        severity: 'MEDIUM'
      });
      return false;
    }

    current.count++;
    return true;
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Input sanitization middleware
 */
export function createSanitizationMiddleware() {
  return {
    sanitizeUrl: (url: string): string => {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
      }

      if (url.length > SECURITY_CONFIG.MAX_URL_LENGTH) {
        securityLogger.logEvent({
          type: 'BLOCKED_URL',
          details: 'URL too long',
          severity: 'MEDIUM'
        });
        throw new Error('URL too long');
      }

      // Remove dangerous characters (control characters)
      const cleaned = url.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      try {
        const urlObj = new URL(cleaned);
        
        if (isBlockedIP(urlObj.hostname)) {
          securityLogger.logEvent({
            type: 'BLOCKED_IP',
            details: `Blocked IP: ${hashForLogging(urlObj.hostname)}`,
            severity: 'HIGH'
          });
          throw new Error('Blocked IP address');
        }

        if (urlObj.port && isBlockedPort(urlObj.port)) {
          securityLogger.logEvent({
            type: 'BLOCKED_URL',
            details: `Blocked port: ${urlObj.port}`,
            severity: 'HIGH'
          });
          throw new Error('Blocked port');
        }

        return cleaned;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Blocked')) {
          throw error;
        }
        throw new Error('Invalid URL format');
      }
    },

    detectInjectionAttempt: (input: string): boolean => {
      const injectionPatterns = [
        // SQL injection patterns
        /('|(\x27)|(\x2D\x2D)|(%27)|(%2D%2D))/i,
        /(union|select|insert|delete|drop|create|alter|exec|execute)/i,

        // XSS patterns
        /(<script|<iframe|<object|<embed|javascript:|vbscript:)/i,
        /(on\w+\s*=|expression\s*\(|@import)/i,

        // Path traversal
        /(\.\.[\\/\\]|%2e%2e[\\/\\])/i,

        // Command injection
        /(;\s*(cat|ls|pwd|whoami|id|uname)|\|\s*(cat|ls|pwd))/i
      ];

      return injectionPatterns.some(pattern => pattern.test(input));
    }
  };
}

export const sanitizationMiddleware = createSanitizationMiddleware();

/**
 * Security monitoring and alerting
 */
export class SecurityMonitor {
  private alertThreshold: number = 10;
  private alertWindow: number = 300000; // 5 minutes

  checkForAttacks(): void {
    const recentEvents = securityLogger.getEvents(100)
      .filter(event => Date.now() - event.timestamp.getTime() < this.alertWindow);

    const criticalEvents = recentEvents.filter(event => event.severity === 'CRITICAL');
    const highEvents = recentEvents.filter(event => event.severity === 'HIGH');

    if (criticalEvents.length > 0 || highEvents.length >= this.alertThreshold) {
      this.triggerSecurityAlert(recentEvents);
    }
  }

  private triggerSecurityAlert(events: SecurityEvent[]): void {
    console.error('🚨 SECURITY ALERT: Potential attack detected');
    console.error(`Recent events: ${events.length}`);
    
    // In production, this would send alerts to security team
    // Could integrate with services like PagerDuty, Slack, etc.
  }
}

export const securityMonitor = new SecurityMonitor();

// Run security monitoring every 60 seconds
if (typeof window === 'undefined') { // Node.js environment
  setInterval(() => {
    securityMonitor.checkForAttacks();
  }, 60000);
}