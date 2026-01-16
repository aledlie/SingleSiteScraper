import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedScraper } from '../../../src/scraper/enhancedScraper';
import { ProviderManager } from '../../../src/scraper/providers/manager';

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock ProviderManager
vi.mock('../../../src/scraper/providers/manager', () => {
  const mockScrape = vi.fn();
  const mockGetProvidersHealth = vi.fn();
  const mockGetMetrics = vi.fn();
  const mockResetMetrics = vi.fn();
  const mockListProviders = vi.fn();
  const mockGetProvider = vi.fn();
  const mockCleanup = vi.fn();

  return {
    ProviderManager: vi.fn().mockImplementation(() => ({
      scrape: mockScrape,
      getProvidersHealth: mockGetProvidersHealth,
      getMetrics: mockGetMetrics,
      resetMetrics: mockResetMetrics,
      listProviders: mockListProviders,
      getProvider: mockGetProvider,
      cleanup: mockCleanup,
    })),
    // Export mocks for test access
    __mocks: {
      mockScrape,
      mockGetProvidersHealth,
      mockGetMetrics,
      mockResetMetrics,
      mockListProviders,
      mockGetProvider,
      mockCleanup,
    },
  };
});

// Get mock functions
const getMocks = () => {
  const managerModule = vi.mocked(ProviderManager);
  const instance = managerModule.mock.results[0]?.value;
  return {
    mockScrape: instance?.scrape,
    mockGetProvidersHealth: instance?.getProvidersHealth,
    mockGetMetrics: instance?.getMetrics,
    mockResetMetrics: instance?.resetMetrics,
    mockListProviders: instance?.listProviders,
    mockGetProvider: instance?.getProvider,
    mockCleanup: instance?.cleanup,
  };
};

describe('EnhancedScraper', () => {
  let scraper: EnhancedScraper;

  const mockScrapingResult = {
    html: '<html><body>Test content</body></html>',
    url: 'https://example.com',
    status: 200,
    responseTime: 500,
    provider: 'MockProvider',
    cost: 0,
    metadata: { finalUrl: 'https://example.com' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    scraper = new EnhancedScraper();
  });

  describe('constructor', () => {
    it('creates a ProviderManager instance', () => {
      expect(ProviderManager).toHaveBeenCalled();
    });

    it('accepts options for ProviderManager', () => {
      const options = { maxRetries: 5 };
      new EnhancedScraper(options);
      expect(ProviderManager).toHaveBeenCalledWith(options);
    });

    it('uses default options when none provided', () => {
      new EnhancedScraper();
      expect(ProviderManager).toHaveBeenCalledWith({});
    });
  });

  describe('scrape', () => {
    it('calls providerManager.scrape with url and options', async () => {
      const mocks = getMocks();
      mocks.mockScrape?.mockResolvedValue(mockScrapingResult);

      const options = { timeout: 5000 };
      await scraper.scrape('https://example.com', options);

      expect(mocks.mockScrape).toHaveBeenCalledWith('https://example.com', options);
    });

    it('returns scraping result on success', async () => {
      const mocks = getMocks();
      mocks.mockScrape?.mockResolvedValue(mockScrapingResult);

      const result = await scraper.scrape('https://example.com');

      expect(result).toEqual(mockScrapingResult);
    });

    it('throws error for invalid URL (empty string)', async () => {
      await expect(scraper.scrape('')).rejects.toThrow('Invalid URL provided');
    });

    it('throws error for invalid URL (null)', async () => {
      await expect(scraper.scrape(null as unknown as string)).rejects.toThrow('Invalid URL provided');
    });

    it('throws error for invalid URL (undefined)', async () => {
      await expect(scraper.scrape(undefined as unknown as string)).rejects.toThrow('Invalid URL provided');
    });

    it('throws error for invalid URL (non-string)', async () => {
      await expect(scraper.scrape(123 as unknown as string)).rejects.toThrow('Invalid URL provided');
    });

    it('rethrows error from providerManager.scrape', async () => {
      const mocks = getMocks();
      const error = new Error('Scraping failed');
      mocks.mockScrape?.mockRejectedValue(error);

      await expect(scraper.scrape('https://example.com')).rejects.toThrow('Scraping failed');
    });

    it('logs error when scraping fails', async () => {
      const mocks = getMocks();
      const error = new Error('Network error');
      mocks.mockScrape?.mockRejectedValue(error);

      try {
        await scraper.scrape('https://example.com');
      } catch {
        // Expected
      }

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getHealth', () => {
    it('calls providerManager.getProvidersHealth', async () => {
      const mocks = getMocks();
      const healthData = {
        providers: [{ name: 'MockProvider', healthy: true }],
      };
      mocks.mockGetProvidersHealth?.mockResolvedValue(healthData);

      const result = await scraper.getHealth();

      expect(mocks.mockGetProvidersHealth).toHaveBeenCalled();
      expect(result).toEqual(healthData);
    });
  });

  describe('getMetrics', () => {
    it('calls providerManager.getMetrics', () => {
      const mocks = getMocks();
      const metricsData = {
        totalRequests: 100,
        successRate: 0.95,
      };
      mocks.mockGetMetrics?.mockReturnValue(metricsData);

      const result = scraper.getMetrics();

      expect(mocks.mockGetMetrics).toHaveBeenCalled();
      expect(result).toEqual(metricsData);
    });
  });

  describe('resetMetrics', () => {
    it('calls providerManager.resetMetrics', () => {
      const mocks = getMocks();

      scraper.resetMetrics();

      expect(mocks.mockResetMetrics).toHaveBeenCalled();
    });
  });

  describe('getProviders', () => {
    it('calls providerManager.listProviders', () => {
      const mocks = getMocks();
      const providers = ['Provider1', 'Provider2'];
      mocks.mockListProviders?.mockReturnValue(providers);

      const result = scraper.getProviders();

      expect(mocks.mockListProviders).toHaveBeenCalled();
      expect(result).toEqual(providers);
    });
  });

  describe('testProvider', () => {
    it('throws error if provider not found', async () => {
      const mocks = getMocks();
      mocks.mockGetProvider?.mockReturnValue(null);

      await expect(scraper.testProvider('NonExistent', 'https://example.com'))
        .rejects.toThrow('Provider NonExistent not found');
    });

    it('calls provider.scrape when provider exists', async () => {
      const mocks = getMocks();
      const mockProvider = {
        scrape: vi.fn().mockResolvedValue(mockScrapingResult),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      const result = await scraper.testProvider('MockProvider', 'https://example.com', { timeout: 5000 });

      expect(mocks.mockGetProvider).toHaveBeenCalledWith('MockProvider');
      expect(mockProvider.scrape).toHaveBeenCalledWith('https://example.com', { timeout: 5000 });
      expect(result).toEqual(mockScrapingResult);
    });
  });

  describe('benchmark', () => {
    it('benchmarks all providers with default URL', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['Provider1', 'Provider2']);

      const mockProvider1 = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue({
          ...mockScrapingResult,
          provider: 'Provider1',
          responseTime: 300,
        }),
        getPerformanceScore: vi.fn().mockReturnValue(0.9),
      };

      const mockProvider2 = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue({
          ...mockScrapingResult,
          provider: 'Provider2',
          responseTime: 600,
        }),
        getPerformanceScore: vi.fn().mockReturnValue(0.8),
      };

      mocks.mockGetProvider?.mockImplementation((name: string) => {
        if (name === 'Provider1') return mockProvider1;
        if (name === 'Provider2') return mockProvider2;
        return null;
      });

      const results = await scraper.benchmark();

      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(2);
      expect(results.get('Provider1')?.status).toBe('success');
      expect(results.get('Provider2')?.status).toBe('success');
    });

    it('handles unavailable providers', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['UnavailableProvider']);

      const mockProvider = {
        isAvailable: vi.fn().mockResolvedValue(false),
        getPerformanceScore: vi.fn().mockReturnValue(0),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      const results = await scraper.benchmark('https://test.com');

      expect(results.get('UnavailableProvider')?.status).toBe('unavailable');
    });

    it('handles provider scrape failures', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['FailingProvider']);

      const mockProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockRejectedValue(new Error('Scrape failed')),
        getPerformanceScore: vi.fn().mockReturnValue(0.5),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      const results = await scraper.benchmark('https://test.com');

      expect(results.get('FailingProvider')?.status).toBe('failed');
      expect(results.get('FailingProvider')?.error).toBe('Scrape failed');
    });

    it('skips null providers', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['NullProvider']);
      mocks.mockGetProvider?.mockReturnValue(null);

      const results = await scraper.benchmark('https://test.com');

      expect(results.size).toBe(0);
    });

    it('uses custom test URL', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['Provider1']);

      const mockProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue(mockScrapingResult),
        getPerformanceScore: vi.fn().mockReturnValue(0.9),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      await scraper.benchmark('https://custom-test.com');

      expect(mockProvider.scrape).toHaveBeenCalledWith('https://custom-test.com', { timeout: 10000 });
    });
  });

  describe('runTestSuite', () => {
    it('runs tests with default URLs when none provided', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['Provider1']);

      const mockProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue(mockScrapingResult),
        getPerformanceScore: vi.fn().mockReturnValue(0.9),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      const results = await scraper.runTestSuite();

      expect(results.testUrls).toContain('https://httpbin.org/html');
      expect(results.testUrls).toContain('https://example.com');
      expect(results.testUrls).toContain('https://quotes.toscrape.com/');
    });

    it('runs tests with custom URLs', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['Provider1']);

      const mockProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue(mockScrapingResult),
        getPerformanceScore: vi.fn().mockReturnValue(0.9),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      const customUrls = ['https://custom1.com', 'https://custom2.com'];
      const results = await scraper.runTestSuite(customUrls);

      expect(results.testUrls).toEqual(customUrls);
    });

    it('tracks success and failure counts', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['SuccessProvider', 'FailProvider']);

      const successProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue({ ...mockScrapingResult, cost: 0.001 }),
        getPerformanceScore: vi.fn().mockReturnValue(0.9),
      };

      const failProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockRejectedValue(new Error('Failed')),
        getPerformanceScore: vi.fn().mockReturnValue(0.5),
      };

      mocks.mockGetProvider?.mockImplementation((name: string) => {
        if (name === 'SuccessProvider') return successProvider;
        if (name === 'FailProvider') return failProvider;
        return null;
      });

      const results = await scraper.runTestSuite(['https://test.com']);

      expect(results.summary.totalSuccess).toBeGreaterThan(0);
      expect(results.summary.totalFailures).toBeGreaterThan(0);
    });

    it('calculates average response time for successful tests', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['Provider1']);

      const mockProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue({ ...mockScrapingResult, responseTime: 500 }),
        getPerformanceScore: vi.fn().mockReturnValue(0.9),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      const results = await scraper.runTestSuite(['https://test.com']);

      expect(results.summary.avgResponseTime).toBeGreaterThan(0);
    });

    it('tracks total cost', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue(['Provider1']);

      const mockProvider = {
        isAvailable: vi.fn().mockResolvedValue(true),
        scrape: vi.fn().mockResolvedValue({ ...mockScrapingResult, cost: 0.005 }),
        getPerformanceScore: vi.fn().mockReturnValue(0.9),
      };
      mocks.mockGetProvider?.mockReturnValue(mockProvider);

      const results = await scraper.runTestSuite(['https://test.com']);

      expect(results.summary.totalCost).toBeGreaterThan(0);
    });

    it('returns timestamp in results', async () => {
      const mocks = getMocks();
      mocks.mockListProviders?.mockReturnValue([]);

      const results = await scraper.runTestSuite(['https://test.com']);

      expect(results.timestamp).toBeDefined();
      expect(new Date(results.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('cleanup', () => {
    it('calls providerManager.cleanup', async () => {
      const mocks = getMocks();
      mocks.mockCleanup?.mockResolvedValue(undefined);

      await scraper.cleanup();

      expect(mocks.mockCleanup).toHaveBeenCalled();
    });
  });
});
