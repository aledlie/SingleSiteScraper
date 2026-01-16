import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WebScraper from '../../../src/components/WebScraper';
import * as scrapeWebsiteModule from '../../../src/scraper/scrapeWebsite';

// Mock the scrapeWebsite function
vi.mock('../../../src/scraper/scrapeWebsite', () => ({
  scrapeWebsite: vi.fn()
}));

describe('WebScraper', () => {
  const mockScrapedData = {
    url: 'https://example.com',
    title: 'Example Site',
    text: ['Example content'],
    links: [{ href: 'https://example.com/page', text: 'Page' }],
    images: [{
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      url: 'https://example.com/image.jpg',
      contentUrl: 'https://example.com/image.jpg',
      name: 'Image',
      alternateName: 'Image alt',
      description: 'Image description'
    }],
    metadata: {
      title: 'Example Site',
      description: 'An example website'
    },
    events: [{
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Test Event',
      startDate: '2025-06-15T09:00:00Z',
      description: 'A test event',
      eventType: 'conference',
      eventStatus: 'EventScheduled',
      eventAttendanceMode: 'OfflineEventAttendanceMode'
    }]
  };

  const getUrlInput = (container: HTMLElement) => {
    const label = Array.from(container.querySelectorAll('.form-label'))
      .find(el => el.textContent === 'Website URL');
    return label?.closest('div')?.querySelector('input');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (scrapeWebsiteModule.scrapeWebsite as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockScrapedData,
      error: null
    });
  });

  it('renders the URL input field', () => {
    render(<WebScraper />);
    expect(screen.getByText('Website URL')).toBeInTheDocument();
  });

  it('renders the scrape button', () => {
    render(<WebScraper />);
    expect(screen.getByRole('button', { name: /scrape website/i })).toBeInTheDocument();
  });

  it('updates URL input value on change', () => {
    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);

    fireEvent.change(input!, { target: { value: 'https://example.com' } });

    expect(input).toHaveValue('https://example.com');
  });

  it('shows loading state when scraping', async () => {
    (scrapeWebsiteModule.scrapeWebsite as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: mockScrapedData }), 100))
    );

    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);
    const button = screen.getByRole('button', { name: /scrape website/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    const scrapingButton = screen.getByRole('button', { name: /scraping/i });
    expect(scrapingButton).toBeInTheDocument();
    expect(scrapingButton).toBeDisabled();
  });

  it('displays scraped data after successful scrape', async () => {
    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);
    const button = screen.getByRole('button', { name: /scrape website/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
    });
  });

  it('displays error message on scrape failure', async () => {
    (scrapeWebsiteModule.scrapeWebsite as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: 'Failed to fetch website'
    });

    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);
    const button = screen.getByRole('button', { name: /scrape website/i });

    fireEvent.change(input!, { target: { value: 'https://invalid.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Scraping Failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch website')).toBeInTheDocument();
    });
  });

  it('handles exception during scrape', async () => {
    (scrapeWebsiteModule.scrapeWebsite as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);
    const button = screen.getByRole('button', { name: /scrape website/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Scraping Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows advanced settings button in basic mode', () => {
    render(<WebScraper mode="basic" />);
    expect(screen.getByRole('button', { name: /show advanced settings/i })).toBeInTheDocument();
  });

  it('toggles advanced settings visibility', () => {
    render(<WebScraper mode="basic" />);
    const toggleButton = screen.getByRole('button', { name: /show advanced settings/i });

    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /hide advanced settings/i })).toBeInTheDocument();
    expect(screen.getByText(/scraping options/i)).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /show advanced settings/i })).toBeInTheDocument();
  });

  it('does not show advanced settings button in enhanced mode', () => {
    render(<WebScraper mode="enhanced" />);
    expect(screen.queryByRole('button', { name: /show advanced settings/i })).not.toBeInTheDocument();
  });

  it('shows filter input after successful scrape', async () => {
    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);
    const button = screen.getByRole('button', { name: /scrape website/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Filter results')).toBeInTheDocument();
    });
  });

  it('triggers scrape on Enter key press', async () => {
    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.keyDown(input!, { key: 'Enter' });

    await waitFor(() => {
      expect(scrapeWebsiteModule.scrapeWebsite).toHaveBeenCalled();
    });
  });

  it('exports JSON when export button is clicked', async () => {
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a');
        anchor.click = mockClick;
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    const { container } = render(<WebScraper />);
    const input = getUrlInput(container);
    const scrapeButton = screen.getByRole('button', { name: /scrape website/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(scrapeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export json/i });
    fireEvent.click(exportButton);

    expect(mockClick).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('passes options to scrapeWebsite function', async () => {
    const { container } = render(<WebScraper mode="basic" />);

    // Show advanced settings
    fireEvent.click(screen.getByRole('button', { name: /show advanced settings/i }));

    const input = getUrlInput(container);
    const button = screen.getByRole('button', { name: /scrape website/i });

    fireEvent.change(input!, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(scrapeWebsiteModule.scrapeWebsite).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          includeText: true,
          includeLinks: true,
          includeImages: true,
          includeMetadata: true
        }),
        expect.any(Function)
      );
    });
  });
});
