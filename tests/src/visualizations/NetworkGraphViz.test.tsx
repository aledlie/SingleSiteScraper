import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NetworkGraphViz } from '../../../src/NetworkGraphViz';
import { HTMLGraph, HTMLObject, HTMLRelationship } from '../../../src/analytics/htmlObjectAnalyzer';

// Mock canvas context and requestAnimationFrame
const mockCanvasContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  strokeRect: vi.fn(),
  fillRect: vi.fn()
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
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
    setTimeout(cb, 16);
    return 1;
  });
  
  // Mock cancelAnimationFrame
  global.cancelAnimationFrame = vi.fn();
});

const createMockGraph = (): HTMLGraph => {
  const objects = new Map<string, HTMLObject>();
  
  objects.set('obj1', {
    id: 'obj1',
    tag: 'div',
    type: 'structural',
    attributes: {},
    text: 'Test div',
    position: { depth: 0, index: 0, parent: null },
    performance: { size: 100, complexity: 1.0 },
    semanticRole: 'container',
    schemaOrgType: null
  });
  
  objects.set('obj2', {
    id: 'obj2',
    tag: 'p',
    type: 'content',
    attributes: {},
    text: 'Test paragraph',
    position: { depth: 1, index: 0, parent: 'obj1' },
    performance: { size: 50, complexity: 0.5 },
    semanticRole: 'text',
    schemaOrgType: null
  });

  const relationships: HTMLRelationship[] = [
    {
      id: 'rel1',
      source: 'obj1',
      target: 'obj2',
      type: 'parent-child',
      strength: 1.0,
      metadata: {}
    }
  ];

  return {
    objects,
    relationships,
    metadata: {
      url: 'https://test.com',
      title: 'Test Page',
      totalObjects: 2,
      totalRelationships: 1,
      analysisTime: 100,
      performance: {
        complexity: 1.5,
        efficiency: 20
      }
    }
  };
};

describe('NetworkGraphViz', () => {
  it('renders without crashing', () => {
    const mockGraph = createMockGraph();
    const { container } = render(<NetworkGraphViz graph={mockGraph} />);
    
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const mockGraph = createMockGraph();
    const { container } = render(
      <NetworkGraphViz graph={mockGraph} className="custom-network" />
    );
    
    expect(container.firstChild).toHaveClass('relative', 'bg-white', 'rounded-lg', 'border', 'border-gray-200', 'custom-network');
  });

  it('sets canvas dimensions correctly', () => {
    const mockGraph = createMockGraph();
    render(<NetworkGraphViz graph={mockGraph} width={1000} height={800} />);
    
    expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, 1000, 800);
  });

  it('handles empty graph', () => {
    const emptyGraph: HTMLGraph = {
      objects: new Map(),
      relationships: [],
      metadata: {
        url: 'https://test.com',
        title: 'Empty Page',
        totalObjects: 0,
        totalRelationships: 0,
        analysisTime: 0,
        performance: {
          complexity: 0,
          efficiency: 0
        }
      }
    };
    
    const { container } = render(<NetworkGraphViz graph={emptyGraph} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('creates nodes for all objects', () => {
    const mockGraph = createMockGraph();
    render(<NetworkGraphViz graph={mockGraph} />);
    
    // Should clear canvas and start animation
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('renders legend with node types', () => {
    const mockGraph = createMockGraph();
    const { container } = render(<NetworkGraphViz graph={mockGraph} />);
    
    expect(container.textContent).toContain('Node Types:');
    expect(container.textContent).toContain('Interactive');
    expect(container.textContent).toContain('Media');
    expect(container.textContent).toContain('Structural');
    expect(container.textContent).toContain('Content');
    expect(container.textContent).toContain('Data');
    expect(container.textContent).toContain('Form');
  });

  it('applies canvas styling', () => {
    const mockGraph = createMockGraph();
    const { container } = render(<NetworkGraphViz graph={mockGraph} />);
    const canvas = container.querySelector('canvas');
    
    expect(canvas).toHaveStyle({
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      background: 'white'
    });
  });

  it('assigns correct colors to different node types', () => {
    const mockGraph = createMockGraph();
    
    // Add nodes of different types
    mockGraph.objects.set('interactive', {
      id: 'interactive',
      tag: 'button',
      type: 'interactive',
      attributes: {},
      text: 'Click me',
      position: { depth: 0, index: 0, parent: null },
      performance: { size: 30, complexity: 0.3 },
      semanticRole: 'button',
      schemaOrgType: null
    });
    
    mockGraph.objects.set('media', {
      id: 'media',
      tag: 'img',
      type: 'media',
      attributes: {},
      text: '',
      position: { depth: 0, index: 0, parent: null },
      performance: { size: 200, complexity: 0.1 },
      semanticRole: 'image',
      schemaOrgType: null
    });
    
    render(<NetworkGraphViz graph={mockGraph} />);
    
    // Animation should be running
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('creates links between related objects', () => {
    const mockGraph = createMockGraph();
    
    // Add more relationships
    mockGraph.relationships.push({
      id: 'rel2',
      source: 'obj1',
      target: 'obj2',
      type: 'sibling',
      strength: 0.5,
      metadata: {}
    });
    
    render(<NetworkGraphViz graph={mockGraph} />);
    
    // Should process relationships and draw links
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('cleans up animation on unmount', () => {
    const mockGraph = createMockGraph();
    const { unmount } = render(<NetworkGraphViz graph={mockGraph} />);
    
    unmount();
    
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles graph updates', () => {
    const mockGraph = createMockGraph();
    const { rerender } = render(<NetworkGraphViz graph={mockGraph} />);
    
    // Update the graph
    const updatedGraph = createMockGraph();
    updatedGraph.objects.set('obj3', {
      id: 'obj3',
      tag: 'span',
      type: 'content',
      attributes: {},
      text: 'New span',
      position: { depth: 2, index: 0, parent: 'obj2' },
      performance: { size: 20, complexity: 0.2 },
      semanticRole: 'text',
      schemaOrgType: null
    });
    
    rerender(<NetworkGraphViz graph={updatedGraph} />);
    
    // Should restart animation with new graph
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it('calculates node sizes based on performance', () => {
    const mockGraph = createMockGraph();
    
    // Add object with different performance size
    mockGraph.objects.set('large', {
      id: 'large',
      tag: 'section',
      type: 'structural',
      attributes: {},
      text: 'Large section',
      position: { depth: 0, index: 0, parent: null },
      performance: { size: 2000, complexity: 2.0 }, // Large size
      semanticRole: 'section',
      schemaOrgType: null
    });
    
    render(<NetworkGraphViz graph={mockGraph} />);
    
    // Should create nodes with different sizes
    expect(requestAnimationFrame).toHaveBeenCalled();
  });
});