import { scrapeWebsite } from '../src/scraper/scrapeWebsite.ts';

const testCapitalFactoryEvents = async () => {
  console.log('🧪 Testing Capital Factory Event Parsing');
  console.log('=' .repeat(50));
  console.log();
  
  const startTime = Date.now();
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

  // Enhanced progress tracking
  let progressSteps = [];
  const setProgress = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const progressMsg = `[${timestamp}] ${msg}`;
    console.log(`📊 ${progressMsg}`);
    progressSteps.push({ time: Date.now(), message: msg });
  };

  try {
    console.log('🎯 Target: https://capitalfactory.com');
    console.log(`⚙️  Configuration: Events only (max: ${options.maxEvents})`);
    console.log(`⏱️  Timeout: ${options.timeout / 1000}s, Retries: ${options.retryAttempts}`);
    console.log();
    
    const scrapeStartTime = Date.now();
    const result = await scrapeWebsite('https://capitalfactory.com', options, setProgress);
    const scrapeDuration = Date.now() - scrapeStartTime;
    
    console.log('\n' + '=' .repeat(50));
    console.log('📈 RESULTS SUMMARY');
    console.log('=' .repeat(50));
    
    if (result.error) {
      console.error('❌ Scraping failed:', result.error);
      console.log(`⏱️  Total time: ${scrapeDuration}ms`);
      return { success: false, error: result.error, duration: scrapeDuration };
    }

    const events = result.data?.events || [];
    const { status } = result.data || {};
    
    // Summary statistics
    console.log(`✅ Scraping completed successfully`);
    console.log(`🎉 Events found: ${events.length}`);
    console.log(`📊 Content size: ${(status?.contentLength || 0).toLocaleString()} characters`);
    console.log(`🌐 Proxy used: ${status?.proxyUsed || 'Unknown'}`);
    console.log(`⏱️  Response time: ${status?.responseTime || scrapeDuration}ms`);
    console.log(`📄 Content type: ${status?.contentType || 'Unknown'}`);
    console.log();
    
    // Event details
    if (events.length > 0) {
      console.log('📅 EVENT DETAILS');
      console.log('-' .repeat(30));
      
      events.forEach((event, index) => {
        console.log(`\n🎪 Event ${index + 1}:`);
        console.log(`   📝 Title: "${event.summary || 'No title'}"`);
        console.log(`   🕐 Start: ${JSON.stringify(event.start) || 'Not specified'}`);
        console.log(`   🕕 End: ${JSON.stringify(event.end) || 'Not specified'}`);
        console.log(`   📍 Location: ${event.location || 'Not specified'}`);
        console.log(`   📋 Description: ${event.description ? `"${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}"` : 'Not specified'}`);
        console.log(`   🏷️  Type: ${event.eventType || 'default'}`);
      });
      
      // Event analysis
      console.log('\n📊 EVENT ANALYSIS');
      console.log('-' .repeat(30));
      const eventsWithLocations = events.filter(e => e.location).length;
      const eventsWithDescriptions = events.filter(e => e.description).length;
      const eventsWithDates = events.filter(e => e.start?.date || e.start?.dateTime).length;
      
      console.log(`📍 Events with locations: ${eventsWithLocations}/${events.length} (${((eventsWithLocations/events.length)*100).toFixed(1)}%)`);
      console.log(`📋 Events with descriptions: ${eventsWithDescriptions}/${events.length} (${((eventsWithDescriptions/events.length)*100).toFixed(1)}%)`);
      console.log(`📅 Events with valid dates: ${eventsWithDates}/${events.length} (${((eventsWithDates/events.length)*100).toFixed(1)}%)`);
      
    } else {
      console.log('⚠️  EVENT PARSING ANALYSIS');
      console.log('-' .repeat(30));
      console.log('❌ No events were extracted from the page');
      console.log('🔍 This suggests the event parsing logic needs improvement');
      console.log('💡 Consider running the debug scripts to understand the HTML structure');
      console.log('   • npx tsx test/debug-capitalfactory.js');
      console.log('   • npx tsx test/inspect-html-structure.js');
    }
    
    const totalDuration = Date.now() - startTime;
    console.log('\n⏱️  PERFORMANCE SUMMARY');
    console.log('-' .repeat(30));
    console.log(`Total test duration: ${totalDuration}ms`);
    console.log(`Scraping duration: ${scrapeDuration}ms`);
    console.log(`Test overhead: ${totalDuration - scrapeDuration}ms`);
    
    return {
      success: true,
      eventsFound: events.length,
      contentSize: status?.contentLength || 0,
      duration: scrapeDuration,
      totalDuration,
      events: events.length > 0 ? events : null
    };

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('\n💥 TEST EXECUTION FAILED');
    console.error('=' .repeat(50));
    console.error(`❌ Error: ${error.message}`);
    console.error(`🔍 Error type: ${error.constructor.name}`);
    if (error.stack) {
      console.error(`📋 Stack trace: ${error.stack.split('\n')[1]}`);
    }
    console.error(`⏱️  Time to failure: ${totalDuration}ms`);
    
    return {
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      duration: totalDuration
    };
  }
};

// Run the test and handle results
if (import.meta.url === `file://${process.argv[1]}`) {
  testCapitalFactoryEvents()
    .then(result => {
      console.log('\n🏁 TEST COMPLETED');
      console.log('=' .repeat(50));
      if (result.success) {
        console.log(`✅ Status: PASSED`);
        console.log(`📊 Events: ${result.eventsFound}`);
        console.log(`⏱️  Duration: ${result.totalDuration}ms`);
        if (result.eventsFound === 0) {
          console.log('⚠️  Warning: No events found - parsing may need improvement');
          process.exit(1); // Exit with warning code
        }
      } else {
        console.log(`❌ Status: FAILED`);
        console.log(`💥 Error: ${result.error}`);
        process.exit(2); // Exit with error code
      }
    })
    .catch(error => {
      console.error('\n💀 CATASTROPHIC FAILURE');
      console.error('=' .repeat(50));
      console.error(error);
      process.exit(3); // Exit with critical error code
    });
}

export { testCapitalFactoryEvents };