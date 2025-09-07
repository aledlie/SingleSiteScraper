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

/**
 * Comprehensive HTML sanitization to prevent XSS attacks
 * Removes dangerous HTML elements, attributes, and JavaScript content
 */
export const cleanText = (responseData: any): string => {
  let text = typeof responseData === 'string' ? responseData : String(responseData);
  
  // Step 1: Remove all potentially dangerous HTML elements (case-insensitive)
  const dangerousElements = [
    'script', 'style', 'iframe', 'object', 'embed', 'applet', 
    'form', 'input', 'textarea', 'select', 'button', 'link', 
    'meta', 'base', 'title', 'noscript', 'svg', 'math'
  ];
  
  dangerousElements.forEach(element => {
    // Remove opening and closing tags with any attributes (case-insensitive)
    const regex = new RegExp(`<\\s*${element}\\s*[^>]*>[\\s\\S]*?<\\s*\\/\\s*${element}\\s*>`, 'gi');
    text = text.replace(regex, '');
    // Remove self-closing tags
    const selfClosingRegex = new RegExp(`<\\s*${element}\\s*[^>]*\\s*\\/?>`, 'gi');
    text = text.replace(selfClosingRegex, '');
  });
  
  // Step 2: Remove all HTML event handlers (onclick, onerror, onload, etc.)
  text = text.replace(/\s*on\w+\s*=\s*['"]*[^'">\s]*['"]*[^>]*/gi, '');
  
  // Step 3: Remove javascript: protocol from any remaining content
  text = text.replace(/javascript\s*:/gi, '');
  
  // Step 4: Remove data: URLs (can contain embedded scripts)
  text = text.replace(/data\s*:\s*[^;]*;[^,]*,/gi, '');
  
  // Step 5: Remove any remaining HTML tags entirely for safety
  text = text.replace(/<[^>]*>/g, '');
  
  // Step 6: HTML entity encode remaining special characters
  text = htmlEntityEncode(text);
  
  // Step 7: Normalize whitespace and clean up
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
    .replace(/<!--[\s\S]*?-->/g, '') // Remove any remaining comments
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '') // Remove CDATA sections
    .trim();
};

/**
 * HTML entity encoding to prevent attribute injection attacks
 */
export const htmlEntityEncode = (text: string): string => {
  const entityMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=\/]/g, (match) => entityMap[match]);
};

/**
 * Additional sanitization for URLs to prevent protocol-based attacks
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:', 'data:', 'vbscript:', 'file:', 'about:',
    'chrome:', 'chrome-extension:', 'moz-extension:'
  ];
  
  const lowerUrl = trimmed.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return ''; // Return empty string for dangerous URLs
    }
  }
  
  // Only allow HTTP/HTTPS URLs or relative URLs
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://') || lowerUrl.startsWith('/')) {
    return trimmed;
  }
  
  // For relative URLs, ensure they don't contain protocol attempts
  if (!lowerUrl.includes(':')) {
    return trimmed;
  }
  
  return ''; // Block anything else that contains a protocol
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

