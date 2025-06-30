import { parse } from 'node-html-parser';
import { format, parse as parseDate, isValid } from 'date-fns';
import { EventData } from '../types/index';

// Helper to parse dates into ISO 8601 format
function parseEventDate(dateStr: string, timeZone: string = 'America/Chicago'): { date?: string; timeZone: string } | null {
  // Try lots of date formats
  const possibleFormats = [
    'yyyy-MM-dd',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy/MM/dd',
    'yyyyMMdd',
    'MM-dd-yyyy',
    'MM/dd/yyyy HH:mm',
    'MM/dd/yyyy',
    'MMddyyyy',
    'dd-MM-yyy',
    'dd/MM/yyyy',
    'ddMMyyyy',
    'MMMM d, yyyy h:mm a'
  ];

  try {
    let date = new Date(Date.parse(dateStr));
    if (!isValid(date)) {
      for (const format of possibleFormats) {
        date = parseDate(dateStr, format, new Date());
        if (isValid(date)) {
          break;
        }
      }
    }
    if (!isValid(date)) {
      return null;
    }

    // Otherwise, return all-day date
    return { date: format(date, 'dd/MM/yyyy'), timeZone };
  } catch {
    return null;
  }
}

// Extract events from HTML
export function extractEvents(html: string): EventData[] {
  const root = parse(html);
  const events: EventData[] = [];

  // 1. Try Schema.org JSON-LD
  const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.textContent);
      if (json['@type'] === 'Event') {
        const start = parseEventDate(json.startDate);
        const end = parseEventDate(json.endDate);
        if (start) {
          events.push({
            summary: json.name || '',
            start,
            end: end || start,
            location: json.location?.name || json.location?.address?.streetAddress || '',
            description: json.description || '',
            eventType: 'default',
          });
        }
      }
    } catch {
      // Skip invalid JSON
    }
  }

  // 2. Try HTML elements (heuristic)
  const eventElements = root.querySelectorAll('.event, .event-item, article, section');
  for (const el of eventElements) {
    const title = el.querySelector('h1, h2, .event-title')?.textContent || '';
    const dateTime = el.querySelector('time, .event-date, .date')?.textContent || '';
    const location = el.querySelector('.event-location, .location')?.textContent || '';
    const description = el.querySelector('.event-description, .description, p')?.textContent || '';

    const start = parseEventDate(dateTime);
    if (start && title) {
      events.push({
        summary: title,
        start,
        end: start, // Default end to start if not specified
        location: location || undefined,
        description: description || undefined,
        eventType: 'default',
      });
    }
  }

  return events;
}
