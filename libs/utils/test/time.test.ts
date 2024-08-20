/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, expect, test } from 'vitest';

import { MsIntervals } from '../expiry';
import { formatDuration } from '../time';

describe.concurrent('formatDuration', () => {
  test('formats duration correctly for mixed units', () => {
    // 假设1年2月3天4小时5分钟6秒
    const durationMs =
      MsIntervals.year +
      2 * MsIntervals.month +
      3 * MsIntervals.day +
      4 * MsIntervals.hour +
      5 * MsIntervals.min +
      6 * MsIntervals.s;
    const formatted = formatDuration(durationMs);
    // 根据length参数（默认为3），只期望返回最大的三个单位
    expect(formatted.trim()).toBe('01y 02M 03d');
  });

  test('returns "-" for non-numeric inputs', () => {
    // @ts-ignore: 测试非法输入
    expect(formatDuration('abc')).toBe('-');
  });

  test('formats short durations correctly', () => {
    const durationMs = 5 * MsIntervals.min + 30 * MsIntervals.s;
    const formatted = formatDuration(durationMs, 2); // length限制为2
    expect(formatted.trim()).toBe('05m 30s');
  });

  test('handles zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  test('formats long duration with custom length', () => {
    // 测试长时间的格式化，自定义length为4
    const durationMs =
      10 * MsIntervals.day +
      15 * MsIntervals.hour +
      45 * MsIntervals.min +
      25 * MsIntervals.s;
    const formatted = formatDuration(durationMs, 4);
    expect(formatted.trim()).toBe('10d 15h 45m 25s');
  });
});
