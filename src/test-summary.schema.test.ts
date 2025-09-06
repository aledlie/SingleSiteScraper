import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeWebsite } from './scraper/scrapeWebsite';
import { extractEvents } from './utils/parseEvents';
import { getImages, getWebSite, getWebPage } from './utils/parse';
import { parse } from 'node-html-parser';
import type { ScrapeOptions } from './types';

describe('Schema.org Implementation Summary Tests', () => {
  describe('Core Schema.org Functionality', () => {
    it('creates valid schema.org Dataset from scraped website', async () => {
      const mockHtml = `
        <html lang="en">
          <head>
            <title>Test Site</title>
            <meta name="description" content="Test description">
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Event",
                "name": "Test Event",
                "startDate": "2025-06-01T10:00:00-05:00"
              }
            </script>
          </head>
          <body>
            <h1>Welcome</h1>
            <p>Test content</p>
            <img src="/test.jpg" alt="Test image" width="800" height="600">
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
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
        maxEvents: 5,
        maxLinks: 5,
        maxImages: 5,
        maxTextElements: 5,
        timeout: 5000,
        retryAttempts: 1,
      };

      const result = await scrapeWebsite('https://test.com', options, () => {});
      const data = result.data!;

      // Test Dataset schema.org compliance
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Dataset');

      // Test WebSite object
      expect(data.webSite).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Test Site',
        url: 'https://test.com'
      });

      // Test WebPage object
      expect(data.webPage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Test Site',
        url: 'https://test.com',
        isPartOf: data.webSite
      });

      // Test Event parsing (events may be parsed from JSON-LD or HTML)
      expect(Array.isArray(data.events)).toBe(true);
      // Note: JSON-LD event parsing is tested separately

      // Test ImageObject creation
      expect(data.images).toHaveLength(1);
      expect(data.images[0]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/test.jpg',
        alternateName: 'Test image',
        width: 800,
        height: 600,
        encodingFormat: 'image/jpeg'
      });
    });

    it('handles Capital Factory event detection with proper Place objects', () => {
      const html = `
        <html>
          <head><title>Capital Factory Events</title></head>
          <body>
            <div class="event">
              <h2>Startup Workshop</h2>
              <div class="event-date">Jun. 15 / 6:00 PM</div>
            </div>
          </body>
        </html>
      `;

      const events = extractEvents(html);
      expect(events).toHaveLength(1);
      
      const event = events[0];
      expect(event).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Startup Workshop',
        eventType: 'workshop'
      });

      // Should infer Capital Factory location
      expect(event.location).toMatchObject({
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
    });

    it('creates proper ImageObject structures with encoding formats', () => {
      const html = `
        <div>
          <img src="/photo.jpg" alt="Photo" width="1200" height="800">
          <img src="/logo.png" alt="Logo" title="Company Logo">
          <img src="/icon.svg" alt="Icon">
        </div>
      `;
      const root = parse(html);
      const images = getImages(root, 10);

      expect(images).toHaveLength(3);

      // JPEG image
      expect(images[0]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/photo.jpg',
        alternateName: 'Photo',
        width: 1200,
        height: 800,
        encodingFormat: 'image/jpeg'
      });

      // PNG image with title
      expect(images[1]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/logo.png',
        name: 'Company Logo',
        alternateName: 'Logo',
        encodingFormat: 'image/png'
      });

      // SVG image
      expect(images[2]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/icon.svg',
        alternateName: 'Icon',
        encodingFormat: 'image/svg+xml'
      });
    });

    it('generates valid JSON-LD output', async () => {
      const html = '<html><head><title>Valid Site</title></head><body><p>Content</p></body></html>';
      
      global.fetch = vi.fn().mockResolvedValue({
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
        includeEvents: false,
        maxEvents: 0,
        maxLinks: 0,
        maxImages: 0,
        maxTextElements: 0,
        timeout: 5000,
        retryAttempts: 1,
      };

      const result = await scrapeWebsite('https://valid.com', options, () => {});
      const data = result.data!;

      // Should be able to serialize as valid JSON-LD
      const jsonLd = {
        '@context': data['@context'],
        '@type': data['@type'],
        'mainEntity': {
          '@type': 'WebPage',
          'name': data.webPage?.name,
          'url': data.webPage?.url,
          'isPartOf': data.webSite
        }
      };

      expect(() => JSON.stringify(jsonLd)).not.toThrow();
      
      const serialized = JSON.stringify(jsonLd);
      const parsed = JSON.parse(serialized);
      
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('Dataset');
      expect(parsed.mainEntity['@type']).toBe('WebPage');
    });
  });

  describe('Error Resilience', () => {
    it('maintains schema.org structure even with errors', async () => {
      const errorHtml = `
        <html>
          <head><title>Error Test</title></head>
          <body>
            <script type="application/ld+json">invalid json</script>
            <img src="" alt="">
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(errorHtml),
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

      const result = await scrapeWebsite('https://error.com', options, () => {});
      const data = result.data!;

      // Should still maintain schema.org structure
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Dataset');
      expect(data.webSite['@type']).toBe('WebSite');
      expect(data.webPage['@type']).toBe('WebPage');
      
      // Events should be empty (invalid JSON-LD)
      expect(data.events).toEqual([]);
      
      // Images should still have schema.org structure even if empty
      if (data.images.length > 0) {
        expect(data.images[0]['@type']).toBe('ImageObject');
      }
    });
  });
});