import React, { useState } from 'react';
import { ScrapedData } from '../types/index.ts';
import { Card } from './ui/Card.tsx';

interface Props {
  data: ScrapedData;
  filter: string;
}

export const ScrapeResultTabs: React.FC<Props> = ({ data, filter }) => {
  const [tab, setTab] = useState<'text' | 'links' | 'images' | 'metadata'>('text');

  const filtered = {
    text: data.text.filter((t) => t.toLowerCase().includes(filter.toLowerCase())),
    links: data.links.filter((l) => l.text.toLowerCase().includes(filter.toLowerCase()) || l.url.toLowerCase().includes(filter.toLowerCase())),
    images: data.images.filter((i) => i.alt.toLowerCase().includes(filter.toLowerCase()) || i.src.toLowerCase().includes(filter.toLowerCase())),
    metadata: Object.entries(data.metadata).filter(([k, v]) => k.includes(filter) || v.includes(filter)),
  };

  return (
    <div className="tab-panel">
      <div className="tab-header">
        {['text', 'links', 'images', 'metadata'].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`tab-button ${tab === key ? 'tab-button-active' : 'tab-button-inactive'}`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      <Card>
        {tab === 'text' && filtered.text.map((t, i) => (
          <p key={i} className="text-block">{t}</p>
        ))}

        {tab === 'links' && filtered.links.map((l, i) => (
          <div key={i} className="text-block">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="link-primary">{l.text}</a>
            <p className="link-subtext">{l.url}</p>
          </div>
        ))}

        {tab === 'images' && (
          <div className="layout-grid">
            {filtered.images.map((img, i) => (
              <div key={i} className="media-thumb">
                <img src={img.src} alt={img.alt} className="responsive-img" />
                <p className="caption">{img.alt}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'metadata' && (
          <table className="meta-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.metadata.map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

