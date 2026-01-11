/**
 * Debug HTML structure of event elements
 */

import { parse } from 'node-html-parser';

async function debugHtmlStructure() {
  const url = 'https://capitalfactory.com/in-person/';
  const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

  console.log('Fetching HTML...');
  const response = await fetch(proxyUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(30000)
  });

  const html = await response.text();
  const root = parse(html);

  // Find event-item elements
  const eventItems = root.querySelectorAll('.event-item');
  console.log('\n📊 Found', eventItems.length, '.event-item elements\n');

  // Examine first 3 event items
  eventItems.slice(0, 3).forEach((el, i) => {
    console.log('=' .repeat(60));
    console.log('Event Item', i + 1);
    console.log('=' .repeat(60));

    // Show the outer HTML (trimmed)
    const outerHtml = el.outerHTML;
    console.log('\n📄 HTML structure (first 1500 chars):');
    console.log(outerHtml.substring(0, 1500));

    // Look for potential title/name elements
    console.log('\n🏷️  Potential titles:');
    ['h1', 'h2', 'h3', 'h4', 'h5', '.title', 'a'].forEach(sel => {
      const titleEl = el.querySelector(sel);
      if (titleEl) {
        console.log('  ' + sel + ':', titleEl.textContent?.trim().substring(0, 60));
      }
    });

    // Look for any date-like content
    console.log('\n📅 Text content (looking for dates):');
    const text = el.textContent || '';
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    lines.slice(0, 10).forEach(line => {
      // Highlight lines that look like they might contain dates
      const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2}|\d{4})/i.test(line);
      const prefix = hasDate ? '  📆 ' : '     ';
      console.log(prefix + line.substring(0, 80));
    });

    console.log('\n');
  });
}

debugHtmlStructure().catch(console.error);
