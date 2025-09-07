import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';

const debugLocationParsing = async () => {
  console.log('🔍 Location Parsing Debug for Capital Factory Events');
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
    
    const root = parse(rawHtml);
    const eventItems = root.querySelectorAll('.event-item');
    
    console.log(`\n📊 Found ${eventItems.length} .event-item elements`);
    console.log('\n🔍 LOCATION DEBUGGING - First 3 Events');
    console.log('=' .repeat(60));
    
    eventItems.slice(0, 3).forEach((eventItem, index) => {
      console.log(`\n🎪 Event Item ${index + 1}:`);
      
      // Show the title for context
      const title = eventItem.querySelector('.display-lg')?.textContent?.trim() || 'No title';
      console.log(`   📝 Title: "${title}"`);
      
      console.log(`\n   📍 LOCATION SEARCH ANALYSIS:`);
      
      // Current selectors being used
      console.log(`   Current location selectors: .event-location, .location, address`);
      
      const currentLocationEl = eventItem.querySelector('.event-location, .location, address');
      console.log(`   Current selector result: ${currentLocationEl ? `"${currentLocationEl.textContent?.trim()}"` : 'null'}`);
      
      // Test various location-related selectors
      const locationSelectors = [
        '.event-location',
        '.location', 
        'address',
        '.venue',
        '.place',
        '.event-venue',
        '[class*="location"]',
        '[class*="venue"]',
        '[class*="place"]',
        '[class*="address"]'
      ];
      
      console.log(`\n   Testing individual location selectors:`);
      locationSelectors.forEach(selector => {
        const element = eventItem.querySelector(selector);
        if (element) {
          console.log(`     ✅ ${selector}: "${element.textContent?.trim()}"`);
        } else {
          console.log(`     ❌ ${selector}: not found`);
        }
      });
      
      // Look for any text that might contain location info
      console.log(`\n   📍 SEARCHING FOR LOCATION-LIKE TEXT:`);
      
      const fullText = eventItem.textContent || '';
      const locationKeywords = [
        /austin/gi,
        /texas/gi,
        /tx\b/gi,
        /address/gi,
        /location/gi,
        /venue/gi,
        /\d+.*street|st\b/gi,
        /\d+.*avenue|ave\b/gi,
        /\d+.*road|rd\b/gi,
        /capital\s*factory/gi
      ];
      
      locationKeywords.forEach(regex => {
        const matches = fullText.match(regex);
        if (matches) {
          console.log(`     🎯 Found "${regex}": ${matches.slice(0, 3).join(', ')}`);
        }
      });
      
      // Show all child elements with their classes and text
      console.log(`\n   🧬 ALL CHILD ELEMENTS:`);
      const allChildren = eventItem.querySelectorAll('*');
      allChildren.forEach((child, i) => {
        const tag = child.tagName?.toLowerCase() || 'unknown';
        const classes = child.getAttribute('class') || '';
        const text = child.textContent?.trim() || '';
        
        if (text.length > 0 && text.length < 100 && text.toLowerCase().includes('austin')) {
          console.log(`     🎯 ${i + 1}. <${tag}${classes ? ` class="${classes}"` : ''}>`);
          console.log(`        Text: "${text}"`);
        }
      });
      
      // Check if there are any elements with location-related text but no location class
      console.log(`\n   🔍 ELEMENTS WITH LOCATION-LIKE TEXT (no location class):`);
      allChildren.forEach((child, i) => {
        const text = child.textContent?.trim() || '';
        const classes = child.getAttribute('class') || '';
        
        if (text.length < 200 && 
            (text.toLowerCase().includes('austin') || 
             text.toLowerCase().includes('capital factory') ||
             text.toLowerCase().includes('texas') ||
             /\d+.*st\b|\d+.*street|\d+.*ave|\d+.*avenue/.test(text.toLowerCase()))) {
          
          if (!classes.toLowerCase().includes('location') && 
              !classes.toLowerCase().includes('venue') &&
              !classes.toLowerCase().includes('address')) {
            console.log(`     📍 <${child.tagName?.toLowerCase()}${classes ? ` class="${classes}"` : ''}>`);
            console.log(`        "${text}"`);
          }
        }
      });
      
      console.log(`\n   📄 RAW HTML (first 500 chars):`);
      console.log(`     ${eventItem.innerHTML.substring(0, 500)}...`);
    });
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

debugLocationParsing();