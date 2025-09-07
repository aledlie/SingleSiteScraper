import React, { useState } from 'react';
import { Loader2, Search, Download, Globe } from 'lucide-react';
import { scrapeWebsite } from '../scraper/scrapeWebsite';
import { ScrapeOptionsForm } from './ScrapeOptionsForm';
import type { ScrapedData, ScrapeOptions } from '../types';
import FormInput from './ui/FormInput';
import { ScrapeResultTabs } from './ScrapeResultTabs';
import { ErrorAlert } from './ErrorAlert';
import { ProgressIndicator } from './ProgressBar';

const WebScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState<ScrapeOptions>({
    includeText: true,
    includeLinks: true,
    includeImages: true,
    includeMetadata: true,
    includeEvents: true,
    maxLinks: 100,
    maxImages: 10,
    maxTextElements: 200,
    maxEvents: 20,
    timeout: 30000,
    retryAttempts: 3,
  });
  const [data, setData] = useState<ScrapedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [filter, setFilter] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    <div className="border-card">
      <FormInput
        label="Website URL"
        placeholder="https://example.com"
        value={url}
        onChange={(val: string) => setUrl(val)}
        icon={<Globe className="w-5 h-5 text-gray-400" />}
        onEnter={handleScrape}
      />

      <div className="my-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
        {showAdvanced && <ScrapeOptionsForm options={options} onChange={setOptions} />}
      </div>

      <button
        onClick={handleScrape}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {isLoading ? 'Scraping...' : 'Scrape Website'}
      </button>

      {error && <ErrorAlert error={error} />}
      {isLoading && <ProgressIndicator isLoading={isLoading} progress={progress} />}


      {data && (
        <div className="mt-6 space-y-4">
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
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default WebScraper;
