import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormInput from '../../../../src/components/ui/FormInput';

describe('FormInput', () => {
  const defaultProps = {
    label: 'Test Label',
    value: '',
    onChange: vi.fn(),
  };

  it('renders with label', () => {
    render(<FormInput {...defaultProps} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders input with value', () => {
    render(<FormInput {...defaultProps} value="test value" />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('renders placeholder', () => {
    render(<FormInput {...defaultProps} placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const onChange = vi.fn();
    render(<FormInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('calls onEnter when Enter key is pressed', () => {
    const onEnter = vi.fn();
    render(<FormInput {...defaultProps} onEnter={onEnter} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onEnter).toHaveBeenCalled();
  });

  it('does not call onEnter for other keys', () => {
    const onEnter = vi.fn();
    render(<FormInput {...defaultProps} onEnter={onEnter} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Tab' });
    fireEvent.keyDown(input, { key: 'a' });

    expect(onEnter).not.toHaveBeenCalled();
  });

  it('handles missing onEnter callback', () => {
    render(<FormInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    // Should not throw
    expect(() => fireEvent.keyDown(input, { key: 'Enter' })).not.toThrow();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<FormInput {...defaultProps} icon={<TestIcon />} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders as text input by default', () => {
    render(<FormInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders as number input when specified', () => {
    render(<FormInput {...defaultProps} type="number" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('applies min and max attributes for number input', () => {
    render(<FormInput {...defaultProps} type="number" min={0} max={100} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('applies correct CSS classes', () => {
    render(<FormInput {...defaultProps} />);
    expect(screen.getByText('Test Label')).toHaveClass('form-label');
    expect(screen.getByRole('textbox')).toHaveClass('input-label');
  });
});
