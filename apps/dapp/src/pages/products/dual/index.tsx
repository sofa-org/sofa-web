import { useEffect, useMemo, useRef, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { ProductType, ProjectType, VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { DualService } from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, ProductsService } from '@sofa/services/products';
import { dualVaults } from '@sofa/services/vaults/dual';
import { displayPercentage } from '@sofa/utils/amount';
import { isNullLike } from '@sofa/utils/fns';
import { currQuery } from '@sofa/utils/history';
import { useLazyCallback } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { max, min, uniq } from 'lodash-es';

import { useForCcySelect } from '@/components/CCYSelector';
import { C_Select, CSelect } from '@/components/CSelect';
import { useIsMobileUI } from '@/components/MobileOnly';
import { useProductSelect } from '@/components/ProductSelector';
import {
  ProductTypeRefs,
  ProjectTypeRefs,
} from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { FlowDual } from '../components/FlowDual';
import InvestModal, { InvestModalPropsRef } from '../components/InvestModal';
import { useProductsState } from '../store';

import { CustomQuote } from './CustomQuote';
import locale from './locale';
import { RecommendedList } from './RecommendedList';

import styles from './index.module.scss';

addI18nResources(locale, 'ProductDual');

const ProductDual = (props: BaseProps & { onlyForm?: boolean }) => {
  const [t] = useTranslation('ProductDual');
  const [product, setProduct] = useProductSelect();
  const { chainId } = useWalletStore();
  const isMobileUI = useIsMobileUI();
  const defaultInput = useMemo(() => {
    const q = currQuery();
    return {
      price: (q['strike'] && Number(q['strike'])) || undefined,
      expiry: (q['expiry'] && Number(q['expiry'])) || undefined,
    };
  }, []);
  const vaults = useMemo(
    () =>
      ProductsService.filterVaults(dualVaults, {
        chainId,
        productType: product,
      }),
    [chainId, product],
  );
  const { recommendedList, quoteInfos } = useProductsState((state) => state);
  const forCcys = useMemo(() => {
    const _forCcys = uniq(vaults.map((v) => v.forCcy));
    return _forCcys
      .map((forCcy) => {
        const vault = vaults.find((v) => v.forCcy == forCcy)!;
        if (!vault) {
          return undefined;
        }
        const allProducts =
          recommendedList[`${vault.vault.toLowerCase()}-${vault.chainId}`];
        const allApys = allProducts
          ?.map((p) => p.apyInfo?.max)
          .filter((v) => !isNullLike(v))
          ?.map(Number);
        return {
          forCcy,
          vault,
          minApy: allApys?.length ? min(allApys) : undefined,
          maxApy: allApys?.length ? max(allApys) : undefined,
        };
      })
      .filter(Boolean) as {
      forCcy: VaultInfo['forCcy'];
      vault: VaultInfo;
      minApy?: number;
      maxApy?: number;
    }[];
  }, [vaults, product, recommendedList]);
  const [forCcy, setForCcy] = useForCcySelect({
    defaultValue: forCcys?.[0]?.forCcy || 'RCH',
    acceptance: (ccy) => !!forCcys?.find((a) => a.forCcy == ccy),
  });
  const vault = useMemo(
    () => forCcys.find((i) => i.forCcy == forCcy)?.vault,
    [forCcy, forCcys],
  );
  const [customPrice, setCustomPrice] = useState(defaultInput.price);
  const [customExpiry, setCustomExpiry] = useState(defaultInput.expiry);
  const investModalRef = useRef<InvestModalPropsRef>(null);
  const [quote, setQuote] = useState<ProductQuoteResult | undefined>(undefined);

  const data = useMemo(() => {
    if (!vault) return [];
    const list =
      recommendedList[`${vault.vault.toLowerCase()}-${vault.chainId}`];
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
          (quoteInfos[ProductsService.productKey(it)] ||
            it) as ProductQuoteResult,
      );
  }, [vault, recommendedList, quoteInfos]);
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
  const [date, setDate] = useState<(typeof dates)[0] | undefined>(undefined);
  useEffect(() => {
    if (dates.length) {
      if (!date || !dates.includes(date)) {
        if (date && dates.find((d) => d.expiry == date.expiry)) {
          setDate(dates.find((d) => d.expiry == date.expiry));
          return;
        }
        setDate(dates[0]);
      }
    }
  }, [dates, date]);
  useEffect(
    useLazyCallback(() => {
      if (!date) {
        setDate(undefined);
        return;
      }
      setCustomExpiry(undefined);
      setCustomPrice(undefined);
    }),
    [vault],
  );
  return (
    <>
      <TopTabs
        bannerClassName={styles['banner']}
        className={classNames(styles['container'], {
          [styles['mobile-ui']]: isMobileUI,
        })}
        banner={
          <>
            <FlowDual />
            <h1 className={styles['head-title']}>
              {ProjectTypeRefs[ProjectType.Dual].icon}
              {t({
                enUS: 'DualFlex: Buy Low, Sell High',
              })}
            </h1>
          </>
        }
        options={[
          {
            label: (
              <>
                <span className={styles['icon']} />
                {ProductTypeRefs[ProductType.BearSpread].dualDesc(t).op2}
              </>
            ),
            value: ProductType.BearSpread,
            className: styles['buy-low'],
          },
          {
            label: (
              <>
                <span className={styles['icon']} />
                {ProductTypeRefs[ProductType.BullSpread].dualDesc(t).op2}
              </>
            ),
            value: ProductType.BullSpread,
            className: styles['sell-high'],
          },
        ]}
        dark
        value={product}
        type={'banner-expandable'}
        onChange={(v) => setProduct(v as ProductType)}
      >
        {isMobileUI ? (
          <>
            <C_Select
              prefix={t({ enUS: 'Anchor', zhCN: '锚点' })}
              className={classNames(styles['for-ccy-select'], {
                'semi-always-dark': true,
              })}
              value={forCcy}
              optionList={forCcys.map((it) => ({
                label: (
                  <>
                    <span className={styles['ccy-item']}>
                      <img
                        src={CCYService.ccyConfigs[it.forCcy]?.icon}
                        alt=""
                      />
                      {CCYService.ccyConfigs[it.forCcy]?.name || it.forCcy}

                      <div className={styles['apy']}>
                        {it.minApy == it.maxApy ? (
                          <>{displayPercentage(it.maxApy)}</>
                        ) : (
                          <>
                            {displayPercentage(it.minApy)}～
                            {displayPercentage(it.maxApy)}
                          </>
                        )}
                      </div>
                    </span>
                  </>
                ),
                value: it.forCcy,
              }))}
              onChange={(v) => setForCcy(String(v) as typeof forCcy)}
            />

            <C_Select
              prefix={t({ enUS: 'Settlement Date', zhCN: '结算日期' })}
              className={classNames(styles['settlement-dates-select'], {
                'semi-always-dark': true,
              })}
              value={date?.expiry}
              optionList={dates.map((it) => ({
                label: (
                  <>
                    <span className={styles['date-item']}>
                      {it.text}
                      <span className={styles['diff']}>{it.diffText}</span>
                    </span>
                  </>
                ),
                value: it.expiry,
              }))}
              onChange={(v) => setDate(dates.find((d) => d.expiry == v))}
            />
          </>
        ) : undefined}
        <div className={styles['form']}>
          <div className={styles['sub-title']}>
            {t({
              enUS: '👏 Buy crypto at a discount and get bonus rewards!',
            })}
          </div>
          <div className={styles['content']}>
            {isMobileUI ? undefined : (
              <div className={styles['for-ccy-select']}>
                {forCcys.map((i) => (
                  <div
                    key={i.forCcy}
                    className={classNames(styles['ccy'], {
                      [styles['selected']]: i.forCcy == forCcy,
                    })}
                    onClick={() => setForCcy(i.forCcy)}
                  >
                    <img
                      src={CCYService.ccyConfigs[i.forCcy]?.icon}
                      className={classNames({
                        [styles['rch']]:
                          i.forCcy == CCYService.ccyConfigs['RCH']?.name,
                      })}
                    />
                    <div className={styles['ccy-infos']}>
                      <div className={styles['name']}>
                        {CCYService.ccyConfigs[i.forCcy]?.name || i.forCcy}
                      </div>
                      <div className={styles['apy']}>
                        {i.minApy == i.maxApy ? (
                          <>{displayPercentage(i.maxApy)}</>
                        ) : (
                          <>
                            {displayPercentage(i.minApy)}～
                            {displayPercentage(i.maxApy)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {vault === undefined ? undefined : (
              <RecommendedList
                data={data}
                dates={dates}
                vault={vault}
                date={date}
                setDate={setDate}
                defaultExpiry={defaultInput.expiry}
                onSelectQuote={async (q) => {
                  if (quote === q) {
                    investModalRef.current?.show();
                    return;
                  }

                  setQuote(q);
                  setTimeout(() => {
                    investModalRef.current?.show();
                  }, 100);
                }}
              />
            )}
            <div className={styles['custom-quote']}>
              {vault && (
                <CustomQuote
                  vault={vault}
                  onChangedExpiry={setCustomExpiry}
                  onChangedPrice={setCustomPrice}
                  price={customPrice}
                  expiry={customExpiry}
                  otherQuotes={data}
                  onQuote={(params) =>
                    useProductsState.quote({
                      vault,
                      anchorPrices: [
                        DualService.updatePrice({ vault }, params.price),
                      ],
                      expiry: params.expiry,
                      depositAmount: 100,
                    })
                  }
                  onClickDeposit={async (matchingQuote) => {
                    if (!customPrice) {
                      Toast.error(
                        t({
                          enUS: 'Please input Target Price',
                        }),
                      );
                      return;
                    }
                    if (!customExpiry) {
                      Toast.error(
                        t({
                          enUS: 'Please select Settlement Date',
                        }),
                      );
                      return;
                    }
                    if (!matchingQuote) {
                      matchingQuote = await useProductsState.quote({
                        vault,
                        anchorPrices: [
                          DualService.updatePrice({ vault }, customPrice),
                        ],
                        expiry: customExpiry,
                        depositAmount: 100,
                      });
                    }
                    if (matchingQuote) {
                      setQuote(matchingQuote);
                      setTimeout(() => {
                        investModalRef.current?.show();
                      }, 100);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </TopTabs>
      {quote && <InvestModal ref={investModalRef} product={quote} />}
    </>
  );
};

export default ProductDual;
