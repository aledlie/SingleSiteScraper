import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';

const inspectHtmlStructure = async () => {
  console.log('🔍 Inspecting Capital Factory HTML structure...\n');
  
  // Get raw HTML
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
  
  if (!rawHtml) {
    console.log('❌ Could not fetch HTML');
    return;
  }
  
  const root = parse(rawHtml);
  
  // Test the current selectors used in parseEvents.ts
  console.log('🎯 Testing current selectors from parseEvents.ts:');
  
  const currentSelectors = ['.event', '.event-item', 'article', 'section'];
  
  currentSelectors.forEach(selector => {
    const elements = root.querySelectorAll(selector);
    console.log(`\n${selector}: Found ${elements.length} elements`);
    
    if (elements.length > 0) {
      const firstElement = elements[0];
      
      // Test what the current parsing logic would extract
      const title = firstElement.querySelector('h1, h2, .event-title')?.textContent || '';
      const dateTime = firstElement.querySelector('time, .event-date, .date')?.textContent || '';
      const location = firstElement.querySelector('.event-location, .location')?.textContent || '';
      const description = firstElement.querySelector('.event-description, .description, p')?.textContent || '';
      
      console.log(`  Sample element 1:`);
      console.log(`    Title (h1, h2, .event-title): "${title.trim()}"`);
      console.log(`    DateTime (time, .event-date, .date): "${dateTime.trim()}"`);
      console.log(`    Location (.event-location, .location): "${location.trim()}"`);
      console.log(`    Description (.event-description, .description, p): "${description.trim().substring(0, 100)}..."`);
      
      // Show the actual HTML structure
      console.log(`    Raw HTML (first 300 chars): ${firstElement.innerHTML.trim().substring(0, 300)}...`);
    }
  });
  
  // Also check what event-specific classes look like
  console.log('\n\n🏷️ Analyzing actual event elements:');
  const eventItems = root.querySelectorAll('.event-item');
  
  if (eventItems.length > 0) {
    console.log(`Found ${eventItems.length} .event-item elements`);
    
    eventItems.slice(0, 3).forEach((item, i) => {
      console.log(`\n.event-item ${i + 1}:`);
      
      // Look for various possible selectors within event items
      const possibleTitles = [
        item.querySelector('h1, h2, h3, h4, h5, h6'),
        item.querySelector('.title, .event-title, .name'),
        item.querySelector('a')
      ].filter(Boolean);
      
      const possibleDates = [
        item.querySelector('time'),
        item.querySelector('.date, .event-date, .event-item-date'),
        item.querySelector('[class*="date"]')
      ].filter(Boolean);
      
      const possibleLocations = [
        item.querySelector('.location, .event-location'),
        item.querySelector('[class*="location"]')
      ].filter(Boolean);
      
      console.log(`  Possible titles: ${possibleTitles.map(el => `"${el?.textContent?.trim() || ''}"`).join(', ')}`);
      console.log(`  Possible dates: ${possibleDates.map(el => `"${el?.textContent?.trim() || ''}"`).join(', ')}`);
      console.log(`  Possible locations: ${possibleLocations.map(el => `"${el?.textContent?.trim() || ''}"`).join(', ')}`);
      console.log(`  Full HTML: ${item.innerHTML.trim().substring(0, 200)}...`);
    });
  }
};

inspectHtmlStructure();