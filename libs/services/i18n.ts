/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import { useCallback } from 'react';
import MD5 from 'crypto-js/md5';
import i18next, { i18n, TFunction as _TFunction } from 'i18next';

export type AI18nStringTranslation = string | object;
export type AI18nStringIdentifier = string;
export type AI18nPackage = string;

export type AI18nStringIndexNew = {
  enUS?: AI18nStringTranslation;
  zhCN?: AI18nStringTranslation;
  hint?: string;
  // 翻译的最长字母数（对于中日韩文字，汉字数=字母数/2）
  letterLengthLimit?: number;
};
export type AI18nStringIndex =
  | AI18nStringIdentifier
  | (AI18nStringIndexNew & {
      package?: AI18nPackage;
    });

export type TOptions = {
  t?: typeof i18next.t;
};

export type TFunction = (
  index: AI18nStringIndex,
  params?: Record<string, any>,
  options?: TOptions,
) => string;

export const t: TFunction = (
  index: AI18nStringIndex,
  params?: object,
  options?: TOptions,
) => {
  return (options?.t || i18next.t)(getKey(index), {
    returnObjects: true,
    defaultValue: getDefaultValue(index, i18next),
    ...params,
    ns:
      typeof index === 'string'
        ? (params as any)?.ns || undefined
        : index.package || (params as any)?.ns || undefined,
  }) as any;
};

let useTranslation_: (
  defaultNS?: string,
  options?: any,
) => [_TFunction, typeof i18next, boolean];
export function configReactI18next({
  useTranslation,
}: {
  useTranslation: typeof useTranslation_;
}) {
  useTranslation_ = useTranslation;
}
function getDefaultValue(index: AI18nStringIndex, _i18n: i18n) {
  if (typeof index === 'object') {
    // console.log(index, _i18n.language);
    return (
      (index as AI18nStringIndexNew as any)[
        _i18n.language.replace(/\W/g, '')
      ] ||
      (index as AI18nStringIndexNew).enUS ||
      (index as AI18nStringIndexNew).zhCN
    );
  }
  return undefined;
}

export function useTranslation(
  defaultNS?: string,
  options?: any,
): [typeof t, typeof i18next, boolean] {
  if (!useTranslation_) {
    throw new Error(`${configReactI18next.name} must be called during init`);
  }
  const [_t, _i18next, ready] = useTranslation_(defaultNS, options);
  const $$t = useCallback(
    (index: AI18nStringIndex, params?: object) => {
      return _t(getKey(index), {
        ns:
          typeof index === 'string' || !index.package
            ? defaultNS || undefined
            : index.package,
        returnObjects: true,
        defaultValue: getDefaultValue(index, _i18next),
        ...params,
      }) as any;
    },
    [_t, defaultNS, _i18next],
  );
  return [$$t, _i18next, ready];
}
const packageValidationRegex = /^[\w\-]+$/;
export const packageRegexInStringKey = /^\$([\w\-]+)\./;
function getKey(index: AI18nStringIndex) {
  if (typeof index === 'string') {
    // 老的全局index，enTran做key, e.g: _t('Hello')
    return index;
  }
  if (index.package && !packageValidationRegex.test(index.package)) {
    throw new Error(`found invalid package: ${index.package}`);
  }
  // 默认取 enUS 做key
  let firstTranLocale: AI18nStringTranslation = index?.enUS || '';
  if (!firstTranLocale) {
    for (const [k, v] of Object.entries(index)) {
      if (['package', 'hint', 'letterLengthLimit'].includes(k)) {
        continue;
      }
      // k should be enUS/zhCN
      firstTranLocale = v as string;
      break;
    }
  }
  const indexWithoutPackage = { ...index };
  if (indexWithoutPackage.package !== undefined) {
    delete indexWithoutPackage.package;
  }
  if (typeof firstTranLocale === 'object') {
    return `${md5Hash(indexWithoutPackage)}`;
  }
  return `${shortenStringForKey(firstTranLocale)}.${md5Hash(
    indexWithoutPackage,
  )}`;
}
function md5Hash(object: object | string | number) {
  return MD5(JSON.stringify(object)).toString();
}
function shortenStringForKey(str: string, maxLen = 20) {
  const prueLetters = str
    .replace(/\s+/g, '-')
    .replace(/[^\-\p{L}]/gu, '-')
    .replace(/-+/g, '-');
  let i = 0;
  for (let len = 0; i < prueLetters.length && len < maxLen; i++) {
    if (/\p{Script=Han}/u.test(prueLetters[i])) {
      len += 2;
    } else {
      len += 1;
    }
  }
  return prueLetters.substring(0, i).toLowerCase();
}
/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable no-useless-escape */
