import { describe, it, expect, vi, beforeEach } from 'vitest';
import { when } from 'vitest-when';
import {
  getAllSecretSantaAssignments,
  validateAdminAccess
} from '@/app/assignments/[group-guid]/actions';

// Mock the Supabase client
const mockRpc = vi.fn();
vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => ({
    rpc: mockRpc
  }))
}));

describe('Assignments Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllSecretSantaAssignments', () => {
    it('should return array of assignments', async () => {
      const mockAssignments = [
        {
          santa_name: 'Alice',
          santa_code_name: 'A',
          receiver_name: 'Bob',
          receiver_code_name: 'B'
        },
        {
          santa_name: 'Bob',
          santa_code_name: 'B',
          receiver_name: 'Charlie',
          receiver_code_name: 'C'
        }
      ];

      when(mockRpc)
        .calledWith('get_all_secret_santa_relationships', expect.any(Object))
        .thenResolve({
          data: mockAssignments,
          error: null
        });

      const result = await getAllSecretSantaAssignments('test-guid', 'creator-code');

      expect(mockRpc).toHaveBeenCalledWith('get_all_secret_santa_relationships', {
        p_group_guid: 'test-guid',
        p_creator_code: 'creator-code'
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        santaName: 'Alice',
        santaCodeName: 'A',
        receiverName: 'Bob',
        receiverCodeName: 'B'
      });
    });

    it('should return empty array when no assignments', async () => {
      when(mockRpc)
        .calledWith('get_all_secret_santa_relationships', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const result = await getAllSecretSantaAssignments('test-guid', 'creator-code');

      expect(result).toEqual([]);
    });

    it('should return empty array when error occurs', async () => {
      when(mockRpc)
        .calledWith('get_all_secret_santa_relationships', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Not authorized' }
        });

      const result = await getAllSecretSantaAssignments('test-guid', 'wrong-code');

      expect(result).toEqual([]);
    });

    it('should return empty array when exception is thrown', async () => {
      when(mockRpc)
        .calledWith('get_all_secret_santa_relationships', expect.any(Object))
        .thenReject(new Error('Network error'));

      const result = await getAllSecretSantaAssignments('test-guid', 'creator-code');

      expect(result).toEqual([]);
    });

    it('should transform data correctly with null code names', async () => {
      const mockAssignments = [
        {
          santa_name: 'Alice',
          santa_code_name: null,
          receiver_name: 'Bob',
          receiver_code_name: null
        }
      ];

      when(mockRpc)
        .calledWith('get_all_secret_santa_relationships', expect.any(Object))
        .thenResolve({
          data: mockAssignments,
          error: null
        });

      const result = await getAllSecretSantaAssignments('test-guid', 'creator-code');

      expect(result[0].santaCodeName).toBeNull();
      expect(result[0].receiverCodeName).toBeNull();
    });
  });

  describe('validateAdminAccess', () => {
    it('should return true for valid creator', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({
          data: true,
          error: null
        });

      const result = await validateAdminAccess('test-guid', 'creator-code');

      expect(mockRpc).toHaveBeenCalledWith('is_creator', {
        p_group_guid: 'test-guid',
        p_creator_code: 'creator-code'
      });
      expect(result).toBe(true);
    });

    it('should return false for invalid creator', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({
          data: false,
          error: null
        });

      const result = await validateAdminAccess('test-guid', 'wrong-code');

      expect(result).toBe(false);
    });

    it('should return false when error occurs', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Database error' }
        });

      const result = await validateAdminAccess('test-guid', 'creator-code');

      expect(result).toBe(false);
    });

    it('should return false when exception is thrown', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenReject(new Error('Network error'));

      const result = await validateAdminAccess('test-guid', 'creator-code');

      expect(result).toBe(false);
    });

    it('should handle null response data', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const result = await validateAdminAccess('test-guid', 'creator-code');

      expect(result).toBe(false);
    });
  });
});
