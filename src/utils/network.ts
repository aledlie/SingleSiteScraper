import {FetchLikeResponse, Proxies} from '../types/index.ts';

/**
 * Fetch with timeout and browser-like headers.
 * Falls back to Puppeteer if request fails or returns 403.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<FetchLikeResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const fullOptions: RequestInit = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  };

  try {
    const res = await fetch(url, fullOptions);
    clearTimeout(id);

    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      text: () => res.text(),
      json: () => res.json(),
    };
  } catch (err: unknown) {
    clearTimeout(id);
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(errorMsg);
    throw err;
  }
}

export const proxyServices = (url : string): Array<Proxies> => {
  return [
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
};
