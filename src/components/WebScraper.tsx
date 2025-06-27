import React, { useState } from 'react';
import { scrapeWebsite } from '../scraper/scrapeWebsite.ts';
import { ScrapeOptions, ScrapedData } from '../types/index.ts';
import { ErrorAlert } from './ErrorAlert.tsx';
import { ScrapeOptionsForm } from './ScrapeOptionsForm.tsx';
import { ScrapeResultTabs } from './ScrapeResultTabs.tsx';

const WebScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState<ScrapeOptions>({
    includeText: true,
    includeLinks: true,
    includeImages: true,
    includeMetadata: true,
    maxLinks: 100,
    maxImages: 50,
    maxTextElements: 200,
    timeout: 30000,
    retryAttempts: 3,
  });
  const [error, setError] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [progress, setProgress] = useState('');
  const [filter] = useState('');

  const handleScrape = async () => {
    setProgress('Scraping...');
    setError('');
    setScrapedData(null);
    const { data, error: err, url: updatedUrl } = await scrapeWebsite(url, options, setProgress);
    setUrl(updatedUrl);
    if (err) setError(err);
    else if (data) setScrapedData(data);
    setProgress('');
  };

  return (
    <div class="border-card">
      <label for="url" class="input">Website URL</label>
      <input class="input-label" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL" />
      <button class="button" onClick={handleScrape}>Scrape</button>
      <ScrapeOptionsForm options={options} onChange={setOptions} />
      {progress && <p>{progress}</p>}
      {error && <ErrorAlert error={error} />}
      {scrapedData && <ScrapeResultTabs data={scrapedData} filter={filter} />}
    </div>
  );
};

export default WebScraper;
