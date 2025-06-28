// src/scraper/scrapeWebsite.ts
import { fetchWithTimeout } from '../utils/network.ts';
import { cleanText, normalizeUrl, makeAbsoluteUrl, sleep } from '../utils/validators.ts';
import { ScrapedData, ScrapeOptions } from '../types/index.ts';
import * as cheerio from 'cheerio';

export const scrapeWebsite = async (
  rawUrl: string,
  options: ScrapeOptions,
  setProgress: (msg: string) => void
): Promise<{ data?: ScrapedData; error?: string; url: string }> => {
  setProgress('Initializing...');
  const url = normalizeUrl(rawUrl);

  const retries = options.retryAttempts;
  const startTime = Date.now();

  const proxyServices = [
    {
      name: 'AllOrigins',
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'CORS Proxy',
      url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache'
      }
    },
    {
      name: 'Proxy6',
      url: `https://proxy6.workers.dev/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'ThingProxy',
      url: `https://thingproxy.freeboard.io/fetch/${url}`,
    },
  ];

  let response: string | null = null;
  const proxyUsed = '';
  let contentType = 'text/html'; // Default content type
  const content: string | null = null;

  for (const proxy of proxyServices) {
    setProgress(`Trying ${proxy.name}...`);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const responseData = await fetchWithTimeout(
          proxy.url,
          { method: 'GET', headers: proxy.headers },
          options.timeout
        );
        if (!responseData.ok) throw new Error(`HTTP ${responseData.status}`);

        contentType = responseData.headers.get('content-type') || 'text/html'; // Update content type from response

        // Handle different proxy response formats
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
        setProgress(`Attempt ${attempt} with ${proxyUsed} failed: ${errorMessage}`);
        if (attempt < retries) {
          await sleep(1000); // Wait 1 second before retrying
        }
      }
      if (response) break; // stop retries 
    }
    if (response) break; // Exit outer loop if data is obtained
  }

  // Validate response data
  if (!response || (typeof response === 'string' && response.trim().length === 0)) {
    return { error: `Failed to fetch data after ${retries} attempts with all proxies`, url };
  }

  setProgress(`Parsing data from ${proxyUsed}...`);
  const $ = cheerio.load(response);
  const data: ScrapedData = {
    title: $('title').text() || '',
    description: $('meta[name="description"]').attr('content') || '',
    links: options.includeLinks
      ? $('a')
          .map((_, el) => ({
            text: cleanText($(el).text()),
            url: makeAbsoluteUrl(url, $(el).attr('href') || ''),
          }))
          .get()
          .slice(0, options.maxLinks)
      : [],
    images: options.includeImages
      ? $('img')
          .map((_, el) => ({
            alt: $(el).attr('alt') || '',
            src: makeAbsoluteUrl(url, $(el).attr('src') || ''),
          }))
          .get()
          .slice(0, options.maxImages)
      : [],
    text: options.includeText
      ? $('p').map((_, el) => cleanText($(el).text())).get().slice(0, options.maxTextElements)
      : [],
    metadata: options.includeMetadata
      ? {
          title: $('title').text() || '', // Include title in metadata if requested
        }
      : {},
    status: {
      success: true,
      contentLength: content ? content.length : 0,
      responseTime: Date.now() - startTime,
      proxyUsed,
      contentType,
    },
  };

  setProgress(`Completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  return { data, url };
};

