import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/app/components/PageHeader';

describe('PageHeader Component', () => {
  describe('Title', () => {
    it('should render title text', () => {
      render(<PageHeader title="Test Page" />);
      expect(screen.getByText('Test Page')).toBeDefined();
    });

    it('should render title with heading tag', () => {
      render(<PageHeader title="My Heading" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeDefined();
      expect(heading.textContent).toContain('My Heading');
    });
  });

  describe('Emoji', () => {
    it('should render emoji when provided', () => {
      render(<PageHeader title="Test" emoji="🎅" />);
      expect(screen.getByText('🎅')).toBeDefined();
    });

    it('should not render emoji when not provided', () => {
      const { container } = render(<PageHeader title="Test" />);
      const heading = container.querySelector('h1');
      expect(heading?.textContent).toBe('Test');
      expect(heading?.querySelector('.text-4xl')).toBeNull();
    });

    it('should render different emojis', () => {
      const { rerender } = render(<PageHeader title="Test" emoji="🎄" />);
      expect(screen.getByText('🎄')).toBeDefined();

      rerender(<PageHeader title="Test" emoji="⛄" />);
      expect(screen.getByText('⛄')).toBeDefined();
    });
  });

  describe('Subtitle', () => {
    it('should render subtitle text when provided', () => {
      render(
        <PageHeader
          title="Main Title"
          subtitle="This is a subtitle"
        />
      );
      expect(screen.getByText('This is a subtitle')).toBeDefined();
    });

    it('should not render subtitle when not provided', () => {
      const { container } = render(<PageHeader title="Main Title" />);
      const subtitle = container.querySelector('.text-sm.text-secondary');
      expect(subtitle).toBeNull();
    });

    it('should render complex subtitle content', () => {
      render(
        <PageHeader
          title="Title"
          subtitle={
            <span>
              Subtitle with <strong>bold text</strong>
            </span>
          }
        />
      );
      expect(screen.getByText(/Subtitle with/)).toBeDefined();
      expect(screen.getByText('bold text')).toBeDefined();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <PageHeader title="Test" className="custom-header" />
      );
      const header = container.querySelector('.custom-header');
      expect(header).toBeDefined();
    });
  });

  describe('Full component', () => {
    it('should render all parts together', () => {
      render(
        <PageHeader
          title="Secret Santa"
          emoji="🎅"
          subtitle="Organize your gift exchange"
          className="my-header"
        />
      );

      expect(screen.getByText('Secret Santa')).toBeDefined();
      expect(screen.getByText('🎅')).toBeDefined();
      expect(screen.getByText('Organize your gift exchange')).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('should have correct text styling classes', () => {
      render(<PageHeader title="Styled Title" subtitle="Styled Subtitle" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.className).toContain('text-3xl');
      expect(heading.className).toContain('font-bold');
      expect(heading.className).toContain('text-primary');
    });
  });
});
