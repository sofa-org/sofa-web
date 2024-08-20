import { describe, expect, it } from 'vitest';

import { sentry } from '../sentry';

describe('Sentry class', () => {
  it('run', () => {
    sentry.setUser({});
    sentry.captureException('');
    expect(1).toBe(1);
  });
});
