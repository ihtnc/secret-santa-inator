import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from '@/app/components/Loading';

describe('Loading Component', () => {
  it('should render loading spinner', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.animate-spin')).toBeDefined();
  });

  it('should display "Loading..." text', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should have proper accessibility attributes', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeDefined();
  });
});
