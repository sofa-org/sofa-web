import Big from 'big.js';
import { get } from 'lodash-es';

import { getErrorMsg, isLegalNum } from './fns';

export function arrToDict<T>(
  arr: T[] | undefined | null,
  key: string | string[] | ((it: T) => string),
  joinStr = '',
): Record<string, T> {
  if (!arr) return {};
  return arr.reduce(
    (pre, it) => {
      if (!it) return pre;
      const $key =
        typeof key === 'function'
          ? key(it)
          : ([] as string[])
              .concat(key)
              .map((k) => get(it, k))
              .join(joinStr);
      pre[$key] = it;
      return pre;
    },
    {} as Record<string, T>,
  );
}

export function dirtyArrayOmit<T>(arr: T[], by: (it: T) => boolean) {
  const len = arr.length;
  let matchedCount = 0;
  const swap = (i: number, j: number) => {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  };
  for (let i = 0; i < len; i += 1) {
    if (by(arr[i])) matchedCount += 1;
    else if (matchedCount > 0) swap(i, i - matchedCount);
  }
  arr.length = len - matchedCount;
  return arr;
}

/**
 * 将对象的 key 做指定转化
 * */
export function objectKeyCvt<
  T extends Record<string, unknown>,
  Key extends string,
>(obj: T, cvt: (k: keyof T) => Key) {
  const $obj = {} as Record<Key, T[keyof T]>;
  for (const k in obj) {
    $obj[cvt(k)] = obj[k];
  }
  return $obj;
}

/**
 * 将对象的字段 value 做指定转化
 * */
export function objectValCvt<T extends Record<string, unknown>, Val>(
  obj: T,
  cvt: (val: T[keyof T], k: keyof T & string) => Val,
) {
  const $obj = {} as Record<keyof T, Val>;
  for (const k in obj) {
    $obj[k] = cvt(obj[k], k);
  }
  return $obj;
}

export function toArray<T>(val?: T | T[]) {
  return ([] as T[]).concat(val ?? []);
}

export function simplePlus(
  ...args: (number | string | undefined | null)[]
): number | undefined {
  const v = args.reduce((pre: Big | number | undefined, it) => {
    if (typeof pre === 'number' && !isFinite(pre)) return Infinity;
    if (!isLegalNum(it)) return pre;
    if (!isFinite(+it)) return Infinity;
    return Big(pre || 0).plus(it);
  }, undefined);
  return v ? +v : undefined;
}

export function arrPad<T>(
  arr: T[],
  maxLength: number,
  fillEl: T,
  position: 'start' | 'end' = 'start',
) {
  if (arr.length >= maxLength) return arr;
  if (position === 'end') {
    return arr.concat([...Array(maxLength - arr.length)].map(() => fillEl));
  }
  return [...Array(maxLength - arr.length)].map(() => fillEl).concat(arr);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reMsgError(err: any, msg: (message: string) => string) {
  const error = new Error(msg(getErrorMsg(err)));
  if (err?.stack) error.stack = err.stack;
  return error;
}
