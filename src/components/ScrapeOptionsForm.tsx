import React from 'react';
import { ScrapeOptions } from '../types/index.ts';
import { Card } from './ui/Card.tsx';
import FormInput from './ui/FormInput.tsx';

interface Props {
  options: ScrapeOptions;
  onChange: (options: ScrapeOptions) => void;
}

export const ScrapeOptionsForm: React.FC<Props> = ({ options, onChange }) => {
  const handleChange = (key: keyof ScrapeOptions, value: boolean | number) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Card>
      <div>
          <h3 className="section-title">Scraping Options</h3>

          <div className="checkbox-grid">
            {[
              ['includeText', 'Text'],
              ['includeLinks', 'Links'],
              ['includeImages', 'Images'],
              ['includeMetadata', 'Metadata'],
            ].map(([key, label]) => (
              <label key={key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options[key as keyof ScrapeOptions] as boolean}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(key as keyof ScrapeOptions, e.target.checked)}
                  className="checkbox"
                />
                {label}
              </label>
            ))}
        </div>
      </div>

      <div>
        <h3 className="section-title">Content Limits</h3>
        <div className="layout-grid">
          <FormInput
            label="Max Links"
            type="number"
            min={1}
            max={500}
            value={String(options.maxLinks)}
            onChange={(val: string) => handleChange('maxLinks', parseInt(val))}
          />
          <FormInput
            label="Max Images"
            type="number"
            min={1}
            max={200}
            value={String(options.maxImages)}
            onChange={(val: string) => handleChange('maxImages', parseInt(val))}
           />
          <FormInput
            label="Max Text Elements"
            type="number"
            min={1}
            max={1000}
            value={String(options.maxTextElements)}
            onChange={(val: string) => handleChange('maxTextElements', parseInt(val))}
          />
        </div>
      </div>

      <div>
        <h3 className="section-title">Request Settings</h3>
        <div className="layout-grid">
          <FormInput
            label="Timeout (ms)"
            type="number"
            min={5000}
            max={120000}
            value={String(options.timeout)}
            onChange={(val: string) => handleChange('timeout', parseInt(val))}
          />
          <FormInput
            label="Retry Attempts"
            type="number"
            min={1}
            max={5}
            value={String(options.retryAttempts)}
            onChange={(val: string) => handleChange('retryAttempts', parseInt(val))}
          />
        </div>
      </div>
    </Card>
  );
};
