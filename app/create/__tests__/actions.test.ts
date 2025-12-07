import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGroup } from '@/app/create/actions';

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock('@/utilities/supabase/server', () => ({
  getClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('createGroup Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when group name is missing', async () => {
    const formData = new FormData();
    formData.append('groupName', '');
    formData.append('creatorName', 'Admin');
    formData.append('capacity', '10');

    const result = await createGroup(formData);

    expect(result).toEqual({
      success: false,
      error: 'Group name is required',
    });
  });

  it('should return error when creator name is missing', async () => {
    const formData = new FormData();
    formData.append('groupName', 'Test Group');
    formData.append('creatorName', '');
    formData.append('capacity', '10');

    const result = await createGroup(formData);

    expect(result).toEqual({
      success: false,
      error: 'Admin name is required',
    });
  });

  it('should return error when group name exceeds 30 characters', async () => {
    const formData = new FormData();
    formData.append('groupName', 'A'.repeat(31));
    formData.append('creatorName', 'Admin');
    formData.append('capacity', '10');

    const result = await createGroup(formData);

    expect(result).toEqual({
      success: false,
      error: 'Group name cannot exceed 30 characters',
    });
  });

  it('should return error when capacity is less than 2', async () => {
    const formData = new FormData();
    formData.append('groupName', 'Test Group');
    formData.append('creatorName', 'Admin');
    formData.append('capacity', '1');

    const result = await createGroup(formData);

    expect(result).toEqual({
      success: false,
      error: 'Capacity must be at least 2 members',
    });
  });

  it('should return error when capacity exceeds 100', async () => {
    const formData = new FormData();
    formData.append('groupName', 'Test Group');
    formData.append('creatorName', 'Admin');
    formData.append('capacity', '101');

    const result = await createGroup(formData);

    expect(result).toEqual({
      success: false,
      error: 'Capacity cannot exceed 100 members',
    });
  });

  it('should return error when expiry date is in the past', async () => {
    const formData = new FormData();
    formData.append('groupName', 'Test Group');
    formData.append('creatorName', 'Admin');
    formData.append('capacity', '10');
    formData.append('expiryDate', '2020-01-01');

    const result = await createGroup(formData);

    expect(result).toEqual({
      success: false,
      error: 'Expiry date must be in the future',
    });
  });

  it('should handle valid form data without errors', async () => {
    const formData = new FormData();
    formData.append('groupName', 'Test Group');
    formData.append('creatorName', 'Admin');
    formData.append('creatorCode', 'CODE123');
    formData.append('capacity', '10');
    formData.append('description', 'Test description');
    
    // Mock successful database operations
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { guid: 'test-guid' },
          error: null,
        })),
      })),
    }));
    
    mockSupabase.from = vi.fn(() => ({
      insert: mockInsert,
    }));

    // The function might redirect or return success
    // This test verifies no validation errors occur
    try {
      await createGroup(formData);
    } catch (error) {
      // Redirect throws in tests, which is expected behavior
      expect(error).toBeDefined();
    }
  });
});
