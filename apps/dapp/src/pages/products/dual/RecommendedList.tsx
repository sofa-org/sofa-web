import { useEffect, useMemo, useRef, useState } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { DualService } from '@sofa/services/dual';
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
import { useIsMobileUI } from '@/components/MobileOnly';

import { useProductsState } from '../store';

import styles from './RecommendedList.module.scss';
type DateInfo = {
  expiry: number;
  time: number;
  text: string;
  diffText: string;
  diffDays: number;
};
export const RecommendedList = (props: {
  vault: VaultInfo;
  defaultExpiry?: number;
  onSelectQuote: (q: ProductQuoteResult) => Promise<void>;
  dates: DateInfo[];
  date?: DateInfo;
  data: ProductQuoteResult[];
  setDate: (d: DateInfo) => void;
}) => {
  const [t] = useTranslation('ProductDual');
  const { data, dates, date, setDate } = props;
  const isMobileUI = useIsMobileUI();
  const dualConfig = useProductsState(
    (s) =>
      s.dualConfig[`${props.vault.vault.toLowerCase()}-${props.vault.chainId}`],
  );
  const domCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.vault.domCcy],
    [props.vault],
  );
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
  }, [date, data]);
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
        {isMobileUI ? undefined : (
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
        )}
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
                  true,
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
          onRow={(record, index) => {
            return {
              onClick: (event) => {
                if (!isMobileUI || !record) {
                  event.stopPropagation();
                  return;
                }
                props.onSelectQuote(record);
              },
            };
          }}
          columns={(
            [
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
                  const p = DualService.getPrice(row);
                  const diffPercentage =
                    current === undefined || p === undefined
                      ? undefined
                      : (p - current) / current;
                  return (
                    <>
                      <span className={styles['target-price']}>
                        {amountFormatter(
                          p,
                          DualService.getPricePrecision({
                            vault: props.vault,
                            minStepSize: dualConfig?.minStepSize,
                          }),
                          true,
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
                                diffPercentage === undefined
                                  ? undefined
                                  : Math.abs(diffPercentage),
                              ),
                            },
                          ),
                          {
                            hightlightedClassName: classNames(
                              styles['amount'],
                              diffPercentage === undefined ||
                                diffPercentage === 0
                                ? 'unchanged'
                                : diffPercentage > 0
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
              isMobileUI
                ? undefined!
                : {
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
            ] as ColumnProps<ProductQuoteResult>[]
          ).filter(Boolean)}
          pagination={false}
        />
      </div>
    </>
  );
};
