import {FetchLikeResponse, Proxies} from '../types/index.ts';
import { validateUrl, sanitizeUrl } from './validators.ts';

/**
 * Fetch with timeout and browser-like headers.
 * Falls back to Puppeteer if request fails or returns 403.
 */
/**
 * Enhanced fetch with security validations, timeout, and rate limiting
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<FetchLikeResponse> {
  // Validate and sanitize URL
  const sanitizedUrl = sanitizeUrl(url);
  if (!sanitizedUrl || !validateUrl(sanitizedUrl)) {
    throw new Error('Security violation: Invalid or potentially dangerous URL');
  }
  
  // Rate limiting check
  const identifier = new URL(sanitizedUrl).hostname;
  if (!checkRateLimit(identifier)) {
    throw new Error('Rate limit exceeded for this domain');
  }
  
  // Enforce reasonable timeout limits (min 1s, max 30s)
  const safeTimeout = Math.min(Math.max(timeout, 1000), 30000);
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), safeTimeout);

  const fullOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'User-Agent': 'SingleSiteScraper/1.0 (Security-Enhanced)',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    },
    signal: controller.signal,
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    ...options,
  };

  try {
    const res = await fetch(sanitizedUrl, fullOptions);
    clearTimeout(id);
    
    // Validate response size to prevent memory exhaustion
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Response too large - potential security risk');
    }

    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      text: async () => {
        const text = await res.text();
        // Basic length check for text responses
        if (text.length > 10 * 1024 * 1024) { // 10MB text limit
          throw new Error('Text response too large');
        }
        return text;
      },
      json: () => res.json(),
    };
  } catch (err: unknown) {
    clearTimeout(id);
    
    // Sanitize error messages to prevent information disclosure
    if (err instanceof Error) {
      const sanitizedMessage = err.message
        .replace(/https?:\/\/[^\s]+/gi, '[URL_REDACTED]')
        .replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP_REDACTED]')
        .replace(/password|token|key|secret/gi, '[CREDENTIAL_REDACTED]');
      
      throw new Error(sanitizedMessage);
    }
    
    throw new Error('Network request failed');
  }
}

/**
 * Secure proxy services with enhanced validation
 * Replaced third-party proxies with safer alternatives
 */
export const proxyServices = (url: string): Array<Proxies> => {
  // Validate URL before creating proxy requests
  const sanitizedUrl = sanitizeUrl(url);
  if (!sanitizedUrl || !validateUrl(sanitizedUrl)) {
    throw new Error('Invalid or potentially dangerous URL provided');
  }
  
  return [
    // Direct fetch - preferred method
    {
      name: 'Direct',
      url: sanitizedUrl,
    },
    // Only use trusted CORS proxies as fallback
    {
      name: 'CORS-Anywhere-Backup',
      url: `https://cors-anywhere.herokuapp.com/${encodeURIComponent(sanitizedUrl)}`,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    }
  ];
};

/**
 * Rate limiter to prevent abuse
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = identifier;
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT) {
    return false;
  }
  
  current.count++;
  return true;
}
