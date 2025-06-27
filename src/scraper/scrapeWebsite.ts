// src/scraper/scrapeWebsite.ts
import { fetchWithTimeout } from '../utils/network.ts';
import { cleanText, validateUrl, normalizeUrl, makeAbsoluteUrl, sleep } from '../utils/validators.ts';
import { ScrapedData, ScrapeOptions } from '../types/index.ts';
import * as cheerio from 'cheerio';

export const scrapeWebsite = async (
  rawUrl: string,
  options: ScrapeOptions,
  setProgress: (msg: string) => void
): Promise<{ data?: ScrapedData; error?: string; url: string }> => {
  const url = normalizeUrl(rawUrl);
  if (!validateUrl(url)) {
    return { error: 'Invalid URL', url };
  }

  setProgress('Initializing...');
  const startTime = Date.now();

  const proxyServices = [
    {
      name: 'AllOrigins',
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      headers: { 'Accept': 'application/json' },
    },
    {
      name: 'CORS Proxy',
      url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
      headers: { 'Accept': 'text/html' },
    },
    {
      name: 'Proxy6',
      url: `https://proxy6.workers.dev/?url=${encodeURIComponent(url)}`,
      headers: { 'Accept': 'text/html' },
    },
    {
      name: 'ThingProxy',
      url: `https://thingproxy.freeboard.io/fetch/${url}`,
      headers: { 'Accept': 'text/html' },
    },
  ];

  let responseData: string | null = null;
  let proxyUsed = '';
  let contentType = 'text/html'; // Default content type

  for (const proxy of proxyServices) {
    setProgress(`Trying ${proxy.name}...`);
    for (let attempt = 1; attempt <= options.retryAttempts; attempt++) {
      try {
        const res = await fetchWithTimeout(
          proxy.url,
          { method: 'GET', headers: proxy.headers },
          options.timeout
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        contentType = res.headers.get('content-type') || 'text/html'; // Update content type from response
        if (proxy.name === 'AllOrigins') {
          const json = await res.json();
          responseData = json.contents || '';
        } else {
          responseData = await res.text();
        }

        if (responseData) {
          proxyUsed = proxy.name;
          break; // Exit inner loop on success
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setProgress(`Attempt ${attempt} with ${proxy.name} failed: ${errorMessage}`);
        if (attempt < options.retryAttempts) {
          await sleep(1000); // Wait 1 second before retrying
        }
      }
    }
    if (responseData) break; // Exit outer loop if data is obtained
  }

  if (!responseData) {
    return { error: `Failed to fetch data after ${options.retryAttempts} attempts with all proxies`, url };
  }

  setProgress(`Parsing data from ${proxyUsed}...`);
  const $ = cheerio.load(responseData);
  const data: ScrapedData = {
    title: $('title').text() || '',
    description: $('meta[name="description"]').attr('content') || '',
    links: options.includeLinks
      ? $('a')
          .map((i, el) => ({
            text: cleanText($(el).text()),
            url: makeAbsoluteUrl(url, $(el).attr('href') || ''),
          }))
          .get()
          .slice(0, options.maxLinks)
      : [],
    images: options.includeImages
      ? $('img')
          .map((i, el) => ({
            alt: $(el).attr('alt') || '',
            src: makeAbsoluteUrl(url, $(el).attr('src') || ''),
          }))
          .get()
          .slice(0, options.maxImages)
      : [],
    text: options.includeText
      ? $('p').map((i, el) => cleanText($(el).text())).get().slice(0, options.maxTextElements)
      : [],
    metadata: options.includeMetadata
      ? {
          title: $('title').text() || '', // Include title in metadata if requested
        }
      : {},
    status: {
      success: true,
      contentLength: responseData.length,
      responseTime: Date.now() - startTime,
      proxyUsed,
      contentType,
    },
  };

  setProgress(`Completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  return { data, url };
};
