import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the lazy-loaded AnalyticsDashboard
vi.mock('../../../src/components/AnalyticsDashboard', () => ({
  AnalyticsDashboard: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>
}));

// Mock the EnhancedScraper class
const mockScrape = vi.fn();
const mockGetPerformanceMonitor = vi.fn();
const mockGenerateInsights = vi.fn();
const mockExportAnalyticsData = vi.fn();
const mockInitializeSQLIntegration = vi.fn();

vi.mock('../../../src/analytics/enhancedScraper', () => ({
  EnhancedScraper: vi.fn().mockImplementation(() => ({
    scrape: mockScrape,
    getPerformanceMonitor: mockGetPerformanceMonitor,
    generateInsights: mockGenerateInsights,
    exportAnalyticsData: mockExportAnalyticsData,
    initializeSQLIntegration: mockInitializeSQLIntegration
  }))
}));

// Import the component after mocking
import EnhancedWebScraper from '../../../src/components/EnhancedWebScraper';

describe('EnhancedWebScraper', () => {
  const mockScrapeResult = {
    data: {
      url: 'https://example.com',
      title: 'Example',
      text: ['content'],
      links: [],
      images: [],
      metadata: {},
      events: []
    },
    htmlGraph: {
      nodes: [],
      edges: [],
      metadata: {
        totalObjects: 50,
        totalRelationships: 25,
        processingTime: 1000
      }
    },
    performanceMetrics: {
      pageLoadTime: 1000,
      timeToFirstByte: 100,
      domContentLoaded: 500,
      networkRequests: 10,
      totalTransferSize: 1000000,
      resourceMetrics: {}
    },
    error: null
  };

  const mockInsights = {
    totalElements: 100,
    uniqueSelectors: 50,
    averageDepth: 3.5,
    topElements: [{ type: 'div', count: 50 }],
    performanceScore: 85,
    recommendations: ['Optimize images']
  };

  const getUrlInput = (container: HTMLElement) => {
    const label = Array.from(container.querySelectorAll('.form-label'))
      .find(el => el.textContent === 'Website URL');
    return label?.closest('div')?.querySelector('input');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockScrape.mockResolvedValue(mockScrapeResult);
    mockGenerateInsights.mockReturnValue(mockInsights);
    mockGetPerformanceMonitor.mockReturnValue({
      getAlerts: () => []
    });
    mockExportAnalyticsData.mockResolvedValue('{"data": "test"}');
    mockInitializeSQLIntegration.mockResolvedValue(true);
  });

  it('renders the component', () => {
    render(<EnhancedWebScraper />);
    expect(screen.getByText('Website URL')).toBeInTheDocument();
  });

  it('renders the scraper view toggle', () => {
    render(<EnhancedWebScraper />);
    expect(screen.getByRole('button', { name: /scraper/i })).toBeInTheDocument();
  });

  it('renders the analytics view toggle', () => {
    render(<EnhancedWebScraper />);
    expect(screen.getByRole('button', { name: /roi analysis/i })).toBeInTheDocument();
  });

  it('renders the enhanced scrape button', () => {
    render(<EnhancedWebScraper />);
    expect(screen.getByRole('button', { name: /enhanced scrape/i })).toBeInTheDocument();
  });

  it('updates URL input value on change', () => {
    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    expect(input).toHaveValue('https://example.com');
  });

  it('shows analytics settings toggle button', () => {
    render(<EnhancedWebScraper />);
    expect(screen.getByRole('button', { name: /show analytics settings/i })).toBeInTheDocument();
  });

  it('toggles analytics settings visibility', () => {
    render(<EnhancedWebScraper />);
    const toggleButton = screen.getByRole('button', { name: /show analytics settings/i });

    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /hide analytics settings/i })).toBeInTheDocument();
    expect(screen.getByText('Enable HTML Analysis')).toBeInTheDocument();
  });

  it('shows loading state when scraping', async () => {
    mockScrape.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockScrapeResult), 100))
    );

    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);
    const scrapeButton = screen.getByRole('button', { name: /enhanced scrape/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(scrapeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
    });
  });

  it('calls scrape function when scrape button is clicked', async () => {
    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);
    const scrapeButton = screen.getByRole('button', { name: /enhanced scrape/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(scrapeButton);

    await waitFor(() => {
      expect(mockScrape).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  it('displays error message on scrape failure', async () => {
    mockScrape.mockResolvedValue({
      ...mockScrapeResult,
      error: 'Scraping failed'
    });

    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);
    const scrapeButton = screen.getByRole('button', { name: /enhanced scrape/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(scrapeButton);

    await waitFor(() => {
      expect(screen.getByText('Scraping Failed')).toBeInTheDocument();
      expect(screen.getByText('Scraping failed')).toBeInTheDocument();
    });
  });

  it('handles exception during scrape', async () => {
    mockScrape.mockRejectedValue(new Error('Network error'));

    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);
    const scrapeButton = screen.getByRole('button', { name: /enhanced scrape/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(scrapeButton);

    await waitFor(() => {
      expect(screen.getByText('Scraping Failed')).toBeInTheDocument();
    });
  });

  it('triggers scrape on Enter key press', async () => {
    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.keyDown(input!, { key: 'Enter' });

    await waitFor(() => {
      expect(mockScrape).toHaveBeenCalled();
    });
  });

  it('generates insights after successful scrape', async () => {
    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);
    const scrapeButton = screen.getByRole('button', { name: /enhanced scrape/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(scrapeButton);

    await waitFor(() => {
      expect(mockGenerateInsights).toHaveBeenCalledWith(mockScrapeResult);
    });
  });

  it('switches to analytics view after successful scrape', async () => {
    const { container } = render(<EnhancedWebScraper />);
    const input = getUrlInput(container);
    const scrapeButton = screen.getByRole('button', { name: /enhanced scrape/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(scrapeButton);

    await waitFor(() => {
      // After scrape, the analytics button should be enabled
      const analyticsButton = screen.getByRole('button', { name: /roi analysis/i });
      expect(analyticsButton).not.toBeDisabled();
    });
  });

  describe('Analytics Settings', () => {
    it('shows Enable HTML Analysis checkbox when settings are visible', async () => {
      render(<EnhancedWebScraper />);
      fireEvent.click(screen.getByRole('button', { name: /show analytics settings/i }));

      expect(screen.getByText('Enable HTML Analysis')).toBeInTheDocument();
    });

    it('shows Performance Monitoring checkbox when settings are visible', async () => {
      render(<EnhancedWebScraper />);
      fireEvent.click(screen.getByRole('button', { name: /show analytics settings/i }));

      expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    });

    it('shows Generate GraphML checkbox when settings are visible', async () => {
      render(<EnhancedWebScraper />);
      fireEvent.click(screen.getByRole('button', { name: /show analytics settings/i }));

      expect(screen.getByText('Generate GraphML')).toBeInTheDocument();
    });

    it('shows Generate Schema.org checkbox when settings are visible', async () => {
      render(<EnhancedWebScraper />);
      fireEvent.click(screen.getByRole('button', { name: /show analytics settings/i }));

      expect(screen.getByText('Generate Schema.org')).toBeInTheDocument();
    });

    it('shows Enable SQL Storage checkbox when settings are visible', async () => {
      render(<EnhancedWebScraper />);
      fireEvent.click(screen.getByRole('button', { name: /show analytics settings/i }));

      expect(screen.getByText('Enable SQL Storage')).toBeInTheDocument();
    });
  });

  describe('View Toggle', () => {
    it('switches to scraper view when scraper button is clicked', () => {
      render(<EnhancedWebScraper />);
      const scraperButton = screen.getByRole('button', { name: /scraper/i });

      fireEvent.click(scraperButton);

      expect(screen.getByText('Website URL')).toBeInTheDocument();
    });

    it('analytics view button is disabled when no results', () => {
      render(<EnhancedWebScraper />);
      const analyticsButton = screen.getByRole('button', { name: /roi analysis/i });

      expect(analyticsButton).toBeDisabled();
    });
  });
});
