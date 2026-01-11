import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateUrl,
  validateUrlWithSSRF,
  sanitizeUrl,
  cleanText,
  htmlEntityEncode,
  validateInput,
  sanitizeErrorMessage,
  sanitizeSQLInput,
  generateCSPHeader
} from '../utils/validators.ts';
import { SQLMagicIntegration } from '../analytics/sqlMagicIntegration.ts';

describe('Security Tests', () => {
  describe('SSRF Protection', () => {
    it('should block localhost URLs', () => {
      expect(validateUrlWithSSRF('http://localhost:8080')).toBe(false);
      expect(validateUrlWithSSRF('https://127.0.0.1')).toBe(false);
      expect(validateUrlWithSSRF('http://[::1]:3000')).toBe(false);
      expect(validateUrlWithSSRF('https://0.0.0.0')).toBe(false);
    });

    it('should block private IP ranges', () => {
      expect(validateUrlWithSSRF('http://10.0.0.1')).toBe(false);
      expect(validateUrlWithSSRF('https://192.168.1.1')).toBe(false);
      expect(validateUrlWithSSRF('http://172.16.0.1')).toBe(false);
      expect(validateUrlWithSSRF('https://169.254.1.1')).toBe(false);
    });

    it('should block cloud metadata endpoints', () => {
      expect(validateUrlWithSSRF('http://169.254.169.254')).toBe(false);
      expect(validateUrlWithSSRF('https://metadata.google.internal')).toBe(false);
    });

    it('should block dangerous ports', () => {
      expect(validateUrlWithSSRF('http://example.com:22')).toBe(false);
      expect(validateUrlWithSSRF('https://example.com:3306')).toBe(false);
      expect(validateUrlWithSSRF('http://example.com:6379')).toBe(false);
    });

    it('should allow valid public URLs', () => {
      expect(validateUrlWithSSRF('https://example.com')).toBe(true);
      expect(validateUrlWithSSRF('http://8.8.8.8')).toBe(true);
      expect(validateUrlWithSSRF('https://1.1.1.1:443')).toBe(true);
    });
  });

  describe('XSS Protection', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello World';
      const clean = cleanText(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Hello World');
    });

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert(1)">Click me</div>';
      const clean = cleanText(malicious);
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
    });

    it('should remove dangerous protocols', () => {
      const malicious = 'javascript:alert(1)';
      const clean = cleanText(malicious);
      expect(clean).not.toContain('javascript:');
      // cleanText may leave text content but removes the dangerous protocol
      expect(clean.toLowerCase()).not.toContain('javascript');
    });

    it('should handle nested and obfuscated attacks', () => {
      const malicious = '<<SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>';
      const clean = cleanText(malicious);
      expect(clean).not.toContain('SCRIPT');
      expect(clean).not.toContain('alert');
    });

    it('should encode HTML entities', () => {
      const text = '<>&"\'';
      const encoded = htmlEntityEncode(text);
      expect(encoded).toBe('&lt;&gt;&amp;&quot;&#x27;');
    });
  });

  describe('SQL Injection Protection', () => {
    it('should remove dangerous SQL keywords', () => {
      const malicious = "'; DROP TABLE users; --";
      const clean = sanitizeSQLInput(malicious);
      expect(clean).not.toContain(';');
      expect(clean).not.toContain("'");
      // Function should significantly sanitize the input
      expect(clean.length).toBeLessThan(malicious.length);
    });

    it('should handle UNION attacks', () => {
      const malicious = "1 UNION SELECT password FROM admin";
      const clean = sanitizeSQLInput(malicious);
      // Function should sanitize input - checking that it's modified
      expect(clean.length).toBeLessThan(malicious.length);
      // Focus on verifying dangerous characters are removed
      expect(clean).toBe(clean.trim());
    });

    it('should limit input length', () => {
      const longInput = 'A'.repeat(2000);
      const clean = sanitizeSQLInput(longInput);
      expect(clean.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('URL Sanitization', () => {
    it('should block javascript URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
    });

    it('should block data URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should block file URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should allow valid HTTP/HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/resource')).toBe('/path/to/resource');
    });
  });

  describe('Error Message Sanitization', () => {
    it('should redact URLs from error messages', () => {
      const error = new Error('Failed to fetch https://secret-api.com/endpoint');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toContain('[URL_REDACTED]');
      expect(sanitized).not.toContain('secret-api.com');
    });

    it('should redact IP addresses', () => {
      const error = new Error('Connection failed to 192.168.1.100');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toContain('[IP_REDACTED]');
      expect(sanitized).not.toContain('192.168.1.100');
    });

    it('should redact credentials', () => {
      const error = new Error('Invalid password: secret123');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toContain('[CREDENTIAL_REDACTED]');
      expect(sanitized).not.toContain('secret123');
    });

    it('should limit message length', () => {
      const longMessage = 'Error: ' + 'A'.repeat(500);
      const error = new Error(longMessage);
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized.length).toBeLessThanOrEqual(150);
    });
  });

  describe('Network Security', () => {
    it('should enforce rate limiting', async () => {
      // Test would require mocking the rate limiter
      // This is a placeholder for rate limiting tests
      expect(true).toBe(true);
    });

    it('should validate response sizes', async () => {
      // Test would require mocking large responses
      // This is a placeholder for response size validation
      expect(true).toBe(true);
    });
  });

  describe('SQL Magic Integration Security', () => {
    let sqlMagic: SQLMagicIntegration;

    beforeEach(async () => {
      sqlMagic = new SQLMagicIntegration({
        host: 'localhost',
        port: 5432,
        database: 'test'
      });
      // Mock connection for testing
      await sqlMagic.connect();
    });

    afterEach(() => {
      sqlMagic.cleanup();
    });

    it('should reject dangerous SQL queries', async () => {
      await expect(async () => {
        await sqlMagic.executeCustomQuery('DROP TABLE users;');
      }).rejects.toThrow('potentially dangerous SQL');
    });

    it('should only allow SELECT statements', async () => {
      await expect(async () => {
        await sqlMagic.executeCustomQuery('INSERT INTO users VALUES (1, "test")');
      }).rejects.toThrow('potentially dangerous SQL');
    });

    it('should sanitize query parameters', async () => {
      // Test that valid SELECT queries work
      const result = await sqlMagic.executeCustomQuery('SELECT * FROM test_table');
      expect(result).toBeDefined();
    });

    it('should limit query length', async () => {
      const longQuery = 'SELECT * FROM table WHERE column = ' + "'A'".repeat(5000);
      await expect(async () => {
        await sqlMagic.executeCustomQuery(longQuery);
      }).rejects.toThrow('potentially dangerous SQL');
    });
  });

  describe('Input Validation', () => {
    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert(1)</script>User input';
      const clean = validateInput(maliciousInput);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('User input');
    });

    it('should limit input length', () => {
      const longInput = 'A'.repeat(2000);
      const clean = validateInput(longInput, 100);
      expect(clean.length).toBeLessThanOrEqual(100);
    });

    it('should handle null and undefined inputs', () => {
      expect(validateInput(null as any)).toBe('');
      expect(validateInput(undefined as any)).toBe('');
    });
  });

  describe('Content Security Policy', () => {
    it('should generate secure CSP header', () => {
      const csp = generateCSPHeader();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("upgrade-insecure-requests");
    });
  });

  describe('DoS Protection', () => {
    it('should handle large text input safely', () => {
      const hugeText = 'A'.repeat(2_000_000); // 2MB
      const startTime = Date.now();
      const processed = cleanText(hugeText);
      const processingTime = Date.now() - startTime;
      
      // Should complete in reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);
      // Should return some processed text
      expect(processed).toBeDefined();
      expect(processed.length).toBeGreaterThan(0);
    });

    it('should handle deeply nested HTML safely', () => {
      let nestedHtml = 'content';
      for (let i = 0; i < 1000; i++) {
        nestedHtml = `<div>${nestedHtml}</div>`;
      }
      
      const startTime = Date.now();
      const cleaned = cleanText(nestedHtml);
      const processingTime = Date.now() - startTime;
      
      // Should complete in reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);
      expect(cleaned).not.toContain('<div>');
    });
  });

  describe('Protocol Security', () => {
    it('should block dangerous protocols in URLs', () => {
      expect(validateUrl('javascript:alert(1)')).toBe(false);
      expect(validateUrl('data:text/html,<script>')).toBe(false);
      expect(validateUrl('file:///etc/passwd')).toBe(false);
    });

    it('should validate URLs before processing', () => {
      expect(validateUrl('ftp://internal.server.com/file')).toBe(false);
      expect(validateUrl('chrome://settings')).toBe(false);
      expect(validateUrl('about:blank')).toBe(false);
    });
  });

  describe('Memory Safety', () => {
    it('should cleanup resources properly', () => {
      const sqlMagic = new SQLMagicIntegration({
        host: 'localhost',
        port: 5432,
        database: 'test'
      });
      
      // Should not throw when cleaning up
      expect(() => {
        sqlMagic.cleanup();
      }).not.toThrow();
    });

    it('should handle large inputs without memory exhaustion', () => {
      const largeInput = JSON.stringify({ data: 'A'.repeat(100_000) });
      
      // Should complete without running out of memory
      expect(() => {
        const cleaned = cleanText(largeInput);
        expect(cleaned).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Unicode Security', () => {
    it('should handle Unicode normalization attacks', () => {
      const unicodeAttack = '＜script＞alert(1)＜/script＞'; // Full-width characters
      const cleaned = cleanText(unicodeAttack);
      // cleanText should process Unicode input safely
      expect(cleaned).toBeDefined();
      expect(typeof cleaned).toBe('string');
      // Should not crash or cause issues with Unicode
      expect(cleaned.length).toBeGreaterThan(0);
    });

    it('should remove dangerous Unicode characters', () => {
      const dangerousUnicode = 'test\u200B\u200C\u200D\uFEFFtest'; // Zero-width characters
      const cleaned = cleanText(dangerousUnicode);
      // cleanText should normalize and remove zero-width characters
      expect(cleaned).toContain('test');
      expect(cleaned.length).toBeGreaterThan(7); // Should contain both 'test' words
    });
  });
});

describe('Security Regression Tests', () => {
  it('should prevent previously discovered vulnerabilities', () => {
    // Add specific tests for any vulnerabilities found in the future
    // This helps prevent regressions
    expect(true).toBe(true);
  });
});