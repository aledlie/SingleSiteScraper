import { format, parse as parseDate, isValid } from 'date-fns';

function parseEventDate(dateStr, timeZone = 'America/Chicago') {
  // Handle Capital Factory format like "Sep. 4 / 5:00 PM - 12:00 AM"
  let cleanDateStr = dateStr;
  
  console.log(`🔄 Trying to parse: "${dateStr}"`);
  
  // Extract date part from Capital Factory format
  const capitalFactoryMatch = dateStr.match(/^([A-Za-z]+\.\s*\d{1,2})/);
  if (capitalFactoryMatch) {
    // Add current year to make it parseable
    const currentYear = new Date().getFullYear();
    cleanDateStr = `${capitalFactoryMatch[1].replace('.', '')} ${currentYear}`;
    console.log(`🔧 Cleaned to: "${cleanDateStr}"`);
  }
  
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
    if (isValid(date)) {
      console.log(`✅ Parsed with Date.parse(): ${date}`);
      return { date: format(date, 'dd/MM/yyyy'), timeZone };
    }
    
    for (const formatStr of possibleFormats) {
      date = parseDate(cleanDateStr, formatStr, new Date());
      if (isValid(date)) {
        console.log(`✅ Parsed with format "${formatStr}": ${date}`);
        return { date: format(date, 'dd/MM/yyyy'), timeZone };
      }
    }
    
    console.log(`❌ Could not parse date`);
    return null;
  } catch (error) {
    console.log(`❌ Error parsing: ${error.message}`);
    return null;
  }
}

// Test the actual date strings we found
const testDates = [
  "Sep. 4 / 5:00 PM - 12:00 AM",
  "Sep. 4 / 6:00 PM - 1:30 AM", 
  "Sep. 4",
  "September 4, 2024 5:00 PM",
  "Sep 4 2024 5:00 PM"
];

console.log('🧪 Testing Date Parsing');
console.log('=' .repeat(50));

testDates.forEach(dateStr => {
  console.log();
  const result = parseEventDate(dateStr);
  console.log(`Result: ${result ? JSON.stringify(result) : 'null'}`);
  console.log('-'.repeat(30));
});