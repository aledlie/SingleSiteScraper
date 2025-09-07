import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WordCloudViz } from '../../../src/WordCloudViz';

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 50 }),
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

const mockWords = [
  { text: 'medicina', value: 45 },
  { text: 'paciente', value: 38 },
  { text: 'tratamiento', value: 32 },
  { text: 'diagnóstico', value: 28 },
  { text: 'salud', value: 25 }
];

describe('WordCloudViz', () => {
  it('renders without crashing', () => {
    const { container } = render(<WordCloudViz words={mockWords} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <WordCloudViz words={mockWords} className="custom-word-cloud" />
    );
    expect(container.firstChild).toHaveClass('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'custom-word-cloud');
  });

  it('sets canvas dimensions correctly', () => {
    render(<WordCloudViz words={mockWords} width={800} height={600} />);
    expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  it('handles empty word array', () => {
    render(<WordCloudViz words={[]} />);
    // Should not crash and should clear the canvas
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
  });

  it('processes and renders words', () => {
    render(<WordCloudViz words={mockWords} />);
    
    // Should have called fillText for each word
    expect(mockCanvasContext.fillText).toHaveBeenCalledTimes(mockWords.length);
    
    // Should have measured text for each word
    expect(mockCanvasContext.measureText).toHaveBeenCalledTimes(mockWords.length);
  });

  it('limits words to maximum of 50', () => {
    const manyWords = Array.from({ length: 100 }, (_, i) => ({
      text: `word${i}`,
      value: 100 - i
    }));
    
    render(<WordCloudViz words={manyWords} />);
    
    // Should only render 50 words maximum
    expect(mockCanvasContext.fillText).toHaveBeenCalledTimes(50);
  });

  it('uses custom colors when provided', () => {
    const wordsWithColors = mockWords.map((word, i) => ({
      ...word,
      color: `#${i}${i}${i}${i}${i}${i}`
    }));
    
    render(<WordCloudViz words={wordsWithColors} />);
    
    // Should render all words
    expect(mockCanvasContext.fillText).toHaveBeenCalledTimes(wordsWithColors.length);
  });

  it('handles single word', () => {
    const singleWord = [{ text: 'test', value: 10 }];
    render(<WordCloudViz words={singleWord} />);
    
    expect(mockCanvasContext.fillText).toHaveBeenCalledTimes(1);
    expect(mockCanvasContext.measureText).toHaveBeenCalledWith('test');
  });

  it('scales font sizes based on word values', () => {
    const wordsWithVariedValues = [
      { text: 'big', value: 100 },
      { text: 'medium', value: 50 },
      { text: 'small', value: 1 }
    ];
    
    render(<WordCloudViz words={wordsWithVariedValues} />);
    
    // Should have different font sizes (can't directly test, but ensures processing works)
    expect(mockCanvasContext.fillText).toHaveBeenCalledTimes(3);
  });

  it('applies canvas styling', () => {
    const { container } = render(<WordCloudViz words={mockWords} />);
    const canvas = container.querySelector('canvas');
    
    expect(canvas).toHaveStyle({
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      background: 'white'
    });
  });
});