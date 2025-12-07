import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertMessage } from '@/app/components/AlertMessage';

describe('AlertMessage Component', () => {
  describe('Variants', () => {
    it('should render error variant with correct styling', () => {
      const { container } = render(
        <AlertMessage variant="error">Error message</AlertMessage>
      );
      const alert = container.querySelector('.bg-error');
      expect(alert).toBeDefined();
      expect(alert?.className).toContain('border-error');
      expect(screen.getByText('Error message')).toBeDefined();
    });

    it('should render warning variant with correct styling', () => {
      const { container } = render(
        <AlertMessage variant="warning">Warning message</AlertMessage>
      );
      const alert = container.querySelector('.bg-warning');
      expect(alert).toBeDefined();
      expect(alert?.className).toContain('border-warning');
      expect(screen.getByText('Warning message')).toBeDefined();
    });

    it('should render info variant with correct styling', () => {
      const { container } = render(
        <AlertMessage variant="info">Info message</AlertMessage>
      );
      const alert = container.querySelector('.bg-info');
      expect(alert).toBeDefined();
      expect(alert?.className).toContain('border-info');
      expect(screen.getByText('Info message')).toBeDefined();
    });

    it('should render success variant with correct styling', () => {
      const { container } = render(
        <AlertMessage variant="success">Success message</AlertMessage>
      );
      const alert = container.querySelector('.bg-success');
      expect(alert).toBeDefined();
      expect(alert?.className).toContain('border-success');
      expect(screen.getByText('Success message')).toBeDefined();
    });
  });

  describe('Title', () => {
    it('should render with title when provided', () => {
      render(
        <AlertMessage variant="info" title="Important">
          This is important information
        </AlertMessage>
      );
      expect(screen.getByText('Important')).toBeDefined();
      expect(screen.getByText('This is important information')).toBeDefined();
    });

    it('should render without title when not provided', () => {
      const { container } = render(
        <AlertMessage variant="info">
          Just a message
        </AlertMessage>
      );
      expect(screen.getByText('Just a message')).toBeDefined();
      expect(container.querySelector('h2')).toBeNull();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <AlertMessage variant="error" className="custom-alert">
          Custom styled alert
        </AlertMessage>
      );
      const alert = container.querySelector('.custom-alert');
      expect(alert).toBeDefined();
    });
  });

  describe('Children', () => {
    it('should render text children', () => {
      render(
        <AlertMessage variant="info">Simple text message</AlertMessage>
      );
      expect(screen.getByText('Simple text message')).toBeDefined();
    });

    it('should render complex children', () => {
      render(
        <AlertMessage variant="warning">
          <span>
            Multiple <strong>parts</strong> of content
          </span>
        </AlertMessage>
      );
      expect(screen.getByText(/Multiple/)).toBeDefined();
      expect(screen.getByText('parts')).toBeDefined();
    });
  });
});
