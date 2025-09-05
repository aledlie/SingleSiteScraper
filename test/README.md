# Test Files for Event Parsing Functionality

This directory contains test files for debugging and analyzing the event parsing functionality of the webscraper.

## Test Files

### `test-capitalfactory-events.js`
Basic test that scrapes capitalfactory.com and reports how many events were found.

**Usage:**
```bash
npx tsx test/test-capitalfactory-events.js
```

### `test-events-page.js` 
Tests both the main capitalfactory.com page and their dedicated events page (/in-person).

**Usage:**
```bash
npx tsx test/test-events-page.js
```

### `debug-capitalfactory.js`
Comprehensive debugging script that:
- Fetches raw HTML from capitalfactory.com
- Analyzes JSON-LD structured data presence
- Checks for event-related CSS classes
- Tests various text patterns for events
- Runs the extractEvents function directly

**Usage:**
```bash
npx tsx test/debug-capitalfactory.js
```

### `inspect-html-structure.js`
Deep dive into the HTML structure to understand why events aren't being parsed:
- Tests current CSS selectors used by the parser
- Analyzes actual `.event-item` elements on the page
- Shows what data is available vs. what the parser expects

**Usage:**
```bash
npx tsx test/inspect-html-structure.js
```

## Findings Summary

All test files confirm that:
- Capital Factory has 12+ events visible on their pages
- Events have structured HTML with `.event-item` classes
- Date/time information is present in `.event-item-date` classes
- **But the current event parsing logic extracts 0 events**

The core issue is that the parsing logic in `src/utils/parseEvents.ts` doesn't match the actual HTML structure used by Capital Factory's website.

## Running Tests

All tests can be run from the project root using `npx tsx test/<filename>`.