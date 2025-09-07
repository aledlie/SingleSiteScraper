import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { parse } from 'node-html-parser';
import { format, parse as parseDate, isValid } from 'date-fns';

// Copy exact parseEventDate function
function parseEventDate(dateStr, timeZone = 'America/Chicago') {
  let cleanDateStr = dateStr;
  
  const capitalFactoryMatch = dateStr.match(/^([A-Za-z]+\.\s*\d{1,2})/);
  if (capitalFactoryMatch) {
    const currentYear = new Date().getFullYear();
    cleanDateStr = `${capitalFactoryMatch[1].replace('.', '')} ${currentYear}`;
  }
  
  const possibleFormats = [
    'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss', 'yyyy/MM/dd', 'yyyyMMdd',
    'MM-dd-yyyy', 'MM/dd/yyyy HH:mm', 'MM/dd/yyyy', 'MMddyyyy',
    'dd-MM-yyy', 'dd/MM/yyyy', 'ddMMyyyy', 'MMMM d, yyyy h:mm a', 'MMM d yyyy'
  ];

  try {
    let date = new Date(Date.parse(cleanDateStr));
    if (!isValid(date)) {
      for (const formatPattern of possibleFormats) {
        date = parseDate(cleanDateStr, formatPattern, new Date());
        if (isValid(date)) break;
      }
    }
    if (!isValid(date)) return null;
    return { date: format(date, 'dd/MM/yyyy'), timeZone };
  } catch {
    return null;
  }
}

// Copy exact extractEvents logic
function traceExtractEvents(html) {
  console.log('🔄 Starting extractEvents...');
  const root = parse(html);
  const events = [];

  // 1. Try Schema.org JSON-LD
  console.log('1️⃣ Checking JSON-LD scripts...');
  const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
  console.log(`   Found ${jsonLdScripts.length} JSON-LD scripts`);
  
  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.textContent);
      if (json['@type'] === 'Event') {
        console.log('   ✅ Found Event in JSON-LD');
        // JSON-LD processing...
      }
    } catch {}
  }

  // 2. Try HTML elements (heuristic)
  console.log('\n2️⃣ Checking HTML elements...');
  const eventElements = root.querySelectorAll('.event, .event-item, article, section');
  console.log(`   Found ${eventElements.length} potential event elements`);
  
  let processedCount = 0;
  for (const el of eventElements) {
    processedCount++;
    console.log(`\n   🔍 Processing element ${processedCount}/${eventElements.length}:`);
    
    const title = el.querySelector('h1, h2, h3, .event-title, .title, a, .display-lg')?.textContent || '';
    const dateTime = el.querySelector('time, .event-date, .event-item-date, .date')?.textContent || '';
    const location = el.querySelector('.event-location, .location, address')?.textContent || '';
    const description = el.querySelector('.event-description, .description, p')?.textContent || '';

    console.log(`     Title: "${title}" (length: ${title.length})`);
    console.log(`     DateTime: "${dateTime}" (length: ${dateTime.length})`);
    console.log(`     Location: "${location}" (length: ${location.length})`);
    console.log(`     Description: "${description.substring(0, 50)}..." (length: ${description.length})`);

    console.log(`     Parsing date...`);
    const start = parseEventDate(dateTime);
    console.log(`     Date parsed: ${!!start} ${start ? JSON.stringify(start) : ''}`);

    console.log(`     Checking conditions:`);
    console.log(`     - start truthy: ${!!start}`);
    console.log(`     - title truthy: ${!!title}`);
    console.log(`     - Both true: ${!!(start && title)}`);

    if (start && title) {
      console.log(`     ✅ Adding event to results!`);
      events.push({
        summary: title,
        start,
        end: start, // Default end to start if not specified
        location: location || undefined,
        description: description || undefined,
        eventType: 'default',
      });
    } else {
      console.log(`     ❌ Skipping - conditions not met`);
    }
    
    // Only process first few for debugging
    if (processedCount >= 3) {
      console.log(`   ... (stopping after 3 for debugging)`);
      break;
    }
  }

  console.log(`\n✅ Final result: ${events.length} events`);
  return events;
}

const traceExtraction = async () => {
  console.log('🕵️ Tracing extractEvents Function');
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
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!rawHtml) {
      console.log('❌ Could not fetch HTML');
      return;
    }
    
    const events = traceExtractEvents(rawHtml);
    console.log(`\n🏁 Final events extracted: ${events.length}`);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

traceExtraction();