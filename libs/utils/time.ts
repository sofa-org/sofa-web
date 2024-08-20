import { MsIntervals } from './expiry';
import { isLegalNum } from './fns';

export { MsIntervals };

export function formatDurationToTimespan(
  value: number,
  ops?: { noNegative: boolean },
) {
  const totalSeconds = Math.floor(
    value <= 0 && ops?.noNegative ? 0 : value / 1000,
  );
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  if (h) {
    return h + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

export function formatDurationToSeconds(
  value: number,
  ops?: { noNegative: boolean; onZero?: string; surfix?: string },
) {
  const v = Math.floor(value / 1000);
  let res: string;
  if (ops?.noNegative) {
    if (v <= 0 && ops.onZero) {
      return ops.onZero;
    }
    res = v <= 0 ? `0` : v.toString();
  } else if (ops?.onZero && v == 0) {
    return ops.onZero;
  } else {
    res = v.toString();
  }
  return ops?.surfix ? res + ops.surfix : res;
}

export function formatDuration(value: number, length = 3) {
  if (!isLegalNum(value)) return '-';
  const order = [
    { key: 'year', alias: 'y' },
    { key: 'month', alias: 'M' },
    { key: 'day', alias: 'd' },
    { key: 'hour', alias: 'h' },
    { key: 'min', alias: 'm' },
    { key: 's', alias: 's' },
  ] as const;
  let leftVal = value;
  let leftLen = length;
  let result = '';
  for (let i = 0; i < order.length && leftLen > 0; i += 1) {
    const { key, alias } = order[i];
    const times = Math.floor(leftVal / MsIntervals[key]);
    leftVal = leftVal % MsIntervals[key];
    if (leftVal !== value) {
      result += `${String(times).padStart(2, '0')}${alias} `;
      leftLen -= 1;
    }
  }
  return result || '0s';
}

// 根据 interval 按照 orderDirection 分割时间
export function separateTimeByInterval(
  params: { startTime: number; endTime?: number },
  interval: number,
  orderDirection: 'desc' | 'asc',
) {
  const list: Required<typeof params>[] = [];
  let endTime = params.endTime || Date.now();
  let startTime = Math.max(params.startTime, endTime - interval);
  while (params.startTime < startTime) {
    list.push({ startTime, endTime });
    endTime = startTime;
    startTime = startTime - interval;
  }
  list.push({ startTime: params.startTime, endTime });
  return list.sort((a, b) =>
    orderDirection === 'asc'
      ? a.startTime - b.startTime
      : b.startTime - a.startTime,
  );
}

export function displayTenor(
  tenor: string | number,
  t: (txt: string, values: Record<string, string | number>) => string,
) {
  if (+tenor <= 1) return t('{{tenor}} Day', { tenor });
  return t('{{tenor}} Days', { tenor });
}
