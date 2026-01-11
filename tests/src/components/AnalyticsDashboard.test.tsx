import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../../../src/components/AnalyticsDashboard';
import { EnhancedScrapeResult, AnalyticsInsights } from '../../../src/analytics/enhancedScraper';
import { PerformanceAlert } from '../../../src/analytics/performanceMonitor';
import { HTMLGraph } from '../../../src/analytics/htmlObjectAnalyzer';

// Mock the visualization components
vi.mock('../../../src/visualizations/DatabaseSchemaViz', () => ({
  DatabaseSchemaViz: ({ tables, onExport }: any) => (
    <div data-testid="database-schema-viz">
      <div>Database Schema Visualization</div>
      <div>Tables: {tables.length}</div>
      <button onClick={onExport}>Export Schema</button>
    </div>
  )
}));

vi.mock('../../../src/analytics/sqlMagicIntegration', () => ({
  SQLMagicIntegration: vi.fn().mockImplementation(() => ({
    getDatabaseSchema: () => [
      { name: 'html_graphs', schema: {}, indexes: [], constraints: [] },
      { name: 'html_objects', schema: {}, indexes: [], constraints: [] }
    ]
  }))
}));

// Store original createElement for cleanup
const originalCreateElement = document.createElement.bind(document);

// Mock URL methods for export functionality
beforeEach(() => {
  vi.clearAllMocks();
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mockHtmlGraph: HTMLGraph = {
  objects: new Map([
    ['obj1', {
      id: 'obj1',
      tag: 'div',
      type: 'structural',
      attributes: {},
      text: 'Test div',
      position: { depth: 0, index: 0, parent: null },
      performance: { size: 100, complexity: 1.0 },
      semanticRole: 'container',
      schemaOrgType: null
    }]
  ]),
  relationships: [
    {
      id: 'rel1',
      source: 'obj1',
      target: 'obj2',
      type: 'parent-child',
      strength: 1.0,
      metadata: {}
    }
  ],
  metadata: {
    url: 'https://test.com',
    title: 'Test Page',
    totalObjects: 1,
    totalRelationships: 1,
    analysisTime: 100,
    performance: {
      complexity: 1.5,
      efficiency: 10
    }
  }
};

const mockResult: EnhancedScrapeResult = {
  originalData: {
    title: 'Test Page',
    description: 'Test Description',
    links: [],
    images: [],
    text: [],
    metadata: {},
    events: [],
    status: { success: true }
  },
  htmlGraph: mockHtmlGraph,
  performanceMetrics: {
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
      objectCount: 1,
      relationshipCount: 1,
      complexity: 1.5,
      maxDepth: 3
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
      warningCount: 0
    }
  },
  schemaOrgData: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Test Page'
  },
  graphML: '<graphml>test</graphml>',
  url: 'https://test.com'
};

const mockInsights: AnalyticsInsights = {
  objectTypeDistribution: { 'structural': 1 },
  semanticRoleDistribution: { 'container': 1 },
  complexityAnalysis: {
    totalComplexity: 1.5,
    averageDepth: 1.0,
    maxDepth: 3,
    relationshipDensity: 1.0
  },
  performanceSummary: {
    totalTime: 3500,
    analysisTime: 1500,
    storageTime: 0,
    efficiency: 10
  },
  qualityMetrics: {
    structuredDataCoverage: 0.5,
    accessibilityScore: 0.8,
    semanticRichness: 0.6
  },
  recommendations: ['Test recommendation']
};

const mockAlerts: PerformanceAlert[] = [
  {
    id: 'alert1',
    type: 'warning',
    category: 'performance',
    message: 'High response time detected',
    value: 3000,
    threshold: 2000,
    timestamp: new Date().toISOString(),
    url: 'https://test.com'
  }
];

describe('AnalyticsDashboard', () => {
  it('shows empty state when no data provided', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('No analytics data available')).toBeInTheDocument();
    expect(screen.getByText('Enable analytics in advanced settings to see detailed insights')).toBeInTheDocument();
  });

  it('renders dashboard with data', () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={mockAlerts}
      />
    );
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Graph Analysis')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Schema.org')).toBeInTheDocument();
    expect(screen.getByText('Database Schema')).toBeInTheDocument();
  });

  it('displays alert banner when alerts exist', () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={mockAlerts}
      />
    );
    
    expect(screen.getByText('1 alert detected')).toBeInTheDocument();
    expect(screen.getByText('High response time detected')).toBeInTheDocument();
    expect(screen.getByText('performance')).toBeInTheDocument();
  });

  it('handles multiple alerts', () => {
    const multipleAlerts = [...mockAlerts, {
      id: 'alert2',
      type: 'error',
      category: 'quality',
      message: 'Low success rate',
      value: 0.5,
      threshold: 0.8,
      timestamp: new Date().toISOString(),
      url: 'https://test.com'
    }];
    
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={multipleAlerts}
      />
    );
    
    expect(screen.getByText('2 alerts detected')).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    // Should start on Overview tab
    expect(screen.getByText('Objects')).toBeInTheDocument();
    
    // Click Graph Analysis tab
    fireEvent.click(screen.getByText('Graph Analysis'));
    await waitFor(() => {
      expect(screen.getByText('Max Depth:')).toBeInTheDocument();
    });
    
    // Click Performance tab
    fireEvent.click(screen.getByText('Performance'));
    await waitFor(() => {
      expect(screen.getByText('Scraping Times')).toBeInTheDocument();
    });
    
    // Click Schema.org tab
    fireEvent.click(screen.getByText('Schema.org'));
    await waitFor(() => {
      expect(screen.getByText('Schema.org Structured Data')).toBeInTheDocument();
    });
    
    // Click Database Schema tab
    fireEvent.click(screen.getByText('Database Schema'));
    await waitFor(() => {
      expect(screen.getByText('Database Schema Visualization')).toBeInTheDocument();
    });
  });

  it('displays overview summary cards', () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // totalObjects
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Complexity')).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument(); // totalComplexity
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('3.5s')).toBeInTheDocument(); // totalTime in seconds
  });

  it('displays object type distribution', () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    expect(screen.getByText('Object Type Distribution')).toBeInTheDocument();
    expect(screen.getByText('structural')).toBeInTheDocument();
  });

  it('displays recommendations', () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Test recommendation')).toBeInTheDocument();
  });

  it('exports GraphML when button clicked', async () => {
    const mockClick = vi.fn();
    const mockElement = { click: mockClick, href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
    
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    // Go to Graph Analysis tab
    fireEvent.click(screen.getByText('Graph Analysis'));
    
    await waitFor(() => {
      const downloadButton = screen.getByText('Download GraphML');
      fireEvent.click(downloadButton);
      
      expect(mockClick).toHaveBeenCalled();
      expect(mockElement.download).toContain('graph-');
    });
  });

  it('exports insights when button clicked', async () => {
    const mockClick = vi.fn();
    const mockElement = { click: mockClick, href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
    
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    // Go to Graph Analysis tab
    fireEvent.click(screen.getByText('Graph Analysis'));
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export Insights');
      fireEvent.click(exportButton);
      
      expect(mockClick).toHaveBeenCalled();
      expect(mockElement.download).toContain('insights-');
    });
  });

  it('displays performance metrics', async () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    fireEvent.click(screen.getByText('Performance'));
    
    await waitFor(() => {
      expect(screen.getByText('Scraping Times')).toBeInTheDocument();
      expect(screen.getByText('Total Time:')).toBeInTheDocument();
      expect(screen.getByText('3500ms')).toBeInTheDocument();
      expect(screen.getByText('Fetch Time:')).toBeInTheDocument();
      expect(screen.getByText('1200ms')).toBeInTheDocument();
    });
  });

  it('displays schema.org data when available', async () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    fireEvent.click(screen.getByText('Schema.org'));
    
    await waitFor(() => {
      expect(screen.getByText('Schema.org Structured Data')).toBeInTheDocument();
      expect(screen.getByText('Export Schema')).toBeInTheDocument();
    });
  });

  it('shows empty schema.org state when no data', async () => {
    const resultWithoutSchema = { ...mockResult, schemaOrgData: undefined };
    
    render(
      <AnalyticsDashboard 
        result={resultWithoutSchema} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    fireEvent.click(screen.getByText('Schema.org'));
    
    await waitFor(() => {
      expect(screen.getByText('No schema.org data available')).toBeInTheDocument();
      expect(screen.getByText('Enable schema.org generation in advanced settings')).toBeInTheDocument();
    });
  });

  it('displays database schema visualization', async () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    fireEvent.click(screen.getByText('Database Schema'));
    
    await waitFor(() => {
      expect(screen.getByText('SQLMagic Database Schema')).toBeInTheDocument();
      expect(screen.getByTestId('database-schema-viz')).toBeInTheDocument();
      expect(screen.getByText('Schema Overview')).toBeInTheDocument();
      expect(screen.getByText('Data Flow')).toBeInTheDocument();
    });
  });

  it('handles database schema export', async () => {
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={[]}
      />
    );
    
    fireEvent.click(screen.getByText('Database Schema'));
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export Schema');
      fireEvent.click(exportButton);
      
      // Should trigger the custom export handler
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('limits alerts display to first 3', () => {
    const manyAlerts = Array.from({ length: 5 }, (_, i) => ({
      id: `alert${i}`,
      type: 'warning' as const,
      category: 'performance',
      message: `Alert ${i}`,
      value: 1000 + i,
      threshold: 1000,
      timestamp: new Date().toISOString(),
      url: 'https://test.com'
    }));
    
    render(
      <AnalyticsDashboard 
        result={mockResult} 
        insights={mockInsights} 
        alerts={manyAlerts}
      />
    );
    
    expect(screen.getByText('5 alerts detected')).toBeInTheDocument();
    expect(screen.getByText('...and 2 more')).toBeInTheDocument();
  });
});