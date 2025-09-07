import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedScraper } from '../../../src/analytics/enhancedScraper';
import { HTMLObjectAnalyzer } from '../../../src/analytics/htmlObjectAnalyzer';
import { PerformanceMonitor } from '../../../src/analytics/performanceMonitor';

// Mock the original scraper
vi.mock('../scraper/scrapeWebsite', () => ({
  scrapeWebsite: vi.fn().mockResolvedValue({
    data: {
      title: 'Test Page',
      description: 'Test Description',
      links: [{ text: 'Test Link', url: 'https://test.com' }],
      images: [{ src: 'test.jpg', alt: 'Test Image' }],
      text: ['Test content'],
      metadata: { author: 'Test Author' },
      events: [],
      status: {
        success: true,
        responseTime: 1500,
        contentLength: 5000,
        contentType: 'text/html',
        proxyUsed: 'Direct'
      }
    },
    url: 'https://test.com'
  })
}));

describe('EnhancedScraper', () => {
  let scraper: EnhancedScraper;
  let mockSetProgress: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scraper = new EnhancedScraper();
    mockSetProgress = vi.fn();
  });

  it('should create an instance', () => {
    expect(scraper).toBeInstanceOf(EnhancedScraper);
  });

  it('should have performance monitor', () => {
    const monitor = scraper.getPerformanceMonitor();
    expect(monitor).toBeInstanceOf(PerformanceMonitor);
  });

  describe('scrape method', () => {
    it('should perform basic scraping', async () => {
      const result = await scraper.scrape(
        'https://test.com',
        {
          includeText: true,
          includeLinks: true,
          includeImages: true,
          includeMetadata: true,
          includeEvents: true,
          maxLinks: 100,
          maxImages: 10,
          maxTextElements: 200,
          maxEvents: 20,
          timeout: 30000,
          retryAttempts: 3,
          enableAnalytics: false
        },
        mockSetProgress
      );

      expect(result.originalData).toBeDefined();
      expect(result.originalData.title).toBe('Test Page');
      expect(result.url).toBe('https://test.com');
      expect(result.error).toBeUndefined();
    });

    it('should perform analytics when enabled', async () => {
      const result = await scraper.scrape(
        'https://test.com',
        {
          includeText: true,
          includeLinks: true,
          includeImages: true,
          includeMetadata: true,
          includeEvents: true,
          maxLinks: 100,
          maxImages: 10,
          maxTextElements: 200,
          maxEvents: 20,
          timeout: 30000,
          retryAttempts: 3,
          enableAnalytics: true,
          enablePerformanceMonitoring: true
        },
        mockSetProgress
      );

      expect(result.htmlGraph).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
      expect(result.htmlGraph?.metadata.totalObjects).toBeGreaterThan(0);
    });
  });
});

describe('HTMLObjectAnalyzer Integration', () => {
  it('should analyze HTML structure', () => {
    const analyzer = new HTMLObjectAnalyzer();
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <header><h1>Title</h1></header>
          <main>
            <article>
              <p>Content</p>
              <a href="#test">Link</a>
            </article>
          </main>
          <footer>Footer</footer>
        </body>
      </html>
    `;

    const graph = analyzer.analyzeHTML(html, 'https://test.com');
    
    expect(graph.objects.size).toBeGreaterThan(0);
    expect(graph.relationships.length).toBeGreaterThan(0);
    expect(graph.metadata.totalObjects).toBeGreaterThan(0);
    expect(graph.metadata.totalRelationships).toBeGreaterThan(0);
    expect(graph.metadata.performance.complexity).toBeGreaterThan(0);
  });
});

describe('PerformanceMonitor Integration', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should track scraping performance', () => {
    const id = monitor.startScrapeMonitoring('https://test.com');
    expect(id).toBeDefined();
    
    monitor.updateScrapeMetrics(id, {
      scraping: { totalTime: 2000, fetchTime: 1500, analysisTime: 500 },
      network: { responseTime: 1200, contentLength: 5000, contentType: 'text/html' },
      content: { htmlSize: 5000, objectCount: 50, complexity: 25.5 },
      quality: { successRate: 1.0, errorCount: 0, warningCount: 1 }
    });
    
    const metrics = monitor.getMetrics(1);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].id).toBe(id);
    expect(metrics[0].scraping.totalTime).toBe(2000);
  });
});