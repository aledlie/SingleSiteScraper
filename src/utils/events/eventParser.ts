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

// Simple EventData interface (matches types/index.ts line 215-222)
interface EventData {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  eventType?: string;
}

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
  const events: EventData[] = [];
  const seenEvents = new Set<string>(); // Deduplicate by summary+start

  // Strategy 1: Extract from JSON-LD structured data (most reliable)
  const jsonLdEvents = extractFromJsonLd(html);
  jsonLdEvents.forEach(event => {
    const key = `${event.summary}|${event.start}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      events.push(event);
    }
  });

  // Strategy 2: Extract from HTML microdata (itemtype="Event")
  const microdataEvents = extractFromMicrodata(html);
  microdataEvents.forEach(event => {
    const key = `${event.summary}|${event.start}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      events.push(event);
    }
  });

  // Strategy 3: Extract from common HTML patterns
  const htmlPatternEvents = extractFromHtmlPatterns(html);
  htmlPatternEvents.forEach(event => {
    const key = `${event.summary}|${event.start}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      events.push(event);
    }
  });

  return events;
}

/**
 * Extract events from JSON-LD structured data
 */
function extractFromJsonLd(html: string): EventData[] {
  const events: EventData[] = [];

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
    } catch (e) {
      // JSON parsing failed, continue to next script tag
      continue;
    }
  }

  return events;
}

/**
 * Parse a Schema.org Event object into EventData
 */
function parseSchemaOrgEvent(data: SchemaOrgEvent): EventData | null {
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

  const event: EventData = {
    summary: data.name,
    start: normalizeDate(data.startDate),
    end: normalizeDate(data.endDate || data.startDate),
    location: parseLocation(data.location),
    description: data.description ? cleanText(data.description) : undefined,
    eventType: classifyEventType(data),
  };

  return event;
}

/**
 * Extract events from HTML microdata (itemtype)
 */
function extractFromMicrodata(html: string): EventData[] {
  const events: EventData[] = [];

  try {
    const root = parse(html);

    // Find elements with itemtype containing "Event"
    const eventElements = root.querySelectorAll('[itemtype*="Event"]');

    for (const el of eventElements) {
      const event = parseEventElement(el);
      if (event) events.push(event);
    }
  } catch (e) {
    // Parsing failed, return empty
  }

  return events;
}

/**
 * Parse an event from a microdata element
 */
function parseEventElement(el: HTMLElement): EventData | null {
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
    summary: name,
    start: normalizeDate(startDate),
    end: normalizeDate(endDate || startDate),
    location: location || undefined,
    description: description ? cleanText(description) : undefined,
    eventType: detectEventTypeFromText(name + ' ' + (description || '')),
  };
}

/**
 * Extract events from common HTML patterns
 */
function extractFromHtmlPatterns(html: string): EventData[] {
  const events: EventData[] = [];

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
  } catch (e) {
    // Parsing failed
  }

  return events;
}

/**
 * Extract event data from a generic HTML element
 */
function extractEventFromGenericElement(el: HTMLElement): EventData | null {
  // Try to find event name
  const name = el.querySelector('h1, h2, h3, h4, .title, .event-title, .event-name, a')?.textContent?.trim();

  if (!name || name.length < 3) {
    return null;
  }

  // Try to find date information
  let startDate = '';
  let endDate = '';

  // Check for time elements
  const timeEl = el.querySelector('time');
  if (timeEl) {
    startDate = timeEl.getAttribute('datetime') || timeEl.textContent?.trim() || '';
  }

  // Check for date-related classes/attributes
  const dateEl = el.querySelector('.date, .event-date, .datetime, [data-date]');
  if (dateEl && !startDate) {
    startDate = dateEl.getAttribute('data-date') || dateEl.textContent?.trim() || '';
  }

  // Try to parse date from text content
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
  const location = el.querySelector('.location, .event-location, .venue, .address')?.textContent?.trim();

  // Try to find description
  const description = el.querySelector('.description, .event-description, .excerpt, p')?.textContent?.trim();

  return {
    summary: name,
    start: normalizeDate(startDate),
    end: normalizeDate(endDate || startDate),
    location: location || undefined,
    description: description ? cleanText(description) : undefined,
    eventType: detectEventTypeFromText(name + ' ' + (description || '')),
  };
}

/**
 * Extract date from text using common patterns
 */
function extractDateFromText(text: string): string | null {
  // Common date patterns
  const patterns = [
    // ISO format: 2024-01-15
    /(\d{4}-\d{2}-\d{2})/,
    // US format: 01/15/2024 or 1/15/2024
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    // Month Day, Year: January 15, 2024
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i,
    // Short month: Jan 15, 2024
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4})/i,
    // Day Month Year: 15 January 2024
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
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
