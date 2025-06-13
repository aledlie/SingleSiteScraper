import React, { useState } from 'react';
import { ScrapedData } from '../types';

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
    <div className="mt-4">
      <div className="flex space-x-4 border-b mb-4">
        {['text', 'links', 'images', 'metadata'].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-3 py-1 border-b-2 ${tab === key ? 'border-blue-600 font-bold' : 'border-transparent'}`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded border">
        {tab === 'text' && filtered.text.map((t, i) => (
          <p key={i} className="mb-2 text-sm text-gray-800">{t}</p>
        ))}

        {tab === 'links' && filtered.links.map((l, i) => (
          <div key={i} className="mb-2 text-sm">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{l.text}</a>
            <p className="text-xs text-gray-500">{l.url}</p>
          </div>
        ))}

        {tab === 'images' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.images.map((img, i) => (
              <div key={i} className="border rounded p-2">
                <img src={img.src} alt={img.alt} className="w-full h-auto" />
                <p className="text-xs mt-1 text-center text-gray-600">{img.alt}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'metadata' && (
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="border-b p-2">Key</th>
                <th className="border-b p-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.metadata.map(([k, v]) => (
                <tr key={k}>
                  <td className="border-t p-2 font-medium">{k}</td>
                  <td className="border-t p-2 text-sm text-gray-700">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
