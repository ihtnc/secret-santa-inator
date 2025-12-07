import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClient } from '@/utilities/supabase/server';

// Mock the dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key, options) => ({
    url,
    key,
    options,
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

describe('Supabase Server Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a client with environment variables', async () => {
    const client = await getClient();
    
    expect(client).toBeDefined();
    expect(client.url).toBe('http://localhost:54321');
    expect(client.key).toBe('test-key');
  });

  it('should configure cookies correctly', async () => {
    const client = await getClient();
    
    expect(client.options).toBeDefined();
    expect(client.options.cookies).toBeDefined();
    expect(typeof client.options.cookies.getAll).toBe('function');
    expect(typeof client.options.cookies.setAll).toBe('function');
  });
});
