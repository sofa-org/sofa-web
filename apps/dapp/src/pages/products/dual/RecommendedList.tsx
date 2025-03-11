import { useEffect, useMemo, useRef, useState } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, ProductsService } from '@sofa/services/products';
import {
  amountFormatter,
  displayPercentage,
  getPrecision,
} from '@sofa/utils/amount';
import { MsIntervals } from '@sofa/utils/expiry';
import { simplePlus } from '@sofa/utils/object';
import { formatHighlightedText } from '@sofa/utils/string';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AsyncButton from '@/components/AsyncButton';
import { useIndexPrices } from '@/components/IndexPrices/store';

import { useProductsState } from '../store';

import styles from './RecommendedList.module.scss';
export const RecommendedList = (props: {
  vault: VaultInfo;
  defaultExpiry?: number;
  onSelectQuote: (q: ProductQuoteResult) => Promise<void>;
}) => {
  const [t] = useTranslation('ProductDual');

  const data = useProductsState((state) => {
    const list =
      state.recommendedList[
        `${props.vault.vault.toLowerCase()}-${props.vault.chainId}`
      ];
    if (!list) return [];
    return list
      .filter((it) => Date.now() < it.expiry * 1000)
      .sort((a, b) => {
        const index = (it: typeof a) =>
          simplePlus(it.apyInfo?.max, it.apyInfo?.rch)!;
        return index(b) - index(a);
      })
      .map(
        (it) =>
          (state.quoteInfos[ProductsService.productKey(it)] ||
            it) as ProductQuoteResult,
      );
  });
  const dates = useMemo(() => {
    const expiries = data.reduce(
      (prev, v) => {
        if (!prev[v.expiry]) {
          const time = dayjs(v.expiry * 1000);
          const diffDays = time.diff(Date.now(), 'day');
          prev[v.expiry] = {
            expiry: v.expiry,
            time: time.toDate().getTime(),
            text: time.format('YYYY-MM-DD'),
            diffText: diffDays + 'D',
            diffDays,
          };
        }
        return prev;
      },
      {} as Record<
        number,
        {
          expiry: number;
          time: number;
          text: string;
          diffText: string;
          diffDays: number;
        }
      >,
    );
    return Object.values(expiries);
  }, [data]);
  const domCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.vault.domCcy],
    [props.vault],
  );
  const [date, setDate] = useState<(typeof dates)[0] | undefined>(undefined);
  useEffect(() => {
    if (date === undefined && dates.length) {
      let d: (typeof dates)[0] | undefined = undefined;
      if (props.defaultExpiry) {
        d = dates.find((it) => it.expiry == props.defaultExpiry);
      }
      if (!d) {
        d = dates[0];
      }
      setDate(d);
    }
  }, [dates, date]);
  // const ticketMeta = useMemo(
  //   () => ({
  //     ccy: props.vault.depositCcy,
  //     value: props.vault.depositCcy,
  //     per: props.vault.depositMinAmount,
  //     precision: getPrecision(props.vault.depositMinAmount),
  //   }),
  //   [props.vault],
  // );

  const quotes = useMemo(() => {
    return data.filter((it) => it.expiry == date?.expiry);
  }, [date]);
  const loading = useMemo(() => !quotes.length, [quotes]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timerRef = useRef<any>();
  useEffect(() => {
    if (loading || !timerRef.current) {
      useProductsState.updateRecommendedList(props.vault);
    }
    if (loading) {
      timerRef.current = setInterval(
        () => useProductsState.updateRecommendedList(props.vault),
        3000,
      );
      return () => clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(
      () => useProductsState.updateRecommendedList(props.vault),
      MsIntervals.min * 0.5,
    );
    return () => clearInterval(timerRef.current);
  }, [loading, props.vault]);
  const forCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.vault.forCcy],
    [props.vault.forCcy],
  );
  const prices = useIndexPrices((state) => state.prices);
  return (
    <>
      <div className={styles['current-infos']}>
        <div className={styles['settlement-dates']}>
          {dates.map((d) => (
            <div
              key={d.time}
              className={classNames(styles['date'], {
                [styles['selected']]: d.time == date?.time,
              })}
              onClick={() => setDate(d)}
            >
              {d.text}
              <span className={styles['diff']}>{d.diffText}</span>
            </div>
          ))}
        </div>
        <div
          className={classNames(
            styles['current-price'],
            styles[props.vault.forCcy.toLowerCase()],
          )}
        >
          <img
            src={forCcyConfig?.icon}
            className={classNames({
              [styles['rch']]: forCcyConfig?.name == 'RCH',
            })}
          />
          {formatHighlightedText(
            t(
              {
                enUS: '{{currency}} Current Price: [[${{price}}]]',
              },
              {
                currency: forCcyConfig?.name || props.vault.forCcy,
                price: amountFormatter(
                  prices[props.vault.forCcy],
                  domCcyConfig?.precision,
                ),
              },
            ),
            {
              hightlightedClassName: styles['amount'],
            },
          )}
        </div>
      </div>
      <div className={styles['quotes-table']}>
        <Table
          dataSource={quotes}
          columns={[
            {
              title: t(
                {
                  enUS: 'Target Price ({{forCcy}}/{{domCcy}})',
                },
                {
                  forCcy: props.vault?.forCcy,
                  domCcy: props.vault?.domCcy,
                },
              ),
              render: (_, row) => {
                const current = prices[props.vault.forCcy];
                const diff =
                  current === undefined || row.anchorPrices?.[0] === undefined
                    ? undefined
                    : Number(row.anchorPrices[0]) - current;
                return (
                  <>
                    <span className={styles['target-price']}>
                      {amountFormatter(
                        row.anchorPrices?.[0],
                        domCcyConfig?.precision,
                      )}
                    </span>
                    <span className={styles['change-to-current-price']}>
                      {formatHighlightedText(
                        t(
                          {
                            enUS: '(Current price: [[{{changePercentage}}]])',
                          },
                          {
                            changePercentage: displayPercentage(
                              diff === undefined ? undefined : Math.abs(diff),
                            ),
                          },
                        ),
                        {
                          hightlightedClassName: classNames(
                            styles['amount'],
                            diff === undefined || diff === 0
                              ? 'unchanged'
                              : diff > 0
                                ? styles['increased']
                                : styles['decreased'],
                          ),
                        },
                      )}
                    </span>
                  </>
                );
              },
            },
            {
              title: (
                <span className={styles['reward-column']}>
                  {t({
                    enUS: 'Extra Reward (APY)',
                  })}
                </span>
              ),
              render: (_, row) => (
                <div className={styles['reward']}>
                  {displayPercentage(
                    simplePlus(row.apyInfo?.max, row.apyInfo?.rch),
                  )}
                </div>
              ),
            },
            {
              title: (
                <div className={styles['operate']}>
                  {t({
                    enUS: 'Operate',
                  })}
                </div>
              ),
              render: (_, row) => (
                <AsyncButton
                  className={styles['deposit-btn']}
                  onClick={() => props.onSelectQuote(row)}
                >
                  {t({ enUS: 'Deposit' })}
                </AsyncButton>
              ),
            },
          ]}
          pagination={false}
        />
      </div>
    </>
  );
};
