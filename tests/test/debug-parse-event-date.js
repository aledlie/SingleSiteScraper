import { format, parse as parseDate, isValid } from 'date-fns';

// Copy the exact parseEventDate function from parseEvents.ts
function parseEventDate(dateStr, timeZone = 'America/Chicago') {
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
      for (const formatPattern of possibleFormats) {
        date = parseDate(cleanDateStr, formatPattern, new Date());
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

const testDateStr = "Sep. 4 / 5:00 PM																									- 12:00 AM";
console.log('🧪 Testing parseEventDate function');
console.log('=' .repeat(50));
console.log(`Input: "${testDateStr}"`);

const result = parseEventDate(testDateStr);
console.log('Result:', result);
console.log('Truthy?', !!result);
console.log('Type:', typeof result);