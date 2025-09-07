/**
 * Base interfaces and types for the modular scraping provider system
 * Supports multiple scraping methods with fallback strategies and performance monitoring
 */

export interface ScrapingConfig {
  timeout: number;
  retryAttempts: number;
  userAgent?: string;
  headers?: Record<string, string>;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  enableJavaScript?: boolean;
  waitForSelector?: string;
  screenshot?: boolean;
  blockResources?: string[]; // ['image', 'stylesheet', 'font', 'media']
}

export interface ScrapingResult {
  success: boolean;
  content?: string;
  statusCode?: number;
  contentType?: string;
  responseTime: number;
  providerUsed: string;
  error?: string;
  screenshot?: Buffer;
  metadata: {
    requestId: string;
    timestamp: number;
    finalUrl: string;
    redirectCount: number;
    resourcesBlocked?: number;
    jsExecutionTime?: number;
  };
}

export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  avgResponseTime: number;
  errorRate: number;
  lastUsed: number;
  costPerRequest?: number;
  reliability: number; // 0-1 score based on recent performance
}

export interface ProviderCapabilities {
  supportsJavaScript: boolean;
  supportsProxy: boolean;
  supportsScreenshots: boolean;
  supportsCustomHeaders: boolean;
  maxConcurrentRequests: number;
  rateLimitPerMinute: number;
  costTier: 'free' | 'low' | 'medium' | 'high';
  reliability: 'low' | 'medium' | 'high';
  antiDetectionLevel: 'basic' | 'advanced' | 'premium';
}

export abstract class ScrapingProvider {
  public readonly name: string;
  public readonly capabilities: ProviderCapabilities;
  public metrics: ProviderMetrics;
  protected config: ScrapingConfig;

  constructor(name: string, capabilities: ProviderCapabilities, defaultConfig: ScrapingConfig) {
    this.name = name;
    this.capabilities = capabilities;
    this.config = defaultConfig;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      lastUsed: 0,
      reliability: 1.0
    };
  }

  /**
   * Main scraping method to be implemented by each provider
   */
  abstract scrape(url: string, config?: Partial<ScrapingConfig>): Promise<ScrapingResult>;

  /**
   * Initialize the provider (setup connections, authenticate, etc.)
   */
  abstract initialize(): Promise<void>;

  /**
   * Cleanup resources when provider is no longer needed
   */
  abstract cleanup(): Promise<void>;

  /**
   * Health check to determine if provider is operational
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Update provider configuration
   */
  updateConfig(newConfig: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update metrics after a scraping attempt
   */
  protected updateMetrics(result: ScrapingResult): void {
    this.metrics.totalRequests++;
    this.metrics.lastUsed = Date.now();

    if (result.success) {
      this.metrics.successfulRequests++;
    }

    // Update average response time
    const currentAvg = this.metrics.avgResponseTime;
    const count = this.metrics.totalRequests;
    this.metrics.avgResponseTime = (currentAvg * (count - 1) + result.responseTime) / count;

    // Update error rate
    this.metrics.errorRate = 1 - (this.metrics.successfulRequests / this.metrics.totalRequests);

    // Calculate reliability score (success rate weighted by recent performance)
    const recentWeight = 0.3; // Weight recent results more heavily
    const overallSuccessRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    const recentSuccess = result.success ? 1 : 0;
    this.metrics.reliability = overallSuccessRate * (1 - recentWeight) + recentSuccess * recentWeight;
  }

  /**
   * Check if provider should be used based on current metrics and config
   */
  shouldUse(): boolean {
    // Don't use if reliability is too low
    if (this.metrics.reliability < 0.3) {
      return false;
    }

    // Don't use if too many recent failures
    if (this.metrics.errorRate > 0.7 && this.metrics.totalRequests > 10) {
      return false;
    }

    return true;
  }

  /**
   * Get provider priority score for fallback ordering
   * Higher score = higher priority
   */
  getPriorityScore(): number {
    const reliabilityWeight = 0.4;
    const speedWeight = 0.3;
    const costWeight = 0.3;

    const reliabilityScore = this.metrics.reliability;
    const speedScore = this.metrics.avgResponseTime > 0 
      ? Math.max(0, 1 - (this.metrics.avgResponseTime / 30000)) // Normalize against 30s max
      : 0.5;
    
    const costScore = {
      'free': 1.0,
      'low': 0.8,
      'medium': 0.6,
      'high': 0.4
    }[this.capabilities.costTier];

    return reliabilityScore * reliabilityWeight + 
           speedScore * speedWeight + 
           costScore * costWeight;
  }

  /**
   * Generate request ID for tracking
   */
  protected generateRequestId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Provider selection strategies
 */
export enum FallbackStrategy {
  PRIORITY_ORDER = 'priority_order',     // Use providers in order of priority score
  COST_OPTIMIZED = 'cost_optimized',     // Start with cheapest, fallback to more expensive
  SPEED_OPTIMIZED = 'speed_optimized',   // Start with fastest, fallback to slower
  RELIABILITY_FIRST = 'reliability_first', // Start with most reliable
  ROUND_ROBIN = 'round_robin'            // Distribute load evenly
}

export interface FallbackConfig {
  strategy: FallbackStrategy;
  maxProviders: number;
  skipUnhealthy: boolean;
  requireJavaScript?: boolean;
  maxCostTier?: 'free' | 'low' | 'medium' | 'high';
  minReliability?: number;
}