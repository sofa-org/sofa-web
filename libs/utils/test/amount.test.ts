import { describe, expect, test } from 'vitest';

import {
  amountFormatter,
  cvtAmountsInUsd,
  displayPercentage,
  getPrecision,
  inputNumberFormatter,
  roundWith,
} from '../amount';

describe.concurrent('inputNumberFormatter', () => {
  test('formats number correctly with given precision', () => {
    expect(inputNumberFormatter(1234.567, 2)).toBe('1234.57');
    expect(inputNumberFormatter('1234.5678', 3)).toBe('1234.568');
    expect(inputNumberFormatter(undefined, 2)).toBe('');
  });
});

describe.concurrent('getPrecision', () => {
  test('returns correct precision of a number', () => {
    expect(getPrecision(123.456)).toBe(3);
    expect(getPrecision('0.001')).toBe(3);
    expect(getPrecision('abc')).toBeUndefined();
  });
});

describe.concurrent('amountFormatter', () => {
  test('formats amounts correctly with given precision', () => {
    expect(amountFormatter(1234567.89, 2)).toBe('1,234,567.89');
    expect(amountFormatter('1234567.89123', 3)).toBe('1,234,567.891');
    expect(amountFormatter(undefined)).toBe('-');
  });
});

describe.concurrent('roundWith', () => {
  test('rounds number correctly based on tickSize and roundType', () => {
    expect(roundWith(123.4567, '0.05', '0.05', undefined, 'upper')).toBe(123.5);
    expect(roundWith('123.4567', 0.01, 0.01, undefined, 'lower')).toBe(123.45);
    expect(roundWith(undefined, 0.1)).toBeUndefined();
  });
});

describe.concurrent('displayPercentage', () => {
  test('displays percentage correctly', () => {
    expect(displayPercentage(0.1234)).toBe('12.34%');
    expect(displayPercentage(undefined)).toBe('-%');
  });
});

describe.concurrent('cvtAmountsInUsd', () => {
  test('converts amounts in USD correctly', () => {
    const amounts = { BTC: '2', ETH: '10' };
    const prices = { BTC: '50000', ETH: '4000' };
    expect(cvtAmountsInUsd(amounts, prices)).toBe(100000 + 40000);
  });
});
