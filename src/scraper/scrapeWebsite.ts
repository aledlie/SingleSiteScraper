import { fetchWithTimeout, proxyServices } from '../utils/network.ts';
import { normalizeUrl, sleep, validateUrl } from '../utils/validators.ts';
import { ScrapedData, ScrapeOptions } from '../types/index.ts';
import {getText, getMetadata, getLinks, getTitle, getImages, getDescription, getWebSite, getWebPage} from '../utils/parse.ts';
import {parse} from 'node-html-parser';
import { extractEvents } from '../utils/parseEvents.ts';
import { EnhancedScraper, EnhancedScrapingOptions } from './enhancedScraper';

// Legacy scraping function - maintained for backwards compatibility
export const scrapeWebsiteLegacy = async (
  rawUrl: string,
  options: ScrapeOptions,
  setProgress: (msg: string) => void
): Promise<{ data?: ScrapedData; error?: string; url: string }> => {
  setProgress('Initializing legacy scraper...');
  const startTime = Date.now();
  let response: string | null = null;
  let contentType = 'text/html';

  // validate user input
  const url = normalizeUrl(rawUrl);
  if (!validateUrl(url)) {
    return { error: 'Invalid URL', url };
  }

  // Use multiple proxyServices to try and read websites fast, with fallbacks
  const retries = options.retryAttempts;
  const proxies = proxyServices(url);
  let proxyUsed = '';

  for (const proxy of proxies) {
    setProgress(`Trying ${proxy.name}...`);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {

        // fetch
        const responseData = await fetchWithTimeout(
          proxy.url,
          { method: 'GET', headers: proxy.headers },
          options.timeout
        );
        if (!responseData.ok) {
          throw new Error(`HTTP ${responseData.status}`);
        }

        // normalize response w/ contentType from responseData
        contentType = responseData.headers.get('content-type') || 'text/html';
        proxyUsed = proxy.name;
        if (proxy.name === 'AllOrigins') {
          const json = await responseData.json();
          if (typeof json === 'object' && json !== null && 'contents' in json) {
            response = (json as { contents?: string }).contents || '';
          }
        } else {
          response = await responseData.text();
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setProgress(`Attempt ${attempt} with ${proxy.name} failed: ${errorMessage}`);
        if (attempt < retries) {
          await sleep(1000);
        }
      }
      if (response) break; // stop retries
    }
    if (response) break; // Exit outer loop if data is obtained
  }
  if (!response || (typeof response === 'string' && response.trim().length === 0)) {
    return { error: `Failed to fetch data after ${retries} attempts with all proxies`, url };
  }
  setProgress(`Parsing data from ${proxyUsed}...`);
  const $ = parse(response);

  // Create schema.org structured data
  const webSite = getWebSite($, url);
  const webPage = getWebPage($, url, webSite);

  const data: ScrapedData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    title: getTitle($),
    description: getDescription($),
    links: options.includeLinks ? getLinks($, options.maxLinks) : [],
    images: options.includeImages ? getImages($, options.maxImages) : [],
    text: options.includeText ? getText($, options.maxTextElements) : [],
    metadata: options.includeMetadata ? getMetadata($) : {},
    events: options.includeEvents ? extractEvents(response): [],
    webSite: webSite,
    webPage: webPage,
    status: {
      success: true,
      contentLength: response ? response.length : 0,
      responseTime: Date.now() - startTime,
      proxyUsed,
      contentType,
    },
  };

  setProgress(`Completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  return { data, url };
};

// Enhanced scraping function with modern provider system
let enhancedScraper: EnhancedScraper | null = null;

export const scrapeWebsite = async (
  rawUrl: string,
  options: ScrapeOptions & { useEnhancedScraper?: boolean; enhancedOptions?: Partial<EnhancedScrapingOptions> },
  setProgress: (msg: string) => void
): Promise<{ data?: ScrapedData; error?: string; url: string }> => {
  
  // Allow opt-out to legacy scraper
  if (options.useEnhancedScraper === false) {
    setProgress('Using legacy scraper (as requested)...');
    return scrapeWebsiteLegacy(rawUrl, options, setProgress);
  }

  const startTime = Date.now();
  const url = normalizeUrl(rawUrl);
  
  if (!validateUrl(url)) {
    return { error: 'Invalid URL', url };
  }

  try {
    // Initialize enhanced scraper if not already done
    if (!enhancedScraper) {
      setProgress('Initializing enhanced scraper with modern providers...');
      enhancedScraper = new EnhancedScraper({
        strategy: 'cost-optimized',
        maxCostPerRequest: 0.01,
      });
    }

    // Convert legacy options to enhanced options
    const enhancedOptions: EnhancedScrapingOptions = {
      timeout: options.requestTimeout || 30000,
      strategy: options.enhancedOptions?.strategy || 'cost-optimized',
      maxCostPerRequest: options.enhancedOptions?.maxCostPerRequest || 0.01,
      maxRetries: options.retryAttempts || 3,
      stealth: true,
      blockResources: true,
      ...options.enhancedOptions,
    };

    setProgress('Scraping with intelligent provider fallback...');
    
    const result = await enhancedScraper.scrape(url, enhancedOptions);
    
    setProgress('Processing scraped content...');
    
    // Parse the HTML using existing parsing logic
    const root = parse(result.html);
    
    const data: ScrapedData = {
      url: result.url,
      title: getTitle(root),
      description: getDescription(root),
      text: getText(root),
      links: getLinks(root, result.url),
      images: getImages(root, result.url),
      metadata: getMetadata(root),
      events: extractEvents(result.html),
      webSite: getWebSite(root, result.url),
      webPage: getWebPage(root, result.url),
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      status: {
        success: true,
        provider: result.provider,
        contentLength: result.html.length,
        responseTime: result.responseTime,
        proxyUsed: result.provider,
        contentType: 'text/html',
        cost: result.cost,
      },
    };

    setProgress(`✅ Enhanced scraping completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s with ${result.provider}`);
    
    return { data, url: result.url };

  } catch (error) {
    // Fallback to legacy scraper if enhanced scraper fails
    console.warn('Enhanced scraper failed, falling back to legacy:', error);
    setProgress('Enhanced scraper failed, using legacy fallback...');
    return scrapeWebsiteLegacy(rawUrl, options, setProgress);
  }
};

