import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SECURITY_CONFIG,
  SECURITY_HEADERS,
  isBlockedIP,
  isBlockedPort,
  secureDelay,
  generateSecureId,
  hashForLogging,
  securityLogger,
  rateLimiter,
  createSanitizationMiddleware,
  sanitizationMiddleware,
  SecurityMonitor,
  securityMonitor
} from '../../../src/utils/security';

describe('Security Utilities', () => {
  describe('SECURITY_CONFIG', () => {
    it('has correct rate limiting values', () => {
      expect(SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE).toBe(10);
      expect(SECURITY_CONFIG.RATE_LIMIT_WINDOW).toBe(60000);
    });

    it('has correct input limits', () => {
      expect(SECURITY_CONFIG.MAX_URL_LENGTH).toBe(2048);
      expect(SECURITY_CONFIG.MAX_TEXT_LENGTH).toBe(1_000_000);
      expect(SECURITY_CONFIG.MAX_RESPONSE_SIZE).toBe(50 * 1024 * 1024);
    });

    it('has correct timeout limits', () => {
      expect(SECURITY_CONFIG.MIN_TIMEOUT).toBe(1000);
      expect(SECURITY_CONFIG.MAX_TIMEOUT).toBe(30000);
    });

    it('has blocked IP ranges defined', () => {
      expect(SECURITY_CONFIG.BLOCKED_IP_RANGES).toContain('10.0.0.0/8');
      expect(SECURITY_CONFIG.BLOCKED_IP_RANGES).toContain('127.0.0.0/8');
    });

    it('has blocked ports defined', () => {
      expect(SECURITY_CONFIG.BLOCKED_PORTS).toContain(22);
      expect(SECURITY_CONFIG.BLOCKED_PORTS).toContain(3306);
    });
  });

  describe('SECURITY_HEADERS', () => {
    it('has Content-Security-Policy defined', () => {
      expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("default-src 'self'");
    });

    it('has X-Frame-Options set to DENY', () => {
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    });

    it('has X-Content-Type-Options set to nosniff', () => {
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    });
  });

  describe('isBlockedIP', () => {
    describe('IPv4 addresses', () => {
      it('blocks private 10.x.x.x addresses', () => {
        expect(isBlockedIP('10.0.0.1')).toBe(true);
        expect(isBlockedIP('10.255.255.255')).toBe(true);
      });

      it('blocks private 172.16-31.x.x addresses', () => {
        expect(isBlockedIP('172.16.0.1')).toBe(true);
        expect(isBlockedIP('172.31.255.255')).toBe(true);
      });

      it('does not block 172.15.x.x addresses', () => {
        expect(isBlockedIP('172.15.0.1')).toBe(false);
      });

      it('blocks private 192.168.x.x addresses', () => {
        expect(isBlockedIP('192.168.1.1')).toBe(true);
        expect(isBlockedIP('192.168.0.0')).toBe(true);
      });

      it('blocks link-local 169.254.x.x addresses', () => {
        expect(isBlockedIP('169.254.0.1')).toBe(true);
      });

      it('blocks loopback 127.x.x.x addresses', () => {
        expect(isBlockedIP('127.0.0.1')).toBe(true);
        expect(isBlockedIP('127.0.0.2')).toBe(true);
      });

      it('blocks 0.x.x.x addresses', () => {
        expect(isBlockedIP('0.0.0.0')).toBe(true);
      });

      it('blocks multicast and reserved addresses (224+)', () => {
        expect(isBlockedIP('224.0.0.1')).toBe(true);
        expect(isBlockedIP('255.255.255.255')).toBe(true);
      });

      it('blocks invalid IPv4 addresses with octets > 255', () => {
        expect(isBlockedIP('256.0.0.1')).toBe(true);
        expect(isBlockedIP('1.256.0.1')).toBe(true);
      });

      it('allows valid public IP addresses', () => {
        expect(isBlockedIP('8.8.8.8')).toBe(false);
        expect(isBlockedIP('1.1.1.1')).toBe(false);
        expect(isBlockedIP('142.250.185.46')).toBe(false);
      });
    });

    describe('IPv6 addresses', () => {
      it('blocks loopback ::1', () => {
        expect(isBlockedIP('::1')).toBe(true);
      });

      it('blocks unique local fc00::/7 addresses', () => {
        expect(isBlockedIP('fc00::1')).toBe(true);
        expect(isBlockedIP('fd00::1')).toBe(true);
      });

      it('blocks link-local fe80:: addresses', () => {
        expect(isBlockedIP('fe80::1')).toBe(true);
      });

      it('blocks multicast ff:: addresses', () => {
        expect(isBlockedIP('ff00::1')).toBe(true);
        expect(isBlockedIP('ff02::1')).toBe(true);
      });

      it('allows valid public IPv6 addresses', () => {
        expect(isBlockedIP('2001:4860:4860::8888')).toBe(false);
      });
    });
  });

  describe('isBlockedPort', () => {
    it('blocks SSH port 22', () => {
      expect(isBlockedPort(22)).toBe(true);
    });

    it('blocks MySQL port 3306', () => {
      expect(isBlockedPort(3306)).toBe(true);
    });

    it('blocks PostgreSQL port 5432', () => {
      expect(isBlockedPort(5432)).toBe(true);
    });

    it('blocks Redis port 6379', () => {
      expect(isBlockedPort(6379)).toBe(true);
    });

    it('handles string port numbers', () => {
      expect(isBlockedPort('22')).toBe(true);
      expect(isBlockedPort('80')).toBe(false);
    });

    it('blocks invalid port numbers', () => {
      expect(isBlockedPort(0)).toBe(true);
      expect(isBlockedPort(-1)).toBe(true);
      expect(isBlockedPort(65536)).toBe(true);
      expect(isBlockedPort(NaN)).toBe(true);
    });

    it('allows valid non-blocked ports', () => {
      expect(isBlockedPort(80)).toBe(false);
      expect(isBlockedPort(443)).toBe(false);
    });
  });

  describe('secureDelay', () => {
    it('returns a promise', () => {
      const result = secureDelay(100);
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves after delay', async () => {
      const start = Date.now();
      await secureDelay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(11100); // Max 10 seconds + some buffer
    });
  });

  describe('generateSecureId', () => {
    it('generates ID of default length 16', () => {
      const id = generateSecureId();
      expect(id).toHaveLength(16);
    });

    it('generates ID of specified length', () => {
      expect(generateSecureId(8)).toHaveLength(8);
      expect(generateSecureId(32)).toHaveLength(32);
    });

    it('generates alphanumeric characters only', () => {
      const id = generateSecureId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('generates unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSecureId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('hashForLogging', () => {
    it('returns a hash string starting with #', () => {
      const result = hashForLogging('test data');
      expect(result).toMatch(/^#[0-9a-f]{8}$/);
    });

    it('returns consistent hash for same input', () => {
      const hash1 = hashForLogging('consistent');
      const hash2 = hashForLogging('consistent');
      expect(hash1).toBe(hash2);
    });

    it('returns different hashes for different inputs', () => {
      const hash1 = hashForLogging('input1');
      const hash2 = hashForLogging('input2');
      expect(hash1).not.toBe(hash2);
    });

    it('handles empty string', () => {
      const result = hashForLogging('');
      expect(result).toMatch(/^#[0-9a-f]{8}$/);
    });
  });

  describe('SecurityLogger', () => {
    beforeEach(() => {
      securityLogger.clearEvents();
    });

    it('logs events with timestamp', () => {
      securityLogger.logEvent({
        type: 'BLOCKED_URL',
        details: 'Test blocked URL',
        severity: 'HIGH'
      });

      const events = securityLogger.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('BLOCKED_URL');
      expect(events[0].details).toBe('Test blocked URL');
      expect(events[0].timestamp).toBeInstanceOf(Date);
    });

    it('limits stored events', () => {
      // Log more than maxEvents (1000)
      for (let i = 0; i < 1005; i++) {
        securityLogger.logEvent({
          type: 'BLOCKED_URL',
          details: `Event ${i}`,
          severity: 'LOW'
        });
      }

      const events = securityLogger.getEvents(2000);
      expect(events.length).toBeLessThanOrEqual(1000);
    });

    it('getEvents returns limited results', () => {
      for (let i = 0; i < 50; i++) {
        securityLogger.logEvent({
          type: 'BLOCKED_URL',
          details: `Event ${i}`,
          severity: 'LOW'
        });
      }

      expect(securityLogger.getEvents(10)).toHaveLength(10);
    });

    it('getEventsByType filters correctly', () => {
      securityLogger.logEvent({ type: 'BLOCKED_URL', details: 'url1', severity: 'LOW' });
      securityLogger.logEvent({ type: 'BLOCKED_IP', details: 'ip1', severity: 'HIGH' });
      securityLogger.logEvent({ type: 'BLOCKED_URL', details: 'url2', severity: 'LOW' });

      const urlEvents = securityLogger.getEventsByType('BLOCKED_URL');
      expect(urlEvents).toHaveLength(2);
      expect(urlEvents.every(e => e.type === 'BLOCKED_URL')).toBe(true);
    });

    it('clearEvents removes all events', () => {
      securityLogger.logEvent({ type: 'BLOCKED_URL', details: 'test', severity: 'LOW' });
      expect(securityLogger.getEvents()).toHaveLength(1);

      securityLogger.clearEvents();
      expect(securityLogger.getEvents()).toHaveLength(0);
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      rateLimiter.reset();
      securityLogger.clearEvents();
    });

    it('allows requests within limit', () => {
      expect(rateLimiter.checkLimit('test-user', 5)).toBe(true);
      expect(rateLimiter.checkLimit('test-user', 5)).toBe(true);
      expect(rateLimiter.checkLimit('test-user', 5)).toBe(true);
    });

    it('blocks requests exceeding limit', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('test-user', 5);
      }
      expect(rateLimiter.checkLimit('test-user', 5)).toBe(false);
    });

    it('logs rate limit events', () => {
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkLimit('test-user', 5);
      }

      const events = securityLogger.getEventsByType('RATE_LIMIT');
      expect(events.length).toBeGreaterThan(0);
    });

    it('resets specific identifier', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user1', 5);
      }
      expect(rateLimiter.checkLimit('user1', 5)).toBe(false);

      rateLimiter.reset('user1');
      expect(rateLimiter.checkLimit('user1', 5)).toBe(true);
    });

    it('resets all identifiers', () => {
      rateLimiter.checkLimit('user1', 1);
      rateLimiter.checkLimit('user2', 1);
      expect(rateLimiter.checkLimit('user1', 1)).toBe(false);
      expect(rateLimiter.checkLimit('user2', 1)).toBe(false);

      rateLimiter.reset();
      expect(rateLimiter.checkLimit('user1', 1)).toBe(true);
      expect(rateLimiter.checkLimit('user2', 1)).toBe(true);
    });

    it('tracks different identifiers separately', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user1', 5);
      }
      expect(rateLimiter.checkLimit('user1', 5)).toBe(false);
      expect(rateLimiter.checkLimit('user2', 5)).toBe(true);
    });
  });

  describe('createSanitizationMiddleware', () => {
    const middleware = createSanitizationMiddleware();

    beforeEach(() => {
      securityLogger.clearEvents();
    });

    describe('sanitizeUrl', () => {
      it('sanitizes valid URLs', () => {
        const result = middleware.sanitizeUrl('https://example.com/path');
        expect(result).toBe('https://example.com/path');
      });

      it('throws on invalid URL', () => {
        expect(() => middleware.sanitizeUrl('')).toThrow('Invalid URL provided');
        expect(() => middleware.sanitizeUrl('not-a-url')).toThrow('Invalid URL format');
      });

      it('throws on URL too long', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(SECURITY_CONFIG.MAX_URL_LENGTH);
        expect(() => middleware.sanitizeUrl(longUrl)).toThrow('URL too long');
      });

      it('throws on blocked IP', () => {
        expect(() => middleware.sanitizeUrl('http://127.0.0.1/path')).toThrow('Blocked IP address');
        expect(() => middleware.sanitizeUrl('http://10.0.0.1/path')).toThrow('Blocked IP address');
      });

      it('throws on blocked port', () => {
        expect(() => middleware.sanitizeUrl('http://example.com:22/path')).toThrow('Blocked port');
        expect(() => middleware.sanitizeUrl('http://example.com:3306/path')).toThrow('Blocked port');
      });

      it('logs blocked IP events', () => {
        securityLogger.clearEvents(); // Ensure clean state
        try {
          middleware.sanitizeUrl('http://127.0.0.1/path');
        } catch {
          // Expected - throws for blocked IP
        }
        const events = securityLogger.getEvents();
        const blockedIpEvents = events.filter(e => e.type === 'BLOCKED_IP');
        expect(blockedIpEvents.length).toBeGreaterThan(0);
      });
    });

    describe('detectInjectionAttempt', () => {
      it('detects SQL injection patterns', () => {
        expect(middleware.detectInjectionAttempt("' OR 1=1 --")).toBe(true);
        expect(middleware.detectInjectionAttempt('SELECT * FROM users')).toBe(true);
        expect(middleware.detectInjectionAttempt('DROP TABLE users')).toBe(true);
      });

      it('detects XSS patterns', () => {
        expect(middleware.detectInjectionAttempt('<script>alert(1)</script>')).toBe(true);
        expect(middleware.detectInjectionAttempt('<iframe src="evil.com">')).toBe(true);
        expect(middleware.detectInjectionAttempt('javascript:alert(1)')).toBe(true);
      });

      it('detects path traversal patterns', () => {
        expect(middleware.detectInjectionAttempt('../../../etc/passwd')).toBe(true);
        expect(middleware.detectInjectionAttempt('..\\..\\windows\\system32')).toBe(true);
      });

      it('returns false for safe input', () => {
        expect(middleware.detectInjectionAttempt('Hello World')).toBe(false);
        expect(middleware.detectInjectionAttempt('https://example.com')).toBe(false);
        expect(middleware.detectInjectionAttempt('test@email.com')).toBe(false);
      });
    });
  });

  describe('sanitizationMiddleware singleton', () => {
    it('is available and has expected methods', () => {
      expect(sanitizationMiddleware.sanitizeUrl).toBeInstanceOf(Function);
      expect(sanitizationMiddleware.detectInjectionAttempt).toBeInstanceOf(Function);
    });
  });

  describe('SecurityMonitor', () => {
    let monitor: SecurityMonitor;

    beforeEach(() => {
      monitor = new SecurityMonitor();
      securityLogger.clearEvents();
    });

    it('checkForAttacks does not alert when no events', () => {
      const errorSpy = vi.spyOn(console, 'error');
      monitor.checkForAttacks();
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('checkForAttacks triggers on critical events', () => {
      const errorSpy = vi.spyOn(console, 'error');

      securityLogger.logEvent({
        type: 'INJECTION_ATTEMPT',
        details: 'Critical attack',
        severity: 'CRITICAL'
      });

      monitor.checkForAttacks();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('SECURITY ALERT'));
      errorSpy.mockRestore();
    });

    it('checkForAttacks triggers on multiple high events', () => {
      const errorSpy = vi.spyOn(console, 'error');

      for (let i = 0; i < 15; i++) {
        securityLogger.logEvent({
          type: 'BLOCKED_URL',
          details: `Attack ${i}`,
          severity: 'HIGH'
        });
      }

      monitor.checkForAttacks();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('SECURITY ALERT'));
      errorSpy.mockRestore();
    });
  });

  describe('securityMonitor singleton', () => {
    it('is available and has checkForAttacks method', () => {
      expect(securityMonitor.checkForAttacks).toBeInstanceOf(Function);
    });
  });
});
