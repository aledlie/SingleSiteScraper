/**
 * Provider Manager - Orchestrates multiple scraping providers with intelligent fallbacks
 */

import { BaseScrapeProvider, ScrapingOptions, ScrapingResult } from './base';
import { LegacyProxyProvider } from './legacy';
import { PlaywrightProvider } from './playwright';

export type FallbackStrategy = 'cost-optimized' | 'speed-optimized' | 'reliability-first' | 'javascript-first';

export interface ProviderManagerOptions {
  strategy?: FallbackStrategy;
  maxCostPerRequest?: number;
  preferredProviders?: string[];
  enabledProviders?: string[];
}

export class ProviderManager {
  private providers = new Map<string, BaseScrapeProvider>();
  private options: ProviderManagerOptions;

  constructor(options: ProviderManagerOptions = {}) {
    this.options = {
      strategy: 'cost-optimized',
      maxCostPerRequest: 0.01,
      ...options,
    };

    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize all available providers
    const availableProviders = [
      new LegacyProxyProvider(),
      new PlaywrightProvider(),
    ];

    for (const provider of availableProviders) {
      if (!this.options.enabledProviders || this.options.enabledProviders.includes(provider.name)) {
        this.providers.set(provider.name, provider);
      }
    }
  }

  /**
   * Scrape a URL using the best available provider with intelligent fallbacks
   */
  async scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    const providers = await this.selectProviders(url, options);
    
    if (providers.length === 0) {
      throw new Error('No suitable providers available for this request');
    }

    let lastError: Error | null = null;
    const attempts: Array<{ provider: string; error: string; responseTime: number }> = [];

    for (const provider of providers) {
      const startTime = Date.now();
      
      try {
        console.log(`Attempting to scrape ${url} with ${provider.name}`);
        
        const result = await provider.scrape(url, options);
        
        console.log(`✅ Successfully scraped ${url} with ${provider.name} in ${result.responseTime}ms`);
        
        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        lastError = error as Error;
        
        attempts.push({
          provider: provider.name,
          error: lastError.message,
          responseTime,
        });

        console.warn(`❌ ${provider.name} failed for ${url}: ${lastError.message}`);
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    const errorMessage = `All providers failed for ${url}. Attempts: ${JSON.stringify(attempts, null, 2)}`;
    throw new Error(errorMessage);
  }

  /**
   * Select and order providers based on URL characteristics and strategy
   */
  private async selectProviders(url: string, options?: ScrapingOptions): Promise<BaseScrapeProvider[]> {
    const availableProviders = Array.from(this.providers.values());
    
    // Filter out unavailable providers
    const healthyProviders = [];
    for (const provider of availableProviders) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          healthyProviders.push(provider);
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} health check failed:`, error);
      }
    }

    if (healthyProviders.length === 0) {
      return [];
    }

    // Apply cost filtering
    const affordableProviders = healthyProviders.filter(
      p => p.capabilities.costPerRequest <= (this.options.maxCostPerRequest || 0.01)
    );

    const candidateProviders = affordableProviders.length > 0 ? affordableProviders : healthyProviders;

    // Sort providers based on strategy
    return this.sortProvidersByStrategy(candidateProviders, url, options);
  }

  /**
   * Sort providers based on the selected fallback strategy
   */
  private sortProvidersByStrategy(
    providers: BaseScrapeProvider[],
    url: string,
    options?: ScrapingOptions
  ): BaseScrapeProvider[] {
    const requiresJavaScript = this.detectJavaScriptRequirement(url, options);
    const userPriority = options?.priority;

    // Use user's explicit priority if provided
    const strategy = userPriority || this.options.strategy || 'cost-optimized';

    switch (strategy) {
      case 'cost-optimized':
        return providers.sort((a, b) => {
          // Free providers first, then by cost
          if (a.capabilities.costPerRequest === 0 && b.capabilities.costPerRequest > 0) return -1;
          if (b.capabilities.costPerRequest === 0 && a.capabilities.costPerRequest > 0) return 1;
          return a.capabilities.costPerRequest - b.capabilities.costPerRequest;
        });

      case 'speed-optimized':
        return providers.sort((a, b) => {
          return a.capabilities.avgResponseTime - b.capabilities.avgResponseTime;
        });

      case 'reliability-first':
        return providers.sort((a, b) => {
          const scoreA = a.getPerformanceScore();
          const scoreB = b.getPerformanceScore();
          return scoreB - scoreA; // Higher score first
        });

      case 'javascript-first':
        return providers.sort((a, b) => {
          // JavaScript-capable providers first
          if (a.capabilities.supportsJavaScript && !b.capabilities.supportsJavaScript) return -1;
          if (!a.capabilities.supportsJavaScript && b.capabilities.supportsJavaScript) return 1;
          
          // Then by performance score
          return b.getPerformanceScore() - a.getPerformanceScore();
        });

      default:
        // Default: JavaScript-capable first if needed, then by cost
        if (requiresJavaScript) {
          const jsProviders = providers.filter(p => p.capabilities.supportsJavaScript);
          const nonJsProviders = providers.filter(p => !p.capabilities.supportsJavaScript);
          
          return [
            ...jsProviders.sort((a, b) => a.capabilities.costPerRequest - b.capabilities.costPerRequest),
            ...nonJsProviders.sort((a, b) => a.capabilities.costPerRequest - b.capabilities.costPerRequest),
          ];
        }
        
        return providers.sort((a, b) => a.capabilities.costPerRequest - b.capabilities.costPerRequest);
    }
  }

  /**
   * Detect if a URL likely requires JavaScript rendering
   */
  private detectJavaScriptRequirement(url: string, options?: ScrapingOptions): boolean {
    // Explicit option
    if (options?.waitForSelector || options?.waitForNetwork) {
      return true;
    }

    // Known SPA patterns
    const spaPatterns = [
      /react/i,
      /angular/i,
      /vue/i,
      /spa/i,
      /app\./i,
      /dashboard/i,
      /admin/i,
    ];

    return spaPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Get health status of all providers
   */
  async getProvidersHealth() {
    const health = new Map();
    
    for (const [name, provider] of this.providers) {
      try {
        const status = await provider.getHealthStatus();
        health.set(name, {
          ...status,
          performanceScore: provider.getPerformanceScore(),
          metrics: provider.metrics,
        });
      } catch (error) {
        health.set(name, {
          isHealthy: false,
          error: (error as Error).message,
          performanceScore: 0,
        });
      }
    }

    return health;
  }

  /**
   * Get performance metrics for all providers
   */
  getMetrics() {
    const metrics = new Map();
    
    for (const [name, provider] of this.providers) {
      metrics.set(name, {
        ...provider.metrics,
        capabilities: provider.capabilities,
        performanceScore: provider.getPerformanceScore(),
      });
    }

    return metrics;
  }

  /**
   * Reset all provider metrics
   */
  resetMetrics() {
    for (const provider of this.providers.values()) {
      provider.resetMetrics();
    }
  }

  /**
   * Add a custom provider
   */
  addProvider(provider: BaseScrapeProvider) {
    this.providers.set(provider.name, provider);
  }

  /**
   * Remove a provider
   */
  removeProvider(name: string) {
    return this.providers.delete(name);
  }

  /**
   * Get a specific provider
   */
  getProvider(name: string): BaseScrapeProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * List all available providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clean up resources (especially important for Playwright)
   */
  async cleanup() {
    for (const provider of this.providers.values()) {
      if ('cleanup' in provider && typeof provider.cleanup === 'function') {
        try {
          await provider.cleanup();
        } catch (error) {
          console.warn(`Error cleaning up ${provider.name}:`, error);
        }
      }
    }
  }
}