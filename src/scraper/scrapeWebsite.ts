import { fetchWithTimeout, proxyServices } from '../utils/network.ts';
import { normalizeUrl, sleep, validateUrl } from '../utils/validators.ts';
import { ScrapedData, ScrapeOptions } from '../types/index.ts';
import {getText, getMetadata, getLinks, getTitle, getImages, getDescription} from '../utils/parse.ts';
import {parse} from 'node-html-parser';

export const scrapeWebsite = async (
  rawUrl: string,
  options: ScrapeOptions,
  setProgress: (msg: string) => void
): Promise<{ data?: ScrapedData; error?: string; url: string }> => {
  setProgress('Initializing...');
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
  const data: ScrapedData = {
    title: getTitle($),
    description: getDescription($),
    links: options.includeLinks ? getLinks($, options.maxLinks) : [],
    images: options.includeImages ? getImages($, options.maxImages) : [],
    text: options.includeText ? getText($, options.maxTextElements) : [],
    metadata: options.includeMetadata ? getMetadata($) : {},
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

