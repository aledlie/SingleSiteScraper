/**
 * Enhanced Scraper - Main class that integrates with the existing scrapeWebsite function
 * Provides advanced scraping capabilities with intelligent provider selection
 */

import { ProviderManager, ProviderManagerOptions, FallbackStrategy } from './providers/manager';
import { ScrapingOptions, ScrapingResult } from './providers/base';

export interface EnhancedScrapingOptions extends ScrapingOptions {
  strategy?: FallbackStrategy;
  maxCostPerRequest?: number;
  enabledProviders?: string[];
}

export class EnhancedScraper {
  private providerManager: ProviderManager;

  constructor(options: ProviderManagerOptions = {}) {
    this.providerManager = new ProviderManager(options);
  }

  /**
   * Scrape a website using the enhanced provider system
   */
  async scrape(url: string, options?: EnhancedScrapingOptions): Promise<ScrapingResult> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    try {
      const result = await this.providerManager.scrape(url, options);
      return result;
    } catch (error) {
      console.error(`Enhanced scraping failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get health status of all providers
   */
  async getHealth() {
    return await this.providerManager.getProvidersHealth();
  }

  /**
   * Get performance metrics for all providers
   */
  getMetrics() {
    return this.providerManager.getMetrics();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics() {
    this.providerManager.resetMetrics();
  }

  /**
   * List available providers
   */
  getProviders() {
    return this.providerManager.listProviders();
  }

  /**
   * Test a specific provider with a URL
   */
  async testProvider(providerName: string, url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    const provider = this.providerManager.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return await provider.scrape(url, options);
  }

  /**
   * Benchmark all providers with a test URL
   */
  async benchmark(testUrl: string = 'https://httpbin.org/html'): Promise<Map<string, any>> {
    const results = new Map();
    const providers = this.providerManager.listProviders();

    console.log(`🔍 Benchmarking ${providers.length} providers with ${testUrl}`);

    for (const providerName of providers) {
      const provider = this.providerManager.getProvider(providerName);
      if (!provider) continue;

      const startTime = Date.now();
      
      try {
        const isAvailable = await provider.isAvailable();
        
        if (!isAvailable) {
          results.set(providerName, {
            status: 'unavailable',
            error: 'Provider health check failed',
            responseTime: Date.now() - startTime,
          });
          continue;
        }

        const result = await provider.scrape(testUrl, { timeout: 10000 });
        
        results.set(providerName, {
          status: 'success',
          responseTime: result.responseTime,
          cost: result.cost,
          htmlLength: result.html.length,
          provider: result.provider,
          performanceScore: provider.getPerformanceScore(),
        });

        console.log(`✅ ${providerName}: ${result.responseTime}ms, ${result.html.length} chars`);

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        results.set(providerName, {
          status: 'failed',
          error: (error as Error).message,
          responseTime,
          performanceScore: provider.getPerformanceScore(),
        });

        console.log(`❌ ${providerName}: Failed - ${(error as Error).message}`);
      }
    }

    return results;
  }

  /**
   * Run a comprehensive test suite
   */
  async runTestSuite(testUrls?: string[]): Promise<any> {
    const defaultTestUrls = [
      'https://httpbin.org/html', // Simple static HTML
      'https://example.com', // Basic site
      'https://quotes.toscrape.com/', // Scraping-friendly site
    ];

    const urls = testUrls || defaultTestUrls;
    const results: any = {
      timestamp: new Date().toISOString(),
      testUrls: urls,
      providers: {},
      summary: {
        totalTests: 0,
        totalSuccess: 0,
        totalFailures: 0,
        avgResponseTime: 0,
        totalCost: 0,
      },
    };

    console.log(`🧪 Running test suite with ${urls.length} URLs`);

    for (const url of urls) {
      console.log(`\n📄 Testing: ${url}`);
      
      const urlResults = await this.benchmark(url);
      
      for (const [providerName, result] of urlResults) {
        if (!results.providers[providerName]) {
          results.providers[providerName] = {
            tests: [],
            successCount: 0,
            failureCount: 0,
            avgResponseTime: 0,
            totalCost: 0,
          };
        }

        const providerResult = results.providers[providerName];
        providerResult.tests.push({ url, ...result });

        if (result.status === 'success') {
          providerResult.successCount++;
          results.summary.totalSuccess++;
          providerResult.totalCost += result.cost || 0;
          results.summary.totalCost += result.cost || 0;
        } else {
          providerResult.failureCount++;
          results.summary.totalFailures++;
        }

        results.summary.totalTests++;
      }
    }

    // Calculate averages
    for (const [_providerName, data] of Object.entries(results.providers) as any) {
      const successfulTests = data.tests.filter((t: any) => t.status === 'success');
      if (successfulTests.length > 0) {
        data.avgResponseTime = successfulTests.reduce((sum: number, t: any) => sum + t.responseTime, 0) / successfulTests.length;
        data.successRate = data.successCount / data.tests.length;
      }
    }

    if (results.summary.totalSuccess > 0) {
      const allSuccessfulTests = Object.values(results.providers)
        .flatMap((p: any) => p.tests.filter((t: any) => t.status === 'success'));
      
      results.summary.avgResponseTime = allSuccessfulTests.reduce((sum: number, t: any) => sum + t.responseTime, 0) / allSuccessfulTests.length;
    }

    console.log(`\n📊 Test Suite Summary:`);
    console.log(`   Total Tests: ${results.summary.totalTests}`);
    console.log(`   Successes: ${results.summary.totalSuccess}`);
    console.log(`   Failures: ${results.summary.totalFailures}`);
    console.log(`   Avg Response Time: ${results.summary.avgResponseTime.toFixed(0)}ms`);
    console.log(`   Total Cost: $${results.summary.totalCost.toFixed(4)}`);

    return results;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.providerManager.cleanup();
  }
}