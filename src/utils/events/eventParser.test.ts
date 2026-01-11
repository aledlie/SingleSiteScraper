/**
 * Event Parser Unit Tests
 */

import { extractEventsLegacy } from './eventParser';

// Test HTML with JSON-LD event
const jsonLdHtml = `
<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "Tech Conference 2026",
    "startDate": "2026-03-15T09:00:00-05:00",
    "endDate": "2026-03-15T17:00:00-05:00",
    "location": {
      "@type": "Place",
      "name": "Austin Convention Center",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "500 E Cesar Chavez St",
        "addressLocality": "Austin",
        "addressRegion": "TX",
        "postalCode": "78701"
      }
    },
    "description": "Annual tech conference featuring workshops and networking."
  }
  </script>
</head>
<body></body>
</html>
`;

// Test HTML with microdata
const microdataHtml = `
<!DOCTYPE html>
<html>
<body>
  <div itemscope itemtype="https://schema.org/Event">
    <h2 itemprop="name">Startup Pitch Night</h2>
    <time itemprop="startDate" datetime="2026-04-20T18:00:00">April 20, 2026</time>
    <span itemprop="location">Capital Factory, Austin TX</span>
    <p itemprop="description">Watch startups pitch to investors.</p>
  </div>
</body>
</html>
`;

// Test HTML with common patterns
const patternHtml = `
<!DOCTYPE html>
<html>
<body>
  <div class="event-card">
    <h3 class="event-title">Weekly Networking Meetup</h3>
    <time datetime="2026-05-10T17:30:00">May 10, 2026 at 5:30 PM</time>
    <div class="location">Downtown Community Center</div>
    <p class="description">Connect with local professionals.</p>
  </div>
</body>
</html>
`;

// Test with @graph structure
const graphHtml = `
<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        "name": "Hackathon Weekend",
        "startDate": "2026-06-01",
        "description": "48-hour coding challenge"
      },
      {
        "@type": "Event",
        "name": "Demo Day",
        "startDate": "2026-06-03",
        "description": "Present your hackathon projects"
      }
    ]
  }
  </script>
</head>
<body></body>
</html>
`;

function runTests() {
  console.log('🧪 Event Parser Unit Tests\n');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  // Test 1: JSON-LD extraction
  console.log('\n📋 Test 1: JSON-LD Event Extraction');
  const jsonLdEvents = extractEventsLegacy(jsonLdHtml);
  if (jsonLdEvents.length === 1 && jsonLdEvents[0].summary === 'Tech Conference 2026') {
    console.log('  ✅ PASS - Found event from JSON-LD');
    console.log(`     Summary: ${jsonLdEvents[0].summary}`);
    console.log(`     Start: ${jsonLdEvents[0].start}`);
    console.log(`     Location: ${jsonLdEvents[0].location}`);
    console.log(`     Type: ${jsonLdEvents[0].eventType}`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Expected 1 event from JSON-LD');
    console.log(`     Got: ${jsonLdEvents.length} events`);
    failed++;
  }

  // Test 2: Microdata extraction
  console.log('\n📋 Test 2: Microdata Event Extraction');
  const microdataEvents = extractEventsLegacy(microdataHtml);
  if (microdataEvents.length === 1 && microdataEvents[0].summary === 'Startup Pitch Night') {
    console.log('  ✅ PASS - Found event from microdata');
    console.log(`     Summary: ${microdataEvents[0].summary}`);
    console.log(`     Start: ${microdataEvents[0].start}`);
    console.log(`     Location: ${microdataEvents[0].location}`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Expected 1 event from microdata');
    console.log(`     Got: ${microdataEvents.length} events`);
    failed++;
  }

  // Test 3: HTML pattern extraction
  console.log('\n📋 Test 3: HTML Pattern Event Extraction');
  const patternEvents = extractEventsLegacy(patternHtml);
  if (patternEvents.length === 1 && patternEvents[0].summary === 'Weekly Networking Meetup') {
    console.log('  ✅ PASS - Found event from HTML patterns');
    console.log(`     Summary: ${patternEvents[0].summary}`);
    console.log(`     Start: ${patternEvents[0].start}`);
    console.log(`     Type: ${patternEvents[0].eventType}`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Expected 1 event from HTML patterns');
    console.log(`     Got: ${patternEvents.length} events`);
    failed++;
  }

  // Test 4: @graph structure
  console.log('\n📋 Test 4: JSON-LD @graph Structure');
  const graphEvents = extractEventsLegacy(graphHtml);
  if (graphEvents.length === 2) {
    console.log('  ✅ PASS - Found 2 events from @graph');
    graphEvents.forEach((e, i) => {
      console.log(`     Event ${i + 1}: ${e.summary} (${e.eventType})`);
    });
    passed++;
  } else {
    console.log('  ❌ FAIL - Expected 2 events from @graph');
    console.log(`     Got: ${graphEvents.length} events`);
    failed++;
  }

  // Test 5: Event type detection
  console.log('\n📋 Test 5: Event Type Detection');
  const hackathonEvent = graphEvents.find(e => e.summary === 'Hackathon Weekend');
  const conferenceEvent = jsonLdEvents[0];
  const meetupEvent = patternEvents[0];

  if (hackathonEvent?.eventType === 'Hackathon' &&
      conferenceEvent?.eventType === 'Conference' &&
      meetupEvent?.eventType === 'Meetup') {
    console.log('  ✅ PASS - Event types correctly detected');
    console.log(`     Hackathon Weekend -> ${hackathonEvent.eventType}`);
    console.log(`     Tech Conference 2026 -> ${conferenceEvent.eventType}`);
    console.log(`     Weekly Networking Meetup -> ${meetupEvent.eventType}`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Event types not correctly detected');
    failed++;
  }

  // Test 6: Empty/invalid HTML
  console.log('\n📋 Test 6: Empty HTML Handling');
  const emptyEvents = extractEventsLegacy('');
  const invalidEvents = extractEventsLegacy('<html><body>No events here</body></html>');
  if (emptyEvents.length === 0 && invalidEvents.length === 0) {
    console.log('  ✅ PASS - Correctly returns empty array for no events');
    passed++;
  } else {
    console.log('  ❌ FAIL - Should return empty array');
    failed++;
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('=' .repeat(50));

  return { passed, failed };
}

// Run tests
runTests();
