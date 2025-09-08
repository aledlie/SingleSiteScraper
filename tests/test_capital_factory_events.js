#!/usr/bin/env node

import { extractEvents } from '../src/utils/parseEvents.ts';

async function testCapitalFactoryEvents() {
    console.log('🧪 Testing Capital Factory Event Detection');
    console.log('=' .repeat(50));

    try {
        console.log('📡 Fetching Capital Factory website...');
        
        // Fetch the website directly
        const response = await fetch('https://capitalfactory.com', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log(`✅ Successfully fetched ${html.length} characters of HTML`);
        console.log('');
        
        // Test event extraction
        console.log('🔍 Extracting events using parseEvents logic...');
        const events = extractEvents(html);
        
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
                    } catch (e) {
                        console.log(`  Script ${index + 1}: Parse error`);
                    }
                });
            }
            
            // Check for event-related HTML patterns
            const eventPatterns = [
                /class="[^"]*event[^"]*"/gi,
                /Sep\.\s*\d+\s*\/\s*\d+:\d+\s*[AP]M/gi,
                /<a[^>]*href="[^"]*\/event\/[^"]*"/gi
            ];
            
            eventPatterns.forEach((pattern, index) => {
                const matches = html.match(pattern);
                console.log(`  Pattern ${index + 1} matches: ${matches ? matches.length : 0}`);
                if (matches && matches.length > 0 && matches.length < 10) {
                    console.log(`    Examples: ${matches.slice(0, 3).join(', ')}`);
                }
            });
            
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
        }
        
        console.log('');
        console.log('🏁 Test completed successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testCapitalFactoryEvents().catch(console.error);