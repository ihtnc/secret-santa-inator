import { describe, it, expect, vi, beforeEach } from 'vitest';
import { when } from 'vitest-when';
import {
  getGroupDetails,
  getGroupMembers,
  assignSecretSanta,
  joinGroupAsCreator,
  kickMember,
  unlockGroup,
  getCustomCodeNames,
  deleteGroup,
  updateGroup
} from '@/app/admin/[group-guid]/actions';

// Mock the Supabase client
const mockRpc = vi.fn();

vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => ({
    rpc: (...args: unknown[]) => {
      const result = mockRpc(...args);
      // Return a promise that has a .single() method
      // Use Object.assign to add .single() to the Promise
      return Object.assign(result, {
        single: () => result
      });
    }
  }))
}));

describe('Admin Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGroupDetails', () => {
    it('should return group details for valid creator', async () => {
      const mockGroupData = {
        name: 'Test Group',
        password: 'pass123',
        capacity: 10,
        description: 'Test Description',
        is_open: true,
        expiry_date: '2025-12-31',
        use_code_names: true,
        auto_assign_code_names: false,
        use_custom_code_names: true,
        creator_name: 'Test Creator',
        is_frozen: false
      };

      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({ data: mockGroupData, error: null });

      const result = await getGroupDetails('test-guid', 'creator-code');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Group');
      expect(result?.capacity).toBe(10);
    });

    it('should return null for invalid creator', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: false, error: null });

      const result = await getGroupDetails('test-guid', 'wrong-code');

      expect(result).toBeNull();
    });

    it('should return null when group not found', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({ data: null, error: { message: 'Not found' } });

      const result = await getGroupDetails('test-guid', 'creator-code');

      expect(result).toBeNull();
    });
  });

  describe('getGroupMembers', () => {
    it('should return empty array when no members', async () => {
      when(mockRpc)
        .calledWith('get_members', expect.any(Object))
        .thenResolve({ data: null, error: null });

      const result = await getGroupMembers('test-guid', 'creator-code');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      when(mockRpc)
        .calledWith('get_members', expect.any(Object))
        .thenResolve({ data: null, error: { message: 'Error' } });

      const result = await getGroupMembers('test-guid', 'creator-code');

      expect(result).toEqual([]);
    });
  });

  describe('assignSecretSanta', () => {
    it('should successfully assign secret santa pairs', async () => {
      when(mockRpc)
        .calledWith('assign_santa', expect.any(Object))
        .thenResolve({ data: null, error: null });

      const result = await assignSecretSanta('test-guid', 'creator-code');

      expect(mockRpc).toHaveBeenCalledWith('assign_santa', {
        p_group_guid: 'test-guid',
        p_creator_code: 'creator-code'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('joinGroupAsCreator', () => {
    it('should successfully join group as creator', async () => {
      when(mockRpc)
        .calledWith('join_group', expect.any(Object))
        .thenResolve({ data: null, error: null });

      const result = await joinGroupAsCreator(
        'test-guid',
        'creator-code',
        'Test Creator',
        'password',
        'TestCode'
      );

      expect(mockRpc).toHaveBeenCalledWith('join_group', {
        p_group_guid: 'test-guid',
        p_password: 'password',
        p_name: 'Test Creator',
        p_code: 'creator-code',
        p_code_name: 'TestCode'
      });
      expect(result.success).toBe(true);
    });

    it('should validate code name length', async () => {
      const result = await joinGroupAsCreator(
        'test-guid',
        'creator-code',
        'Test Creator',
        null,
        'a'.repeat(31)
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('30 characters');
    });
  });

  describe('kickMember', () => {
    it('should successfully kick member', async () => {
      when(mockRpc)
        .calledWith('kick_member', expect.any(Object))
        .thenResolve({ data: null, error: null });

      const result = await kickMember('test-guid', 'creator-code', 'Bad Member');

      expect(mockRpc).toHaveBeenCalledWith('kick_member', {
        p_group_guid: 'test-guid',
        p_creator_code: 'creator-code',
        p_member_name: 'Bad Member'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('unlockGroup', () => {
    it('should successfully unlock group', async () => {
      when(mockRpc)
        .calledWith('unlock_group', expect.any(Object))
        .thenResolve({ data: null, error: null });

      const result = await unlockGroup('test-guid', 'creator-code');

      expect(mockRpc).toHaveBeenCalledWith('unlock_group', {
        p_group_guid: 'test-guid',
        p_creator_code: 'creator-code'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getCustomCodeNames', () => {
    it('should return empty array when no custom names', async () => {
      when(mockRpc)
        .calledWith('get_custom_code_names', expect.any(Object))
        .thenResolve({ data: null, error: null });

      const result = await getCustomCodeNames('test-guid', 'creator-code');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      when(mockRpc)
        .calledWith('get_custom_code_names', expect.any(Object))
        .thenResolve({ data: null, error: { message: 'Error' } });

      const result = await getCustomCodeNames('test-guid', 'creator-code');

      expect(result).toEqual([]);
    });
  });

  describe('deleteGroup', () => {
    it('should successfully delete group', async () => {
      when(mockRpc)
        .calledWith('delete_group', expect.any(Object))
        .thenResolve({ data: null, error: null });

      const result = await deleteGroup('test-guid', 'creator-code');

      expect(mockRpc).toHaveBeenCalledWith('delete_group', {
        p_group_guid: 'test-guid',
        p_creator_code: 'creator-code'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateGroup', () => {
    // Mock getGroupDetails to avoid nested complexity
    beforeEach(() => {
      vi.resetModules();
    });

    it('should validate capacity minimum value', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 10,
            use_custom_code_names: false,
            use_code_names: false,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '1');
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Capacity must be at least 2 members');
    });

    it('should validate capacity maximum value', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 10,
            use_custom_code_names: false,
            use_code_names: false,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '101');
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Capacity cannot exceed 100 members');
    });

    it('should validate description length', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 10,
            use_custom_code_names: false,
            use_code_names: false,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '10');
      formData.append('description', 'A'.repeat(501));
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Description cannot exceed 500 characters');
    });

    it('should validate expiry date is in the future', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 10,
            use_custom_code_names: false,
            use_code_names: false,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '10');
      formData.append('expiryDate', '2020-01-01');
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Expiry date must be in the future');
    });

    it('should validate expiry date is not more than 1 year away', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 10,
            use_custom_code_names: false,
            use_code_names: false,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '10');
      formData.append('expiryDate', '2028-01-01');
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Expiry date cannot be more than 1 year from now');
    });

    it('should return error when group not found', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: false, error: null });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'wrong-code');
      formData.append('capacity', '10');
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Group not found or invalid credentials');
    });

    it('should validate custom code names length', async () => {
      // Mock each RPC call with specific arguments using vitest-when
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 5,
            use_custom_code_names: true,
            use_code_names: true,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      when(mockRpc)
        .calledWith('get_custom_code_names', expect.any(Object))
        .thenResolve({
          data: [
            { name: 'Name1' },
            { name: 'Name2' },
            { name: 'Name3' }
          ],
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '5');
      formData.append('newCustomCodeNames', JSON.stringify(['ValidName', 'A'.repeat(31)])); // 2 new + 3 existing = 5 total
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom code names cannot exceed 30 characters');
    });

    it('should detect duplicate new custom code names', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 5,
            use_custom_code_names: true,
            use_code_names: true,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      when(mockRpc)
        .calledWith('get_custom_code_names', expect.any(Object))
        .thenResolve({
          data: [
            { name: 'Name1' },
            { name: 'Name2' }
          ],
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '5');
      formData.append('newCustomCodeNames', JSON.stringify(['Santa', 'Elf', 'Santa'])); // 3 new (with duplicate) + 2 existing = 5 total
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be unique');
    });

    it('should detect duplicates between existing and new custom code names', async () => {
      when(mockRpc)
        .calledWith('is_creator', expect.any(Object))
        .thenResolve({ data: true, error: null });

      when(mockRpc)
        .calledWith('get_group', expect.any(Object))
        .thenResolve({
          data: {
            name: 'Test Group',
            capacity: 5,
            use_custom_code_names: true,
            use_code_names: true,
            auto_assign_code_names: false,
            creator_name: 'Admin',
            password: null,
            description: null,
            is_open: true,
            expiry_date: null,
            is_frozen: false
          },
          error: null
        });

      when(mockRpc)
        .calledWith('get_custom_code_names', expect.any(Object))
        .thenResolve({
          data: [
            { name: 'Santa' },
            { name: 'Elf' }
          ],
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('creatorCode', 'creator-code');
      formData.append('capacity', '5');
      formData.append('newCustomCodeNames', JSON.stringify(['Reindeer', 'Santa', 'Snowman'])); // 3 new + 2 existing = 5, but Santa is duplicate
      formData.append('isOpen', 'on');

      const result = await updateGroup(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exist');
    });
  });
});
