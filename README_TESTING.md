# SEO/LLM/Performance Testing Suite

A comprehensive testing framework for analyzing website performance, SEO optimization, and LLM compatibility across 20+ key metrics.

## Overview

This testing suite provides automated analysis of websites across three critical areas:

### 🔍 SEO Analysis (6 Metrics)
- **Structured Data Coverage**: Schema.org markup detection and validation
- **Meta Tag Completeness**: Title, description, and essential meta tags
- **Header Hierarchy**: Proper H1-H6 tag structure and organization
- **Internal Link Density**: Cross-page linking optimization
- **Image Alt Text Coverage**: Accessibility and SEO-friendly image descriptions
- **Content Keyword Density**: Natural keyword distribution analysis

### 🤖 LLM Compatibility (7 Metrics)
- **Content Readability Score**: Flesch-Kincaid reading level assessment
- **Semantic HTML Usage**: Proper semantic element implementation
- **Content Structure Clarity**: Logical content organization and hierarchy
- **Entity Recognition Score**: Named entity identification and relevance
- **Context Coherence**: Content flow and topical consistency
- **Information Density**: Content value per page section
- **AI Parsability Score**: Machine-readable content structure

### ⚡ Performance Metrics (7+ Core Web Vitals)
- **Page Load Time**: Complete page loading duration
- **Time to First Byte (TTFB)**: Server response optimization
- **First Contentful Paint (FCP)**: Initial content rendering speed
- **Largest Contentful Paint (LCP)**: Main content loading performance
- **Cumulative Layout Shift (CLS)**: Visual stability measurement
- **First Input Delay (FID)**: User interaction responsiveness
- **Total Blocking Time (TBT)**: Main thread blocking duration

## Installation

### Prerequisites
```bash
pip install -r requirements_testing.txt
```

### Dependencies
- `requests`: HTTP request handling
- `beautifulsoup4`: HTML parsing and analysis
- `selenium`: Browser automation for performance metrics
- `textstat`: Content readability analysis
- `spacy`: Natural language processing and entity recognition
- `lighthouse`: Google Lighthouse performance auditing
- `numpy`: Numerical computations
- `matplotlib`: Data visualization
- `pandas`: Data analysis and reporting

## Usage

### Basic Testing
```python
from seo_llm_performance_test_suite import SEOLLMPerformanceTestSuite

# Initialize test suite
tester = SEOLLMPerformanceTestSuite()

# Run comprehensive analysis
results = tester.run_comprehensive_test('https://example.com')

# Generate detailed report
report = tester.generate_detailed_report(results)
print(report)
```

### Batch Testing
```python
# Test multiple URLs
urls = [
    'https://example.com',
    'https://competitor1.com',
    'https://competitor2.com'
]

batch_results = tester.run_batch_tests(urls)
```

### Custom Configuration
```python
# Configure custom thresholds
custom_config = {
    'performance': {
        'page_load_threshold': 3.0,  # seconds
        'lcp_threshold': 2.5,        # seconds
        'fid_threshold': 100         # milliseconds
    },
    'seo': {
        'keyword_density_min': 0.5,  # percentage
        'keyword_density_max': 3.0   # percentage
    },
    'llm': {
        'readability_min': 60,       # Flesch score
        'entity_recognition_min': 0.7 # confidence threshold
    }
}

tester = SEOLLMPerformanceTestSuite(config=custom_config)
```

## Test Results Format

### Individual Test Results
```python
{
    'url': 'https://example.com',
    'timestamp': '2024-01-15T10:30:00Z',
    'seo_metrics': {
        'structured_data_coverage': 0.85,
        'meta_completeness': 0.92,
        'header_hierarchy_score': 0.78,
        'internal_link_density': 0.65,
        'image_alt_coverage': 0.88,
        'keyword_density_score': 0.74
    },
    'llm_metrics': {
        'content_readability': 72.5,
        'semantic_html_usage': 0.81,
        'content_structure_clarity': 0.76,
        'entity_recognition_score': 0.69,
        'context_coherence': 0.83,
        'information_density': 0.72,
        'ai_parsability_score': 0.79
    },
    'performance_metrics': {
        'page_load_time': 2.34,
        'ttfb': 0.45,
        'fcp': 1.2,
        'lcp': 2.1,
        'cls': 0.05,
        'fid': 12,
        'tbt': 89
    },
    'overall_scores': {
        'seo_score': 79.7,
        'llm_score': 76.1,
        'performance_score': 85.2,
        'composite_score': 80.3
    }
}
```

### Batch Results Summary
```python
{
    'test_summary': {
        'total_urls': 5,
        'successful_tests': 5,
        'failed_tests': 0,
        'average_scores': {
            'seo': 78.4,
            'llm': 74.8,
            'performance': 81.6
        }
    },
    'top_performers': [...],
    'improvement_opportunities': [...],
    'detailed_results': [...]
}
```

## Advanced Features

### Performance Monitoring
```python
# Set up continuous monitoring
monitor = tester.setup_monitoring('https://example.com', interval_hours=24)

# Get trend analysis
trends = tester.analyze_performance_trends(url, days=30)
```

### Competitive Analysis
```python
# Compare against competitors
comparison = tester.competitive_analysis([
    'https://yoursite.com',
    'https://competitor1.com',
    'https://competitor2.com'
])
```

### Custom Metrics
```python
# Add custom evaluation criteria
def custom_accessibility_check(soup, url):
    # Custom accessibility validation
    return score

tester.add_custom_metric('accessibility', custom_accessibility_check)
```

## Reporting Options

### Console Reports
```python
# Basic console output
tester.print_summary_report(results)

# Detailed console report
tester.print_detailed_report(results)
```

### File Exports
```python
# JSON export
tester.export_json(results, 'test_results.json')

# CSV export for spreadsheet analysis
tester.export_csv(results, 'test_results.csv')

# HTML report generation
tester.generate_html_report(results, 'test_report.html')
```

### Visualization
```python
# Generate performance charts
tester.create_performance_charts(results, output_dir='charts/')

# Comparison visualizations
tester.create_comparison_charts(batch_results, output_dir='comparisons/')
```

## Integration Examples

### CI/CD Pipeline Integration
```yaml
# GitHub Actions example
name: SEO/LLM/Performance Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install -r requirements_testing.txt
      - name: Run tests
        run: python seo_llm_performance_test_suite.py --url ${{ secrets.TEST_URL }}
```

### Monitoring Dashboard
```python
# Integration with monitoring systems
from seo_llm_performance_test_suite import SEOLLMPerformanceTestSuite
import schedule
import time

def scheduled_test():
    tester = SEOLLMPerformanceTestSuite()
    results = tester.run_comprehensive_test('https://production-site.com')
    
    # Send to monitoring system
    send_to_datadog(results)
    
    # Alert on performance degradation
    if results['overall_scores']['composite_score'] < 70:
        send_alert("Performance degradation detected")

schedule.every(1).hours.do(scheduled_test)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## Troubleshooting

### Common Issues

**Selenium WebDriver Issues**
```bash
# Install ChromeDriver
brew install chromedriver  # macOS
sudo apt install chromium-chromedriver  # Ubuntu
```

**Network Timeout Errors**
```python
# Increase timeout settings
tester = SEOLLMPerformanceTestSuite(
    config={'network_timeout': 30}  # 30 seconds
)
```

**Memory Issues with Large Sites**
```python
# Enable memory optimization
tester = SEOLLMPerformanceTestSuite(
    config={'memory_optimization': True}
)
```

### Performance Optimization

**Parallel Testing**
```python
# Enable multi-threading for batch tests
results = tester.run_batch_tests(urls, parallel=True, max_workers=4)
```

**Caching**
```python
# Enable result caching
tester = SEOLLMPerformanceTestSuite(config={'enable_cache': True})
```

## Best Practices

1. **Regular Testing**: Run tests weekly or after major deployments
2. **Baseline Establishment**: Create performance baselines for comparison
3. **Threshold Monitoring**: Set up alerts for metric threshold violations
4. **Competitive Benchmarking**: Regular comparison against industry leaders
5. **Historical Tracking**: Maintain long-term performance trend data

## Support and Contributing

### Getting Help
- Check the troubleshooting section above
- Review test logs in `logs/` directory
- Open issues on the project repository

### Contributing
- Follow PEP 8 style guidelines
- Add tests for new metrics
- Update documentation for new features
- Submit pull requests with clear descriptions

## License

This testing suite is provided under the MIT License. See LICENSE file for details.

---

*Generated as part of the SingleSiteScraper SEO/LLM/Performance Testing Framework*