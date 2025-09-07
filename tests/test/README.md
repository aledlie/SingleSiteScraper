# 🧪 Event Parsing Test Suite

Comprehensive testing and debugging tools for the event parsing functionality of the webscraper.

## 🎯 Overview

This directory contains a complete test suite for analyzing and debugging event extraction from websites, specifically focused on Capital Factory's event pages. The tests help identify issues with parsing logic and provide actionable recommendations for improvements.

## 🚀 Quick Start

### Run All Tests (Recommended)
```bash
npx tsx test/run-all-tests.js
```

This comprehensive test suite will:
- ✅ Run all individual tests
- 📊 Provide detailed analysis and metrics
- 💡 Generate actionable recommendations
- 🎯 Give an overall assessment of parsing health

### Run Individual Tests
```bash
# Basic functionality test
npx tsx test/test-capitalfactory-events.js

# Multi-page testing
npx tsx test/test-events-page.js

# Deep debugging analysis
npx tsx test/debug-capitalfactory.js

# HTML structure inspection
npx tsx test/inspect-html-structure.js
```

## 📋 Test Suite Components

### 🔄 `run-all-tests.js` - Comprehensive Test Runner
**The main test orchestrator that runs all tests and provides comprehensive analysis.**

**Features:**
- 🎯 Runs all 4 test components in sequence
- 📊 Aggregates results and provides detailed metrics
- 💡 Generates specific recommendations based on findings
- 🚦 Provides clear pass/fail/warning status
- ⏱️ Performance tracking across all tests
- 🎨 Professional console output with emojis and formatting

**Output:**
- Test execution summary with timing
- Detailed results for each test component
- Overall assessment (excellent/needs improvement/issues detected)
- Actionable recommendations for fixing issues
- Exit codes for CI/CD integration

---

### 🎪 `test-capitalfactory-events.js` - Basic Event Testing
**Primary functionality test for event extraction from Capital Factory homepage.**

**Enhanced Features:**
- 📊 Comprehensive progress tracking with timestamps
- 📈 Detailed event analysis (locations, descriptions, dates)
- 🎨 Professional console output with rich formatting
- ⏱️ Performance metrics and timing analysis
- 🚦 Smart exit codes for automated testing
- 📋 Event quality assessment (completeness percentages)

**Metrics Provided:**
- Events found count
- Content size and processing time
- Event quality analysis (% with locations, descriptions, dates)
- Proxy performance and response times

---

### 🌐 `test-events-page.js` - Multi-Page Event Testing
**Comprehensive testing across multiple Capital Factory pages.**

**Enhanced Features:**
- 🎯 Tests both homepage and dedicated events page
- 📊 Comparative analysis across different pages
- 🏆 Identifies best-performing pages
- ⚠️ Detailed failure analysis and recommendations
- 📈 Cross-page event quality metrics
- 🎨 Rich console output with page-by-page breakdown

**Pages Tested:**
1. `https://capitalfactory.com/in-person` (Events Page)
2. `https://capitalfactory.com` (Homepage)

**Analysis Provided:**
- Per-page success rates and event counts
- Cross-page quality comparison
- Best performing page identification
- Failure pattern analysis

---

### 🔬 `debug-capitalfactory.js` - Deep Debug Analysis
**The most comprehensive debugging tool for understanding parsing failures.**

**6-Step Analysis Process:**
1. **🌐 Website Content Fetching** - Multi-proxy content retrieval
2. **🧬 Raw HTML Analysis** - Direct HTML structure examination
3. **🔍 JSON-LD Analysis** - Structured data detection and parsing
4. **🏷️ CSS Class Analysis** - Event-related class identification
5. **🔍 Text Pattern Analysis** - Event content pattern matching
6. **🧪 Parser Function Testing** - Direct extractEvents() function testing

**Advanced Features:**
- 🎯 10+ different text pattern searches (dates, times, event keywords)
- 📋 JSON-LD structured data parsing and validation
- 🏷️ Automatic CSS class pattern recognition
- 🔧 Specific recommendations for parseEvents.ts updates
- 📊 Comprehensive statistics and metrics

**Debugging Insights:**
- Why events are not being extracted
- What data is available vs. what's being captured
- Specific code changes needed
- Pattern analysis for improving selectors

---

### 🔬 `inspect-html-structure.js` - HTML Structure Inspector
**Detailed HTML structure analysis with parser improvement recommendations.**

**6-Step Inspection Process:**
1. **🌐 HTML Fetching** - Multi-proxy HTML retrieval
2. **🧬 HTML Parsing** - DOM structure analysis
3. **🎯 Current Selector Testing** - Tests existing parseEvents.ts selectors
4. **🎪 Event Item Deep Analysis** - Detailed .event-item examination
5. **📈 Cross-Element Pattern Analysis** - Common patterns across all events
6. **💡 Improvement Recommendations** - Specific code suggestions

**Advanced Analysis:**
- 🔍 Tests all current parsing selectors individually
- 🎪 Deep-dive analysis of first 3 event items
- 📊 Pattern analysis across all event elements
- 🏷️ Class name frequency analysis
- 🧑‍💻 Specific code suggestions with line numbers

**Code Suggestions:**
- Updated CSS selectors for parseEvents.ts
- Specific line-by-line code improvements
- Alternative parsing strategies

## 📊 Understanding Test Results

### Exit Codes
- `0` - All tests passed, event parsing working perfectly
- `1` - Tests passed with warnings (no events found, needs improvement)
- `2` - Test failures detected (critical issues)
- `3` - Catastrophic test failure (infrastructure issues)

### Status Meanings
- ✅ **EXCELLENT** - All tests passed, parsing working correctly
- ⚠️ **NEEDS IMPROVEMENT** - Infrastructure works but selectors need updates
- ❌ **CRITICAL ISSUES** - Major parsing problems requiring immediate attention

## 🔧 Common Issues & Solutions

### Issue: "No events were parsed"
**Symptoms:** Tests run successfully but extract 0 events

**Diagnosis Steps:**
1. Run `npx tsx test/debug-capitalfactory.js` for detailed analysis
2. Run `npx tsx test/inspect-html-structure.js` for specific recommendations
3. Check if event-related HTML classes are detected
4. Verify if text patterns suggest events are present

**Common Solutions:**
- Update CSS selectors in `src/utils/parseEvents.ts` lines 74-92
- Add `.event-item-date` to date selector list
- Include `h3, .title, a` in title selectors
- Add `address` to location selectors

### Issue: "Parser found events but data is incomplete"
**Solutions:**
- Review event quality metrics in test output
- Check if specific selectors are missing (location, description)
- Update parseEventDate() function for better date format support

### Issue: "Tests fail with network errors"
**Solutions:**
- Check internet connectivity
- Verify Capital Factory website is accessible
- Check if proxy services are working
- Try running individual tests to isolate issues

## 🎯 Integration with Development

### CI/CD Integration
The test suite provides proper exit codes for automated testing:

```bash
# In your CI pipeline
npx tsx test/run-all-tests.js

# Exit code 0 = success
# Exit code 1 = warnings (may want to continue with warnings)
# Exit code 2+ = failures (should fail the build)
```

### Development Workflow
1. **Identify Issues:** `npx tsx test/run-all-tests.js`
2. **Debug Problems:** `npx tsx test/debug-capitalfactory.js`
3. **Get Recommendations:** `npx tsx test/inspect-html-structure.js`
4. **Update Code:** Modify `src/utils/parseEvents.ts` based on recommendations
5. **Verify Fixes:** `npx tsx test/test-capitalfactory-events.js`
6. **Full Validation:** `npx tsx test/run-all-tests.js`

## 🎨 Output Examples

All tests provide rich, formatted console output with:
- 🎯 Progress indicators with timestamps
- 📊 Detailed metrics and statistics
- 💡 Specific recommendations and next steps
- 🎨 Professional formatting with emojis and color coding
- ⏱️ Performance timing for optimization insights

## 📈 Current Findings (as of last test run)

**Status:** ⚠️ NEEDS IMPROVEMENT

**Key Issues Identified:**
- Capital Factory has 12+ events visible on their pages
- Events use structured HTML with `.event-item` classes
- Date/time information is in `.event-item-date` classes (not `.event-date`)
- Current parsing logic in `src/utils/parseEvents.ts` extracts 0 events
- No JSON-LD structured data available
- HTML structure doesn't match current parser expectations

**Required Actions:**
1. Update parseEvents.ts selectors to include `.event-item-date`
2. Expand title selectors to include `h3`, `.title`, and `a` elements
3. Test updated parsing logic with test suite
4. Consider adding support for additional date formats

## 🎯 Getting Started

**First time?** Just run the comprehensive test suite:

```bash
npx tsx test/run-all-tests.js
```

This will automatically run all tests, provide detailed analysis, and give you specific recommendations for any issues found.

---

*💡 Run `npx tsx test/run-all-tests.js` for the most current analysis and recommendations.*