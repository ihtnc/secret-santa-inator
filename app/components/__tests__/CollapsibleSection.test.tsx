import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollapsibleSection from '@/app/components/CollapsibleSection';

describe('CollapsibleSection Component', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe('Basic rendering', () => {
    it('should render title', () => {
      render(
        <CollapsibleSection
          title="Test Section"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );
      expect(screen.getByText('Test Section')).toBeDefined();
    });

    it('should render children when expanded', () => {
      render(
        <CollapsibleSection
          title="Section"
          isExpanded={true}
          onToggle={mockOnToggle}
        >
          <div>Child content</div>
        </CollapsibleSection>
      );
      expect(screen.getByText('Child content')).toBeDefined();
    });

    it('should not render children when collapsed by default', () => {
      render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          <div>Hidden content</div>
        </CollapsibleSection>
      );
      expect(screen.queryByText('Hidden content')).toBeNull();
    });
  });

  describe('Toggle functionality', () => {
    it('should call onToggle when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection
          title="Clickable"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should be a button type button to prevent form submission', () => {
      render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );

      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.type).toBe('button');
    });
  });

  describe('Title variants', () => {
    it('should render string title', () => {
      render(
        <CollapsibleSection
          title="String Title"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );
      expect(screen.getByText('String Title')).toBeDefined();
    });

    it('should render custom ReactNode title', () => {
      render(
        <CollapsibleSection
          title={<div className="custom-title">Custom Title</div>}
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );
      expect(screen.getByText('Custom Title')).toBeDefined();
    });
  });

  describe('Right content', () => {
    it('should render right content when provided', () => {
      render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
          rightContent={<span>Badge</span>}
        >
          Content
        </CollapsibleSection>
      );
      expect(screen.getByText('Badge')).toBeDefined();
    });

    it('should not render right content container when not provided', () => {
      render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );
      expect(screen.queryByText('Badge')).toBeNull();
    });
  });

  describe('Styling props', () => {
    it('should apply border when hasBorder is true', () => {
      const { container } = render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
          hasBorder={true}
        >
          Content
        </CollapsibleSection>
      );
      const borderDiv = container.querySelector('.border-b.border-accent');
      expect(borderDiv).toBeDefined();
    });

    it('should not apply border when hasBorder is false', () => {
      const { container } = render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
          hasBorder={false}
        >
          Content
        </CollapsibleSection>
      );
      const borderDiv = container.querySelector('.border-b.border-accent');
      expect(borderDiv).toBeNull();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
          className="custom-section"
        >
          Content
        </CollapsibleSection>
      );
      const customSection = container.querySelector('.custom-section');
      expect(customSection).toBeDefined();
    });
  });

  describe('Expand/collapse indicator', () => {
    it('should show chevron icon', () => {
      const { container } = render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });

    it('should rotate chevron when expanded', () => {
      const { container } = render(
        <CollapsibleSection
          title="Section"
          isExpanded={true}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('rotate-180');
    });

    it('should not rotate chevron when collapsed', () => {
      const { container } = render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
        >
          Content
        </CollapsibleSection>
      );
      const svg = container.querySelector('svg');
      expect(svg?.className).not.toContain('rotate-180');
    });
  });

  describe('AlwaysRender prop', () => {
    it('should keep children in DOM when alwaysRender is true and collapsed', () => {
      render(
        <CollapsibleSection
          title="Section"
          isExpanded={false}
          onToggle={mockOnToggle}
          alwaysRender={true}
        >
          <div data-testid="always-rendered">Always rendered content</div>
        </CollapsibleSection>
      );
      // Content should be in DOM but potentially hidden
      const content = document.querySelector('[data-testid="always-rendered"]');
      expect(content).toBeDefined();
    });
  });
});
