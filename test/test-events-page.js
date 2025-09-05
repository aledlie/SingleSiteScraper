import { scrapeWebsite } from '../src/scraper/scrapeWebsite.ts';

const testEventsPage = async () => {
  console.log('🎯 Testing Capital Factory events page...\n');
  
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

  const testUrls = [
    'https://capitalfactory.com/in-person',
    'https://capitalfactory.com',
  ];

  for (const url of testUrls) {
    console.log(`\n🔄 Testing: ${url}`);
    try {
      const result = await scrapeWebsite(url, options, setProgress);
      
      if (result.error) {
        console.error(`❌ Error: ${result.error}`);
        continue;
      }

      const events = result.data?.events || [];
      console.log(`✅ Found ${events.length} events on ${url}`);
      
      if (events.length > 0) {
        console.log('\nFirst 3 events:');
        events.slice(0, 3).forEach((event, index) => {
          console.log(`\nEvent ${index + 1}:`);
          console.log(`  Title: "${event.summary}"`);
          console.log(`  Start: ${JSON.stringify(event.start)}`);
          console.log(`  End: ${JSON.stringify(event.end)}`);
          console.log(`  Location: "${event.location || 'Not specified'}"`);
          console.log(`  Description: "${(event.description || 'Not specified').substring(0, 100)}..."`);
        });
      }
    } catch (error) {
      console.error(`❌ Test failed for ${url}:`, error.message);
    }
  }
};

testEventsPage();