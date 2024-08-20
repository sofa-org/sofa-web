import { describe, expect, test } from 'vitest';

import {
  day8h,
  displayExpiry,
  MsIntervals,
  nearest8h,
  next8h,
  pre8h,
} from '../expiry';

describe.concurrent('day8h', () => {
  test('returns timestamp for today at 08:00 UTC', () => {
    const result = day8h(new Date('2024-02-19T12:00:00Z').getTime());
    const expected = new Date('2024-02-19T08:00:00Z').getTime();
    expect(result).toBe(expected);
  });
});

describe.concurrent('pre8h', () => {
  test('returns timestamp for previous 08:00 UTC excluding now', () => {
    const now = new Date('2024-02-20T09:00:00Z').getTime();
    const result = pre8h(now, 1, true);
    const expected = new Date('2024-02-20T08:00:00Z').getTime();
    expect(result).toBe(expected);
  });

  test('returns timestamp for previous 08:00 UTC including now', () => {
    const now = new Date('2024-02-20T08:00:00Z').getTime();
    const result = pre8h(now, 1, false);
    const expected = new Date('2024-02-20T08:00:00Z').getTime();
    expect(result).toBe(expected);
  });
});

describe.concurrent('next8h', () => {
  test('returns timestamp for next 08:00 UTC excluding now', () => {
    const now = new Date('2024-02-19T07:59:59Z').getTime();
    const result = next8h(now, 1, true);
    const expected = new Date('2024-02-19T08:00:00Z').getTime();
    expect(result).toBe(expected);
  });

  test('returns timestamp for next 08:00 UTC including now', () => {
    const now = new Date('2024-02-19T08:00:00Z').getTime();
    const result = next8h(now, 1, true);
    const expected = new Date('2024-02-20T08:00:00Z').getTime();
    expect(result).toBe(expected);
  });
});

describe.concurrent('nearest8h', () => {
  test('returns the nearest 08:00 UTC time', () => {
    const now = new Date('2024-02-19T10:00:00Z').getTime();
    const result = nearest8h(now);
    const expectedPre = new Date('2024-02-19T08:00:00Z').getTime();
    const expectedNext = new Date('2024-02-20T08:00:00Z').getTime();
    expect(result).toBe(expectedPre);
    expect(Math.abs(result - now)).toBeLessThan(Math.abs(expectedNext - now));
  });
});

describe.concurrent('displayExpiry', () => {
  test('displays expiry in DDMMMYY format for timestamp input', () => {
    const expiry = new Date('2024-02-19T08:00:00Z').getTime();
    const result = displayExpiry(expiry);
    expect(result).toBe('19FEB24');
  });

  test('returns the string in uppercase for non-numeric input', () => {
    const expiry = '2024-02-19';
    const result = displayExpiry(expiry);
    expect(result).toBe('2024-02-19'.toUpperCase());
  });
});

describe.concurrent('MsIntervals', () => {
  test('contains correct milliseconds intervals', () => {
    expect(MsIntervals.s).toBe(1000);
    expect(MsIntervals.min).toBe(60 * 1000);
    expect(MsIntervals.hour).toBe(60 * 60 * 1000);
    expect(MsIntervals.day).toBe(24 * 60 * 60 * 1000);
    expect(MsIntervals.month).toBe(30 * 24 * 60 * 60 * 1000);
    expect(MsIntervals.year).toBe(365 * 24 * 60 * 60 * 1000);
  });
});
