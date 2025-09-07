# Schema.org Test Suite

## Test Files Created

1. **`src/utils/parse.test.ts`** - Tests for schema.org parsing functions
   - ImageObject creation with encoding formats and dimensions
   - WebSite and WebPage object generation
   - Organization detection (Capital Factory)
   - Metadata extraction with schema.org compliance

2. **`src/utils/parseEvents.enhanced.test.ts`** - Enhanced event parsing tests
   - JSON-LD Event parsing with full schema.org properties
   - HTML element event parsing with Place objects
   - Event type classification
   - Date parsing in various formats
   - Multiple event extraction

3. **`src/components/ScrapeResultTabs.test.tsx`** - UI component tests
   - Event display with schema.org data
   - ImageObject rendering
   - Schema tab functionality
   - Tab navigation and filtering

4. **`src/integration/schemaOrg.integration.test.ts`** - Integration tests
   - Complete workflow from scraping to schema.org output
   - Real-world website simulation
   - Error resilience testing
   - JSON-LD validation

5. **`src/test-summary.schema.test.ts`** - Summary tests
   - Core schema.org functionality validation
   - Error handling verification
   - JSON-LD output validation

## Running Tests

### Run All Schema.org Tests
```bash
npm test src/utils/parse.test.ts src/utils/parseEvents.enhanced.test.ts src/components/ScrapeResultTabs.test.tsx src/integration/schemaOrg.integration.test.ts src/test-summary.schema.test.ts
```

### Run Core Functionality Tests
```bash
npm test src/utils/parseEvents.test.ts src/utils/parse.test.ts src/test-summary.schema.test.ts
```

### Run Individual Test Suites
```bash
# Parse functions
npm test src/utils/parse.test.ts

# Event parsing
npm test src/utils/parseEvents.enhanced.test.ts

# UI components  
npm test src/components/ScrapeResultTabs.test.tsx

# Integration tests
npm test src/integration/schemaOrg.integration.test.ts

# Summary tests
npm test src/test-summary.schema.test.ts
```

## Test Coverage

The test suite covers:

### ✅ **Schema.org Type Creation**
- Dataset with @context and @type
- ImageObject with encoding formats
- Place objects with PostalAddress
- Organization objects
- WebSite and WebPage structures
- Event objects with full properties

### ✅ **Data Parsing**  
- JSON-LD extraction and enhancement
- HTML element parsing to schema.org objects
- Capital Factory detection and structuring
- Image metadata extraction
- Event classification and location parsing

### ✅ **UI Integration**
- Schema tab display and formatting
- Event card rendering with schema.org data
- Image display with enhanced metadata
- Tab navigation and filtering

### ✅ **Error Handling**
- Malformed JSON-LD graceful handling  
- Invalid dates and missing data
- Empty or minimal content processing
- Network and parsing error resilience

### ✅ **JSON-LD Validation**
- Valid schema.org context and types
- Proper nesting and relationships
- Serialization compatibility
- Standard compliance verification

## Key Test Assertions

1. **Schema.org Compliance**: All objects have proper @context and @type
2. **Data Structure**: Required properties are present and properly typed  
3. **Relationship Integrity**: Objects reference each other correctly
4. **Error Resilience**: Graceful degradation when data is missing or invalid
5. **UI Compatibility**: Components handle schema.org data correctly
6. **JSON-LD Validity**: Output can be serialized and parsed as valid JSON-LD

The test suite ensures that the schema.org implementation is robust, compliant, and provides comprehensive coverage of all added functionality.