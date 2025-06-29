import React, { useState } from 'react';
import { Loader2, Search, Download, Globe } from 'lucide-react';
import { scrapeWebsite } from '../scraper/scrapeWebsite';
import type { ScrapedData, ScrapeOptions } from '../types';
import FormInput from './ui/FormInput';
import { ScrapeResultTabs } from './ScrapeResultTabs';
import { ErrorAlert } from './ErrorAlert';
import { ProgressIndicator } from './ProgressBar';

const WebScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [options] = useState<ScrapeOptions>({
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
  const [data, setData] = useState<ScrapedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [filter, setFilter] = useState('');

  const handleScrape = async () => {
    setIsLoading(true);
    setError('');
    setData(null);
    try {
      const result = await scrapeWebsite(url, options, setProgress);
      if (result.data) {
        setData(result.data);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 space-y-4">
      <FormInput
        label="Website URL"
        placeholder="https://example.com"
        value={url}
        onChange={(val: string) => setUrl(val)}
        icon={<Globe className="w-5 h-5 text-gray-400" />}
        onEnter={handleScrape}
      />

      <button
        onClick={handleScrape}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2"
      >
        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
        {isLoading ? 'Scraping...' : 'Scrape Website'}
      </button>

      {error && <ErrorAlert error={error} />}
      {isLoading && <ProgressIndicator isLoading={isLoading} progress={progress} />}


      {data && (
        <div className="pt-6">
          <FormInput
            label="Filter results"
            placeholder="Filter..."
            value={filter}
            onChange={(val: string) => setFilter(val)}
          />
          <ScrapeResultTabs data={data} filter={filter} />
          <button
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)],
                { type: 'application/json' }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `scraped-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md flex justify-center items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default WebScraper;
