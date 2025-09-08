import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { LegacyProxyProvider } from '../../../../src/scraper/providers/legacy';
import { ScrapingOptions } from '../../../../src/scraper/providers/base';

// Mock console.warn to avoid noise in test output
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock fetch globally with proper setup
const mockFetch = vi.fn();

// Set up fetch mock before tests run
beforeAll(() => {
  Object.defineProperty(globalThis, 'fetch', {
    writable: true,
    configurable: true,
    value: mockFetch,
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('LegacyProxyProvider', () => {
  let provider: LegacyProxyProvider;

  beforeEach(() => {
    provider = new LegacyProxyProvider();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct name and capabilities', () => {
      expect(provider.name).toBe('Legacy-CORS-Proxy');
      expect(provider.capabilities).toEqual({
        supportsJavaScript: false,
        supportsStealth: false,
        isCommercial: false,
        costPerRequest: 0,
        maxConcurrency: 10,
        avgResponseTime: 2000,
      });
    });

    it('should have initial healthy status', () => {
      expect(provider.metrics.requestCount).toBe(0);
      expect(provider.metrics.successRate).toBe(0);
      expect(provider.healthCheck.isHealthy).toBe(true);
    });
  });

  describe('successful scraping', () => {
    it('should scrape using allorigins proxy successfully', async () => {
      const mockHtml = '<html><body>Test content</body></html>';
      const testUrl = 'https://example.com';

      // Reset and setup mock for this test
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({
          contents: mockHtml,
          status: { url: testUrl },
        }),
      });

      const result = await provider.scrape(testUrl);

      expect(result).toMatchObject({
        html: mockHtml,
        url: testUrl,
        status: 200,
        provider: 'Legacy-CORS-Proxy',
        cost: 0,
        metadata: {
          userAgent: expect.stringContaining('Mozilla'),
          finalUrl: testUrl,
          redirects: 0,
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('allorigins.win'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Mozilla'),
          }),
          signal: expect.any(AbortSignal),
          mode: 'cors',
          credentials: 'omit',
        })
      );
    }, 10000); // Increase timeout

    it('should scrape using direct proxy successfully', async () => {
      const mockHtml = '<html><body>Test content</body></html>';
      const testUrl = 'https://example.com';

      // Mock allorigins to fail, then direct proxy to succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Allorigins failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => mockHtml,
        });

      const result = await provider.scrape(testUrl);

      expect(result.html).toBe(mockHtml);
      expect(result.provider).toBe('Legacy-CORS-Proxy');
    });

    it('should respect custom options', async () => {
      const mockHtml = '<html><body>Test content</body></html>';
      const testUrl = 'https://example.com';
      const options: ScrapingOptions = {
        timeout: 10000,
        userAgent: 'CustomBot/1.0',
        headers: { 'X-Custom': 'test' },
        maxRetries: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: mockHtml }),
      });

      const result = await provider.scrape(testUrl, options);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'CustomBot/1.0',
            'X-Custom': 'test',
          }),
        })
      );

      expect(result.metadata.userAgent).toBe('CustomBot/1.0');
      expect(result.metadata.headers).toEqual({ 'X-Custom': 'test' });
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(provider.scrape('https://example.com')).rejects.toThrow(
        'All proxy attempts failed'
      );

      expect(provider.metrics.failureCount).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(provider.scrape('https://example.com')).rejects.toThrow(
        'All proxy attempts failed'
      );

      expect(provider.metrics.failureCount).toBeGreaterThan(0);
    });

    it('should handle timeout', async () => {
      // Mock fetch to hang (never resolve)
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const startTime = Date.now();
      
      await expect(provider.scrape('https://example.com', { timeout: 100 }))
        .rejects.toThrow();

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Should timeout quickly
    });

    it('should handle empty or short responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: 'short' }), // Too short
      });

      await expect(provider.scrape('https://example.com')).rejects.toThrow(
        'Received empty or too short response'
      );
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => '<html><body>Valid HTML content that is long enough to pass validation</body></html>',
      });

      // Should fall through to next proxy or handle the error
      await expect(provider.scrape('https://example.com')).rejects.toThrow();
    });
  });

  describe('proxy fallback', () => {
    it('should try multiple proxies on failure', async () => {
      const mockHtml = '<html><body>Success with second proxy</body></html>';

      mockFetch
        .mockRejectedValueOnce(new Error('First proxy failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => mockHtml,
        });

      const result = await provider.scrape('https://example.com');

      expect(result.html).toBe(mockHtml);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should implement exponential backoff on retries', async () => {
      const mockHtml = '<html><body>Success after retry</body></html>';

      // Fail first attempt, succeed on retry
      mockFetch
        .mockRejectedValueOnce(new Error('All proxies failed'))
        .mockRejectedValueOnce(new Error('All proxies failed'))
        .mockRejectedValueOnce(new Error('All proxies failed'))
        .mockRejectedValueOnce(new Error('All proxies failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ contents: mockHtml }),
        });

      const startTime = Date.now();
      const result = await provider.scrape('https://example.com', { maxRetries: 1 });
      const elapsed = Date.now() - startTime;

      expect(result.html).toBe(mockHtml);
      expect(elapsed).toBeGreaterThan(1000); // Should have delay from backoff
    });

    it('should respect maxRetries option', async () => {
      mockFetch.mockRejectedValue(new Error('Always fails'));

      const maxRetries = 2;
      await expect(
        provider.scrape('https://example.com', { maxRetries })
      ).rejects.toThrow();

      // Should try (maxRetries + 1) * number_of_proxies times
      const expectedCalls = (maxRetries + 1) * 4; // 4 proxies
      expect(mockFetch).toHaveBeenCalledTimes(expectedCalls);
    });
  });

  describe('availability checking', () => {
    it('should return true when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: '<html>Valid test response content</html>' }),
      });

      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when unavailable', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('should use a simple test endpoint for availability check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: '<html>Valid test response content</html>' }),
      });

      await provider.isAvailable();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('httpbin.org/status/200'),
        expect.any(Object)
      );
    });
  });

  describe('health status', () => {
    it('should return healthy status when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: '<html>Valid test response content</html>' }),
      });

      const health = await provider.getHealthStatus();

      expect(health).toMatchObject({
        isHealthy: true,
        lastCheck: expect.any(Date),
        message: 'All systems operational',
      });
    });

    it('should return unhealthy status when unavailable', async () => {
      mockFetch.mockRejectedValue(new Error('Service down'));

      const health = await provider.getHealthStatus();

      expect(health).toMatchObject({
        isHealthy: false,
        lastCheck: expect.any(Date),
        message: 'Service unavailable',
      });
    });

    it('should handle health check errors', async () => {
      // Mock isAvailable to throw
      vi.spyOn(provider, 'isAvailable').mockRejectedValue(new Error('Check failed'));

      const health = await provider.getHealthStatus();

      expect(health).toMatchObject({
        isHealthy: false,
        lastCheck: expect.any(Date),
        message: 'Health check failed: Check failed',
      });
    });
  });

  describe('metrics tracking', () => {
    it('should update metrics on successful scrape', async () => {
      const mockHtml = '<html><body>Test content</body></html>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: mockHtml }),
      });

      expect(provider.metrics.requestCount).toBe(0);

      await provider.scrape('https://example.com');

      expect(provider.metrics.requestCount).toBe(1);
      expect(provider.metrics.successCount).toBe(1);
      expect(provider.metrics.failureCount).toBe(0);
      expect(provider.metrics.successRate).toBe(1);
      expect(provider.metrics.totalCost).toBe(0);
    });

    it('should update metrics on failed scrape', async () => {
      mockFetch.mockRejectedValue(new Error('All proxies failed'));

      expect(provider.metrics.requestCount).toBe(0);

      await expect(provider.scrape('https://example.com')).rejects.toThrow();

      expect(provider.metrics.requestCount).toBe(1);
      expect(provider.metrics.successCount).toBe(0);
      expect(provider.metrics.failureCount).toBe(1);
      expect(provider.metrics.successRate).toBe(0);
    });

    it('should track response times', async () => {
      const mockHtml = '<html><body>Test content</body></html>';

      mockFetch.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() =>
            resolve({
              ok: true,
              status: 200,
              statusText: 'OK',
              json: async () => ({ contents: mockHtml }),
            }),
            100
          )
        )
      );

      await provider.scrape('https://example.com');

      expect(provider.metrics.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('URL encoding', () => {
    it('should properly encode URLs for allorigins proxy', async () => {
      const testUrl = 'https://example.com/path?param=value&other=test';
      const mockHtml = '<html><body>Test content</body></html>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: mockHtml }),
      });

      await provider.scrape(testUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(testUrl)),
        expect.any(Object)
      );
    });

    it('should handle special characters in URLs', async () => {
      const testUrl = 'https://example.com/path with spaces & special chars';
      const mockHtml = '<html><body>Test content</body></html>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ contents: mockHtml }),
      });

      await provider.scrape(testUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(testUrl)),
        expect.any(Object)
      );
    });
  });
});