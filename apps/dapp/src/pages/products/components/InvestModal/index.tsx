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
import { Modal, Spin } from '@douyinfe/semi-ui';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteResult,
  ProductsService,
  ProductType,
  RiskType,
} from '@sofa/services/products';
import { amountFormatter, roundWith } from '@sofa/utils/amount';
import { displayExpiry } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { currQuery } from '@sofa/utils/history';
import { useLazyCallback } from '@sofa/utils/hooks';
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

import { useProductsState } from '../../store';
import { Calculation } from '../Calculation';
import { CheckboxBorrow } from '../CheckboxBorrow';
import InvestButton from '../InvestButton';
import ProductDesc from '../ProductDesc';
import { ProfitsRender } from '../ProfitsRender';
import { QuoteExplain } from '../QuoteExplain';

import { Comp as IconArrow } from './assets/icon-arrow.svg';
import { Comp as IconEdit } from './assets/icon-edit.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'InvestModal');

export interface InvestModalPropsRef {
  hide(): void;
  show(): void;
}

export interface InvestModalProps {
  product: ProductQuoteResult;
}

const El = (props: InvestModalProps & { setVisible: Dispatch<boolean> }) => {
  const wallet = useWalletStore();
  const navigate = useNavigate();

  const [t] = useTranslation('InvestModal');

  const [expanded, setExpanded] = useState(false);

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
      vault && state.cart[`${vault.vault.toLowerCase()}-${vault.chainId}`]?.[0],
  );

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
      if ($vault.riskType === RiskType.PROTECTED) return product?.protectedApy;
      if (nextVault.riskType === RiskType.LEVERAGE) return undefined;
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

  return (
    <>
      <div className={styles['form']}>
        <div className={styles['left']}>
          <Spin wrapperClassName={styles['chart']} spinning={loading}>
            <div className={styles['item']}>
              <div className={styles['label']}>{t('date.settlement')}</div>
              <div className={styles['value']}>
                <Time time={data.expiry * 1000} format="YYYY-MM-DD HH:mm" />
                <span className={styles['term']}>
                  {displayTenor(
                    dayjs(data.expiry * 1000).diff(Date.now(), 'day'),
                    t,
                  )}
                </span>
              </div>
            </div>
            <PayoffChart
              className={styles['payoff-chart']}
              depositCcy={data.vault.depositCcy}
              productType={data.vault.productType}
              anchorPrices={data.anchorPrices}
              protectedYield={Number(data.apyInfo?.min)}
              enhancedYield={
                (Number(data.apyInfo?.max) || 0) -
                (Number(data.apyInfo?.min) || 0)
              }
              rchYield={Number(data.apyInfo?.rch)}
              showYAxis
              showK1K2={data.vault.productType !== ProductType.DNT}
              displayRchYield
              atm={prices?.[data.vault.forCcy]}
            />
            <span className={styles['index-price']}>
              {t('Price Now')}: ${amountFormatter(prices[data.vault.forCcy], 2)}
            </span>
            <span
              className={styles['link-to-customize']}
              onClick={() => {
                props.setVisible(false);
                navigate({
                  pathname: '/products/customize',
                  search: stringify({
                    ...currQuery(),
                    'risk-type': data.vault.riskType || '',
                    'product-type': data.vault.productType || '',
                    'for-ccy': data.vault.forCcy || '',
                    'deposit-ccy': data.vault.depositCcy || '',
                    expanded: 1,
                  }),
                });
              }}
            >
              <IconEdit />
              {t('CUSTOMIZE')}
            </span>
          </Spin>
          <QuoteExplain
            riskType={data.vault.riskType}
            productType={data.vault.productType}
          />
        </div>
        <div className={styles['right']}>
          <div className={styles['label']}>{t('Deposit Amount')}</div>
          <AmountInput
            max={
              Number(wallet.balance?.[data.vault.depositCcy]) >
              Number(vault?.depositMinAmount)
                ? wallet.balance![data.vault.depositCcy]
                : undefined
            }
            min={vault?.depositMinAmount}
            tick={vault?.depositTickAmount}
            value={product?.depositAmount}
            suffix={
              <span className={styles['unit-1']}>{vault?.depositCcy}</span>
            }
            onChange={(v) => {
              return (
                product &&
                useProductsState.updateCart({ ...product, depositAmount: v })
              );
            }}
            onBlur={() => product && useProductsState.quote(product)}
          />
          <div className={styles['balance']}>
            <span className={styles['label']}>{t('wallet.balance')}</span>
            <span className={styles['value']}>
              {amountFormatter(wallet.balance?.[data.vault.depositCcy])}
              <span className={styles['unit']}>{data.vault.depositCcy}</span>
            </span>
          </div>
          {vault && (
            <CheckboxBorrow
              depositAmount={data.amounts.own}
              borrowFee={+data.amounts.borrowCost}
              vault={vault}
              onChange={(v) => setVaultAddress(v.vault)}
            />
          )}
          <Spin
            wrapperClassName={styles['estimated-profits']}
            spinning={loading}
          >
            <ProfitsRender data={{ ...data, product: data }} />
            <Calculation quote={data} className={styles['calculation']} />
          </Spin>
          <InvestButton
            vault={data.vault.vault.toLowerCase()}
            chainId={data.vault.chainId}
            afterInvest={() => props.setVisible(false)}
          />
        </div>
        <div
          className={classNames(styles['expand-widget'], {
            [styles['expanded']]: expanded,
          })}
          onClick={() => setExpanded((pre) => !pre)}
        >
          {t('details')} <IconArrow />
        </div>
      </div>
      {expanded && <ProductDesc product={data} />}
    </>
  );
};

const InvestModal = forwardRef<InvestModalPropsRef, InvestModalProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);

    const wallet = useWalletStore();
    const balance = wallet.balance?.[props.product.vault.depositCcy];
    const shouldInit = !wallet.address || !isNullLike(balance);

    const initProduct = useLazyCallback(
      (
        fundingApy: string | number | undefined = props.product.apyInfo
          ?.interest,
      ) => ({
        id: '1',
        vault: props.product.vault,
        chainId: props.product.vault.chainId,
        expiry: props.product.expiry,
        anchorPrices: props.product.anchorPrices,
        depositAmount: roundWith(
          props.product.amounts.own,
          props.product.vault.depositTickAmount,
          props.product.vault.depositMinAmount,
          balance || undefined,
        ),
        protectedApy: props.product.apyInfo?.min,
        fundingApy,
      }),
    );

    const [preparing, setPreparing] = useState(true);
    useEffect(() => {
      if (shouldInit) {
        useProductsState.updateCart(
          initProduct(
            useGlobalState.getState().interestRate[wallet.chainId]?.[
              props.product.vault.depositCcy
            ]?.apyUsed,
          ),
        );
        if (preparing) setTimeout(() => setPreparing(false), 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.product, shouldInit]);

    useImperativeHandle(ref, () => ({
      hide: () => setVisible(false),
      show: () => setVisible(true),
    }));

    return (
      <Modal
        className={styles['deposit-modal']}
        title={
          <>
            <span>{RiskTypeRefs[props.product.vault.riskType].icon}</span>
            <span>
              {ProductTypeRefs[props.product.vault.productType].alias}
            </span>{' '}
            <span>{props.product.vault.forCcy.replace(/^W/, '')}</span>
            <span>{displayExpiry(props.product.expiry * 1000)}</span>
            <span>
              {props.product.anchorPrices
                .map((it) => amountFormatter(it, 0))
                .join('-')}
            </span>
          </>
        }
        width={1080}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        lazyRender
        closeOnEsc={false}
      >
        {!preparing && <El {...props} setVisible={setVisible} />}
      </Modal>
    );
  },
);

export default InvestModal;
