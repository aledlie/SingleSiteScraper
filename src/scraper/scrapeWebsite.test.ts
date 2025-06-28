import { scrapeWebsite } from '../scraper/scrapeWebsite.ts';
import { validateUrl } from '../utils/validators.ts';
import { ScrapeOptions} from '../types/index.ts';
import { vi } from 'vitest';

// Mock the fetchWithTimeout function
vi.mock('../utils/network.ts', () => ({
  fetchWithTimeout: vi.fn(),
}));

// Mock the validators
vi.mock('../utils/validators.ts', () => ({
  cleanText: vi.fn((text) => text),
  validateUrl: vi.fn(() => true),
  normalizeUrl: vi.fn((url) => url),
  makeAbsoluteUrl: vi.fn((base, path) => `${base}${path}`),
  sleep: vi.fn(),
}));

describe('scrapeWebsite', async () => {
  const mockSetProgress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an error for an invalid URL', async () => {
    vi.mocked(validateUrl).mockReturnValueOnce(false);
  });

  const options: ScrapeOptions = {
    maxLinks: 10,
    maxImages: 5,
    maxTextElements: 20,
    timeout: 10,
    retryAttempts: 4,
    includeLinks: true,
    includeImages: false,
    includeText: true,
    includeMetadata: false,
  };

  test('should scrape website successfully', async () => {
  try {
    const result = await scrapeWebsite('https://danceplace.org', options, mockSetProgress);
    expect(result.url).toBe('https://danceplace.org');
    expect(result.error).toBeUndefined();
    expect(mockSetProgress).toHaveBeenCalled(); // Optional: check if progress was updated
  } catch (error) {
    console.error('Error during successful scrape test:', error);
    throw error; // Re-throw to fail the test if an error occurs
  }
  });
/*
  expect(result.data).toBeDefined();
  expect(result.data).toBe(typeof ScrapedData);
  expect(result.data?.status.success).toBe(true);
  expect(mockSetProgress).toHaveBeenCalledWith('Initializing...');
  expect(mockSetProgress).toHaveBeenCalledWith(expect.stringContaining('Completed'));
*/
});

