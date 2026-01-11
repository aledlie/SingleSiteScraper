/**
 * Event Parser - Extract events from HTML content
 *
 * Supports multiple extraction methods:
 * 1. Schema.org JSON-LD structured data
 * 2. HTML microdata and semantic elements
 * 3. Common event HTML patterns (classes, data attributes)
 * 4. Date/time pattern recognition
 */

import { parse, HTMLElement } from 'node-html-parser';
import { EventData } from '../../types/index';

// Create a partial EventData that meets the minimal requirements for extraction
type ExtractedEvent = Pick<EventData, 'name' | 'startDate' | 'endDate' | 'location' | 'description' | 'eventType'> & {
  '@context': 'https://schema.org';
  '@type': 'Event';
};

// Schema.org Event structure for JSON-LD parsing
interface SchemaOrgEvent {
  '@type': string;
  name?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    '@type'?: string;
    name?: string;
    address?: string | {
      '@type'?: string;
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
  } | string;
  description?: string;
  eventAttendanceMode?: string;
  eventStatus?: string;
  performer?: { name?: string } | string;
  organizer?: { name?: string } | string;
  offers?: Array<{ price?: string; priceCurrency?: string }>;
  image?: string | { url?: string };
  url?: string;
}

/**
 * Extract events from HTML content using multiple strategies
 * @param html - Raw HTML string to parse
 * @returns Array of extracted events
 */
export function extractEventsLegacy(html: string): EventData[] {
  const events: ExtractedEvent[] = [];
  const seenEvents = new Set<string>(); // Deduplicate by name+startDate

  // Strategy 1: Extract from JSON-LD structured data (most reliable)
  const jsonLdEvents = extractFromJsonLd(html);
  jsonLdEvents.forEach(event => {
    const key = `${event.name}|${event.startDate}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      events.push(event);
    }
  });

  // Strategy 2: Extract from HTML microdata (itemtype="Event")
  const microdataEvents = extractFromMicrodata(html);
  microdataEvents.forEach(event => {
    const key = `${event.name}|${event.startDate}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      events.push(event);
    }
  });

  // Strategy 3: Extract from common HTML patterns
  const htmlPatternEvents = extractFromHtmlPatterns(html);
  htmlPatternEvents.forEach(event => {
    const key = `${event.name}|${event.startDate}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      events.push(event);
    }
  });

  return events as EventData[];
}

/**
 * Extract events from JSON-LD structured data
 */
function extractFromJsonLd(html: string): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];

  // Match all JSON-LD script tags
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const content = match[1].trim();
      const data = JSON.parse(content);

      // Handle array of items
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Check for @graph structure
        if (item['@graph']) {
          const graphItems = Array.isArray(item['@graph']) ? item['@graph'] : [item['@graph']];
          for (const graphItem of graphItems) {
            const event = parseSchemaOrgEvent(graphItem);
            if (event) events.push(event);
          }
        } else {
          const event = parseSchemaOrgEvent(item);
          if (event) events.push(event);
        }
      }
    } catch {
      // JSON parsing failed, continue to next script tag
      continue;
    }
  }

  return events;
}

/**
 * Parse a Schema.org Event object into ExtractedEvent
 */
function parseSchemaOrgEvent(data: SchemaOrgEvent): ExtractedEvent | null {
  // Check if this is an Event type (including subtypes)
  const eventTypes = ['Event', 'BusinessEvent', 'ChildrensEvent', 'ComedyEvent',
    'CourseInstance', 'DanceEvent', 'DeliveryEvent', 'EducationEvent',
    'EventSeries', 'ExhibitionEvent', 'Festival', 'FoodEvent', 'Hackathon',
    'LiteraryEvent', 'MusicEvent', 'PublicationEvent', 'SaleEvent',
    'ScreeningEvent', 'SocialEvent', 'SportsEvent', 'TheaterEvent',
    'VisualArtsEvent', 'Webinar', 'MeetingEvent', 'ConferenceEvent'];

  if (!data['@type'] || !eventTypes.some(type =>
    data['@type'] === type ||
    data['@type'].includes(type) ||
    (Array.isArray(data['@type']) && data['@type'].includes(type))
  )) {
    return null;
  }

  // Must have at least a name and start date
  if (!data.name || !data.startDate) {
    return null;
  }

  const event: ExtractedEvent = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.name,
    startDate: normalizeDate(data.startDate),
    endDate: normalizeDate(data.endDate || data.startDate),
    location: parseLocation(data.location),
    description: data.description ? cleanText(data.description) : undefined,
    eventType: classifyEventType(data).toLowerCase(),
  };

  return event;
}

/**
 * Extract events from HTML microdata (itemtype)
 */
function extractFromMicrodata(html: string): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];

  try {
    const root = parse(html);

    // Find elements with itemtype containing "Event"
    const eventElements = root.querySelectorAll('[itemtype*="Event"]');

    for (const el of eventElements) {
      const event = parseEventElement(el);
      if (event) events.push(event);
    }
  } catch {
    // Parsing failed, return empty
  }

  return events;
}

/**
 * Parse an event from a microdata element
 */
function parseEventElement(el: HTMLElement): ExtractedEvent | null {
  const name = el.querySelector('[itemprop="name"]')?.textContent?.trim() ||
               el.querySelector('.event-title, .event-name, h2, h3')?.textContent?.trim();

  const startDate = el.querySelector('[itemprop="startDate"]')?.getAttribute('datetime') ||
                   el.querySelector('[itemprop="startDate"]')?.textContent?.trim() ||
                   el.querySelector('time')?.getAttribute('datetime');

  const endDate = el.querySelector('[itemprop="endDate"]')?.getAttribute('datetime') ||
                 el.querySelector('[itemprop="endDate"]')?.textContent?.trim();

  const location = el.querySelector('[itemprop="location"]')?.textContent?.trim() ||
                  el.querySelector('.event-location, .location')?.textContent?.trim();

  const description = el.querySelector('[itemprop="description"]')?.textContent?.trim() ||
                     el.querySelector('.event-description, .description')?.textContent?.trim();

  if (!name || !startDate) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: name,
    startDate: normalizeDate(startDate),
    endDate: normalizeDate(endDate || startDate),
    location: location || undefined,
    description: description ? cleanText(description) : undefined,
    eventType: detectEventTypeFromText(name + ' ' + (description || '')).toLowerCase(),
  };
}

/**
 * Extract events from common HTML patterns
 */
function extractFromHtmlPatterns(html: string): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];

  try {
    const root = parse(html);

    // Common event container selectors
    const eventSelectors = [
      '.event-card',
      '.event-item',
      '.event-listing',
      '.event-row',
      '.event',
      '[data-event]',
      '.calendar-event',
      '.upcoming-event',
      '.event-block',
      'article.event',
      'li.event',
      '.eventitem',
      '.tribe-events-calendar-list__event',
      '.tribe-event',
    ];

    for (const selector of eventSelectors) {
      const elements = root.querySelectorAll(selector);

      for (const el of elements) {
        const event = extractEventFromGenericElement(el);
        if (event) events.push(event);
      }
    }

    // Also check articles and sections for event keywords when no explicit event markers
    if (events.length === 0) {
      const genericContainers = root.querySelectorAll('article, section');
      for (const el of genericContainers) {
        const heading = el.querySelector('h1, h2, h3, h4, h5')?.textContent?.toLowerCase() || '';
        // Only process if heading contains event-related keywords
        if (/\b(meetup|meeting|workshop|conference|seminar|webinar|event|summit)\b/i.test(heading)) {
          const event = extractEventFromGenericElement(el);
          if (event) events.push(event);
        }
      }
    }
  } catch {
    // Parsing failed
  }

  return events;
}

/**
 * Extract event data from a generic HTML element
 */
function extractEventFromGenericElement(el: HTMLElement): ExtractedEvent | null {
  // Try to find event name from various selectors
  const nameSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5',
    '.title', '.event-title', '.event-name', '.event-heading',
    '[class*="title"]', '[class*="name"]',
    'span.display-lg', // Capital Factory style
    '.display-lg', // Similar display heading classes
    '[class*="display"]',
    'a[href]',
  ];

  let name = '';
  for (const selector of nameSelectors) {
    const el2 = el.querySelector(selector);
    if (el2) {
      name = el2.textContent?.trim() || '';
      if (name && name.length >= 3 && name.length < 200) {
        break;
      }
    }
  }

  if (!name || name.length < 3) {
    return null;
  }

  // Try to find date information from multiple sources
  let startDate = '';
  const endDate = '';

  // 1. Check for time elements with datetime attribute
  const timeEl = el.querySelector('time[datetime]');
  if (timeEl) {
    startDate = timeEl.getAttribute('datetime') || '';
  }

  // 2. Check for time elements with text content
  if (!startDate) {
    const timeTextEl = el.querySelector('time');
    if (timeTextEl) {
      startDate = timeTextEl.textContent?.trim() || '';
    }
  }

  // 3. Check for data-* attributes containing dates (on element itself first, then children)
  if (!startDate) {
    const dataAttrs = ['data-date', 'data-start', 'data-event-date', 'data-datetime'];
    for (const attr of dataAttrs) {
      // Check on the element itself first
      const selfAttr = el.getAttribute(attr);
      if (selfAttr) {
        startDate = selfAttr;
        break;
      }
      // Then check child elements
      const attrEl = el.querySelector('[' + attr + ']');
      if (attrEl) {
        startDate = attrEl.getAttribute(attr) || '';
        if (startDate) break;
      }
    }
  }

  // 4. Check for date-related class elements
  if (!startDate) {
    const dateSelectors = [
      '.date', '.event-date', '.datetime', '.start-date',
      '.event-time', '.event-datetime', '.when',
      '[class*="date"]', '[class*="time"]',
    ];
    for (const selector of dateSelectors) {
      const dateEl = el.querySelector(selector);
      if (dateEl) {
        startDate = dateEl.textContent?.trim() || '';
        if (startDate && extractDateFromText(startDate)) {
          startDate = extractDateFromText(startDate) || startDate;
          break;
        }
      }
    }
  }

  // 5. Try to parse date from entire element text content
  if (!startDate) {
    const text = el.textContent || '';
    const dateMatch = extractDateFromText(text);
    if (dateMatch) {
      startDate = dateMatch;
    }
  }

  // If no date found, skip this element
  if (!startDate) {
    return null;
  }

  // Try to find location
  const locationSelectors = [
    '.location', '.event-location', '.venue', '.address',
    '.place', '.event-venue', '[class*="location"]', '[class*="venue"]',
  ];
  let location = '';
  for (const selector of locationSelectors) {
    const locEl = el.querySelector(selector);
    if (locEl) {
      location = locEl.textContent?.trim() || '';
      if (location) break;
    }
  }

  // Try to find description
  const descSelectors = [
    '.description', '.event-description', '.excerpt', '.summary',
    '.event-excerpt', '.event-summary', 'p',
  ];
  let description = '';
  for (const selector of descSelectors) {
    const descEl = el.querySelector(selector);
    if (descEl) {
      description = descEl.textContent?.trim() || '';
      if (description && description.length > 10) break;
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: name,
    startDate: normalizeDate(startDate),
    endDate: normalizeDate(endDate || startDate),
    location: location || undefined,
    description: description ? cleanText(description) : undefined,
    eventType: detectEventTypeFromText(name + ' ' + (description || '')).toLowerCase(),
  };
}

/**
 * Extract date from text using common patterns
 */
function extractDateFromText(text: string): string | null {
  const currentYear = new Date().getFullYear();

  // Common date patterns - ordered by specificity
  const patterns: Array<{ regex: RegExp; addYear?: boolean }> = [
    // ISO format: 2024-01-15 or 2024-01-15T10:00
    { regex: /(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?)/ },
    // US format: 01/15/2024 or 1/15/2024
    { regex: /(\d{1,2}\/\d{1,2}\/\d{4})/ },
    // Month Day, Year: January 15, 2024
    { regex: /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i },
    // Short month with year: Jan 15, 2024 or Jan. 15 2024
    { regex: /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4})/i },
    // Day Month Year: 15 January 2024
    { regex: /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i },
    // Short month with @ time: Jan 13 @ 10:00am (Capital Factory format)
    { regex: /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}\s*@\s*\d{1,2}:\d{2}\s*(?:am|pm)?)/i, addYear: true },
    // Short month without year: Jan 15 or Jan. 15 (assume current year)
    { regex: /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2})(?!\s*,?\s*\d{4})/i, addYear: true },
    // Full month without year: January 15 (assume current year)
    { regex: /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})(?!\s*,?\s*\d{4})/i, addYear: true },
    // Numeric short: 1/15 or 01/15 (assume current year)
    { regex: /(\d{1,2}\/\d{1,2})(?!\/\d)/, addYear: true },
  ];

  for (const { regex, addYear } of patterns) {
    const match = text.match(regex);
    if (match) {
      let dateStr = match[1];
      if (addYear) {
        dateStr = dateStr + ', ' + currentYear;
      }
      return dateStr;
    }
  }

  return null;
}

/**
 * Parse location from various formats
 */
function parseLocation(location: SchemaOrgEvent['location']): string | undefined {
  if (!location) return undefined;

  if (typeof location === 'string') {
    return location;
  }

  if (typeof location === 'object') {
    const parts: string[] = [];

    if (location.name) {
      parts.push(location.name);
    }

    if (location.address) {
      if (typeof location.address === 'string') {
        parts.push(location.address);
      } else if (typeof location.address === 'object') {
        const addr = location.address;
        const addrParts = [
          addr.streetAddress,
          addr.addressLocality,
          addr.addressRegion,
          addr.postalCode,
          addr.addressCountry,
        ].filter(Boolean);
        if (addrParts.length > 0) {
          parts.push(addrParts.join(', '));
        }
      }
    }

    return parts.join(', ') || undefined;
  }

  return undefined;
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string | undefined): string {
  if (!dateStr) return '';

  try {
    // Already ISO format
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr;
    }

    // Try to parse the date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Return as-is if parsing fails
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Classify event type from Schema.org data
 */
function classifyEventType(data: SchemaOrgEvent): string {
  // Use @type if it's a specific event type
  if (data['@type'] && data['@type'] !== 'Event') {
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    return type.replace(/Event$/, '').replace(/([A-Z])/g, ' $1').trim();
  }

  // Try to detect from name/description
  const text = (data.name || '') + ' ' + (data.description || '');
  return detectEventTypeFromText(text);
}

/**
 * Detect event type from text content
 */
function detectEventTypeFromText(text: string): string {
  const lower = text.toLowerCase();

  const typePatterns: Array<[RegExp, string]> = [
    [/\b(conference|summit|symposium)\b/i, 'Conference'],
    [/\b(workshop|bootcamp|training)\b/i, 'Workshop'],
    [/\b(webinar|online\s+event|virtual\s+event)\b/i, 'Webinar'],
    [/\b(meetup|meet-up|networking)\b/i, 'Meetup'],
    [/\b(hackathon|hack\s+day)\b/i, 'Hackathon'],
    [/\b(concert|music|live\s+performance)\b/i, 'Music'],
    [/\b(seminar|lecture|talk|presentation)\b/i, 'Seminar'],
    [/\b(demo\s+day|pitch|startup)\b/i, 'Demo Day'],
    [/\b(class|course|lesson)\b/i, 'Class'],
    [/\b(party|celebration|gala)\b/i, 'Social'],
    [/\b(exhibition|expo|fair|show)\b/i, 'Exhibition'],
    [/\b(fundraiser|charity|benefit)\b/i, 'Fundraiser'],
    [/\b(festival)\b/i, 'Festival'],
    [/\b(sports|game|match|tournament)\b/i, 'Sports'],
    [/\b(film|movie|screening)\b/i, 'Screening'],
  ];

  for (const [pattern, type] of typePatterns) {
    if (pattern.test(lower)) {
      return type;
    }
  }

  return 'Event';
}

/**
 * Clean and truncate text content
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim()
    .substring(0, 1000); // Limit description length
}

// Re-export for compatibility
export { extractEventsLegacy as extractEvents };
