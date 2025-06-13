import React, { useState } from 'react';
import { scrapeWebsite } from '../scraper/scrapeWebsite';
import { ScrapeOptions, ScrapedData } from '../types';
import { ErrorAlert } from './ErrorAlert';
import { ScrapeOptionsForm } from './ScrapeOptionsForm';
import { ScrapeResultTabs } from './ScrapeResultTabs';

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
  const [filter, setFilter] = useState('');

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
    <div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL" />
      <button onClick={handleScrape}>Scrape</button>
      <ScrapeOptionsForm options={options} onChange={setOptions} />
      {progress && <p>{progress}</p>}
      {error && <ErrorAlert error={error} />}
      {scrapedData && <ScrapeResultTabs data={scrapedData} filter={filter} />}
    </div>
  );
};

export default WebScraper;
