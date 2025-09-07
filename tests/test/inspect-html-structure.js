import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';

const inspectHtmlStructure = async () => {
  console.log('🔬 HTML Structure Inspector for Event Parsing');
  console.log('=' .repeat(70));
  console.log('🎯 Analyzing Capital Factory HTML structure to understand event elements');
  console.log();
  
  const startTime = Date.now();
  
  try {
    // Fetch raw HTML
    console.log('🌐 Step 1: Fetching website HTML');
    console.log('-' .repeat(50));
    
    const proxies = proxyServices('https://capitalfactory.com');
    let rawHtml = '';
    let proxyUsed = '';
    
    for (const proxy of proxies) {
      try {
        console.log(`🔄 Attempting ${proxy.name}...`);
        const response = await fetchWithTimeout(proxy.url, { method: 'GET', headers: proxy.headers }, 30000);
        if (response.ok) {
          proxyUsed = proxy.name;
          if (proxy.name === 'AllOrigins') {
            const json = await response.json();
            rawHtml = json.contents || '';
          } else {
            rawHtml = await response.text();
          }
          console.log(`✅ Successfully fetched ${rawHtml.length.toLocaleString()} chars via ${proxy.name}`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${proxy.name} failed: ${e.message}`);
        continue;
      }
    }
    
    if (!rawHtml) {
      console.error('❌ Could not fetch HTML from any proxy service');
      return {
        success: false,
        error: 'Failed to fetch HTML',
        stage: 'fetch'
      };
    }
    
    console.log();
    
    // Parse HTML
    console.log('🧬 Step 2: Parsing HTML structure');
    console.log('-' .repeat(50));
    
    const root = parse(rawHtml);
    console.log(`📊 HTML parsed successfully`);
    console.log(`🌳 DOM structure ready for analysis`);
    console.log();
    
    // Test current parseEvents.ts selectors
    console.log('🎯 Step 3: Testing Current parseEvents.ts Selectors');
    console.log('-' .repeat(50));
    
    const currentSelectors = ['.event', '.event-item', 'article', 'section'];
    const selectorResults = {};
    
    currentSelectors.forEach(selector => {
      try {
        const elements = root.querySelectorAll(selector);
        console.log(`\n📍 Selector: "${selector}" → ${elements.length} elements found`);
        selectorResults[selector] = elements.length;
        
        if (elements.length > 0) {
          console.log(`   🔍 Analyzing first element...`);
          const firstElement = elements[0];
          
          // Test what the current parsing logic would extract
          const title = firstElement.querySelector('h1, h2, .event-title')?.textContent || '';
          const dateTime = firstElement.querySelector('time, .event-date, .date')?.textContent || '';
          const location = firstElement.querySelector('.event-location, .location')?.textContent || '';
          const description = firstElement.querySelector('.event-description, .description, p')?.textContent || '';
          
          console.log(`   📝 Title (h1, h2, .event-title): "${title.trim().substring(0, 60)}${title.length > 60 ? '...' : ''}"`);
          console.log(`   📅 DateTime (time, .event-date, .date): "${dateTime.trim().substring(0, 60)}${dateTime.length > 60 ? '...' : ''}"`);
          console.log(`   📍 Location (.event-location, .location): "${location.trim().substring(0, 60)}${location.length > 60 ? '...' : ''}"`);
          console.log(`   📄 Description (p): "${description.trim().substring(0, 60)}${description.length > 60 ? '...' : ''}"`);
          
          // Show raw HTML structure (truncated)
          const rawHtml = firstElement.innerHTML.trim();
          console.log(`   🏗️  Raw HTML (first 200 chars): ${rawHtml.substring(0, 200)}${rawHtml.length > 200 ? '...' : ''}`);
          
          // Show all class attributes in this element's descendants
          const allClassElements = firstElement.querySelectorAll('[class]');
          if (allClassElements.length > 0) {
            console.log(`   🏷️  Classes found in element:`);
            const uniqueClasses = [...new Set(allClassElements.map(el => el.getAttribute('class')).filter(Boolean))];
            uniqueClasses.slice(0, 8).forEach((cls, i) => {
              console.log(`       ${i + 1}. "${cls}"`);
            });
            if (uniqueClasses.length > 8) {
              console.log(`       ... and ${uniqueClasses.length - 8} more classes`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error testing "${selector}": ${error.message}`);
        selectorResults[selector] = 'error';
      }
    });
    
    console.log();
    
    // Deep dive into event-item elements
    console.log('🎪 Step 4: Deep Analysis of .event-item Elements');
    console.log('-' .repeat(50));
    
    const eventItems = root.querySelectorAll('.event-item');
    console.log(`📊 Found ${eventItems.length} .event-item elements`);
    
    if (eventItems.length > 0) {
      console.log(`🔬 Analyzing structure of first 3 event items:`);
      console.log();
      
      eventItems.slice(0, 3).forEach((item, i) => {
        console.log(`🎪 Event Item ${i + 1}:`);
        console.log(`   📏 HTML length: ${item.innerHTML.length} characters`);
        
        // Find all possible title sources
        const possibleTitles = [
          { selector: 'h1', elements: item.querySelectorAll('h1') },
          { selector: 'h2', elements: item.querySelectorAll('h2') },
          { selector: 'h3', elements: item.querySelectorAll('h3') },
          { selector: '.title', elements: item.querySelectorAll('.title') },
          { selector: '.event-title', elements: item.querySelectorAll('.event-title') },
          { selector: 'a', elements: item.querySelectorAll('a') },
          { selector: '[class*="title"]', elements: item.querySelectorAll('[class*="title"]') }
        ];
        
        console.log(`   📝 Potential title sources:`);
        possibleTitles.forEach(({ selector, elements }) => {
          if (elements.length > 0) {
            const text = elements[0].textContent?.trim() || '';
            console.log(`       ${selector}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (${elements.length} found)`);
          }
        });
        
        // Find all possible date sources
        const possibleDates = [
          { selector: 'time', elements: item.querySelectorAll('time') },
          { selector: '.date', elements: item.querySelectorAll('.date') },
          { selector: '.event-date', elements: item.querySelectorAll('.event-date') },
          { selector: '.event-item-date', elements: item.querySelectorAll('.event-item-date') },
          { selector: '[class*="date"]', elements: item.querySelectorAll('[class*="date"]') }
        ];
        
        console.log(`   📅 Potential date sources:`);
        possibleDates.forEach(({ selector, elements }) => {
          if (elements.length > 0) {
            const text = elements[0].textContent?.trim() || '';
            console.log(`       ${selector}: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}" (${elements.length} found)`);
          }
        });
        
        // Find all possible location sources
        const possibleLocations = [
          { selector: '.location', elements: item.querySelectorAll('.location') },
          { selector: '.event-location', elements: item.querySelectorAll('.event-location') },
          { selector: '[class*="location"]', elements: item.querySelectorAll('[class*="location"]') },
          { selector: 'address', elements: item.querySelectorAll('address') }
        ];
        
        console.log(`   📍 Potential location sources:`);
        possibleLocations.forEach(({ selector, elements }) => {
          if (elements.length > 0) {
            const text = elements[0].textContent?.trim() || '';
            console.log(`       ${selector}: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}" (${elements.length} found)`);
          }
        });
        
        // Show full class list for this item
        const classAttr = item.getAttribute('class');
        console.log(`   🏷️  Element classes: "${classAttr || 'none'}"`);
        
        // Show immediate children structure
        const children = item.children;
        if (children && children.length !== undefined) {
          console.log(`   🌳 Direct children (${children.length}):`);
          Array.from(children).slice(0, 5).forEach((child, childIndex) => {
            const tag = child.tagName?.toLowerCase() || 'unknown';
            const classes = child.getAttribute('class') || '';
            const text = child.textContent?.trim().substring(0, 40) || '';
            console.log(`       ${childIndex + 1}. <${tag}${classes ? ` class="${classes}"` : ''}> "${text}${child.textContent && child.textContent.length > 40 ? '...' : ''}"`);
          });
          
          if (children.length > 5) {
            console.log(`       ... and ${children.length - 5} more children`);
          }
        } else {
          console.log(`   🌳 Direct children: Could not access children (parsing issue)`);
        }
        
        console.log();
      });
    }
    
    const totalDuration = Date.now() - startTime;
    
    return {
      success: true,
      htmlSize: rawHtml.length,
      eventItemsFound: eventItems.length,
      selectorResults,
      duration: totalDuration
    };
    
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('\n💥 HTML STRUCTURE INSPECTION FAILED');
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
      stage: 'inspection'
    };
  }
};

// Run the HTML structure inspection
if (import.meta.url === `file://${process.argv[1]}`) {
  inspectHtmlStructure()
    .then(result => {
      console.log('\n🏁 HTML STRUCTURE INSPECTION COMPLETED');
      console.log('=' .repeat(70));
      if (result.success) {
        console.log(`✅ Status: COMPLETED`);
        console.log(`📄 HTML analyzed: ${result.htmlSize?.toLocaleString()} chars`);
        console.log(`🎪 Event items found: ${result.eventItemsFound}`);
        console.log(`🕒 Duration: ${result.duration}ms`);
        
        if (result.eventItemsFound === 0) {
          console.log('\n⚠️  No event items found - major parser updates needed');
          process.exit(1);
        } else {
          console.log('\n💡 Use the recommendations above to improve event parsing accuracy');
        }
      } else {
        console.log(`❌ Status: FAILED`);
        console.log(`💥 Error: ${result.error}`);
        console.log(`📍 Stage: ${result.stage}`);
        process.exit(2);
      }
    })
    .catch(error => {
      console.error('\n☠️  CATASTROPHIC INSPECTION FAILURE');
      console.error('=' .repeat(70));
      console.error(error);
      process.exit(3);
    });
}

export { inspectHtmlStructure };