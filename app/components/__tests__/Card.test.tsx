import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/app/components/Card';

describe('Card Component', () => {
  it('should render children content', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeDefined();
  });

  it('should render with title', () => {
    render(<Card title="Test Title">Content</Card>);
    expect(screen.getByText('Test Title')).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Card className="custom-card">Content</Card>
    );
    const card = container.querySelector('.custom-card');
    expect(card).toBeDefined();
  });

  it('should render multiple children', () => {
    render(
      <Card>
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </Card>
    );
    expect(screen.getByText('First paragraph')).toBeDefined();
    expect(screen.getByText('Second paragraph')).toBeDefined();
  });
});
