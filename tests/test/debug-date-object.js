import { fetchWithTimeout, proxyServices } from '../src/utils/network.ts';
import { extractEvents } from '../src/utils/parseEvents.ts';

const debugDateObject = async () => {
  console.log('🔍 Date Object Debug for Capital Factory Events');
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
    
    console.log('\n🧪 EXTRACTING EVENTS AND ANALYZING DATE OBJECTS');
    console.log('=' .repeat(60));
    
    const events = extractEvents(rawHtml);
    console.log(`📊 Extracted ${events.length} events`);
    
    if (events.length > 0) {
      console.log('\n🔍 DATE OBJECT ANALYSIS - First 3 Events:');
      
      events.slice(0, 3).forEach((event, index) => {
        console.log(`\n🎪 Event ${index + 1}: "${event.summary}"`);
        
        console.log(`\n📅 START DATE ANALYSIS:`);
        console.log(`   Raw value: ${JSON.stringify(event.start)}`);
        console.log(`   Type: ${typeof event.start}`);
        console.log(`   Is object: ${typeof event.start === 'object'}`);
        console.log(`   Is null: ${event.start === null}`);
        console.log(`   Constructor: ${event.start?.constructor?.name || 'N/A'}`);
        
        if (event.start && typeof event.start === 'object') {
          console.log(`   Object keys: [${Object.keys(event.start).join(', ')}]`);
          Object.entries(event.start).forEach(([key, value]) => {
            console.log(`   ${key}: "${value}" (${typeof value})`);
          });
          
          // Check if it has a toString method
          console.log(`   toString(): "${event.start.toString()}"`);
        }
        
        console.log(`\n📅 END DATE ANALYSIS:`);
        console.log(`   Raw value: ${JSON.stringify(event.end)}`);
        console.log(`   Type: ${typeof event.end}`);
        console.log(`   Is object: ${typeof event.end === 'object'}`);
        console.log(`   Is null: ${event.end === null}`);
        console.log(`   Constructor: ${event.end?.constructor?.name || 'N/A'}`);
        
        if (event.end && typeof event.end === 'object') {
          console.log(`   Object keys: [${Object.keys(event.end).join(', ')}]`);
          Object.entries(event.end).forEach(([key, value]) => {
            console.log(`   ${key}: "${value}" (${typeof value})`);
          });
          
          console.log(`   toString(): "${event.end.toString()}"`);
        }
      });
      
      console.log('\n🔍 EXPECTED VS ACTUAL FORMAT ANALYSIS');
      console.log('=' .repeat(50));
      
      console.log('💡 Current format appears to be:');
      console.log('   { date: "04/09/2025", timeZone: "America/Chicago" }');
      console.log('');
      console.log('🎯 Expected formats for display:');
      console.log('   • ISO 8601: "2025-09-04T17:00:00.000Z"');
      console.log('   • Human readable: "September 4, 2025 5:00 PM"');
      console.log('   • Simple date: "2025-09-04"');
      console.log('   • Current object needs better string representation');
      
      console.log('\n💡 SOLUTIONS:');
      console.log('1. 🔧 Update parseEventDate() to return ISO string instead of object');
      console.log('2. 🎨 Update display logic to handle the current object format');
      console.log('3. 📅 Add a proper date conversion method in the event extraction');
      
      console.log('\n🧪 TESTING STRING CONVERSION:');
      const firstEvent = events[0];
      if (firstEvent && firstEvent.start && typeof firstEvent.start === 'object') {
        console.log('Current object:', firstEvent.start);
        
        // Try to create a proper date string
        if (firstEvent.start.date) {
          const dateParts = firstEvent.start.date.split('/'); // "04/09/2025" -> ["04", "09", "2025"]
          if (dateParts.length === 3) {
            const [day, month, year] = dateParts;
            const isoDate = `${year}-${month}-${day}`;
            console.log(`Converted to ISO: "${isoDate}"`);
            
            try {
              const jsDate = new Date(isoDate);
              console.log(`JavaScript Date: ${jsDate}`);
              console.log(`Formatted: ${jsDate.toLocaleDateString()} ${jsDate.toLocaleTimeString()}`);
            } catch (e) {
              console.log(`Date creation failed: ${e.message}`);
            }
          }
        }
      }
      
    } else {
      console.log('❌ No events found to analyze');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
};

debugDateObject();