# SingleSiteScraper + RepoViz MCP Integration

## Overview

This project demonstrates a comprehensive integration between SingleSiteScraper and RepoViz MCP server functionality to create an advanced web scraping tool with HTML object analysis, graph-based relationship modeling, and SQLMagic server storage capabilities.

## Features Implemented

### 1. HTML Object Identification System
- **Location**: `src/analytics/htmlObjectAnalyzer.ts`
- **Functionality**:
  - Parses HTML into structured objects with semantic roles
  - Identifies Schema.org structured data
  - Classifies elements by type (interactive, media, structural, content, data, form)
  - Calculates element complexity and relationships
  - Exports to GraphML format for graph analysis tools

### 2. Graph-Based Relationship Modeling
- **Features**:
  - Parent-child relationships between DOM elements
  - Reference relationships (links, form controls)
  - Sibling relationships for similar elements
  - Semantic relationships based on ARIA labels and roles
  - Navigation structure analysis
  - Relationship strength scoring

### 3. Performance Monitoring
- **Location**: `src/analytics/performanceMonitor.ts`
- **Capabilities**:
  - Real-time scraping performance tracking
  - Content complexity analysis
  - Network performance metrics
  - Quality scoring (accessibility, structured data coverage)
  - Alert system for performance thresholds
  - Automated recommendations generation
  - CSV/JSON export of metrics

### 4. SQLMagic Server Integration
- **Location**: `src/analytics/sqlMagicIntegration.ts`
- **Database Schema**:
  - `html_graphs`: Stores graph metadata and analysis results
  - `html_objects`: Individual HTML elements with attributes and relationships
  - `html_relationships`: Relationship mappings between objects
  - `performance_metrics`: Performance data and quality metrics
  - `schema_org_data`: Extracted structured data
- **Features**:
  - Automated schema initialization
  - Batch data insertion with transaction support
  - Query interface for analytics and reporting
  - Connection management and error handling

### 5. Enhanced Web Scraper Interface
- **Location**: `src/components/EnhancedWebScraper.tsx`
- **Features**:
  - Dual-mode interface (Basic/Enhanced Analytics)
  - Configurable analytics options
  - SQL storage configuration
  - Real-time progress monitoring
  - Comprehensive export options (JSON, CSV, GraphML, Schema.org)
  - Performance insights dashboard

### 6. Analytics Dashboard
- **Location**: `src/components/AnalyticsDashboard.tsx`
- **Tabs**:
  - **Overview**: Summary metrics, object type distribution, quality scores
  - **Graph Analysis**: Relationship density, depth analysis, export options
  - **Performance**: Detailed timing metrics, network performance, quality indicators
  - **Schema.org**: Structured data visualization and export

## Architecture Integration

### RepoViz MCP Server Integration
The integration leverages RepoViz's capabilities for:
- **Schema.org data generation** using RepoViz's structured data schemas
- **Pydantic validation** for data integrity
- **Chart generation** capabilities (adapted for web analytics)
- **Database schema modeling** extended for HTML object storage

### Data Flow
1. **Scraping**: Enhanced scraper fetches and processes web content
2. **Analysis**: HTML object analyzer parses DOM structure
3. **Modeling**: Graph relationships are identified and scored
4. **Storage**: Data is stored in SQLMagic server with proper schema
5. **Visualization**: Analytics dashboard provides insights and exports

## Configuration Options

### Analytics Configuration
```typescript
interface AnalyticsConfig {
  enableAnalytics: boolean;           // Enable HTML analysis
  enablePerformanceMonitoring: boolean; // Track performance metrics
  enableSQLStorage: boolean;          // Store in SQLMagic server
  generateGraphML: boolean;           // Export GraphML format
  generateSchemaOrg: boolean;         // Extract Schema.org data
  sqlConfig?: SQLMagicConfig;         // Database connection settings
}
```

### Performance Thresholds
- Response Time: 5000ms
- Scrape Time: 30000ms
- Complexity Score: 1000
- HTML Size: 1MB
- Object Count: 10000
- Success Rate: 95%

## Usage Examples

### Basic Enhanced Scraping
```typescript
const scraper = new EnhancedScraper();
const result = await scraper.scrape(url, {
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  generateGraphML: true,
  generateSchemaOrg: true
}, setProgress);
```

### With SQL Storage
```typescript
await scraper.initializeSQLIntegration({
  host: 'localhost',
  port: 5432,
  database: 'scraper_analytics'
});

const result = await scraper.scrape(url, {
  enableAnalytics: true,
  enableSQLStorage: true
}, setProgress);
```

### Generating Insights
```typescript
const insights = scraper.generateInsights(result);
// Returns: object type distribution, complexity analysis, 
// performance summary, quality metrics, recommendations
```

## Export Formats

### GraphML Export
- Compatible with Gephi, Cytoscape, yEd
- Includes node attributes (type, semantic role, size, depth)
- Edge attributes (relationship type, strength)

### Schema.org Export
- JSON-LD format
- Structured data extracted from HTML
- Compatible with Google Structured Data Testing Tool

### Performance Data Export
- CSV format with metrics over time
- JSON format with full analytics data
- Combined export with all data types

## Performance Optimizations

1. **Lazy Analysis**: Analytics only run when enabled
2. **Streaming Insights**: Real-time progress updates
3. **Batch Database Operations**: Efficient bulk inserts
4. **Memory Management**: DOM objects cleaned after analysis
5. **Connection Pooling**: Reuse database connections
6. **Caching**: Results cached for subsequent analysis

## Testing

The integration includes comprehensive tests:
- Unit tests for HTML object analyzer
- Integration tests for enhanced scraper
- Performance monitor testing
- Mock SQL integration tests
- Component testing for React interfaces

Run tests with:
```bash
npm test
npm run build  # Verify production build
```

## Future Enhancements

### Potential Improvements
1. **Real-time Collaboration**: Multi-user analysis sessions
2. **AI-Powered Insights**: Machine learning for pattern detection
3. **Advanced Visualization**: D3.js graph rendering
4. **API Integration**: RESTful API for programmatic access
5. **Scheduled Scraping**: Automated monitoring and alerts
6. **Data Pipeline**: ETL processes for large-scale analysis

### RepoViz MCP Extensions
1. **Custom Chart Types**: Web-specific visualization patterns
2. **Interactive Dashboards**: Real-time analytics updates
3. **Comparison Tools**: Before/after analysis comparisons
4. **Accessibility Auditing**: Automated WCAG compliance checking

## Technical Notes

### Dependencies Added
- `node-html-parser`: DOM parsing and analysis
- Integration with existing React/TypeScript stack
- CSS modules for analytics dashboard styling
- Enhanced type definitions for analytics data

### Browser Compatibility
- Modern browsers with ES2020+ support
- Progressive enhancement for older browsers
- Responsive design for mobile analytics

### Security Considerations
- SQL injection prevention through parameterized queries
- Input validation for all user data
- Sanitization of HTML content before analysis
- Secure connection handling for database operations

## Conclusion

This integration successfully combines SingleSiteScraper's web scraping capabilities with RepoViz's structured data and analytics features, creating a powerful tool for web content analysis, performance monitoring, and relationship modeling. The modular architecture allows for easy extension and customization while maintaining high performance and reliability.