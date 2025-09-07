import { scrapeWebsite } from '../../../src/scraper/scrapeWebsite.ts';
import { ScrapeOptions } from '../../../src/types/index.ts';
import { afterEach, expect, describe, it, vi } from 'vitest';
import * as network from '../../../src/utils/network.ts';
import * as validators from '../../../src/utils/validators.ts';

vi.mock('../../../src/utils/network.ts', async () => {
  const actual = await vi.importActual('../../../src/utils/network.ts');
  return {
    ...actual,
    fetchWithPuppeteer: vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
      text: async () => '',
      json: async () => ({}),
    }),
  };
});

describe('scrapeWebsite', () => {
  const mockSetProgress = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const options: ScrapeOptions = {
    maxLinks: 10,
    maxImages: 5,
    maxTextElements: 20,
    maxEvents: 10,
    timeout: 1000,
    retryAttempts: 1,
    includeLinks: true,
    includeImages: true,
    includeText: true,
    includeMetadata: true,
    includeEvents: true
  };

  it('should return an error for an invalid URL', async () => {
    vi.spyOn(validators, 'validateUrl').mockReturnValue(false);
    const result = await scrapeWebsite('invalid-url', options, mockSetProgress);
    expect(result.error).toBe('Invalid URL');
  });

  it('should return an error if all proxies fail', async () => {
    vi.spyOn(network, 'fetchWithTimeout').mockRejectedValue(new Error('Network error'));
    const result = await scrapeWebsite('https://example.com', options, mockSetProgress);
    expect(result.error).toContain('Failed to fetch data');
  });

  it('should scrape a website successfully', async () => {
    const mockHtml = `
      <html>
        <head>
          <title>Test Title</title>
          <meta name="description" content="Test Description" />
        </head>
        <body>
          <a href="/link1">Link 1</a>
          <img src="/image1.jpg" alt="Image 1" />
          <p>Some text</p>
        </body>
      </html>
    `;
    vi.spyOn(network, 'fetchWithTimeout').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve(mockHtml),
      json: () => Promise.resolve({ contents: mockHtml }),
    });

    const result = await scrapeWebsite('https://example.com', options, mockSetProgress);

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBe('Test Title');
    expect(result.data?.description).toBe('Test Description');
    expect(result.data?.links).toHaveLength(1);
    expect(result.data?.images).toHaveLength(1);
    expect(result.data?.text).toHaveLength(1);
    expect(mockSetProgress).toHaveBeenCalledWith('Initializing...');
    expect(mockSetProgress).toHaveBeenCalledWith(expect.stringContaining('Trying'));
    expect(mockSetProgress).toHaveBeenCalledWith(expect.stringContaining('Parsing data from'));
    expect(mockSetProgress).toHaveBeenCalledWith(expect.stringContaining('Completed'));
  });
});

