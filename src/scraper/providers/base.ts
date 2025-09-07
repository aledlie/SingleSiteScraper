/**
 * Base interface for all scraping providers
 * Defines standard contract for scraping services
 */

export interface ScrapingCapabilities {
  supportsJavaScript: boolean;
  supportsStealth: boolean;
  isCommercial: boolean;
  costPerRequest: number; // in credits/cents
  maxConcurrency: number;
  avgResponseTime: number; // ms
}

export interface ScrapingMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  totalCost: number;
  lastUsed: Date;
  successRate: number;
}

export interface ScrapingOptions {
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  waitForSelector?: string;
  waitForNetwork?: boolean;
  blockResources?: boolean;
  stealth?: boolean;
  maxRetries?: number;
  priority?: 'speed' | 'cost' | 'reliability';
}

export interface ScrapingResult {
  html: string;
  url: string;
  status: number;
  responseTime: number;
  provider: string;
  cost: number;
  metadata: {
    userAgent?: string;
    headers?: Record<string, string>;
    finalUrl?: string;
    redirects?: number;
  };
}

export interface ProviderHealthCheck {
  isHealthy: boolean;
  lastCheck: Date;
  errorRate: number;
  avgResponseTime: number;
  message?: string;
}

export abstract class BaseScrapeProvider {
  abstract name: string;
  abstract capabilities: ScrapingCapabilities;
  public metrics: ScrapingMetrics;
  protected healthCheck: ProviderHealthCheck;

  constructor() {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
      totalCost: 0,
      lastUsed: new Date(),
      successRate: 0,
    };

    this.healthCheck = {
      isHealthy: true,
      lastCheck: new Date(),
      errorRate: 0,
      avgResponseTime: 0,
    };
  }

  abstract scrape(url: string, options?: ScrapingOptions): Promise<ScrapingResult>;
  abstract isAvailable(): Promise<boolean>;
  abstract getHealthStatus(): Promise<ProviderHealthCheck>;

  /**
   * Update metrics after a scraping attempt
   */
  protected updateMetrics(success: boolean, responseTime: number, cost: number = 0) {
    this.metrics.requestCount++;
    this.metrics.lastUsed = new Date();
    this.metrics.totalCost += cost;

    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.failureCount++;
    }

    // Update average response time (rolling average)
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.requestCount - 1) + responseTime) / 
      this.metrics.requestCount;

    // Update success rate
    this.metrics.successRate = this.metrics.successCount / this.metrics.requestCount;

    // Update health check
    this.healthCheck.lastCheck = new Date();
    this.healthCheck.errorRate = this.metrics.failureCount / this.metrics.requestCount;
    this.healthCheck.avgResponseTime = this.metrics.avgResponseTime;
    this.healthCheck.isHealthy = this.metrics.successRate > 0.5 && this.healthCheck.errorRate < 0.5;
  }

  /**
   * Get provider performance score (0-100)
   */
  getPerformanceScore(): number {
    const successWeight = 0.4;
    const speedWeight = 0.3;
    const costWeight = 0.2;
    const availabilityWeight = 0.1;

    const successScore = this.metrics.successRate * 100;
    const speedScore = Math.max(0, 100 - (this.metrics.avgResponseTime / 100));
    const costScore = Math.max(0, 100 - (this.capabilities.costPerRequest * 10));
    const availabilityScore = this.healthCheck.isHealthy ? 100 : 0;

    return (
      successScore * successWeight +
      speedScore * speedWeight +
      costScore * costWeight +
      availabilityScore * availabilityWeight
    );
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
      totalCost: 0,
      lastUsed: new Date(),
      successRate: 0,
    };
  }
}