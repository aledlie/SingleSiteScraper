import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';

const examineEventHTML = async () => {
  console.log('🔬 Event HTML Structure Examiner');
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
    
    if (eventItems.length > 0) {
      const firstEvent = eventItems[0];
      
      console.log('\n🎪 First Event Item Raw HTML:');
      console.log('-'.repeat(50));
      console.log(firstEvent.innerHTML);
      console.log('-'.repeat(50));
      
      console.log('\n🔍 Text Content Analysis:');
      console.log(`Full text: "${firstEvent.textContent.trim()}"`);
      
      console.log('\n🧬 All Child Elements:');
      const allChildren = firstEvent.querySelectorAll('*');
      allChildren.forEach((child, i) => {
        const tag = child.tagName?.toLowerCase() || 'unknown';
        const classes = child.getAttribute('class') || '';
        const text = child.textContent?.trim() || '';
        if (text.length > 0 && text.length < 200) {
          console.log(`  ${i + 1}. <${tag}${classes ? ` class="${classes}"` : ''}>`);
          console.log(`     Text: "${text}"`);
        }
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

examineEventHTML();