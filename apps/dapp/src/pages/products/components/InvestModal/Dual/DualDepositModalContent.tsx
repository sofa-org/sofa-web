import { Dispatch, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Spin } from '@douyinfe/semi-ui';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService, ProductType } from '@sofa/services/contracts';
import { DualService } from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteParams,
  ProductQuoteResult,
  ProductsService,
} from '@sofa/services/products';
import {
  amountFormatter,
  displayPercentage,
  roundWith,
} from '@sofa/utils/amount';
import { next8h } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { useAsyncMemo, useLazyCallback } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import { formatHighlightedText } from '@sofa/utils/string';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { omit } from 'lodash-es';
import { nanoid } from 'nanoid';

import AmountInput from '@/components/AmountInput';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useIsMobileUI } from '@/components/MobileOnly';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { useGlobalState } from '@/store';

import { useProductsState } from '../../../store';
import InvestButton from '../../InvestButton';
import { ProfitsRender } from '../../ProfitsRender';
import locale from '../locale';
import { ModalWrapper } from '../ModalWrapper';

import styles from './DualDepositModalContent.module.scss';

addI18nResources(locale, 'InvestModal');

export interface InvestModalPropsRef {
  hide(): void;
  show(): void;
}

export interface InvestModalProps {
  product: ProductQuoteResult;
}

export const DualDepositModalContent = (
  props: InvestModalProps & { setVisible: Dispatch<boolean> },
) => {
  const wallet = useWalletStore();

  const [t] = useTranslation('InvestModal');

  const prices = useIndexPrices((state) => state.prices);
  const currentForCcyPriceInDomCcy = useMemo(
    () =>
      (prices[props.product.vault.forCcy] &&
        prices[props.product.vault.domCcy] &&
        prices[props.product.vault.forCcy]! /
          prices[props.product.vault.domCcy]!) ||
      undefined,
    [prices[props.product.vault.forCcy], prices[props.product.vault.domCcy]],
  );

  const dualConfig = useProductsState(
    (s) =>
      s.dualConfig[
        `${props.product.vault.vault.toLowerCase()}-${props.product.vault.chainId}`
      ],
  );
  const $vault = useMemo(
    () =>
      ProductsService.findVault(ContractsService.vaults, {
        chainId: props.product.vault.chainId,
        vault: props.product.vault.vault,
      }),
    [props.product.vault.chainId, props.product.vault.vault],
  );

  const [vaultAddress, $setVaultAddress] = useState<string>();
  const vault = useMemo(
    () =>
      ProductsService.findVault(ContractsService.vaults, {
        ...omit($vault, [
          'abis',
          'vault',
          'riskType',
          'usePermit2',
          'balanceDecimal',
        ]),
        ...(!vaultAddress
          ? { riskType: $vault?.riskType }
          : { vault: vaultAddress }),
      }),
    [$vault, vaultAddress],
  );

  const product = useProductsState(
    (state) =>
      vault &&
      (state.cart[
        `${vault.vault.toLowerCase()}-${vault.chainId}`
      ]?.[0] as PartialRequired<ProductQuoteParams, 'id' | 'vault'>),
  );

  const expiries = useAsyncMemo(
    async () =>
      (vault &&
        ProductsService.genExpiries(vault).then((res) => {
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
        })) ||
      undefined,
    [vault],
  );

  const preDataRef = useRef<ProductQuoteResult>();
  const data = useProductsState((state) => {
    const val =
      product && state.quoteInfos[ProductsService.productKey(product)];
    preDataRef.current = val || preDataRef.current;
    return preDataRef.current || props.product;
  });
  const loading = product && useProductsState.isQuoting(product);
  useEffect(() => {
    if (product) {
      useProductsState.quote(product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ProductsService.productKey(product), wallet.address]);

  const productTypeRef = vault ? ProductTypeRefs[vault.productType] : undefined;
  const diffPrice = useMemo(() => {
    if (!product) {
      return undefined;
    }
    const currentPrice = DualService.getPrice({
      ...(product as ProductQuoteParams),
      minStepSize: dualConfig?.minStepSize,
    });
    if (
      currentPrice === undefined ||
      !product?.vault.forCcy ||
      currentForCcyPriceInDomCcy === undefined
    ) {
      return undefined;
    }
    return Number(currentPrice) - currentForCcyPriceInDomCcy;
  }, [
    product?.anchorPrices?.[0],
    product?.vault.forCcy,
    currentForCcyPriceInDomCcy,
    productTypeRef,
  ]);
  const maxPrice = useMemo(() => {
    // 买的时候，不能超过目前价格
    if (!vault || !productTypeRef) {
      return undefined;
    }
    const res =
      productTypeRef.dualIsBuy &&
      currentForCcyPriceInDomCcy !== undefined &&
      dualConfig
        ? roundWith(
            currentForCcyPriceInDomCcy,
            dualConfig.minStepSize,
            undefined,
            undefined,
            'lower',
          )
        : undefined;
    return res;
  }, [productTypeRef, vault, currentForCcyPriceInDomCcy, dualConfig]);
  const minPrice = useMemo(() => {
    // 卖的时候，不能低于目前价格
    if (!vault || !productTypeRef) {
      return undefined;
    }
    const res =
      !productTypeRef.dualIsBuy &&
      currentForCcyPriceInDomCcy !== undefined &&
      dualConfig
        ? roundWith(
            currentForCcyPriceInDomCcy,
            dualConfig.minStepSize,
            undefined,
            undefined,
            'upper',
          )
        : undefined;
    return res;
  }, [productTypeRef, vault, currentForCcyPriceInDomCcy, dualConfig]);
  const diffPercentage = useMemo(() => {
    const p = DualService.getPrice({
      ...(product as ProductQuoteParams),
      minStepSize: dualConfig?.minStepSize,
    });
    return currentForCcyPriceInDomCcy === undefined || p === undefined
      ? undefined
      : (p - currentForCcyPriceInDomCcy) / currentForCcyPriceInDomCcy;
  }, [
    currentForCcyPriceInDomCcy,
    product?.anchorPrices?.[0],
    dualConfig?.minStepSize,
  ]);
  const isMobileUI = useIsMobileUI();
  if (!vault || !productTypeRef) {
    return undefined;
  }
  return (
    <>
      <ModalWrapper
        setVisible={props.setVisible}
        product={data}
        className={classNames(styles['form'], {
          [styles['mobile-ui']]: isMobileUI,
          [styles['quoting']]: loading,
        })}
      >
        <div className={styles['content']}>
          <div className={styles['left']}>
            <div className={styles['left-form']}>
              {/* forCcy 图标 */}
              <div className={styles['for-ccy']}>
                <img src={CCYService.ccyConfigs[vault.forCcy]?.icon} />
                {CCYService.ccyConfigs[vault.forCcy]?.name || vault.forCcy}
              </div>
              {/* depositCcy 数量 */}
              <div className={classNames(styles['field'], styles['amount'])}>
                <span className={styles['label']}>
                  {ProductTypeRefs[vault.productType].dualDesc(t).helpMeOp}
                </span>
                <span className={styles['value']}>
                  <AmountInput
                    className={styles['amount-input']}
                    min={vault?.depositMinAmount}
                    max={
                      Number(wallet.balance?.[data.vault.depositCcy]) >
                      Number(vault?.depositMinAmount)
                        ? wallet.balance![data.vault.depositCcy]
                        : undefined
                    }
                    type="internal_max"
                    tick={vault?.depositTickAmount}
                    value={product?.depositAmount}
                    suffix={
                      <span className={styles['unit-1']}>
                        {vault?.depositCcy}
                      </span>
                    }
                    onChange={(v) => {
                      return (
                        product &&
                        useProductsState.updateCart({
                          ...product,
                          depositAmount: v,
                        })
                      );
                    }}
                    onBlur={() => product && useProductsState.quote(product)}
                  />
                </span>
                <div className={styles['balance']}>
                  <span className={styles['label']}>{t('wallet.balance')}</span>
                  <span className={styles['value']}>
                    {amountFormatter(wallet.balance?.[data.vault.depositCcy])}
                    <span className={styles['unit']}>
                      {data.vault.depositCcy}
                    </span>
                  </span>
                </div>
              </div>
              {/* 价格 */}

              <div className={classNames(styles['field'], styles['price'])}>
                <span className={styles['label']}>
                  {t(
                    {
                      enUS: 'Target Price ({{forCcy}} / {{domCcy}})',
                      zhCN: '目标价格 ({{forCcy}} / {{domCcy}})',
                    },
                    {
                      forCcy: product?.vault.forCcy,
                      domCcy: product?.vault.domCcy,
                    },
                  )}
                </span>
                <span className={styles['value']}>
                  <AmountInput
                    className={styles['amount-input']}
                    max={maxPrice}
                    min={minPrice}
                    tick={dualConfig?.minStepSize}
                    roundingMethodForTick={
                      productTypeRef.dualIsBuy ? 'lower' : 'upper'
                    }
                    value={DualService.getPrice({
                      ...(product as ProductQuoteParams),
                      minStepSize: dualConfig?.minStepSize,
                    })}
                    suffix={
                      <span className={styles['unit-2']}>
                        {formatHighlightedText(
                          t(
                            {
                              enUS: '(Current price: [[{{currentPrice}}]] {{change}}{{changePercentage}})',
                              zhCN: '(当前价格: [[{{currentPrice}}]] {{change}}{{changePercentage}})',
                            },
                            {
                              changePercentage: displayPercentage(
                                diffPercentage === undefined
                                  ? undefined
                                  : Math.abs(diffPercentage),
                                0,
                              ),
                              change: !diffPrice
                                ? ''
                                : diffPrice > 0
                                  ? '▲'
                                  : '▼',
                              currentPrice:
                                product && currentForCcyPriceInDomCcy
                                  ? amountFormatter(
                                      currentForCcyPriceInDomCcy,
                                      DualService.getPricePrecision({
                                        ...product,
                                        minStepSize: dualConfig?.minStepSize,
                                      }),
                                    )
                                  : '-',
                            },
                          ),
                          {
                            hightlightedClassName: classNames(styles['amount']),
                          },
                        )}
                      </span>
                    }
                    onChange={(v) => {
                      return (
                        product &&
                        !isNullLike(v) &&
                        useProductsState.updateCart({
                          ...product,
                          anchorPrices: [DualService.updatePrice(product, v)],
                        })
                      );
                    }}
                    onBlur={() => product && useProductsState.quote(product)}
                  />
                </span>
              </div>
              {/* 到期日 */}

              <div className={classNames(styles['field'], styles['expiry'])}>
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
                    value={
                      product?.expiry === undefined
                        ? undefined
                        : product.expiry * 1000
                    }
                    onChange={(v) => {
                      const t = v instanceof Date ? v.getTime() : Number(v);
                      const curr8h = next8h(t);
                      return (
                        product &&
                        useProductsState.updateCart({
                          ...product,
                          expiry: v === undefined ? undefined : curr8h / 1000,
                        })
                      );
                    }}
                    onBlur={() => product && useProductsState.quote(product)}
                  />
                  {!!product?.expiry && (
                    <span className={styles['term']}>
                      {Math.abs(dayjs().diff(product?.expiry * 1000, 'day'))}d
                    </span>
                  )}
                </span>

                {product?.expiry ? (
                  <div className={styles['expire-date']}>
                    {dayjs(
                      DualService.getSettlementTime({
                        expiry: product?.expiry,
                      }),
                    )
                      .utc()
                      .format('YYYY-MM-DD　HH:mm')}{' '}
                    [UTC]
                  </div>
                ) : undefined}
              </div>
              <div className={styles['line']} />
              <div className={styles['reward']}>
                <span className={styles['label']}>
                  {t({
                    enUS: 'APR(Deposit Reward + RCH Airdrop)',
                    zhCN: '年利率 (存入收益+RCH空投)',
                  })}
                </span>
                <span className={styles['value']}>
                  {displayPercentage(
                    simplePlus(data?.apyInfo?.max, data?.apyInfo?.rch),
                  )}
                </span>
              </div>
            </div>
          </div>
          <div
            className={styles['vertical-line']}
            style={{
              display: isMobileUI ? 'none' : undefined,
            }}
          />
          <div className={styles['right']}>
            {/* 数据展示 */}
            <ProfitsRender data={data} />
            <Spin size="large" wrapperClassName={styles['loading-spin']} />
          </div>
        </div>
        <div className={styles['left-button']}>
          <InvestButton
            vault={data.vault.vault.toLowerCase()}
            chainId={data.vault.chainId}
            afterInvest={() => props.setVisible(false)}
          />
        </div>
      </ModalWrapper>
    </>
  );
};
