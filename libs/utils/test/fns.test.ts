import { describe, expect, test } from 'vitest';

import {
  calcMinAndMax,
  calcVal,
  getErrorMsg,
  isLegalNum,
  isNullLike,
  isTwoStringSame,
  isUSD,
  jsonSafeParse,
  safeRun,
} from '../fns';

describe.concurrent('jsonSafeParse', () => {
  test('should parse valid JSON string', () => {
    const json = '{"name":"John"}';
    expect(jsonSafeParse(json)).toEqual({ name: 'John' });
  });

  test('should return fallback value on invalid JSON string', () => {
    const invalidJson = 'invalid';
    expect(jsonSafeParse(invalidJson, 'fallback')).toBe('fallback');
  });
});

describe.concurrent('isNullLike', () => {
  test('should return true for null and undefined', () => {
    expect(isNullLike(null)).toBe(true);
    expect(isNullLike(undefined)).toBe(true);
  });

  test('should return false for non-null-like values', () => {
    expect(isNullLike(0)).toBe(false);
    expect(isNullLike('')).toBe(false);
  });
});

describe.concurrent('calcVal', () => {
  test('should return the value if not a function', () => {
    expect(calcVal(5)).toBe(5);
  });

  test('should execute and return the result if value is a function', () => {
    const valFn = () => 5;
    expect(calcVal(valFn)).toBe(5);
  });
});

describe.concurrent('safeRun', () => {
  test('should execute the function without throwing an error', () => {
    const fn = () => {
      throw new Error('test');
    };
    expect(() => safeRun(fn)).not.toThrow();
  });

  test('should return the result of the function if no errors', () => {
    const fn = () => 5;
    expect(safeRun(fn)).toBe(5);
  });
});

describe.concurrent('getErrorMsg', () => {
  test('should return the string value if val is a string', () => {
    expect(getErrorMsg('error')).toBe('error');
  });

  test('should return message property if val is an object with message', () => {
    expect(getErrorMsg({ message: 'error' })).toBe('error');
  });
});

describe.concurrent('isTwoStringSame', () => {
  test('should return true for case insensitive match', () => {
    expect(isTwoStringSame('text', 'TeXT')).toBe(true);
  });

  test('should return false for different strings', () => {
    expect(isTwoStringSame('text', 'different')).toBe(false);
  });
});

describe.concurrent('isLegalNum', () => {
  test('should return true for numbers and numeric strings', () => {
    expect(isLegalNum('123')).toBe(true);
    expect(isLegalNum(123)).toBe(true);
  });

  test('should return false for non-numeric values', () => {
    expect(isLegalNum('abc')).toBe(false);
  });
});

describe.concurrent('isUSD', () => {
  test('should return true for strings starting with USD', () => {
    expect(isUSD('USD100')).toBe(true);
  });

  test('should return false for strings not starting with USD', () => {
    expect(isUSD('100')).toBe(false);
  });
});

describe.concurrent('calcMinAndMax', () => {
  const data = [1, 2, 3];
  const result = calcMinAndMax(data, undefined, {
    margin: 0.2,
    integer: false,
  });

  test('should calculate correct min and max values without options', () => {
    expect(result.min).toBeLessThanOrEqual(1);
    expect(result.max).toBeGreaterThanOrEqual(3);
  });

  test('should respect the margin option', () => {
    const marginResult = calcMinAndMax(data, undefined, {
      margin: 0.1,
      integer: false,
    });
    expect(marginResult.min).toBeGreaterThan(result.min);
    expect(marginResult.max).toBeLessThan(result.max);
  });
});
