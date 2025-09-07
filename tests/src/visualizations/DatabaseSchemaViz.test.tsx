import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatabaseSchemaViz, DatabaseTable } from '../../../src/visualizations/DatabaseSchemaViz';

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  canvas: { toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test') }
};

beforeEach(() => {
  vi.clearAllMocks();
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext);
  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    set: vi.fn(),
    configurable: true
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    set: vi.fn(),
    configurable: true
  });
});

const mockTables: DatabaseTable[] = [
  {
    name: 'html_graphs',
    schema: {
      id: 'VARCHAR(255) PRIMARY KEY',
      url: 'TEXT NOT NULL',
      title: 'TEXT'
    },
    indexes: ['url'],
    constraints: []
  },
  {
    name: 'html_objects',
    schema: {
      id: 'VARCHAR(255) PRIMARY KEY',
      graph_id: 'VARCHAR(255) NOT NULL',
      tag: 'VARCHAR(50)'
    },
    indexes: ['graph_id'],
    constraints: ['FOREIGN KEY (graph_id) REFERENCES html_graphs(id)']
  }
];

describe('DatabaseSchemaViz', () => {
  it('renders without crashing', () => {
    render(<DatabaseSchemaViz tables={mockTables} />);
    expect(screen.getByText('Zoom Out')).toBeInTheDocument();
    expect(screen.getByText('Zoom In')).toBeInTheDocument();
  });

  it('displays correct table statistics', () => {
    render(<DatabaseSchemaViz tables={mockTables} />);
    expect(screen.getByText('Tables: 2')).toBeInTheDocument();
    expect(screen.getByText('Relationships: 1')).toBeInTheDocument();
    expect(screen.getByText('Total Columns: 6')).toBeInTheDocument();
  });

  it('shows legend with correct information', () => {
    render(<DatabaseSchemaViz tables={mockTables} />);
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Primary Key (PK)')).toBeInTheDocument();
    expect(screen.getByText('Foreign Key (FK)')).toBeInTheDocument();
    expect(screen.getByText('Relationship')).toBeInTheDocument();
    expect(screen.getByText('Indexed Column')).toBeInTheDocument();
  });

  it('handles zoom in and zoom out', async () => {
    render(<DatabaseSchemaViz tables={mockTables} />);
    
    const zoomInButton = screen.getByText('Zoom In');
    const zoomOutButton = screen.getByText('Zoom Out');
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    fireEvent.click(zoomInButton);
    await waitFor(() => {
      expect(screen.getByText('110%')).toBeInTheDocument();
    });
    
    fireEvent.click(zoomOutButton);
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('exports PNG when PNG button is clicked', () => {
    const mockClick = vi.fn();
    const mockElement = { click: mockClick, href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
    
    render(<DatabaseSchemaViz tables={mockTables} />);
    
    const pngButton = screen.getByText('PNG');
    fireEvent.click(pngButton);
    
    expect(mockCanvasContext.canvas.toDataURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockElement.download).toBe('database-schema.png');
  });

  it('exports SQL DDL when SQL button is clicked', () => {
    const mockClick = vi.fn();
    const mockElement = { click: mockClick, href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    
    render(<DatabaseSchemaViz tables={mockTables} />);
    
    const sqlButton = screen.getByText('SQL');
    fireEvent.click(sqlButton);
    
    expect(mockClick).toHaveBeenCalled();
    expect(mockElement.download).toBe('database-schema.sql');
  });

  it('handles canvas click for table selection', () => {
    const { container } = render(<DatabaseSchemaViz tables={mockTables} />);
    const canvas = container.querySelector('canvas');
    
    if (canvas) {
      // Mock getBoundingClientRect for click position calculation
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 1200,
        height: 800
      } as DOMRect);
      
      fireEvent.click(canvas, { clientX: 200, clientY: 200 });
      
      // Canvas context methods should be called for rendering
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    }
  });

  it('handles custom export function', () => {
    const mockOnExport = vi.fn();
    render(<DatabaseSchemaViz tables={mockTables} onExport={mockOnExport} />);
    
    const pngButton = screen.getByText('PNG');
    fireEvent.click(pngButton);
    
    expect(mockOnExport).toHaveBeenCalled();
  });

  it('calculates relationships correctly from constraints', () => {
    const tablesWithMultipleRelations: DatabaseTable[] = [
      ...mockTables,
      {
        name: 'performance_metrics',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          graph_id: 'VARCHAR(255) NOT NULL'
        },
        indexes: ['graph_id'],
        constraints: ['FOREIGN KEY (graph_id) REFERENCES html_graphs(id)']
      }
    ];
    
    render(<DatabaseSchemaViz tables={tablesWithMultipleRelations} />);
    expect(screen.getByText('Relationships: 2')).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    render(<DatabaseSchemaViz tables={mockTables} width={800} height={600} />);
    
    expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  it('applies custom className', () => {
    const { container } = render(
      <DatabaseSchemaViz tables={mockTables} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('relative', 'bg-white', 'rounded-lg', 'border', 'border-gray-200', 'custom-class');
  });
});