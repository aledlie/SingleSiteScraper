import { parse } from 'node-html-parser';
import { format, parse as parseDate, isValid } from 'date-fns';
import { EventData, Place, Organization } from '../types/index';

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

// Helper to create Place object from location data
function createPlaceObject(locationData: any): Place | string {
  if (typeof locationData === 'string') {
    return locationData;
  }
  
  if (locationData && typeof locationData === 'object') {
    const place: Place = {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: locationData.name || locationData.address?.name,
    };
    
    if (locationData.address) {
      if (typeof locationData.address === 'string') {
        place.address = locationData.address;
      } else {
        place.address = {
          '@type': 'PostalAddress',
          streetAddress: locationData.address.streetAddress,
          addressLocality: locationData.address.addressLocality,
          addressRegion: locationData.address.addressRegion,
          postalCode: locationData.address.postalCode,
          addressCountry: locationData.address.addressCountry,
        };
      }
    }
    
    if (locationData.geo) {
      place.geo = {
        '@type': 'GeoCoordinates',
        latitude: locationData.geo.latitude,
        longitude: locationData.geo.longitude,
      };
    }
    
    return place;
  }
  
  return '';
}

// Helper to create Organization object
function createOrganizerObject(organizerData: any): Organization | undefined {
  if (!organizerData) return undefined;
  
  if (typeof organizerData === 'string') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organizerData,
    };
  }
  
  if (organizerData && typeof organizerData === 'object') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organizerData.name || '',
      url: organizerData.url,
      email: organizerData.email,
      telephone: organizerData.telephone,
    };
  }
  
  return undefined;
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
        const startDate = parseEventDate(json.startDate);
        const endDate = parseEventDate(json.endDate);
        if (startDate) {
          const event: EventData = {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: json.name || '',
            startDate,
            endDate: endDate || startDate,
            location: createPlaceObject(json.location),
            description: json.description || '',
            eventType: classifyEventType(json.name || ''),
            url: json.url,
            organizer: createOrganizerObject(json.organizer),
            eventStatus: json.eventStatus || 'EventScheduled',
            eventAttendanceMode: json.eventAttendanceMode || 'OfflineEventAttendanceMode',
          };
          
          // Add additional properties if available
          if (json.image) event.image = json.image;
          if (json.performer) event.performer = json.performer;
          if (json.offers) event.offers = json.offers;
          if (json.doorTime) event.doorTime = json.doorTime;
          if (json.duration) event.duration = json.duration;
          if (json.isAccessibleForFree !== undefined) event.isAccessibleForFree = json.isAccessibleForFree;
          if (json.maximumAttendeeCapacity) event.maximumAttendeeCapacity = json.maximumAttendeeCapacity;
          
          events.push(event);
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
    const locationText = el.querySelector('.event-location, .location, address')?.textContent?.trim() || '';
    const description = el.querySelector('.event-description, .description, p')?.textContent?.trim() || '';

    const startDate = parseEventDate(dateTime);
    if (startDate && title) {
      // Create proper Place object or infer location
      let location: Place | string = locationText;
      if (!locationText) {
        // Check if this appears to be a Capital Factory event
        if (html.toLowerCase().includes('capitalfactory.com') || 
            html.toLowerCase().includes('capital factory')) {
          location = {
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: 'Capital Factory',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '701 Brazos St',
              addressLocality: 'Austin',
              addressRegion: 'TX',
              postalCode: '78701',
              addressCountry: 'US'
            }
          };
        }
      } else if (locationText.includes(',')) {
        // Try to parse structured location
        const parts = locationText.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          location = {
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: parts[0],
            address: parts.slice(1).join(', ')
          };
        }
      }
      
      const event: EventData = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: title,
        startDate,
        endDate: startDate, // Default end to start if not specified
        location: location || undefined,
        description: description || undefined,
        eventType: classifyEventType(title),
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
        isAccessibleForFree: true, // Default for most community events
      };
      
      events.push(event);
    }
  }

  return events;
}
