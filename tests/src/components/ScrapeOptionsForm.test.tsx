import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScrapeOptionsForm } from '../../../src/components/ScrapeOptionsForm';
import type { ScrapeOptions } from '../../../src/types';

describe('ScrapeOptionsForm', () => {
  const defaultOptions: ScrapeOptions = {
    includeText: true,
    includeLinks: true,
    includeImages: true,
    includeMetadata: true,
    includeEvents: true,
    maxLinks: 100,
    maxImages: 10,
    maxTextElements: 200,
    maxEvents: 20,
    timeout: 30000,
    retryAttempts: 3
  };

  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  it('renders scraping options section title', () => {
    render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
    expect(screen.getByText('Scraping Options')).toBeInTheDocument();
  });

  it('renders content limits section title', () => {
    render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
    expect(screen.getByText('Content Limits')).toBeInTheDocument();
  });

  it('renders request settings section title', () => {
    render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
    expect(screen.getByText('Request Settings')).toBeInTheDocument();
  });

  describe('Checkboxes', () => {
    it('renders Text checkbox', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Text')).toBeInTheDocument();
    });

    it('renders Links checkbox', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Links')).toBeInTheDocument();
    });

    it('renders Images checkbox', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Images')).toBeInTheDocument();
    });

    it('renders Metadata checkbox', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Metadata')).toBeInTheDocument();
    });

    it('renders Events checkbox', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Events')).toBeInTheDocument();
    });

    it('checkbox reflects option value', () => {
      render(
        <ScrapeOptionsForm
          options={{ ...defaultOptions, includeText: false }}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByLabelText('Text')).not.toBeChecked();
    });

    it('calls onChange when checkbox is toggled', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);

      const textCheckbox = screen.getByLabelText('Text');
      fireEvent.click(textCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultOptions,
        includeText: false
      });
    });
  });

  describe('Number Inputs', () => {
    const getInputByLabel = (container: HTMLElement, label: string) => {
      const labelEl = Array.from(container.querySelectorAll('.form-label'))
        .find(el => el.textContent === label);
      return labelEl?.closest('div')?.querySelector('input');
    };

    it('renders Max Links input', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByText('Max Links')).toBeInTheDocument();
    });

    it('renders Max Images input', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByText('Max Images')).toBeInTheDocument();
    });

    it('renders Max Text Elements input', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByText('Max Text Elements')).toBeInTheDocument();
    });

    it('renders Timeout input', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByText('Timeout (ms)')).toBeInTheDocument();
    });

    it('renders Retry Attempts input', () => {
      render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      expect(screen.getByText('Retry Attempts')).toBeInTheDocument();
    });

    it('number input reflects option value', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      const input = getInputByLabel(container, 'Max Links');
      expect(input).toHaveValue(100);
    });

    it('calls onChange when number input changes', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);

      const maxLinksInput = getInputByLabel(container, 'Max Links');
      fireEvent.change(maxLinksInput!, { target: { value: '200' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultOptions,
        maxLinks: 200
      });
    });

    it('calls onChange when timeout changes', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);

      const timeoutInput = getInputByLabel(container, 'Timeout (ms)');
      fireEvent.change(timeoutInput!, { target: { value: '60000' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultOptions,
        timeout: 60000
      });
    });

    it('calls onChange when retry attempts changes', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);

      const retryInput = getInputByLabel(container, 'Retry Attempts');
      fireEvent.change(retryInput!, { target: { value: '5' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultOptions,
        retryAttempts: 5
      });
    });
  });

  describe('Input Validation', () => {
    const getInputByLabel = (container: HTMLElement, label: string) => {
      const labelEl = Array.from(container.querySelectorAll('.form-label'))
        .find(el => el.textContent === label);
      return labelEl?.closest('div')?.querySelector('input');
    };

    it('Max Links has min and max attributes', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      const input = getInputByLabel(container, 'Max Links');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '500');
    });

    it('Max Images has min and max attributes', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      const input = getInputByLabel(container, 'Max Images');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '200');
    });

    it('Timeout has min and max attributes', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      const input = getInputByLabel(container, 'Timeout (ms)');
      expect(input).toHaveAttribute('min', '5000');
      expect(input).toHaveAttribute('max', '120000');
    });

    it('Retry Attempts has min and max attributes', () => {
      const { container } = render(<ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />);
      const input = getInputByLabel(container, 'Retry Attempts');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '5');
    });
  });

  describe('Structure', () => {
    it('renders inside a Card component', () => {
      const { container } = render(
        <ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />
      );
      expect(container.querySelector('.card')).toBeInTheDocument();
    });

    it('applies checkbox-grid class to checkbox container', () => {
      const { container } = render(
        <ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />
      );
      expect(container.querySelector('.checkbox-grid')).toBeInTheDocument();
    });

    it('applies layout-grid class to number input containers', () => {
      const { container } = render(
        <ScrapeOptionsForm options={defaultOptions} onChange={mockOnChange} />
      );
      const grids = container.querySelectorAll('.layout-grid');
      expect(grids.length).toBeGreaterThanOrEqual(2);
    });
  });
});
