import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { http, pollingUntil } from '../http'; // Adjust the import path

vi.mock('./sentry', () => ({
  captureException: vi.fn(),
}));

describe.concurrent('pollingUntil', () => {
  it('should stop polling when until condition is met', async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce('response 1')
      .mockResolvedValueOnce('response 2')
      .mockResolvedValueOnce('response 3');
    const until = vi
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const responses = await pollingUntil(api, until);

    expect(api).toHaveBeenCalledTimes(3);
    expect(until).toHaveBeenCalledTimes(3);
    expect(responses).toEqual(['response 1', 'response 2', 'response 3']);
  });
});

describe.concurrent('Http Service', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(http);
  });

  afterEach(() => {
    mock.reset();
  });

  it('successfully handles data with code 0', async () => {
    const data = { code: 0, value: 'success' };
    mock.onGet('/success').reply(200, JSON.stringify(data));

    const response = await http.get<unknown, HttpResponse>('/success');

    expect(response.value).toEqual('success');
  });

  it('throws an error for data with code not equal to 0', async () => {
    const data = { code: 1, message: 'Error', value: null };
    mock.onGet('/fail').reply(200, JSON.stringify(data));

    try {
      await http.get('/fail');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(error.message).toContain('Error');
      expect(error.code).toBe(1);
    }
  });

  it('reformats the error and captures it in Sentry for server errors', async () => {
    const serverError = { code: 1, message: 'Not fount', value: null };
    mock.onGet('/server-error').reply(404, serverError);

    try {
      await http.get('/server-error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(error.message).toContain('status-404');
      expect(error.code).toBe(1);
    }
  });
});
