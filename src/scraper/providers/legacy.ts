/**
 * Legacy CORS proxy provider
 * Wraps existing proxy functionality in the new provider interface
 */

import { BaseScrapeProvider, ScrapingCapabilities, ScrapingOptions, ScrapingResult, ProviderHealthCheck } from './base';

export class LegacyProxyProvider extends BaseScrapeProvider {
  name = 'Legacy-CORS-Proxy';
  
  capabilities: ScrapingCapabilities = {
    supportsJavaScript: false,
    supportsStealth: false,
    isCommercial: false,
    costPerRequest: 0,
    maxConcurrency: 10,
    avgResponseTime: 2000,
  };

  private readonly corsProxies = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/',
    'https://cors-anywhere.herokuapp.com/',
  ];

  async scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    const startTime = Date.now();
    const timeout = options?.timeout || 30000;
    const maxRetries = options?.maxRetries || 3;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      for (const proxy of this.corsProxies) {
        try {
          const result = await this.tryProxy(proxy, url, timeout, options);
          const responseTime = Date.now() - startTime;
          
          this.updateMetrics(true, responseTime, 0);
          
          return {
            ...result,
            responseTime,
            provider: this.name,
            cost: 0,
          };
        } catch (error) {
          lastError = error as Error;
          console.warn(`Proxy ${proxy} failed for ${url}:`, error);
          continue;
        }
      }
      
      if (attempt < maxRetries) {
        await this.delay(1000 * (attempt + 1)); // Exponential backoff
      }
    }

    const responseTime = Date.now() - startTime;
    this.updateMetrics(false, responseTime, 0);
    
    throw new Error(`All proxy attempts failed. Last error: ${lastError?.message}`);
  }

  private async tryProxy(
    proxy: string, 
    url: string, 
    timeout: number, 
    options?: ScrapingOptions
  ): Promise<Omit<ScrapingResult, 'responseTime' | 'provider' | 'cost'>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: HeadersInit = {
        'User-Agent': options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options?.headers,
      };

      let proxyUrl: string;
      
      if (proxy.includes('allorigins.win')) {
        proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      } else {
        proxyUrl = `${proxy}${url}`;
      }

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let html: string;
      let finalUrl = url;
      let redirects = 0;

      if (proxy.includes('allorigins.win')) {
        const jsonResponse = await response.json();
        html = jsonResponse.contents;
        finalUrl = jsonResponse.status?.url || url;
      } else {
        html = await response.text();
      }

      // Basic validation
      if (!html || html.length < 100) {
        throw new Error('Received empty or too short response');
      }

      return {
        html,
        url: finalUrl,
        status: response.status,
        metadata: {
          userAgent: headers['User-Agent'] as string,
          headers: options?.headers,
          finalUrl,
          redirects,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple, reliable endpoint
      const testUrl = 'https://httpbin.org/status/200';
      await this.tryProxy(this.corsProxies[0], testUrl, 5000);
      return true;
    } catch {
      return false;
    }
  }

  async getHealthStatus(): Promise<ProviderHealthCheck> {
    try {
      const isHealthy = await this.isAvailable();
      
      return {
        ...this.healthCheck,
        isHealthy,
        lastCheck: new Date(),
        message: isHealthy ? 'All systems operational' : 'Service unavailable',
      };
    } catch (error) {
      return {
        ...this.healthCheck,
        isHealthy: false,
        lastCheck: new Date(),
        message: `Health check failed: ${(error as Error).message}`,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}