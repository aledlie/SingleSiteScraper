import React from 'react';
import { ScrapeOptions } from '../types/index.ts';
import { Card } from './ui/Card.tsx';
import { FormInput } from './ui/FormInput.tsx';

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

          <div className="layout-grid">
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
                  onChange={(e) => handleChange(key as keyof ScrapeOptions, e.target.checked)}
                  className="checkbox"
                />
                <span>{label}</span>
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
            value={options.maxLinks}
            onChange={(e) => handleChange('maxLinks', parseInt(e.target.value))}
          />
          <FormInput
            label="Max Images"
            type="number"
            min={1}
            max={200}
            value={options.maxImages}
            onChange={(e) => handleChange('maxImages', parseInt(e.target.value))}
           />
          <FormInput
            label="Max Text Elements"
            type="number"
            min={1}
            max={1000}
            value={options.maxTextElements}
            onChange={(e) => handleChange('maxTextElements', parseInt(e.target.value))}
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
            value={options.timeout}
            onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
          />
          <FormInput
            label="Retry Attempts"
            type="number"
            min={1}
            max={5}
            value={options.retryAttempts}
            onChange={(e) => handleChange('retryAttempts', parseInt(e.target.value))}
          />
        </div>
      </div>
    </Card>
  );
};
