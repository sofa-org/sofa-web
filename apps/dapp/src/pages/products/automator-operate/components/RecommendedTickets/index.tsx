import { useEffect, useMemo, useRef } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { VaultInfo } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteParams,
  ProductQuoteResult,
  ProductsService,
} from '@sofa/services/products';
import { amountFormatter } from '@sofa/utils/amount';
import { MsIntervals, next8h } from '@sofa/utils/expiry';
import { arrPad, arrToDict, simplePlus } from '@sofa/utils/object';
import { displayTenor } from '@sofa/utils/time';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

import { Time } from '@/components/TimezoneSelector';

import { useProductsState } from '../../../automator-store';
import { TicketTypeOptions } from '../../../components/TicketTypeSelector';

import styles from './index.module.scss';

export interface TicketsProps extends BaseProps {
  vault: VaultInfo;
}

const RecommendedTickets = (props: TicketsProps) => {
  const [t] = useTranslation('RecommendedTickets');
  const ticketMeta = useMemo(
    () => TicketTypeOptions.find((it) => it.value === props.vault.depositCcy)!,
    [props.vault.depositCcy],
  );
  const products = useProductsState((state) =>
    arrToDict(
      state.cart[`${props.vault.vault.toLowerCase()}-${props.vault.chainId}`],
      (it) =>
        ProductsService.productKey({ ...it, depositAmount: ticketMeta.per }),
    ),
  );
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
      .map((it) => state.quoteInfos[ProductsService.productKey(it)] || it);
  });
  const loading = useMemo(() => !data.length, [data]);
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

  const recommends = useMemo(() => {
    const empty: ProductQuoteResult = {
      rfqId: '',
      vault: props.vault,
      anchorPrices: [],
      expiry: 0,
      timestamp: 0,
      observationStart: 0,
      amounts: {} as never,
      quote: {} as never,
      feeRate: {} as never,
      leverageInfo: {} as never,
      relevantDollarPrices: [] as never,
      pricesForCalculation: {} as never,
    };
    const index = (v: (typeof data)[0]) =>
      +v.amounts.maxRedeemable /
      ((v.expiry * 1000 - next8h()) / MsIntervals.day);
    const sorted = data.sort((a, b) => index(b) - index(a));
    return arrPad(sorted, 6, empty, 'end');
  }, [data, props.vault]);

  return (
    <Spin
      wrapperClassName={classNames(styles['tickets'], props.className)}
      style={props.style}
      spinning={loading}
    >
      {recommends.slice(0, 6).map((it, index) => {
        const id = it.expiry ? ProductsService.productKey(it) : index;
        const product = products[id] as
          | PartialRequired<ProductQuoteParams, 'vault' | 'id'>
          | undefined;
        const background = index < 2 ? `rgba(80, 209, 19, 0.8)` : '#A8E889';
        return (
          <div
            className={classNames(styles['ticket'], {
              [styles['ticket-placeholder']]: !it.expiry,
            })}
            style={{ background }}
            onClick={() => {
              if (!it.expiry) return;
              const p =
                product ||
                (() => {
                  const currProducts =
                    useProductsState.getState().cart[
                      `${props.vault.vault.toLowerCase()}-${
                        props.vault.chainId
                      }`
                    ];
                  const $id = currProducts?.find(
                    (it) => !it.anchorPrices?.every(Boolean) && !it.expiry,
                  )?.id;
                  const obj = {
                    id: $id || nanoid(),
                    vault: props.vault,
                    expiry: it.expiry,
                    anchorPrices: it.anchorPrices,
                    depositAmount: ticketMeta.per,
                  };
                  return obj;
                })();
              if (!product) useProductsState.updateCart(p);
              useProductsState.updateHoverTicket(props.vault, p.id);
            }}
            key={index}
          >
            <div className={styles['expiry']}>
              <span className={styles['tenor']}>
                {displayTenor(
                  dayjs(it.expiry * 1000).diff(Date.now(), 'day'),
                  t,
                )}
              </span>
              <span className={styles['date']}>
                <Time time={it.expiry * 1000} format="YYYY-MM-DD HH:mm" />
              </span>
            </div>
            <div className={styles['profit']}>
              {!it.amounts.maxRedeemable ? (
                '-'
              ) : (
                <>
                  <span className={styles['prefix']}>{t('Win')}</span>
                  <span className={styles['amount']}>
                    {amountFormatter(
                      +it.amounts.maxRedeemable / +it.amounts.own,
                      2,
                    )}
                    x
                  </span>
                  {/* <span className={styles['unit']}>{it.vault.depositCcy}</span> */}
                </>
              )}
            </div>
            <span className={styles['anchor-prices']}>
              {it.anchorPrices
                .map((it) => amountFormatter(it, 0))
                .join(' - ') || '- -'}
            </span>
          </div>
        );
      })}
    </Spin>
  );
};

export default RecommendedTickets;
