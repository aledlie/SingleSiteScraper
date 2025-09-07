#!/usr/bin/env node

/**
 * Debug script to test individual providers
 */

import { LegacyProxyProvider } from '../src/scraper/providers/legacy.js';
import { PlaywrightProvider } from '../src/scraper/providers/playwright.js';

async function debugProviders() {
  console.log('🔍 Debugging Individual Providers\n');

  // Test Legacy Proxy Provider
  console.log('Testing Legacy Proxy Provider...');
  const legacyProvider = new LegacyProxyProvider();
  
  try {
    const isAvailable = await legacyProvider.isAvailable();
    console.log(`Legacy Provider Available: ${isAvailable}`);
    
    if (isAvailable) {
      console.log('Testing simple scrape...');
      const result = await legacyProvider.scrape('https://httpbin.org/html', { timeout: 10000 });
      console.log(`✅ Legacy Success: ${result.html.length} chars in ${result.responseTime}ms`);
    }
  } catch (error) {
    console.log(`❌ Legacy Error: ${error.message}`);
  }

  console.log('\nTesting Playwright Provider...');
  const playwrightProvider = new PlaywrightProvider();
  
  try {
    const isAvailable = await playwrightProvider.isAvailable();
    console.log(`Playwright Provider Available: ${isAvailable}`);
    
    if (isAvailable) {
      console.log('Testing simple scrape...');
      const result = await playwrightProvider.scrape('https://httpbin.org/html', { timeout: 10000 });
      console.log(`✅ Playwright Success: ${result.html.length} chars in ${result.responseTime}ms`);
      
      // Cleanup
      await playwrightProvider.cleanup();
    }
  } catch (error) {
    console.log(`❌ Playwright Error: ${error.message}`);
  }

  console.log('\n🏁 Debug complete');
}

debugProviders().catch(console.error);