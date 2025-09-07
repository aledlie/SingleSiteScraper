import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedScraper } from '../../../src/analytics/enhancedScraper';
import { HTMLObjectAnalyzer } from '../../../src/analytics/htmlObjectAnalyzer';
import { PerformanceMonitor } from '../../../src/analytics/performanceMonitor';
import { SQLMagicIntegration } from '../../../src/analytics/sqlMagicIntegration';

// Mock the original scraper
vi.mock('../scraper/scrapeWebsite', () => ({
  scrapeWebsite: vi.fn().mockResolvedValue({
    data: {
      title: 'Integration Test Page',
      description: 'A comprehensive test of the enhanced scraping workflow',
      links: [
        { text: 'Home', url: 'https://test.com/home' },
        { text: 'About', url: 'https://test.com/about' }
      ],
      images: [
        { src: 'https://test.com/logo.png', alt: 'Company Logo' }
      ],
      text: [
        'Welcome to our medical information portal',
        'Find comprehensive healthcare resources',
        'Evidence-based medical guidelines'
      ],
      metadata: { 
        author: 'Medical Team',
        keywords: 'healthcare, medical, information',
        language: 'en'
      },
      events: [
        {
          summary: 'Medical Conference 2024',
          start: { date: '2024-06-15' },
          end: { date: '2024-06-17' },
          location: 'Convention Center',
          description: 'Annual medical conference'
        }
      ],
      status: {
        success: true,
        responseTime: 1500,
        contentLength: 25000,
        contentType: 'text/html',
        statusCode: 200,
        proxyUsed: 'Direct'
      }
    },
    url: 'https://test.com'
  })
}));

describe('Full Enhanced Scraping Workflow Integration Tests', () => {
  let enhancedScraper: EnhancedScraper;
  let sqlIntegration: SQLMagicIntegration;

  beforeEach(() => {
    vi.clearAllMocks();
    enhancedScraper = new EnhancedScraper();
    sqlIntegration = new SQLMagicIntegration({
      host: 'localhost',
      port: 5432,
      database: 'test_analytics'
    });
  });

  describe('Complete Scraping Workflow', () => {
    it('performs end-to-end scraping with all analytics enabled', async () => {
      const mockProgress = vi.fn();
      const url = 'https://test.com';
      
      const result = await enhancedScraper.scrape(url, {
        enableAnalytics: true,
        enablePerformanceMonitoring: true,
        enableSQLStorage: false, // Skip SQL for this test
        generateGraphML: true,
        generateSchemaOrg: true,
        includeText: true,
        includeLinks: true,
        includeImages: true,
        includeEvents: true
      }, mockProgress);
      
      // Verify all components worked
      expect(result.error).toBeUndefined();
      expect(result.originalData).toBeDefined();
      expect(result.htmlGraph).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
      expect(result.graphML).toBeDefined();
      expect(result.schemaOrgData).toBeDefined();
      
      // Verify progress callbacks were called
      expect(mockProgress).toHaveBeenCalledWith('Starting performance monitoring...');
      expect(mockProgress).toHaveBeenCalledWith('Scraping website...');
      expect(mockProgress).toHaveBeenCalledWith('Analyzing HTML structure...');
      expect(mockProgress).toHaveBeenCalledWith('Generating GraphML...');
      expect(mockProgress).toHaveBeenCalledWith('Generating Schema.org data...');
      expect(mockProgress).toHaveBeenCalledWith('Analysis complete!');
    });

    it('generates comprehensive insights from scraped data', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true
      }, () => {});
      
      expect(result.htmlGraph).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
      
      const insights = enhancedScraper.generateInsights(result);
      
      // Verify insights structure
      expect(insights.objectTypeDistribution).toBeDefined();
      expect(insights.semanticRoleDistribution).toBeDefined();
      expect(insights.complexityAnalysis).toBeDefined();
      expect(insights.performanceSummary).toBeDefined();
      expect(insights.qualityMetrics).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      
      // Verify insights have reasonable values
      expect(insights.complexityAnalysis.totalComplexity).toBeGreaterThan(0);
      expect(insights.performanceSummary.efficiency).toBeGreaterThan(0);
      expect(insights.qualityMetrics.structuredDataCoverage).toBeGreaterThanOrEqual(0);
      expect(insights.qualityMetrics.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(insights.recommendations)).toBe(true);
    });

    it('handles SQL integration workflow', async () => {
      // Initialize SQL integration
      const connected = await enhancedScraper.initializeSQLIntegration({
        host: 'localhost',
        port: 5432,
        database: 'test_analytics'
      });
      
      expect(connected).toBe(true);
      
      // Perform scraping with SQL storage
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true,
        enableSQLStorage: true
      }, () => {});
      
      expect(result.error).toBeUndefined();
      expect(result.htmlGraph).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
    });

    it('exports data in multiple formats', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true
      }, () => {});
      
      // Test JSON export
      const jsonData = await enhancedScraper.exportAnalyticsData('json');
      expect(jsonData).toBeDefined();
      expect(() => JSON.parse(jsonData)).not.toThrow();
      
      // Test CSV export
      const csvData = await enhancedScraper.exportAnalyticsData('csv');
      expect(csvData).toBeDefined();
      expect(csvData).toContain(','); // Should be CSV format
      
      // Verify GraphML was generated
      expect(result.graphML).toBeDefined();
      expect(result.graphML).toContain('<graphml');
    });
  });

  describe('Component Integration', () => {
    it('integrates HTML analyzer with performance monitor', async () => {
      const htmlAnalyzer = new HTMLObjectAnalyzer();
      const perfMonitor = new PerformanceMonitor();
      
      const testHtml = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <header role="banner">
              <h1>Welcome</h1>
              <nav role="navigation">
                <a href="/home">Home</a>
                <a href="/about">About</a>
              </nav>
            </header>
            <main role="main">
              <article itemscope itemtype="https://schema.org/Article">
                <h2 itemprop="headline">Medical Guidelines</h2>
                <p itemprop="description">Evidence-based recommendations</p>
              </article>
            </main>
          </body>
        </html>
      `;
      
      const monitorId = perfMonitor.startScrapeMonitoring('https://test.com');
      const startTime = Date.now();
      
      const graph = htmlAnalyzer.analyzeHTML(testHtml, 'https://test.com');
      const analysisTime = Date.now() - startTime;
      
      perfMonitor.updateScrapeMetrics(monitorId, {
        scraping: { analysisTime, totalTime: analysisTime + 500 },
        content: {
          htmlSize: testHtml.length,
          objectCount: graph.metadata.totalObjects,
          relationshipCount: graph.metadata.totalRelationships,
          complexity: graph.metadata.performance.complexity,
          maxDepth: Math.max(...Array.from(graph.objects.values()).map(obj => obj.position.depth))
        }
      });
      
      const metrics = perfMonitor.getMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].content.objectCount).toBe(graph.metadata.totalObjects);
    });

    it('creates comprehensive analytics workflow', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true,
        generateGraphML: true,
        generateSchemaOrg: true
      }, () => {});
      
      // Generate insights
      const insights = enhancedScraper.generateInsights(result);
      
      // Verify all data flows correctly
      expect(result.originalData.title).toBe('Integration Test Page');
      expect(result.htmlGraph!.metadata.url).toBe('https://test.com');
      expect(result.performanceMetrics!.url).toBe('https://test.com');
      
      // Verify insights reflect the data
      expect(Object.keys(insights.objectTypeDistribution).length).toBeGreaterThan(0);
      expect(insights.performanceSummary.totalTime).toBe(result.performanceMetrics!.scraping.totalTime);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles scraping failures gracefully', async () => {
      // Mock a scraping failure
      vi.doMock('../scraper/scrapeWebsite', () => ({
        scrapeWebsite: vi.fn().mockResolvedValue({
          error: 'Network timeout',
          url: 'https://failing-site.com'
        })
      }));
      
      const result = await enhancedScraper.scrape('https://failing-site.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true
      }, () => {});
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Network timeout');
      
      // Performance monitor should still record the failure
      const perfMonitor = enhancedScraper.getPerformanceMonitor();
      const metrics = perfMonitor.getMetrics(1);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('continues analysis even with partial data failures', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true,
        generateGraphML: true,
        generateSchemaOrg: true
      }, () => {});
      
      expect(result.error).toBeUndefined();
      
      // Even if some analysis fails, others should succeed
      expect(result.htmlGraph).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
    });

    it('handles SQL connection failures without breaking workflow', async () => {
      // Attempt to initialize with invalid config
      const sqlConnected = await enhancedScraper.initializeSQLIntegration({
        host: 'invalid-host',
        port: 9999,
        database: 'nonexistent'
      });
      
      // Should fail to connect but not throw
      expect(sqlConnected).toBe(false);
      
      // Scraping should still work without SQL
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enableSQLStorage: true // This should be ignored due to failed connection
      }, () => {});
      
      expect(result.error).toBeUndefined();
      expect(result.htmlGraph).toBeDefined();
    });
  });

  describe('Performance and Quality Validation', () => {
    it('validates performance metrics are within reasonable ranges', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true
      }, () => {});
      
      const metrics = result.performanceMetrics!;
      
      // Validate timing metrics
      expect(metrics.scraping.totalTime).toBeGreaterThan(0);
      expect(metrics.scraping.fetchTime).toBeGreaterThan(0);
      expect(metrics.scraping.analysisTime).toBeGreaterThan(0);
      
      // Validate network metrics
      expect(metrics.network.responseTime).toBeGreaterThan(0);
      expect(metrics.network.statusCode).toBe(200);
      
      // Validate quality metrics
      expect(metrics.quality.successRate).toBe(1.0);
      expect(metrics.quality.errorCount).toBe(0);
    });

    it('generates meaningful quality recommendations', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true
      }, () => {});
      
      const insights = enhancedScraper.generateInsights(result);
      
      expect(Array.isArray(insights.recommendations)).toBe(true);
      expect(insights.recommendations.length).toBeGreaterThan(0);
      
      // Recommendations should be meaningful strings
      insights.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(10); // Meaningful length
      });
    });

    it('detects and reports performance issues', async () => {
      // Mock slow response
      vi.doMock('../scraper/scrapeWebsite', () => ({
        scrapeWebsite: vi.fn().mockResolvedValue({
          data: {
            title: 'Slow Site',
            description: 'This site is slow',
            links: [],
            images: [],
            text: [],
            metadata: {},
            events: [],
            status: {
              success: true,
              responseTime: 5000, // Very slow
              contentLength: 100000, // Large
              contentType: 'text/html',
              statusCode: 200
            }
          },
          url: 'https://slow-site.com'
        })
      }));
      
      const perfMonitor = enhancedScraper.getPerformanceMonitor();
      
      await enhancedScraper.scrape('https://slow-site.com', {
        enablePerformanceMonitoring: true
      }, () => {});
      
      const alerts = perfMonitor.getAlerts('https://slow-site.com');
      
      // Should detect slow response time
      const responseAlert = alerts.find(a => a.category === 'network');
      expect(responseAlert).toBeDefined();
      expect(responseAlert!.message).toContain('response time');
    });
  });

  describe('Data Consistency and Validation', () => {
    it('ensures data consistency across all components', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        enableAnalytics: true,
        enablePerformanceMonitoring: true,
        generateGraphML: true,
        generateSchemaOrg: true
      }, () => {});
      
      // Verify URL consistency
      expect(result.url).toBe('https://test.com');
      expect(result.htmlGraph!.metadata.url).toBe('https://test.com');
      expect(result.performanceMetrics!.url).toBe('https://test.com');
      
      // Verify object counts match
      const insights = enhancedScraper.generateInsights(result);
      const totalObjects = Object.values(insights.objectTypeDistribution).reduce((sum, count) => sum + count, 0);
      expect(totalObjects).toBe(result.htmlGraph!.metadata.totalObjects);
      expect(totalObjects).toBe(result.performanceMetrics!.content.objectCount);
    });

    it('validates generated GraphML is well-formed', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        generateGraphML: true
      }, () => {});
      
      expect(result.graphML).toBeDefined();
      
      // Basic XML validation
      expect(result.graphML!).toContain('<?xml');
      expect(result.graphML!).toContain('<graphml');
      expect(result.graphML!).toContain('</graphml>');
      
      // Should contain graph elements
      expect(result.graphML!).toContain('<graph');
      expect(result.graphML!).toContain('<node');
    });

    it('validates Schema.org data structure', async () => {
      const result = await enhancedScraper.scrape('https://test.com', {
        generateSchemaOrg: true
      }, () => {});
      
      expect(result.schemaOrgData).toBeDefined();
      
      // Should be valid JSON-LD structure
      expect(result.schemaOrgData!['@context']).toBeDefined();
      expect(result.schemaOrgData!['@type']).toBeDefined();
      
      // Should contain meaningful data
      expect(Object.keys(result.schemaOrgData!).length).toBeGreaterThan(2);
    });
  });
});