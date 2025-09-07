import { scrapeWebsite } from '../src/scraper/scrapeWebsite.ts';
import { extractEvents } from '../src/utils/parseEvents.ts';

const debugCapitalFactory = async () => {
  console.log('🔬 Capital Factory Event Parsing Debug Suite');
  console.log('=' .repeat(70));
  console.log('🎯 Deep diving into HTML structure and event extraction logic');
  console.log();
  
  const startTime = Date.now();
  const options = {
    includeText: false,
    includeLinks: false,
    includeImages: false,
    includeMetadata: false,
    includeEvents: true,
    maxEvents: 100,
    maxLinks: 0,
    maxImages: 0,
    maxTextElements: 0,
    timeout: 45000,
    retryAttempts: 3,
  };

  const setProgress = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📊 [${timestamp}] ${msg}`);
  };

  try {
    console.log('🌐 Step 1: Fetching website content');
    console.log('-' .repeat(50));
    const result = await scrapeWebsite('https://capitalfactory.com', options, setProgress);
    
    if (result.error) {
      console.error('❌ Scraping failed:', result.error);
      return {
        success: false,
        error: result.error,
        stage: 'scraping'
      };
    }

    const { status } = result.data || {};
    console.log(`✅ Content fetched successfully`);
    console.log(`📏 HTML size: ${(status?.contentLength || 0).toLocaleString()} characters`);
    console.log(`🌐 Proxy used: ${status?.proxyUsed || 'Unknown'}`);
    console.log(`📄 Content type: ${status?.contentType || 'Unknown'}`);
    console.log();

    // Get raw HTML for analysis
    console.log('🧬 Step 2: Fetching raw HTML for detailed analysis');
    console.log('-' .repeat(50));
    
    const { fetchWithTimeout, proxyServices } = await import('../src/utils/network.ts');
    const proxies = proxyServices('https://capitalfactory.com');
    
    let rawHtml = '';
    let proxyUsed = '';
    for (const proxy of proxies) {
      try {
        console.log(`🔄 Trying ${proxy.name}...`);
        const response = await fetchWithTimeout(proxy.url, { method: 'GET', headers: proxy.headers }, 30000);
        if (response.ok) {
          proxyUsed = proxy.name;
          if (proxy.name === 'AllOrigins') {
            const json = await response.json();
            rawHtml = json.contents || '';
          } else {
            rawHtml = await response.text();
          }
          console.log(`✅ Successfully fetched via ${proxy.name}`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${proxy.name} failed: ${e.message}`);
        continue;
      }
    }
    
    if (!rawHtml) {
      console.error('❌ Could not fetch raw HTML from any proxy');
      return {
        success: false,
        error: 'Failed to fetch raw HTML',
        stage: 'raw_html_fetch'
      };
    }
    
    console.log(`📄 Raw HTML length: ${rawHtml.length.toLocaleString()} chars`);
    console.log();

    // Analyze structured data
    console.log('🔍 Step 3: Analyzing structured data (JSON-LD)');
    console.log('-' .repeat(50));
    
    const jsonLdMatches = rawHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    console.log(`📋 JSON-LD scripts found: ${jsonLdMatches?.length || 0}`);
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach((match, i) => {
        const content = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        console.log(`\n📝 JSON-LD Script ${i + 1}:`);
        console.log(`   Length: ${content.length} chars`);
        try {
          const parsed = JSON.parse(content);
          console.log(`   Type: ${parsed['@type'] || 'Unknown'}`);
          console.log(`   Context: ${parsed['@context'] || 'None'}`);
          if (parsed['@type'] === 'Event') {
            console.log(`   ✅ Event detected: "${parsed.name || 'No name'}"`);
            console.log(`   📅 Start: ${parsed.startDate || 'No start date'}`);
            console.log(`   🏢 Location: ${parsed.location?.name || 'No location'}`);
          }
        } catch (e) {
          console.log(`   ❌ JSON parsing failed: ${e.message}`);
        }
        
        if (i < 2) { // Show first 2 scripts content preview
          console.log(`   Preview: ${content.trim().substring(0, 200)}...`);
        }
      });
    } else {
      console.log('📋 No JSON-LD structured data found');
      console.log('💡 This means events must be extracted from HTML elements');
    }
    console.log();

    // Analyze event-related HTML classes
    console.log('🏷️ Step 4: Analyzing event-related HTML classes and elements');
    console.log('-' .repeat(50));
    
    const eventClassMatches = rawHtml.match(/class="[^"]*event[^"]*"/gi);
    console.log(`🎯 Event-related classes found: ${eventClassMatches?.length || 0}`);
    
    if (eventClassMatches && eventClassMatches.length > 0) {
      // Get unique classes
      const uniqueClasses = [...new Set(eventClassMatches.map(match => {
        const classAttr = match.match(/class="([^"]*)"/)[1];
        return classAttr.split(' ').filter(cls => cls.toLowerCase().includes('event'));
      }).flat())];
      
      console.log(`📊 Unique event-related classes:`);
      uniqueClasses.slice(0, 10).forEach((cls, i) => {
        const count = eventClassMatches.filter(match => match.includes(cls)).length;
        console.log(`   ${i + 1}. "${cls}" (${count} occurrences)`);
      });
      
      if (uniqueClasses.length > 10) {
        console.log(`   ... and ${uniqueClasses.length - 10} more classes`);
      }
    }
    console.log();

    // Test event text patterns
    console.log('🔍 Step 5: Searching for event-related text patterns');
    console.log('-' .repeat(50));
    
    const eventPatterns = [
      { name: 'September dates', regex: /Sep\.?\s+\d{1,2}/gi },
      { name: 'October dates', regex: /Oct\.?\s+\d{1,2}/gi },
      { name: 'November dates', regex: /Nov\.?\s+\d{1,2}/gi },
      { name: 'December dates', regex: /Dec\.?\s+\d{1,2}/gi },
      { name: 'Time patterns (AM/PM)', regex: /\d{1,2}:\d{2}\s*[AP]M/gi },
      { name: 'Time patterns (24hr)', regex: /\d{1,2}:\d{2}/gi },
      { name: 'Cup of Capital events', regex: /Cup of Capital/gi },
      { name: 'Meetup events', regex: /meetup/gi },
      { name: 'Event keywords', regex: /\b(conference|workshop|seminar|networking|demo|presentation)\b/gi },
      { name: 'Date separators', regex: /\d+\s*\/\s*\d+/gi }
    ];
    
    const patternResults = [];
    eventPatterns.forEach(pattern => {
      const matches = rawHtml.match(pattern.regex);
      const count = matches?.length || 0;
      console.log(`📊 ${pattern.name}: ${count} matches`);
      
      if (matches && count > 0 && count <= 10) {
        console.log(`   Examples: ${[...new Set(matches)].slice(0, 5).join(', ')}`);
      } else if (matches && count > 10) {
        console.log(`   Examples: ${[...new Set(matches)].slice(0, 3).join(', ')} ...and ${count - 3} more`);
      }
      
      patternResults.push({
        pattern: pattern.name,
        count,
        examples: matches ? [...new Set(matches)].slice(0, 5) : []
      });
    });
    console.log();

    // Test extractEvents function directly
    console.log('🧪 Step 6: Testing extractEvents function directly');
    console.log('-' .repeat(50));
    
    console.log('🔄 Running extractEvents on raw HTML...');
    const extractedEvents = extractEvents(rawHtml);
    console.log(`📊 Events extracted: ${extractedEvents.length}`);
    
    if (extractedEvents.length > 0) {
      console.log(`✅ Success! Found ${extractedEvents.length} events`);
      extractedEvents.slice(0, 3).forEach((event, i) => {
        console.log(`\n🎪 Event ${i + 1}:`);
        console.log(`   📝 Summary: "${event.summary || 'No summary'}"`);
        console.log(`   📅 Start: ${JSON.stringify(event.start) || 'No start'}`);
        console.log(`   📅 End: ${JSON.stringify(event.end) || 'No end'}`);
        console.log(`   📍 Location: "${event.location || 'No location'}"`);
        console.log(`   📄 Description: "${event.description ? event.description.substring(0, 100) + '...' : 'No description'}"`);
      });
    } else {
      console.log('❌ No events extracted - investigating why...');
      
      // Test individual selectors
      console.log('\n🔬 Step 6a: Testing individual CSS selectors');
      console.log('-' .repeat(30));
      
      const { parse } = await import('node-html-parser');
      const root = parse(rawHtml);
      
      const selectors = [
        '.event',
        '.event-item', 
        'article',
        'section',
        '[class*="event"]',
        'time',
        '.event-date',
        '.date'
      ];
      
      selectors.forEach(selector => {
        try {
          const elements = root.querySelectorAll(selector);
          console.log(`🎯 "${selector}": ${elements.length} elements found`);
          
          if (elements.length > 0 && elements.length <= 5) {
            elements.forEach((el, i) => {
              const text = el.textContent.trim();
              console.log(`     ${i + 1}. "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
            });
          } else if (elements.length > 5) {
            const firstEl = elements[0];
            const text = firstEl.textContent.trim();
            console.log(`     Example: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
          }
        } catch (e) {
          console.log(`❌ "${selector}": Error - ${e.message}`);
        }
      });
    }
    
    const totalDuration = Date.now() - startTime;
    console.log('\n📊 DEBUGGING SUMMARY');
    console.log('=' .repeat(70));
    console.log(`🕒 Total analysis time: ${totalDuration}ms`);
    console.log(`📄 HTML size analyzed: ${rawHtml.length.toLocaleString()} chars`);
    console.log(`📋 JSON-LD scripts: ${jsonLdMatches?.length || 0}`);
    console.log(`🏷️ Event CSS classes: ${eventClassMatches?.length || 0}`);
    console.log(`🎪 Events extracted: ${extractedEvents.length}`);
    
    // Pattern analysis summary
    const totalPatterns = patternResults.reduce((sum, p) => sum + p.count, 0);
    console.log(`🔍 Text patterns found: ${totalPatterns} total across ${eventPatterns.length} pattern types`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-' .repeat(30));
    
    if (extractedEvents.length === 0) {
      console.log('❌ Event extraction failed. Potential issues:');
      
      if (jsonLdMatches?.length === 0) {
        console.log('   • No JSON-LD structured data available');
      }
      
      if (eventClassMatches?.length > 0) {
        console.log('   • HTML contains event classes but parser may not recognize them');
        console.log('   • Consider updating CSS selectors in parseEvents.ts');
      }
      
      if (totalPatterns > 0) {
        console.log('   • Text patterns suggest events are present but not properly extracted');
        console.log('   • The HTML structure may be different than expected');
      }
      
      console.log('\n🔧 Next steps:');
      console.log('   1. Run: npx tsx test/inspect-html-structure.js');
      console.log('   2. Examine actual HTML structure around event elements');
      console.log('   3. Update parseEvents.ts selectors based on findings');
      console.log('   4. Consider adding support for the detected CSS classes');
    } else {
      console.log('✅ Event extraction working! Consider:');
      console.log('   • Verifying date/time parsing accuracy');
      console.log('   • Checking location and description extraction completeness');
      console.log('   • Testing with different event pages for robustness');
    }
    
    return {
      success: true,
      eventsExtracted: extractedEvents.length,
      htmlSize: rawHtml.length,
      jsonLdScripts: jsonLdMatches?.length || 0,
      eventClasses: eventClassMatches?.length || 0,
      textPatterns: totalPatterns,
      duration: totalDuration,
      patternResults,
      extractedEvents: extractedEvents.length > 0 ? extractedEvents : null
    };

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('\n💥 DEBUG ANALYSIS FAILED');
    console.error('=' .repeat(70));
    console.error(`❌ Error: ${error.message}`);
    console.error(`🔍 Error type: ${error.constructor.name}`);
    if (error.stack) {
      console.error(`📜 Stack trace: ${error.stack.split('\n')[1]}`);
    }
    console.error(`🕒 Time to failure: ${totalDuration}ms`);
    
    return {
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      duration: totalDuration,
      stage: 'analysis'
    };
  }
};

// Run the debug analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  debugCapitalFactory()
    .then(result => {
      console.log('\n🏁 DEBUG ANALYSIS COMPLETED');
      console.log('=' .repeat(70));
      if (result.success) {
        console.log(`✅ Status: COMPLETED`);
        console.log(`🎪 Events found: ${result.eventsExtracted}`);
        console.log(`📄 Data analyzed: ${result.htmlSize?.toLocaleString()} chars`);
        console.log(`🕒 Duration: ${result.duration}ms`);
        
        if (result.eventsExtracted === 0) {
          console.log('\n⚠️  No events were extracted - this indicates parsing issues');
          console.log('💡 Review the recommendations above to improve event detection');
          process.exit(1);
        }
      } else {
        console.log(`❌ Status: FAILED`);
        console.log(`💥 Error: ${result.error}`);
        console.log(`📍 Stage: ${result.stage}`);
        process.exit(2);
      }
    })
    .catch(error => {
      console.error('\n☠️  CATASTROPHIC DEBUG FAILURE');
      console.error('=' .repeat(70));
      console.error(error);
      process.exit(3);
    });
}

export { debugCapitalFactory };