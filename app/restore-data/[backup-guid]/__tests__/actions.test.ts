import { describe, it, expect, vi, beforeEach } from 'vitest';
import { when } from 'vitest-when';
import { restoreCreatorCode } from '@/app/restore-data/[backup-guid]/actions';

// Mock the Supabase client
const mockRpc = vi.fn();
vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => ({
    rpc: mockRpc
  }))
}));

describe('Restore Data Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('restoreCreatorCode', () => {
    it('should successfully restore creator code', async () => {
      const mockCreatorCode = 'restored-creator-code';

      when(mockRpc)
        .calledWith('restore_creator_code', expect.any(Object))
        .thenResolve({
          data: mockCreatorCode,
          error: null
        });

      const formData = new FormData();
      formData.append('backupGuid', 'backup-guid-123');
      formData.append('password', 'password123');
      formData.append('currentGuid', 'current-guid-456');

      const result = await restoreCreatorCode(formData);

      expect(mockRpc).toHaveBeenCalledWith('restore_creator_code', {
        p_backup_guid: 'backup-guid-123',
        p_password: 'password123',
        p_current_guid: 'current-guid-456'
      });
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockCreatorCode);
    });

    it('should require backup code', async () => {
      const formData = new FormData();
      formData.append('backupGuid', '');
      formData.append('password', 'password123');
      formData.append('currentGuid', 'current-guid');

      const result = await restoreCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup code is required');
    });

    it('should require password', async () => {
      const formData = new FormData();
      formData.append('backupGuid', 'backup-guid');
      formData.append('password', '');
      formData.append('currentGuid', 'current-guid');

      const result = await restoreCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should require current GUID', async () => {
      const formData = new FormData();
      formData.append('backupGuid', 'backup-guid');
      formData.append('password', 'password123');
      formData.append('currentGuid', '');

      const result = await restoreCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current GUID is required');
    });

    it('should handle invalid password error', async () => {
      when(mockRpc)
        .calledWith('restore_creator_code', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Invalid password' }
        });

      const formData = new FormData();
      formData.append('backupGuid', 'backup-guid');
      formData.append('password', 'wrong-password');
      formData.append('currentGuid', 'current-guid');

      const result = await restoreCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password');
    });

    it('should handle backup not found error', async () => {
      when(mockRpc)
        .calledWith('restore_creator_code', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Backup not found' }
        });

      const formData = new FormData();
      formData.append('backupGuid', 'invalid-guid');
      formData.append('password', 'password123');
      formData.append('currentGuid', 'current-guid');

      const result = await restoreCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup not found');
    });

    it('should handle unexpected errors', async () => {
      when(mockRpc)
        .calledWith('restore_creator_code', expect.any(Object))
        .thenReject(new Error('Network error'));

      const formData = new FormData();
      formData.append('backupGuid', 'backup-guid');
      formData.append('password', 'password123');
      formData.append('currentGuid', 'current-guid');

      const result = await restoreCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while restoring data');
    });

    it('should handle generic database error', async () => {
      when(mockRpc)
        .calledWith('restore_creator_code', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: '' }
        });

      const formData = new FormData();
      formData.append('backupGuid', 'backup-guid');
      formData.append('password', 'password123');
      formData.append('currentGuid', 'current-guid');

      const result = await restoreCreatorCode(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to restore data');
    });
  });
});
