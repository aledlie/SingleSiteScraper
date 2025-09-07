import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';

const debugEventLinks = async () => {
  console.log('🔗 Event Links and Location Inference Debug');
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
    
    const root = parse(rawHtml);
    const eventItems = root.querySelectorAll('.event-item');
    
    console.log(`\n🎪 Found ${eventItems.length} event items`);
    console.log('\n🔗 CHECKING FOR EVENT DETAIL LINKS');
    console.log('=' .repeat(50));
    
    eventItems.slice(0, 3).forEach((eventItem, index) => {
      const title = eventItem.querySelector('.display-lg')?.textContent?.trim() || 'No title';
      console.log(`\n🎪 Event ${index + 1}: "${title}"`);
      
      // Look for any links within the event item
      const links = eventItem.querySelectorAll('a');
      console.log(`   🔗 Links found: ${links.length}`);
      
      links.forEach((link, i) => {
        const href = link.getAttribute('href');
        const linkText = link.textContent?.trim();
        console.log(`     ${i + 1}. href="${href}" text="${linkText}"`);
      });
      
      // Check if the entire event item is clickable
      const parentLink = eventItem.closest('a');
      if (parentLink) {
        const href = parentLink.getAttribute('href');
        console.log(`   🎯 Entire event is wrapped in link: "${href}"`);
      }
      
      // Check for data attributes that might contain location info
      console.log(`   📊 Data attributes:`);
      const attributes = eventItem.getAttributeNames?.() || [];
      attributes.forEach(attr => {
        if (attr.startsWith('data-')) {
          console.log(`     ${attr}="${eventItem.getAttribute(attr)}"`);
        }
      });
    });
    
    console.log('\n🌍 LOCATION INFERENCE ANALYSIS');
    console.log('=' .repeat(40));
    
    // Check if we can infer location from the context
    console.log('🔍 Capital Factory context clues:');
    
    // Look for general Capital Factory location mentions
    const capitalFactoryMatches = rawHtml.match(/capital\s*factory[^<>\n]{0,100}(?:austin|texas|tx)/gi);
    if (capitalFactoryMatches) {
      console.log('   ✅ Capital Factory + Austin/Texas found:');
      capitalFactoryMatches.slice(0, 3).forEach((match, i) => {
        console.log(`     ${i + 1}. "${match.trim()}"`);
      });
    }
    
    // Check if there's a general venue/location context
    const venueContext = rawHtml.match(/(?:venue|location|address)[^<>\n]{0,100}(?:austin|texas|capital\s*factory)/gi);
    if (venueContext) {
      console.log('   ✅ Venue context found:');
      venueContext.slice(0, 3).forEach((match, i) => {
        console.log(`     ${i + 1}. "${match.trim()}"`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(30));
    
    console.log('Based on the analysis:');
    console.log('');
    console.log('1. 🎯 Location Inference Strategy:');
    console.log('   • Events appear to be hosted by Capital Factory');
    console.log('   • Capital Factory is mentioned with Austin, Texas context');
    console.log('   • Could infer location as "Austin, TX" or "Capital Factory, Austin, TX"');
    console.log('');
    console.log('2. 🔗 Event Detail Pages:');
    console.log('   • Check if event items have links to detail pages');
    console.log('   • Detail pages might contain specific venue information');
    console.log('');
    console.log('3. 🏢 Default Location Strategy:');
    console.log('   • For Capital Factory events, default to "Capital Factory, Austin, TX"');
    console.log('   • This would be more accurate than "Not specified"');
    console.log('');
    console.log('4. 📍 Parsing Logic Update Needed:');
    console.log('   • Current selectors: .event-location, .location, address');
    console.log('   • No elements match these selectors');
    console.log('   • Consider context-based location inference');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

debugEventLinks();