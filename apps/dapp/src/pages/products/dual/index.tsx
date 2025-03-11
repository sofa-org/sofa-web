import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductType, ProjectType, VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, ProductsService } from '@sofa/services/products';
import { dualVaults } from '@sofa/services/vaults/dual';
import { displayPercentage } from '@sofa/utils/amount';
import { currQuery } from '@sofa/utils/history';
import classNames from 'classnames';
import { uniq } from 'lodash-es';

import { useForCcySelect } from '@/components/CCYSelector';
import { useIsMobileUI } from '@/components/MobileOnly';
import { useProductSelect } from '@/components/ProductSelector';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import InvestModal, { InvestModalPropsRef } from '../components/InvestModal';

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
  useEffect(() => {
    if (quote) {
      // TODO: mobile ui
      investModalRef.current?.show();
    }
  }, [quote]);
  return (
    <>
      <TopTabs
        bannerClassName={styles['banner']}
        className={classNames(styles['container'], {
          [styles['mobile']]: isMobileUI,
        })}
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
            {vault === undefined ? undefined : (
              <RecommendedList
                vault={vault}
                defaultExpiry={defaultInput.expiry}
                onSelectQuote={async (q) => {
                  if (quote === q) {
                    investModalRef.current?.show();
                    return;
                  }

                  setQuote(q);
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
                  onClickDeposit={async () => {
                    // TODO: quote
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
