import { testCapitalFactoryEvents } from './test-capitalfactory-events.js';
import { testEventsPage } from './test-events-page.js';
import { debugCapitalFactory } from './debug-capitalfactory.js';
import { inspectHtmlStructure } from './inspect-html-structure.js';

const runAllTests = async () => {
  console.log('🧪 Capital Factory Event Parsing - Comprehensive Test Suite');
  console.log('=' .repeat(80));
  console.log('🎯 Running all event parsing tests and diagnostics');
  console.log('📊 This will provide a complete analysis of parsing capabilities');
  console.log();
  
  const startTime = Date.now();
  const results = {
    tests: {},
    summary: {
      total: 4,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };
  
  const tests = [
    {
      name: 'Basic Event Parsing Test',
      description: 'Tests basic event extraction from capitalfactory.com homepage',
      runner: testCapitalFactoryEvents,
      key: 'basicTest'
    },
    {
      name: 'Multi-Page Event Test',
      description: 'Tests event parsing across multiple pages',
      runner: testEventsPage,
      key: 'multiPageTest'
    },
    {
      name: 'Debug Analysis',
      description: 'Deep analysis of HTML structure and parsing logic',
      runner: debugCapitalFactory,
      key: 'debugAnalysis'
    },
    {
      name: 'HTML Structure Inspection',
      description: 'Detailed inspection of HTML elements and recommendations',
      runner: inspectHtmlStructure,
      key: 'structureInspection'
    }
  ];
  
  console.log('📋 Test Plan:');
  tests.forEach((test, i) => {
    console.log(`   ${i + 1}. ${test.name}: ${test.description}`);
  });
  console.log();
  
  // Run each test
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const testStartTime = Date.now();
    
    console.log(`🔄 Running Test ${i + 1}/${tests.length}: ${test.name}`);
    console.log('▔'.repeat(80));
    
    try {
      const result = await test.runner();
      const testDuration = Date.now() - testStartTime;
      
      results.tests[test.key] = {
        name: test.name,
        success: result.success,
        duration: testDuration,
        result: result
      };
      
      if (result.success) {
        if (test.key === 'basicTest' && result.eventsFound === 0) {
          console.log(`⚠️  Test ${i + 1} completed with warnings (no events found)`);
          results.summary.warnings++;
        } else if (test.key === 'multiPageTest' && result.totalEvents === 0) {
          console.log(`⚠️  Test ${i + 1} completed with warnings (no events found)`);
          results.summary.warnings++;
        } else {
          console.log(`✅ Test ${i + 1} passed successfully`);
          results.summary.passed++;
        }
      } else {
        console.log(`❌ Test ${i + 1} failed`);
        results.summary.failed++;
      }
      
    } catch (error) {
      const testDuration = Date.now() - testStartTime;
      console.error(`💥 Test ${i + 1} crashed: ${error.message}`);
      
      results.tests[test.key] = {
        name: test.name,
        success: false,
        duration: testDuration,
        error: error.message,
        result: null
      };
      
      results.summary.failed++;
    }
    
    console.log();
    console.log();
  }
  
  // Generate comprehensive summary
  const totalDuration = Date.now() - startTime;
  
  console.log('📊 COMPREHENSIVE TEST SUITE SUMMARY');
  console.log('=' .repeat(80));
  console.log(`🕒 Total execution time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
  console.log(`📊 Tests run: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log();
  
  // Detailed results
  console.log('📋 DETAILED TEST RESULTS');
  console.log('-'.repeat(60));
  
  Object.entries(results.tests).forEach(([key, test]) => {
    const status = test.success ? '✅ PASS' : '❌ FAIL';
    const duration = `${test.duration}ms`;
    console.log(`${status} ${test.name} (${duration})`);
    
    if (test.success && test.result) {
      // Show key metrics for each test
      if (key === 'basicTest' && test.result.eventsFound !== undefined) {
        console.log(`      📊 Events found: ${test.result.eventsFound}`);
        console.log(`      📄 Content size: ${test.result.contentSize?.toLocaleString()} chars`);
      }
      
      if (key === 'multiPageTest' && test.result.totalEvents !== undefined) {
        console.log(`      📊 Total events: ${test.result.totalEvents} across ${test.result.successfulPages} pages`);
      }
      
      if (key === 'debugAnalysis' && test.result.eventsExtracted !== undefined) {
        console.log(`      📊 Events extracted: ${test.result.eventsExtracted}`);
        console.log(`      📋 JSON-LD scripts: ${test.result.jsonLdScripts}`);
        console.log(`      🏷️  Event classes: ${test.result.eventClasses}`);
      }
      
      if (key === 'structureInspection' && test.result.eventItemsFound !== undefined) {
        console.log(`      🎪 Event items found: ${test.result.eventItemsFound}`);
        console.log(`      📄 HTML size: ${test.result.htmlSize?.toLocaleString()} chars`);
      }
    }
    
    if (test.error) {
      console.log(`      ❌ Error: ${test.error}`);
    }
    
    console.log();
  });
  
  // Overall assessment
  console.log('🎯 OVERALL ASSESSMENT');
  console.log('-'.repeat(60));
  
  const allTestsPassed = results.summary.failed === 0;
  const hasWarnings = results.summary.warnings > 0;
  
  if (allTestsPassed && !hasWarnings) {
    console.log('🎉 EXCELLENT: All tests passed without issues');
    console.log('✨ Event parsing is working correctly across all test scenarios');
  } else if (allTestsPassed && hasWarnings) {
    console.log('⚠️  NEEDS IMPROVEMENT: Tests passed but with warnings');
    console.log('🔧 Event parsing infrastructure works but no events are being extracted');
    console.log('💡 This indicates the parsing selectors need to be updated');
  } else {
    console.log('❌ ISSUES DETECTED: Some tests failed');
    console.log('🔧 Event parsing has serious issues that need to be addressed');
  }
  
  // Actionable recommendations
  console.log('\n💡 ACTIONABLE RECOMMENDATIONS');
  console.log('-'.repeat(60));
  
  if (hasWarnings || results.summary.failed > 0) {
    console.log('Based on test results, here are the next steps:');
    console.log();
    console.log('1. 🔬 Review Debug Analysis results for detailed HTML structure insights');
    console.log('2. 🧬 Use HTML Structure Inspection recommendations to update parseEvents.ts');
    console.log('3. 🔧 Update CSS selectors in parseEvents.ts based on actual HTML structure');
    console.log('4. ⚗️  Test changes with: npx tsx test/test-capitalfactory-events.js');
    console.log('5. 🔄 Re-run this comprehensive suite to verify improvements');
    console.log();
    console.log('Key files to update:');
    console.log('   • src/utils/parseEvents.ts (main parsing logic)');
    console.log('   • CSS selectors around lines 74-92 in parseEvents.ts');
  } else {
    console.log('🎉 No immediate action required - event parsing is working well!');
    console.log('📊 Consider running these tests periodically to ensure continued functionality');
  }
  
  console.log();
  console.log('📚 For more detailed analysis, run individual test scripts:');
  console.log('   • npx tsx test/test-capitalfactory-events.js  (basic test)');
  console.log('   • npx tsx test/test-events-page.js           (multi-page test)');
  console.log('   • npx tsx test/debug-capitalfactory.js       (debug analysis)');
  console.log('   • npx tsx test/inspect-html-structure.js     (structure inspection)');
  
  return {
    success: allTestsPassed,
    hasWarnings,
    summary: results.summary,
    totalDuration,
    recommendations: hasWarnings || results.summary.failed > 0 ? 'update_selectors' : 'working_well'
  };
};

// Run all tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(result => {
      console.log('\n🏁 COMPREHENSIVE TEST SUITE COMPLETED');
      console.log('=' .repeat(80));
      
      let exitCode = 0;
      
      if (result.success && !result.hasWarnings) {
        console.log('🎉 Status: ALL SYSTEMS GO');
        console.log('✨ Event parsing is working perfectly');
      } else if (result.success && result.hasWarnings) {
        console.log('⚠️  Status: NEEDS IMPROVEMENT');
        console.log('🔧 Event parsing needs selector updates');
        exitCode = 1;
      } else {
        console.log('❌ Status: CRITICAL ISSUES');
        console.log('🚨 Event parsing has serious problems');
        exitCode = 2;
      }
      
      console.log(`🕒 Total time: ${result.totalDuration}ms`);
      console.log(`📊 Final score: ${result.summary.passed}/${result.summary.total} tests passed`);
      
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n💀 COMPREHENSIVE TEST SUITE CRASHED');
      console.error('=' .repeat(80));
      console.error('💥 Critical error in test suite execution:');
      console.error(error);
      process.exit(3);
    });
}

export { runAllTests };