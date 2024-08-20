import { MutableRefObject, useRef } from 'react';
import { useLazyCallback } from '@sofa/utils/hooks';

/**
 * Linear interpolation
 * @param {Number} a - first value to interpolate
 * @param {Number} b - second value to interpolate
 * @param {Number} r - amount to interpolate 0~1
 */
export function lerp(a: number, b: number, n: number) {
  return (1 - n) * a + n * b;
}

export function lerp1(x: number, p1: [number, number], p2: [number, number]) {
  return p1[1] + ((x - p1[0]) * (p2[1] - p1[1])) / (p2[0] - p1[0]);
}

export function autoAnimate(
  cb: (x: number) => void,
  $start: number,
  end: number,
  amt = 0.17 /* 0~1 */,
  stopCondition = (absMove: number) => absMove < Math.abs(end - $start) * 0.01,
) {
  let start = $start;
  let stop = false;
  const call = async (): Promise<unknown> => {
    start = lerp(start, end, amt);
    const absMove = Math.abs(start - end);
    const shouldStop = stop || stopCondition(absMove);
    cb(shouldStop ? end : start);
    if (!shouldStop) {
      return new Promise((resolve) =>
        requestAnimationFrame(() => resolve(call())),
      );
    }
  };
  return Object.assign(call(), {
    stop: () => (stop = true),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useScrub<Args extends any[]>(
  cb: (
    preRef: MutableRefObject<
      (Promise<unknown> & { stop: () => void }) | undefined
    >,
    ...args: Args
  ) => (Promise<unknown> & { stop: () => void }) | undefined,
) {
  const preRef = useRef<Promise<unknown> & { stop: () => void }>();
  return useLazyCallback((...args: Args) => {
    preRef.current = cb(preRef, ...args);
  });
}
