import { describe, it, expect, beforeEach } from 'vitest';
import { getCreatorCode, setCreatorCode, removeCreatorCode, getHasDemoGroups, setHasDemoGroups, removeHasDemoGroups } from '@/utilities/localStorage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCreatorCode', () => {
    it('should return empty string when no code is stored', () => {
      expect(getCreatorCode()).toBe('');
    });

    it('should return the stored creator code', () => {
      localStorage.setItem('creatorCode', 'TEST123');
      expect(getCreatorCode()).toBe('TEST123');
    });

    it('should return empty string on server (window undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing server-side behavior
      delete global.window;

      expect(getCreatorCode()).toBe('');

      global.window = originalWindow;
    });
  });

  describe('setCreatorCode', () => {
    it('should store the creator code in localStorage', () => {
      setCreatorCode('NEWCODE456');
      expect(localStorage.getItem('creatorCode')).toBe('NEWCODE456');
    });

    it('should overwrite existing creator code', () => {
      localStorage.setItem('creatorCode', 'OLD');
      setCreatorCode('NEW');
      expect(localStorage.getItem('creatorCode')).toBe('NEW');
    });

    it('should handle empty string', () => {
      setCreatorCode('');
      expect(localStorage.getItem('creatorCode')).toBe('');
    });

    it('should handle special characters', () => {
      const specialCode = 'CODE-WITH-DASH_123!@#';
      setCreatorCode(specialCode);
      expect(localStorage.getItem('creatorCode')).toBe(specialCode);
    });
  });

  describe('removeCreatorCode', () => {
    it('should remove the creator code from localStorage', () => {
      localStorage.setItem('creatorCode', 'REMOVE_ME');
      removeCreatorCode();
      expect(localStorage.getItem('creatorCode')).toBeNull();
    });

    it('should not throw error if code does not exist', () => {
      expect(() => removeCreatorCode()).not.toThrow();
    });

    it('should not affect other localStorage items', () => {
      localStorage.setItem('creatorCode', 'CODE');
      localStorage.setItem('otherItem', 'VALUE');

      removeCreatorCode();

      expect(localStorage.getItem('creatorCode')).toBeNull();
      expect(localStorage.getItem('otherItem')).toBe('VALUE');
    });
  });

  describe('Integration workflow', () => {
    it('should support complete workflow: set, get, remove', () => {
      expect(getCreatorCode()).toBe('');

      setCreatorCode('WORKFLOW_TEST');
      expect(getCreatorCode()).toBe('WORKFLOW_TEST');

      removeCreatorCode();
      expect(getCreatorCode()).toBe('');
    });

    it('should handle multiple set operations', () => {
      setCreatorCode('CODE1');
      expect(getCreatorCode()).toBe('CODE1');

      setCreatorCode('CODE2');
      expect(getCreatorCode()).toBe('CODE2');

      setCreatorCode('CODE3');
      expect(getCreatorCode()).toBe('CODE3');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long codes', () => {
      const longCode = 'A'.repeat(1000);
      setCreatorCode(longCode);
      expect(getCreatorCode()).toBe(longCode);
    });

    it('should handle codes with whitespace', () => {
      const codeWithSpaces = '  CODE  WITH  SPACES  ';
      setCreatorCode(codeWithSpaces);
      expect(getCreatorCode()).toBe(codeWithSpaces);
    });

    it('should handle unicode characters', () => {
      const unicodeCode = 'CODE-🎅-SANTA-🎄';
      setCreatorCode(unicodeCode);
      expect(getCreatorCode()).toBe(unicodeCode);
    });
  });

  describe('getHasDemoGroups', () => {
    it('should return false when flag is not set', () => {
      expect(getHasDemoGroups()).toBe(false);
    });

    it('should return true when flag is set to true', () => {
      localStorage.setItem('hasDemoGroups', 'true');
      expect(getHasDemoGroups()).toBe(true);
    });

    it('should return false when flag is set to any other value', () => {
      localStorage.setItem('hasDemoGroups', 'false');
      expect(getHasDemoGroups()).toBe(false);

      localStorage.setItem('hasDemoGroups', 'yes');
      expect(getHasDemoGroups()).toBe(false);
    });

    it('should return false on server (window undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing server-side behavior
      delete global.window;

      expect(getHasDemoGroups()).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('setHasDemoGroups', () => {
    it('should set hasDemoGroups flag to true', () => {
      setHasDemoGroups();
      expect(localStorage.getItem('hasDemoGroups')).toBe('true');
    });

    it('should overwrite existing flag', () => {
      localStorage.setItem('hasDemoGroups', 'false');
      setHasDemoGroups();
      expect(localStorage.getItem('hasDemoGroups')).toBe('true');
    });
  });

  describe('removeHasDemoGroups', () => {
    it('should remove the hasDemoGroups flag from localStorage', () => {
      localStorage.setItem('hasDemoGroups', 'true');
      removeHasDemoGroups();
      expect(localStorage.getItem('hasDemoGroups')).toBeNull();
    });

    it('should not throw error if flag does not exist', () => {
      expect(() => removeHasDemoGroups()).not.toThrow();
    });

    it('should not affect other localStorage items', () => {
      localStorage.setItem('hasDemoGroups', 'true');
      localStorage.setItem('otherItem', 'VALUE');

      removeHasDemoGroups();

      expect(localStorage.getItem('hasDemoGroups')).toBeNull();
      expect(localStorage.getItem('otherItem')).toBe('VALUE');
    });
  });

  describe('Demo groups workflow', () => {
    it('should support complete workflow: set, get, remove', () => {
      expect(getHasDemoGroups()).toBe(false);

      setHasDemoGroups();
      expect(getHasDemoGroups()).toBe(true);

      removeHasDemoGroups();
      expect(getHasDemoGroups()).toBe(false);
    });

    it('should work together with creator code', () => {
      setCreatorCode('TEST_CODE');
      setHasDemoGroups();

      expect(getCreatorCode()).toBe('TEST_CODE');
      expect(getHasDemoGroups()).toBe(true);

      removeCreatorCode();
      removeHasDemoGroups();

      expect(getCreatorCode()).toBe('');
      expect(getHasDemoGroups()).toBe(false);
    });
  });
});
