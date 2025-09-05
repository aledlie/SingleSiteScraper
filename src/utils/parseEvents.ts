import { parse } from 'node-html-parser';
import { format, parse as parseDate, isValid } from 'date-fns';
import { EventData } from '../types/index';

// Helper to classify event type based on title
function classifyEventType(title: string): string {
  const titleLower = title.toLowerCase();
  
  // Event type patterns (ordered by specificity)
  if (titleLower.includes('hackathon') || titleLower.includes('competition') || titleLower.includes('contest')) {
    return 'competition';
  }
  if (titleLower.includes('workshop') || titleLower.includes('training') || titleLower.includes('class') || titleLower.includes('course')) {
    return 'workshop';
  }
  if (titleLower.includes('conference') || titleLower.includes('summit') || titleLower.includes('symposium')) {
    return 'conference';
  }
  if (titleLower.includes('presentation') || titleLower.includes('talk') || titleLower.includes('speaker') || titleLower.includes('pitch') || titleLower.includes('demo')) {
    return 'presentation';
  }
  if (titleLower.includes('coworking') || titleLower.includes('co-working') || titleLower.includes('open workspace')) {
    return 'coworking';
  }
  if (titleLower.includes('networking') || titleLower.includes('mixer') || titleLower.includes('connect')) {
    return 'networking';
  }
  if (titleLower.includes('startup') || titleLower.includes('entrepreneur') || titleLower.includes('founder')) {
    return 'startup';
  }
  if (titleLower.includes('meetup') || titleLower.includes('meet up') || titleLower.includes('gathering')) {
    return 'meetup';
  }
  
  return 'default';
}

// Helper to parse dates into ISO 8601 format
function parseEventDate(dateStr: string, timeZone: string = 'America/Chicago'): string | null {
  // Handle Capital Factory format like "Sep. 4 / 5:00 PM - 12:00 AM"
  let cleanDateStr = dateStr;
  
  // Extract date part from Capital Factory format
  const capitalFactoryMatch = dateStr.match(/^([A-Za-z]+\.\s*\d{1,2})/);
  if (capitalFactoryMatch) {
    // Add current year to make it parseable
    const currentYear = new Date().getFullYear();
    cleanDateStr = `${capitalFactoryMatch[1].replace('.', '')} ${currentYear}`;
  }
  
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
    'MMMM d, yyyy h:mm a',
    'MMM d yyyy'
  ];

  try {
    let date = new Date(Date.parse(cleanDateStr));
    if (!isValid(date)) {
      for (const format of possibleFormats) {
        date = parseDate(cleanDateStr, format, new Date());
        if (isValid(date)) {
          break;
        }
      }
    }
    if (!isValid(date)) {
      return null;
    }

    // Return ISO string instead of object
    return date.toISOString();
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
            eventType: classifyEventType(json.name || ''),
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
    const title = el.querySelector('h1, h2, h3, .event-title, .title, a, .display-lg')?.textContent?.trim() || '';
    const dateTime = el.querySelector('time, .event-date, .event-item-date, .date')?.textContent?.trim() || '';
    const location = el.querySelector('.event-location, .location, address')?.textContent?.trim() || '';
    const description = el.querySelector('.event-description, .description, p')?.textContent?.trim() || '';

    const start = parseEventDate(dateTime);
    if (start && title) {
      // Infer location when not explicitly provided
      let inferredLocation = location;
      if (!inferredLocation) {
        // Check if this appears to be a Capital Factory event
        if (html.toLowerCase().includes('capitalfactory.com') || 
            html.toLowerCase().includes('capital factory')) {
          inferredLocation = 'Capital Factory, Austin, TX';
        }
      }
      
      events.push({
        summary: title,
        start,
        end: start, // Default end to start if not specified
        location: inferredLocation || undefined,
        description: description || undefined,
        eventType: classifyEventType(title),
      });
    }
  }

  return events;
}
