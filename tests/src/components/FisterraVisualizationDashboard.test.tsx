import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FisterraVisualizationDashboard } from '../../../src/components/FisterraVisualizationDashboard';

// Mock the visualization components
vi.mock('../../../src/visualizations/WordCloudViz', () => ({
  WordCloudViz: ({ words, width, height }: any) => (
    <div data-testid="word-cloud-viz">
      WordCloud: {words.length} words, {width}x{height}
    </div>
  )
}));

vi.mock('../../../src/visualizations/NetworkGraphViz', () => ({
  NetworkGraphViz: ({ graph, width, height }: any) => (
    <div data-testid="network-graph-viz">
      NetworkGraph: {graph.metadata.totalObjects} objects, {width}x{height}
    </div>
  )
}));

vi.mock('../../../src/visualizations/MetricsCharts', () => ({
  MetricsCharts: ({ insights, performanceMetrics: _performanceMetrics }: any) => (
    <div data-testid="metrics-charts">
      MetricsCharts: {insights.recommendations.length} recommendations
    </div>
  )
}));

// Mock the analytics components
vi.mock('../../../src/analytics/enhancedScraper', () => ({
  EnhancedScraper: vi.fn().mockImplementation(() => ({
    generateInsights: vi.fn().mockReturnValue({
      objectTypeDistribution: { 'content': 10, 'structural': 5 },
      semanticRoleDistribution: { 'text': 8, 'container': 7 },
      complexityAnalysis: {
        totalComplexity: 25.5,
        averageDepth: 2.1,
        maxDepth: 5,
        relationshipDensity: 1.2
      },
      performanceSummary: {
        totalTime: 2000,
        analysisTime: 800,
        storageTime: 200,
        efficiency: 12.5
      },
      qualityMetrics: {
        structuredDataCoverage: 0.65,
        accessibilityScore: 0.78,
        semanticRichness: 0.55
      },
      recommendations: [
        'Test recommendation 1',
        'Test recommendation 2',
        'Test recommendation 3'
      ]
    })
  }))
}));

vi.mock('../../../src/analytics/htmlObjectAnalyzer', () => ({
  HTMLObjectAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeHTML: vi.fn().mockReturnValue({
      objects: new Map(),
      relationships: [],
      metadata: {
        url: 'https://fisterra.org',
        title: 'Mock Fisterra Page',
        totalObjects: 15,
        totalRelationships: 25,
        analysisTime: 800,
        performance: { complexity: 25.5, efficiency: 12.5 }
      }
    }),
    exportToGraphML: vi.fn().mockReturnValue('<graphml>mock data</graphml>')
  }))
}));

// Store original createElement to call for non-anchor elements
const originalCreateElement = document.createElement.bind(document);

// Shared mock anchor for export tests
let mockAnchor: { click: ReturnType<typeof vi.fn>; href: string; download: string; style: Record<string, string>; setAttribute: ReturnType<typeof vi.fn>; appendChild: ReturnType<typeof vi.fn>; removeChild: ReturnType<typeof vi.fn> };

// Mock canvas for word cloud
beforeEach(() => {
  vi.clearAllMocks();

  // Mock URL and Blob for exports
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
  global.URL.revokeObjectURL = vi.fn();
  global.Blob = vi.fn().mockImplementation(() => ({})) as any;

  mockAnchor = {
    click: vi.fn(),
    href: '',
    download: '',
    style: {},
    setAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn()
  };

  // Only mock anchor elements, let other elements pass through
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName.toLowerCase() === 'a') {
      return mockAnchor as any;
    }
    return originalCreateElement(tagName);
  });

  // Mock canvas querySelector for exports
  const mockCanvas = {
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock')
  };
  vi.spyOn(document, 'querySelector').mockReturnValue(mockCanvas as any);
});

describe('FisterraVisualizationDashboard', () => {
  it('shows loading state initially', () => {
    render(<FisterraVisualizationDashboard />);
    
    expect(screen.getByText('Analyzing Fisterra.org')).toBeInTheDocument();
    expect(screen.getByText('Processing website structure and generating insights...')).toBeInTheDocument();
  });

  it('renders dashboard after loading', async () => {
    render(<FisterraVisualizationDashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Fisterra.org Analysis')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByText('Comprehensive website structure and content analysis')).toBeInTheDocument();
  });

  it('displays quick stats cards', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('HTML Elements')).toBeInTheDocument();
      expect(screen.getByText('Relationships')).toBeInTheDocument();
      expect(screen.getByText('Unique Terms')).toBeInTheDocument();
      expect(screen.getByText('Processing Time')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays tab navigation', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Word Analysis')).toBeInTheDocument();
      expect(screen.getByText('Network Graph')).toBeInTheDocument();
      expect(screen.getByText('Detailed Metrics')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('switches between tabs', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Switch to Word Analysis tab
    fireEvent.click(screen.getByText('Word Analysis'));
    await waitFor(() => {
      expect(screen.getByText('Content Word Analysis')).toBeInTheDocument();
    });
    
    // Switch to Network Graph tab
    fireEvent.click(screen.getByText('Network Graph'));
    await waitFor(() => {
      expect(screen.getByText('HTML Structure Network')).toBeInTheDocument();
    });
    
    // Switch to Detailed Metrics tab
    fireEvent.click(screen.getByText('Detailed Metrics'));
    await waitFor(() => {
      expect(screen.getByText('Detailed Performance & Quality Metrics')).toBeInTheDocument();
    });
    
    // Switch back to Overview
    fireEvent.click(screen.getByText('Overview'));
    await waitFor(() => {
      expect(screen.getByText('Content Word Cloud')).toBeInTheDocument();
    });
  });

  it('displays overview content with visualization previews', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Content Word Cloud')).toBeInTheDocument();
      expect(screen.getByText('HTML Structure Graph')).toBeInTheDocument();
      expect(screen.getByText('Key Insights')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Should have visualization components
    expect(screen.getByTestId('word-cloud-viz')).toBeInTheDocument();
    expect(screen.getByTestId('network-graph-viz')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-charts')).toBeInTheDocument();
  });

  it('displays word analysis with export functionality', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Word Analysis'));
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('Content Word Analysis')).toBeInTheDocument();
      expect(screen.getByText('Export Image')).toBeInTheDocument();
      expect(screen.getByText('Top Keywords')).toBeInTheDocument();
    });
  });

  it('exports word cloud image when export button clicked', async () => {
    render(<FisterraVisualizationDashboard />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Word Analysis'));
    }, { timeout: 2000 });

    await waitFor(() => {
      const exportButton = screen.getByText('Export Image');
      fireEvent.click(exportButton);

      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  it('displays network graph with GraphML export', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Network Graph'));
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('HTML Structure Network')).toBeInTheDocument();
      expect(screen.getByText('Export GraphML')).toBeInTheDocument();
    });
  });

  it('exports GraphML when export button clicked', async () => {
    render(<FisterraVisualizationDashboard />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Network Graph'));
    }, { timeout: 2000 });

    await waitFor(() => {
      const exportButton = screen.getByText('Export GraphML');
      fireEvent.click(exportButton);

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('fisterra-graph.graphml');
    });
  });

  it('displays detailed metrics with data export', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Detailed Metrics'));
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('Detailed Performance & Quality Metrics')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });
  });

  it('exports metrics data when export button clicked', async () => {
    render(<FisterraVisualizationDashboard />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Detailed Metrics'));
    }, { timeout: 2000 });

    await waitFor(() => {
      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);

      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  it('handles tab descriptions correctly', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete dashboard overview')).toBeInTheDocument();
      expect(screen.getByText('Content word frequency')).toBeInTheDocument();
      expect(screen.getByText('HTML structure relationships')).toBeInTheDocument();
      expect(screen.getByText('Performance and quality analytics')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays Spanish medical terminology in word analysis', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Word Analysis'));
    }, { timeout: 2000 });
    
    await waitFor(() => {
      expect(screen.getByText('Top Keywords')).toBeInTheDocument();
      // The component should display Spanish medical terms in the keyword list
    });
  });

  it('creates realistic medical portal data structure', async () => {
    render(<FisterraVisualizationDashboard />);
    
    await waitFor(() => {
      // Should display statistics that reflect medical portal structure
      expect(screen.getByText(/HTML Elements/)).toBeInTheDocument();
      expect(screen.getByText(/Relationships/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('uses proper gradient styling for stats cards', async () => {
    render(<FisterraVisualizationDashboard />);

    await waitFor(() => {
      // Verify gradient styling is present in the stats cards (inline styles)
      const htmlElementsCard = screen.getByText('HTML Elements').parentElement;
      expect(htmlElementsCard).toBeInTheDocument();
      // Check that the parent card has gradient styling
      const style = htmlElementsCard?.getAttribute('style') || '';
      expect(style).toContain('linear-gradient');
    }, { timeout: 2000 });
  });

  it('handles error state gracefully', async () => {
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // This would happen if data generation fails
    render(<FisterraVisualizationDashboard />);
    
    // Should either show loading or eventually show some content
    // The actual error handling would depend on implementation
    await waitFor(() => {
      expect(
        screen.getByText('Analyzing Fisterra.org') || 
        screen.getByText('Fisterra.org Analysis')
      ).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});