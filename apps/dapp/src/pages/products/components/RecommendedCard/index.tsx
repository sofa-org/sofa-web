import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@douyinfe/semi-ui';
import { ProjectType } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { DualService } from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import {
  isDualQuoteParams,
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

import Payoff, { PayoffProps } from '@/components/Payoff';
import DualPayoff from '@/components/Payoff/Dual/Payoff';
import {
  useProductSelect,
  useProjectChange,
} from '@/components/ProductSelector';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { useProductsState } from '../../store';
import InvestModal, { InvestModalPropsRef } from '../InvestModal';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RecommendedCard');

export interface RecommendedCardProps {
  forCcy: VaultInfo['forCcy'];
  depositCcy?: VaultInfo['depositCcy'];
}

export const RecommendedCardItem = (props: {
  it: ProductQuoteResult;
  active?: boolean;
  onClick?(): void;
  hideTerm?: boolean;
  extraPayoffProps?: {
    displayRchYield?: boolean;
    showYAxis?: boolean;
  };
  noHover?: boolean;
  className?: string;
}) => {
  const [t] = useTranslation('RecommendedCard');

  const { it, active, onClick } = props;

  const precision = useMemo(
    () => (it.vault?.depositCcy.startsWith('USD') ? 2 : 4),
    [it.vault?.depositCcy],
  );

  const positionAmount = useLazyCallback((product: ProductQuoteResult) => {
    if (!it.vault) return 0;
    const totalCollateral = Big(product.quote.totalCollateral || 0).div(
      it.vault.collateralDecimal,
    );
    if (it.vault.riskType === RiskType.RISKY) return +totalCollateral;
    return +Big(product.quote.collateralAtRisk || 0).div(
      it.vault.collateralDecimal,
    );
  });

  const earnPayoffProps = useMemo(() => {
    if (![RiskType.LEVERAGE, RiskType.PROTECTED].includes(it.vault.riskType)) {
      return undefined;
    }
    const res: Partial<PayoffProps> = {
      ...it.vault,
      positionAmount: positionAmount(it),
      refMs: next8h(it.timestamp * 1000),
      expMs: it.expiry * 1000,
      depositAmount: +it.amounts.own,
      rchYield: Number(it.apyInfo?.rch),
      anchorPrices: it.anchorPrices,
      protectedYield: Number(it.apyInfo?.min),
      enhancedYield: simplePlus(it.apyInfo?.max, -(it.apyInfo?.min || 0)),
      depositBaseCcyConfig: undefined,
    };

    if (
      !it.vault.depositBaseCcy ||
      !it.convertedCalculatedInfoByDepositBaseCcy
    ) {
      return {
        ...res,
      } as PayoffProps;
    }
    return {
      ...res,
      depositCcy: it.vault.depositBaseCcy,

      depositAmount: +it.convertedCalculatedInfoByDepositBaseCcy.amounts.own,
      rchYield: Number(it.convertedCalculatedInfoByDepositBaseCcy.apyInfo?.rch),
      protectedYield: Number(
        it.convertedCalculatedInfoByDepositBaseCcy.apyInfo?.min,
      ),
      enhancedYield: simplePlus(
        it.convertedCalculatedInfoByDepositBaseCcy.apyInfo?.max,
        -(it.convertedCalculatedInfoByDepositBaseCcy.apyInfo?.min || 0),
      ),

      depositBaseCcyConfig: {
        depositBaseCcy: it.vault.depositBaseCcy,
        depositCcy: it.vault.depositCcy,
        maxApy: simplePlus(it.apyInfo?.rch, it.apyInfo?.max),
      },
    } as PayoffProps;
  }, [
    it.vault.riskType,
    it.vault.depositBaseCcy,
    it.convertedCalculatedInfoByDepositBaseCcy,
  ]);

  return (
    <div
      className={classNames(
        styles['product'],
        {
          [styles['active']]: active,
          [styles['no-hover']]: props.noHover,
          [styles['risky']]: it.vault.riskType === RiskType.RISKY,
          risky: it.vault.riskType === RiskType.RISKY,
        },
        props.className,
      )}
      onClick={onClick}
    >
      {it.vault.riskType === RiskType.DUAL ? (
        <DualPayoff
          domCcy={it.vault.domCcy}
          riskType={it.vault.riskType}
          productType={it.vault.productType}
          forCcy={it.vault.forCcy}
          depositCcy={it.vault.depositCcy}
          depositAmount={+it.amounts.own}
          positionAmount={positionAmount(it)}
          refMs={next8h(it.timestamp * 1000)}
          expMs={it.expiry * 1000}
          rchYield={Number(it.apyInfo?.rch)}
          anchorPrices={[
            amountFormatter(
              DualService.getPrice(it),
              DualService.getPricePrecision(it),
            ),
          ]}
          protectedYield={Number(it.apyInfo?.min)}
          enhancedYield={simplePlus(it.apyInfo?.max, -(it.apyInfo?.min || 0))}
          {...props.extraPayoffProps}
        />
      ) : it.vault.riskType !== RiskType.RISKY ? (
        <Payoff {...earnPayoffProps!} {...props.extraPayoffProps} />
      ) : (
        <div className={styles['infos']}>
          <div className={styles['info-item']}>
            🎯 {it.anchorPrices.map((i) => amountFormatter(i, 0)).join(' - ')}
          </div>
          <div className={styles['info-item']}>
            {/* {t('win')}
            <span className={styles['value']}>
              {amountFormatter(positionAmount(it), precision)}
            </span>
            <span className={styles['unit']}>{it.vault.depositCcy}</span> */}
            <span className={styles['value']}>
              {amountFormatter(
                simplePlus(it.oddsInfo?.max, it.oddsInfo?.rch),
                2,
              )}
              x
            </span>
            <span className={styles['unit']}>
              {t({ enUS: 'Payout', zhCN: '赔率' })}
            </span>
          </div>
        </div>
      )}
      {!props.hideTerm && (
        <div className={styles['tag']}>
          {displayTenor(dayjs(it.expiry * 1000).diff(next8h(), 'day'), t)}
        </div>
      )}
    </div>
  );
};

export async function handleRecommendCardClick(
  investModalRef: RefObject<InvestModalPropsRef>,
  it: ProductQuoteResult,
  navigate: ReturnType<typeof useNavigate>,
) {
  const { vault } = it;
  const { riskType } = it.vault;
  if (
    riskType === RiskType.DUAL ||
    (riskType !== RiskType.RISKY && window.innerHeight < window.innerWidth)
  ) {
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
        const emptyId = currProducts?.find(
          ($it) =>
            !isDualQuoteParams($it) &&
            !$it.anchorPrices?.every(Boolean) &&
            !$it.expiry,
        )?.id;
        useProductsState.updateCart({
          id: emptyId || nanoid(),
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
        project:
          vault.riskType === RiskType.RISKY
            ? ProjectType.Surge
            : vault.riskType == RiskType.DUAL
              ? ProjectType.Dual
              : ProjectType.Earn,
        'risk-type': it.vault.riskType || '',
        'product-type': it.vault.productType || '',
        'for-ccy': it.vault.forCcy,
        'deposit-ccy': it.vault.depositCcy,
        // 2 extra params for dual
        ...(vault.riskType === RiskType.DUAL
          ? {
              expiry: it.expiry,
              strike: DualService.getPrice(it),
            }
          : undefined),
        expanded: 1,
      }),
    });
  }
}

const RecommendedCard = (props: RecommendedCardProps) => {
  const navigate = useNavigate();
  const [t] = useTranslation('RecommendedCard');
  const wallet = useWalletStore();
  const [project] = useProjectChange();
  const riskType =
    project === ProjectType.Surge ? RiskType.RISKY : RiskType.PROTECTED;
  const [productType] = useProductSelect();
  const vault = useMemo(
    () =>
      ProductsService.findVault(ContractsService.vaults, {
        chainId: wallet.chainId,
        riskType,
        productType,
        depositCcy: props.depositCcy ?? 'USDT',
        forCcy: props.forCcy,
      }),
    [productType, props.depositCcy, props.forCcy, riskType, wallet.chainId],
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
        4000,
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
    if (
      !leverageVault ||
      (['forCcy', 'depositCcy', 'productType', 'riskType'] as const).some(
        (k) => vault[k] != leverageVault[k],
      )
    ) {
      return undefined;
    }
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
              <RecommendedCardItem
                key={`${it.vault.vault.toLowerCase()}-${it.vault.vault.toLowerCase()}-${
                  it.expiry
                }-${it.anchorPrices.join('-')}-${it.vault.riskType}-${i}`}
                it={it}
                active={it === product}
                onClick={() => {
                  setProduct(it);
                  handleRecommendCardClick(investModalRef, it, navigate);
                }}
              />
            ))}
          </div>
        </Skeleton>
        {product && <InvestModal ref={investModalRef} product={product} />}
      </div>
    </div>
  );
};

export default RecommendedCard;
