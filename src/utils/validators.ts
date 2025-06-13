export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const normalizeUrl = (inputUrl: string): string => {
  let normalized = inputUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
};

export const makeAbsoluteUrl = (relativeUrl: string, baseUrl: string): string => {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
};

export const cleanText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
    .trim();
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

