import { useMemo, useState } from 'react';
import { DatePicker } from '@douyinfe/semi-ui';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsService } from '@sofa/services/products';
import { displayPercentage } from '@sofa/utils/amount';
import { next8h } from '@sofa/utils/expiry';
import { currQuery } from '@sofa/utils/history';
import { useAsyncMemo } from '@sofa/utils/hooks';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AmountInput from '@/components/AmountInput';
import AsyncButton from '@/components/AsyncButton';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './CustomQuote.module.scss';
addI18nResources(locale, 'ProductDual');

export const CustomQuote = (props: {
  vault: VaultInfo;
  expiry?: number;
  price?: number;
  onChangedExpiry: (v?: number) => void;
  onChangedPrice: (v?: number) => void;
  onClickDeposit: () => Promise<void>;
  apy?: number;
}) => {
  const [t] = useTranslation('ProductDual');

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

  return (
    <>
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
            onChange={(v) =>
              props.onChangedPrice(
                v === undefined || v === '' ? undefined : Number(v),
              )
            }
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
        <span className={styles['value']}>{displayPercentage(props.apy)}</span>
      </div>
      <AsyncButton
        className={styles['deposit-btn']}
        onClick={() => props.onClickDeposit()}
      >
        {t({ enUS: 'Deposit' })}
      </AsyncButton>
    </>
  );
};
