import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from '../../../src/components/ProgressBar';

describe('ProgressIndicator', () => {
  it('renders when isLoading is true', () => {
    render(<ProgressIndicator isLoading={true} progress="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render when isLoading is false', () => {
    const { container } = render(<ProgressIndicator isLoading={false} progress="Loading..." />);
    expect(container.querySelector('.progress-indicator')).not.toBeInTheDocument();
  });

  it('displays the progress text', () => {
    render(<ProgressIndicator isLoading={true} progress="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('applies progress-indicator class when loading', () => {
    const { container } = render(<ProgressIndicator isLoading={true} progress="Processing" />);
    expect(container.querySelector('.progress-indicator')).toBeInTheDocument();
  });

  it('applies progress-indicator-content class', () => {
    const { container } = render(<ProgressIndicator isLoading={true} progress="Processing" />);
    expect(container.querySelector('.progress-indicator-content')).toBeInTheDocument();
  });

  it('applies progress-indicator-icon class to loader', () => {
    const { container } = render(<ProgressIndicator isLoading={true} progress="Processing" />);
    expect(container.querySelector('.progress-indicator-icon')).toBeInTheDocument();
  });

  it('applies progress-indicator-text class to text', () => {
    const { container } = render(<ProgressIndicator isLoading={true} progress="Processing" />);
    expect(container.querySelector('.progress-indicator-text')).toBeInTheDocument();
  });

  it('handles empty progress text', () => {
    const { container } = render(<ProgressIndicator isLoading={true} progress="" />);
    expect(container.querySelector('.progress-indicator')).toBeInTheDocument();
  });

  it('handles progress text with percentage', () => {
    render(<ProgressIndicator isLoading={true} progress="Downloading: 75%" />);
    expect(screen.getByText('Downloading: 75%')).toBeInTheDocument();
  });

  it('handles progress text with step info', () => {
    render(<ProgressIndicator isLoading={true} progress="Step 2 of 5: Parsing HTML" />);
    expect(screen.getByText('Step 2 of 5: Parsing HTML')).toBeInTheDocument();
  });
});
