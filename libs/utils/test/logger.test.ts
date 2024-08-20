import { describe, expect, it } from 'vitest';

import { Logger } from '../logger';

describe('Logger class', () => {
  it('run', () => {
    Logger.info('1');
    Logger.log('1');
    Logger.warn('1');
    Logger.error('1');
    expect(1).toBe(1);
  });
});
