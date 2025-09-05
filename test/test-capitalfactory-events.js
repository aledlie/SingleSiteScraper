import { scrapeWebsite } from '../src/scraper/scrapeWebsite.ts';

const testCapitalFactoryEvents = async () => {
  console.log('Testing Capital Factory event parsing...\n');
  
  const options = {
    includeText: false,
    includeLinks: false,
    includeImages: false,
    includeMetadata: false,
    includeEvents: true,
    maxEvents: 50,
    maxLinks: 0,
    maxImages: 0,
    maxTextElements: 0,
    timeout: 30000,
    retryAttempts: 3,
  };

  const setProgress = (msg) => console.log(`Progress: ${msg}`);

  try {
    console.log('🔄 Scraping capitalfactory.com...');
    const result = await scrapeWebsite('https://capitalfactory.com', options, setProgress);
    
    if (result.error) {
      console.error('❌ Error:', result.error);
      return;
    }

    const events = result.data?.events || [];
    console.log(`\n✅ Found ${events.length} events:\n`);
    
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  Title: ${event.summary}`);
      console.log(`  Start: ${JSON.stringify(event.start)}`);
      console.log(`  End: ${JSON.stringify(event.end)}`);
      console.log(`  Location: ${event.location || 'Not specified'}`);
      console.log(`  Description: ${event.description || 'Not specified'}`);
      console.log(`  Type: ${event.eventType}`);
      console.log('');
    });

    if (events.length === 0) {
      console.log('❌ No events were parsed. This indicates an issue with the event parsing logic.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testCapitalFactoryEvents();