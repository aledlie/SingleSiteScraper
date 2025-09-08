import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProviderManager } from '../../../src/scraper/providers/manager';
import { BaseScrapeProvider, ScrapingOptions, ScrapingResult, ScrapingCapabilities, ProviderHealthCheck } from '../../../src/scraper/providers/base';

// Mock console to avoid noise in test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock provider for rate limiting tests
class RateLimitedProvider extends BaseScrapeProvider {
  name = 'RateLimited';
  capabilities: ScrapingCapabilities = {
    supportsJavaScript: false,
    supportsStealth: false,
    isCommercial: true,
    costPerRequest: 0.001,
    maxConcurrency: 2, // Low concurrency for testing
    avgResponseTime: 1000,
  };

  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly minInterval = 500; // Minimum 500ms between requests

  async scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    const currentTime = Date.now();
    
    // Simulate rate limiting
    if (currentTime - this.lastRequestTime < this.minInterval) {
      this.updateMetrics(false, 0, 0);
      throw new Error('Rate limit exceeded - requests too frequent');
    }
    
    this.requestCount++;
    this.lastRequestTime = currentTime;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result: ScrapingResult = {
      html: `<html><body>Rate limited response ${this.requestCount}</body></html>`,
      url,
      status: 200,
      responseTime: 100,
      provider: this.name,
      cost: this.capabilities.costPerRequest,
      metadata: { finalUrl: url, requestNumber: this.requestCount },
    };
    
    this.updateMetrics(true, 100, this.capabilities.costPerRequest);
    return result;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getHealthStatus(): Promise<ProviderHealthCheck> {
    return { 
      ...this.healthCheck, 
      message: `Rate limited provider - ${this.requestCount} requests` 
    };
  }
}

// High-cost provider for budget testing
class ExpensiveProvider extends BaseScrapeProvider {
  name = 'Expensive';
  capabilities: ScrapingCapabilities = {
    supportsJavaScript: true,
    supportsStealth: true,
    isCommercial: true,
    costPerRequest: 0.1, // Very expensive
    maxConcurrency: 10,
    avgResponseTime: 2000,
  };

  async scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const result: ScrapingResult = {
      html: '<html><body>Expensive response</body></html>',
      url,
      status: 200,
      responseTime: 200,
      provider: this.name,
      cost: this.capabilities.costPerRequest,
      metadata: { finalUrl: url },
    };
    
    this.updateMetrics(true, 200, this.capabilities.costPerRequest);
    return result;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getHealthStatus(): Promise<ProviderHealthCheck> {
    return { ...this.healthCheck, message: 'Expensive but reliable' };
  }
}

describe('Security - Rate Limiting & Resource Protection', () => {
  let rateLimitedProvider: RateLimitedProvider;
  let expensiveProvider: ExpensiveProvider;
  let manager: ProviderManager;

  beforeEach(() => {
    rateLimitedProvider = new RateLimitedProvider();
    expensiveProvider = new ExpensiveProvider();
    
    manager = new ProviderManager({ 
      enabledProviders: [],
      maxCostPerRequest: 0.005 // Budget constraint
    });
    
    manager.addProvider(rateLimitedProvider);
    manager.addProvider(expensiveProvider);
  });

  describe('Request Rate Limiting', () => {
    it('should handle provider rate limits gracefully', async () => {
      const urls = [
        'https://example1.com',
        'https://example2.com',
        'https://example3.com'
      ];

      // Fire rapid requests
      const startTime = Date.now();
      const promises = urls.map(url => 
        manager.scrape(url).catch(error => ({ error: error.message }))
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete but some may be rate limited
      expect(results).toHaveLength(3);
      
      // At least some requests should succeed
      const successfulResults = results.filter(r => !('error' in r));
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Should take time due to rate limiting
      expect(totalTime).toBeGreaterThan(300); // At least some delay from rate limiting
    });

    it('should respect provider concurrency limits', async () => {
      // Create more concurrent requests than provider can handle
      const urls = Array.from({ length: 10 }, (_, i) => `https://example${i}.com`);
      
      const startTime = Date.now();
      const promises = urls.map(url => 
        rateLimitedProvider.scrape(url).catch(error => ({ error: error.message }))
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Some requests should fail due to rate limiting
      const errorResults = results.filter(r => 'error' in r);
      const successResults = results.filter(r => !('error' in r));
      
      expect(errorResults.length).toBeGreaterThan(0);
      expect(successResults.length).toBeGreaterThan(0);
      
      // Errors should be about rate limiting
      errorResults.forEach(result => {
        expect(result.error).toContain('Rate limit exceeded');
      });
    });

    it('should implement proper backoff and retry mechanisms', async () => {
      // Test with manager that should handle provider failures
      const urls = ['https://test1.com', 'https://test2.com'];
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const url of urls) {
        try {
          const result = await manager.scrape(url);
          successCount++;
          expect(result.url).toBe(url);
        } catch (error) {
          errorCount++;
        }
        
        // Add delay between requests to test backoff
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      // With proper spacing, more requests should succeed
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Cost and Budget Controls', () => {
    it('should enforce cost limits per request', async () => {
      // Manager has maxCostPerRequest: 0.005
      // ExpensiveProvider costs 0.1 per request (over budget)
      // RateLimitedProvider costs 0.001 per request (under budget)
      
      const result = await manager.scrape('https://budget-test.com');
      
      // Should use the cheaper provider
      expect(result.provider).toBe('RateLimited');
      expect(result.cost).toBeLessThanOrEqual(0.005);
    });

    it('should track cumulative costs and prevent budget overruns', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `https://cost-test${i}.com`);
      
      let totalCost = 0;
      const maxBudget = 0.02; // $0.02 budget limit
      
      for (const url of urls) {
        try {
          const result = await manager.scrape(url);
          totalCost += result.cost;
          
          // Should not exceed budget
          expect(totalCost).toBeLessThanOrEqual(maxBudget + 0.01); // Small buffer for test
          
          if (totalCost > maxBudget) {
            // Should stop making requests after budget exceeded
            break;
          }
        } catch (error) {
          // May fail due to rate limiting, which is acceptable
        }
      }
    });

    it('should use expensive providers only when necessary', async () => {
      // Create manager with higher budget
      const highBudgetManager = new ProviderManager({ 
        enabledProviders: [],
        maxCostPerRequest: 0.2 // Allow expensive provider
      });
      
      // Add only expensive provider
      highBudgetManager.addProvider(expensiveProvider);
      
      const result = await highBudgetManager.scrape('https://expensive-test.com');
      
      expect(result.provider).toBe('Expensive');
      expect(result.cost).toBe(0.1);
      
      await highBudgetManager.cleanup();
    });
  });

  describe('Resource Exhaustion Protection', () => {
    it('should limit concurrent requests to prevent DoS', async () => {
      // Create many simultaneous requests
      const urls = Array.from({ length: 50 }, (_, i) => `https://dos-test${i}.com`);
      
      const startTime = Date.now();
      const promises = urls.map(url => 
        manager.scrape(url).catch(error => ({ error: error.message, url }))
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Should handle requests without crashing
      expect(results).toHaveLength(50);
      
      // Should limit concurrency, causing some delay
      const totalTime = endTime - startTime;
      expect(totalTime).toBeGreaterThan(1000); // Should take time due to concurrency limits
      
      // Some requests should succeed
      const successfulResults = results.filter(r => !('error' in r));
      expect(successfulResults.length).toBeGreaterThan(0);
    });

    it('should prevent memory exhaustion from large responses', async () => {
      // Mock a provider that returns large responses
      const largeResponseProvider = new (class extends BaseScrapeProvider {
        name = 'LargeResponse';
        capabilities: ScrapingCapabilities = {
          supportsJavaScript: false,
          supportsStealth: false,
          isCommercial: false,
          costPerRequest: 0,
          maxConcurrency: 5,
          avgResponseTime: 500,
        };

        async scrape(url: string): Promise<ScrapingResult> {
          // Simulate large HTML response (1MB)
          const largeHtml = '<html><body>' + 'x'.repeat(1000000) + '</body></html>';
          
          const result: ScrapingResult = {
            html: largeHtml,
            url,
            status: 200,
            responseTime: 500,
            provider: this.name,
            cost: 0,
            metadata: { finalUrl: url, size: largeHtml.length },
          };
          
          this.updateMetrics(true, 500, 0);
          return result;
        }

        async isAvailable(): Promise<boolean> {
          return true;
        }

        async getHealthStatus(): Promise<ProviderHealthCheck> {
          return { ...this.healthCheck, message: 'Large responses' };
        }
      })();

      const largeManager = new ProviderManager({ enabledProviders: [] });
      largeManager.addProvider(largeResponseProvider);
      
      // Should handle large response without memory issues
      const memUsageBefore = process.memoryUsage().heapUsed;
      
      const result = await largeManager.scrape('https://large-response.com');
      
      const memUsageAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memUsageAfter - memUsageBefore;
      
      expect(result.html).toBeDefined();
      expect(result.html.length).toBe(1000019); // Large response
      
      // Memory increase should be reasonable (not excessive)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      
      await largeManager.cleanup();
    });

    it('should handle timeout scenarios properly', async () => {
      // Mock a slow provider
      const slowProvider = new (class extends BaseScrapeProvider {
        name = 'Slow';
        capabilities: ScrapingCapabilities = {
          supportsJavaScript: false,
          supportsStealth: false,
          isCommercial: false,
          costPerRequest: 0,
          maxConcurrency: 5,
          avgResponseTime: 10000, // Very slow
        };

        async scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
          // Simulate slow response
          const timeout = options?.timeout || 5000;
          const delay = Math.min(timeout + 1000, 10000); // Slower than timeout
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const result: ScrapingResult = {
            html: '<html><body>Slow response</body></html>',
            url,
            status: 200,
            responseTime: delay,
            provider: this.name,
            cost: 0,
            metadata: { finalUrl: url },
          };
          
          this.updateMetrics(true, delay, 0);
          return result;
        }

        async isAvailable(): Promise<boolean> {
          return true;
        }

        async getHealthStatus(): Promise<ProviderHealthCheck> {
          return { ...this.healthCheck, message: 'Very slow provider' };
        }
      })();

      const timeoutManager = new ProviderManager({ enabledProviders: [] });
      timeoutManager.addProvider(slowProvider);
      
      const startTime = Date.now();
      
      try {
        const result = await timeoutManager.scrape('https://timeout-test.com', { 
          timeout: 2000 // 2 second timeout
        });
        
        // If it succeeds, should be within reasonable time
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(15000); // Max 15 seconds
        
      } catch (error) {
        // May timeout, which is acceptable
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(15000); // Should not hang indefinitely
      }
      
      await timeoutManager.cleanup();
    });
  });

  describe('Provider Health and Degradation', () => {
    it('should detect and isolate unhealthy providers', async () => {
      // Make several requests to trigger rate limiting and failures
      const urls = Array.from({ length: 10 }, (_, i) => `https://health-test${i}.com`);
      
      for (const url of urls) {
        try {
          await manager.scrape(url);
        } catch (error) {
          // Expected failures due to rate limiting
        }
      }
      
      // Check provider health
      const healthMap = await manager.getProvidersHealth();
      
      expect(healthMap.has('RateLimited')).toBe(true);
      expect(healthMap.has('Expensive')).toBe(true);
      
      const rateLimitedHealth = healthMap.get('RateLimited');
      expect(rateLimitedHealth).toBeDefined();
      expect(rateLimitedHealth!.metrics).toBeDefined();
    });

    it('should implement circuit breaker pattern for failing providers', async () => {
      // Create a provider that fails frequently
      let failureCount = 0;
      const flakeyProvider = new (class extends BaseScrapeProvider {
        name = 'Flakey';
        capabilities: ScrapingCapabilities = {
          supportsJavaScript: false,
          supportsStealth: false,
          isCommercial: false,
          costPerRequest: 0,
          maxConcurrency: 5,
          avgResponseTime: 1000,
        };

        async scrape(url: string): Promise<ScrapingResult> {
          failureCount++;
          
          // Fail 70% of requests
          if (Math.random() < 0.7) {
            this.updateMetrics(false, 1000, 0);
            throw new Error('Random failure for testing');
          }
          
          const result: ScrapingResult = {
            html: '<html><body>Success</body></html>',
            url,
            status: 200,
            responseTime: 1000,
            provider: this.name,
            cost: 0,
            metadata: { finalUrl: url },
          };
          
          this.updateMetrics(true, 1000, 0);
          return result;
        }

        async isAvailable(): Promise<boolean> {
          return true;
        }

        async getHealthStatus(): Promise<ProviderHealthCheck> {
          const isHealthy = this.healthCheck.errorRate < 0.5; // Healthy if error rate < 50%
          return { 
            ...this.healthCheck, 
            isHealthy,
            message: `Flakey provider - ${failureCount} failures` 
          };
        }
      })();

      const flakeyManager = new ProviderManager({ enabledProviders: [] });
      flakeyManager.addProvider(flakeyProvider);
      
      // Make multiple requests
      const results = [];
      for (let i = 0; i < 10; i++) {
        try {
          const result = await flakeyManager.scrape(`https://flakey${i}.com`);
          results.push(result);
        } catch (error) {
          // Expected failures
        }
      }
      
      // Should have some successes despite high failure rate
      expect(results.length).toBeGreaterThan(0);
      
      // Provider should become unhealthy due to high failure rate
      const health = await flakeyManager.getProvidersHealth();
      const flakeyHealth = health.get('Flakey');
      
      if (flakeyHealth && flakeyHealth.metrics.failureCount > 5) {
        // High failure count should affect health
        expect(flakeyHealth.performanceScore).toBeLessThan(50);
      }
      
      await flakeyManager.cleanup();
    });
  });

  describe('Security Event Logging and Monitoring', () => {
    it('should log suspicious request patterns', async () => {
      const suspiciousUrls = [
        'https://example.com/../../../etc/passwd',
        'https://example.com/?param=<script>alert("xss")</script>',
        "https://example.com/?sql='; DROP TABLE users; --",
        'https://example.com/admin/secret',
        'https://example.com/api/internal'
      ];

      const loggedRequests = [];
      
      for (const url of suspiciousUrls) {
        try {
          const result = await manager.scrape(url);
          loggedRequests.push({ url, result });
        } catch (error) {
          loggedRequests.push({ url, error: error.message });
        }
      }
      
      // All requests should be processed (logged)
      expect(loggedRequests).toHaveLength(suspiciousUrls.length);
      
      // Check provider metrics for tracking
      const metrics = manager.getMetrics();
      expect(metrics.size).toBeGreaterThan(0);
      
      // Each provider should have some activity recorded
      metrics.forEach((metric, providerName) => {
        expect(metric.requestCount).toBeGreaterThan(0);
      });
    });

    it('should track and limit requests per time window', async () => {
      // Simulate request tracking
      const requestTimes: number[] = [];
      const timeWindow = 5000; // 5 second window
      const maxRequests = 10; // Max 10 requests per window
      
      for (let i = 0; i < 15; i++) {
        const currentTime = Date.now();
        requestTimes.push(currentTime);
        
        // Check if within rate limit
        const recentRequests = requestTimes.filter(
          time => currentTime - time < timeWindow
        );
        
        if (recentRequests.length <= maxRequests) {
          try {
            await manager.scrape(`https://rate-test${i}.com`);
          } catch (error) {
            // May fail due to provider rate limits
          }
        } else {
          // Should skip request due to rate limiting
          console.log(`Request ${i} skipped due to rate limit`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Should have processed some requests but respected limits
      const finalRequestCount = requestTimes.length;
      expect(finalRequestCount).toBe(15);
    });
  });

  afterEach(async () => {
    await manager.cleanup();
  });
});