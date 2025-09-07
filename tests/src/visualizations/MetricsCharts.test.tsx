import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsCharts } from '../../../src/MetricsCharts';
import { AnalyticsInsights } from '../../../src/analytics/enhancedScraper';
import { PerformanceMetrics } from '../../../src/analytics/performanceMonitor';

const mockInsights: AnalyticsInsights = {
  objectTypeDistribution: {
    'structural': 15,
    'content': 25,
    'interactive': 8,
    'media': 3
  },
  semanticRoleDistribution: {
    'container': 10,
    'text': 20,
    'button': 5,
    'image': 3
  },
  complexityAnalysis: {
    totalComplexity: 45.7,
    averageDepth: 3.2,
    maxDepth: 8,
    relationshipDensity: 1.8
  },
  performanceSummary: {
    totalTime: 3500,
    analysisTime: 1200,
    storageTime: 300,
    efficiency: 14.5
  },
  qualityMetrics: {
    structuredDataCoverage: 0.75,
    accessibilityScore: 0.82,
    semanticRichness: 0.68
  },
  recommendations: [
    'Consider adding more semantic HTML elements',
    'Optimize image loading for better performance',
    'Add ARIA labels for better accessibility'
  ]
};

const mockPerformanceMetrics: PerformanceMetrics = {
  id: 'test-metrics',
  url: 'https://test.com',
  timestamp: new Date().toISOString(),
  scraping: {
    totalTime: 3500,
    fetchTime: 1200,
    parseTime: 800,
    analysisTime: 1500,
    retryAttempts: 0,
    proxyUsed: 'Direct'
  },
  content: {
    htmlSize: 50000,
    objectCount: 51,
    relationshipCount: 92,
    complexity: 45.7,
    maxDepth: 8
  },
  network: {
    responseTime: 1200,
    contentLength: 50000,
    contentType: 'text/html',
    statusCode: 200
  },
  quality: {
    successRate: 1.0,
    dataCompleteness: 0.95,
    errorCount: 0,
    warningCount: 2
  }
};

describe('MetricsCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    expect(screen.getByText('Total Elements')).toBeInTheDocument();
  });

  it('displays KPI cards with correct values', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    // Total elements (sum of object types)
    expect(screen.getByText('51')).toBeInTheDocument();
    expect(screen.getByText('Total Elements')).toBeInTheDocument();
    
    // Complexity score
    expect(screen.getByText('45.7')).toBeInTheDocument();
    expect(screen.getByText('Complexity Score')).toBeInTheDocument();
    
    // Processing time
    expect(screen.getByText('3.5s')).toBeInTheDocument();
    expect(screen.getByText('Processing Time')).toBeInTheDocument();
    
    // Max DOM depth
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Max DOM Depth')).toBeInTheDocument();
  });

  it('displays element type distribution chart', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    expect(screen.getByText('Element Type Distribution')).toBeInTheDocument();
    expect(screen.getByText('4 Types')).toBeInTheDocument();
    
    // Check individual type counts
    expect(screen.getByText('structural')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.getByText('interactive')).toBeInTheDocument();
    expect(screen.getByText('media')).toBeInTheDocument();
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays quality metrics with percentages', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    expect(screen.getByText('Quality Metrics')).toBeInTheDocument();
    expect(screen.getByText('Structured Data Coverage')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Score')).toBeInTheDocument();
    expect(screen.getByText('Semantic Richness')).toBeInTheDocument();
    
    // Check percentage values
    expect(screen.getByText('75.0%')).toBeInTheDocument(); // structuredDataCoverage
    expect(screen.getByText('82.0%')).toBeInTheDocument(); // accessibilityScore
    expect(screen.getByText('68.0%')).toBeInTheDocument(); // semanticRichness
  });

  it('displays performance breakdown', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    expect(screen.getByText('Performance Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Fetch Time')).toBeInTheDocument();
    expect(screen.getByText('Parse Time')).toBeInTheDocument();
    expect(screen.getByText('Analysis Time')).toBeInTheDocument();
    expect(screen.getByText('Efficiency:')).toBeInTheDocument();
    expect(screen.getByText('14.5 elements/second')).toBeInTheDocument();
  });

  it('displays content analysis section', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    expect(screen.getByText('Content Analysis')).toBeInTheDocument();
    expect(screen.getByText('HTML Size')).toBeInTheDocument();
    expect(screen.getByText('Relationship Density')).toBeInTheDocument();
    expect(screen.getByText('Average Depth')).toBeInTheDocument();
    expect(screen.getByText('Total Relationships')).toBeInTheDocument();
    
    // Check calculated values
    expect(screen.getByText('48.8KB')).toBeInTheDocument(); // HTML size in KB
    expect(screen.getByText('1.80')).toBeInTheDocument(); // Relationship density
    expect(screen.getByText('3.2')).toBeInTheDocument(); // Average depth
    expect(screen.getByText('92')).toBeInTheDocument(); // Total relationships
  });

  it('displays top recommendations', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    expect(screen.getByText('Top Recommendations:')).toBeInTheDocument();
    
    // Check that recommendations are displayed (first 3)
    expect(screen.getByText('Consider adding more semantic HTML elements')).toBeInTheDocument();
    expect(screen.getByText('Optimize image loading for better performance')).toBeInTheDocument();
    expect(screen.getByText('Add ARIA labels for better accessibility')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics}
        className="custom-metrics"
      />
    );
    
    expect(container.firstChild).toHaveClass('metrics-charts', 'custom-metrics');
  });

  it('handles missing parseTime gracefully', () => {
    const metricsWithoutParseTime = {
      ...mockPerformanceMetrics,
      scraping: {
        ...mockPerformanceMetrics.scraping,
        parseTime: undefined as any
      }
    };
    
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={metricsWithoutParseTime} 
      />
    );
    
    expect(screen.getByText('Parse Time')).toBeInTheDocument();
  });

  it('calculates efficiency correctly', () => {
    render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    // Efficiency should be objectCount / (totalTime in seconds)
    // 51 objects / 3.5 seconds = 14.57... ≈ 14.5 elements/second
    expect(screen.getByText('14.5 elements/second')).toBeInTheDocument();
  });

  it('displays donut chart with correct data structure', () => {
    const { container } = render(
      <MetricsCharts 
        insights={mockInsights} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    // Should contain SVG for donut chart
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Should contain circles for each data segment
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(4); // One for each object type
  });

  it('handles empty recommendations array', () => {
    const insightsWithoutRecommendations = {
      ...mockInsights,
      recommendations: []
    };
    
    render(
      <MetricsCharts 
        insights={insightsWithoutRecommendations} 
        performanceMetrics={mockPerformanceMetrics} 
      />
    );
    
    expect(screen.getByText('Top Recommendations:')).toBeInTheDocument();
    // No recommendation text should be present
    expect(screen.queryByText('Consider adding more semantic HTML elements')).not.toBeInTheDocument();
  });
});