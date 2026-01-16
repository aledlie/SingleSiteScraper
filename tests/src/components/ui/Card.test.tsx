import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../../../../src/components/ui/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default card class', () => {
    render(
      <Card>
        <span>Test</span>
      </Card>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('card');
  });

  it('applies additional className when provided', () => {
    render(
      <Card className="custom-class">
        <span>Test</span>
      </Card>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('card');
    expect(card).toHaveClass('custom-class');
  });

  it('renders multiple children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
        <button>Action</button>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('handles empty className', () => {
    render(
      <Card className="">
        <span>Test</span>
      </Card>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('card');
  });
});
