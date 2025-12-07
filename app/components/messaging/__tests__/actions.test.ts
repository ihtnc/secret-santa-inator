import { describe, it, expect, vi, beforeEach } from 'vitest';
import { when } from 'vitest-when';
import {
  sendMessage,
  getMessageHistory,
  getUnreadMessageCount,
  markMessagesAsRead
} from '@/app/components/messaging/actions';

// Mock the Supabase client
const mockRpc = vi.fn();
vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => ({
    rpc: mockRpc
  }))
}));

describe('Messaging Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should successfully send a group message', async () => {
      when(mockRpc)
        .calledWith('send_message', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('senderCode', 'sender-code');
      formData.append('isGroupMessage', 'true');
      formData.append('messageToSecretSanta', 'false');
      formData.append('message', 'Hello everyone!');

      const result = await sendMessage(formData);

      expect(mockRpc).toHaveBeenCalledWith('send_message', {
        p_group_guid: 'test-guid',
        p_sender_code: 'sender-code',
        p_message: 'Hello everyone!',
        p_is_group_message: true,
        p_message_to_secret_santa: false
      });
      expect(result.success).toBe(true);
    });

    it('should successfully send message to secret santa', async () => {
      when(mockRpc)
        .calledWith('send_message', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('senderCode', 'sender-code');
      formData.append('isGroupMessage', 'false');
      formData.append('messageToSecretSanta', 'true');
      formData.append('message', 'Thanks for the gift!');

      const result = await sendMessage(formData);

      expect(mockRpc).toHaveBeenCalledWith('send_message', {
        p_group_guid: 'test-guid',
        p_sender_code: 'sender-code',
        p_message: 'Thanks for the gift!',
        p_is_group_message: false,
        p_message_to_secret_santa: true
      });
      expect(result.success).toBe(true);
    });

    it('should require group GUID', async () => {
      const formData = new FormData();
      formData.append('groupGuid', '');
      formData.append('senderCode', 'sender-code');
      formData.append('message', 'Test');

      const result = await sendMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Group GUID is required');
    });

    it('should require sender code', async () => {
      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('senderCode', '');
      formData.append('message', 'Test');

      const result = await sendMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sender code is required');
    });

    it('should require message', async () => {
      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('senderCode', 'sender-code');
      formData.append('message', '');

      const result = await sendMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message is required');
    });

    it('should handle database errors', async () => {
      when(mockRpc)
        .calledWith('send_message', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Not authorized' }
        });

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('senderCode', 'wrong-code');
      formData.append('message', 'Test');
      formData.append('isGroupMessage', 'false');
      formData.append('messageToSecretSanta', 'false');

      const result = await sendMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized');
    });

    it('should handle unexpected errors', async () => {
      when(mockRpc)
        .calledWith('send_message', expect.any(Object))
        .thenReject(new Error('Network error'));

      const formData = new FormData();
      formData.append('groupGuid', 'test-guid');
      formData.append('senderCode', 'sender-code');
      formData.append('message', 'Test');
      formData.append('isGroupMessage', 'false');
      formData.append('messageToSecretSanta', 'false');

      const result = await sendMessage(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while sending message');
    });
  });

  describe('getMessageHistory', () => {
    it('should return message history', async () => {
      const mockMessages = [
        { id: 1, message: 'Hello', created_at: '2024-01-01' },
        { id: 2, message: 'Hi there', created_at: '2024-01-02' }
      ];

      when(mockRpc)
        .calledWith('get_message_history', expect.any(Object))
        .thenResolve({
          data: mockMessages,
          error: null
        });

      const result = await getMessageHistory('test-guid', 'member-code');

      expect(mockRpc).toHaveBeenCalledWith('get_message_history', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code',
        p_is_group_message: false,
        p_is_from_secret_santa: false
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
    });

    it('should get group messages', async () => {
      when(mockRpc)
        .calledWith('get_message_history', expect.any(Object))
        .thenResolve({
          data: [],
          error: null
        });

      const result = await getMessageHistory('test-guid', 'member-code', true);

      expect(mockRpc).toHaveBeenCalledWith('get_message_history', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code',
        p_is_group_message: true,
        p_is_from_secret_santa: false
      });
      expect(result.success).toBe(true);
    });

    it('should get secret santa messages', async () => {
      when(mockRpc)
        .calledWith('get_message_history', expect.any(Object))
        .thenResolve({
          data: [],
          error: null
        });

      const result = await getMessageHistory('test-guid', 'member-code', false, true);

      expect(mockRpc).toHaveBeenCalledWith('get_message_history', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code',
        p_is_group_message: false,
        p_is_from_secret_santa: true
      });
      expect(result.success).toBe(true);
    });

    it('should require group GUID', async () => {
      const result = await getMessageHistory('', 'member-code');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Group GUID is required');
    });

    it('should require member code', async () => {
      const result = await getMessageHistory('test-guid', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Member code is required');
    });

    it('should return empty array when no messages', async () => {
      when(mockRpc)
        .calledWith('get_message_history', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const result = await getMessageHistory('test-guid', 'member-code');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      when(mockRpc)
        .calledWith('get_message_history', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Not found' }
        });

      const result = await getMessageHistory('test-guid', 'member-code');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return unread count', async () => {
      when(mockRpc)
        .calledWith('get_unread_message_count', expect.any(Object))
        .thenResolve({
          data: [{ unread_count: 5, total_count: 10 }],
          error: null
        });

      const result = await getUnreadMessageCount('test-guid', 'member-code');

      expect(mockRpc).toHaveBeenCalledWith('get_unread_message_count', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code',
        p_is_group_message: false,
        p_is_from_secret_santa: false
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ unread_count: 5, total_count: 10 });
    });

    it('should return 0 counts when no data', async () => {
      when(mockRpc)
        .calledWith('get_unread_message_count', expect.any(Object))
        .thenResolve({
          data: [],
          error: null
        });

      const result = await getUnreadMessageCount('test-guid', 'member-code');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ unread_count: 0, total_count: 0 });
    });

    it('should handle error', async () => {
      when(mockRpc)
        .calledWith('get_unread_message_count', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Error' }
        });

      const result = await getUnreadMessageCount('test-guid', 'member-code');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error');
    });

    it('should require group GUID', async () => {
      const result = await getUnreadMessageCount('', 'member-code');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Group GUID is required');
    });

    it('should require member code', async () => {
      const result = await getUnreadMessageCount('test-guid', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Member code is required');
    });
  });

  describe('markMessagesAsRead', () => {
    it('should successfully mark messages as read', async () => {
      when(mockRpc)
        .calledWith('mark_messages_as_read', expect.any(Object))
        .thenResolve({
          data: null,
          error: null
        });

      const result = await markMessagesAsRead('test-guid', 'member-code', [1, 2, 3]);

      expect(mockRpc).toHaveBeenCalledWith('mark_messages_as_read', {
        p_group_guid: 'test-guid',
        p_member_code: 'member-code',
        p_message_ids: [1, 2, 3]
      });
      expect(result.success).toBe(true);
    });

    it('should require message IDs', async () => {
      const result = await markMessagesAsRead('test-guid', 'member-code', []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message IDs are required');
    });

    it('should require group GUID', async () => {
      const result = await markMessagesAsRead('', 'member-code', [1]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Group GUID is required');
    });

    it('should require member code', async () => {
      const result = await markMessagesAsRead('test-guid', '', [1]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Member code is required');
    });

    it('should handle database errors', async () => {
      when(mockRpc)
        .calledWith('mark_messages_as_read', expect.any(Object))
        .thenResolve({
          data: null,
          error: { message: 'Failed to update' }
        });

      const result = await markMessagesAsRead('test-guid', 'member-code', [1]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update');
    });

    it('should handle unexpected errors', async () => {
      when(mockRpc)
        .calledWith('mark_messages_as_read', expect.any(Object))
        .thenReject(new Error('Network error'));

      const result = await markMessagesAsRead('test-guid', 'member-code', [1]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while marking messages as read');
    });
  });
});
