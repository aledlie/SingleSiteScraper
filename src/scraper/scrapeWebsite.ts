// src/scraper/scrapeWebsite.ts
import { fetchWithTimeout } from '../utils/network.ts';
import { cleanText, validateUrl, normalizeUrl, makeAbsoluteUrl, sleep } from '../utils/validators.ts';
import { ScrapedData, ScrapeOptions } from '../types/index.ts';

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

        if (proxy.name === 'AllOrigins') {
          const json = await res.json();
          responseData = json.contents || '';
        } else {
          responseData = await res.text();
        }

        if (responseData) {
          proxyUsed = proxy.name;
          break;
        }
      } catch (_) {
        setProgress(`${proxy.name} attempt ${attempt} failed. Retrying...`);
        await sleep(attempt * 1000);
      }
    }
    if (responseData) break;
  }

  if (!responseData) {
    return { error: 'All proxies failed to fetch website.', url };
  }

  setProgress('Parsing HTML...');
  const parser = new DOMParser();
  const doc = parser.parseFromString(responseData, 'text/html');

  const scrapedData: ScrapedData = {
    title: '',
    description: '',
    links: [],
    images: [],
    text: [],
    metadata: {},
    status: {
      success: true,
      contentLength: responseData.length,
      responseTime: Date.now() - startTime,
      proxyUsed,
      contentType: 'text/html',
    },
  };

  const getFromSelectors = (selectors: string[]): string => {
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const content = el.getAttribute('content') || el.textContent || '';
        const cleaned = cleanText(content);
        if (cleaned) return cleaned;
      }
    }
    return '';
  };

  scrapedData.title = getFromSelectors(['title', '[property="og:title"]', 'h1']) || 'No title found';
  scrapedData.description = getFromSelectors([
    'meta[name="description"]',
    'meta[property="og:description"]',
  ]) || 'No description found';

  if (options.includeLinks) {
    const links = Array.from(doc.querySelectorAll('a[href]'))
      .map((a) => {
        const href = a.getAttribute('href') || '';
        const text = cleanText(a.textContent || '');
        return { url: makeAbsoluteUrl(href, url), text };
      })
      .filter((l) => l.url && l.text && l.text.length < 200)
      .slice(0, options.maxLinks);
    scrapedData.links = links;
  }

  if (options.includeImages) {
    const imgs = Array.from(doc.querySelectorAll('img[src]'))
      .map((img) => {
        const src = img.getAttribute('src') || '';
        const alt = cleanText(img.getAttribute('alt') || 'Image');
        return { src: makeAbsoluteUrl(src, url), alt };
      })
      .filter((img) => img.src.startsWith('http'))
      .slice(0, options.maxImages);
    scrapedData.images = imgs;
  }

  if (options.includeText) {
    const nodes = Array.from(doc.querySelectorAll('p, h1, h2, h3'));
    const texts: Set<string> = new Set();
    for (const el of nodes) {
      const txt = cleanText(el.textContent || '');
      if (txt.length > 15 && txt.length < 1000 && !texts.has(txt)) {
        texts.add(txt);
        if (texts.size >= options.maxTextElements) break;
      }
    }
    scrapedData.text = Array.from(texts);
  }

  if (options.includeMetadata) {
    const meta = Array.from(doc.querySelectorAll('meta'));
    for (const tag of meta) {
      const name = tag.getAttribute('name') || tag.getAttribute('property') || '';
      const content = tag.getAttribute('content');
      if (name && content) {
        scrapedData.metadata[name] = cleanText(content);
      }
    }
    scrapedData.metadata['scraped-url'] = url;
    scrapedData.metadata['scraped-date'] = new Date().toISOString();
  }

  return { data: scrapedData, url };
};
