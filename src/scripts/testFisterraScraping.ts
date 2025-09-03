import { EnhancedScraper } from '../analytics/enhancedScraper';
import fs from 'fs';
import path from 'path';

async function testFisterraScraping() {
  const scraper = new EnhancedScraper();
  const url = 'https://www.fisterra.com';
  
  console.log('Starting Fisterra scraping test...');
  
  try {
    const result = await scraper.scrape(url, {
      enableAnalytics: true,
      enablePerformanceMonitoring: true,
      enableSQLStorage: false, // Disable for now
      generateGraphML: true,
      generateSchemaOrg: true,
      includeImages: true,
      includeLinks: true,
      includeEvents: true,
      maxPages: 1
    }, (progress) => {
      console.log(`Progress: ${progress}`);
    });

    if (result.error) {
      console.error('Scraping failed:', result.error);
      return;
    }

    console.log('Scraping successful! Generating insights...');
    
    // Generate insights
    const insights = scraper.generateInsights(result);
    
    // Save results to files
    const outputDir = path.join(process.cwd(), 'fisterra-test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save scraped data
    fs.writeFileSync(
      path.join(outputDir, 'scraped-data.json'),
      JSON.stringify(result.originalData, null, 2)
    );
    
    // Save HTML graph
    if (result.htmlGraph) {
      fs.writeFileSync(
        path.join(outputDir, 'html-graph.json'),
        JSON.stringify(result.htmlGraph, null, 2)
      );
    }
    
    // Save GraphML
    if (result.graphML) {
      fs.writeFileSync(
        path.join(outputDir, 'graph.graphml'),
        result.graphML
      );
    }
    
    // Save Schema.org data
    if (result.schemaOrgData) {
      fs.writeFileSync(
        path.join(outputDir, 'schema-org.json'),
        JSON.stringify(result.schemaOrgData, null, 2)
      );
    }
    
    // Save performance metrics
    if (result.performanceMetrics) {
      fs.writeFileSync(
        path.join(outputDir, 'performance-metrics.json'),
        JSON.stringify(result.performanceMetrics, null, 2)
      );
    }
    
    // Save insights
    fs.writeFileSync(
      path.join(outputDir, 'analytics-insights.json'),
      JSON.stringify(insights, null, 2)
    );
    
    console.log('\n=== SCRAPING RESULTS ===');
    console.log(`URL: ${result.url}`);
    console.log(`Title: ${result.originalData.title}`);
    console.log(`Description: ${result.originalData.description}`);
    console.log(`Total text blocks: ${result.originalData.text.length}`);
    console.log(`Total links: ${result.originalData.links.length}`);
    console.log(`Total images: ${result.originalData.images.length}`);
    
    if (result.htmlGraph) {
      console.log(`\n=== HTML ANALYSIS ===`);
      console.log(`Total objects: ${result.htmlGraph.metadata.totalObjects}`);
      console.log(`Total relationships: ${result.htmlGraph.metadata.totalRelationships}`);
      console.log(`Analysis time: ${result.htmlGraph.metadata.analysisTime}ms`);
      console.log(`Complexity score: ${result.htmlGraph.metadata.performance.complexity}`);
    }
    
    if (result.performanceMetrics) {
      console.log(`\n=== PERFORMANCE METRICS ===`);
      console.log(`Total scraping time: ${result.performanceMetrics.scraping.totalTime}ms`);
      console.log(`Fetch time: ${result.performanceMetrics.scraping.fetchTime}ms`);
      console.log(`Analysis time: ${result.performanceMetrics.scraping.analysisTime}ms`);
      console.log(`Response time: ${result.performanceMetrics.network.responseTime}ms`);
      console.log(`Content size: ${result.performanceMetrics.content.htmlSize} bytes`);
    }
    
    console.log(`\n=== INSIGHTS ===`);
    console.log(`Object types:`, Object.keys(insights.objectTypeDistribution).length);
    console.log(`Semantic roles:`, Object.keys(insights.semanticRoleDistribution).length);
    console.log(`Complexity score: ${insights.complexityAnalysis.totalComplexity.toFixed(1)}`);
    console.log(`Max depth: ${insights.complexityAnalysis.maxDepth}`);
    console.log(`Average depth: ${insights.complexityAnalysis.averageDepth.toFixed(1)}`);
    console.log(`Structured data coverage: ${(insights.qualityMetrics.structuredDataCoverage * 100).toFixed(1)}%`);
    console.log(`Accessibility score: ${(insights.qualityMetrics.accessibilityScore * 100).toFixed(1)}%`);
    console.log(`Semantic richness: ${(insights.qualityMetrics.semanticRichness * 100).toFixed(1)}%`);
    
    console.log(`\n=== TOP RECOMMENDATIONS ===`);
    insights.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    console.log(`\n=== FILES SAVED ===`);
    console.log(`Results saved to: ${outputDir}/`);
    console.log('- scraped-data.json');
    console.log('- html-graph.json');
    console.log('- graph.graphml');
    console.log('- schema-org.json');
    console.log('- performance-metrics.json');
    console.log('- analytics-insights.json');
    
    return {
      result,
      insights,
      outputDir
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Export for use in other modules
export { testFisterraScraping };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFisterraScraping()
    .then(() => {
      console.log('\nTest completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}