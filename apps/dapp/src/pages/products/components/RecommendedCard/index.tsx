import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@douyinfe/semi-ui';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteResult,
  ProductsService,
  RiskType,
  VaultInfo,
} from '@sofa/services/products';
import { amountFormatter } from '@sofa/utils/amount';
import { MsIntervals, next8h } from '@sofa/utils/expiry';
import { useAsyncMemo, useLazyCallback } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import { displayTenor } from '@sofa/utils/time';
import Big from 'big.js';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { parse, stringify } from 'qs';

import Payoff from '@/components/Payoff';
import {
  useProductSelect,
  useProjectChange,
} from '@/components/ProductSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { useGlobalState } from '@/store';

import { useProductsState } from '../../store';
import InvestModal, { InvestModalPropsRef } from '../InvestModal';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RecommendedCard');

export interface RecommendedCardProps {
  forCcy: VaultInfo['forCcy'];
  depositCcy?: VaultInfo['depositCcy'];
}

const RecommendedCard = (props: RecommendedCardProps) => {
  const navigate = useNavigate();
  const [t] = useTranslation('RecommendedCard');
  const wallet = useWalletStore();
  const [project] = useProjectChange();
  const riskType =
    project === RiskType.RISKY ? RiskType.RISKY : RiskType.PROTECTED;
  const [productType] = useProductSelect();
  const vault = useGlobalState((state) =>
    ProductsService.findVault(state.vaults, {
      chainId: wallet.chainId,
      riskType,
      productType,
      depositCcy: props.depositCcy ?? 'USDT',
      forCcy: props.forCcy,
    }),
  );

  const data = useProductsState((state) => {
    if (!vault) return [];
    const list =
      state.recommendedList[`${vault.vault.toLowerCase()}-${vault.chainId}`];
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
    if (vault && (loading || !timerRef.current)) {
      useProductsState.updateRecommendedList(vault);
    }
    if (vault && loading) {
      timerRef.current = setInterval(
        () => useProductsState.updateRecommendedList(vault),
        3000,
      );
      return () => clearInterval(timerRef.current);
    }
    if (vault) {
      timerRef.current = setInterval(
        () => useProductsState.updateRecommendedList(vault),
        MsIntervals.min * 0.5,
      );
      return () => clearInterval(timerRef.current);
    }
  }, [vault, loading]);
  const [product, setProduct] = useState<ProductQuoteResult>();

  const positionAmount = useLazyCallback((product: ProductQuoteResult) => {
    if (!vault) return 0;
    const totalCollateral = Big(product.quote.totalCollateral || 0).div(
      vault.collateralDecimal,
    );
    if (riskType === RiskType.RISKY) return +totalCollateral;
    return +Big(product.quote.collateralAtRisk || 0).div(
      vault.collateralDecimal,
    );
  });

  // const ticketMeta = useMemo(
  //   () => TicketTypeOptions.find((it) => it.value === vault?.depositCcy),
  //   [vault?.depositCcy],
  // );

  const precision = useMemo(
    () => (vault?.depositCcy.startsWith('USD') ? 2 : 4),
    [vault?.depositCcy],
  );

  const investModalRef = useRef<InvestModalPropsRef>(null);

  const leverageQuote = useAsyncMemo(async () => {
    if (vault?.riskType !== RiskType.PROTECTED || !data?.[0]) return undefined;
    const leverageVault = ProductsService.findVault(ContractsService.vaults, {
      chainId: vault.chainId,
      forCcy: vault.forCcy,
      domCcy: vault.domCcy,
      depositCcy: vault.depositCcy,
      productType: vault.productType,
      riskType: RiskType.LEVERAGE,
    });
    if (!leverageVault) return undefined;
    return useProductsState.quote({
      vault: leverageVault,
      expiry: data?.[0].expiry,
      anchorPrices: data[0].anchorPrices,
      depositAmount: data[0].amounts.own,
    });
  }, [vault, data?.[0]]);

  return (
    <div className={styles['recommended-card-wrapper']}>
      <div
        className={classNames(
          styles['recommended-card'],
          props.forCcy.toLowerCase(),
        )}
      >
        <div className={styles['blur-decoration']} />
        <h3 className={styles['currency']}>
          <span>{props.forCcy}</span>
          <span>{t('Reference')}</span>
        </h3>
        <div />
        {/* <div className={styles['risk-type']}>
          {riskTypeRef.icon}
          {riskTypeRef.label2(t)}
        </div> */}
        {/* {riskType !== RiskType.RISKY ? (
          <div className={styles['amount-wrapper']}>
            <div>
              <span className={styles['amount']}>
                {t('Deposit')} {vault?.depositCcy}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles['amount-wrapper']}>
            <div>
              <span className={styles['amount']}>{ticketMeta?.per}</span>
              <span className={styles['unit']}>{vault?.depositCcy}</span>
            </div>
            <span className={styles['desc']}>{t('Per Ticket')}</span>
          </div>
        )} */}
        <Skeleton
          className={styles['products']}
          placeholder={
            <>
              <Skeleton.Image
                className={classNames(styles['skeleton-card'], {
                  [styles['risky']]: riskType === RiskType.RISKY,
                })}
              />
              <Skeleton.Image
                className={classNames(styles['skeleton-card'], {
                  [styles['risky']]: riskType === RiskType.RISKY,
                })}
              />
            </>
          }
          loading={!data?.length}
        >
          <div className={styles['products']}>
            {(riskType === RiskType.RISKY
              ? data?.slice(0, 2)
              : ([data?.[0], leverageQuote, data?.[1]]
                  .filter(Boolean)
                  .slice(0, 2) as ProductQuoteResult[])
            )?.map((it, i) => (
              <div
                key={`${it.vault.vault.toLowerCase()}-${it.vault.vault}-${
                  it.expiry
                }-${it.anchorPrices.join('-')}-${it.vault.riskType}-${i}`}
                className={classNames(styles['product'], {
                  [styles['active']]: it === product,
                  [styles['risky']]: riskType === RiskType.RISKY,
                })}
                onClick={async () => {
                  if (
                    riskType !== RiskType.RISKY &&
                    window.innerHeight < window.innerWidth
                  ) {
                    setProduct(it);
                    setTimeout(() => investModalRef.current?.show());
                  } else {
                    if (riskType === RiskType.RISKY) {
                      const currProducts =
                        vault &&
                        useProductsState.getState().cart[
                          `${vault.vault.toLowerCase()}-${vault.chainId}`
                        ];
                      const product = currProducts?.find(
                        ($it) =>
                          ProductsService.productKey({
                            ...$it,
                            depositAmount: it.amounts.own,
                          }) == ProductsService.productKey(it),
                      );
                      if (!product) {
                        const id = currProducts?.find(
                          (it) =>
                            !it.anchorPrices?.every(Boolean) && !it.expiry,
                        )?.id;
                        useProductsState.updateCart({
                          id: id || nanoid(),
                          ...it,
                        });
                      }
                    } else {
                      const params = {
                        id: nanoid(),
                        ...it,
                        protectedApy: it.apyInfo && Number(it.apyInfo.min),
                        fundingApy: it.apyInfo && Number(it.apyInfo.interest),
                        depositAmount: it.amounts.own,
                      };
                      useProductsState.updateCart(params);
                      useProductsState.quote(params);
                    }

                    navigate({
                      pathname: '/products/customize',
                      search: stringify({
                        ...parse(window.location.search, {
                          ignoreQueryPrefix: true,
                        }),
                        project: it.vault.riskType || '',
                        'product-type': it.vault.productType || '',
                        'for-ccy': it.vault.forCcy,
                        'deposit-ccy': it.vault.depositCcy,
                        expanded: 1,
                      }),
                    });
                  }
                }}
              >
                {riskType !== RiskType.RISKY ? (
                  <Payoff
                    riskType={it.vault.riskType}
                    productType={it.vault.productType}
                    forCcy={props.forCcy}
                    depositCcy={it.vault.depositCcy}
                    depositAmount={+it.amounts.own}
                    positionAmount={positionAmount(it)}
                    refMs={next8h(it.timestamp * 1000)}
                    expMs={it.expiry * 1000}
                    rchYield={Number(it.apyInfo?.rch)}
                    anchorPrices={it.anchorPrices}
                    protectedYield={Number(it.apyInfo?.min)}
                    enhancedYield={simplePlus(
                      it.apyInfo?.max,
                      -(it.apyInfo?.min || 0),
                    )}
                  />
                ) : (
                  <div className={styles['infos']}>
                    <div className={styles['info-item']}>
                      🎯{' '}
                      {it.anchorPrices
                        .map((i) => amountFormatter(i, 0))
                        .join(' - ')}
                    </div>
                    <div className={styles['info-item']}>
                      {t('win')}
                      <span className={styles['value']}>
                        {amountFormatter(positionAmount(it), precision)}
                      </span>
                      <span className={styles['unit']}>
                        {it.vault.depositCcy}
                      </span>
                    </div>
                  </div>
                )}
                <div className={styles['tag']}>
                  {displayTenor(
                    dayjs(it.expiry * 1000).diff(next8h(), 'day'),
                    t,
                  )}
                </div>
              </div>
            ))}
          </div>
        </Skeleton>
        {product && <InvestModal ref={investModalRef} product={product} />}
      </div>
    </div>
  );
};

export default RecommendedCard;
