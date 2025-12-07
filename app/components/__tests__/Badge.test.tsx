import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge, { StatusBadge, RoleBadge } from '@/app/components/Badge';

describe('Badge Component', () => {
  describe('Badge', () => {
    it('should render children correctly', () => {
      render(<Badge variant="success">Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeDefined();
    });

    it('should apply success variant styles', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-success');
      expect(badge?.className).toContain('text-success');
    });

    it('should apply error variant styles', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-error');
      expect(badge?.className).toContain('text-error');
    });

    it('should apply warning variant styles', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-warning');
      expect(badge?.className).toContain('text-warning');
    });

    it('should apply info variant styles', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-info');
      expect(badge?.className).toContain('text-info');
    });

    it('should apply small size styles by default', () => {
      const { container } = render(<Badge variant="success">Small</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('text-xs');
      expect(badge?.className).toContain('px-2');
    });

    it('should apply medium size styles when specified', () => {
      const { container } = render(<Badge variant="success" size="md">Medium</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('text-sm');
      expect(badge?.className).toContain('px-3');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Badge variant="success" className="custom-class">Badge</Badge>
      );
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('custom-class');
    });

    it('should apply custom style', () => {
      const { container } = render(
        <Badge variant="success" style={{ margin: '10px' }}>Badge</Badge>
      );
      const badge = container.querySelector('span');
      expect(badge?.style.margin).toBe('10px');
    });
  });

  describe('StatusBadge', () => {
    it('should render open status with green emoji', () => {
      render(<StatusBadge status="open" />);
      expect(screen.getByText('🟢')).toBeDefined();
      expect(screen.getByText('Open')).toBeDefined();
    });

    it('should render closed status with red emoji', () => {
      render(<StatusBadge status="closed" />);
      expect(screen.getByText('🔴')).toBeDefined();
      expect(screen.getByText('Closed')).toBeDefined();
    });

    it('should render locked status with lock emoji', () => {
      render(<StatusBadge status="locked" />);
      expect(screen.getByText('🔒')).toBeDefined();
      expect(screen.getByText('Locked')).toBeDefined();
    });

    it('should hide text when showText is false', () => {
      render(<StatusBadge status="open" showText={false} />);
      expect(screen.getByText('🟢')).toBeDefined();
      expect(screen.queryByText('Open')).toBeNull();
    });
  });

  describe('RoleBadge', () => {
    it('should render admin role', () => {
      render(<RoleBadge role="admin" />);
      expect(screen.getByText('Admin')).toBeDefined();
    });

    it('should render you role', () => {
      render(<RoleBadge role="you" />);
      expect(screen.getByText('You')).toBeDefined();
    });

    it('should render non-member role', () => {
      render(<RoleBadge role="non-member" />);
      expect(screen.getByText('Not a member')).toBeDefined();
    });

    it('should apply custom className', () => {
      const { container } = render(<RoleBadge role="admin" className="test-class" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('test-class');
    });
  });
});
