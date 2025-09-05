import React, { useState } from 'react';
import { ScrapedData } from '../types/index.ts';
import { Card } from './ui/Card.tsx';
import { format } from 'date-fns';

interface Props {
  data: ScrapedData;
  filter: string;
}

export const ScrapeResultTabs: React.FC<Props> = ({ data, filter }) => {
  const [tab, setTab] = useState<'text' | 'links' | 'images' | 'metadata' | 'events'>('text');

  const filtered = {
    text: data.text.filter((t) => t.toLowerCase().includes(filter.toLowerCase())),
    links: data.links.filter((l) => l.text.toLowerCase().includes(filter.toLowerCase()) || l.url.toLowerCase().includes(filter.toLowerCase())),
    images: data.images.filter((i) => i.alt.toLowerCase().includes(filter.toLowerCase()) || i.src.toLowerCase().includes(filter.toLowerCase())),
    metadata: Object.entries(data.metadata).filter(([k, v]) => k.includes(filter) || v.includes(filter)),
    events: data.events.filter((e) => e.summary.includes(filter))
  };

  const tabs = ['text', 'links', 'images', 'metadata', 'events'] as const;

  return (
    <div className="tab-panel">
      <div className="tab-header">
        {tabs.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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

        {tab === 'events' && (
          <div className="events-container">
            {filtered.events.length === 0 ? (
              <div className="empty-state">
                <p>No events found matching your filter.</p>
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

                const startDate = formatEventDate(event.start);
                const endDate = formatEventDate(event.end);
                const isMultiDay = event.start !== event.end;

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
                        {event.summary}
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
                            {event.location}
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

