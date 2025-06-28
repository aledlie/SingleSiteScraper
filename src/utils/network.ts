import puppeteer from 'puppeteer';
import {FetchLikeResponse} from '../types/index.ts';

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

    if (res.status === 403) {
      console.warn(`403 Forbidden from ${url}, falling back to Puppeteer...`);
      return await fetchWithPuppeteer(url);
    }

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
    console.warn(`Fetch failed (${errorMsg}), falling back to Puppeteer...`);
    return await fetchWithPuppeteer(url);
  }
}

/**
 * Puppeteer fallback when fetch fails or is blocked.
 */
async function fetchWithPuppeteer(url: string): Promise<FetchLikeResponse> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    const html = await page.content();

    const headers = new Headers({ 'content-type': 'text/html' });

    return {
      ok: true,
      status: 200,
      headers,
      text: async () => html,
      json: async () => {
        try {
          return JSON.parse(html);
        } catch {
          throw new Error('Invalid JSON returned from Puppeteer');
        }
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Puppeteer error: ${errorMsg}`);
    return {
      ok: false,
      status: 500,
      headers: new Headers(),
      text: async () => '',
      json: async () => {
        throw new Error('No JSON available due to Puppeteer failure');
      },
    };
  } finally {
    await browser.close();
  }
}

