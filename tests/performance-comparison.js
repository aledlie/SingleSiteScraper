#!/usr/bin/env node

/**
 * Performance comparison between enhanced scraper and legacy system
 */

import { EnhancedScraper } from '../src/scraper/enhancedScraper.js';
import { scrapeWebsiteLegacy } from '../src/scraper/scrapeWebsite.js';

async function performanceComparison() {
  console.log('⚡ Performance Comparison: Enhanced vs Legacy Scraping\n');

  const testUrls = [
    'https://httpbin.org/html',
    'https://example.com',
    'https://httpbin.org/json',
  ];

  const results = {
    enhanced: {},
    legacy: {},
    comparison: {},
  };

  // Test Enhanced Scraper
  console.log('🔬 Testing Enhanced Scraper System...');
  const enhancedScraper = new EnhancedScraper({
    strategy: 'speed-optimized',
    maxCostPerRequest: 0.01,
  });

  for (const url of testUrls) {
    console.log(`\nTesting Enhanced: ${url}`);
    const attempts = [];
    
    // Test each provider individually
    const providers = enhancedScraper.getProviders();
    
    for (const providerName of providers) {
      try {
        const startTime = Date.now();
        const result = await enhancedScraper.testProvider(providerName, url, { timeout: 10000 });
        const endTime = Date.now();
        
        attempts.push({
          provider: providerName,
          success: true,
          responseTime: endTime - startTime,
          actualResponseTime: result.responseTime,
          contentLength: result.html.length,
          cost: result.cost,
        });
        
        console.log(`  ✅ ${providerName}: ${result.responseTime}ms, ${result.html.length} chars`);
      } catch (error) {
        console.log(`  ❌ ${providerName}: ${error.message}`);
        attempts.push({
          provider: providerName,
          success: false,
          error: error.message,
        });
      }
    }
    
    results.enhanced[url] = {
      attempts,
      bestProvider: attempts.find(a => a.success),
    };
  }

  // Test Legacy System
  console.log('\n🏛️  Testing Legacy Scraper System...');
  
  for (const url of testUrls) {
    console.log(`\nTesting Legacy: ${url}`);
    const startTime = Date.now();
    
    try {
      const result = await scrapeWebsiteLegacy(url, {
        includeText: true,
        includeLinks: true,
        includeImages: true,
        includeMetadata: true,
        includeEvents: false,
        timeout: 10000,
        retryAttempts: 2,
        requestTimeout: 10000,
        maxTextElements: 100,
        maxLinks: 50,
        maxImages: 20,
      }, () => {}); // Silent progress

      const endTime = Date.now();
      
      if (result.data) {
        results.legacy[url] = {
          success: true,
          responseTime: endTime - startTime,
          actualResponseTime: result.data.status?.responseTime,
          contentLength: result.data.status?.contentLength,
          proxyUsed: result.data.status?.proxyUsed,
        };
        
        console.log(`  ✅ Legacy: ${result.data.status?.responseTime}ms, ${result.data.status?.contentLength} chars via ${result.data.status?.proxyUsed}`);
      } else {
        results.legacy[url] = {
          success: false,
          error: result.error,
        };
        console.log(`  ❌ Legacy: ${result.error}`);
      }
    } catch (error) {
      results.legacy[url] = {
        success: false,
        error: error.message,
      };
      console.log(`  ❌ Legacy: ${error.message}`);
    }
  }

  // Analysis and Comparison
  console.log('\n📊 Performance Analysis\n');
  
  let enhancedSuccesses = 0;
  let legacySuccesses = 0;
  let enhancedTotalTime = 0;
  let legacyTotalTime = 0;
  let enhancedBestTime = 0;
  let legacyBestTime = 0;

  for (const url of testUrls) {
    console.log(`📄 ${url}:`);
    
    const enhanced = results.enhanced[url];
    const legacy = results.legacy[url];
    
    // Enhanced results
    if (enhanced.bestProvider) {
      enhancedSuccesses++;
      enhancedTotalTime += enhanced.bestProvider.responseTime;
      enhancedBestTime += enhanced.bestProvider.actualResponseTime;
      console.log(`   Enhanced: ✅ ${enhanced.bestProvider.responseTime}ms (${enhanced.bestProvider.provider})`);
    } else {
      console.log(`   Enhanced: ❌ All providers failed`);
    }
    
    // Legacy results  
    if (legacy.success) {
      legacySuccesses++;
      legacyTotalTime += legacy.responseTime;
      legacyBestTime += legacy.actualResponseTime;
      console.log(`   Legacy:   ✅ ${legacy.responseTime}ms (${legacy.proxyUsed})`);
    } else {
      console.log(`   Legacy:   ❌ ${legacy.error}`);
    }

    // Comparison for this URL
    if (enhanced.bestProvider && legacy.success) {
      const speedup = ((legacy.responseTime - enhanced.bestProvider.responseTime) / legacy.responseTime * 100);
      const symbol = speedup > 0 ? '🚀' : '🐌';
      console.log(`   Winner:   ${symbol} Enhanced is ${Math.abs(speedup).toFixed(1)}% ${speedup > 0 ? 'faster' : 'slower'}`);
    }
    console.log('');
  }

  // Overall Summary
  console.log('📈 Overall Summary:');
  console.log(`   Enhanced Success Rate: ${enhancedSuccesses}/${testUrls.length} (${(enhancedSuccesses/testUrls.length*100).toFixed(1)}%)`);
  console.log(`   Legacy Success Rate:   ${legacySuccesses}/${testUrls.length} (${(legacySuccesses/testUrls.length*100).toFixed(1)}%)`);
  
  if (enhancedSuccesses > 0) {
    console.log(`   Enhanced Avg Time:     ${(enhancedTotalTime/enhancedSuccesses).toFixed(0)}ms`);
    console.log(`   Enhanced Best Time:    ${(enhancedBestTime/enhancedSuccesses).toFixed(0)}ms`);
  }
  
  if (legacySuccesses > 0) {
    console.log(`   Legacy Avg Time:       ${(legacyTotalTime/legacySuccesses).toFixed(0)}ms`);  
    console.log(`   Legacy Best Time:      ${(legacyBestTime/legacySuccesses).toFixed(0)}ms`);
  }

  // Provider Performance Analysis
  console.log('\n🔍 Provider Performance Analysis:');
  const providerStats = {};
  
  for (const url of testUrls) {
    for (const attempt of results.enhanced[url].attempts) {
      if (!providerStats[attempt.provider]) {
        providerStats[attempt.provider] = { successes: 0, failures: 0, totalTime: 0, times: [] };
      }
      
      if (attempt.success) {
        providerStats[attempt.provider].successes++;
        providerStats[attempt.provider].totalTime += attempt.actualResponseTime;
        providerStats[attempt.provider].times.push(attempt.actualResponseTime);
      } else {
        providerStats[attempt.provider].failures++;
      }
    }
  }
  
  for (const [provider, stats] of Object.entries(providerStats)) {
    const total = stats.successes + stats.failures;
    const successRate = (stats.successes / total * 100).toFixed(1);
    const avgTime = stats.successes > 0 ? (stats.totalTime / stats.successes).toFixed(0) : 'N/A';
    console.log(`   ${provider}: ${successRate}% success rate, ${avgTime}ms avg response time`);
  }

  console.log('\n🎯 Key Insights:');
  console.log('   • Enhanced scraper provides multiple provider fallbacks');
  console.log('   • Playwright enables JavaScript-heavy site scraping');
  console.log('   • Legacy system is reliable but limited to CORS proxies');
  console.log('   • Performance varies significantly by provider and target site');

  await enhancedScraper.cleanup();
  
  console.log('\n✅ Performance comparison complete!');
}

performanceComparison().catch(console.error);