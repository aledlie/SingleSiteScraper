import React, { useState } from 'react';
import { ScrapedData } from '../types/index.ts';
import { Card } from './ui/Card.tsx';
import { format } from 'date-fns';

interface Props {
  data: ScrapedData;
  filter: string;
}

export const ScrapeResultTabs: React.FC<Props> = ({ data, filter }) => {
  const [tab, setTab] = useState<'text' | 'links' | 'images' | 'metadata' | 'events' | 'schema'>('text');

  const filtered = {
    text: data.text.filter((t) => t.toLowerCase().includes(filter.toLowerCase())),
    links: data.links.filter((l) => l.text.toLowerCase().includes(filter.toLowerCase()) || l.url.toLowerCase().includes(filter.toLowerCase())),
    images: data.images.filter((i) => (i.alternateName || '').toLowerCase().includes(filter.toLowerCase()) || i.url.toLowerCase().includes(filter.toLowerCase())),
    metadata: Object.entries(data.metadata).filter(([k, v]) => k.includes(filter) || v.includes(filter)),
    events: data.events.filter((e) => e.name.includes(filter))
  };

  const tabs = ['text', 'links', 'images', 'metadata', 'events', 'schema'] as const;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex bg-gray-50 rounded-t-lg border-b border-gray-200 p-1">
        {tabs.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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

      <Card>
        {tab === 'text' && filtered.text.map((t, i) => (
          <p key={i} className="mb-4 text-gray-700 leading-relaxed">{t}</p>
        ))}

        {tab === 'events' && (
          <div className="space-y-4">
            {filtered.events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500">No events found matching your filter.</p>
              </div>
            ) : (
              filtered.events.map((event, i) => {
                // Format dates to be human-readable
                const formatEventDate = (dateString: string) => {
                  try {
                    const date = new Date(dateString);
                    return format(date, 'MMMM d, yyyy \'at\' h:mm a');
                  } catch (error) {
                    return dateString; // Fallback to original string
                  }
                };

                const startDate = formatEventDate(event.startDate);
                const endDate = formatEventDate(event.endDate);
                const isMultiDay = event.startDate !== event.endDate;

                // Get event type color
                const getEventTypeColor = (type: string) => {
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
                  return colors[type] || colors['default'];
                };

                return (
                  <div 
                    key={i} 
                    className="event-card"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Event Header */}
                    <div className="event-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#1e293b',
                        lineHeight: '1.3'
                      }}>
                        {event.name}
                      </h3>
                      <span 
                        className="event-type-badge"
                        style={{
                          backgroundColor: getEventTypeColor(event.eventType || 'default'),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: 'fit-content',
                          marginLeft: '12px'
                        }}
                      >
                        {event.eventType || 'Event'}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="event-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Date and Time */}
                      <div className="event-datetime" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>📅</span>
                        <div>
                          <strong style={{ color: '#374151' }}>
                            {startDate}
                          </strong>
                          {isMultiDay && (
                            <>
                              <span style={{ color: '#6b7280', margin: '0 4px' }}>→</span>
                              <strong style={{ color: '#374151' }}>
                                {endDate}
                              </strong>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="event-location" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>📍</span>
                          <span style={{ color: '#374151', fontWeight: '500' }}>
                            {typeof event.location === 'string' ? event.location : event.location.name || 'Location'}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {event.description && event.description !== 'Not specified' && (
                        <div className="event-description" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px' }}>
                          <span style={{ fontSize: '16px', marginTop: '2px' }}>📝</span>
                          <p style={{ 
                            margin: 0, 
                            color: '#4b5563', 
                            lineHeight: '1.4',
                            fontSize: '14px'
                          }}>
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
              })
            )}
          </div>
        )}

        {tab === 'links' && filtered.links.map((l, i) => (
          <div key={i} className="mb-4 p-3 border border-gray-200 rounded-lg">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">{l.text}</a>
            <p className="text-sm text-gray-500 mt-1">{l.url}</p>
          </div>
        ))}

        {tab === 'images' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.images.map((img, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <img src={img.url} alt={img.alternateName || img.name || ''} className="w-full h-48 object-cover" />
                <p className="p-3 font-medium text-gray-900">{img.name || img.alternateName || 'Image'}</p>
                {img.description && img.description !== img.alternateName && (
                  <p className="px-3 pb-3 text-xs text-gray-500">
                    {img.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'metadata' && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.metadata.map(([k, v]) => (
                <tr key={k} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{k}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'schema' && (
          <div className="flex flex-col gap-6 w-full">
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-3 text-slate-800">
                📄 Web Page Schema
              </h3>
              <pre style={{ 
                backgroundColor: '#f8fafc', 
                padding: '16px', 
                borderRadius: '8px', 
                overflow: 'auto',
                fontSize: '14px',
                border: '1px solid #e2e8f0',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {JSON.stringify(data.webPage, null, 2)}
              </pre>
            </div>

            <div className="w-full">
              <h3 className="text-lg font-semibold mb-3 text-slate-800">
                🌐 Web Site Schema
              </h3>
              <pre style={{ 
                backgroundColor: '#f8fafc', 
                padding: '16px', 
                borderRadius: '8px', 
                overflow: 'auto',
                fontSize: '14px',
                border: '1px solid #e2e8f0',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {JSON.stringify(data.webSite, null, 2)}
              </pre>
            </div>

            {data.events && data.events.length > 0 && (
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-3 text-slate-800">
                  📅 Events Schema ({data.events.length} events)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  {data.events.slice(0, 3).map((event, i) => (
                    <div key={i}>
                      <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                        Event {i + 1}: {event.name}
                      </h4>
                      <pre style={{ 
                        backgroundColor: '#f8fafc', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        overflow: 'auto',
                        fontSize: '12px',
                        border: '1px solid #e2e8f0',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        {JSON.stringify(event, null, 2)}
                      </pre>
                    </div>
                  ))}
                  {data.events.length > 3 && (
                    <p style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                      ... and {data.events.length - 3} more events
                    </p>
                  )}
                </div>
              </div>
            )}

            {data.images && data.images.length > 0 && (
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-3 text-slate-800">
                  🖼️ Image Objects Schema ({data.images.length} images)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  {data.images.slice(0, 2).map((image, i) => (
                    <div key={i}>
                      <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                        Image {i + 1}: {image.name || 'Unnamed'}
                      </h4>
                      <pre style={{ 
                        backgroundColor: '#f8fafc', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        overflow: 'auto',
                        fontSize: '12px',
                        border: '1px solid #e2e8f0',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        {JSON.stringify(image, null, 2)}
                      </pre>
                    </div>
                  ))}
                  {data.images.length > 2 && (
                    <p style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                      ... and {data.images.length - 2} more images
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="w-full">
              <h3 className="text-lg font-semibold mb-3 text-slate-800">
                📊 Complete Dataset Schema
              </h3>
              <pre style={{ 
                backgroundColor: '#f8fafc', 
                padding: '16px', 
                borderRadius: '8px', 
                overflow: 'auto',
                fontSize: '12px',
                border: '1px solid #e2e8f0',
                maxHeight: '400px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
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
        )}
      </Card>
    </div>
  );
};

