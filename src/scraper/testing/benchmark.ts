/**
 * Comprehensive benchmarking and testing framework for scraping providers
 */

import { EnhancedScraper } from '../enhancedScraper';
import { FallbackStrategy } from '../providers/manager';
import fs from 'fs';
import path from 'path';

export interface BenchmarkSite {
  name: string;
  url: string;
  type: 'static' | 'spa' | 'protected' | 'complex';
  expectedElements?: {
    title?: boolean;
    description?: boolean;
    links?: number; // minimum expected
    images?: number; // minimum expected
    text?: boolean;
  };
}

export interface BenchmarkResult {
  site: BenchmarkSite;
  provider: string;
  success: boolean;
  responseTime: number;
  cost: number;
  htmlLength: number;
  error?: string;
  elementChecks?: {
    title: boolean;
    description: boolean;
    linksFound: number;
    imagesFound: number;
    textFound: boolean;
  };
  performanceScore: number;
}

export interface BenchmarkReport {
  timestamp: string;
  totalSites: number;
  totalProviders: number;
  totalTests: number;
  summary: {
    successRate: number;
    avgResponseTime: number;
    totalCost: number;
    bestProvider: string;
    worstProvider: string;
  };
  providerResults: Map<string, {
    successRate: number;
    avgResponseTime: number;
    totalCost: number;
    siteTypePerformance: Map<string, number>;
  }>;
  siteResults: Map<string, {
    successRate: number;
    bestProvider: string;
    avgResponseTime: number;
  }>;
  detailedResults: BenchmarkResult[];
}

export class ScrapingBenchmark {
  private scraper: EnhancedScraper;
  private testSites: BenchmarkSite[] = [
    {
      name: 'HTTPBin HTML Test',
      url: 'https://httpbin.org/html',
      type: 'static',
      expectedElements: { title: true, text: true }
    },
    {
      name: 'Example.com',
      url: 'https://example.com',
      type: 'static',
      expectedElements: { title: true, description: true, text: true }
    },
    {
      name: 'Quotes to Scrape',
      url: 'https://quotes.toscrape.com/',
      type: 'static',
      expectedElements: { title: true, links: 5, text: true }
    },
    {
      name: 'Books to Scrape',
      url: 'http://books.toscrape.com/',
      type: 'static',
      expectedElements: { title: true, images: 10, links: 20 }
    },
    {
      name: 'GitHub (SPA)',
      url: 'https://github.com',
      type: 'spa',
      expectedElements: { title: true, links: 10 }
    },
    {
      name: 'HackerNews',
      url: 'https://news.ycombinator.com',
      type: 'complex',
      expectedElements: { title: true, links: 30, text: true }
    }
  ];

  constructor() {
    this.scraper = new EnhancedScraper();
  }

  /**
   * Add custom test sites
   */
  addTestSite(site: BenchmarkSite) {
    this.testSites.push(site);
  }

  /**
   * Run comprehensive benchmark across all sites and providers
   */
  async runFullBenchmark(strategies: FallbackStrategy[] = ['cost-optimized', 'speed-optimized', 'javascript-first']): Promise<BenchmarkReport> {
    console.log('🚀 Starting comprehensive scraping benchmark...');
    
    const results: BenchmarkResult[] = [];
    const startTime = Date.now();

    // Test each strategy
    for (const strategy of strategies) {
      console.log(`\n📊 Testing strategy: ${strategy}`);
      
      const strategyScraper = new EnhancedScraper({
        strategy,
        maxCostPerRequest: 0.05, // Allow higher cost for testing
      });

      // Test each site
      for (const site of this.testSites) {
        console.log(`\n🌐 Testing: ${site.name} (${site.url})`);
        
        const siteResults = await this.benchmarkSite(site, strategyScraper, strategy);
        results.push(...siteResults);
      }

      await strategyScraper.cleanup();
    }

    console.log(`\n✅ Benchmark completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    
    return this.generateReport(results);
  }

  /**
   * Benchmark a single site across all available providers
   */
  private async benchmarkSite(site: BenchmarkSite, scraper: EnhancedScraper, strategy: FallbackStrategy): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const providers = scraper.getProviders();

    for (const provider of providers) {
      console.log(`  📡 Testing ${provider}...`);
      
      const startTime = Date.now();
      
      try {
        const result = await scraper.testProvider(provider, site.url, {
          timeout: 15000,
          stealth: site.type === 'protected' || site.type === 'spa',
          blockResources: true,
        });

        const elementChecks = this.validateElements(result.html, site.expectedElements);
        
        results.push({
          site,
          provider,
          success: true,
          responseTime: result.responseTime,
          cost: result.cost,
          htmlLength: result.html.length,
          elementChecks,
          performanceScore: scraper.getMetrics().get(provider)?.performanceScore || 0,
        });

        console.log(`    ✅ ${provider}: ${result.responseTime}ms, ${result.html.length} chars`);

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        results.push({
          site,
          provider,
          success: false,
          responseTime,
          cost: 0,
          htmlLength: 0,
          error: (error as Error).message,
          performanceScore: 0,
        });

        console.log(`    ❌ ${provider}: Failed - ${(error as Error).message}`);
      }
    }

    return results;
  }

  /**
   * Validate that expected elements are present in the HTML
   */
  private validateElements(html: string, expected?: BenchmarkSite['expectedElements']) {
    if (!expected) return undefined;

    const checks = {
      title: false,
      description: false,
      linksFound: 0,
      imagesFound: 0,
      textFound: false,
    };

    // Basic HTML checks
    if (expected.title) {
      checks.title = /<title[^>]*>[\s\S]*?<\/title>/i.test(html);
    }

    if (expected.description) {
      checks.description = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
    }

    if (expected.links) {
      const linkMatches = html.match(/<a[^>]*href[^>]*>/gi);
      checks.linksFound = linkMatches ? linkMatches.length : 0;
    }

    if (expected.images) {
      const imgMatches = html.match(/<img[^>]*src[^>]*>/gi);
      checks.imagesFound = imgMatches ? imgMatches.length : 0;
    }

    if (expected.text) {
      // Check for substantial text content (not just HTML tags)
      const textContent = html.replace(/<[^>]*>/g, '').trim();
      checks.textFound = textContent.length > 100;
    }

    return checks;
  }

  /**
   * Generate comprehensive benchmark report
   */
  private generateReport(results: BenchmarkResult[]): BenchmarkReport {
    const report: BenchmarkReport = {
      timestamp: new Date().toISOString(),
      totalSites: new Set(results.map(r => r.site.url)).size,
      totalProviders: new Set(results.map(r => r.provider)).size,
      totalTests: results.length,
      summary: {
        successRate: 0,
        avgResponseTime: 0,
        totalCost: 0,
        bestProvider: '',
        worstProvider: '',
      },
      providerResults: new Map(),
      siteResults: new Map(),
      detailedResults: results,
    };

    // Calculate summary stats
    const successfulResults = results.filter(r => r.success);
    report.summary.successRate = (successfulResults.length / results.length) * 100;
    
    if (successfulResults.length > 0) {
      report.summary.avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      report.summary.totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    }

    // Calculate provider performance
    const providerStats = new Map<string, BenchmarkResult[]>();
    results.forEach(result => {
      if (!providerStats.has(result.provider)) {
        providerStats.set(result.provider, []);
      }
      providerStats.get(result.provider)!.push(result);
    });

    let bestScore = 0;
    let worstScore = 100;

    for (const [provider, providerResults] of providerStats) {
      const successful = providerResults.filter(r => r.success);
      const successRate = (successful.length / providerResults.length) * 100;
      
      const avgResponseTime = successful.length > 0 
        ? successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length
        : 0;
      
      const totalCost = providerResults.reduce((sum, r) => sum + r.cost, 0);

      // Calculate site type performance
      const siteTypePerformance = new Map<string, number>();
      const typeGroups = new Map<string, BenchmarkResult[]>();
      
      providerResults.forEach(result => {
        const type = result.site.type;
        if (!typeGroups.has(type)) {
          typeGroups.set(type, []);
        }
        typeGroups.get(type)!.push(result);
      });

      for (const [type, typeResults] of typeGroups) {
        const typeSuccessRate = (typeResults.filter(r => r.success).length / typeResults.length) * 100;
        siteTypePerformance.set(type, typeSuccessRate);
      }

      report.providerResults.set(provider, {
        successRate,
        avgResponseTime,
        totalCost,
        siteTypePerformance,
      });

      // Track best/worst providers
      if (successRate > bestScore) {
        bestScore = successRate;
        report.summary.bestProvider = provider;
      }
      if (successRate < worstScore) {
        worstScore = successRate;
        report.summary.worstProvider = provider;
      }
    }

    // Calculate site performance
    const siteStats = new Map<string, BenchmarkResult[]>();
    results.forEach(result => {
      const siteName = result.site.name;
      if (!siteStats.has(siteName)) {
        siteStats.set(siteName, []);
      }
      siteStats.get(siteName)!.push(result);
    });

    for (const [siteName, siteResults] of siteStats) {
      const successful = siteResults.filter(r => r.success);
      const successRate = (successful.length / siteResults.length) * 100;
      
      let bestProvider = '';
      let bestResponseTime = Infinity;
      
      successful.forEach(result => {
        if (result.responseTime < bestResponseTime) {
          bestResponseTime = result.responseTime;
          bestProvider = result.provider;
        }
      });

      const avgResponseTime = successful.length > 0
        ? successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length
        : 0;

      report.siteResults.set(siteName, {
        successRate,
        bestProvider,
        avgResponseTime,
      });
    }

    return report;
  }

  /**
   * Export benchmark report to files
   */
  async exportReport(report: BenchmarkReport, outputDir = './benchmark-results'): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export JSON
    const jsonPath = path.join(outputDir, `benchmark-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Export CSV
    const csvPath = path.join(outputDir, `benchmark-${timestamp}.csv`);
    const csvContent = this.generateCSV(report);
    fs.writeFileSync(csvPath, csvContent);

    // Export HTML Report
    const htmlPath = path.join(outputDir, `benchmark-${timestamp}.html`);
    const htmlContent = this.generateHTMLReport(report);
    fs.writeFileSync(htmlPath, htmlContent);

    console.log(`📊 Reports exported:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV:  ${csvPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  /**
   * Generate CSV report
   */
  private generateCSV(report: BenchmarkReport): string {
    const headers = [
      'Site',
      'URL',
      'Type',
      'Provider',
      'Success',
      'ResponseTime',
      'Cost',
      'HTMLLength',
      'Error',
      'PerformanceScore'
    ].join(',');

    const rows = report.detailedResults.map(result => [
      result.site.name,
      result.site.url,
      result.site.type,
      result.provider,
      result.success,
      result.responseTime,
      result.cost,
      result.htmlLength,
      result.error || '',
      result.performanceScore
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: BenchmarkReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Scraping Benchmark Report - ${report.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px 20px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .metric-label { display: block; font-size: 12px; color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .success { color: green; }
        .failure { color: red; }
        .provider-section { margin: 30px 0; }
        .chart { margin: 20px 0; height: 300px; background: #f9f9f9; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Scraping Benchmark Report</h1>
    <div class="summary">
        <div class="metric">
            <span class="metric-value">${report.summary.successRate.toFixed(1)}%</span>
            <span class="metric-label">Success Rate</span>
        </div>
        <div class="metric">
            <span class="metric-value">${report.summary.avgResponseTime.toFixed(0)}ms</span>
            <span class="metric-label">Avg Response Time</span>
        </div>
        <div class="metric">
            <span class="metric-value">$${report.summary.totalCost.toFixed(4)}</span>
            <span class="metric-label">Total Cost</span>
        </div>
        <div class="metric">
            <span class="metric-value">${report.totalTests}</span>
            <span class="metric-label">Total Tests</span>
        </div>
    </div>

    <h2>Provider Performance</h2>
    <table>
        <tr>
            <th>Provider</th>
            <th>Success Rate</th>
            <th>Avg Response Time</th>
            <th>Total Cost</th>
            <th>Static Sites</th>
            <th>SPA Sites</th>
            <th>Complex Sites</th>
        </tr>
        ${Array.from(report.providerResults.entries()).map(([provider, stats]) => `
            <tr>
                <td><strong>${provider}</strong></td>
                <td class="${stats.successRate > 80 ? 'success' : 'failure'}">${stats.successRate.toFixed(1)}%</td>
                <td>${stats.avgResponseTime.toFixed(0)}ms</td>
                <td>$${stats.totalCost.toFixed(4)}</td>
                <td>${(stats.siteTypePerformance.get('static') || 0).toFixed(1)}%</td>
                <td>${(stats.siteTypePerformance.get('spa') || 0).toFixed(1)}%</td>
                <td>${(stats.siteTypePerformance.get('complex') || 0).toFixed(1)}%</td>
            </tr>
        `).join('')}
    </table>

    <h2>Detailed Results</h2>
    <table>
        <tr>
            <th>Site</th>
            <th>Provider</th>
            <th>Status</th>
            <th>Response Time</th>
            <th>Cost</th>
            <th>HTML Length</th>
            <th>Error</th>
        </tr>
        ${report.detailedResults.map(result => `
            <tr>
                <td>${result.site.name}</td>
                <td>${result.provider}</td>
                <td class="${result.success ? 'success' : 'failure'}">${result.success ? '✅ Success' : '❌ Failed'}</td>
                <td>${result.responseTime}ms</td>
                <td>$${result.cost.toFixed(4)}</td>
                <td>${result.htmlLength.toLocaleString()}</td>
                <td>${result.error || '-'}</td>
            </tr>
        `).join('')}
    </table>

    <footer>
        <p><em>Generated on ${report.timestamp}</em></p>
    </footer>
</body>
</html>`;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.scraper.cleanup();
  }
}

// Export a simple benchmark function for quick testing
export async function runQuickBenchmark(): Promise<BenchmarkReport> {
  const benchmark = new ScrapingBenchmark();
  const report = await benchmark.runFullBenchmark(['cost-optimized']);
  await benchmark.exportReport(report);
  await benchmark.cleanup();
  return report;
}