import { scrapeWebsite } from '../src/scraper/scrapeWebsite.ts';
import { extractEvents } from '../src/utils/parseEvents.ts';

const debugCapitalFactory = async () => {
  console.log('🔍 Debugging Capital Factory event parsing...\n');
  
  const options = {
    includeText: false,
    includeLinks: false,
    includeImages: false,
    includeMetadata: false,
    includeEvents: true,
    maxEvents: 50,
    maxLinks: 0,
    maxImages: 0,
    maxTextElements: 0,
    timeout: 30000,
    retryAttempts: 3,
  };

  const setProgress = (msg) => console.log(`Progress: ${msg}`);

  try {
    // First, let's get the raw HTML
    const result = await scrapeWebsite('https://capitalfactory.com', options, setProgress);
    
    if (result.error) {
      console.error('❌ Error:', result.error);
      return;
    }

    console.log('\n🔍 Raw HTML Analysis:');
    console.log(`- HTML length: ${result.data?.status?.contentLength || 0} characters`);
    
    // Try to extract events manually from the raw HTML
    console.log('\n🔧 Testing event extraction directly...');
    
    // We need to get the raw HTML somehow
    const { fetchWithTimeout, proxyServices } = await import('../src/utils/network.ts');
    const proxies = proxyServices('https://capitalfactory.com');
    
    let rawHtml = '';
    for (const proxy of proxies) {
      try {
        const response = await fetchWithTimeout(proxy.url, { method: 'GET', headers: proxy.headers }, 30000);
        if (response.ok) {
          if (proxy.name === 'AllOrigins') {
            const json = await response.json();
            rawHtml = json.contents || '';
          } else {
            rawHtml = await response.text();
          }
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (rawHtml) {
      console.log(`✅ Got raw HTML (${rawHtml.length} chars)`);
      
      // Check for JSON-LD
      const jsonLdMatches = rawHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
      console.log(`\n📋 JSON-LD scripts found: ${jsonLdMatches?.length || 0}`);
      
      if (jsonLdMatches) {
        jsonLdMatches.forEach((match, i) => {
          const content = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          console.log(`\nJSON-LD ${i + 1}:`);
          console.log(content.trim().substring(0, 200) + '...');
        });
      }
      
      // Check for event-related HTML elements
      const eventClassMatches = rawHtml.match(/class="[^"]*event[^"]*"/gi);
      console.log(`\n🎯 Event-related classes found: ${eventClassMatches?.length || 0}`);
      if (eventClassMatches) {
        console.log('Examples:', eventClassMatches.slice(0, 5));
      }
      
      // Look for specific patterns
      console.log('\n🔍 Event text patterns:');
      const eventPatterns = [
        /Sep\.?\s+\d+/gi,
        /Oct\.?\s+\d+/gi, 
        /Nov\.?\s+\d+/gi,
        /\d+:\d+\s*[AP]M/gi,
        /Cup of Capital/gi,
        /Meetup/gi
      ];
      
      eventPatterns.forEach((pattern, i) => {
        const matches = rawHtml.match(pattern);
        console.log(`- Pattern ${i + 1} (${pattern.source}): ${matches?.length || 0} matches`);
        if (matches && matches.length > 0) {
          console.log(`  Examples: ${matches.slice(0, 3).join(', ')}`);
        }
      });
      
      // Test the actual extractEvents function
      console.log('\n🧪 Testing extractEvents function...');
      const extractedEvents = extractEvents(rawHtml);
      console.log(`Extracted ${extractedEvents.length} events`);
      
    } else {
      console.log('❌ Could not fetch raw HTML');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

debugCapitalFactory();