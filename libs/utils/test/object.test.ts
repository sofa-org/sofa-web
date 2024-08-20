import { describe, expect, test } from 'vitest';

import {
  arrPad,
  arrToDict,
  dirtyArrayOmit,
  objectKeyCvt,
  objectValCvt,
  simplePlus,
  toArray,
} from '../object';

describe.concurrent('arrToDict', () => {
  test('converts array to dictionary using provided key', () => {
    const arr = [
      { id: 1, name: 'Item1' },
      { id: 2, name: 'Item2' },
    ];
    const dict = arrToDict(arr, 'id');
    expect(dict['1']).toEqual({ id: 1, name: 'Item1' });
    expect(dict['2']).toEqual({ id: 2, name: 'Item2' });
  });

  test('handles null or undefined array input', () => {
    const dict = arrToDict(null, 'id');
    expect(dict).toEqual({});
  });
});

describe.concurrent('dirtyArrayOmit', () => {
  test('removes elements from array based on predicate', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = dirtyArrayOmit(arr, (it) => it % 2 === 0);
    expect(result).toEqual([1, 3, 5]);
  });
});

describe.concurrent('objectKeyCvt', () => {
  test('converts object keys according to provided function', () => {
    const obj = { key1: 'value1', key2: 'value2' };
    const newObj = objectKeyCvt(obj, (k) => `new_${k}`);
    expect(newObj).toEqual({ new_key1: 'value1', new_key2: 'value2' });
  });
});

describe.concurrent('objectValCvt', () => {
  test('converts object values according to provided function', () => {
    const obj = { key1: 1, key2: 2 };
    const newObj = objectValCvt(obj, (val) => val * 2);
    expect(newObj).toEqual({ key1: 2, key2: 4 });
  });
});

describe.concurrent('toArray', () => {
  test('converts non-array values to array', () => {
    expect(toArray(1)).toEqual([1]);
    expect(toArray([1])).toEqual([1]);
  });

  test('handles undefined or null values', () => {
    expect(toArray()).toEqual([]);
    expect(toArray(null)).toEqual([]);
  });
});

describe.concurrent('simplePlus', () => {
  test('sums up numeric values, ignoring non-numeric', () => {
    expect(simplePlus(1, '2', null, 'abc')).toBe(3);
  });

  test('returns undefined for all non-numeric inputs', () => {
    expect(simplePlus(null, 'abc')).toBeUndefined();
  });
});

describe.concurrent('arrPad', () => {
  test('pads array to specified length at the start', () => {
    const arr = [1, 2];
    expect(arrPad(arr, 4, 0)).toEqual([0, 0, 1, 2]);
  });

  test('pads array to specified length at the end', () => {
    const arr = [1, 2];
    expect(arrPad(arr, 4, 0, 'end')).toEqual([1, 2, 0, 0]);
  });

  test('returns original array if length is sufficient', () => {
    const arr = [1, 2, 3];
    expect(arrPad(arr, 3, 0)).toEqual([1, 2, 3]);
  });
});
