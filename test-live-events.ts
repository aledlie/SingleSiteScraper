/**
 * Test event parser on live websites
 */

import { extractEventsLegacy } from './src/utils/events/eventParser';

async function testLiveSite(url: string) {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 Testing:', url);
  console.log('='.repeat(60));

  try {
    // Fetch via a CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    const response = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.log('❌ Failed to fetch:', response.status);
      return;
    }

    const html = await response.text();
    console.log('📄 HTML size:', html.length.toLocaleString(), 'chars');

    // Extract events
    const startTime = Date.now();
    const events = extractEventsLegacy(html);
    const duration = Date.now() - startTime;

    console.log('📊 Events found:', events.length);
    console.log('⏱️  Parse time:', duration, 'ms');

    if (events.length > 0) {
      console.log('\n📅 Extracted Events:');
      events.slice(0, 8).forEach((event, i) => {
        console.log('\n  Event ' + (i + 1) + ':');
        console.log('    Summary:', (event.summary || '').substring(0, 60) + (event.summary && event.summary.length > 60 ? '...' : ''));
        console.log('    Start:', event.start);
        console.log('    End:', event.end);
        if (event.location) {
          console.log('    Location:', event.location.substring(0, 50) + (event.location.length > 50 ? '...' : ''));
        }
        console.log('    Type:', event.eventType);
      });

      if (events.length > 8) {
        console.log('\n  ... and ' + (events.length - 8) + ' more events');
      }
    } else {
      // Debug: check for JSON-LD and event patterns
      const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi);
      const eventClassMatches = html.match(/class="[^"]*event[^"]*"/gi);
      console.log('\n🔍 Debug info:');
      console.log('  JSON-LD scripts:', jsonLdMatches ? jsonLdMatches.length : 0);
      console.log('  Event-related classes:', eventClassMatches ? eventClassMatches.length : 0);

      // Show unique event classes found
      if (eventClassMatches && eventClassMatches.length > 0) {
        const uniqueClasses = [...new Set(eventClassMatches)].slice(0, 10);
        console.log('\n  Sample event classes:');
        uniqueClasses.forEach(c => console.log('    ' + c));
      }

      // Check for date patterns
      const datePatterns = html.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}/gi);
      console.log('  Date patterns found:', datePatterns ? datePatterns.length : 0);

      // Check for time elements
      const timeElements = html.match(/<time[^>]*>/gi);
      console.log('  <time> elements:', timeElements ? timeElements.length : 0);
    }

    return events;
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    return [];
  }
}

async function main() {
  console.log('🧪 Live Event Parser Test');
  console.log('Testing event extraction on real websites...\n');

  // Test sites - mix of different event formats
  const testSites = [
    'https://capitalfactory.com/in-person/', // Capital Factory events page
    'https://www.meetup.com/find/?location=us--tx--Austin', // Meetup Austin (JSON-LD)
    'https://allevents.in/austin', // AllEvents Austin
    'https://www.visitsanantonio.com/events/', // Visit San Antonio events
    'https://www.timeout.com/austin/things-to-do/austin-events-calendar', // TimeOut Austin
    'https://www.thrillist.com/events/austin', // Thrillist Austin events
  ];

  for (const site of testSites) {
    await testLiveSite(site);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Live testing complete');
  console.log('='.repeat(60));
}

main();
