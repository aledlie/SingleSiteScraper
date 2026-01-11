import { describe, it, expect, beforeEach } from 'vitest';
import { 
  BaseScrapeProvider, 
  ScrapingCapabilities, 
  ScrapingOptions, 
  ScrapingResult,
  ProviderHealthCheck
} from '../../../../src/scraper/providers/base';

// Mock implementation for testing
class MockScrapeProvider extends BaseScrapeProvider {
  name = 'MockProvider';
  capabilities: ScrapingCapabilities = {
    supportsJavaScript: true,
    supportsStealth: true,
    isCommercial: false,
    costPerRequest: 0.001,
    maxConcurrency: 5,
    avgResponseTime: 1000,
  };

  async scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    const responseTime = 1500;

    // Simulate scraping
    const result: ScrapingResult = {
      html: '<html><body>Mock content</body></html>',
      url,
      status: 200,
      responseTime,
      provider: this.name,
      cost: this.capabilities.costPerRequest,
      metadata: {
        userAgent: options?.userAgent || 'MockBot/1.0',
        headers: options?.headers || {},
        finalUrl: url,
        redirects: 0,
      },
    };

    this.updateMetrics(true, responseTime, this.capabilities.costPerRequest);
    return result;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getHealthStatus(): Promise<ProviderHealthCheck> {
    return {
      ...this.healthCheck,
      message: 'Mock provider is healthy',
    };
  }
}

class FailingMockProvider extends BaseScrapeProvider {
  name = 'FailingMockProvider';
  capabilities: ScrapingCapabilities = {
    supportsJavaScript: false,
    supportsStealth: false,
    isCommercial: true,
    costPerRequest: 0.005,
    maxConcurrency: 2,
    avgResponseTime: 3000,
  };

  async scrape(_url: string): Promise<ScrapingResult> {
    const responseTime = 3000;
    this.updateMetrics(false, responseTime, 0);
    throw new Error('Mock provider failure');
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async getHealthStatus(): Promise<ProviderHealthCheck> {
    return {
      ...this.healthCheck,
      isHealthy: false,
      message: 'Mock provider is unhealthy',
    };
  }
}

describe('BaseScrapeProvider', () => {
  let mockProvider: MockScrapeProvider;
  let failingProvider: FailingMockProvider;

  beforeEach(() => {
    mockProvider = new MockScrapeProvider();
    failingProvider = new FailingMockProvider();
  });

  describe('initialization', () => {
    it('should initialize with default metrics', () => {
      expect(mockProvider.metrics).toEqual({
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
        totalCost: 0,
        lastUsed: expect.any(Date),
        successRate: 0,
      });
    });

    it('should initialize with healthy status', () => {
      expect(mockProvider.healthCheck.isHealthy).toBe(true);
      expect(mockProvider.healthCheck.errorRate).toBe(0);
    });

    it('should have correct capabilities', () => {
      expect(mockProvider.capabilities).toEqual({
        supportsJavaScript: true,
        supportsStealth: true,
        isCommercial: false,
        costPerRequest: 0.001,
        maxConcurrency: 5,
        avgResponseTime: 1000,
      });
    });
  });

  describe('scraping functionality', () => {
    it('should successfully scrape a URL', async () => {
      const url = 'https://example.com';
      const result = await mockProvider.scrape(url);

      expect(result).toEqual({
        html: '<html><body>Mock content</body></html>',
        url,
        status: 200,
        responseTime: 1500,
        provider: 'MockProvider',
        cost: 0.001,
        metadata: {
          userAgent: 'MockBot/1.0',
          headers: {},
          finalUrl: url,
          redirects: 0,
        },
      });
    });

    it('should respect scraping options', async () => {
      const url = 'https://example.com';
      const options: ScrapingOptions = {
        timeout: 5000,
        userAgent: 'CustomBot/2.0',
        headers: { 'X-Custom': 'test' },
        stealth: true,
      };

      const result = await mockProvider.scrape(url, options);

      expect(result.metadata.userAgent).toBe('CustomBot/2.0');
      expect(result.metadata.headers).toEqual({ 'X-Custom': 'test' });
    });

    it('should handle provider failures', async () => {
      const url = 'https://example.com';
      
      await expect(failingProvider.scrape(url)).rejects.toThrow('Mock provider failure');
      
      expect(failingProvider.metrics.requestCount).toBe(1);
      expect(failingProvider.metrics.failureCount).toBe(1);
      expect(failingProvider.metrics.successCount).toBe(0);
    });
  });

  describe('metrics tracking', () => {
    it('should update metrics after successful scraping', async () => {
      const url = 'https://example.com';
      await mockProvider.scrape(url);

      expect(mockProvider.metrics.requestCount).toBe(1);
      expect(mockProvider.metrics.successCount).toBe(1);
      expect(mockProvider.metrics.failureCount).toBe(0);
      expect(mockProvider.metrics.successRate).toBe(1);
      expect(mockProvider.metrics.avgResponseTime).toBe(1500);
      expect(mockProvider.metrics.totalCost).toBe(0.001);
      expect(mockProvider.metrics.lastUsed).toBeInstanceOf(Date);
    });

    it('should update metrics after failed scraping', async () => {
      const url = 'https://example.com';
      
      try {
        await failingProvider.scrape(url);
      } catch {
        // Expected failure
      }

      expect(failingProvider.metrics.requestCount).toBe(1);
      expect(failingProvider.metrics.successCount).toBe(0);
      expect(failingProvider.metrics.failureCount).toBe(1);
      expect(failingProvider.metrics.successRate).toBe(0);
      expect(failingProvider.metrics.avgResponseTime).toBe(3000);
      expect(failingProvider.metrics.totalCost).toBe(0);
    });

    it('should calculate rolling average response time', async () => {
      // First request
      await mockProvider.scrape('https://example1.com');
      expect(mockProvider.metrics.avgResponseTime).toBe(1500);

      // Mock second request with different response time
      mockProvider.updateMetrics(true, 2000, 0.001);
      expect(mockProvider.metrics.avgResponseTime).toBe(1750); // (1500 + 2000) / 2
    });

    it('should reset metrics correctly', () => {
      // First make some requests
      mockProvider.updateMetrics(true, 1000, 0.001);
      mockProvider.updateMetrics(false, 2000, 0);
      
      expect(mockProvider.metrics.requestCount).toBe(2);
      
      mockProvider.resetMetrics();
      
      expect(mockProvider.metrics).toEqual({
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
        totalCost: 0,
        lastUsed: expect.any(Date),
        successRate: 0,
      });
    });
  });

  describe('health status', () => {
    it('should maintain healthy status with good metrics', async () => {
      await mockProvider.scrape('https://example.com');
      
      expect(mockProvider.healthCheck.isHealthy).toBe(true);
      expect(mockProvider.healthCheck.errorRate).toBe(0);
      expect(mockProvider.healthCheck.lastCheck).toBeInstanceOf(Date);
    });

    it('should become unhealthy with high error rate', () => {
      // Simulate high failure rate
      for (let i = 0; i < 10; i++) {
        mockProvider.updateMetrics(false, 1000, 0);
      }
      
      expect(mockProvider.healthCheck.isHealthy).toBe(false);
      expect(mockProvider.healthCheck.errorRate).toBe(1);
    });

    it('should become unhealthy with low success rate', () => {
      // 3 failures, 2 successes = 40% success rate (below 50% threshold)
      mockProvider.updateMetrics(false, 1000, 0);
      mockProvider.updateMetrics(false, 1000, 0);
      mockProvider.updateMetrics(false, 1000, 0);
      mockProvider.updateMetrics(true, 1000, 0.001);
      mockProvider.updateMetrics(true, 1000, 0.001);
      
      expect(mockProvider.metrics.successRate).toBe(0.4);
      expect(mockProvider.healthCheck.isHealthy).toBe(false);
    });

    it('should return correct health status from provider', async () => {
      const healthStatus = await mockProvider.getHealthStatus();
      
      expect(healthStatus).toEqual({
        isHealthy: true,
        lastCheck: expect.any(Date),
        errorRate: 0,
        avgResponseTime: 0,
        message: 'Mock provider is healthy',
      });
    });
  });

  describe('performance scoring', () => {
    it('should calculate performance score for healthy provider', async () => {
      // Make successful requests to establish good metrics
      await mockProvider.scrape('https://example1.com');
      await mockProvider.scrape('https://example2.com');
      
      const score = mockProvider.getPerformanceScore();
      
      expect(score).toBeGreaterThan(50); // Should have decent score
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate low performance score for failing provider', () => {
      // Simulate failures
      for (let i = 0; i < 5; i++) {
        failingProvider.updateMetrics(false, 3000, 0);
      }
      
      const score = failingProvider.getPerformanceScore();
      
      expect(score).toBeLessThan(50); // Should have low score due to failures
    });

    it('should weight success rate heavily in performance score', () => {
      // Perfect success rate
      mockProvider.updateMetrics(true, 500, 0.001);
      mockProvider.updateMetrics(true, 500, 0.001);
      const goodScore = mockProvider.getPerformanceScore();
      
      // Reset and simulate poor success rate
      mockProvider.resetMetrics();
      mockProvider.updateMetrics(true, 500, 0.001);
      mockProvider.updateMetrics(false, 500, 0);
      mockProvider.updateMetrics(false, 500, 0);
      mockProvider.updateMetrics(false, 500, 0);
      const badScore = mockProvider.getPerformanceScore();
      
      expect(goodScore).toBeGreaterThan(badScore);
    });
  });

  describe('availability checking', () => {
    it('should report availability for healthy provider', async () => {
      const available = await mockProvider.isAvailable();
      expect(available).toBe(true);
    });

    it('should report unavailability for failing provider', async () => {
      const available = await failingProvider.isAvailable();
      expect(available).toBe(false);
    });
  });
});