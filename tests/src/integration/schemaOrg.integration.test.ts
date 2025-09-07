import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeWebsite } from '../scraper/scrapeWebsite';
import { ScrapeOptions } from '../types';

describe('Schema.org Integration Tests', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  describe('Complete Schema.org Workflow', () => {
    it('processes a real-world website with full schema.org extraction', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>Capital Factory Events - Austin's Startup Hub</title>
            <meta name="description" content="Join Austin's leading startup community for networking, workshops, and events.">
            <meta name="keywords" content="startup, austin, events, networking, tech">
            <meta name="author" content="Capital Factory Team">
            <meta property="og:site_name" content="Capital Factory">
            <meta property="og:image" content="https://capitalfactory.com/banner.jpg">
            <meta property="article:published_time" content="2025-01-01T00:00:00Z">
            <meta http-equiv="content-language" content="en-US">
            
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Event",
                "name": "Austin Startup Week Kickoff",
                "startDate": "2025-03-01T18:00:00-06:00",
                "endDate": "2025-03-01T21:00:00-06:00",
                "location": {
                  "@type": "Place",
                  "name": "Capital Factory",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "701 Brazos St",
                    "addressLocality": "Austin",
                    "addressRegion": "TX",
                    "postalCode": "78701",
                    "addressCountry": "US"
                  }
                },
                "description": "Kick off Austin Startup Week with networking and pitches",
                "organizer": {
                  "@type": "Organization",
                  "name": "Capital Factory",
                  "url": "https://capitalfactory.com"
                },
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "InStock"
                },
                "eventStatus": "EventScheduled",
                "eventAttendanceMode": "OfflineEventAttendanceMode",
                "isAccessibleForFree": true
              }
            </script>
            
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Capital Factory",
                "url": "https://capitalfactory.com",
                "logo": "https://capitalfactory.com/logo.png",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "701 Brazos St",
                  "addressLocality": "Austin",
                  "addressRegion": "TX",
                  "postalCode": "78701",
                  "addressCountry": "US"
                }
              }
            </script>
          </head>
          <body>
            <header>
              <h1>Capital Factory Events</h1>
              <nav>
                <a href="/events" title="All Events">Events</a>
                <a href="/startups" title="Startups">Startups</a>
                <a href="/accelerator" title="Accelerator Program">Accelerator</a>
              </nav>
            </header>
            
            <main>
              <section class="hero">
                <h2>Upcoming Events</h2>
                <p>Join Austin's most vibrant startup community for networking, learning, and growth opportunities.</p>
                <img src="/hero-banner.jpg" alt="Capital Factory interior" title="Our Space" width="1200" height="600">
              </section>
              
              <section class="events">
                <article class="event">
                  <header>
                    <h3 class="event-title">Developer Workshop: React Best Practices</h3>
                  </header>
                  <div class="event-details">
                    <time class="event-date" datetime="2025-03-15T14:00:00">Mar. 15 / 2:00 PM - 5:00 PM</time>
                    <address class="event-location">Capital Factory, 701 Brazos St, Austin, TX</address>
                    <p class="event-description">Learn advanced React patterns from industry experts. Perfect for intermediate developers looking to level up their skills.</p>
                  </div>
                </article>
                
                <article class="event">
                  <header>
                    <h3>Startup Pitch Night</h3>
                  </header>
                  <div class="event-details">
                    <time datetime="2025-03-22T18:30:00">Mar. 22 / 6:30 PM - 8:30 PM</time>
                    <p>Monthly startup pitch event where entrepreneurs present their ideas to investors and the community.</p>
                  </div>
                </article>
              </section>
              
              <section class="gallery">
                <img src="/event-photo1.jpg" alt="Developers working at workshop" title="Workshop in Action" width="800" height="400">
                <img src="/networking.png" alt="People networking at event" width="600" height="400">
                <img src="/logo.svg" alt="Capital Factory logo" title="Capital Factory">
              </section>
              
              <section class="about">
                <h2>About Capital Factory</h2>
                <p>Capital Factory is the center of gravity for entrepreneurs in Texas. We provide workspace, funding, mentorship, and community for startups.</p>
                <p>Located in the heart of downtown Austin, we host over 100 events per year, connecting thousands of entrepreneurs, developers, and investors.</p>
              </section>
            </main>
            
            <footer>
              <form role="search">
                <label for="search">Search Events</label>
                <input type="text" id="search" name="q" placeholder="Find events...">
                <button type="submit">Search</button>
              </form>
            </footer>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(mockHtml),
      });

      const options: ScrapeOptions = {
        includeLinks: true,
        includeImages: true,
        includeText: true,
        includeMetadata: true,
        includeEvents: true,
        maxEvents: 10,
        maxLinks: 10,
        maxImages: 10,
        maxTextElements: 10,
        timeout: 5000,
        retryAttempts: 1,
      };

      const result = await scrapeWebsite('https://capitalfactory.com/events', options, () => {});

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      const data = result.data!;

      // Test Dataset-level schema.org compliance
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Dataset');

      // Test WebSite schema.org object
      expect(data.webSite).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Capital Factory Events - Austin\'s Startup Hub',
        url: 'https://capitalfactory.com',
        description: 'Join Austin\'s leading startup community for networking, workshops, and events.',
        inLanguage: 'en-US',
        keywords: ['startup', 'austin', 'events', 'networking', 'tech']
      });

      // Test publisher organization detection
      expect(data.webSite?.publisher).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Capital Factory',
        url: 'https://capitalfactory.com'
      });

      // Test search action inclusion
      expect(data.webSite?.potentialAction).toEqual([{
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://capitalfactory.com/search?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }]);

      // Test WebPage schema.org object
      expect(data.webPage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Capital Factory Events - Austin\'s Startup Hub',
        url: 'https://capitalfactory.com/events',
        description: 'Join Austin\'s leading startup community for networking, workshops, and events.',
        datePublished: '2025-01-01T00:00:00Z',
        image: 'https://capitalfactory.com/banner.jpg',
        inLanguage: 'en-US'
      });

      // Test author detection
      expect(data.webPage?.author).toMatchObject({
        '@type': 'Person',
        name: 'Capital Factory Team'
      });

      // Test Events extraction and schema.org compliance
      expect(data.events).toHaveLength(3); // 1 JSON-LD + 2 HTML events

      // Test JSON-LD event
      const jsonLdEvent = data.events.find(e => e.name === 'Austin Startup Week Kickoff');
      expect(jsonLdEvent).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Austin Startup Week Kickoff',
        startDate: expect.stringMatching(/2025-03-01T\d{2}:\d{2}:\d{2}/),
        endDate: expect.stringMatching(/2025-03-01T\d{2}:\d{2}:\d{2}/),
        description: 'Kick off Austin Startup Week with networking and pitches',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
        isAccessibleForFree: true
      });

      // Test JSON-LD location parsing
      expect(jsonLdEvent?.location).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: 'Capital Factory',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '701 Brazos St',
          addressLocality: 'Austin',
          addressRegion: 'TX'
        }
      });

      // Test JSON-LD organizer parsing
      expect(jsonLdEvent?.organizer).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Capital Factory',
        url: 'https://capitalfactory.com'
      });

      // Test HTML-parsed events
      const reactWorkshop = data.events.find(e => e.name.includes('React'));
      expect(reactWorkshop).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Developer Workshop: React Best Practices',
        eventType: 'workshop',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
        isAccessibleForFree: true
      });

      // Test structured location parsing for HTML events
      expect(reactWorkshop?.location).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: 'Capital Factory',
        address: '701 Brazos St, Austin, TX'
      });

      const pitchNight = data.events.find(e => e.name.includes('Pitch'));
      expect(pitchNight).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Startup Pitch Night',
        eventType: 'startup',
        location: expect.objectContaining({
          '@context': 'https://schema.org',
          '@type': 'Place',
          name: 'Capital Factory'
        })
      });

      // Test ImageObject schema.org compliance
      expect(data.images).toHaveLength(4);
      
      const heroBanner = data.images.find(img => img.alternateName === 'Capital Factory interior');
      expect(heroBanner).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/hero-banner.jpg',
        contentUrl: '/hero-banner.jpg',
        name: 'Our Space',
        alternateName: 'Capital Factory interior',
        width: 1200,
        height: 600,
        encodingFormat: 'image/jpeg'
      });

      const logo = data.images.find(img => img.url === '/logo.svg');
      expect(logo).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/logo.svg',
        name: 'Capital Factory',
        encodingFormat: 'image/svg+xml'
      });

      // Test metadata extraction
      expect(data.metadata).toMatchObject({
        description: 'Join Austin\'s leading startup community for networking, workshops, and events.',
        keywords: 'startup, austin, events, networking, tech',
        author: 'Capital Factory Team',
        'og:site_name': 'Capital Factory',
        'og:image': 'https://capitalfactory.com/banner.jpg'
      });

      // Test links extraction
      expect(data.links).toEqual(
        expect.arrayContaining([
          { text: 'Events', url: '/events' },
          { text: 'Startups', url: '/startups' },
          { text: 'Accelerator', url: '/accelerator' }
        ])
      );

      // Test text extraction
      expect(data.text).toEqual(
        expect.arrayContaining([
          'Join Austin\'s most vibrant startup community for networking, learning, and growth opportunities.',
          'Capital Factory is the center of gravity for entrepreneurs in Texas. We provide workspace, funding, mentorship, and community for startups.'
        ])
      );
    });

    it('handles minimal website with basic schema.org structure', async () => {
      const minimalHtml = `
        <html>
          <head>
            <title>Simple Blog</title>
          </head>
          <body>
            <h1>My Blog</h1>
            <p>Welcome to my simple blog.</p>
            <img src="photo.jpg" alt="A photo">
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(minimalHtml),
      });

      const options: ScrapeOptions = {
        includeLinks: true,
        includeImages: true,
        includeText: true,
        includeMetadata: true,
        includeEvents: true,
        maxEvents: 5,
        maxLinks: 5,
        maxImages: 5,
        maxTextElements: 5,
        timeout: 5000,
        retryAttempts: 1,
      };

      const result = await scrapeWebsite('https://simpleblog.com', options, () => {});

      expect(result.data).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        title: 'Simple Blog'
      });

      // Even minimal sites should have WebSite and WebPage objects
      expect(result.data!.webSite).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Simple Blog',
        url: 'https://simpleblog.com'
      });

      expect(result.data!.webPage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Simple Blog',
        url: 'https://simpleblog.com'
      });

      // Should still create ImageObject
      expect(result.data!.images[0]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: 'photo.jpg',
        alternateName: 'A photo'
      });
    });

    it('validates schema.org JSON-LD output structure', async () => {
      const html = `
        <html>
          <head><title>Test Site</title></head>
          <body>
            <script type="application/ld+json">
              {
                "@type": "Event",
                "name": "Test Event",
                "startDate": "2025-01-01T12:00:00"
              }
            </script>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(html),
      });

      const options: ScrapeOptions = {
        includeLinks: false,
        includeImages: false,
        includeText: false,
        includeMetadata: false,
        includeEvents: true,
        maxEvents: 5,
        maxLinks: 0,
        maxImages: 0,
        maxTextElements: 0,
        timeout: 5000,
        retryAttempts: 1,
      };

      const result = await scrapeWebsite('https://test.com', options, () => {});
      const data = result.data!;

      // Test that the complete output can be serialized as valid JSON-LD
      const jsonLd = JSON.stringify({
        '@context': data['@context'],
        '@type': data['@type'],
        'mainEntity': {
          '@type': 'WebPage',
          'url': data.webPage?.url,
          'name': data.webPage?.name,
          'isPartOf': data.webSite,
          'about': data.events.map(event => ({
            '@type': event['@type'],
            'name': event.name,
            'startDate': event.startDate,
            'endDate': event.endDate
          }))
        }
      });

      // Should be valid JSON
      expect(() => JSON.parse(jsonLd)).not.toThrow();
      
      // Should contain schema.org context
      const parsed = JSON.parse(jsonLd);
      expect(parsed['@context']).toBe('https://schema.org');
    });
  });

  describe('Error Resilience', () => {
    it('maintains schema.org structure even with parsing errors', async () => {
      const htmlWithErrors = `
        <html>
          <head><title>Error Test</title></head>
          <body>
            <script type="application/ld+json">
              { "invalid": "json", "missing": "quotes
            </script>
            <div class="event">
              <h2>Valid Event</h2>
              <div class="event-date">invalid date format</div>
            </div>
            <img src="" alt=""> <!-- Empty image -->
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(htmlWithErrors),
      });

      const options: ScrapeOptions = {
        includeLinks: true,
        includeImages: true,
        includeText: true,
        includeMetadata: true,
        includeEvents: true,
        maxEvents: 5,
        maxLinks: 5,
        maxImages: 5,
        maxTextElements: 5,
        timeout: 5000,
        retryAttempts: 1,
      };

      const result = await scrapeWebsite('https://errortest.com', options, () => {});

      // Should still return valid schema.org structure
      expect(result.data).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Dataset'
      });

      expect(result.data!.webSite).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite'
      });

      expect(result.data!.webPage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebPage'
      });

      // Should gracefully handle invalid events (no events with invalid dates)
      expect(result.data!.events).toEqual([]);

      // Should handle empty images
      expect(result.data!.images[0]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject'
      });
    });
  });
});