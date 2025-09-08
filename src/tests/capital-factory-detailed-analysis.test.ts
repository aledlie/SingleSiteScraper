import { describe, it, expect } from 'vitest';
import { extractEvents } from '../utils/parseEvents';

describe('Capital Factory Detailed Event Analysis', () => {
  it('should analyze HTML structure and event detection patterns', async () => {
    console.log('🔍 Capital Factory Detailed Event Analysis');
    console.log('='.repeat(60));

    try {
      console.log('📡 Fetching Capital Factory website for detailed analysis...');
      
      // Fetch the website directly for HTML analysis
      const response = await fetch('https://capitalfactory.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`❌ Failed to fetch: HTTP ${response.status}`);
        return;
      }
      
      const html = await response.text();
      console.log(`✅ Successfully fetched ${html.length} characters of HTML`);
      console.log('');
      
      // 1. Analyze Schema.org structured data
      console.log('📋 Schema.org Structured Data Analysis:');
      console.log('-'.repeat(40));
      
      const jsonLdMatches = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/gis);
      console.log(`JSON-LD scripts found: ${jsonLdMatches ? jsonLdMatches.length : 0}`);
      
      if (jsonLdMatches) {
        jsonLdMatches.forEach((match, index) => {
          try {
            const content = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            const json = JSON.parse(content);
            console.log(`\nScript ${index + 1}:`);
            console.log(`  @type: ${json['@type'] || 'unknown'}`);
            if (json.name) console.log(`  name: ${json.name}`);
            if (json.description) console.log(`  description: ${json.description.substring(0, 80)}...`);
            if (json.url) console.log(`  url: ${json.url}`);
          } catch (e) {
            console.log(`\nScript ${index + 1}: Parse error - ${e.message}`);
          }
        });
      } else {
        console.log('  No JSON-LD structured data found');
      }
      
      // 2. Analyze event-related patterns
      console.log('\n🎯 Event Pattern Analysis:');
      console.log('-'.repeat(40));
      
      const eventPatterns = [
        { name: 'Event classes', pattern: /class="[^"]*event[^"]*"/gi },
        { name: 'Calendar classes', pattern: /class="[^"]*calendar[^"]*"/gi },
        { name: 'Date patterns (CF format)', pattern: /[A-Z][a-z]{2}\.\s*\d+\s*\/\s*\d+:\d+\s*[AP]M/gi },
        { name: 'Event links', pattern: /<a[^>]*href="[^"]*\/event\/[^"]*"/gi },
        { name: 'Meetup mentions', pattern: /meetup/gi },
        { name: 'Workshop mentions', pattern: /workshop/gi },
        { name: 'Conference mentions', pattern: /conference/gi }
      ];
      
      eventPatterns.forEach((patternObj) => {
        const matches = html.match(patternObj.pattern);
        console.log(`${patternObj.name}: ${matches ? matches.length : 0} matches`);
        if (matches && matches.length > 0 && matches.length <= 5) {
          matches.forEach((match, i) => {
            console.log(`  ${i + 1}: ${match.substring(0, 100)}...`);
          });
        } else if (matches && matches.length > 5) {
          console.log(`  First 3: ${matches.slice(0, 3).join(', ')}`);
        }
      });
      
      // 3. Extract specific event links and analyze them
      console.log('\n📅 Event Link Analysis:');
      console.log('-'.repeat(40));
      
      const eventLinkRegex = /<a[^>]*href="([^"]*\/event\/[^"]*)"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)</gi;
      let match;
      let eventLinksFound = 0;
      
      while ((match = eventLinkRegex.exec(html)) !== null) {
        eventLinksFound++;
        console.log(`Event ${eventLinksFound}:`);
        console.log(`  URL: ${match[1]}`);
        console.log(`  Text: ${match[2].replace(/<[^>]*>/g, '').trim()}`);
        
        if (eventLinksFound >= 10) break; // Limit output
      }
      
      if (eventLinksFound === 0) {
        console.log('  No event links found');
      }
      
      // 4. Test the event extraction logic
      console.log('\n🔬 Event Extraction Test:');
      console.log('-'.repeat(40));
      
      const events = extractEvents(html);
      console.log(`Events detected by extractEvents(): ${events.length}`);
      
      if (events.length > 0) {
        console.log('\nFirst 5 detected events:');
        events.slice(0, 5).forEach((event, index) => {
          console.log(`\n${index + 1}. ${event.name}`);
          console.log(`   Date: ${event.startDate}`);
          console.log(`   Location: ${typeof event.location === 'object' ? event.location.name : event.location}`);
          console.log(`   Type: ${event.eventType}`);
          if (event.description) {
            console.log(`   Description: ${event.description.substring(0, 100)}...`);
          }
        });
      }
      
      // 5. Quality Assessment
      console.log('\n📊 Quality Assessment:');
      console.log('-'.repeat(40));
      
      const now = new Date();
      const futureEvents = events.filter(e => new Date(e.startDate) > now);
      const pastEvents = events.filter(e => new Date(e.startDate) <= now);
      const eventsWithDescriptions = events.filter(e => e.description && e.description.trim());
      const eventsWithLocation = events.filter(e => e.location);
      
      console.log(`Total events: ${events.length}`);
      console.log(`Future events: ${futureEvents.length} (${((futureEvents.length / events.length) * 100).toFixed(1)}%)`);
      console.log(`Past events: ${pastEvents.length} (${((pastEvents.length / events.length) * 100).toFixed(1)}%)`);
      console.log(`Events with descriptions: ${eventsWithDescriptions.length} (${((eventsWithDescriptions.length / events.length) * 100).toFixed(1)}%)`);
      console.log(`Events with locations: ${eventsWithLocation.length} (${((eventsWithLocation.length / events.length) * 100).toFixed(1)}%)`);
      
      // 6. False Positive Analysis
      console.log('\n🚨 False Positive Analysis:');
      console.log('-'.repeat(40));
      
      const suspiciousEvents = events.filter(event => {
        const name = event.name?.toLowerCase() || '';
        const desc = event.description?.toLowerCase() || '';
        
        // Red flags for non-events
        const nonEventIndicators = [
          'published', 'posted', 'written', 'article', 'blog',
          'news', 'press release', 'announcement', 'update'
        ];
        
        const hasNonEventIndicators = nonEventIndicators.some(indicator => 
          name.includes(indicator) || desc.includes(indicator)
        );
        
        // Check for proper event characteristics
        const eventKeywords = [
          'meetup', 'workshop', 'conference', 'event', 'networking',
          'training', 'seminar', 'presentation', 'demo', 'pitch',
          'hackathon', 'competition', 'gathering'
        ];
        
        const hasEventKeywords = eventKeywords.some(keyword => 
          name.includes(keyword)
        );
        
        const veryGeneric = name.length < 5 || name === event.eventType;
        
        return hasNonEventIndicators || !hasEventKeywords || veryGeneric;
      });
      
      console.log(`Potentially suspicious events: ${suspiciousEvents.length}/${events.length}`);
      
      if (suspiciousEvents.length > 0) {
        console.log('\nSuspicious events:');
        suspiciousEvents.forEach((event, index) => {
          console.log(`${index + 1}. "${event.name}" (${event.eventType})`);
          if (event.description) {
            console.log(`   Description: ${event.description.substring(0, 80)}...`);
          }
        });
      }
      
      // 7. Recommendations
      console.log('\n💡 Recommendations:');
      console.log('-'.repeat(40));
      
      if (jsonLdMatches === null || jsonLdMatches.length === 0) {
        console.log('❌ No JSON-LD structured data found - site could benefit from proper Event schema markup');
      }
      
      if (events.length > 0 && eventsWithDescriptions.length / events.length < 0.3) {
        console.log('⚠️  Many events lack descriptions - could improve user experience');
      }
      
      if (suspiciousEvents.length > events.length * 0.2) {
        console.log('⚠️  High rate of potentially false positive events - consider refining detection logic');
      }
      
      if (futureEvents.length === 0) {
        console.log('⚠️  No future events detected - might indicate outdated content or detection issues');
      }
      
      console.log('\n✅ Analysis completed successfully');
      
      // Basic test assertions
      expect(html.length).toBeGreaterThan(0);
      expect(Array.isArray(events)).toBe(true);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      // Skip test for network issues
      if (error.message.includes('fetch') || error.message.includes('network')) {
        console.log('Skipping test due to network connectivity');
        return;
      }
      throw error;
    }
  }, 60000);
});