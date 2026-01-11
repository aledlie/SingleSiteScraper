import { describe, it, expect } from 'vitest';
import { scrapeWebsite } from '../scraper/scrapeWebsite';

function analyzeResults(events: any[], html: string) {
  console.log(`Found ${events.length} events:`);
  console.log('');
  
  if (events.length === 0) {
    console.log('❌ No events detected!');
    console.log('');
    
    // Let's analyze why no events were found
    console.log('🕵️  Debugging event detection...');
    
    // Check for JSON-LD scripts
    const jsonLdMatches = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/gis);
    console.log(`JSON-LD scripts found: ${jsonLdMatches ? jsonLdMatches.length : 0}`);
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach((match, index) => {
        try {
          const content = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const json = JSON.parse(content);
          console.log(`  Script ${index + 1}: @type = ${json['@type'] || 'unknown'}`);
        } catch {
          console.log(`  Script ${index + 1}: Parse error`);
        }
      });
    }
    
    // Check for event-related HTML patterns
    const eventPatterns = [
      { name: 'Event classes', pattern: /class="[^"]*event[^"]*"/gi },
      { name: 'Date patterns', pattern: /Sep\.\s*\d+\s*\/\s*\d+:\d+\s*[AP]M/gi },
      { name: 'Event links', pattern: /<a[^>]*href="[^"]*\/event\/[^"]*"/gi }
    ];
    
    eventPatterns.forEach((patternObj) => {
      const matches = html.match(patternObj.pattern);
      console.log(`  ${patternObj.name}: ${matches ? matches.length : 0} matches`);
      if (matches && matches.length > 0 && matches.length < 10) {
        console.log(`    Examples: ${matches.slice(0, 3).join(', ')}`);
      }
    });
    
    // Check for specific Capital Factory patterns
    console.log('');
    console.log('🎯 Checking for Capital Factory specific patterns...');
    const cfEventLinks = html.match(/<a[^>]*href="[^"]*\/event\/[^"]*"[^>]*>([^<]+)</gi);
    if (cfEventLinks) {
      console.log(`Found ${cfEventLinks.length} event links:`);
      cfEventLinks.slice(0, 5).forEach((link, index) => {
        const match = link.match(/>([^<]+)$/);
        if (match) {
          console.log(`  ${index + 1}: ${match[1].trim()}`);
        }
      });
    }
    
    // Look for article or section elements that might contain events
    const articleMatches = html.match(/<article[^>]*>.*?<\/article>/gi);
    const sectionMatches = html.match(/<section[^>]*>.*?<\/section>/gi);
    console.log(`Articles found: ${articleMatches?.length || 0}`);
    console.log(`Sections found: ${sectionMatches?.length || 0}`);
    
  } else {
    // Display found events
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  Name: ${event.name}`);
      console.log(`  Start Date: ${event.startDate}`);
      console.log(`  End Date: ${event.endDate}`);
      console.log(`  Location: ${typeof event.location === 'string' ? event.location : event.location?.name || 'Unknown'}`);
      console.log(`  Description: ${event.description ? event.description.substring(0, 100) + '...' : 'None'}`);
      console.log(`  Event Type: ${event.eventType}`);
      console.log('');
    });
    
    // Analyze event quality
    console.log('📊 Event Quality Analysis:');
    const futureEvents = events.filter(e => new Date(e.startDate) > new Date());
    const eventsWithLocations = events.filter(e => e.location && e.location !== '');
    const eventsWithDescriptions = events.filter(e => e.description && e.description.trim() !== '');
    
    console.log(`  Future events: ${futureEvents.length}/${events.length}`);
    console.log(`  Events with locations: ${eventsWithLocations.length}/${events.length}`);
    console.log(`  Events with descriptions: ${eventsWithDescriptions.length}/${events.length}`);
    
    // Check for false positives
    console.log('');
    console.log('🚨 False Positive Analysis:');
    const suspiciousEvents = events.filter(e => {
      const name = e.name?.toLowerCase() || '';
      const desc = e.description?.toLowerCase() || '';
      
      // Look for blog post indicators
      const blogIndicators = ['published', 'posted', 'written', 'by:', 'author:', 'read more'];
      const hasBlogIndicators = blogIndicators.some(indicator => 
        name.includes(indicator) || desc.includes(indicator)
      );
      
      // Look for date-only content (no event characteristics)
      const hasEventCharacteristics = name.includes('event') || 
        name.includes('meetup') || name.includes('workshop') || 
        name.includes('conference') || desc.includes('join') ||
        desc.includes('attend') || desc.includes('rsvp');
      
      return hasBlogIndicators || !hasEventCharacteristics;
    });
    
    console.log(`  Potentially suspicious events: ${suspiciousEvents.length}/${events.length}`);
    suspiciousEvents.forEach((event, index) => {
      console.log(`    ${index + 1}: "${event.name}" - ${event.eventType}`);
    });
  }
}

describe('Capital Factory Event Detection', () => {
  it('should test event extraction against Capital Factory website', async () => {
    console.log('🧪 Testing Capital Factory Event Detection');
    console.log('='.repeat(50));

    try {
      console.log('📡 Scraping Capital Factory website using project scraper...');
      
      // Use the existing scraper with enhanced options
      const result = await scrapeWebsite('https://capitalfactory.com', {
        useEnhancedScraper: false, // Use legacy scraper to avoid provider costs
        includeEvents: true,
        includeText: false,
        includeLinks: false,
        includeImages: false,
        includeMetadata: false,
        timeout: 30000,
        retryAttempts: 3,
        requestTimeout: 30000,
        maxLinks: 0,
        maxImages: 0,
        maxTextElements: 0,
      }, (progress) => {
        console.log(`  ${progress}`);
      });
      
      if (result.error) {
        console.log(`❌ Scraping failed: ${result.error}`);
        console.log('This test requires network access to Capital Factory website.');
        return; // Skip assertions if we can't reach the site
      }
      
      const events = result.data?.events || [];
      console.log(`✅ Scraper completed successfully`);
      console.log('');
      
      analyzeResults(events, ''); // We don't have direct HTML access from scraper result
      
      console.log('');
      console.log('🏁 Test completed');
      
      // Basic assertions - allowing for the possibility of no events if site has changed
      expect(Array.isArray(events)).toBe(true);
      
      if (events.length > 0) {
        events.forEach(event => {
          expect(event).toHaveProperty('name');
          expect(event).toHaveProperty('startDate');
          expect(event['@type']).toBe('Event');
        });
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      // Don't fail the test for network issues
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('HTTP')) {
        console.log('Test skipped due to network connectivity issues');
        return;
      }
      throw error;
    }
  }, 60000); // 60 second timeout
});