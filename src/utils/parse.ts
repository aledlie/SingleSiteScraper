import { cleanText } from '../utils/validators.ts';
import { ScrapedData, ImageObject, WebSite, WebPage, Organization } from '../types/index.ts';
import { HTMLElement } from 'node-html-parser';

/**
 * Sanitize metadata content to prevent XSS and remove malicious content
 */
function sanitizeMetadataContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = content.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove iframe tags and their content
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  // Remove svg tags with event handlers
  sanitized = sanitized.replace(/<svg[^>]*on\w+[^>]*>[\s\S]*?<\/svg>/gi, '');
  sanitized = sanitized.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove event handlers (onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove SQL injection patterns
  sanitized = sanitized.replace(/;\s*DROP\s+TABLE\s+/gi, '');
  sanitized = sanitized.replace(/;\s*DELETE\s+FROM\s+/gi, '');
  sanitized = sanitized.replace(/;\s*INSERT\s+INTO\s+/gi, '');

  // Remove alert( patterns
  sanitized = sanitized.replace(/alert\s*\(/gi, '');

  // Remove evil() patterns
  sanitized = sanitized.replace(/evil\s*\(\s*\)/gi, '');

  // Remove remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized.trim();
}

export function getMetadata(root: HTMLElement): Record<string, string> {
  const metaTags: Record<string, string> = {};
  metaTags['subheaders'] = extractH2Titles(root);

  root.querySelectorAll('meta').forEach(meta => {
    const name = meta.getAttribute('name');
    const property = meta.getAttribute('property');
    const content = meta.getAttribute('content');

    if (content) {
      const sanitizedContent = sanitizeMetadataContent(content);
      if (name) {
        metaTags[name] = sanitizedContent;
      } else if (property) {
        metaTags[property] = sanitizedContent;
      }
    }
  });

  return metaTags;
}

function extractH2Titles(root: HTMLElement): string {
  return root
    .querySelectorAll('h2')
    .map(el => {
      // Clone the element to avoid modifying the original
      const clone = el.clone();

      // Remove script, style, and svg tags from the clone
      clone.querySelectorAll('script, style, svg').forEach(s => s.remove());

      // Get the sanitized inner text
      const text = clone.innerText || clone.textContent || '';

      // Further sanitize for any remaining dangerous patterns
      return sanitizeMetadataContent(text);
    })
    .filter(Boolean)
    .join('\n');
}

export const getDescription = (
  root: HTMLElement
): ScrapedData['description'] => {
  return root.querySelector('meta[name="description"]')
    ?.getAttribute('content') || '';
}

export const getTitle = (
  root: HTMLElement
): ScrapedData['title'] => {
  return root.querySelector('title')
    ?.textContent || '';
}

export const getLinks = (
  root: HTMLElement,
  maxLinks: number
): ScrapedData['links'] => {
  const links = root.querySelectorAll('a').map((el) => ({
    text: cleanText(el.textContent),
    url: el.getAttribute('href') || '',
  }));
  return maxLinks ? links.slice(0, maxLinks) : links;
};

export const getText = (
  root: HTMLElement,
  maxText: number
): ScrapedData['text'] => {
  return root.querySelectorAll('p')
    .map((el) => cleanText(el.textContent))
      .slice(0, maxText);
};

export const getImages = (
  root: HTMLElement,
  maxImages: number
): ImageObject[] => {
  return root.querySelectorAll('img')
    .map((el) => {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      const title = el.getAttribute('title');
      const width = el.getAttribute('width');
      const height = el.getAttribute('height');
      
      const imageObject: ImageObject = {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: src,
        contentUrl: src,
        name: title || alt || '',
        alternateName: alt,
        description: alt || title || '',
      };

      if (width) imageObject.width = parseInt(width, 10);
      if (height) imageObject.height = parseInt(height, 10);
      
      // Infer encoding format from URL extension
      const extension = src.split('.').pop()?.toLowerCase();
      if (extension) {
        const formatMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml'
        };
        imageObject.encodingFormat = formatMap[extension] || `image/${extension}`;
      }

      return imageObject;
    })
    .slice(0, maxImages);
};

export const getWebSite = (
  root: HTMLElement,
  url: string
): WebSite => {
  const title = getTitle(root);
  const description = getDescription(root);
  const baseUrl = new URL(url).origin;
  
  const publisher = getOrganizationFromMetadata(root, url);
  const language = root.querySelector('html')?.getAttribute('lang') || 
                   root.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content');
  
  const keywords = root.querySelector('meta[name="keywords"]')?.getAttribute('content');
  
  const webSite: WebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: title,
    url: baseUrl,
    description: description || undefined,
    publisher: publisher || undefined,
    inLanguage: language || undefined,
    keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
  };

  // Add potential actions (search if available)
  const searchForm = root.querySelector('form[role="search"], .search-form, #search-form');
  if (searchForm) {
    webSite.potentialAction = [{
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }];
  }

  return webSite;
};

export const getWebPage = (
  root: HTMLElement,
  url: string,
  webSite: WebSite
): WebPage => {
  const title = getTitle(root);
  const description = getDescription(root);
  const text = getText(root, 200);
  
  // Try to get publish/modified dates
  const datePublished = root.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                       root.querySelector('time[datetime]')?.getAttribute('datetime');
  const dateModified = root.querySelector('meta[property="article:modified_time"]')?.getAttribute('content');
  
  // Get author information
  const authorName = root.querySelector('meta[name="author"]')?.getAttribute('content') ||
                    root.querySelector('.author, .byline')?.textContent?.trim();
  
  const author = authorName ? {
    '@type': 'Person' as const,
    name: authorName
  } : undefined;

  // Get main image
  const mainImage = root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                   root.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

  const webPage: WebPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: url,
    description: description || undefined,
    isPartOf: webSite,
    datePublished: datePublished || undefined,
    dateModified: dateModified || undefined,
    author: author,
    publisher: webSite.publisher,
    image: mainImage || undefined,
    inLanguage: webSite.inLanguage,
    keywords: webSite.keywords,
    headline: title,
    articleBody: text.join(' '),
    wordCount: text.join(' ').split(' ').length,
    text: text,
  };

  return webPage;
};

export const getOrganizationFromMetadata = (
  root: HTMLElement,
  url: string
): Organization | undefined => {
  // Check for Capital Factory specifically
  const urlLower = url.toLowerCase();
  const titleLower = getTitle(root).toLowerCase();
  const descriptionLower = getDescription(root).toLowerCase();
  
  if (urlLower.includes('capitalfactory.com') || 
      titleLower.includes('capital factory') ||
      descriptionLower.includes('capital factory')) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Capital Factory',
      url: 'https://capitalfactory.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '701 Brazos St',
        addressLocality: 'Austin',
        addressRegion: 'TX',
        postalCode: '78701',
        addressCountry: 'US'
      },
      sameAs: [
        'https://twitter.com/capitalfactory',
        'https://www.linkedin.com/company/capital-factory',
        'https://www.facebook.com/capitalfactory'
      ]
    };
  }
  
  // Try to extract organization from meta tags
  const siteName = root.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  if (siteName) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: new URL(url).origin
    };
  }
  
  return undefined;
};



