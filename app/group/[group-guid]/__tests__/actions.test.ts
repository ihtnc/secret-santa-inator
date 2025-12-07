import { describe, it, expect, vi, beforeEach } from 'vitest';
import { when } from 'vitest-when';
import {
  getMemberDetailsOrRedirect,
  getMySecretSanta,
  getGroupMembers,
  getGroupInfo
} from '@/app/group/[group-guid]/actions';

// Mock the Supabase client
const mockRpc = vi.fn();
vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => ({
    rpc: mockRpc
  }))
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
}));

describe('Group Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMemberDetailsOrRedirect', () => {
    it('should return member data when member exists', async () => {
      const mockMemberData = [
        {
          id: 1,
          name: 'Test User',
          code_name: 'TestCode'
        }
      ];

      when(mockRpc)
        .calledWith('get_member', expect.any(Object))
        .thenResolve({
          data: mockMemberData,
          error: null
        });

      const result = await getMemberDetailsOrRedirect('test-guid', 'member-code');

      expect(mockRpc).toHaveBeenCalledWith('get_member', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code'
      });
      expect(result).toEqual(mockMemberData[0]);
    });

    it('should return null when database error occurs', async () => {
      when(mockRpc)
        .calledWith('get_member', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Database error' }
        });

      const result = await getMemberDetailsOrRedirect('test-guid', 'member-code');

      expect(result).toBeNull();
    });

    it('should redirect when member is not found', async () => {
      when(mockRpc)
        .calledWith('get_member', expect.any(Object))
        .thenResolve({
          data: [],
          error: null
        });

      await expect(async () => {
        await getMemberDetailsOrRedirect('test-guid', 'member-code');
      }).rejects.toThrow('REDIRECT:/join/test-guid');
    });

    it('should return null when exception is thrown', async () => {
      mockRpc.mockRejectedValue(new Error('Network error'));

      const result = await getMemberDetailsOrRedirect('test-guid', 'member-code');

      expect(result).toBeNull();
    });
  });

  describe('getMySecretSanta', () => {
    it('should return secret santa assignment', async () => {
      const mockAssignment = {
        receiver_name: 'Jane Doe',
        receiver_code_name: 'JD'
      };

      when(mockRpc)
        .calledWith('get_my_secret_santa', expect.any(Object))
        .thenResolve({
          data: mockAssignment,
          error: null
        });

      const result = await getMySecretSanta('test-guid', 'member-code');

      expect(mockRpc).toHaveBeenCalledWith('get_my_secret_santa', {
        p_group_guid: 'test-guid',
        p_code: 'member-code'
      });
      expect(result).toEqual(mockAssignment);
    });

    it('should return null when error occurs', async () => {
      when(mockRpc)
        .calledWith('get_my_secret_santa', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Not found' }
        });

      const result = await getMySecretSanta('test-guid', 'member-code');

      expect(result).toBeNull();
    });

    it('should return null when exception is thrown', async () => {
      when(mockRpc)
        .calledWith('get_my_secret_santa', expect.any(Object))
        .thenReject(new Error('Network error'));

      const result = await getMySecretSanta('test-guid', 'member-code');

      expect(result).toBeNull();
    });
  });

  describe('getGroupMembers', () => {
    it('should return array of members', async () => {
      const mockMembers = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ];

      when(mockRpc)
        .calledWith('get_members', expect.any(Object))
        .thenResolve({
          data: mockMembers,
          error: null
        });

      const result = await getGroupMembers('test-guid', 'member-code');

      expect(mockRpc).toHaveBeenCalledWith('get_members', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code'
      });
      expect(result).toEqual(mockMembers);
    });

    it('should return empty array when no members', async () => {
      when(mockRpc)
        .calledWith('get_members', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const result = await getGroupMembers('test-guid', 'member-code');

      expect(result).toEqual([]);
    });

    it('should return empty array when error occurs', async () => {
      when(mockRpc)
        .calledWith('get_members', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Error' }
        });

      const result = await getGroupMembers('test-guid', 'member-code');

      expect(result).toEqual([]);
    });

    it('should return empty array when exception is thrown', async () => {
      when(mockRpc)
        .calledWith('get_members', expect.any(Object))
        .thenReject(new Error('Network error'));

      const result = await getGroupMembers('test-guid', 'member-code');

      expect(result).toEqual([]);
    });
  });

  describe('getGroupInfo', () => {
    it('should return group information with member code', async () => {
      const mockGroupInfo = [{
        name: 'Test Group',
        description: 'Test Description',
        capacity: 10
      }];

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: mockGroupInfo,
          error: null
        });

      const result = await getGroupInfo('test-guid', 'member-code');

      expect(mockRpc).toHaveBeenCalledWith('get_group', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code'
      });
      expect(result).toEqual(mockGroupInfo[0]);
    });

    it('should return group information without member code', async () => {
      const mockGroupInfo = [{
        name: 'Test Group',
        description: 'Test Description'
      }];

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: mockGroupInfo,
          error: null
        });

      const result = await getGroupInfo('test-guid');

      expect(mockRpc).toHaveBeenCalledWith('get_group', {
        p_group_guid: 'test-guid',
        p_member_code: null
      });
      expect(result).toEqual(mockGroupInfo[0]);
    });

    it('should return null when error occurs', async () => {
      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Not found' }
        });

      const result = await getGroupInfo('test-guid', 'member-code');

      expect(result).toBeNull();
    });

    it('should return null when exception is thrown', async () => {
      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenReject(new Error('Network error'));

      const result = await getGroupInfo('test-guid', 'member-code');

      expect(result).toBeNull();
    });
  });
});
