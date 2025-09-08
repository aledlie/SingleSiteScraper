import { describe, it, expect, vi } from 'vitest';
import { extractEvents } from '../../../src/utils/parseEvents';

describe('aledlie.com Schema Classification Test', () => {
  it('should not misidentify blog posts as events when proper schemas are present', () => {
    // Mock HTML content similar to aledlie.com with proper schemas and blog posts
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Alyshia's Blog</title>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Alyshia's Blog",
              "url": "https://aledlie.com"
            }
          </script>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Alyshia Ledlie",
              "jobTitle": "Software Developer"
            }
          </script>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "Tech Blog",
              "description": "Software development blog"
            }
          </script>
        </head>
        <body>
          <article class="post">
            <h2><a href="/post1">What 3 Things</a></h2>
            <time class="date" datetime="2025-09-03T00:00:00">Sept 3, 2025</time>
            <p>This is a blog post about development practices...</p>
          </article>
          
          <article class="post">
            <h2><a href="/post2">Making your Wix website better</a></h2>
            <time class="date" datetime="2025-09-02T00:00:00">Sept 2, 2025</time>
            <p>Tips for improving Wix websites...</p>
          </article>
          
          <section>
            <h3>Recent Posts</h3>
            <time>Aug 25, 2025</time>
            <p>Another blog post about Jekyll...</p>
          </section>
        </body>
      </html>
    `;

    const events = extractEvents(mockHtml);
    
    // Should find NO events because:
    // 1. Site has proper schemas (WebSite, Person, Blog)
    // 2. Content is clearly blog posts, not events
    // 3. No explicit event classes (.event, .event-item) 
    // 4. No event-specific keywords in titles
    expect(events).toHaveLength(0);
  });

  it('should extract events when they have explicit event indicators even with proper schemas', () => {
    // Test that legitimate events are still extracted
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Company Website</title>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Company Site",
              "url": "https://example.com"
            }
          </script>
        </head>
        <body>
          <article class="post">
            <h2>Company Blog Post</h2>
            <time datetime="2025-09-03T00:00:00">Sept 3, 2025</time>
            <p>This is a regular blog post...</p>
          </article>
          
          <!-- This should be extracted as it has explicit event class -->
          <div class="event">
            <h3>Developer Workshop: React Best Practices</h3>
            <time class="event-date">Mar. 15 / 6:00 PM - 8:00 PM</time>
            <address class="event-location">Tech Center, Austin, TX</address>
            <p class="description">Learn advanced React patterns...</p>
          </div>
        </body>
      </html>
    `;

    const events = extractEvents(mockHtml);
    
    // Should find 1 event because:
    // 1. Element has explicit .event class
    // 2. Contains event-specific keywords ("Workshop")
    // 3. Has location information
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('Developer Workshop: React Best Practices');
    expect(events[0].eventType).toBe('workshop');
  });

  it('should be less strict for sites without proper schemas', () => {
    // Test that heuristic parsing is more permissive for sites without proper schemas
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Simple Website</title>
        </head>
        <body>
          <!-- No proper schemas, so should be more permissive -->
          <article>
            <h2>Community Meetup Tonight</h2>
            <time>Mar. 15 / 6:00 PM</time>
            <address>Community Center, Main St</address>
            <p>Join us for our monthly community gathering...</p>
          </article>
          
          <section>
            <h3>Book Club Meeting</h3>
            <div class="date">April 1, 2025 at 7:00 PM</div>
            <p>Downtown Library</p>
          </section>
        </body>
      </html>
    `;

    const events = extractEvents(mockHtml);
    
    // Should find events because:
    // 1. No proper schemas present (more permissive parsing)
    // 2. Content contains event keywords ("Meetup", "Meeting")
    // 3. Has time and location information
    expect(events.length).toBeGreaterThan(0);
    
    const meetupEvent = events.find(e => e.name.includes('Meetup'));
    expect(meetupEvent).toBeDefined();
    expect(meetupEvent?.eventType).toBe('meetup');
  });
});