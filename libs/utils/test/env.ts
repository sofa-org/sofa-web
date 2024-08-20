import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Env } from '../env';

// Mocking @fingerprintjs/fingerprintjs
vi.mock('@fingerprintjs/fingerprintjs', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue({ visitorId: 'mock-visitor-id' }),
  }),
}));

describe('Env class', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('should retrieve deviceID from localStorage if available', async () => {
    window.localStorage.setItem('device-id', 'test-device-id');
    await expect(Env.deviceID).resolves.toBe('test-device-id');
  });

  it('should generate and store a new deviceID if not available in localStorage', async () => {
    await expect(Env.deviceID).resolves.toBe('mock-visitor-id');
    expect(window.localStorage.getItem('device-id')).toBe('mock-visitor-id');
  });

  it('should return a static version', () => {
    expect(Env.version).toBe('0.0.1');
  });

  it('should correctly identify the environment', () => {
    // Assuming the environment variables are set as expected
    expect(Env.isDev).toBe(import.meta.env.NODE_ENV === 'development');
    expect(Env.isDaily).toBe(import.meta.env.VITE_ENV === 'daily');
    expect(Env.isPre).toBe(import.meta.env.VITE_ENV === 'pre');
    expect(Env.isProd).toBe(import.meta.env.VITE_ENV === 'prod');
  });
});
