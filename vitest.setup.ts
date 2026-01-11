/**
 * Vitest Test Setup
 * Provides polyfills and global mocks for jsdom environment
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Polyfill HTMLCanvasElement for jsdom
if (typeof HTMLCanvasElement === 'undefined') {
  class MockHTMLCanvasElement {
    width = 300;
    height = 150;

    getContext() {
      return {
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillText: vi.fn(),
        strokeRect: vi.fn(),
        fillRect: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 10 }),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        setTransform: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn()
        }),
        createRadialGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn()
        }),
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1
        }),
        putImageData: vi.fn(),
        canvas: { width: 300, height: 150 },
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        globalAlpha: 1
      };
    }

    toDataURL() {
      return 'data:image/png;base64,mockdata';
    }

    toBlob(callback: (blob: Blob | null) => void) {
      callback(new Blob(['mock'], { type: 'image/png' }));
    }
  }

  (globalThis as any).HTMLCanvasElement = MockHTMLCanvasElement;
}

// Mock requestAnimationFrame and cancelAnimationFrame
if (typeof requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = vi.fn().mockImplementation((cb: FrameRequestCallback) => {
    return setTimeout(() => cb(Date.now()), 16);
  });
}

if (typeof cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = vi.fn().mockImplementation((id: number) => {
    clearTimeout(id);
  });
}

// Mock ResizeObserver
if (typeof ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
}

// Mock IntersectionObserver
if (typeof IntersectionObserver === 'undefined') {
  (globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
}

// Mock matchMedia
if (typeof matchMedia === 'undefined') {
  (globalThis as any).matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
}

// Mock URL.createObjectURL and revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn().mockImplementation(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
}
