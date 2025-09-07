# 🗄️ SingleSiteScraper Database Schema Documentation

## Overview
This database schema supports a web scraping and analysis system that extracts performance metrics, structured data, and visual relationships from websites. The schema is designed to track comprehensive website analysis including performance monitoring, schema.org data extraction, and HTML structure visualization.

---

## 📊 Tables Overview

### Core Data Flow
```
Website URL → Performance Analysis → HTML Graph Creation → Object Extraction & Schema.org Data
```

---

## 📈 performance_metrics
**Business Purpose**: Website Performance Data  
**Owner**: Development & SEO Team  
**Update Frequency**: Real-time during scraping operations  
**Data Retention**: 90 days  

### Table Description
Stores comprehensive performance metrics for each website analysis session, enabling performance monitoring, optimization insights, and historical tracking.

| Field | Type | Constraints | Business Description | Sample Data | Validation Rules |
|-------|------|-------------|---------------------|-------------|------------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Unique identifier for each performance measurement | `"perf_2024_01_15_001234"` | UUID format, auto-generated |
| `url` | TEXT | NOT NULL, INDEXED | Complete URL of the webpage being analyzed | `"https://example.com/blog/seo-guide"` | Valid HTTP/HTTPS URL |
| `timestamp` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the performance analysis was conducted | `2024-01-15 14:23:17` | Auto-generated |
| `total_time` | INTEGER | - | Total processing time in milliseconds | `3247` | Must be > 0, typically < 60000 |
| `fetch_time` | INTEGER | - | Time spent downloading webpage content | `1834` | Must be ≤ total_time |
| `parse_time` | INTEGER | - | Time spent parsing HTML structure | `892` | Must be ≤ total_time |
| `analysis_time` | INTEGER | - | Time spent analyzing content and relationships | `521` | Must be ≤ total_time |
| `retry_attempts` | INTEGER | - | Number of retry attempts due to failures | `2` | 0-10 (escalate if > 5) |
| `proxy_used` | VARCHAR(100) | - | Proxy server configuration for the request | `"proxy.example.com:8080"` | Optional, format: host:port |
| `html_size` | BIGINT | - | Total HTML content size in bytes | `245678` | Must be > 0 |

### Business Rules
- **Performance Thresholds**: total_time > 10000ms triggers performance alert
- **Retry Logic**: retry_attempts > 3 indicates problematic URLs
- **Size Limits**: html_size > 5MB may indicate bloated pages
- **Success Criteria**: analysis_time should be < 20% of total_time

### Related Processes
- **Performance Monitoring**: Daily aggregation for trend analysis
- **Alert System**: Automated alerts for performance degradation
- **Optimization**: Identifies pages requiring performance improvements

---

## 🏷️ schema_org_data
**Business Purpose**: Structured Content Metadata  
**Owner**: Content & SEO Team  
**Update Frequency**: Updated with each page analysis  
**Data Retention**: Permanent (business intelligence)  

### Table Description
Captures and stores structured data (schema.org markup) found on webpages, enabling rich snippet analysis, SEO optimization, and content understanding.

| Field | Type | Constraints | Business Description | Sample Data | Validation Rules |
|-------|------|-------------|---------------------|-------------|------------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Unique identifier for each schema data entry | `"schema_article_001234"` | UUID format, auto-generated |
| `graph_id` | VARCHAR(255) | FOREIGN KEY, INDEXED | Reference to parent HTML graph | `"graph_2024_01_15_001"` | Must exist in html_graphs.id |
| `schema_type` | VARCHAR(100) | - | Type of schema.org markup detected | `"Article"`, `"Product"`, `"Organization"` | Valid schema.org type |
| `data` | JSON | - | Complete structured data payload | `{"@type": "Article", "headline": "SEO Guide", "author": "John Doe"}` | Valid JSON format |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When schema data was extracted | `2024-01-15 14:23:18` | Auto-generated |

### Business Rules
- **Schema Validation**: All schema.org types must be valid per schema.org specification
- **Data Quality**: JSON must be valid and contain required properties for type
- **SEO Impact**: Missing schema data flagged for content team review
- **Rich Snippets**: Complete schema data enables Google rich snippets

### Common Schema Types
| Type | Business Value | Required Properties |
|------|---------------|-------------------|
| `Article` | News/blog SEO optimization | headline, author, datePublished |
| `Product` | E-commerce rich snippets | name, image, price, availability |
| `Organization` | Brand entity recognition | name, url, logo |
| `LocalBusiness` | Local SEO optimization | name, address, telephone |

---

## 📊 html_graphs
**Business Purpose**: Visual Chart Definitions  
**Owner**: Development Team  
**Update Frequency**: Created with each new page analysis  
**Data Retention**: 30 days (for debugging and optimization)  

### Table Description
Central registry for HTML structure analysis sessions, serving as the parent record for all extracted objects and relationships from a webpage.

| Field | Type | Constraints | Business Description | Sample Data | Validation Rules |
|-------|------|-------------|---------------------|-------------|------------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Unique identifier for each graph visualization | `"graph_2024_01_15_001"` | UUID format, auto-generated |
| `url` | TEXT | INDEXED | Source URL that was analyzed | `"https://example.com/products/widget"` | Valid HTTP/HTTPS URL |
| `title` | TEXT | - | Human-readable name for the graph | `"E-commerce Product Page Analysis"` | Descriptive, max 200 chars |
| `analyzed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When HTML analysis was performed | `2024-01-15 14:23:18` | Auto-generated |
| `total_objects` | INTEGER | - | Count of HTML elements identified | `247` | Must be > 0 |
| `total_relationships` | INTEGER | - | Count of relationships between elements | `156` | Must be ≥ 0 |
| `complexity` | DECIMAL(10,2) | - | Page complexity score (0.0-10.0) | `6.75` | 0.0 ≤ complexity ≤ 10.0 |

### Business Rules
- **Complexity Scoring**: 
  - 0.0-2.0: Simple pages (landing pages)
  - 2.1-5.0: Medium complexity (blog posts, basic e-commerce)
  - 5.1-8.0: High complexity (complex applications)
  - 8.1-10.0: Very high complexity (may impact performance)
- **Object Relationship Ratio**: total_relationships should be 50-80% of total_objects
- **Analysis Timeout**: Pages with complexity > 9.0 may require extended processing

### Graph Statistics
| Complexity Range | Typical Page Types | Average Objects | Processing Time |
|-----------------|-------------------|----------------|----------------|
| 0.0 - 2.0 | Landing pages, contact pages | 50-150 | < 2 seconds |
| 2.1 - 5.0 | Blog posts, product pages | 150-300 | 2-5 seconds |
| 5.1 - 8.0 | Category pages, dashboards | 300-500 | 5-10 seconds |
| 8.1 - 10.0 | Complex SPAs, admin panels | 500+ | 10+ seconds |

---

## 🧩 html_objects
**Business Purpose**: Web Page Elements  
**Owner**: Development & Content Team  
**Update Frequency**: Populated during each graph analysis  
**Data Retention**: 30 days (linked to parent graph retention)  

### Table Description
Detailed inventory of individual HTML elements extracted from webpages, including semantic classification and content extraction for analysis and visualization.

| Field | Type | Constraints | Business Description | Sample Data | Validation Rules |
|-------|------|-------------|---------------------|-------------|------------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Unique identifier for each HTML element | `"obj_header_001234"` | UUID format, auto-generated |
| `graph_id` | VARCHAR(255) | FOREIGN KEY, INDEXED | Parent graph containing this element | `"graph_2024_01_15_001"` | Must exist in html_graphs.id |
| `object_type` | VARCHAR(100) | - | Functional classification of element | `"navigation"`, `"content"`, `"footer"` | Predefined taxonomy |
| `tag` | VARCHAR(50) | INDEXED | HTML tag name | `"div"`, `"h1"`, `"img"`, `"a"` | Valid HTML5 tag |
| `semantic_role` | VARCHAR(100) | - | Semantic meaning in page structure | `"main"`, `"banner"`, `"complementary"` | ARIA role or semantic meaning |
| `schema_org_type` | VARCHAR(100) | - | Associated structured data type | `"Product"`, `"Article"`, `null` | Valid schema.org type or null |
| `text_content` | TEXT | - | Extracted text content from element | `"Welcome to our premium widget collection..."` | Truncated at 1000 chars |

### Business Rules
- **Object Classification**: Every object must have a valid object_type from predefined taxonomy
- **Semantic Roles**: Should align with ARIA specification and HTML5 semantic elements
- **Content Extraction**: Text content > 500 chars may be truncated for storage efficiency
- **Schema Mapping**: schema_org_type populated only when element contains structured data

### Object Type Taxonomy
| Object Type | Description | Common Tags | Business Purpose |
|-------------|-------------|-------------|------------------|
| `navigation` | Navigation elements | `nav`, `ul`, `menu` | Site structure analysis |
| `content` | Main content areas | `article`, `section`, `p` | Content optimization |
| `header` | Page/section headers | `header`, `h1-h6` | Information hierarchy |
| `footer` | Footer information | `footer`, `aside` | Site completeness |
| `media` | Images, videos, audio | `img`, `video`, `audio` | Media optimization |
| `interactive` | Forms, buttons, inputs | `form`, `button`, `input` | UX analysis |
| `metadata` | SEO and meta elements | `meta`, `title`, `script` | Technical SEO |

### Semantic Role Mapping
| Role | HTML5 Element | Business Value |
|------|---------------|---------------|
| `banner` | `header` | Site branding consistency |
| `main` | `main` | Primary content identification |
| `navigation` | `nav` | Site structure optimization |
| `complementary` | `aside` | Supporting content analysis |
| `contentinfo` | `footer` | Contact/legal information |

---

## 🔗 Relationships & Foreign Keys

### Primary Relationships
```sql
schema_org_data.graph_id → html_graphs.id (1:N)
html_objects.graph_id → html_graphs.id (1:N)
```

### Business Implications
- **Cascade Deletion**: Deleting html_graphs record removes all associated objects and schema data
- **Data Integrity**: Foreign key constraints ensure referential integrity
- **Query Optimization**: Indexes on graph_id fields enable efficient JOIN operations

---

## 📊 Data Volume & Performance

### Expected Data Volumes (Monthly)
| Table | Estimated Records | Growth Rate | Storage Impact |
|-------|------------------|-------------|----------------|
| `performance_metrics` | 10,000 | Linear with scraping frequency | High (due to indexing) |
| `html_graphs` | 8,000 | Tied to unique page analyses | Medium |
| `schema_org_data` | 25,000 | Varies by schema markup adoption | Medium (JSON storage) |
| `html_objects` | 2,000,000 | High (avg 250 objects/graph) | Very High |

### Query Performance Optimization
- **Indexing Strategy**: All foreign keys indexed for JOIN performance
- **Partitioning**: Consider date-based partitioning for performance_metrics
- **Archival**: Automated cleanup of records older than retention periods
- **Monitoring**: Query performance alerts for operations > 5 seconds

---

## 🔒 Data Quality & Validation

### Automated Data Quality Checks
1. **Referential Integrity**: Foreign key constraints enforced at database level
2. **Data Type Validation**: JSON schema validation for schema_org_data.data field
3. **Business Rule Validation**: Performance thresholds and complexity scoring
4. **Content Validation**: URL format validation, HTML tag name verification

### Data Quality Metrics
- **Completeness**: % of graphs with associated schema data (target: 60%+)
- **Accuracy**: % of performance metrics within expected ranges (target: 95%+)
- **Consistency**: % of objects with valid semantic roles (target: 90%+)
- **Timeliness**: Average delay between scraping and data availability (target: < 30 seconds)

---

## 🚀 Usage Examples

### Common Queries

#### Find High-Performance Pages
```sql
SELECT url, total_time, complexity 
FROM performance_metrics p
JOIN html_graphs g ON p.url = g.url
WHERE total_time < 2000 AND complexity < 5.0
ORDER BY total_time ASC;
```

#### Analyze Schema.org Adoption
```sql
SELECT schema_type, COUNT(*) as count
FROM schema_org_data
GROUP BY schema_type
ORDER BY count DESC;
```

#### Complex Page Analysis
```sql
SELECT 
    g.url,
    g.complexity,
    g.total_objects,
    COUNT(DISTINCT s.id) as schema_count
FROM html_graphs g
LEFT JOIN schema_org_data s ON g.id = s.graph_id
WHERE g.complexity > 7.0
GROUP BY g.id, g.url, g.complexity, g.total_objects
ORDER BY g.complexity DESC;
```

---

## 🔄 Maintenance & Monitoring

### Scheduled Maintenance
- **Daily**: Performance metrics aggregation and alerting
- **Weekly**: Data quality checks and validation reports
- **Monthly**: Archive old records per retention policies
- **Quarterly**: Index optimization and query performance review

### Monitoring Alerts
- **High Complexity Pages**: complexity > 8.5
- **Performance Degradation**: total_time > 10 seconds
- **High Retry Rates**: retry_attempts > 5
- **Data Quality Issues**: Missing required schema properties

### Backup & Recovery
- **Full Backup**: Daily at 2 AM EST
- **Incremental Backup**: Every 4 hours
- **Point-in-Time Recovery**: Available for last 30 days
- **Testing**: Monthly backup restoration tests

---

*Last Updated: January 2024*  
*Document Version: 1.0*  
*Contact: Development Team for technical questions, SEO Team for business questions*