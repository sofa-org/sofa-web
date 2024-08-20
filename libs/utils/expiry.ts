import dayjs from 'dayjs';

import { isLegalNum } from './fns';

/**
 * @desc 秒，分，时，天，月，年的 ms 间隔
 * */
export const MsIntervals = {
  s: 1000,
  min: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

// 返回当天 UTC+0 8:00:00 的时间
export function day8h(time = Date.now()) {
  const $now = dayjs(+time);
  return +new Date($now.format('YYYY-MM-DD') + 'T08:00Z').getTime();
}

/**
 * @desc 返回之前第 n 个 8 点(UTC+0 时区)（结算时间）的时间戳，n 从 1 开始
 * excludeNow 是否包含当前时间，true - 不包含；false - 包含
 * */
export function pre8h(time = Date.now(), n = 1, excludeNow = false) {
  const $now = dayjs(+time);
  const day8h = new Date($now.format('YYYY-MM-DD') + 'T08:00Z').getTime();
  const hasCrossed8h = excludeNow
    ? $now.valueOf() - day8h > 0
    : $now.valueOf() - day8h >= 0;
  return new Date(
    $now.add(hasCrossed8h ? -n + 1 : -n, 'day').format('YYYY-MM-DD') +
      'T08:00Z',
  ).getTime();
}

/**
 * @desc 返回之后第 n 个 8 点(UTC+0 时区)（结算时间）的时间戳，n 从 1 开始
 * excludeNow 是否包含当前时间，true - 不包含；false - 包含
 * */
export function next8h(time = Date.now(), n = 1, excludeNow = false) {
  const $now = dayjs(+time);
  const day8h = new Date($now.format('YYYY-MM-DD') + 'T08:00Z').getTime();
  const hasNotCrossed8h = excludeNow
    ? $now.valueOf() - day8h < 0
    : $now.valueOf() - day8h <= 0;
  return new Date(
    $now.add(hasNotCrossed8h ? n - 1 : n, 'day').format('YYYY-MM-DD') +
      'T08:00Z',
  ).getTime();
}

export function nearest8h(time = Date.now()) {
  const $pre8h = pre8h(time);
  const $next8h = next8h(time);
  return Math.abs($pre8h - time) < Math.abs($next8h - time) ? $pre8h : $next8h;
}

export function displayExpiry(expiry: string | number) {
  if (isLegalNum(expiry)) return dayjs(+expiry).format('DDMMMYY').toUpperCase();
  return String(expiry).toUpperCase();
}
