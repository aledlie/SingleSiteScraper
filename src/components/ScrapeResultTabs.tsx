import React, { useState, useMemo, useCallback } from 'react';
import { ScrapedData } from '../types/index.ts';
import { format } from 'date-fns';

interface Props {
  data: ScrapedData;
  filter: string;
}

export const ScrapeResultTabs: React.FC<Props> = ({ data, filter }) => {
  const [tab, setTab] = useState<'text' | 'links' | 'images' | 'metadata' | 'events' | 'schema'>('text');

  // Memoize expensive filtering operations
  const filtered = useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    return {
      text: data.text.filter((t) => t.toLowerCase().includes(lowerFilter)),
      links: data.links.filter((l) => l.text.toLowerCase().includes(lowerFilter) || l.url.toLowerCase().includes(lowerFilter)),
      images: data.images.filter((i) => (i.alternateName || '').toLowerCase().includes(lowerFilter) || i.url.toLowerCase().includes(lowerFilter)),
      metadata: Object.entries(data.metadata).filter(([k, v]) => k.toLowerCase().includes(lowerFilter) || v.toLowerCase().includes(lowerFilter)),
      events: data.events.filter((e) => e.name.toLowerCase().includes(lowerFilter))
    };
  }, [data.text, data.links, data.images, data.metadata, data.events, filter]);

  // Memoize the tab click handler to prevent unnecessary re-renders
  const handleTabClick = useCallback((tabName: typeof tab) => {
    setTab(tabName);
  }, []);

  // Memoize date formatting function
  const formatEventDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy \'at\' h:mm a');
    } catch {
      return dateString; // Fallback to original string
    }
  }, []);

  // Memoize event type color mapping
  const getEventTypeColor = useCallback((type: string) => {
    const colors = {
      'meetup': '#3B82F6',      // Blue
      'workshop': '#10B981',    // Green
      'conference': '#8B5CF6',  // Purple
      'networking': '#F59E0B',  // Amber
      'startup': '#EF4444',     // Red
      'coworking': '#06B6D4',   // Cyan
      'presentation': '#EC4899', // Pink
      'competition': '#F97316',  // Orange
      'default': '#6B7280'      // Gray
    };
    return colors[type as keyof typeof colors] || colors['default'];
  }, []);

  const tabs = ['text', 'links', 'images', 'metadata', 'events', 'schema'] as const;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex bg-gray-50 rounded-t-lg border-b border-gray-200 p-1">
        {tabs.map((key) => (
          <button
            key={key}
            onClick={() => handleTabClick(key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === key 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'text' && (
        <div className="bg-gray-50 rounded-b-lg p-6 -mt-1 min-w-0">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">📝 Text Content ({filtered.text.length})</h3>
            
            {filtered.text.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500">No text content found matching your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                {filtered.text.map((text, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 ease-in-out cursor-default hover:shadow-md hover:-translate-y-0.5">
                    <p className="text-gray-700 leading-relaxed text-sm">{text}</p>
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {text.length} characters
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="bg-gray-50 rounded-b-lg p-6 -mt-1 min-w-0">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">📅 Events ({filtered.events.length})</h3>
            
            {filtered.events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500">No events found matching your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                {filtered.events.map((event, i) => {
                // Use memoized functions for performance
                const startDate = formatEventDate(event.startDate);
                const endDate = formatEventDate(event.endDate);
                const isMultiDay = event.startDate !== event.endDate;

                return (
                  <div 
                    key={i} 
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 ease-in-out cursor-default hover:shadow-md hover:-translate-y-0.5"
                  >
                    {/* Event Header */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="m-0 text-lg font-semibold text-slate-800 leading-snug">
                        {event.name}
                      </h3>
                      <span 
                        className="text-white px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wide min-w-fit ml-3"
                        style={{ backgroundColor: getEventTypeColor(event.eventType || 'default') }}
                      >
                        {event.eventType || 'Event'}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="flex flex-col gap-2">
                      {/* Date and Time */}
                      <div className="flex items-center gap-2">
                        <span className="text-base">📅</span>
                        <div>
                          <strong className="text-gray-700">
                            {startDate}
                          </strong>
                          {isMultiDay && (
                            <>
                              <span className="text-gray-500 mx-1">→</span>
                              <strong className="text-gray-700">
                                {endDate}
                              </strong>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">📍</span>
                          <span className="text-gray-700 font-medium">
                            {typeof event.location === 'string' ? event.location : event.location.name || 'Location'}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {event.description && event.description !== 'Not specified' && (
                        <div className="flex items-start gap-2 mt-2">
                          <span className="text-base mt-0.5">📝</span>
                          <p className="m-0 text-gray-600 leading-relaxed text-sm">
                            {event.description.length > 150 
                              ? `${event.description.substring(0, 150)}...` 
                              : event.description
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'links' && (
        <div className="bg-gray-50 rounded-b-lg p-6 -mt-1 min-w-0">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">🔗 Links ({filtered.links.length})</h3>
            
            {filtered.links.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500">No links found matching your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                {filtered.links.map((link, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 ease-in-out cursor-default hover:shadow-md hover:-translate-y-0.5">
                    <div className="space-y-2">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-700 hover:text-blue-900 font-medium leading-snug break-words block transition-colors duration-150">
                        {link.text}
                      </a>
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-mono break-all">
                          {link.url}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'schema' && (
        <div className="bg-gray-50 rounded-b-lg p-6 -mt-1 min-w-0">
          <div className="max-w-full overflow-hidden min-w-0">
              <div className="flex flex-col gap-8">
                <div className="w-full min-w-0">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">
                    📄 Web Page Schema
                  </h3>
                  <pre className="bg-slate-800 text-slate-200 p-6 rounded-lg overflow-x-auto overflow-y-auto text-sm font-mono border border-slate-600 w-full leading-6 whitespace-pre" style={{ tabSize: 2 }}>
                    {JSON.stringify(data.webPage, null, 2)}
                  </pre>
                </div>

                <div className="w-full min-w-0">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">
                    🌐 Web Site Schema
                  </h3>
                  <pre className="bg-slate-800 text-slate-200 p-6 rounded-lg overflow-x-auto overflow-y-auto text-sm font-mono border border-slate-600 w-full leading-6 whitespace-pre" style={{ tabSize: 2 }}>
                    {JSON.stringify(data.webSite, null, 2)}
                  </pre>
                </div>

                {data.events && data.events.length > 0 && (
                  <div className="w-full min-w-0">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">
                      📅 Events Schema ({data.events.length} events)
                    </h3>
                    <div className="flex flex-col gap-6 w-full">
                      {data.events.slice(0, 3).map((event, i) => (
                        <div key={i}>
                          <h4 className="text-sm font-medium mb-3 text-gray-700">
                            Event {i + 1}: {event.name}
                          </h4>
                          <pre className="bg-slate-800 text-slate-200 p-6 rounded-lg overflow-x-auto overflow-y-auto text-sm font-mono border border-slate-600 w-full leading-6 whitespace-pre" style={{ tabSize: 2 }}>
                            {JSON.stringify(event, null, 2)}
                          </pre>
                        </div>
                      ))}
                      {data.events.length > 3 && (
                        <p className="text-sm text-gray-500 italic">
                          ... and {data.events.length - 3} more events
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {data.images && data.images.length > 0 && (
                  <div className="w-full min-w-0">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">
                      🖼️ Image Objects Schema ({data.images.length} images)
                    </h3>
                    <div className="flex flex-col gap-6 w-full">
                      {data.images.slice(0, 2).map((image, i) => (
                        <div key={i}>
                          <h4 className="text-sm font-medium mb-3 text-gray-700">
                            Image {i + 1}: {image.name || 'Unnamed'}
                          </h4>
                          <pre className="bg-slate-800 text-slate-200 p-6 rounded-lg overflow-x-auto overflow-y-auto text-sm font-mono border border-slate-600 w-full leading-6 whitespace-pre" style={{ tabSize: 2 }}>
                            {JSON.stringify(image, null, 2)}
                          </pre>
                        </div>
                      ))}
                      {data.images.length > 2 && (
                        <p className="text-sm text-gray-500 italic">
                          ... and {data.images.length - 2} more images
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="w-full min-w-0">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">
                    📊 Complete Dataset Schema
                  </h3>
                  <pre className="bg-slate-800 text-slate-200 p-6 rounded-lg overflow-x-auto overflow-y-auto text-sm font-mono border border-slate-600 max-h-96 w-full leading-6 whitespace-pre" style={{ tabSize: 2 }}>
                    {JSON.stringify({
                      '@context': data['@context'],
                      '@type': data['@type'],
                      title: data.title,
                      description: data.description,
                      webSite: data.webSite,
                      webPage: data.webPage,
                      events: data.events,
                      images: data.images,
                      status: data.status
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
        </div>
      )}

      {tab === 'images' && (
        <div className="bg-gray-50 rounded-b-lg p-6 -mt-1 min-w-0">
          <div className="max-w-full overflow-hidden min-w-0">
            <div className="space-y-6">
              {filtered.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-500">No images found matching your filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filtered.images.map((img, i) => (
                    <div key={i} className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300">
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={img.url} 
                          alt={img.alternateName || img.name || ''} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 break-words">
                          {img.name || img.alternateName || 'Image'}
                        </h3>
                        {img.description && img.description !== img.alternateName && (
                          <p className="text-xs text-gray-600 leading-relaxed break-words line-clamp-2">
                            {img.description}
                          </p>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-400 font-mono break-all line-clamp-1" title={img.url}>
                            {img.url}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'metadata' && (
        <div className="bg-gray-50 rounded-b-lg p-6 -mt-1 min-w-0">
          <div className="max-w-full overflow-hidden min-w-0">
            <div className="space-y-6">
              {filtered.metadata.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-500">No metadata found matching your filter.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider min-w-0">Key</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider min-w-0">Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filtered.metadata.map(([k, v]) => (
                          <tr key={k} className="hover:bg-blue-50 transition-colors duration-150">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words align-top min-w-0">{k}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 break-words leading-relaxed min-w-0 max-w-md">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

