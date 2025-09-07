#!/usr/bin/env node

/**
 * Test script for the enhanced scraping system
 * Run with: node test-enhanced-scraper.js
 */

import { EnhancedScraper } from './src/scraper/enhancedScraper.js';

async function testEnhancedScraper() {
  console.log('🚀 Testing Enhanced Scraper System...\n');

  const scraper = new EnhancedScraper({
    strategy: 'cost-optimized',
    maxCostPerRequest: 0.01,
  });

  // Test URLs for different scenarios
  const testUrls = [
    {
      name: 'Simple Static Site',
      url: 'https://httpbin.org/html',
      expectedSuccess: true,
    },
    {
      name: 'Example.com',
      url: 'https://example.com',
      expectedSuccess: true,
    },
    {
      name: 'JavaScript Site (GitHub)',
      url: 'https://github.com',
      expectedSuccess: true, // Should work with Playwright or fallback to legacy
    },
  ];

  let totalTests = 0;
  let passedTests = 0;

  console.log('📊 Provider Health Check:');
  try {
    const health = await scraper.getHealth();
    for (const [provider, status] of health) {
      const icon = status.isHealthy ? '✅' : '❌';
      console.log(`   ${icon} ${provider}: ${status.message || 'Unknown status'}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Health check failed: ${error.message}`);
  }

  console.log(`\n🔍 Available Providers: ${scraper.getProviders().join(', ')}`);

  console.log('\n🧪 Running Scraping Tests...\n');

  for (const test of testUrls) {
    totalTests++;
    console.log(`Testing: ${test.name}`);
    console.log(`URL: ${test.url}`);

    const startTime = Date.now();

    try {
      const result = await scraper.scrape(test.url, {
        timeout: 15000,
        stealth: true,
        blockResources: true,
      });

      const responseTime = Date.now() - startTime;
      console.log(`✅ Success with ${result.provider}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      console.log(`   HTML Length: ${result.html.length.toLocaleString()} chars`);
      console.log(`   Cost: $${result.cost.toFixed(4)}`);
      console.log(`   Status: ${result.status}`);

      // Basic validation
      if (result.html.length > 100) {
        passedTests++;
        console.log(`   ✅ Content validation passed`);
      } else {
        console.log(`   ❌ Content validation failed (too short)`);
      }

    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      
      if (test.expectedSuccess) {
        console.log(`   ⚠️  Expected success but got failure`);
      }
    }

    console.log(''); // Empty line for spacing
  }

  console.log('📈 Performance Metrics:');
  const metrics = scraper.getMetrics();
  for (const [provider, data] of metrics) {
    console.log(`\n   ${provider}:`);
    console.log(`     Success Rate: ${(data.successRate * 100).toFixed(1)}%`);
    console.log(`     Avg Response Time: ${data.avgResponseTime.toFixed(0)}ms`);
    console.log(`     Total Requests: ${data.requestCount}`);
    console.log(`     Total Cost: $${data.totalCost.toFixed(4)}`);
    console.log(`     Performance Score: ${data.performanceScore.toFixed(1)}/100`);
  }

  // Final summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // Cleanup
  await scraper.cleanup();

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Enhanced scraper is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

// Run the test
testEnhancedScraper().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});