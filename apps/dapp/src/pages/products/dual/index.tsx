import { useMemo, useState } from 'react';
import { DatePicker, Table } from '@douyinfe/semi-ui';
import { ProductType, ProjectType, VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsService } from '@sofa/services/products';
import { dualVaults } from '@sofa/services/vaults/dual';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { next8h } from '@sofa/utils/expiry';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import { formatHighlightedText } from '@sofa/utils/string';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { uniq } from 'lodash-es';

import AmountInput from '@/components/AmountInput';
import AsyncButton from '@/components/AsyncButton';
import { useForCcySelect } from '@/components/CCYSelector';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useProductSelect } from '@/components/ProductSelector';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { CustomQuote } from './CustomQuote';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ProductDual');

const ProductDual = (props: BaseProps & { onlyForm?: boolean }) => {
  const [t] = useTranslation('ProductDual');
  const [product, setProduct] = useProductSelect();
  const { chainId } = useWalletStore();
  const vaults = useMemo(
    () =>
      ProductsService.filterVaults(dualVaults, {
        chainId,
        productType: product,
      }),
    [chainId],
  );
  const forCcys = useMemo(() => {
    const _forCcys = uniq(vaults.map((v) => v.forCcy));
    return _forCcys.map((forCcy) => {
      // TODO: 接入api
      const rand = Math.random();
      const vault = vaults.find((v) => v.forCcy == forCcy)!;
      return {
        forCcy,
        vault,
        minApy: rand,
        maxApy: rand * 2 + 0.2,
      };
    });
  }, [vaults]);
  const dates = useMemo(() => {
    // TODO: 接入api
    return [1, 3, 7, 14].map((d) => {
      const time = dayjs(Date.now() + d * 86400 * 1000);
      return {
        time: time.toDate().getTime(),
        text: dayjs(time).format('YYYY-MM-DD'),
        diff: d + 'D',
        diffDays: d,
      };
    });
  }, []);
  const [forCcy, setForCcy] = useForCcySelect({
    defaultValue: forCcys?.[0]?.forCcy || 'RCH',
    acceptance: (ccy) => !!forCcys?.find((a) => a.forCcy == ccy),
  });
  const forCcyConfig = useMemo(() => CCYService.ccyConfigs[forCcy], [forCcy]);
  const vault = useMemo(
    () => forCcys.find((i) => i.forCcy == forCcy)?.vault,
    [forCcy, forCcys],
  );
  const domCcyConfig = useMemo(
    () => (vault && CCYService.ccyConfigs[vault.domCcy]) || undefined,
    [vault],
  );
  const [date, setDate] = useState(dates[0]);
  const prices = useIndexPrices((state) => state.prices);
  const quotes = useMemo(() => {
    const currentPrice = prices[forCcy];
    if (currentPrice === undefined) return [];
    // TODO: 接入api
    return [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15].map((d) => {
      const targetPrice = (currentPrice / 100.0) * (100.0 - d);
      return {
        currentPrice,
        targetPrice,
        diff: (targetPrice - currentPrice) / currentPrice,
        apy: (500.0 + date.diffDays * 100 - d * 20) / 100.0,
      };
    });
  }, [forCcy, prices[forCcy], date]);
  return (
    <>
      <TopTabs
        bannerClassName={styles['banner']}
        className={styles['container']}
        banner={
          <>
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
            label: t({ enUS: 'Buy Low' }),
            value: ProductType.BullSpread,
            className: styles['buy-low'],
          },
          {
            label: t({ enUS: 'Sell High' }),
            value: ProductType.BearSpread,
            className: styles['sell-high'],
          },
        ]}
        dark
        value={product}
        type={'banner-expandable'}
        onChange={(v) => setProduct(v as ProductType)}
        extraTopContent={<div className={styles['title']}>{t('My RCH')}</div>}
      >
        <div className={styles['form']}>
          <div className={styles['sub-title']}>
            {t({
              enUS: '👏 Buy crypto at a discount and get bonus rewards!',
            })}
          </div>
          <div className={styles['content']}>
            <div className={styles['for-ccy-select']}>
              {forCcys.map((i) => (
                <div
                  key={i.forCcy}
                  className={classNames(styles['ccy'], {
                    [styles['selected']]: i.forCcy == forCcy,
                  })}
                  onClick={() => setForCcy(i.forCcy)}
                >
                  <img src={CCYService.ccyConfigs[i.forCcy]?.icon} />
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
              ))}
            </div>
            <div className={styles['settlement-dates']}>
              {dates.map((d) => (
                <div
                  key={d.time}
                  className={classNames(styles['date'], {
                    [styles['selected']]: d.time == date.time,
                  })}
                  onClick={() => setDate(d)}
                >
                  {d.text}
                  <span className={styles['diff']}>{d.diff}</span>
                </div>
              ))}
            </div>
            <div className={styles['current-price']}>
              <img src={forCcyConfig?.icon} />
              {formatHighlightedText(
                t(
                  {
                    enUS: '{{currency}} Current Price: [[${{price}}]]',
                  },
                  {
                    currency: forCcyConfig?.name || forCcy,
                    price: amountFormatter(
                      prices[forCcy],
                      domCcyConfig?.precision,
                    ),
                  },
                ),
                {
                  hightlightedClassName: styles['amount'],
                },
              )}
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
                        forCcy: vault?.forCcy,
                        domCcy: vault?.domCcy,
                      },
                    ),
                    render: (_, row) => (
                      <>
                        <span className={styles['target-price']}>
                          {amountFormatter(
                            row.targetPrice,
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
                                  Math.abs(row.diff),
                                ),
                              },
                            ),
                            {
                              hightlightedClassName: classNames(
                                styles['amount'],
                                row.diff > 0
                                  ? styles['increased']
                                  : row.diff == 0
                                    ? styles['unchanged']
                                    : styles['decreased'],
                              ),
                            },
                          )}
                        </span>
                      </>
                    ),
                  },
                  {
                    title: (
                      <span className={styles['reward-column']}>
                        {t({
                          enUS: 'Extra Reward (APY)',
                        })}
                      </span>
                    ),
                    render: (_, row) => displayPercentage(row.apy),
                  },
                  {
                    title: t({
                      enUS: 'Operate',
                    }),
                    render: (_, row) => (
                      <AsyncButton className={styles['deposit-btn']}>
                        {t({ enUS: 'Deposit' })}
                      </AsyncButton>
                    ),
                  },
                ]}
                pagination={false}
              />
            </div>
            <div className={styles['custom-quote']}>
              {vault && (
                <CustomQuote
                  vault={vault}
                  onChangedDate={() => {}}
                  onChangedPrice={() => {}}
                />
              )}
            </div>
          </div>
        </div>
      </TopTabs>
    </>
  );
};

export default ProductDual;
