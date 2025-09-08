import { scrapeWebsite as originalScrapeWebsite } from '../scraper/scrapeWebsite';
import { HTMLObjectAnalyzer, HTMLGraph, HTMLObject } from './htmlObjectAnalyzer';
import { PerformanceMonitor, PerformanceMetrics } from './performanceMonitor';
import { SQLMagicIntegration, SQLMagicConfig } from './sqlMagicIntegration';
import { ScrapedData, ScrapeOptions } from '../types';

export interface EnhancedScrapeOptions extends ScrapeOptions {
  enableAnalytics?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableSQLStorage?: boolean;
  sqlConfig?: SQLMagicConfig;
  generateGraphML?: boolean;
  generateSchemaOrg?: boolean;
}

export interface EnhancedScrapeResult {
  originalData: ScrapedData;
  htmlGraph?: HTMLGraph;
  performanceMetrics?: PerformanceMetrics;
  graphML?: string;
  schemaOrgData?: Record<string, any>;
  error?: string;
  url: string;
}

export interface AnalyticsInsights {
  objectTypeDistribution: Record<string, number>;
  semanticRoleDistribution: Record<string, number>;
  complexityAnalysis: {
    totalComplexity: number;
    averageDepth: number;
    maxDepth: number;
    relationshipDensity: number;
  };
  performanceSummary: {
    totalTime: number;
    analysisTime: number;
    storageTime: number;
    efficiency: number;
  };
  qualityMetrics: {
    structuredDataCoverage: number;
    accessibilityScore: number;
    semanticRichness: number;
  };
  recommendations: string[];
}

export class EnhancedScraper {
  private htmlAnalyzer: HTMLObjectAnalyzer;
  private performanceMonitor: PerformanceMonitor;
  private sqlIntegration?: SQLMagicIntegration;

  constructor() {
    this.htmlAnalyzer = new HTMLObjectAnalyzer();
    this.performanceMonitor = new PerformanceMonitor();
  }

  async initializeSQLIntegration(config: SQLMagicConfig): Promise<boolean> {
    try {
      this.sqlIntegration = new SQLMagicIntegration(config);
      const connected = await this.sqlIntegration.connect();
      if (connected) {
        console.log('SQLMagic integration initialized successfully');
      }
      return connected;
    } catch (error) {
      console.error('Failed to initialize SQLMagic integration:', error);
      return false;
    }
  }

  async scrape(
    url: string,
    options: EnhancedScrapeOptions,
    setProgress: (msg: string) => void
  ): Promise<EnhancedScrapeResult> {
    const startTime = Date.now();
    let performanceId: string | undefined;

    try {
      // Start performance monitoring if enabled
      if (options.enablePerformanceMonitoring !== false) {
        performanceId = this.performanceMonitor.startScrapeMonitoring(url);
        setProgress('Starting performance monitoring...');
      }

      // Perform original scraping
      setProgress('Scraping website...');
      const scrapeStart = Date.now();
      const originalResult = await originalScrapeWebsite(url, options, setProgress);
      const scrapeTime = Date.now() - scrapeStart;

      if (originalResult.error) {
        if (performanceId) {
          this.performanceMonitor.updateScrapeMetrics(performanceId, {
            scraping: { totalTime: scrapeTime },
            quality: { errorCount: 1, successRate: 0 }
          });
        }
        return {
          originalData: {} as ScrapedData,
          error: originalResult.error,
          url: originalResult.url
        };
      }

      const result: EnhancedScrapeResult = {
        originalData: originalResult.data!,
        url: originalResult.url
      };

      // Update performance metrics
      if (performanceId && originalResult.data) {
        this.performanceMonitor.updateScrapeMetrics(performanceId, {
          scraping: {
            totalTime: scrapeTime,
            fetchTime: originalResult.data.status.responseTime || 0,
            proxyUsed: originalResult.data.status.proxyUsed || ''
          },
          network: {
            responseTime: originalResult.data.status.responseTime || 0,
            contentLength: originalResult.data.status.contentLength || 0,
            contentType: originalResult.data.status.contentType || '',
            statusCode: originalResult.data.status.statusCode
          },
          quality: {
            successRate: originalResult.data.status.success ? 1.0 : 0.0,
            errorCount: 0,
            warningCount: 0
          }
        });
      }

      // Perform HTML analysis if enabled
      if (options.enableAnalytics !== false && originalResult.data) {
        setProgress('Analyzing HTML structure...');
        const analysisStart = Date.now();
        
        // Create HTML content for analysis (we need to reconstruct or get raw HTML)
        const htmlContent = this.reconstructHTML(originalResult.data);
        
        result.htmlGraph = this.htmlAnalyzer.analyzeHTML(htmlContent, url);
        const analysisTime = Date.now() - analysisStart;

        // Update performance metrics with analysis data
        if (performanceId) {
          this.performanceMonitor.updateScrapeMetrics(performanceId, {
            scraping: { analysisTime },
            content: {
              htmlSize: htmlContent.length,
              objectCount: result.htmlGraph.metadata.totalObjects,
              relationshipCount: result.htmlGraph.metadata.totalRelationships,
              complexity: result.htmlGraph.metadata.performance.complexity,
              maxDepth: Math.max(...Array.from(result.htmlGraph.objects.values()).map(obj => obj.position.depth))
            }
          });
        }

        // Generate GraphML if requested
        if (options.generateGraphML) {
          setProgress('Generating GraphML...');
          result.graphML = this.htmlAnalyzer.exportToGraphML(result.htmlGraph);
        }

        // Generate Schema.org data if requested
        if (options.generateSchemaOrg) {
          setProgress('Generating Schema.org data...');
          result.schemaOrgData = this.htmlAnalyzer.generateSchemaOrgData(result.htmlGraph);
        }

        // Store in SQL database if enabled
        if (options.enableSQLStorage && this.sqlIntegration?.isConnected()) {
          setProgress('Storing data in SQLMagic server...');
          const storageStart = Date.now();
          
          await this.sqlIntegration.storeHTMLGraph(result.htmlGraph);
          
          // const storageTime = Date.now() - storageStart;  // For future use
          
          if (performanceId) {
            this.performanceMonitor.updateScrapeMetrics(performanceId, {
              scraping: { totalTime: Date.now() - startTime }
            });
          }
        }
      }

      // Get final performance metrics
      if (performanceId) {
        const finalMetrics = this.performanceMonitor.getMetrics(1)[0];
        if (finalMetrics && finalMetrics.id === performanceId) {
          result.performanceMetrics = finalMetrics;
          
          // Store performance metrics in SQL if enabled
          if (options.enableSQLStorage && this.sqlIntegration?.isConnected()) {
            await this.sqlIntegration.storePerformanceMetrics(finalMetrics);
          }
        }
      }

      setProgress('Analysis complete!');
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during enhanced scraping';
      
      if (performanceId) {
        this.performanceMonitor.updateScrapeMetrics(performanceId, {
          scraping: { totalTime: Date.now() - startTime },
          quality: { errorCount: 1, successRate: 0 }
        });
      }

      return {
        originalData: {} as ScrapedData,
        error: errorMessage,
        url
      };
    }
  }

  private reconstructHTML(data: ScrapedData): string {
    // This is a simplified reconstruction - in a real implementation,
    // you might want to store the original HTML or use a more sophisticated approach
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${data.title}</title>
  <meta name="description" content="${data.description}">
`;

    // Add metadata as meta tags
    Object.entries(data.metadata).forEach(([key, value]) => {
      html += `  <meta name="${key}" content="${value}">\n`;
    });

    html += `</head>
<body>
  <h1>${data.title}</h1>
  <p>${data.description}</p>
`;

    // Add text content
    data.text.forEach(text => {
      html += `  <p>${text}</p>\n`;
    });

    // Add links
    if (data.links.length > 0) {
      html += '  <nav>\n';
      data.links.forEach(link => {
        html += `    <a href="${link.url}">${link.text}</a>\n`;
      });
      html += '  </nav>\n';
    }

    // Add images
    data.images.forEach(img => {
      html += `  <img src="${img.src}" alt="${img.alt}">\n`;
    });

    // Add events as structured data
    if (data.events.length > 0) {
      data.events.forEach(event => {
        html += `  <script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": event.summary,
  "startDate": event.start?.date,
  "endDate": event.end?.date,
  "location": event.location,
  "description": event.description
}, null, 2)}
  </script>\n`;
      });
    }

    html += '</body>\n</html>';
    return html;
  }

  generateInsights(result: EnhancedScrapeResult): AnalyticsInsights {
    if (!result.htmlGraph || !result.performanceMetrics) {
      throw new Error('Analytics data not available - ensure analytics are enabled');
    }

    const { htmlGraph, performanceMetrics } = result;
    const objects = Array.from(htmlGraph.objects.values());

    // Object type distribution
    const objectTypeDistribution: Record<string, number> = {};
    objects.forEach(obj => {
      objectTypeDistribution[obj.type] = (objectTypeDistribution[obj.type] || 0) + 1;
    });

    // Semantic role distribution
    const semanticRoleDistribution: Record<string, number> = {};
    objects.forEach(obj => {
      if (obj.semanticRole) {
        semanticRoleDistribution[obj.semanticRole] = (semanticRoleDistribution[obj.semanticRole] || 0) + 1;
      }
    });

    // Complexity analysis
    const depths = objects.map(obj => obj.position.depth);
    const complexityAnalysis = {
      totalComplexity: htmlGraph.metadata.performance.complexity,
      averageDepth: depths.reduce((sum, d) => sum + d, 0) / depths.length,
      maxDepth: Math.max(...depths),
      relationshipDensity: htmlGraph.relationships.length / objects.length
    };

    // Performance summary
    const performanceSummary = {
      totalTime: performanceMetrics.scraping.totalTime,
      analysisTime: performanceMetrics.scraping.analysisTime,
      storageTime: 0, // Would need to track this separately
      efficiency: objects.length / (performanceMetrics.scraping.totalTime / 1000) // objects per second
    };

    // Quality metrics
    const structuredObjects = objects.filter(obj => obj.schemaOrgType || obj.semanticRole);
    const qualityMetrics = {
      structuredDataCoverage: structuredObjects.length / objects.length,
      accessibilityScore: this.calculateAccessibilityScore(objects),
      semanticRichness: Object.keys(semanticRoleDistribution).length / objects.length
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      objectTypeDistribution,
      semanticRoleDistribution,
      complexityAnalysis,
      qualityMetrics,
      performanceMetrics
    );

    return {
      objectTypeDistribution,
      semanticRoleDistribution,
      complexityAnalysis,
      performanceSummary,
      qualityMetrics,
      recommendations
    };
  }

  private calculateAccessibilityScore(objects: HTMLObject[]): number {
    let score = 0;
    let maxScore = 0;

    objects.forEach(obj => {
      maxScore += 1;

      // Check for alt text on images
      if (obj.tag === 'img' && obj.attributes.alt) {
        score += 1;
      }

      // Check for semantic HTML usage
      if (['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'].includes(obj.tag)) {
        score += 1;
      }

      // Check for proper heading structure
      if (obj.tag.match(/^h[1-6]$/)) {
        score += 1;
      }

      // Check for ARIA labels
      if (obj.attributes['aria-label'] || obj.attributes['aria-labelledby']) {
        score += 1;
      }

      // Check for form labels
      if (obj.tag === 'input' && obj.attributes.id) {
        const hasLabel = objects.some(labelObj => 
          labelObj.tag === 'label' && labelObj.attributes.for === obj.attributes.id
        );
        if (hasLabel) score += 1;
      }
    });

    return maxScore > 0 ? score / maxScore : 0;
  }

  private generateRecommendations(
    objectTypes: Record<string, number>,
    semanticRoles: Record<string, number>,
    complexity: AnalyticsInsights['complexityAnalysis'],
    quality: AnalyticsInsights['qualityMetrics'],
    performance: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (performance.scraping.totalTime > 10000) {
      recommendations.push('Consider optimizing scraping performance - total time exceeds 10 seconds');
    }

    if (performance.network.responseTime > 3000) {
      recommendations.push('Network response time is slow - consider using faster proxy services');
    }

    // Complexity recommendations
    if (complexity.totalComplexity > 500) {
      recommendations.push('Page complexity is high - consider focusing on specific sections for better performance');
    }

    if (complexity.maxDepth > 15) {
      recommendations.push('DOM structure is very deep - this may indicate over-nested HTML');
    }

    // Quality recommendations
    if (quality.structuredDataCoverage < 0.1) {
      recommendations.push('Low structured data coverage - consider implementing schema.org markup');
    }

    if (quality.accessibilityScore < 0.5) {
      recommendations.push('Accessibility score is low - review alt texts, semantic HTML, and ARIA labels');
    }

    if (quality.semanticRichness < 0.1) {
      recommendations.push('Limited semantic markup detected - consider using more semantic HTML elements');
    }

    // Content recommendations
    const interactiveCount = objectTypes.interactive || 0;
    const totalObjects = Object.values(objectTypes).reduce((sum, count) => sum + count, 0);
    
    if (interactiveCount / totalObjects > 0.3) {
      recommendations.push('High ratio of interactive elements - ensure proper usability and accessibility');
    }

    if (!semanticRoles.navigation) {
      recommendations.push('No navigation elements detected - consider adding navigation markup');
    }

    if (!semanticRoles['main-content'] && !semanticRoles.main) {
      recommendations.push('No main content area detected - consider using <main> element');
    }

    if (recommendations.length === 0) {
      recommendations.push('Page analysis looks good - all metrics are within acceptable ranges');
    }

    return recommendations;
  }

  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  getSQLIntegration(): SQLMagicIntegration | undefined {
    return this.sqlIntegration;
  }

  async exportAnalyticsData(format: 'json' | 'csv' | 'graphml' = 'json'): Promise<string> {
    switch (format) {
      case 'csv':
        const metrics = this.performanceMonitor.getMetrics();
        return this.performanceMonitor.exportToCSV(metrics);
      
      case 'json':
        return JSON.stringify({
          performanceMetrics: this.performanceMonitor.getMetrics(50),
          performanceAlerts: this.performanceMonitor.getAlerts(undefined, 50),
          sqlQueries: this.sqlIntegration?.getQueryLog() || []
        }, null, 2);
      
      case 'graphml':
        throw new Error('GraphML export requires a specific HTML graph - use the graphML property from scrape results');
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}