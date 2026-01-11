/**
 * Enhanced URL validation with SSRF protection
 * Blocks private IP ranges, localhost, and malicious protocols
 */
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Block private IP ranges and localhost
    if (!isPublicUrl(urlObj)) {
      return false;
    }
    
    // Block dangerous ports
    if (isDangerousPort(urlObj.port)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if URL points to public internet (not private/local networks)
 * Prevents SSRF attacks on internal services
 */
function isPublicUrl(urlObj: URL): boolean {
  const hostname = urlObj.hostname.toLowerCase();
  
  // Block localhost variants
  const localhostPatterns = [
    'localhost', '127.0.0.1', '::1', '0.0.0.0',
    'local', '*.local', '*.localhost'
  ];
  
  if (localhostPatterns.some(pattern => 
    hostname === pattern || hostname.endsWith('.' + pattern.replace('*.', ''))
  )) {
    return false;
  }
  
  // Block private IP ranges (IPv4)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = hostname.match(ipv4Regex);
  
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    
    // Private IPv4 ranges:
    // 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255) 
    // 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
    // 169.254.0.0/16 (Link-local)
    if (
      (a === 10) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      (a === 127) // Loopback
    ) {
      return false;
    }
  }
  
  // Block IPv6 private ranges
  if (hostname.includes(':')) {
    const lowerHostname = hostname.toLowerCase();
    // Block IPv6 localhost, private, and link-local addresses
    if (
      lowerHostname === '::1' ||
      lowerHostname.startsWith('fc') || lowerHostname.startsWith('fd') || // Unique local
      lowerHostname.startsWith('fe80:') // Link-local
    ) {
      return false;
    }
  }
  
  // Block cloud metadata endpoints
  const metadataEndpoints = [
    '169.254.169.254', // AWS, Google Cloud, Azure
    'metadata.google.internal', // Google Cloud
    'instance-data.ec2.internal' // AWS
  ];
  
  if (metadataEndpoints.includes(hostname)) {
    return false;
  }
  
  return true;
}

/**
 * Check if port is dangerous (commonly used by internal services)
 */
function isDangerousPort(port: string): boolean {
  if (!port) return false;
  
  const portNum = parseInt(port, 10);
  if (isNaN(portNum)) return false;
  
  // Block common internal service ports
  const dangerousPorts = [
    22, 23, 25, 53, 110, 143, 993, 995, // Common services
    3306, 5432, 27017, 6379, 11211, // Databases
    9200, 9300, // Elasticsearch
    8080, 8443, 8000, 3000, 4000, 5000, // Common dev ports
    6443, // Kubernetes API
    2375, 2376, 2377, // Docker
    5984, 5985, // CouchDB, WinRM
  ];
  
  return dangerousPorts.includes(portNum);
}

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

/**
 * Validate and sanitize user input for various contexts
 */
export const validateInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Basic XSS prevention
  sanitized = cleanText(sanitized);
  
  return sanitized;
};

/**
 * Content Security Policy header generator
 */
export const generateCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
};

/**
 * SQL query sanitization to prevent injection attacks
 */
export const sanitizeSQLInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove or escape dangerous SQL characters and keywords
  let sanitized = input
    .replace(/[;\x00\n\r\\"'\x1a]/g, '') // Remove dangerous characters
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE|UNION|SELECT)\b/gi, '') // Remove SQL keywords
    .trim();
  
  // Limit length to prevent buffer overflow
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  return sanitized;
};

/**
 * Sanitize error messages to prevent information disclosure
 */
export const sanitizeErrorMessage = (error: unknown): string => {
  if (!error) return 'Operation failed';
  
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  return errorMsg
    .replace(/https?:\/\/[^\s]+/gi, '[URL_REDACTED]')
    .replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP_REDACTED]')
    .replace(/password|token|key|secret|auth|api[_-]?key/gi, '[CREDENTIAL_REDACTED]')
    .replace(/\b\w+@\w+\.\w+/g, '[EMAIL_REDACTED]')
    .replace(/\b[A-Z0-9]{20,}\b/g, '[TOKEN_REDACTED]')
    .substring(0, 150); // Limit length
};

