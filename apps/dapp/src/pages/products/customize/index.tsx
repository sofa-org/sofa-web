import {
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { DatePicker } from '@douyinfe/semi-ui';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductsService,
  ProductType,
  RiskType,
} from '@sofa/services/products';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { day8h, displayExpiry, next8h, pre8h } from '@sofa/utils/expiry';
import { calcVal } from '@sofa/utils/fns';
import { currQuery } from '@sofa/utils/history';
import { useAsyncMemo, useLazyCallback } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';
import { uniqBy } from 'lodash-es';
import { nanoid } from 'nanoid';

import AmountInput from '@/components/AmountInput';
import {
  CCYSelector,
  useDepositCcySelect,
  useForCcySelect,
} from '@/components/CCYSelector';
import { CSelect } from '@/components/CSelect';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { PayoffChart } from '@/components/Payoff';
import { PriceRangeInputEl } from '@/components/PriceRangeInput';
import {
  ProductTypeSelector,
  useProductSelect,
  useProjectChange,
} from '@/components/ProductSelector';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import RadioBtnGroup from '@/components/RadioBtnGroup';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { useGlobalState } from '@/store';

import { Calculation } from '../components/Calculation';
import { CheckboxBorrow } from '../components/CheckboxBorrow';
import InvestButton from '../components/InvestButton';
import ProductBanner, { ProductBrief } from '../components/ProductBanner';
import ProductDesc from '../components/ProductDesc';
import { ProfitsRender } from '../components/ProfitsRender';
import { QuoteExplain } from '../components/QuoteExplain';
import ProductLottery from '../lottery';
import { useProductsState } from '../store';

import { Comp as IconExpand } from './assets/icon-expand.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ProductCustomize');

const ProductCustomize = () => {
  const [t] = useTranslation('ProductCustomize');
  const wallet = useWalletStore();
  const prices = useIndexPrices((state) => state.prices);
  const [productType] = useProductSelect();
  const riskType = useMemo(() => {
    const val = currQuery().project as never;
    return [RiskType.PROTECTED, RiskType.LEVERAGE].includes(val)
      ? val
      : RiskType.PROTECTED;
  }, []);
  const [forCcy] = useForCcySelect();
  const [depositCcy, setDepositCcy] = useDepositCcySelect();
  const [leverageVault, $setLeverageVault] = useState<string>();

  const vaultOptions = useMemo(
    () =>
      ProductsService.filterVaults(ContractsService.vaults, {
        forCcy,
        riskType,
        productType,
        chainId: wallet.chainId,
      }).map((it) => ({
        vault: it,
        label: it.depositCcy,
        value: `${it.chainId}-${it.vault.toLowerCase()}`,
      })),
    [forCcy, productType, riskType, wallet.chainId],
  );

  const customDev = useMemo(() => currQuery()['custom-dev'] === '1', []);

  const depositCcyOptions = useMemo(
    () =>
      uniqBy(vaultOptions, (it) => it.vault.depositCcy).map((it) => ({
        label: it.vault.depositCcy,
        value: it.vault.depositCcy,
      })),
    [vaultOptions],
  );

  const vault = useGlobalState((state) =>
    ProductsService.findVault(state.vaults, {
      forCcy,
      depositCcy,
      productType,
      chainId: wallet.chainId,
      ...(!leverageVault ? { riskType } : { vault: leverageVault }),
    }),
  );

  useEffect(() => {
    if (!vault && vaultOptions.length) {
      $setLeverageVault(
        vaultOptions.find((it) => it.vault.depositCcy === depositCcy)?.vault
          .vault,
      );
    }
  }, [depositCcy, vault, vaultOptions]);

  const product = useProductsState(
    (state) =>
      vault && state.cart[`${vault.vault.toLowerCase()}-${vault.chainId}`]?.[0],
  );
  const updateProduct = useLazyCallback(
    (action: SetStateAction<Partial<typeof product>>) => {
      if (!vault) return;
      const old =
        useProductsState.getState().cart[
          `${vault.vault.toLowerCase()}-${vault.chainId}`
        ]?.[0];
      const val = calcVal(action, old);
      useProductsState.updateCart({
        id: nanoid(),
        vault,
        ...old,
        ...val,
      });
    },
  );

  const setLeverageVault = useLazyCallback((v?: string) => {
    const nextVault = ProductsService.findVault(
      useGlobalState.getState().vaults,
      {
        forCcy,
        depositCcy,
        productType,
        chainId: wallet.chainId,
        ...(!v ? { riskType } : { vault: v }),
      },
    )!;
    useProductsState.updateCart({
      id: nanoid(),
      ...product,
      vault: nextVault,
    });
    $setLeverageVault(v);
  });

  const interestRate = useGlobalState(
    (state) => state.interestRate[wallet.chainId]?.[depositCcy],
  );
  useEffect(() => {
    if (interestRate?.apyUsed)
      updateProduct({ fundingApy: interestRate.apyUsed });
  }, [vault, interestRate?.apyUsed, updateProduct]);

  const protectedApyOptions = useMemo(
    () =>
      ProductsService.genProtectedApyList(interestRate?.apyUsed, customDev).map(
        (value) => ({
          label: `${displayPercentage(value)} Yield`,
          value,
        }),
      ),
    [customDev, interestRate?.apyUsed],
  );
  useEffect(() => {
    if (
      protectedApyOptions.length &&
      !protectedApyOptions.some((it) => it.value === product?.protectedApy)
    ) {
      updateProduct({ protectedApy: protectedApyOptions[0].value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protectedApyOptions, vault?.vault, updateProduct]);

  const expiries = useAsyncMemo(
    async () =>
      vault &&
      ProductsService.genExpiries(vault).then((res) =>
        res.map((value) => ({
          label: displayExpiry(value),
          value: value / 1000,
        })),
      ),
    [vault],
  );
  useLayoutEffect(() => {
    if (!product?.expiry && expiries)
      updateProduct({ expiry: expiries[3].value });
  }, [product?.expiry, expiries, updateProduct]);

  const quoteInfo = useProductsState(
    (state) => product && state.quoteInfos[ProductsService.productKey(product)],
  );

  const [expanded, setExpanded] = useState<boolean | undefined>(() =>
    currQuery().expanded ? true : undefined,
  );

  const { min, max } = useMemo(() => {
    if (!expiries) return { min: next8h(), max: pre8h() };
    return {
      min: expiries[0].value * 1000,
      max: expiries[expiries.length - 1].value * 1000,
    };
  }, [expiries]);

  return (
    <>
      <ProductBanner title={<></>} />
      <div className={styles['header']}>
        <ProductTypeSelector />
        <CCYSelector prefix={t('Anchor')} />
      </div>
      <div className={styles['form']}>
        <div className={styles['content']}>
          <div className={styles['left']}>
            {vault?.riskType === RiskType.PROTECTED && (
              <div className={styles['form-item']}>
                <div className={styles['label']}>
                  {t('Base Yield(APY)')}
                  {customDev && `(${displayPercentage(interestRate?.apyUsed)})`}
                </div>
                <div className={styles['input-wrapper']}>
                  <RadioBtnGroup
                    radioStyle={{ width: 120 / window.winScale }}
                    options={protectedApyOptions}
                    value={product?.protectedApy}
                    onChange={(v) => updateProduct({ protectedApy: +v })}
                  />
                </div>
              </div>
            )}
            <div className={styles['form-item']}>
              <div className={styles['label']}>{t('Expiry Date')}</div>
              <div className={styles['input-wrapper']}>
                <RadioBtnGroup
                  radioStyle={{ width: 76 / window.winScale }}
                  options={expiries}
                  value={product?.expiry}
                  onChange={(v) => updateProduct({ expiry: +v })}
                />
                <DatePicker
                  type="date"
                  value={product?.expiry ? product.expiry * 1000 : undefined}
                  onChange={(v) =>
                    updateProduct({ expiry: day8h(Number(v)) / 1000 })
                  }
                  inputReadOnly
                  showClear={false}
                  disabledDate={(d) => {
                    if (!d) return true;
                    const curr8h = next8h(d.getTime());
                    return curr8h <= min || curr8h > max;
                  }}
                />
              </div>
            </div>
            <div className={styles['form-item']}>
              <div className={styles['label']}>
                {productType !== ProductType.DNT
                  ? t('Strike Price')
                  : t('Barrier Price')}
              </div>
              <div className={styles['input-wrapper']}>
                <span
                  className={styles['desc']}
                  dangerouslySetInnerHTML={{
                    __html: ProductTypeRefs[productType].strikeDesc(t),
                  }}
                />
                <PriceRangeInputEl
                  key={vault?.forCcy}
                  forCcy={forCcy}
                  value={product?.anchorPrices}
                  onChange={(v) => updateProduct({ anchorPrices: v as never })}
                  autoInitial
                  type="2"
                  prefixes={
                    productType !== ProductType.DNT
                      ? undefined
                      : [t('B1'), t('B2')]
                  }
                  mustIncludeAtm={productType === ProductType.DNT}
                />
              </div>
            </div>
          </div>
          <div
            className={classNames(styles['right'], {
              [styles['expanded']]: expanded,
              [styles['folded']]: expanded == false,
            })}
          >
            <div className={styles['product-name']}>
              {RiskTypeRefs[riskType].icon}
              <span>{ProductTypeRefs[productType]?.alias}</span>
              {/* <span>{vault.forCcy}</span> */}
              <span>
                {!product?.expiry ? '-' : displayExpiry(product.expiry * 1000)}
              </span>
              <span>{product?.anchorPrices?.join('-')}</span>
            </div>
            <div className={styles['form-item']}>
              <div className={styles['label']}>{t('Deposit Amount')}</div>
              <div className={styles['input-wrapper']}>
                <AmountInput
                  max={
                    wallet.balance?.[depositCcy] &&
                    wallet.balance[depositCcy]! >
                      Number(vault?.depositMinAmount)
                      ? wallet.balance[depositCcy]
                      : undefined
                  }
                  min={vault?.depositMinAmount}
                  tick={vault?.depositTickAmount}
                  value={product?.depositAmount}
                  onChange={(v) => updateProduct({ depositAmount: v })}
                  suffix={
                    <CSelect
                      className={styles['deposit-ccy-selector']}
                      optionList={depositCcyOptions}
                      value={product?.vault?.depositCcy || depositCcy}
                      onSelect={(_, option) => setDepositCcy(option.value)}
                    />
                  }
                />
              </div>
              <div className={styles['balance']}>
                <span className={styles['label']}>{t('Wallet Balance')}</span>
                <span className={styles['value']}>
                  {amountFormatter(wallet.balance?.[depositCcy], 2)}{' '}
                  {depositCcy}
                </span>
              </div>
              {vault && (
                <CheckboxBorrow
                  depositAmount={product?.depositAmount}
                  borrowFee={Number(quoteInfo?.amounts.borrowCost)}
                  vault={vault}
                  onChange={(v) => setLeverageVault(v.vault)}
                />
              )}
            </div>
            {quoteInfo && (
              <div
                className={classNames(styles['btn-expand'], {
                  [styles['expanded']]: expanded,
                  [styles['folded']]: expanded == false,
                })}
                onClick={() => setExpanded((pre) => !pre)}
              >
                <IconExpand />
              </div>
            )}
            {quoteInfo && (
              <div
                className={classNames(styles['quote-infos'], {
                  [styles['expanded']]: expanded,
                  [styles['folded']]: expanded == false,
                })}
              >
                <div className={styles['details']}>
                  <PayoffChart
                    className={styles['chart']}
                    depositCcy={quoteInfo.vault.depositCcy}
                    productType={quoteInfo.vault.productType}
                    anchorPrices={quoteInfo.anchorPrices}
                    protectedYield={Number(quoteInfo.apyInfo?.min)}
                    enhancedYield={simplePlus(
                      quoteInfo.apyInfo?.max,
                      -(quoteInfo.apyInfo?.min || 0),
                    )}
                    rchYield={Number(quoteInfo.apyInfo?.rch)}
                    showYAxis
                    displayRchYield
                    atm={prices?.[quoteInfo.vault.forCcy]}
                  />
                  <ProfitsRender
                    data={{ ...quoteInfo, product: quoteInfo } as never}
                    style={{ marginBottom: 40 }}
                  />
                  <QuoteExplain
                    riskType={quoteInfo.vault.riskType}
                    productType={quoteInfo.vault.productType}
                  />
                  <Calculation
                    quote={quoteInfo}
                    className={styles['calculation']}
                  />
                </div>
                <div className={styles['brief']}>
                  <div className={styles['label']}>{t('Max Profits')}</div>
                  <div className={styles['value']}>
                    <span className={styles['amount']}>
                      {displayPercentage(quoteInfo.apyInfo?.max)}
                      {/* <span className={styles['unit']}>
                        {quoteInfo.depositCcy}
                      </span> */}
                    </span>
                    <span className={styles['sep']}>+</span>
                    <span className={styles['amount-rch']}>
                      {displayPercentage(quoteInfo.apyInfo?.rch)}
                      {/* <span className={styles['unit']}>RCH</span> */}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {vault && (
              <InvestButton vault={vault.vault} chainId={vault.chainId} />
            )}
          </div>
        </div>
      </div>
      <ProductBrief
        riskType={riskType}
        productType={productType}
        protectedReturnApy={Number(product?.protectedApy)}
      />
      {product?.vault && (
        <ProductDesc
          product={quoteInfo || product}
          className={styles['product-desc-wrapper']}
        />
      )}
      <div className={styles['placeholder']} />
    </>
  );
};

const Comp = () => {
  const [riskType] = useProjectChange();
  return riskType !== RiskType.RISKY ? (
    <ProductCustomize />
  ) : (
    <ProductLottery />
  );
};

export default Comp;
