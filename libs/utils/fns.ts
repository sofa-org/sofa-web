import get from 'lodash-es/get';

export function jsonSafeParse<T>(
  str: string | null | undefined,
  fallbackVal: T = undefined as never,
): T {
  try {
    return JSON.parse(str!);
  } catch (e) {
    console.warn(e);
    return fallbackVal as T;
  }
}

export function isNullLike(val: unknown): val is null | undefined {
  return val === null || val === undefined;
}

export function calcVal<T, Args extends unknown[]>(
  val: T | ((...args: Args) => T),
  ...$args: Args
) {
  if (typeof val === 'function')
    return (val as (...args: unknown[]) => T)(...$args);
  return val;
}

export function safeRun<Args extends unknown[] = never>(
  fn: (...args1: Args) => unknown,
  ...args: Args
) {
  try {
    return fn(...args);
  } catch (err) {
    console.warn(err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorMsg(val: any): string {
  if (!val || typeof val === 'string') return val;
  return (
    val.message || val.msg || val.status_msg || val.shortMessage || val.reason
  );
}

export function isTwoStringSame(s1?: string | number, s2?: string | number) {
  return String(s1).toLowerCase() === String(s2).toLowerCase();
}

export function isLegalNum(val: unknown): val is string | number {
  return !isNaN(val as number) && !!(val || val === 0);
}

export function isUSD(val: unknown): val is USDS {
  return String(val).startsWith('USD');
}

export function calcMinAndMax(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  valueKey?: string,
  /**
   * @default { margin: [0.2, 0.2], integer: true }
   * */
  options?: {
    min?: number;
    max?: number;
    margin?: number | [number, number];
    integer?: boolean;
  },
) {
  let $min = Infinity;
  let $max = -Infinity;
  data.forEach((it) => {
    const val = valueKey ? +get(it, valueKey) : it;
    $min = Math.min($min, val);
    $max = Math.max($max, val);
  });
  const margin = isNullLike(options?.margin)
    ? [0.2, 0.2]
    : typeof options!.margin === 'number'
      ? [options!.margin, options!.margin]
      : options!.margin;
  const integer = options?.integer ?? true;
  const cvt = (v: number) => (integer ? Math.floor(v) : v);
  return {
    min: Math.max(
      options?.min ?? -Infinity,
      cvt($min - ($max - $min) * margin[0]),
    ),
    max: Math.min(
      options?.max ?? Infinity,
      cvt($max + ($max - $min) * margin[1]),
    ),
  };
}

export function getNearestItemIndex<T>(
  list: T[],
  referNum: number,
  options?: {
    useGte?: boolean;
    useLte?: boolean;
    calcCompareNum?(item: T): number;
  },
) {
  if (!list?.length) return { sortList: [], index: -1 };
  const calc = options?.calcCompareNum || Number;
  const $list = [...list].sort((a, b) => calc(a) - calc(b));

  // 二分法
  // 变量：leftCursor - 左边的索引，rightCursor - 右边的索引
  // 比较左右索引的中间元素与 referNum：
  //    如果中间元素比 referNum 大，则将 rightCursor 修改为中间元素的索引;
  //    如果中间元素比 referNum 小，则将 leftCursor 修改为中间元素的索引;
  //    如果中间元素与 referNum 相等，直接返回;
  // 直到 leftCursor 与 rightCursor 之间没有中间元素了
  const index = (() => {
    let leftCursor = 0;
    let rightCursor = $list.length - 1;
    while (rightCursor - leftCursor > 1) {
      const middle = Math.floor((rightCursor + leftCursor) / 2);
      const offset = referNum - calc($list[middle]);
      if (offset === 0) return middle;
      else if (offset < 0) rightCursor = middle;
      else leftCursor = middle;
    }
    const leftOffset = referNum - calc($list[leftCursor]);
    const rightOffset = referNum - calc($list[rightCursor]);
    if (leftOffset === 0) return leftCursor;
    if (leftOffset < 0) return options?.useLte ? -1 : leftCursor;
    if (rightOffset === 0) return rightCursor;
    if (rightOffset > 0) return options?.useGte ? rightCursor + 1 : rightCursor;
    if (options?.useGte) return rightCursor;
    if (options?.useLte) return leftCursor;
    return Math.abs(leftOffset) <= Math.abs(rightOffset)
      ? leftCursor
      : rightCursor;
  })();
  return { sortList: $list, index };
}

export function getNearestItem<T>(
  list: T[],
  referNum: number,
  options?: {
    useGte?: boolean;
    useLte?: boolean;
    calcCompareNum?(item: T): number;
  },
): T | undefined {
  const { sortList, index } = getNearestItemIndex(list, referNum, options);
  return sortList[index];
}

export function ellipsis(str: string | number | undefined | null, len: number) {
  if (!str || String(str).length <= len) return str?.toString();
  return String(str).slice(0, len) + '...';
}
