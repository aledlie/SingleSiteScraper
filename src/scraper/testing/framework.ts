/**
 * Comprehensive Testing Framework for Web Scraping Providers
 * Measures success rates, performance, reliability, and cost-effectiveness
 */

import { ScrapingProvider, ScrapingResult } from '../providers/base.js';
import { ProviderManager, ProviderManagerConfig } from '../providers/manager.js';

export interface TestSite {
  name: string;
  url: string;
  category: 'static' | 'spa' | 'ecommerce' | 'social' | 'news' | 'protected';
  expectedElements: {
    title?: string;
    selector: string;
    description: string;
  }[];
  requiresJavaScript: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  antiBot: 'none' | 'basic' | 'advanced' | 'cloudflare' | 'custom';
  loadTime: 'fast' | 'medium' | 'slow'; // Expected load time
  region?: string; // Geo-blocking if applicable
}

export interface TestResult {
  testId: string;
  site: TestSite;
  provider: string;
  timestamp: number;
  duration: number;
  success: boolean;
  scrapingResult: ScrapingResult;
  validationResults: ValidationResult[];
  performanceMetrics: PerformanceMetrics;
  cost?: number;
  error?: string;
}

export interface ValidationResult {
  selector: string;
  description: string;
  found: boolean;
  value?: string;
  expectedValue?: string;
  match: boolean;
}

export interface PerformanceMetrics {
  responseTime: number;
  contentLength: number;
  elementsFound: number;
  jsExecutionTime?: number;
  resourcesBlocked?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface TestSuite {
  name: string;
  description: string;
  sites: TestSite[];
  providers: string[];
  iterations: number;
  parallelRequests: number;
  timeout: number;
}

export interface TestReport {
  suiteId: string;
  suiteName: string;
  startTime: number;
  endTime: number;
  totalTests: number;
  results: TestResult[];
  summary: {
    overallSuccessRate: number;
    providerComparison: ProviderComparison[];
    categoryPerformance: CategoryPerformance[];
    costAnalysis: CostAnalysis;
    recommendations: string[];
  };
}

export interface ProviderComparison {
  providerName: string;
  totalTests: number;
  successRate: number;
  avgResponseTime: number;
  avgCost: number;
  reliabilityScore: number;
  strengthsByCategory: Record<string, number>;
  weaknessesByCategory: Record<string, number>;
}

export interface CategoryPerformance {
  category: string;
  totalTests: number;
  successRate: number;
  avgResponseTime: number;
  bestProvider: string;
  worstProvider: string;
  difficultyImpact: Record<string, number>;
}

export interface CostAnalysis {
  totalCost: number;
  costByProvider: Record<string, number>;
  costPerSuccessfulRequest: number;
  mostCostEffective: string;
  costSavingOpportunities: string[];
}

export class ScrapingTestFramework {
  private testSites: TestSite[] = [];
  private testResults: TestResult[] = [];
  private providerManager: ProviderManager;

  constructor(providerManager: ProviderManager) {
    this.providerManager = providerManager;
    this.initializeDefaultTestSites();
  }

  /**
   * Initialize a comprehensive set of test sites covering different scenarios
   */
  private initializeDefaultTestSites(): void {
    this.testSites = [
      {
        name: 'Static News Site',
        url: 'https://example.com/news',
        category: 'news',
        expectedElements: [
          { selector: 'title', description: 'Page title' },
          { selector: 'h1', description: 'Main headline' },
          { selector: 'article', description: 'Article content' },
          { selector: '.byline', description: 'Author byline' }
        ],
        requiresJavaScript: false,
        difficulty: 'easy',
        antiBot: 'none',
        loadTime: 'fast'
      },
      {
        name: 'E-commerce Product Page',
        url: 'https://example-shop.com/product/123',
        category: 'ecommerce',
        expectedElements: [
          { selector: '.product-title', description: 'Product title' },
          { selector: '.price', description: 'Product price' },
          { selector: '.product-images img', description: 'Product images' },
          { selector: '.add-to-cart', description: 'Add to cart button' }
        ],
        requiresJavaScript: true,
        difficulty: 'medium',
        antiBot: 'basic',
        loadTime: 'medium'
      },
      {
        name: 'React SPA Dashboard',
        url: 'https://dashboard.example.com',
        category: 'spa',
        expectedElements: [
          { selector: '[data-testid="dashboard-header"]', description: 'Dashboard header' },
          { selector: '.chart-container', description: 'Chart components' },
          { selector: '.data-table', description: 'Data table' },
          { selector: '[data-loaded="true"]', description: 'Dynamic content loaded' }
        ],
        requiresJavaScript: true,
        difficulty: 'hard',
        antiBot: 'advanced',
        loadTime: 'slow'
      },
      {
        name: 'Cloudflare Protected Site',
        url: 'https://protected.example.com',
        category: 'protected',
        expectedElements: [
          { selector: 'title', description: 'Page title' },
          { selector: 'main', description: 'Main content' }
        ],
        requiresJavaScript: true,
        difficulty: 'extreme',
        antiBot: 'cloudflare',
        loadTime: 'slow'
      },
      {
        name: 'Social Media Profile',
        url: 'https://social.example.com/user/123',
        category: 'social',
        expectedElements: [
          { selector: '.profile-name', description: 'Profile name' },
          { selector: '.profile-bio', description: 'Profile bio' },
          { selector: '.posts', description: 'Posts container' },
          { selector: '.follower-count', description: 'Follower count' }
        ],
        requiresJavaScript: true,
        difficulty: 'hard',
        antiBot: 'advanced',
        loadTime: 'medium'
      }
    ];
  }

  /**
   * Add custom test sites
   */
  addTestSite(site: TestSite): void {
    this.testSites.push(site);
  }

  /**
   * Run a comprehensive test suite
   */
  async runTestSuite(suite: TestSuite): Promise<TestReport> {
    console.log(`Starting test suite: ${suite.name}`);
    const startTime = Date.now();
    const testResults: TestResult[] = [];

    // Filter test sites based on suite configuration
    const selectedSites = suite.sites.length > 0 
      ? this.testSites.filter(site => suite.sites.includes(site))
      : this.testSites;

    // Run tests for each provider against each site
    for (const site of selectedSites) {
      for (const providerName of suite.providers) {
        for (let iteration = 0; iteration < suite.iterations; iteration++) {
          console.log(`Testing ${site.name} with ${providerName} (iteration ${iteration + 1}/${suite.iterations})`);
          
          const testResult = await this.runSingleTest(
            site,
            providerName,
            suite.timeout
          );
          
          testResults.push(testResult);
          
          // Add delay between tests to avoid rate limiting
          await this.sleep(1000);
        }
      }
    }

    const endTime = Date.now();
    
    // Generate comprehensive report
    const report: TestReport = {
      suiteId: this.generateTestId(),
      suiteName: suite.name,
      startTime,
      endTime,
      totalTests: testResults.length,
      results: testResults,
      summary: this.generateTestSummary(testResults)
    };

    console.log(`Test suite completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);
    return report;
  }

  /**
   * Run a single test against a specific site with a specific provider
   */
  private async runSingleTest(
    site: TestSite,
    providerName: string,
    timeout: number
  ): Promise<TestResult> {
    const testId = this.generateTestId();
    const startTime = Date.now();

    try {
      // Configure scraping based on site requirements
      const config = {
        timeout,
        enableJavaScript: site.requiresJavaScript,
        screenshot: site.difficulty === 'extreme',
        waitForSelector: site.expectedElements[0]?.selector
      };

      // Perform scraping
      const scrapingResult = await this.providerManager.scrape(site.url, config, {
        id: testId,
        priority: 'high',
        requiredCapabilities: {
          supportsJavaScript: site.requiresJavaScript
        }
      });

      // Validate results
      const validationResults = await this.validateScrapingResult(
        scrapingResult,
        site
      );

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(scrapingResult);

      const testResult: TestResult = {
        testId,
        site,
        provider: providerName,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: scrapingResult.success && validationResults.every(v => v.match),
        scrapingResult,
        validationResults,
        performanceMetrics,
        cost: this.calculateTestCost(providerName, scrapingResult)
      };

      return testResult;

    } catch (error) {
      return {
        testId,
        site,
        provider: providerName,
        timestamp: startTime,
        duration: Date.now() - startTime,
        success: false,
        scrapingResult: {
          success: false,
          responseTime: Date.now() - startTime,
          providerUsed: providerName,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            requestId: testId,
            timestamp: startTime,
            finalUrl: site.url,
            redirectCount: 0
          }
        },
        validationResults: [],
        performanceMetrics: {
          responseTime: Date.now() - startTime,
          contentLength: 0,
          elementsFound: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate scraping results against expected elements
   */
  private async validateScrapingResult(
    result: ScrapingResult,
    site: TestSite
  ): Promise<ValidationResult[]> {
    const validationResults: ValidationResult[] = [];

    if (!result.success || !result.content) {
      return site.expectedElements.map(element => ({
        selector: element.selector,
        description: element.description,
        found: false,
        match: false
      }));
    }

    // Simple HTML parsing for validation (in real implementation, use proper parser)
    for (const expectedElement of site.expectedElements) {
      const found = result.content.includes(expectedElement.selector) || 
                   this.mockElementCheck(result.content, expectedElement.selector);
      
      validationResults.push({
        selector: expectedElement.selector,
        description: expectedElement.description,
        found,
        match: found,
        value: found ? 'Element found' : undefined
      });
    }

    return validationResults;
  }

  /**
   * Mock element checking (in real implementation, use proper DOM parser)
   */
  private mockElementCheck(content: string, selector: string): boolean {
    // Mock validation - in real implementation would parse HTML and check selectors
    const mockSelectors = ['title', 'h1', 'article', '.product-title', '.price', '[data-testid', '.chart-container'];
    return mockSelectors.some(mock => selector.includes(mock)) && content.length > 1000;
  }

  /**
   * Calculate performance metrics from scraping result
   */
  private calculatePerformanceMetrics(result: ScrapingResult): PerformanceMetrics {
    return {
      responseTime: result.responseTime,
      contentLength: result.content?.length || 0,
      elementsFound: result.content ? this.mockCountElements(result.content) : 0,
      jsExecutionTime: result.metadata.jsExecutionTime,
      resourcesBlocked: result.metadata.resourcesBlocked,
      memoryUsage: Math.random() * 100, // Mock data
      cpuUsage: Math.random() * 50      // Mock data
    };
  }

  /**
   * Mock element counting
   */
  private mockCountElements(content: string): number {
    // Mock implementation - in real version would count actual HTML elements
    return Math.floor(content.length / 100);
  }

  /**
   * Calculate test cost based on provider pricing
   */
  private calculateTestCost(providerName: string, result: ScrapingResult): number {
    const costMap: Record<string, number> = {
      'BrightData': 0.003,
      'Playwright': 0.001, // Infrastructure cost
      'AllOrigins': 0,
      'CORS Proxy': 0
    };

    return costMap[providerName] || 0;
  }

  /**
   * Generate comprehensive test summary
   */
  private generateTestSummary(results: TestResult[]) {
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const overallSuccessRate = successfulTests / totalTests;

    // Provider comparison
    const providerStats = new Map<string, TestResult[]>();
    results.forEach(result => {
      const providerResults = providerStats.get(result.provider) || [];
      providerResults.push(result);
      providerStats.set(result.provider, providerResults);
    });

    const providerComparison: ProviderComparison[] = Array.from(providerStats.entries())
      .map(([provider, providerResults]) => {
        const successful = providerResults.filter(r => r.success);
        const avgResponseTime = providerResults.reduce((sum, r) => sum + r.performanceMetrics.responseTime, 0) / providerResults.length;
        const avgCost = providerResults.reduce((sum, r) => sum + (r.cost || 0), 0) / providerResults.length;

        return {
          providerName: provider,
          totalTests: providerResults.length,
          successRate: successful.length / providerResults.length,
          avgResponseTime,
          avgCost,
          reliabilityScore: this.calculateReliabilityScore(providerResults),
          strengthsByCategory: this.calculateCategoryStrengths(providerResults),
          weaknessesByCategory: this.calculateCategoryWeaknesses(providerResults)
        };
      });

    // Category performance
    const categoryStats = new Map<string, TestResult[]>();
    results.forEach(result => {
      const categoryResults = categoryStats.get(result.site.category) || [];
      categoryResults.push(result);
      categoryStats.set(result.site.category, categoryResults);
    });

    const categoryPerformance: CategoryPerformance[] = Array.from(categoryStats.entries())
      .map(([category, categoryResults]) => {
        const successRate = categoryResults.filter(r => r.success).length / categoryResults.length;
        const avgResponseTime = categoryResults.reduce((sum, r) => sum + r.performanceMetrics.responseTime, 0) / categoryResults.length;
        
        const providerSuccessRates = new Map<string, number>();
        categoryResults.forEach(result => {
          const current = providerSuccessRates.get(result.provider) || [];
          providerSuccessRates.set(result.provider, [...current, result.success ? 1 : 0]);
        });

        const providerAverages = Array.from(providerSuccessRates.entries())
          .map(([provider, scores]) => ({
            provider,
            avgSuccess: scores.reduce((a, b) => a + b, 0) / scores.length
          }))
          .sort((a, b) => b.avgSuccess - a.avgSuccess);

        return {
          category,
          totalTests: categoryResults.length,
          successRate,
          avgResponseTime,
          bestProvider: providerAverages[0]?.provider || 'None',
          worstProvider: providerAverages[providerAverages.length - 1]?.provider || 'None',
          difficultyImpact: this.calculateDifficultyImpact(categoryResults)
        };
      });

    // Cost analysis
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    const costByProvider: Record<string, number> = {};
    results.forEach(result => {
      costByProvider[result.provider] = (costByProvider[result.provider] || 0) + (result.cost || 0);
    });

    const costAnalysis: CostAnalysis = {
      totalCost,
      costByProvider,
      costPerSuccessfulRequest: totalCost / successfulTests,
      mostCostEffective: this.findMostCostEffective(providerComparison),
      costSavingOpportunities: this.generateCostSavingTips(providerComparison)
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      providerComparison,
      categoryPerformance,
      costAnalysis
    );

    return {
      overallSuccessRate,
      providerComparison,
      categoryPerformance,
      costAnalysis,
      recommendations
    };
  }

  private calculateReliabilityScore(results: TestResult[]): number {
    const successRate = results.filter(r => r.success).length / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.performanceMetrics.responseTime, 0) / results.length;
    const consistencyScore = 1 - (this.calculateVariance(results.map(r => r.performanceMetrics.responseTime)) / 10000);
    
    return (successRate * 0.6) + (Math.max(0, 1 - avgResponseTime / 30000) * 0.2) + (consistencyScore * 0.2);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  private calculateCategoryStrengths(results: TestResult[]): Record<string, number> {
    const categorySuccess: Record<string, number[]> = {};
    
    results.forEach(result => {
      if (!categorySuccess[result.site.category]) {
        categorySuccess[result.site.category] = [];
      }
      categorySuccess[result.site.category].push(result.success ? 1 : 0);
    });

    const strengths: Record<string, number> = {};
    Object.entries(categorySuccess).forEach(([category, successes]) => {
      strengths[category] = successes.reduce((a, b) => a + b, 0) / successes.length;
    });

    return strengths;
  }

  private calculateCategoryWeaknesses(results: TestResult[]): Record<string, number> {
    const strengths = this.calculateCategoryStrengths(results);
    const weaknesses: Record<string, number> = {};
    
    Object.entries(strengths).forEach(([category, strength]) => {
      weaknesses[category] = 1 - strength;
    });

    return weaknesses;
  }

  private calculateDifficultyImpact(results: TestResult[]): Record<string, number> {
    const difficultySuccess: Record<string, number[]> = {};
    
    results.forEach(result => {
      if (!difficultySuccess[result.site.difficulty]) {
        difficultySuccess[result.site.difficulty] = [];
      }
      difficultySuccess[result.site.difficulty].push(result.success ? 1 : 0);
    });

    const impact: Record<string, number> = {};
    Object.entries(difficultySuccess).forEach(([difficulty, successes]) => {
      impact[difficulty] = successes.reduce((a, b) => a + b, 0) / successes.length;
    });

    return impact;
  }

  private findMostCostEffective(providers: ProviderComparison[]): string {
    return providers
      .map(p => ({ ...p, efficiency: p.successRate / (p.avgCost + 0.001) }))
      .sort((a, b) => b.efficiency - a.efficiency)[0]?.providerName || 'None';
  }

  private generateCostSavingTips(providers: ProviderComparison[]): string[] {
    const tips: string[] = [];
    
    const freeProviders = providers.filter(p => p.avgCost === 0);
    const paidProviders = providers.filter(p => p.avgCost > 0);

    if (freeProviders.length > 0 && paidProviders.length > 0) {
      const bestFree = freeProviders.sort((a, b) => b.successRate - a.successRate)[0];
      tips.push(`Consider using ${bestFree.providerName} first (free, ${(bestFree.successRate * 100).toFixed(1)}% success rate)`);
    }

    return tips;
  }

  private generateRecommendations(
    providers: ProviderComparison[],
    categories: CategoryPerformance[],
    costs: CostAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Best overall provider
    const bestProvider = providers.sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0];
    if (bestProvider) {
      recommendations.push(`Best overall provider: ${bestProvider.providerName} (${(bestProvider.reliabilityScore * 100).toFixed(1)}% reliability score)`);
    }

    // Cost optimization
    if (costs.mostCostEffective) {
      recommendations.push(`Most cost-effective: ${costs.mostCostEffective}`);
    }

    // Category-specific recommendations
    categories.forEach(category => {
      recommendations.push(`For ${category.category} sites: Use ${category.bestProvider} (${(category.successRate * 100).toFixed(1)}% success rate)`);
    });

    return recommendations;
  }

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export test results to various formats
   */
  async exportResults(report: TestReport, format: 'json' | 'csv' | 'html'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.convertToCSV(report);
      
      case 'html':
        return this.generateHTMLReport(report);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertToCSV(report: TestReport): string {
    const headers = ['Test ID', 'Site', 'Provider', 'Success', 'Response Time', 'Cost', 'Elements Found'];
    const rows = report.results.map(result => [
      result.testId,
      result.site.name,
      result.provider,
      result.success,
      result.performanceMetrics.responseTime,
      result.cost || 0,
      result.performanceMetrics.elementsFound
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generateHTMLReport(report: TestReport): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scraping Test Report: ${report.suiteName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
          .provider-comparison { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .success { color: green; }
          .failure { color: red; }
        </style>
      </head>
      <body>
        <h1>Scraping Test Report: ${report.suiteName}</h1>
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Tests: ${report.totalTests}</p>
          <p>Overall Success Rate: ${(report.summary.overallSuccessRate * 100).toFixed(1)}%</p>
          <p>Total Cost: $${report.summary.costAnalysis.totalCost.toFixed(4)}</p>
          <p>Duration: ${((report.endTime - report.startTime) / 1000).toFixed(2)}s</p>
        </div>
        
        <h2>Provider Comparison</h2>
        <table>
          <tr>
            <th>Provider</th>
            <th>Success Rate</th>
            <th>Avg Response Time</th>
            <th>Avg Cost</th>
            <th>Reliability Score</th>
          </tr>
          ${report.summary.providerComparison.map(provider => `
            <tr>
              <td>${provider.providerName}</td>
              <td>${(provider.successRate * 100).toFixed(1)}%</td>
              <td>${provider.avgResponseTime.toFixed(0)}ms</td>
              <td>$${provider.avgCost.toFixed(4)}</td>
              <td>${(provider.reliabilityScore * 100).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </table>

        <h2>Recommendations</h2>
        <ul>
          ${report.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </body>
      </html>
    `;
  }
}