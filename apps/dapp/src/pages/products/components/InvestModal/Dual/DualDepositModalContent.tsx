import {
  Dispatch,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Modal, Spin } from '@douyinfe/semi-ui';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteParamsDual,
  ProductQuoteResult,
  ProductsService,
  ProductType,
  RiskType,
} from '@sofa/services/products';
import {
  amountFormatter,
  displayPercentage,
  roundWith,
} from '@sofa/utils/amount';
import { displayExpiry, next8h } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { currQuery } from '@sofa/utils/history';
import { useLazyCallback } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import { formatHighlightedText } from '@sofa/utils/string';
import { displayTenor } from '@sofa/utils/time';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { omit } from 'lodash-es';
import { nanoid } from 'nanoid';
import { stringify } from 'qs';

import AmountInput from '@/components/AmountInput';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { PayoffChart } from '@/components/Payoff';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { useGlobalState } from '@/store';

import { useProductsState } from '../../../store';
import { Calculation } from '../../Calculation';
import { CheckboxBorrow } from '../../CheckboxBorrow';
import InvestButton from '../../InvestButton';
import { ProfitsRender } from '../../ProfitsRender';
import { QuoteExplain } from '../../QuoteExplain';
import locale from '../locale';
import { ModalWrapper } from '../ModalWrapper';

import { Comp as IconEdit } from './assets/icon-edit.svg';

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
  const navigate = useNavigate();

  const [t] = useTranslation('InvestModal');

  const prices = useIndexPrices((state) => state.prices);

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
      ]?.[0] as PartialRequired<ProductQuoteParamsDual, 'id' | 'vault'>),
  );

  const dateRange = useMemo(() => {
    // TODO: 接入api
    return {
      min: Date.now() + 86400 * 1000,
      max: Date.now() + 20 * 86400 * 1000,
    };
  }, []);
  const setVaultAddress = useLazyCallback((v?: string) => {
    if (!$vault) return;
    const nextVault = ProductsService.findVault(ContractsService.vaults, {
      ...omit($vault, [
        'abis',
        'vault',
        'riskType',
        'usePermit2',
        'balanceDecimal',
      ]),
      ...(!v ? { riskType: $vault?.riskType } : { vault: v }),
    })!;
    const protectedApy = (() => {
      const interestRate =
        useGlobalState.getState().interestRate[nextVault.chainId]?.[
          nextVault.depositCcy
        ]?.apyUsed;
      return isNullLike(interestRate)
        ? 0.01
        : (Math.floor(interestRate * 100) - 3) / 100;
    })();
    useProductsState.updateCart({
      id: nanoid(),
      ...product,
      vault: nextVault,
      protectedApy,
    });
    $setVaultAddress(v);
  });

  const preDataRef = useRef<ProductQuoteResult>();
  const data = useProductsState((state) => {
    const val =
      product && state.quoteInfos[ProductsService.productKey(product)];
    const value = val || preDataRef.current || props.product;
    preDataRef.current = val;
    return value;
  });
  const loading = product && useProductsState.isQuoting(product);
  useEffect(() => {
    if (product) {
      useProductsState.quote(product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ProductsService.productKey(product), wallet.address]);

  const diffPrice = useMemo(() => {
    // TODO
    const currentPrice = product?.strike;
    if (currentPrice === undefined) {
      return undefined;
    }
    return (Math.random() * 0.2 - 0.1) * Number(currentPrice);
  }, [product?.strike]);
  return (
    <>
      <ModalWrapper setVisible={props.setVisible} product={data}>
        <div className={styles['left']}>
          {/* depositCcy 数量 */}
          <div className={classNames(styles['field'], styles['amount'])}>
            <span className={styles['label']}>
              {t({
                enUS: 'Help Me Buy',
              })}
            </span>
            <span className={styles['value']}>
              <AmountInput
                className={styles['amount-input']}
                min={vault?.depositMinAmount}
                tick={vault?.depositTickAmount}
                value={product?.depositAmount}
                suffix={
                  <span className={styles['unit-1']}>{vault?.depositCcy}</span>
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
                <span className={styles['unit']}>{data.vault.depositCcy}</span>
              </span>
            </div>
          </div>
          {/* 价格 */}

          <div className={classNames(styles['field'], styles['price'])}>
            <span className={styles['label']}>
              {t(
                {
                  enUS: 'with price({{forCcy}} / {{domCcy}})',
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
                // TODO:
                // min={vault?.depositMinAmount}
                // tick={vault?.depositTickAmount}
                value={product?.strike}
                suffix={
                  <span className={styles['unit-1']}>
                    {formatHighlightedText(
                      t(
                        {
                          enUS: '(Current price: [[{{currentPrice}})]]',
                        },
                        {
                          currentPrice: amountFormatter(
                            vault?.forCcy === undefined
                              ? undefined
                              : prices[vault?.forCcy],
                            CCYService.ccyConfigs[vault?.domCcy || '']
                              ?.precision,
                          ),
                        },
                      ),
                      {
                        hightlightedClassName: classNames(
                          styles['amount'],
                          diffPrice === undefined || diffPrice === 0
                            ? 'unchanged'
                            : diffPrice > 0
                              ? styles['increased']
                              : styles['decreased'],
                        ),
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
                      anchorPrices: [Number(v)],
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
                <span className={styles['unit']}>{data.vault.depositCcy}</span>
              </span>
            </div>
          </div>
          {/* 到期日 */}

          <div className={classNames(styles['field'], styles['expiry'])}>
            <span className={styles['label']}>
              {t({
                enUS: 'Settlement Date',
              })}
            </span>
            <span className={styles['value']}>
              <DatePicker
                className={styles['date-picker']}
                dropdownClassName={styles['date-picker-dropdown']}
                type="date"
                disabledDate={(d) => {
                  if (!d) return true;
                  const curr8h = next8h(d.getTime());
                  return curr8h < dateRange.min || curr8h > dateRange.max;
                }}
                presetPosition="top"
                value={
                  product?.expiry === undefined
                    ? undefined
                    : product.expiry * 1000
                }
                onChange={(v) => {
                  return (
                    product &&
                    useProductsState.updateCart({
                      ...product,
                      expiry: v === undefined ? undefined : Number(v) / 1000,
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
                <span className={styles['unit']}>{data.vault.depositCcy}</span>
              </span>
            </div>
          </div>
          <div className={classNames(styles['field'], styles['reward'])}>
            <span className={styles['label']}>
              {t({
                enUS: 'Yield (Deposit Reward + RCH Airdorp)',
              })}
            </span>
            <span className={styles['value']}>
              {displayPercentage(
                simplePlus(data?.apyInfo?.max, data?.apyInfo?.rch),
              )}
            </span>
          </div>

          <InvestButton
            vault={data.vault.vault.toLowerCase()}
            chainId={data.vault.chainId}
            afterInvest={() => props.setVisible(false)}
          />
        </div>
        <div className={styles['right']}>
          {/* 数据展示 */}
          TODO: right
        </div>
      </ModalWrapper>
    </>
  );
};
