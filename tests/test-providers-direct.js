#!/usr/bin/env node

/**
 * Test providers directly without health checks
 */

import { EnhancedScraper } from '../src/scraper/enhancedScraper.js';

async function testDirectScraping() {
  console.log('🚀 Testing Direct Scraping (bypassing health checks)...\n');

  const scraper = new EnhancedScraper({
    strategy: 'cost-optimized',
    maxCostPerRequest: 0.05, // Higher cost limit
  });

  // Test URLs with longer timeout
  const testUrl = 'https://httpbin.org/html';
  
  console.log(`Testing: ${testUrl}`);
  
  try {
    // Force test both providers individually
    console.log('\n1. Testing Legacy Provider directly...');
    const legacyProvider = scraper.getProviders().includes('Legacy-CORS-Proxy') ?
      await scraper.testProvider('Legacy-CORS-Proxy', testUrl, { timeout: 15000 }) :
      null;
    
    if (legacyProvider) {
      console.log(`✅ Legacy Success: ${legacyProvider.html.length} chars in ${legacyProvider.responseTime}ms`);
    }
  } catch (error) {
    console.log(`❌ Legacy Failed: ${error.message}`);
  }

  try {
    console.log('\n2. Testing Playwright Provider directly...');
    const playwrightProvider = scraper.getProviders().includes('Playwright-Browser') ?
      await scraper.testProvider('Playwright-Browser', testUrl, { timeout: 15000 }) :
      null;
    
    if (playwrightProvider) {
      console.log(`✅ Playwright Success: ${playwrightProvider.html.length} chars in ${playwrightProvider.responseTime}ms`);
    }
  } catch (error) {
    console.log(`❌ Playwright Failed: ${error.message}`);
  }

  console.log('\n3. Testing fallback to legacy scraper...');
  // Import the legacy function directly
  const { scrapeWebsiteLegacy } = await import('../src/scraper/scrapeWebsite.js');
  
  try {
    const result = await scrapeWebsiteLegacy(testUrl, {
      includeText: true,
      includeLinks: true,
      includeImages: true,
      includeMetadata: true,
      includeEvents: false,
      timeout: 15000,
      retryAttempts: 2,
      requestTimeout: 15000,
      maxTextElements: 100,
      maxLinks: 50,
      maxImages: 20,
    }, (msg) => console.log(`   Progress: ${msg}`));

    if (result.data) {
      console.log(`✅ Legacy Function Success: ${result.data.status?.contentLength} chars in ${result.data.status?.responseTime}ms`);
      console.log(`   Provider used: ${result.data.status?.proxyUsed}`);
    } else {
      console.log(`❌ Legacy Function Failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Legacy Function Error: ${error.message}`);
  }

  await scraper.cleanup();
  
  console.log('\n🏁 Direct provider test complete');
}

testDirectScraping().catch(console.error);