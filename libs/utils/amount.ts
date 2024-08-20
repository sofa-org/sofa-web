import Big from 'big.js';
import { toNumber } from 'lodash-es';

import { isLegalNum, isNullLike } from './fns';

export function inputNumberFormatter(
  val: number | string | undefined | null | void,
  precision: number,
) {
  if (!isLegalNum(val)) return '';
  return (+val!).toFixed(precision) + '';
}

export function getPrecision(
  amount: number | string | undefined | null | void,
) {
  if (!isLegalNum(amount)) return undefined;
  return String(toNumber(amount)).split('.')[1]?.length || 0;
}

export function getShortAddress(address: string | undefined) {
  if (!address) return '';

  const m = address.match(/^(\w{6})\w+(\w{4})$/);
  return m ? m[1] + '...' + m[2] : address;
}

/**
 * 把 8,000, 12,000,000 之类的数字format 成 8K, 12M
 * @param number 输入数字
 */
export function toAbbreviated(
  number: number | string | undefined,
  $precision = 4,
): string {
  if (number === undefined || number === '') return '';
  if (!number) return '0';
  const n = Number(number);
  if (n < 0) {
    return '-' + toAbbreviated(-number);
  }
  if (n < 1000) {
    return amountFormatter(number, $precision);
  }
  const abbreviations = [
    { n: 1000 * 1000 * 1000, a: 'B' },
    { n: 1000 * 1000, a: 'M' },
    { n: 1000, a: 'K' },
  ];
  for (const a of abbreviations) {
    if (n >= a.n) {
      const amount = amountFormatter((1.0 * n) / a.n, 1);
      return (
        (/\.0$/.test(amount)
          ? amount.substring(0, amount.length - 2)
          : amount) + a.a
      );
    }
  }
  return number + '';
}

/**
 * 千分位 & 精度
 * */
export function amountFormatter(
  amount: number | string | undefined | null | void,
  $precision = 4,
  forcePrecision = false,
) {
  if (!isLegalNum(amount)) return '-';
  const exponent = -Number(amount).toExponential().split('e')[1] || 0;
  const precision = forcePrecision
    ? $precision
    : Math.max($precision, exponent);
  const [int, decimal] = Number(amount).toFixed(18).split('.');
  const intStr = int.replace(/\B(?=(\d{3})+(\.|$))/g, ',');
  return decimal && precision
    ? `${intStr}.${decimal.slice(0, precision)}`
    : intStr;
}

export function roundWith<T extends number | string | undefined>(
  num: T,
  tickSize?: number | string,
  minSize = tickSize,
  maxSize?: number | string,
  roundType: 'default' | 'upper' | 'lower' = 'default',
): T extends number | undefined
  ? number | undefined
  : number | string | undefined {
  if (isNullLike(num) || !isLegalNum(num)) return num as number | undefined;
  if (Number(num) < Number(minSize)) {
    return Number(minSize);
  }
  if (!isNullLike(maxSize) && Number(num) > Number(maxSize)) {
    return Number(maxSize);
  }

  if (!tickSize) return num as number | undefined;

  if (!isLegalNum(tickSize)) return num as number | undefined;

  const remainder = Big(num).mod(tickSize);
  if (remainder.toNumber() === 0) return Number(num);
  const half = Big(tickSize).div(2);
  if (roundType === 'upper' || (roundType !== 'lower' && remainder.gte(half))) {
    return Big(num).minus(remainder).plus(tickSize).toNumber();
  }
  return Big(num).minus(remainder).toNumber();
}

export function displayPercentage(val?: string | number, precision = 2) {
  if (!isLegalNum(val)) return '-%';
  if (+val > 100) return '>10000%';
  const v = +val * 100;
  if (v > 1) return `${v.toFixed(precision)}%`;
  const exponent = -Number(v).toExponential().split('e')[1] || 0;
  return `${v.toFixed(Math.max(precision, exponent))}%`;
}

export function cvtAmountsInUsd(
  $amounts:
    | PartialRecord<string, string | number>
    | [string, string | number | undefined][],
  prices: PartialRecord<string, string | number>,
) {
  const amounts =
    $amounts instanceof Array ? $amounts : Object.entries($amounts);
  return amounts.reduce((pre, [ccy, amount]) => {
    const price = ccy.startsWith('USD') ? 1 : prices[ccy];
    if (!price) return pre;
    return pre + (Number(amount) * Number(price) || 0);
  }, 0);
}

export function cvtAmountsInCcy(
  amounts:
    | PartialRecord<string, string | number>
    | [string, string | number | undefined][],
  prices: PartialRecord<string, string | number>,
  ccy: string,
) {
  const inUsd = cvtAmountsInUsd(amounts, prices);
  return inUsd / Number(prices[ccy]);
}

export function displayWithFlag(val?: string | number) {
  if (!isLegalNum(val)) return '-';
  const v = +val;
  return v === 0 ? '0' : v > 0 ? `+${v}` : `-${v}`;
}
