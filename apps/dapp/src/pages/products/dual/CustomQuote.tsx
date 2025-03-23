import { useEffect, useMemo, useRef, useState } from 'react';
import { DatePicker, Toast } from '@douyinfe/semi-ui';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { DualService } from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, ProductsService } from '@sofa/services/products';
import { displayPercentage, roundWith } from '@sofa/utils/amount';
import { next8h } from '@sofa/utils/expiry';
import { getErrorMsg, isNullLike } from '@sofa/utils/fns';
import { currQuery } from '@sofa/utils/history';
import { useAsyncMemo, useLazyCallback } from '@sofa/utils/hooks';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AmountInput from '@/components/AmountInput';
import AsyncButton from '@/components/AsyncButton';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useIsMobileUI } from '@/components/MobileOnly';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './CustomQuote.module.scss';
addI18nResources(locale, 'ProductDual');

export const CustomQuote = (props: {
  vault: VaultInfo;
  expiry?: number;
  price?: number;
  otherQuotes: ProductQuoteResult[];
  onChangedExpiry: (v?: number) => void;
  onChangedPrice: (v?: number) => void;
  onClickDeposit: (matchingQuote?: ProductQuoteResult) => Promise<void>;
  onQuote: (params: {
    expiry: number;
    price: number;
  }) => Promise<ProductQuoteResult | undefined>;
}) => {
  const [t] = useTranslation('ProductDual');
  const [quote, setQuote] = useState<ProductQuoteResult | undefined>(undefined);
  const [lazyPrice, setLazyPrice] = useState<number | undefined>(undefined);
  const lazyTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const quoteNew = useLazyCallback(async () => {
    if (lazyPrice != props.price || !props.price || !props.expiry) {
      return;
    }

    const res = await props.onQuote({
      price: props.price,
      expiry: props.expiry,
    });
    setQuote(res);
  });
  const matchingQuote = useMemo(() => {
    if (!props.expiry || !props.price) {
      return undefined;
    }
    if (
      quote?.expiry == props.expiry &&
      props.price == DualService.getPrice(quote)
    ) {
      return quote;
    }
    return props.otherQuotes.find(
      (q) =>
        q?.expiry == props.expiry && props.price == DualService.getPrice(q),
    );
  }, [props.expiry, props.price, quote, props.otherQuotes]);
  const expiries = useAsyncMemo(
    async () =>
      ProductsService.genExpiries(props.vault).then((res) => {
        if (!res.length) {
          return undefined;
        }
        return res.reduce(
          (acc, value) => ({
            ...acc,
            min: acc.min ? Math.min(acc.min, value) : value,
            max: acc.min ? Math.max(acc.max, value) : value,
          }),
          {
            max: 0,
            min: 0,
          },
        );
      }),
    [props.vault],
  );
  const prices = useIndexPrices((state) => state.prices);
  const productTypeRef = ProductTypeRefs[props.vault.productType];
  const maxPrice = useMemo(() => {
    // 买的时候，不能超过目前价格
    const res =
      productTypeRef.dualIsBuy && prices[props.vault.forCcy] !== undefined
        ? roundWith(
            Number(prices[props.vault.forCcy]),
            CCYService.getPriceInputTick(props.vault.forCcy),
            undefined,
            undefined,
            'upper',
          )
        : undefined;
    return res;
  }, [productTypeRef, props.vault, prices[props.vault?.forCcy || '']]);
  const minPrice = useMemo(() => {
    // 卖的时候，不能低于目前价格
    const res =
      !productTypeRef.dualIsBuy && prices[props.vault.forCcy] !== undefined
        ? roundWith(
            Number(prices[props.vault.forCcy]),
            CCYService.getPriceInputTick(props.vault.forCcy),
            undefined,
            undefined,
            'lower',
          )
        : undefined;
    return res;
  }, [productTypeRef, props.vault, prices[props.vault?.forCcy || '']]);

  const isMobileUI = useIsMobileUI();
  return (
    <div
      className={classNames(styles['content'], {
        [styles['mobile-ui']]: isMobileUI,
      })}
    >
      <span className={styles['caption']}>
        {t({
          enUS: 'Customize',
        })}
      </span>
      <div className={classNames(styles['field'], styles['settlement-date'])}>
        <span className={styles['label']}>
          {t({
            enUS: 'Settlement Date',
            zhCN: '结算日期',
          })}
        </span>
        <span className={styles['value']}>
          <DatePicker
            className={styles['date-picker']}
            dropdownClassName={styles['date-picker-dropdown']}
            type="date"
            disabledDate={(d) => {
              if (!d || !expiries) return true;
              const curr8h = next8h(d.getTime());
              return curr8h < expiries.min || curr8h > expiries.max;
            }}
            presetPosition="top"
            value={props.expiry === undefined ? undefined : props.expiry * 1000}
            onChange={(v) => {
              const t = v instanceof Date ? v.getTime() : Number(v);
              const curr8h = next8h(t);
              props.onChangedExpiry(
                v === undefined ? undefined : curr8h / 1000,
              );
            }}
          />
          {!!props.expiry && (
            <span className={styles['term']}>
              {Math.abs(dayjs().diff(props.expiry * 1000, 'day'))}d
            </span>
          )}
        </span>
      </div>
      <div className={classNames(styles['field'], styles['target-price'])}>
        <span className={styles['label']}>
          {t({
            enUS: 'Target Price',
          })}
        </span>
        <span className={styles['value']}>
          <AmountInput
            className={styles['amount-input']}
            value={props.price}
            // max={maxPrice}
            // min={minPrice}
            onChange={(v) => {
              props.onChangedPrice(
                v === undefined || v === '' ? undefined : Number(v),
              );
              setLazyPrice(isNullLike(v) ? undefined : Number(v));
              if (lazyTimeoutRef.current) {
                clearTimeout(lazyTimeoutRef.current);
              }
              lazyTimeoutRef.current = setTimeout(() => {
                quoteNew().catch((e) => Toast.error(getErrorMsg(e)));
              }, 800);
            }}
            onBlur={(e) => {
              const val = (e.target as HTMLInputElement)?.value;
              if (!val) props.onChangedPrice(undefined);
            }}
            suffix={
              <span className={styles['unit-in-input']}>
                {CCYService.ccyConfigs[props.vault.domCcy]?.name ||
                  props.vault.domCcy}
              </span>
            }
          />
        </span>
      </div>
      <div className={classNames(styles['field'], styles['extra-reward'])}>
        <span className={styles['label']}>
          {t({
            enUS: 'extra reward',
          })}
        </span>
        <span
          className={classNames(
            styles['value'],
            matchingQuote?.apyInfo?.max
              ? styles['has-reward']
              : styles['no-reward'],
          )}
        >
          {matchingQuote?.apyInfo?.max
            ? displayPercentage(matchingQuote?.apyInfo?.max)
            : '-'}
        </span>
      </div>
      <AsyncButton
        className={classNames(
          styles['deposit-btn'],
          !props.price || !props.expiry ? styles['no-click'] : styles['click'],
        )}
        onClick={() => props.onClickDeposit(matchingQuote)}
        disabled={!props.price || !props.expiry}
      >
        {t({ enUS: 'Deposit' })}
      </AsyncButton>
    </div>
  );
};
