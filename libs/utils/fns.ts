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
