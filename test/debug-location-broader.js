import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';

const debugLocationBroader = async () => {
  console.log('🔍 Broader Location Search for Capital Factory');
  console.log('=' .repeat(50));
  
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
        continue;
      }
    }
    
    if (!rawHtml) {
      console.log('❌ Could not fetch HTML');
      return;
    }
    
    console.log('\n🌍 SEARCHING FOR CAPITAL FACTORY LOCATION REFERENCES');
    console.log('=' .repeat(50));
    
    // Search for Capital Factory address patterns
    const locationPatterns = [
      {
        name: 'Austin references',
        regex: /austin[^<>]*(?:tx|texas)/gi,
        maxResults: 5
      },
      {
        name: 'Street addresses',
        regex: /\d+\s+[^<>\n]*(?:street|st\b|avenue|ave\b|road|rd\b|drive|dr\b|boulevard|blvd\b)/gi,
        maxResults: 3
      },
      {
        name: 'Capital Factory address',
        regex: /capital\s*factory[^<>\n]*(?:address|location|austin|texas)/gi,
        maxResults: 3
      },
      {
        name: 'Zip codes',
        regex: /\b787\d{2}\b/g, // Austin area zip codes
        maxResults: 3
      },
      {
        name: 'Contact/About sections',
        regex: /(?:contact|about|visit|location)[^<>]*austin[^<>]*texas/gi,
        maxResults: 2
      }
    ];
    
    locationPatterns.forEach(pattern => {
      const matches = rawHtml.match(pattern.regex);
      console.log(`\n📍 ${pattern.name}:`);
      if (matches && matches.length > 0) {
        const uniqueMatches = [...new Set(matches)];
        uniqueMatches.slice(0, pattern.maxResults).forEach((match, i) => {
          console.log(`   ${i + 1}. "${match.trim()}"`);
        });
        if (uniqueMatches.length > pattern.maxResults) {
          console.log(`   ... and ${uniqueMatches.length - pattern.maxResults} more`);
        }
      } else {
        console.log('   ❌ No matches found');
      }
    });
    
    console.log('\n🏢 CHECKING FOR FOOTER/CONTACT INFORMATION');
    console.log('=' .repeat(50));
    
    const root = parse(rawHtml);
    
    // Look in footer
    const footer = root.querySelector('footer');
    if (footer) {
      console.log('📄 Footer content:');
      const footerText = footer.textContent?.trim() || '';
      const footerAddressMatches = footerText.match(/(?:\d+[^,\n]*(?:street|st|avenue|ave|road|rd|drive|dr|blvd|boulevard)[^,\n]*,?[^,\n]*austin[^,\n]*texas?[^,\n]*\d{5}?)/gi);
      if (footerAddressMatches) {
        footerAddressMatches.forEach((match, i) => {
          console.log(`   ${i + 1}. "${match.trim()}"`);
        });
      } else {
        console.log('   ❌ No address found in footer');
      }
    } else {
      console.log('❌ No footer found');
    }
    
    // Look for contact sections
    const contactSections = root.querySelectorAll('[class*="contact"], [class*="about"], [class*="location"], [class*="address"]');
    console.log(`\n📞 Contact/About sections found: ${contactSections.length}`);
    contactSections.forEach((section, i) => {
      const text = section.textContent?.trim() || '';
      if (text.length > 0 && text.length < 500 && text.toLowerCase().includes('austin')) {
        console.log(`   Section ${i + 1}: "${text.substring(0, 200)}..."`);
      }
    });
    
    console.log('\n🎪 CHECKING EVENT CONTAINER CONTEXT');
    console.log('=' .repeat(50));
    
    // Look at the parent containers of event items
    const eventItems = root.querySelectorAll('.event-item');
    console.log(`Found ${eventItems.length} event items`);
    
    if (eventItems.length > 0) {
      const firstEvent = eventItems[0];
      let currentParent = firstEvent.parentNode;
      let level = 1;
      
      console.log('\n🔍 Checking parent containers for location info:');
      while (currentParent && level <= 5) {
        const parentClasses = currentParent.getAttribute?.('class') || '';
        const parentTag = currentParent.tagName?.toLowerCase() || 'unknown';
        
        console.log(`   Level ${level}: <${parentTag}${parentClasses ? ` class="${parentClasses}"` : ''}>`);
        
        // Check if this parent has any location-related information
        const siblingElements = currentParent.children || [];
        for (let sibling of siblingElements) {
          if (sibling !== firstEvent.parentNode) {
            const siblingText = sibling.textContent?.trim() || '';
            const siblingClasses = sibling.getAttribute?.('class') || '';
            
            if (siblingText.length < 200 && 
                (siblingText.toLowerCase().includes('austin') ||
                 siblingText.toLowerCase().includes('capital factory') ||
                 siblingClasses.toLowerCase().includes('location') ||
                 siblingClasses.toLowerCase().includes('venue'))) {
              console.log(`     🎯 Sibling with location info: <${sibling.tagName?.toLowerCase()}${siblingClasses ? ` class="${siblingClasses}"` : ''}>`);
              console.log(`        "${siblingText.substring(0, 100)}..."`);
            }
          }
        }
        
        currentParent = currentParent.parentNode;
        level++;
      }
    }
    
    console.log('\n📊 SUMMARY');
    console.log('=' .repeat(30));
    console.log('🔍 Analysis Results:');
    console.log('   • Event items contain no location-specific classes or text');
    console.log('   • Need to check if location is:');
    console.log('     - Stored in a global context (site-wide location)');
    console.log('     - Available in event detail pages (not summary cards)');
    console.log('     - In a different HTML structure not captured');
    console.log('     - Simply not provided by Capital Factory for these events');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

debugLocationBroader();