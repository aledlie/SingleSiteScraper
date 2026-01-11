export interface PerformanceMetrics {
  id: string;
  url: string;
  timestamp: string;
  scraping: {
    totalTime: number;
    fetchTime: number;
    parseTime: number;
    analysisTime: number;
    retryAttempts: number;
    proxyUsed: string;
  };
  content: {
    htmlSize: number;
    objectCount: number;
    relationshipCount: number;
    complexity: number;
    maxDepth: number;
  };
  network: {
    responseTime: number;
    contentLength: number;
    contentType: string;
    statusCode?: number;
  };
  quality: {
    successRate: number;
    dataCompleteness: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'performance' | 'content' | 'network' | 'analysis';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  url: string;
}

export interface PerformanceReport {
  id: string;
  generatedAt: string;
  timeRange: {
    start: string;
    end: string;
  };
  summary: {
    totalScrapes: number;
    successRate: number;
    averageResponseTime: number;
    averageComplexity: number;
    totalAlerts: number;
  };
  metrics: PerformanceMetrics[];
  alerts: PerformanceAlert[];
  trends: {
    responseTime: number[];
    complexity: number[];
    successRate: number[];
    timestamps: string[];
  };
  recommendations: string[];
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds = {
    responseTime: 5000, // 5 seconds
    scrapeTime: 30000, // 30 seconds
    complexity: 1000,
    htmlSize: 1024 * 1024, // 1MB
    objectCount: 10000,
    successRate: 0.95
  };

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public startScrapeMonitoring(url: string): string {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    
    // Initialize metrics entry
    const metrics: PerformanceMetrics = {
      id,
      url,
      timestamp,
      scraping: {
        totalTime: 0,
        fetchTime: 0,
        parseTime: 0,
        analysisTime: 0,
        retryAttempts: 0,
        proxyUsed: ''
      },
      content: {
        htmlSize: 0,
        objectCount: 0,
        relationshipCount: 0,
        complexity: 0,
        maxDepth: 0
      },
      network: {
        responseTime: 0,
        contentLength: 0,
        contentType: ''
      },
      quality: {
        successRate: 1.0,
        dataCompleteness: 0,
        errorCount: 0,
        warningCount: 0
      }
    };

    this.metrics.push(metrics);
    return id;
  }

  public updateScrapeMetrics(id: string, updates: Partial<PerformanceMetrics>): void {
    const metrics = this.metrics.find(m => m.id === id);
    if (!metrics) return;

    // Deep merge updates
    Object.assign(metrics.scraping, updates.scraping || {});
    Object.assign(metrics.content, updates.content || {});
    Object.assign(metrics.network, updates.network || {});
    Object.assign(metrics.quality, updates.quality || {});

    // Check for alerts
    this.checkThresholds(metrics);
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    const { url, timestamp } = metrics;

    // Response time alert
    if (metrics.network.responseTime > this.thresholds.responseTime) {
      this.alerts.push({
        id: this.generateId(),
        type: 'warning',
        category: 'network',
        message: `Slow response time detected`,
        value: metrics.network.responseTime,
        threshold: this.thresholds.responseTime,
        timestamp,
        url
      });
    }

    // Scraping time alert
    if (metrics.scraping.totalTime > this.thresholds.scrapeTime) {
      this.alerts.push({
        id: this.generateId(),
        type: 'warning',
        category: 'performance',
        message: `Long processing time detected`,
        value: metrics.scraping.totalTime,
        threshold: this.thresholds.scrapeTime,
        timestamp,
        url
      });
    }

    // Complexity alert
    if (metrics.content.complexity > this.thresholds.complexity) {
      this.alerts.push({
        id: this.generateId(),
        type: 'info',
        category: 'complexity',
        message: `High page complexity detected`,
        value: metrics.content.complexity,
        threshold: this.thresholds.complexity,
        timestamp,
        url
      });
    }

    // HTML size alert
    if (metrics.content.htmlSize > this.thresholds.htmlSize) {
      this.alerts.push({
        id: this.generateId(),
        type: 'info',
        category: 'content',
        message: `Large HTML size detected`,
        value: metrics.content.htmlSize,
        threshold: this.thresholds.htmlSize,
        timestamp,
        url
      });
    }

    // Object count alert
    if (metrics.content.objectCount > this.thresholds.objectCount) {
      this.alerts.push({
        id: this.generateId(),
        type: 'warning',
        category: 'analysis',
        message: `High object count detected`,
        value: metrics.content.objectCount,
        threshold: this.thresholds.objectCount,
        timestamp,
        url
      });
    }

    // Quality alerts
    if (metrics.quality.errorCount > 0) {
      this.alerts.push({
        id: this.generateId(),
        type: 'error',
        category: 'content',
        message: `Errors detected during processing`,
        value: metrics.quality.errorCount,
        threshold: 0,
        timestamp,
        url
      });
    }

    // Success rate alert
    if (metrics.quality.successRate < 0.8) { // Less than 80% success rate
      this.alerts.push({
        id: this.generateId(),
        type: 'error',
        category: 'quality',
        message: `Low success rate detected`,
        value: metrics.quality.successRate,
        threshold: 0.8,
        timestamp,
        url
      });
    }
  }

  public generateReport(timeRangeHours: number = 24): PerformanceReport {
    const now = new Date();
    const start = new Date(now.getTime() - (timeRangeHours * 60 * 60 * 1000));
    
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp) >= start && new Date(m.timestamp) <= now
    );

    const recentAlerts = this.alerts.filter(a => 
      new Date(a.timestamp) >= start && new Date(a.timestamp) <= now
    );

    // Calculate summary statistics
    const totalScrapes = recentMetrics.length;
    const successfulScrapes = recentMetrics.filter(m => m.quality.successRate > 0.5).length;
    const successRate = totalScrapes > 0 ? successfulScrapes / totalScrapes : 0;
    
    const avgResponseTime = totalScrapes > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.network.responseTime, 0) / totalScrapes
      : 0;
    
    const avgComplexity = totalScrapes > 0
      ? recentMetrics.reduce((sum, m) => sum + m.content.complexity, 0) / totalScrapes
      : 0;

    // Generate trends
    const sortedMetrics = recentMetrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const trends = {
      responseTime: sortedMetrics.map(m => m.network.responseTime),
      complexity: sortedMetrics.map(m => m.content.complexity),
      successRate: sortedMetrics.map(m => m.quality.successRate),
      timestamps: sortedMetrics.map(m => m.timestamp)
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(recentMetrics, recentAlerts);

    return {
      id: this.generateId(),
      generatedAt: now.toISOString(),
      period: `${timeRangeHours} hours`,
      timeRange: {
        start: start.toISOString(),
        end: now.toISOString()
      },
      summary: {
        totalScrapes,
        successRate,
        averageResponseTime: Math.round(avgResponseTime),
        averageComplexity: Math.round(avgComplexity * 100) / 100,
        totalAlerts: recentAlerts.length
      },
      metrics: recentMetrics,
      alerts: recentAlerts,
      trends,
      recommendations
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    const slowScrapes = metrics.filter(m => m.scraping.totalTime > this.thresholds.scrapeTime / 2);
    if (slowScrapes.length > metrics.length * 0.3) {
      recommendations.push(
        "Consider implementing caching or reducing the scope of scraped content to improve performance"
      );
    }

    // Network recommendations
    const slowNetwork = metrics.filter(m => m.network.responseTime > this.thresholds.responseTime / 2);
    if (slowNetwork.length > metrics.length * 0.3) {
      recommendations.push(
        "Network response times are consistently slow. Consider using different proxy services or implementing request queuing"
      );
    }

    // Complexity recommendations
    const highComplexity = metrics.filter(m => m.content.complexity > this.thresholds.complexity / 2);
    if (highComplexity.length > metrics.length * 0.3) {
      recommendations.push(
        "Pages show high complexity. Consider focusing on specific sections or implementing selective parsing"
      );
    }

    // Error recommendations
    const errorAlerts = alerts.filter(a => a.type === 'error');
    if (errorAlerts.length > 0) {
      recommendations.push(
        "Errors detected during processing. Review error logs and implement better error handling"
      );
    }

    // Success rate recommendations
    const avgSuccessRate = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.quality.successRate, 0) / metrics.length
      : 1;
    
    if (avgSuccessRate < this.thresholds.successRate) {
      recommendations.push(
        "Success rate is below target. Review retry logic and proxy service reliability"
      );
    }

    // Retry recommendations
    const highRetries = metrics.filter(m => m.scraping.retryAttempts > 1);
    if (highRetries.length > metrics.length * 0.2) {
      recommendations.push(
        "High retry attempts detected. Consider improving proxy service selection or implementing backoff strategies"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Performance is within acceptable ranges. Continue monitoring for trends.");
    }

    return recommendations;
  }

  public getMetrics(limit?: number): PerformanceMetrics[] {
    const sorted = this.metrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  public getAlerts(urlOrType?: string | PerformanceAlert['type'], limit?: number): PerformanceAlert[] {
    let filtered = this.alerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    if (typeof urlOrType === 'string' && urlOrType.includes('://')) {
      // URL filtering
      filtered = filtered.filter(a => a.url === urlOrType);
    } else if (urlOrType) {
      // Type filtering
      filtered = filtered.filter(a => a.type === urlOrType as PerformanceAlert['type']);
    }
    
    return limit ? filtered.slice(0, limit) : filtered;
  }

  public setThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  public getThresholds(): typeof this.thresholds {
    return { ...this.thresholds };
  }

  public clearOldData(olderThanDays: number = 7): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) >= cutoff);
    this.alerts = this.alerts.filter(a => new Date(a.timestamp) >= cutoff);
  }

  public updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    Object.assign(this.thresholds, newThresholds);
  }

  public exportToJSON(metrics: PerformanceMetrics[]): string {
    return JSON.stringify(metrics, null, 2);
  }

  public exportToCSV(metrics: PerformanceMetrics[]): string {
    const headers = [
      'ID', 'URL', 'Timestamp', 'Total Time', 'Response Time', 'HTML Size', 
      'Object Count', 'Complexity', 'Success Rate', 'Error Count', 'Proxy Used'
    ];

    const rows = metrics.map(m => [
      m.id,
      m.url,
      m.timestamp,
      m.scraping.totalTime,
      m.network.responseTime,
      m.content.htmlSize,
      m.content.objectCount,
      m.content.complexity,
      m.quality.successRate,
      m.quality.errorCount,
      m.scraping.proxyUsed
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}