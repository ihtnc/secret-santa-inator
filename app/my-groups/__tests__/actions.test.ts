import { describe, it, expect, vi, beforeEach } from 'vitest';
import { when } from 'vitest-when';
import { getMyGroups } from '@/app/my-groups/actions';

// Mock the Supabase client
const mockRpc = vi.fn();
vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => ({
    rpc: mockRpc
  }))
}));

describe('My Groups Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyGroups', () => {
    it('should return array of groups for member', async () => {
      const mockGroups = [
        {
          group_guid: 'guid-1',
          name: 'Group 1',
          member_count: 5
        },
        {
          group_guid: 'guid-2',
          name: 'Group 2',
          member_count: 3
        }
      ];

      when(mockRpc)
        .calledWith('get_my_groups', expect.any(Object))
        .thenResolve({
          data: mockGroups,
          error: null
        });

      const result = await getMyGroups('member-code');

      expect(mockRpc).toHaveBeenCalledWith('get_my_groups', {
        p_member_code: 'member-code'
      });
      expect(result).toEqual(mockGroups);
    });

    it('should return empty array when no groups found', async () => {
      when(mockRpc)
        .calledWith('get_my_groups', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const result = await getMyGroups('member-code');

      expect(result).toEqual([]);
    });

    it('should return empty array when error occurs', async () => {
      when(mockRpc)
        .calledWith('get_my_groups', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Database error' }
        });

      const result = await getMyGroups('member-code');

      expect(result).toEqual([]);
    });

    it('should return empty array when exception is thrown', async () => {
      when(mockRpc)
        .calledWith('get_my_groups', expect.any(Object))
        .thenReject(new Error('Network error'));

      const result = await getMyGroups('member-code');

      expect(result).toEqual([]);
    });

    it('should handle different member codes', async () => {
      const mockGroups = [{ group_guid: 'test', name: 'Test' }];

      when(mockRpc)
        .calledWith('get_my_groups', expect.any(Object))
        .thenResolve({
          data: mockGroups,
          error: null
        });

      await getMyGroups('different-code');

      expect(mockRpc).toHaveBeenCalledWith('get_my_groups', {
        p_member_code: 'different-code'
      });
    });
  });
});
