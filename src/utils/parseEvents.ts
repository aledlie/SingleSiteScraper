/**
 * Legacy Event Parser - Updated to use modular event parsing system
 * 
 * This file maintains backward compatibility while delegating to the new
 * modular event parsing system in src/utils/events/
 */

import { EventData } from '../types/index';
import { extractEventsLegacy } from './events/eventParser';

/**
 * Extract events from HTML - Legacy compatibility function
 * 
 * This function maintains backward compatibility with existing code
 * while using the new modular event parsing system.
 */
export function extractEvents(html: string): EventData[] {
  return extractEventsLegacy(html);
}
