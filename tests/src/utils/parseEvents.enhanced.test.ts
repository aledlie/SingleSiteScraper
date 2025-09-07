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
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 30.2630556,
                    "longitude": -97.7394444
                  }
                },
                "description": "Annual tech conference featuring the latest innovations",
                "url": "https://techconf2025.com",
                "image": "https://techconf2025.com/banner.jpg",
                "organizer": {
                  "@type": "Organization",
                  "name": "Tech Events Inc",
                  "url": "https://techevents.com",
                  "email": "info@techevents.com"
                },
                "performer": {
                  "@type": "Person",
                  "name": "Jane Doe",
                  "jobTitle": "Tech Leader"
                },
                "offers": [{
                  "@type": "Offer",
                  "price": "299",
                  "priceCurrency": "USD",
                  "availability": "InStock",
                  "url": "https://techconf2025.com/tickets"
                }],
                "eventStatus": "EventScheduled",
                "eventAttendanceMode": "OfflineEventAttendanceMode",
                "doorTime": "08:30:00",
                "duration": "PT8H",
                "isAccessibleForFree": false,
                "maximumAttendeeCapacity": 500
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const events = extractEvents(html);
      
      expect(events).toHaveLength(1);
      
      const event = events[0];
      expect(event).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Tech Conference 2025',
        startDate: expect.stringMatching(/2025-06-15T\d{2}:\d{2}:\d{2}/),
        endDate: expect.stringMatching(/2025-06-15T\d{2}:\d{2}:\d{2}/),
        description: 'Annual tech conference featuring the latest innovations',
        eventType: 'conference',
        url: 'https://techconf2025.com',
        image: 'https://techconf2025.com/banner.jpg',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
        doorTime: '08:30:00',
        duration: 'PT8H',
        isAccessibleForFree: false,
        maximumAttendeeCapacity: 500
      });

      // Check location is properly parsed
      expect(event.location).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: 'Austin Convention Center',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '500 E Cesar Chavez St',
          addressLocality: 'Austin',
          addressRegion: 'TX',
          postalCode: '78701',
          addressCountry: 'US'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 30.2630556,
          longitude: -97.7394444
        }
      });

      // Check organizer is properly parsed
      expect(event.organizer).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Tech Events Inc',
        url: 'https://techevents.com',
        email: 'info@techevents.com'
      });

      // Check offers are preserved
      expect(event.offers).toEqual([{
        '@type': 'Offer',
        price: '299',
        priceCurrency: 'USD',
        availability: 'InStock',
        url: 'https://techconf2025.com/tickets'
      }]);

      // Check performer is preserved
      expect(event.performer).toEqual({
        '@type': 'Person',
        name: 'Jane Doe',
        jobTitle: 'Tech Leader'
      });
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
      expect(events[0]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Simple Meetup',
        startDate: expect.stringMatching(/2025-03-01T\d{2}:\d{2}:\d{2}/),
        endDate: expect.stringMatching(/2025-03-01T\d{2}:\d{2}:\d{2}/), // defaults to start
        eventType: 'meetup',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode'
      });
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
          <div class="event-date">Mar. 15 / 6:00 PM - 8:00 PM</div>
          <div class="event-location">WeWork Austin, 901 S MoPac Expy, Austin, TX</div>
          <p class="event-description">Monthly startup pitch event for entrepreneurs</p>
        </div>
      `;

      const events = extractEvents(html);
      
      expect(events).toHaveLength(1);
      
      const event = events[0];
      expect(event).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Startup Pitch Night',
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        description: 'Monthly startup pitch event for entrepreneurs',
        eventType: 'presentation', // "pitch" keyword matches presentation first
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
        isAccessibleForFree: true
      });

      // Check structured location parsing
      expect(event.location).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: 'WeWork Austin',
        address: '901 S MoPac Expy, Austin, TX'
      });
    });

    it('infers Capital Factory location for relevant events', () => {
      const html = `
        <html>
          <head><title>Capital Factory Events</title></head>
          <body>
            <div class="event">
              <h2>Developer Meetup</h2>
              <div class="event-date">Apr. 1 / 7:00 PM</div>
            </div>
          </body>
        </html>
      `;

      const events = extractEvents(html);
      
      expect(events).toHaveLength(1);
      expect(events[0].location).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: 'Capital Factory',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '701 Brazos St',
          addressLocality: 'Austin',
          addressRegion: 'TX',
          postalCode: '78701',
          addressCountry: 'US'
        }
      });
    });

    it('classifies event types correctly', () => {
      const testCases = [
        { title: 'AI Hackathon 2025', expectedType: 'competition' },
        { title: 'React Workshop', expectedType: 'workshop' },
        { title: 'Tech Conference Summit', expectedType: 'conference' },
        { title: 'Startup Pitch Presentation', expectedType: 'presentation' },
        { title: 'Coworking Space Open', expectedType: 'coworking' },
        { title: 'Networking Mixer', expectedType: 'networking' },
        { title: 'Entrepreneur Meetup', expectedType: 'startup' },
        { title: 'Developer Meet Up', expectedType: 'meetup' },
        { title: 'Random Event', expectedType: 'default' }
      ];

      testCases.forEach(({ title, expectedType }) => {
        const html = `
          <div class="event">
            <h2>${title}</h2>
            <div class="event-date">May. 1 / 6:00 PM</div>
          </div>
        `;

        const events = extractEvents(html);
        expect(events[0].eventType).toBe(expectedType);
      });
    });
  });

  describe('Date Parsing', () => {
    it('parses various date formats correctly', () => {
      const dateTestCases = [
        'Mar. 15 / 6:00 PM - 8:00 PM',
        'Apr 20, 2025 at 2:00 PM',
        '2025-05-01T18:00:00',
        'June 10 / 10:00 AM'
      ];

      dateTestCases.forEach(dateStr => {
        const html = `
          <div class="event">
            <h2>Test Event</h2>
            <div class="event-date">${dateStr}</div>
          </div>
        `;

        const events = extractEvents(html);
        expect(events).toHaveLength(1);
        expect(events[0].startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    it('handles invalid dates gracefully', () => {
      const html = `
        <div class="event">
          <h2>Event with Bad Date</h2>
          <div class="event-date">Not a valid date</div>
        </div>
      `;

      const events = extractEvents(html);
      expect(events).toHaveLength(0); // Should not create event with invalid date
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
              <div class="event-date">Jul. 1 / 6:00 PM</div>
            </div>
            <div class="event">
              <h2>HTML Event 2</h2>
              <div class="event-date">Jul. 2 / 7:00 PM</div>
            </div>
          </body>
        </html>
      `;

      const events = extractEvents(html);
      expect(events).toHaveLength(3);
      
      expect(events[0].name).toBe('JSON-LD Event');
      expect(events[1].name).toBe('HTML Event 1');
      expect(events[2].name).toBe('HTML Event 2');
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
          <div class="event-date">Aug. 1 / 6:00 PM</div>
        </div>
      `;

      const events = extractEvents(html);
      expect(events).toHaveLength(1); // Should still parse HTML event
      expect(events[0].name).toBe('Valid HTML Event');
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