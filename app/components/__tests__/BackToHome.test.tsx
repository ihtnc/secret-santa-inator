import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BackToHome, BackToMyGroups, BackToManageGroup } from '@/app/components/BackToHome';

describe('Navigation Components', () => {
  describe('BackToHome', () => {
    it('should render link to home page', () => {
      render(<BackToHome />);
      const link = screen.getByRole('link', { name: /back to home/i });
      expect(link).toBeDefined();
      expect(link.getAttribute('href')).toBe('/');
    });

    it('should apply custom className', () => {
      const { container } = render(<BackToHome className="custom-nav" />);
      const wrapper = container.querySelector('.custom-nav');
      expect(wrapper).toBeDefined();
    });

    it('should have correct link styling', () => {
      render(<BackToHome />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('link-primary');
    });
  });

  describe('BackToMyGroups', () => {
    it('should render link to my groups page', () => {
      render(<BackToMyGroups />);
      const link = screen.getByRole('link', { name: /back to my groups/i });
      expect(link).toBeDefined();
      expect(link.getAttribute('href')).toBe('/my-groups');
    });

    it('should apply custom className', () => {
      const { container } = render(<BackToMyGroups className="custom-groups-nav" />);
      const wrapper = container.querySelector('.custom-groups-nav');
      expect(wrapper).toBeDefined();
    });
  });

  describe('BackToManageGroup', () => {
    it('should render link to manage group page with correct GUID', () => {
      const testGuid = 'test-group-guid-123';
      render(<BackToManageGroup groupGuid={testGuid} />);
      const link = screen.getByRole('link', { name: /back to manage group/i });
      expect(link).toBeDefined();
      expect(link.getAttribute('href')).toBe(`/admin/${testGuid}`);
    });

    it('should apply custom className', () => {
      const { container } = render(
        <BackToManageGroup groupGuid="test-guid" className="custom-manage-nav" />
      );
      const wrapper = container.querySelector('.custom-manage-nav');
      expect(wrapper).toBeDefined();
    });

    it('should handle different group GUIDs', () => {
      const guid1 = 'guid-abc-123';
      const guid2 = 'guid-xyz-789';

      const { rerender } = render(<BackToManageGroup groupGuid={guid1} />);
      let link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe(`/admin/${guid1}`);

      rerender(<BackToManageGroup groupGuid={guid2} />);
      link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe(`/admin/${guid2}`);
    });
  });
});
