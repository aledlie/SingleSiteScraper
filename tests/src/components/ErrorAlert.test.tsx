import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorAlert } from '../../../src/components/ErrorAlert';

describe('ErrorAlert', () => {
  it('renders the error message', () => {
    render(<ErrorAlert error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays "Scraping Failed" title', () => {
    render(<ErrorAlert error="Network error" />);
    expect(screen.getByText('Scraping Failed')).toBeInTheDocument();
  });

  it('applies error-alert class', () => {
    const { container } = render(<ErrorAlert error="Test error" />);
    expect(container.querySelector('.error-alert')).toBeInTheDocument();
  });

  it('renders error icon', () => {
    const { container } = render(<ErrorAlert error="Test error" />);
    expect(container.querySelector('.error-icon')).toBeInTheDocument();
  });

  it('applies error-title class to title', () => {
    const { container } = render(<ErrorAlert error="Test error" />);
    expect(container.querySelector('.error-title')).toBeInTheDocument();
  });

  it('applies error-message class to message', () => {
    const { container } = render(<ErrorAlert error="Test error" />);
    expect(container.querySelector('.error-message')).toBeInTheDocument();
  });

  it('handles long error messages', () => {
    const longError = 'This is a very long error message that contains a lot of details about what went wrong during the scraping process. It might include stack traces, URLs, and other debugging information.';
    render(<ErrorAlert error={longError} />);
    expect(screen.getByText(longError)).toBeInTheDocument();
  });

  it('handles special characters in error message', () => {
    const specialError = '<script>alert("xss")</script>';
    render(<ErrorAlert error={specialError} />);
    // React escapes HTML, so it should be rendered as text
    expect(screen.getByText(specialError)).toBeInTheDocument();
  });

  it('handles empty error message', () => {
    const { container } = render(<ErrorAlert error="" />);
    // Should still render the structure
    expect(container.querySelector('.error-alert')).toBeInTheDocument();
    expect(screen.getByText('Scraping Failed')).toBeInTheDocument();
  });
});
