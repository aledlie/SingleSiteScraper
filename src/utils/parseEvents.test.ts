import { describe, it, expect, vi } from 'vitest';
import { scrapeWebsite } from '../scraper/scrapeWebsite';
import { ScrapeOptions } from '../types/index';

describe('scrapeWebsite', () => {
  it('scrapes website data and events successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'text/html']]),
      text: () => Promise.resolve(`
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <script type="application/ld+json">
              {
                "@type": "Event",
                "name": "Sample Event",
                "startDate": "2025-07-01T09:00:00",
                "endDate": "2025-07-01T10:00:00",
                "location": { "name": "Community Center" },
                "description": "A sample event description"
              }
            </script>
          </head>
          <body>
            <a href="/link">Link</a>
            <img src="/image.jpg" alt="Image">
            <p>Test paragraph</p>
          </body>
        </html>
      `),
    });

    const options: ScrapeOptions = {
      includeLinks: true,
      includeImages: true,
      includeText: true,
      includeMetadata: true,
      includeEvents: true,
      maxEvents: 1,
      maxLinks: 2,
      maxImages: 2,
      maxTextElements: 4,
      timeout: 2000,
      retryAttempts: 2,
    };
    const setProgress = vi.fn();
    const result = await scrapeWebsite('https://example.com', options, setProgress);

    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({
      title: 'Test Page',
      description: 'Test description',
      links: [{ text: 'Link', url: '/link' }],
      images: [{ alt: 'Image', src: '/image.jpg' }],
      text: ['Test paragraph'],
      metadata: { title: 'Test Page' },
      events: [
        {
          summary: 'Sample Event',
          start: { dateTime: '2025-07-01T09:00:00-05:00', timeZone: 'America/Chicago' },
          end: { dateTime: '2025-07-01T10:00:00-05:00', timeZone: 'America/Chicago' },
          location: 'Community Center',
          description: 'A sample event description',
          eventType: 'default',
        },
      ],
      status: {
        success: true,
        contentLength: expect.any(Number),
        responseTime: expect.any(Number),
        proxyUsed: 'AllOrigins',
        contentType: 'text/html',
      },
    });
    expect(setProgress).toHaveBeenCalled();
  });
});
