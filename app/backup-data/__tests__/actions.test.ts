import { describe, it, expect, vi, beforeEach } from 'vitest';
import { when } from 'vitest-when';
import { backupCreatorCode } from '@/app/backup-data/actions';

// Mock the Supabase client
const mockRpc = vi.fn();
vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => ({
    rpc: mockRpc
  }))
}));

describe('Backup Data Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('backupCreatorCode', () => {
    it('should successfully backup creator code', async () => {
      const mockBackupGuid = 'backup-guid-123';

      when(mockRpc)
        .calledWith('backup_creator_code', expect.any(Object))
        .thenResolve({
          data: mockBackupGuid,
          error: null
        });

      const formData = new FormData();
      formData.append('creatorCode', 'creator-123');
      formData.append('password', 'password123');
      formData.append('confirmPassword', 'password123');

      const result = await backupCreatorCode(formData);

      expect(mockRpc).toHaveBeenCalledWith('backup_creator_code', {
        p_creator_code: 'creator-123',
        p_password: 'password123'
      });
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockBackupGuid);
    });

    it('should require creator code', async () => {
      const formData = new FormData();
      formData.append('creatorCode', '');
      formData.append('password', 'password123');
      formData.append('confirmPassword', 'password123');

      const result = await backupCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Creator code is required');
    });

    it('should require password', async () => {
      const formData = new FormData();
      formData.append('creatorCode', 'creator-123');
      formData.append('password', '');
      formData.append('confirmPassword', 'password123');

      const result = await backupCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should require password confirmation', async () => {
      const formData = new FormData();
      formData.append('creatorCode', 'creator-123');
      formData.append('password', 'password123');
      formData.append('confirmPassword', '');

      const result = await backupCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password confirmation is required');
    });

    it('should validate passwords match', async () => {
      const formData = new FormData();
      formData.append('creatorCode', 'creator-123');
      formData.append('password', 'password123');
      formData.append('confirmPassword', 'different-password');

      const result = await backupCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Passwords do not match');
    });

    it('should handle database errors', async () => {
      when(mockRpc)
        .calledWith('backup_creator_code', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Invalid creator code' }
        });

      const formData = new FormData();
      formData.append('creatorCode', 'invalid-code');
      formData.append('password', 'password123');
      formData.append('confirmPassword', 'password123');

      const result = await backupCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid creator code');
    });

    it('should handle unexpected errors', async () => {
      when(mockRpc)
        .calledWith('backup_creator_code', expect.any(Object))
        .thenReject(new Error('Network error'));

      const formData = new FormData();
      formData.append('creatorCode', 'creator-123');
      formData.append('password', 'password123');
      formData.append('confirmPassword', 'password123');

      const result = await backupCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while backing up creator code');
    });

    it('should handle whitespace in passwords correctly', async () => {
      when(mockRpc)
        .calledWith('backup_creator_code', expect.any(Object))
        .thenResolve({
          data: 'backup-guid',
          error: null
        });

      const formData = new FormData();
      formData.append('creatorCode', '  creator-123  ');
      formData.append('password', '  password123  ');
      formData.append('confirmPassword', '  password123  ');

      const result = await backupCreatorCode(formData);

      // Passwords match (both have same whitespace), so should succeed
      expect(result.success).toBe(true);
    });
  });
});
