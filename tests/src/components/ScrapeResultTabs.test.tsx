import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScrapeResultTabs } from '../../../src/components/ScrapeResultTabs';
import type { ScrapedData, EventData, ImageObject, WebSite, WebPage } from '../../../src/types';

describe('ScrapeResultTabs with Schema.org Data', () => {
  let mockData: ScrapedData;

  beforeEach(() => {
    const mockEvents: EventData[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Tech Conference 2025',
        startDate: '2025-06-15T09:00:00Z',
        endDate: '2025-06-15T17:00:00Z',
        location: {
          '@context': 'https://schema.org',
          '@type': 'Place',
          name: 'Austin Convention Center',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '500 E Cesar Chavez St',
            addressLocality: 'Austin',
            addressRegion: 'TX'
          }
        },
        description: 'Annual tech conference',
        eventType: 'conference',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
        organizer: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Tech Events Inc'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Networking Mixer',
        startDate: '2025-06-20T18:00:00Z',
        endDate: '2025-06-20T20:00:00Z',
        location: 'Downtown Bar',
        description: 'Monthly networking event',
        eventType: 'networking',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode'
      }
    ];

    const mockImages: ImageObject[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/image1.jpg',
        contentUrl: '/image1.jpg',
        name: 'Conference Banner',
        alternateName: 'Tech conference banner image',
        description: 'Banner for the tech conference',
        width: 800,
        height: 400,
        encodingFormat: 'image/jpeg'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/image2.png',
        contentUrl: '/image2.png',
        name: 'Logo',
        alternateName: 'Company logo',
        description: 'Official company logo',
        encodingFormat: 'image/png'
      }
    ];

    const mockWebSite: WebSite = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Test Conference Site',
      url: 'https://testconf.com',
      description: 'Annual technology conference website',
      publisher: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Tech Events Inc'
      }
    };

    const mockWebPage: WebPage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Conference Events',
      url: 'https://testconf.com/events',
      description: 'List of conference events',
      isPartOf: mockWebSite,
      datePublished: '2025-01-01T00:00:00Z'
    };

    mockData = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      title: 'Test Conference Site',
      description: 'Annual technology conference website',
      links: [
        { text: 'Register Now', url: '/register' },
        { text: 'Speakers', url: '/speakers' }
      ],
      images: mockImages,
      text: ['Welcome to our conference', 'Join us for networking'],
      metadata: { keywords: 'tech, conference, networking' },
      events: mockEvents,
      webSite: mockWebSite,
      webPage: mockWebPage,
      status: {
        success: true,
        contentLength: 5000,
        responseTime: 1500,
        proxyUsed: 'CORS Proxy',
        contentType: 'text/html'
      }
    };
  });

  describe('Events Tab', () => {
    it('renders events with schema.org data correctly', () => {
      render(<ScrapeResultTabs data={mockData} filter="" />);
      
      // Switch to events tab
      fireEvent.click(screen.getByText('EVENTS'));
      
      // Check that events are rendered
      expect(screen.getByText('Tech Conference 2025')).toBeInTheDocument();
      expect(screen.getByText('Networking Mixer')).toBeInTheDocument();
      
      // Check event type badges (content is lowercase, but CSS transforms to uppercase)
      const conferenceBadge = screen.getByText('conference');
      expect(conferenceBadge).toBeInTheDocument();
      expect(conferenceBadge).toHaveStyle({ textTransform: 'uppercase' });
      
      const networkingBadge = screen.getByText('networking');
      expect(networkingBadge).toBeInTheDocument();
      expect(networkingBadge).toHaveStyle({ textTransform: 'uppercase' });
      
      // Check location rendering for Place object
      expect(screen.getByText('Austin Convention Center')).toBeInTheDocument();
      
      // Check location rendering for string
      expect(screen.getByText('Downtown Bar')).toBeInTheDocument();
      
      // Check descriptions
      expect(screen.getByText('Annual tech conference')).toBeInTheDocument();
      expect(screen.getByText('Monthly networking event')).toBeInTheDocument();
    });

    it('formats event dates correctly', () => {
      render(<ScrapeResultTabs data={mockData} filter="" />);
      fireEvent.click(screen.getByText('EVENTS'));
      
      // Should format ISO dates to human-readable format
      expect(screen.getByText(/June 15, 2025 at/)).toBeInTheDocument();
      expect(screen.getByText(/June 20, 2025 at/)).toBeInTheDocument();
    });

    it('handles multi-day events correctly', () => {
      const multiDayEvent: EventData = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Multi-Day Summit',
        startDate: '2025-07-01T09:00:00Z',
        endDate: '2025-07-03T17:00:00Z',
        location: 'Convention Center',
        eventType: 'conference',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode'
      };

      const dataWithMultiDay = { ...mockData, events: [multiDayEvent] };
      
      render(<ScrapeResultTabs data={dataWithMultiDay} filter="" />);
      fireEvent.click(screen.getByText('EVENTS'));
      
      // Should show arrow for multi-day events
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('filters events correctly', () => {
      render(<ScrapeResultTabs data={mockData} filter="networking" />);
      fireEvent.click(screen.getByText('EVENTS'));
      
      // Should only show networking event
      expect(screen.getByText('Networking Mixer')).toBeInTheDocument();
      expect(screen.queryByText('Tech Conference 2025')).not.toBeInTheDocument();
    });
  });

  describe('Images Tab', () => {
    it('renders schema.org ImageObjects correctly', () => {
      render(<ScrapeResultTabs data={mockData} filter="" />);
      fireEvent.click(screen.getByText('IMAGES'));
      
      // Check images are rendered
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      
      expect(images[0]).toHaveAttribute('src', '/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Tech conference banner image');
      
      expect(images[1]).toHaveAttribute('src', '/image2.png');
      expect(images[1]).toHaveAttribute('alt', 'Company logo');
      
      // Check captions use name property
      expect(screen.getByText('Conference Banner')).toBeInTheDocument();
      expect(screen.getByText('Logo')).toBeInTheDocument();
      
      // Check descriptions are shown when different from alt text
      expect(screen.getByText('Banner for the tech conference')).toBeInTheDocument();
      expect(screen.getByText('Official company logo')).toBeInTheDocument();
    });

    it('filters images correctly', () => {
      render(<ScrapeResultTabs data={mockData} filter="banner" />);
      fireEvent.click(screen.getByText('IMAGES'));
      
      // Should only show banner image
      expect(screen.getByText('Conference Banner')).toBeInTheDocument();
      expect(screen.queryByText('Logo')).not.toBeInTheDocument();
    });
  });

  describe('Schema Tab', () => {
    it('renders the schema tab and displays structured data', () => {
      render(<ScrapeResultTabs data={mockData} filter="" />);
      
      // Check that schema tab exists
      expect(screen.getByText('SCHEMA')).toBeInTheDocument();
      
      // Switch to schema tab
      fireEvent.click(screen.getByText('SCHEMA'));
      
      // Check section headers
      expect(screen.getByText('📄 Web Page Schema')).toBeInTheDocument();
      expect(screen.getByText('🌐 Web Site Schema')).toBeInTheDocument();
      expect(screen.getByText('📅 Events Schema (2 events)')).toBeInTheDocument();
      expect(screen.getByText('🖼️ Image Objects Schema (2 images)')).toBeInTheDocument();
      expect(screen.getByText('📊 Complete Dataset Schema')).toBeInTheDocument();
    });

    it('displays JSON-formatted schema data', () => {
      render(<ScrapeResultTabs data={mockData} filter="" />);
      fireEvent.click(screen.getByText('SCHEMA'));
      
      // Should contain JSON representations
      expect(screen.getByText(/"@type": "WebSite"/)).toBeInTheDocument();
      expect(screen.getByText(/"@type": "WebPage"/)).toBeInTheDocument();
      expect(screen.getByText(/"@type": "Event"/)).toBeInTheDocument();
      expect(screen.getByText(/"@type": "Dataset"/)).toBeInTheDocument();
    });

    it('limits event display in schema tab', () => {
      // Create data with many events
      const manyEvents = Array(5).fill(null).map((_, i) => ({
        '@context': 'https://schema.org' as const,
        '@type': 'Event' as const,
        name: `Event ${i + 1}`,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-01T01:00:00Z',
        eventType: 'default',
        eventStatus: 'EventScheduled' as const,
        eventAttendanceMode: 'OfflineEventAttendanceMode' as const
      }));

      const dataWithManyEvents = { ...mockData, events: manyEvents };
      
      render(<ScrapeResultTabs data={dataWithManyEvents} filter="" />);
      fireEvent.click(screen.getByText('SCHEMA'));
      
      // Should show only first 3 events
      expect(screen.getByText('Event 1: Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2: Event 2')).toBeInTheDocument();
      expect(screen.getByText('Event 3: Event 3')).toBeInTheDocument();
      
      // Should show "and X more" message
      expect(screen.getByText('... and 2 more events')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', () => {
      render(<ScrapeResultTabs data={mockData} filter="" />);
      
      // Default should be text tab
      expect(screen.getByText('Welcome to our conference')).toBeInTheDocument();
      
      // Switch to events
      fireEvent.click(screen.getByText('EVENTS'));
      expect(screen.getByText('Tech Conference 2025')).toBeInTheDocument();
      
      // Switch to images
      fireEvent.click(screen.getByText('IMAGES'));
      expect(screen.getAllByRole('img')).toHaveLength(2);
      
      // Switch to metadata
      fireEvent.click(screen.getByText('METADATA'));
      expect(screen.getByText('keywords')).toBeInTheDocument();
      
      // Switch to schema
      fireEvent.click(screen.getByText('SCHEMA'));
      expect(screen.getByText('📄 Web Page Schema')).toBeInTheDocument();
    });

    it('applies active styling to current tab', () => {
      render(<ScrapeResultTabs data={mockData} filter="" />);
      
      const textTab = screen.getByText('TEXT');
      const eventsTab = screen.getByText('EVENTS');
      
      // Text tab should be active by default (should have blue background and white text)
      expect(textTab).toHaveClass('bg-white', 'text-blue-600');
      expect(eventsTab).not.toHaveClass('bg-white', 'text-blue-600');
      
      // Switch to events
      fireEvent.click(eventsTab);
      
      expect(textTab).not.toHaveClass('bg-white', 'text-blue-600');
      expect(eventsTab).toHaveClass('bg-white', 'text-blue-600');
    });
  });

  describe('Empty State Handling', () => {
    it('shows empty state for events when no events match filter', () => {
      render(<ScrapeResultTabs data={mockData} filter="nonexistent" />);
      fireEvent.click(screen.getByText('EVENTS'));
      
      expect(screen.getByText('No events found matching your filter.')).toBeInTheDocument();
    });

    it('handles data without events', () => {
      const dataWithoutEvents = { ...mockData, events: [] };
      
      render(<ScrapeResultTabs data={dataWithoutEvents} filter="" />);
      fireEvent.click(screen.getByText('SCHEMA'));
      
      // Should not show events schema section
      expect(screen.queryByText('📅 Events Schema')).not.toBeInTheDocument();
    });

    it('handles data without images', () => {
      const dataWithoutImages = { ...mockData, images: [] };
      
      render(<ScrapeResultTabs data={dataWithoutImages} filter="" />);
      fireEvent.click(screen.getByText('SCHEMA'));
      
      // Should not show images schema section
      expect(screen.queryByText('🖼️ Image Objects Schema')).not.toBeInTheDocument();
    });
  });
});