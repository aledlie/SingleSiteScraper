import { scrapeWebsite } from '../src/scraper/scrapeWebsite.ts';

const testEventsPage = async () => {
  console.log('🌐 Multi-Page Event Testing Suite');
  console.log('=' .repeat(60));
  console.log('🎯 Testing event parsing across multiple Capital Factory pages');
  console.log();
  
  const startTime = Date.now();
  const options = {
    includeText: false,
    includeLinks: false,
    includeImages: false,
    includeMetadata: false,
    includeEvents: true,
    maxEvents: 100, // Increased for comprehensive testing
    maxLinks: 0,
    maxImages: 0,
    maxTextElements: 0,
    timeout: 45000, // Increased timeout for multiple pages
    retryAttempts: 3,
  };

  const testUrls = [
    {
      url: 'https://capitalfactory.com/in-person',
      name: 'Events Page',
      description: 'Dedicated events and in-person activities page'
    },
    {
      url: 'https://capitalfactory.com',
      name: 'Main Homepage',
      description: 'Homepage with featured events and announcements'
    }
  ];

  const results = [];
  let totalEvents = 0;
  let successfulPages = 0;

  console.log(`⚙️  Configuration: Max events per page: ${options.maxEvents}`);
  console.log(`⏱️  Timeout: ${options.timeout / 1000}s per page`);
  console.log(`🔁 Retry attempts: ${options.retryAttempts}`);
  console.log();

  for (let i = 0; i < testUrls.length; i++) {
    const { url, name, description } = testUrls[i];
    const pageStartTime = Date.now();
    
    console.log(`📋 Page ${i + 1}/${testUrls.length}: ${name}`);
    console.log(`🌐 URL: ${url}`);
    console.log(`📝 Description: ${description}`);
    console.log('-' .repeat(50));

    // Enhanced progress tracking for this page
    const progressSteps = [];
    const setProgress = (msg) => {
      const timestamp = new Date().toLocaleTimeString();
      const progressMsg = `[${timestamp}] ${msg}`;
      console.log(`  📊 ${progressMsg}`);
      progressSteps.push({ time: Date.now(), message: msg });
    };

    try {
      const result = await scrapeWebsite(url, options, setProgress);
      const pageDuration = Date.now() - pageStartTime;
      
      if (result.error) {
        console.error(`  ❌ Scraping failed: ${result.error}`);
        console.error(`  ⏱️  Time to failure: ${pageDuration}ms`);
        results.push({
          url,
          name,
          success: false,
          error: result.error,
          duration: pageDuration
        });
        console.log();
        continue;
      }

      const events = result.data?.events || [];
      const { status } = result.data || {};
      
      console.log(`  ✅ Scraping completed successfully`);
      console.log(`  🎉 Events found: ${events.length}`);
      console.log(`  📊 Content size: ${(status?.contentLength || 0).toLocaleString()} chars`);
      console.log(`  🌐 Proxy used: ${status?.proxyUsed || 'Unknown'}`);
      console.log(`  ⏱️  Processing time: ${pageDuration}ms`);
      
      // Event quality analysis (calculate for all cases)
      const withLocations = events.filter(e => e.location).length;
      const withDescriptions = events.filter(e => e.description).length;
      const withValidDates = events.filter(e => e.start?.date || e.start?.dateTime).length;
      
      if (events.length > 0) {
        console.log(`\n  📅 First ${Math.min(3, events.length)} events:`);
        events.slice(0, 3).forEach((event, index) => {
          console.log(`\n    🎪 Event ${index + 1}:`);
          console.log(`       📝 Title: "${event.summary || 'No title'}"`);
          console.log(`       🕐 Start: ${JSON.stringify(event.start) || 'No start time'}`);
          console.log(`       🕕 End: ${JSON.stringify(event.end) || 'No end time'}`);
          console.log(`       📍 Location: "${event.location || 'Not specified'}"`);
          const desc = event.description || 'Not specified';
          console.log(`       📋 Description: "${desc.length > 80 ? desc.substring(0, 80) + '...' : desc}"`);
        });
        
        console.log(`\n  📊 Event Quality Analysis:`);
        console.log(`       📍 With locations: ${withLocations}/${events.length} (${((withLocations/events.length)*100).toFixed(1)}%)`);
        console.log(`       📋 With descriptions: ${withDescriptions}/${events.length} (${((withDescriptions/events.length)*100).toFixed(1)}%)`);
        console.log(`       📅 With valid dates: ${withValidDates}/${events.length} (${((withValidDates/events.length)*100).toFixed(1)}%)`);
      } else {
        console.log(`  ⚠️  No events extracted - parser may need improvement for this page`);
      }
      
      totalEvents += events.length;
      successfulPages++;
      
      results.push({
        url,
        name,
        success: true,
        eventsFound: events.length,
        contentSize: status?.contentLength || 0,
        duration: pageDuration,
        events: events.length > 0 ? events : null,
        quality: {
          withLocations,
          withDescriptions,
          withValidDates
        }
      });
      
    } catch (error) {
      const pageDuration = Date.now() - pageStartTime;
      console.error(`  💥 Test execution failed: ${error.message}`);
      console.error(`  🔍 Error type: ${error.constructor.name}`);
      console.error(`  ⏱️  Time to failure: ${pageDuration}ms`);
      
      results.push({
        url,
        name,
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        duration: pageDuration
      });
    }
    
    console.log();
  }
  
  // Final summary
  const totalDuration = Date.now() - startTime;
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`📊 Pages tested: ${testUrls.length}`);
  console.log(`✅ Successful pages: ${successfulPages}/${testUrls.length} (${((successfulPages/testUrls.length)*100).toFixed(1)}%)`);
  console.log(`🎉 Total events found: ${totalEvents}`);
  console.log(`⏱️  Total execution time: ${totalDuration}ms`);
  console.log(`⏱️  Average per page: ${(totalDuration/testUrls.length).toFixed(0)}ms`);
  
  // Best performing page
  const successfulResults = results.filter(r => r.success && r.eventsFound > 0);
  if (successfulResults.length > 0) {
    const bestPage = successfulResults.reduce((best, current) => 
      current.eventsFound > best.eventsFound ? current : best
    );
    console.log(`\n🏆 Best performing page: ${bestPage.name} (${bestPage.eventsFound} events)`);
  }
  
  // Issues summary
  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log(`\n⚠️  Issues detected:`);
    failedResults.forEach(result => {
      console.log(`   • ${result.name}: ${result.error}`);
    });
  }
  
  const pagesWithNoEvents = results.filter(r => r.success && r.eventsFound === 0);
  if (pagesWithNoEvents.length > 0) {
    console.log(`\n⚠️  Pages with no events found:`);
    pagesWithNoEvents.forEach(result => {
      console.log(`   • ${result.name}: Event parsing may need improvement`);
    });
  }
  
  return {
    totalPages: testUrls.length,
    successfulPages,
    totalEvents,
    totalDuration,
    results,
    success: successfulPages > 0
  };
};

// Run the test and handle results
if (import.meta.url === `file://${process.argv[1]}`) {
  testEventsPage()
    .then(result => {
      console.log('\n🏁 MULTI-PAGE TEST COMPLETED');
      console.log('=' .repeat(60));
      if (result.success) {
        console.log(`✅ Status: PASSED (${result.successfulPages}/${result.totalPages} pages successful)`);
        console.log(`🎉 Total events found: ${result.totalEvents}`);
        console.log(`⏱️  Total duration: ${result.totalDuration}ms`);
        
        if (result.totalEvents === 0) {
          console.log('⚠️  Warning: No events found across all pages - parsing needs improvement');
          process.exit(1);
        } else if (result.successfulPages < result.totalPages) {
          console.log('⚠️  Warning: Some pages failed - partial success');
          process.exit(1);
        }
      } else {
        console.log(`❌ Status: FAILED (all pages failed)`);
        console.log(`🔍 Check network connectivity and website availability`);
        process.exit(2);
      }
    })
    .catch(error => {
      console.error('\n💀 CATASTROPHIC TEST FAILURE');
      console.error('=' .repeat(60));
      console.error(error);
      process.exit(3);
    });
}

export { testEventsPage };