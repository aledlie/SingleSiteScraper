/**
 * Event Parser Unit Tests
 */

import { describe, it, expect } from 'vitest';
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

describe('Event Parser', () => {
  describe('JSON-LD Event Extraction', () => {
    it('extracts events from JSON-LD script tags', () => {
      const events = extractEventsLegacy(jsonLdHtml);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Tech Conference 2026');
      expect(events[0].start).toMatch(/2026-03-15/);
      expect(events[0].location).toContain('Austin Convention Center');
    });
  });

  describe('Microdata Event Extraction', () => {
    it('extracts events from microdata elements', () => {
      const events = extractEventsLegacy(microdataHtml);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Startup Pitch Night');
      expect(events[0].start).toMatch(/2026-04-20/);
      expect(events[0].location).toContain('Capital Factory');
    });
  });

  describe('HTML Pattern Event Extraction', () => {
    it('extracts events from common HTML patterns', () => {
      const events = extractEventsLegacy(patternHtml);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Weekly Networking Meetup');
      expect(events[0].start).toMatch(/2026-05-10/);
      expect(events[0].eventType).toBe('Meetup');
    });
  });

  describe('JSON-LD @graph Structure', () => {
    it('extracts multiple events from @graph', () => {
      const events = extractEventsLegacy(graphHtml);
      expect(events).toHaveLength(2);
      expect(events.some(e => e.summary === 'Hackathon Weekend')).toBe(true);
      expect(events.some(e => e.summary === 'Demo Day')).toBe(true);
    });
  });

  describe('Event Type Detection', () => {
    it('detects hackathon event type', () => {
      const events = extractEventsLegacy(graphHtml);
      const hackathon = events.find(e => e.summary === 'Hackathon Weekend');
      expect(hackathon?.eventType).toBe('Hackathon');
    });

    it('detects conference event type', () => {
      const events = extractEventsLegacy(jsonLdHtml);
      expect(events[0].eventType).toBe('Conference');
    });

    it('detects meetup event type', () => {
      const events = extractEventsLegacy(patternHtml);
      expect(events[0].eventType).toBe('Meetup');
    });
  });

  describe('Empty/Invalid HTML Handling', () => {
    it('returns empty array for empty HTML', () => {
      const events = extractEventsLegacy('');
      expect(events).toEqual([]);
    });

    it('returns empty array for HTML without events', () => {
      const events = extractEventsLegacy('<html><body>No events here</body></html>');
      expect(events).toEqual([]);
    });
  });
});
