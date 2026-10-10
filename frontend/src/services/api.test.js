import { afterEach, describe, expect, it, vi } from 'vitest';
import api, { getToken, setToken, clearToken, setUnauthorizedHandler } from './api';

function stubAdapter(handler) {
  api.defaults.adapter = (config) => handler(config);
}

afterEach(() => {
  api.defaults.adapter = undefined;
});

describe('api client', () => {
  it('persists and clears the token in storage', () => {
    setToken('abc123');
    expect(getToken()).toBe('abc123');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('attaches the stored bearer token to requests', async () => {
    setToken('abc123');
    let capturedConfig;
    stubAdapter(async (config) => {
      capturedConfig = config;
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    });

    await api.get('/auth/me');
    clearToken();

    expect(capturedConfig.headers.Authorization).toBe('Bearer abc123');
  });

  it('calls the unauthorized handler and clears the token on 401 (non-login)', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setToken('expired-token');

    stubAdapter(async (config) => {
      const error = new Error('Unauthorized');
      error.response = { status: 401, data: { message: 'Unauthorized' }, headers: {} };
      error.config = config;
      error.code = 'ERR_BAD_REQUEST';
      throw error;
    });

    await expect(api.get('/projects')).rejects.toThrow('Unauthorized');
    expect(handler).toHaveBeenCalled();
    expect(getToken()).toBeNull();
  });

  it('does not trigger the unauthorized handler for failed logins', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    stubAdapter(async (config) => {
      const error = new Error('Invalid credentials');
      error.response = { status: 401, data: { message: 'Invalid credentials' }, headers: {} };
      error.config = config;
      throw error;
    });

    await expect(api.post('/auth/login', { email: 'a@b.co', password: 'x' })).rejects.toThrow(
      'Invalid credentials'
    );
    expect(handler).not.toHaveBeenCalled();
  });
});