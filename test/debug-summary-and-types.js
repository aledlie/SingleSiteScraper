import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';

const debugSummaryAndTypes = async () => {
  console.log('🔍 Summary and Event Type Debug for Capital Factory');
  console.log('=' .repeat(60));
  
  try {
    // Fetch HTML
    const proxies = proxyServices('https://capitalfactory.com');
    let rawHtml = '';
    
    for (const proxy of proxies) {
      try {
        console.log(`🔄 Trying ${proxy.name}...`);
        const response = await fetchWithTimeout(proxy.url, { method: 'GET', headers: proxy.headers }, 30000);
        if (response.ok) {
          if (proxy.name === 'AllOrigins') {
            const json = await response.json();
            rawHtml = json.contents || '';
          } else {
            rawHtml = await response.text();
          }
          console.log(`✅ Fetched ${rawHtml.length.toLocaleString()} chars`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${proxy.name} failed`);
        continue;
      }
    }
    
    if (!rawHtml) {
      console.log('❌ Could not fetch HTML');
      return;
    }
    
    console.log('\n🧪 SUMMARY (TITLE) PARSING ANALYSIS');
    console.log('=' .repeat(60));
    
    const root = parse(rawHtml);
    const eventElements = root.querySelectorAll('.event, .event-item, article, section');
    
    console.log(`📊 Found ${eventElements.length} potential event elements`);
    console.log('\n🔍 TITLE SELECTOR ANALYSIS - First 5 Event Elements:');
    
    eventElements.slice(0, 5).forEach((el, index) => {
      console.log(`\n🎪 Element ${index + 1}:`);
      
      // Current title selector from parseEvents.ts
      const currentSelector = 'h1, h2, h3, .event-title, .title, a, .display-lg';
      console.log(`   📝 Current selector: "${currentSelector}"`);
      
      const currentTitle = el.querySelector(currentSelector)?.textContent?.trim() || '';
      console.log(`   📝 Current result: "${currentTitle}"`);
      
      // Test individual selectors
      console.log(`\n   🔍 Individual selector analysis:`);
      const titleSelectors = ['h1', 'h2', 'h3', '.event-title', '.title', 'a', '.display-lg'];
      
      titleSelectors.forEach(selector => {
        const element = el.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim() || '';
          if (text.length > 0) {
            console.log(`     ✅ ${selector}: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
          } else {
            console.log(`     🔶 ${selector}: found but empty`);
          }
        } else {
          console.log(`     ❌ ${selector}: not found`);
        }
      });
      
      // Look for other potential title sources
      console.log(`\n   🔍 Alternative title sources:`);
      const altSelectors = [
        '.event-name',
        '.event-summary', 
        '.title-lg',
        '.display-md',
        '[class*="title"]',
        '[class*="name"]',
        '[class*="summary"]',
        'strong',
        '.lead'
      ];
      
      altSelectors.forEach(selector => {
        try {
          const element = el.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim() || '';
            if (text.length > 0 && text.length < 200) {
              console.log(`     💡 ${selector}: "${text}"`);
            }
          }
        } catch (e) {
          // Skip invalid selectors
        }
      });
      
      // Check all text content for potential titles
      console.log(`\n   📄 All text content (first 300 chars):`);
      const allText = el.textContent?.trim() || '';
      console.log(`     "${allText.substring(0, 300)}${allText.length > 300 ? '...' : ''}"`);
      
      // Check element classes for insights
      const classes = el.getAttribute('class') || '';
      console.log(`   🏷️  Element classes: "${classes}"`);
    });
    
    console.log('\n\n🎭 EVENT TYPE CLASSIFICATION ANALYSIS');
    console.log('=' .repeat(60));
    
    console.log('🔍 Current Logic: Always returns "default"');
    console.log('\n💡 POTENTIAL EVENT TYPE CLASSIFICATION STRATEGIES:');
    
    // Analyze event titles for patterns
    const allEventTitles = [];
    eventElements.forEach(el => {
      const title = el.querySelector('h1, h2, h3, .event-title, .title, a, .display-lg')?.textContent?.trim() || '';
      if (title) {
        allEventTitles.push(title);
      }
    });
    
    console.log(`\n📊 Found ${allEventTitles.length} titles for analysis:`);
    allEventTitles.forEach((title, i) => {
      console.log(`   ${i + 1}. "${title}"`);
    });
    
    console.log('\n🏷️  EVENT TYPE CLASSIFICATION PATTERNS:');
    
    const typePatterns = {
      'meetup': /meetup|meet up|gathering/i,
      'workshop': /workshop|training|class|course|learn/i,
      'networking': /networking|connect|network|mixer|social/i,
      'presentation': /presentation|talk|speaker|pitch|demo/i,
      'conference': /conference|summit|symposium/i,
      'competition': /competition|contest|challenge|hackathon/i,
      'coworking': /coworking|co-working|open/i,
      'startup': /startup|entrepreneur|founder/i
    };
    
    allEventTitles.forEach((title, i) => {
      console.log(`\n   🎪 Event ${i + 1}: "${title}"`);
      
      let matchedTypes = [];
      Object.entries(typePatterns).forEach(([type, pattern]) => {
        if (pattern.test(title)) {
          matchedTypes.push(type);
        }
      });
      
      if (matchedTypes.length > 0) {
        console.log(`     🎯 Suggested types: ${matchedTypes.join(', ')}`);
      } else {
        console.log(`     🤷 No clear type pattern - would remain 'default'`);
      }
    });
    
    console.log('\n\n📈 SUMMARY OF ISSUES');
    console.log('=' .repeat(40));
    
    console.log('🔍 Summary Parsing Issues:');
    console.log('   • Current selectors appear to be working (13 events found in recent tests)');
    console.log('   • If summaries fail, it\'s likely due to:');
    console.log('     - Missing date/time causing entire event to be skipped (line 94: if (start && title))');
    console.log('     - Empty title after .trim() operation');
    console.log('     - Event elements not matching .event, .event-item, article, section');
    console.log('');
    console.log('🎭 Event Type Issues:');
    console.log('   • Line 111 in parseEvents.ts hardcodes eventType: "default"');
    console.log('   • No classification logic exists');
    console.log('   • Need to add pattern matching based on title content');
    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    console.log('   1. Add event type classification logic using title patterns');
    console.log('   2. Consider making event parsing more lenient (don\'t require both start AND title)');
    console.log('   3. Add fallback title extraction methods');
    console.log('   4. Log parsing failures for debugging');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

debugSummaryAndTypes();