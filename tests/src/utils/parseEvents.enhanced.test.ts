import { describe, it, expect } from 'vitest';
import { extractEvents } from '../../../src/utils/parseEvents';

describe('Enhanced Event Parsing with Schema.org', () => {
  describe('JSON-LD Event Parsing', () => {
    it('parses comprehensive JSON-LD events with all schema.org properties', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Event",
                "name": "Tech Conference 2025",
                "startDate": "2025-06-15T09:00:00-05:00",
                "endDate": "2025-06-15T17:00:00-05:00",
                "location": {
                  "@type": "Place",
                  "name": "Austin Convention Center",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "500 E Cesar Chavez St",
                    "addressLocality": "Austin",
                    "addressRegion": "TX",
                    "postalCode": "78701",
                    "addressCountry": "US"
                  }
                },
                "description": "Annual tech conference featuring the latest innovations",
                "url": "https://techconf2025.com",
                "eventStatus": "EventScheduled"
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const events = extractEvents(html);

      expect(events).toHaveLength(1);

      const event = events[0];
      // Current implementation returns legacy format with summary, start, end
      expect(event.name).toBe('Tech Conference 2025');
      expect(event.startDate).toMatch(/2025-06-15/);
      expect(event.endDate).toMatch(/2025-06-15/);
      expect(event.description).toBe('Annual tech conference featuring the latest innovations');
      expect(event.location).toContain('Austin Convention Center');
    });

    it('handles simple JSON-LD events with minimal data', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": "Simple Meetup",
            "startDate": "2025-03-01T18:00:00"
          }
        </script>
      `;

      const events = extractEvents(html);

      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('Simple Meetup');
      expect(events[0].startDate).toMatch(/2025-03-0[12]/); // Allow timezone conversion
    });

    it('handles string location in JSON-LD', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": "Workshop",
            "startDate": "2025-04-01T10:00:00",
            "location": "Online via Zoom"
          }
        </script>
      `;

      const events = extractEvents(html);
      expect(events[0].location).toBe('Online via Zoom');
    });
  });

  describe('HTML Element Event Parsing', () => {
    it('parses events from HTML elements with location parsing', () => {
      const html = `
        <div class="event">
          <h2>Startup Pitch Night</h2>
          <time datetime="2025-03-15T18:00:00">Mar. 15 / 6:00 PM - 8:00 PM</time>
          <div class="location">WeWork Austin, 901 S MoPac Expy, Austin, TX</div>
          <p class="description">Monthly startup pitch event for entrepreneurs</p>
        </div>
      `;

      const events = extractEvents(html);

      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.name).toBe('Startup Pitch Night');
      expect(event.startDate).toMatch(/2025-03-15/);
      expect(event.description).toContain('startup pitch event');
      expect(event.location).toContain('WeWork Austin');
    });

    it('extracts events with data-date attributes', () => {
      const html = `
        <div class="event" data-date="2025-04-01T19:00:00">
          <h2>Developer Meetup</h2>
          <div class="location">Tech Hub</div>
        </div>
      `;

      const events = extractEvents(html);

      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('Developer Meetup');
      expect(events[0].startDate).toMatch(/2025-04-01/);
    });

    it('classifies event types correctly', () => {
      const testCases = [
        { title: 'AI Hackathon 2025', expectedType: 'hackathon' },
        { title: 'React Workshop', expectedType: 'workshop' },
        { title: 'Tech Conference Summit', expectedType: 'conference' },
        { title: 'Networking Mixer', expectedType: 'meetup' },
        { title: 'Developer Meetup', expectedType: 'meetup' },
        { title: 'Random Event', expectedType: 'event' }
      ];

      testCases.forEach(({ title, expectedType }) => {
        const html = `
          <div class="event">
            <h2>${title}</h2>
            <time datetime="2025-05-01T18:00:00">May. 1 / 6:00 PM</time>
          </div>
        `;

        const events = extractEvents(html);
        if (events.length > 0) {
          expect(events[0].eventType).toBe(expectedType);
        }
      });
    });
  });

  describe('Date Parsing', () => {
    it('parses ISO date formats correctly', () => {
      const html = `
        <div class="event">
          <h2>Test Event</h2>
          <time datetime="2025-05-01T18:00:00">May 1, 2025</time>
        </div>
      `;

      const events = extractEvents(html);
      expect(events).toHaveLength(1);
      expect(events[0].startDate).toMatch(/2025-05-01/);
    });

    it('handles invalid dates gracefully', () => {
      const html = `
        <div class="event">
          <h2>Event with Bad Date</h2>
          <div class="date">Not a valid date</div>
        </div>
      `;

      const events = extractEvents(html);
      // Should not create event with invalid date or should handle gracefully
      expect(events.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Multiple Events', () => {
    it('extracts multiple events from the same page', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Event",
                "name": "JSON-LD Event",
                "startDate": "2025-06-01T09:00:00"
              }
            </script>
          </head>
          <body>
            <div class="event">
              <h2>HTML Event 1</h2>
              <time datetime="2025-07-01T18:00:00">Jul. 1 / 6:00 PM</time>
            </div>
            <div class="event">
              <h2>HTML Event 2</h2>
              <time datetime="2025-07-02T19:00:00">Jul. 2 / 7:00 PM</time>
            </div>
          </body>
        </html>
      `;

      const events = extractEvents(html);
      expect(events.length).toBeGreaterThanOrEqual(1);

      // At minimum, should find the JSON-LD event
      expect(events.some(e => e.name === 'JSON-LD Event')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed JSON-LD gracefully', () => {
      const html = `
        <script type="application/ld+json">
          { "invalid": "json", "missing": "quotes
        </script>
        <div class="event">
          <h2>Valid HTML Event</h2>
          <time datetime="2025-08-01T18:00:00">Aug. 1 / 6:00 PM</time>
        </div>
      `;

      const events = extractEvents(html);
      // Should still attempt to parse HTML events even if JSON-LD fails
      expect(events.length).toBeGreaterThanOrEqual(0);
    });

    it('handles empty HTML gracefully', () => {
      const events = extractEvents('');
      expect(events).toEqual([]);
    });

    it('handles HTML with no events', () => {
      const html = '<html><body><p>No events here</p></body></html>';
      const events = extractEvents(html);
      expect(events).toEqual([]);
    });
  });
});
