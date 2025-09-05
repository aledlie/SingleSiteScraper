import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { extractEvents } from '../src/utils/parseEvents.ts';

const debugExtractEvents = async () => {
  console.log('🐛 Debug extractEvents Function');
  console.log('=' .repeat(50));
  
  try {
    // Fetch HTML
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
    
    console.log('\n🔄 Running extractEvents...');
    const events = extractEvents(rawHtml);
    console.log(`📊 Events extracted: ${events.length}`);
    
    if (events.length > 0) {
      events.forEach((event, i) => {
        console.log(`\n🎪 Event ${i + 1}:`);
        console.log(`   Title: "${event.summary}"`);
        console.log(`   Start: ${JSON.stringify(event.start)}`);
        console.log(`   Location: "${event.location || 'None'}"`);
        console.log(`   Description: "${event.description || 'None'}"`);
      });
    } else {
      console.log('\n🔬 Manual Debug - Let\'s check step by step...');
      
      // Import parse directly to debug
      const { parse } = await import('node-html-parser');
      const root = parse(rawHtml);
      
      // 1. Check event elements
      const eventElements = root.querySelectorAll('.event, .event-item, article, section');
      console.log(`📊 Found ${eventElements.length} event elements total`);
      
      const eventItems = root.querySelectorAll('.event-item');
      console.log(`📊 Found ${eventItems.length} .event-item elements`);
      
      if (eventItems.length > 0) {
        const firstItem = eventItems[0];
        console.log('\n🧪 Testing first .event-item:');
        
        // Test each selector individually
        const titleEl = firstItem.querySelector('h1, h2, h3, .event-title, .title, a, .display-lg');
        const dateEl = firstItem.querySelector('time, .event-date, .event-item-date, .date');
        
        console.log(`   Title element found: ${!!titleEl}`);
        if (titleEl) {
          console.log(`   Title text: "${titleEl.textContent?.trim()}"`);
        }
        
        console.log(`   Date element found: ${!!dateEl}`);
        if (dateEl) {
          console.log(`   Date text: "${dateEl.textContent?.trim()}"`);
        }
        
        // Test date parsing specifically
        if (dateEl) {
          const dateStr = dateEl.textContent?.trim() || '';
          console.log(`   Testing date parsing for: "${dateStr}"`);
          
          // Simulate the parseEventDate logic
          let cleanDateStr = dateStr;
          const capitalFactoryMatch = dateStr.match(/^([A-Za-z]+\.\s*\d{1,2})/);
          if (capitalFactoryMatch) {
            const currentYear = new Date().getFullYear();
            cleanDateStr = `${capitalFactoryMatch[1].replace('.', '')} ${currentYear}`;
            console.log(`   Cleaned date: "${cleanDateStr}"`);
            
            const testDate = new Date(Date.parse(cleanDateStr));
            console.log(`   Parsed successfully: ${!isNaN(testDate.getTime())}`);
            if (!isNaN(testDate.getTime())) {
              console.log(`   Parsed date: ${testDate}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

debugExtractEvents();