import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from '@/app/components/PasswordInput';

describe('PasswordInput Component', () => {
  const getPasswordInput = (container: HTMLElement) => {
    return container.querySelector('input[type="password"], input[type="text"]') as HTMLInputElement;
  };

  describe('Basic rendering', () => {
    it('should render password input field', () => {
      const { container } = render(<PasswordInput />);
      const input = getPasswordInput(container);
      expect(input).toBeDefined();
    });

    it('should start with password hidden', () => {
      const { container } = render(<PasswordInput />);
      const input = getPasswordInput(container);
      expect(input.type).toBe('password');
    });

    it('should render toggle button', () => {
      render(<PasswordInput />);
      const button = screen.getByRole('button', { name: /show password/i });
      expect(button).toBeDefined();
    });
  });

  describe('Password visibility toggle', () => {
    it('should show password when toggle button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<PasswordInput />);

      let input = getPasswordInput(container);
      const button = screen.getByRole('button', { name: /show password/i });

      expect(input.type).toBe('password');

      await user.click(button);

      input = getPasswordInput(container);
      expect(input.type).toBe('text');
    });

    it('should hide password when toggle button is clicked again', async () => {
      const user = userEvent.setup();
      const { container } = render(<PasswordInput />);

      const button = screen.getByRole('button', { name: /show password/i });

      await user.click(button);
      const buttonHide = screen.getByRole('button', { name: /hide password/i });
      await user.click(buttonHide);

      const input = getPasswordInput(container);
      expect(input.type).toBe('password');
    });

    it('should update aria-label when toggling', async () => {
      const user = userEvent.setup();
      render(<PasswordInput />);

      let button = screen.getByRole('button', { name: /show password/i });
      expect(button.getAttribute('aria-label')).toBe('Show password');

      await user.click(button);

      button = screen.getByRole('button', { name: /hide password/i });
      expect(button.getAttribute('aria-label')).toBe('Hide password');
    });
  });

  describe('Props', () => {
    it('should accept and use id prop', () => {
      const { container } = render(<PasswordInput id="test-password" />);
      const input = getPasswordInput(container);
      expect(input.id).toBe('test-password');
    });

    it('should accept and use name prop', () => {
      const { container } = render(<PasswordInput name="user-password" />);
      const input = getPasswordInput(container);
      expect(input.name).toBe('user-password');
    });

    it('should accept and use placeholder prop', () => {
      render(<PasswordInput placeholder="Enter password" />);
      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toBeDefined();
    });

    it('should set required attribute when required is true', () => {
      const { container } = render(<PasswordInput required={true} />);
      const input = getPasswordInput(container);
      expect(input.required).toBe(true);
    });

    it('should set minLength attribute', () => {
      const { container } = render(<PasswordInput minLength={8} />);
      const input = getPasswordInput(container);
      expect(input.minLength).toBe(8);
    });

    it('should apply custom className', () => {
      const { container } = render(<PasswordInput className="custom-input" />);
      const input = getPasswordInput(container);
      expect(input.className).toContain('custom-input');
    });

    it('should use controlled value', () => {
      const { container } = render(<PasswordInput value="test123" onChange={() => {}} />);
      const input = getPasswordInput(container);
      expect(input.value).toBe('test123');
    });

    it('should use defaultValue', () => {
      const { container } = render(<PasswordInput defaultValue="default123" />);
      const input = getPasswordInput(container);
      expect(input.defaultValue).toBe('default123');
    });
  });

  describe('Events', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const { container } = render(<PasswordInput onChange={handleChange} />);

      const input = getPasswordInput(container);
      await user.type(input, 'newpass');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should not change type on input change', async () => {
      const user = userEvent.setup();
      const { container } = render(<PasswordInput />);

      const input = getPasswordInput(container);
      await user.type(input, 'test');

      expect(input.type).toBe('password');
    });
  });

  describe('Accessibility', () => {
    it('should have autocomplete off', () => {
      const { container } = render(<PasswordInput />);
      const input = getPasswordInput(container);
      expect(input.autocomplete).toBe('off');
    });

    it('should have button with proper aria-label', () => {
      render(<PasswordInput />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Icon rendering', () => {
    it('should show eye icon when password is hidden', () => {
      const { container } = render(<PasswordInput />);
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });

    it('should show eye-off icon when password is visible', async () => {
      const user = userEvent.setup();
      const { container } = render(<PasswordInput />);

      const button = screen.getByRole('button', { name: /show password/i });
      await user.click(button);

      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });
});
