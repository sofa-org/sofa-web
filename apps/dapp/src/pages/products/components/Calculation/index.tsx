import { Fragment, useMemo, useState } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { RiskType } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteResult,
  ProductsService,
  ProductType,
} from '@sofa/services/products';
import {
  amountFormatter,
  displayPercentage,
  displayWithFlag,
} from '@sofa/utils/amount';
import { MsIntervals, next8h } from '@sofa/utils/expiry';
import { useAsyncMemo } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import { displayTenor } from '@sofa/utils/time';
import { useSize } from 'ahooks';
import classNames from 'classnames';

import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';
import { useTimezone } from '@/components/TimezoneSelector/store';
import { addI18nResources } from '@/locales';

import { Comp as IconCalculator } from './assets/icon-calculator.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Calculation');

export interface CalculationProps extends BaseProps {
  quote: Pick<
    ProductQuoteResult,
    | 'amounts'
    | 'vault'
    | 'timestamp'
    | 'pricesForCalculation'
    | 'expiry'
    | 'apyInfo'
    | 'oddsInfo'
    | 'feeRate'
    | 'convertedCalculatedInfoByDepositBaseCcy'
  >;
  baseCcy?: string;
}

export const Calculation = (props: CalculationProps) => {
  const [t] = useTranslation('Calculation');
  const { timezone } = useTimezone();
  const z = displayWithFlag(timezone);
  const vault = props.quote.vault;
  const quote =
    props.baseCcy === vault.depositBaseCcy
      ? props.quote.convertedCalculatedInfoByDepositBaseCcy!
      : props.quote;
  const productRef = ProductTypeRefs[vault.productType];
  const riskTypeRef = RiskTypeRefs[vault.riskType];
  const leverageInfo = useAsyncMemo(
    () =>
      ProductsService.vaultLeverageInfo(vault, props.quote.timestamp * 1000),
    [vault, props.quote.timestamp],
  );
  const data = useMemo(
    () =>
      !quote
        ? []
        : vault.riskType === RiskType.RISKY
          ? [
              {
                name: t('Deposit Notional'),
                value: (
                  <>
                    {+quote.amounts.own} {props.baseCcy || vault.depositCcy}
                  </>
                ),
                desc: t("User's Deposit Amount"),
              },
              {
                name: t('Product Type'),
                value: (
                  <>
                    {productRef.label(t)} {riskTypeRef.icon}{' '}
                    {riskTypeRef.label(t)}
                  </>
                ),
                desc: t('Product Name'),
              },
              {
                name: t('Execution Time (UTC{{z}})', { z }),
                value: (
                  <>
                    <Time time={props.quote.timestamp * 1000} />
                  </>
                ),
                desc: t('Recorded in EpochSeconds'),
              },
              vault.productType === ProductType.DNT
                ? {
                    name: t('Observation Start (UTC{{z}})', { z }),
                    value: (
                      <>
                        <Time time={next8h(props.quote.timestamp * 1000)} />
                      </>
                    ),
                    desc: t('Recorded in EpochSeconds'),
                  }
                : undefined,
              {
                name: t('Expiry Time (UTC{{z}})', { z }),
                value: (
                  <>
                    <Time time={next8h(props.quote.expiry * 1000)} />
                  </>
                ),
                desc: t('Recorded in EpochSeconds'),
              },
              {
                name: t('Tenor (Days)'),
                value: (
                  <>
                    {displayTenor(
                      (
                        ((props.quote.expiry - props.quote.timestamp) * 1000) /
                        MsIntervals.day
                      ).toFixed(2),
                      t,
                    )}
                  </>
                ),
                desc: t('Expiry Time - Execution Time (in EpochSeconds)'),
              },
              { className: styles['white'] },
              {
                name: t('Premium'),
                value: (
                  <>
                    {amountFormatter(+quote.amounts.premium)}{' '}
                    {props.baseCcy || vault.depositCcy}
                  </>
                ),
                // Premium Amount used for the following calculation.
                desc: t(
                  'Premium Amount to purchase options that can ensure Base Yield even after fee deduction. <br/>((Estimated Aave/Lido/Sofa/Curve/Avalon Return - Earn|Base Return) / (Deposit Amount + Estimated Aave/Lido/Sofa/Curve/Avalon Return) * Deposit Amount / (1 + Trading Fee Rate))',
                ),
                className: styles['gray'],
              },
              {
                name: t('MM Collateral'),
                value: (
                  <>
                    {amountFormatter(quote.amounts.counterparty)}{' '}
                    {props.baseCcy || vault.depositCcy}
                  </>
                ),
                desc: t('From Market Maker Price'),
                className: styles['gray'],
              },
              { className: styles['white'] },
              {
                name: t('Enhanced Amount'),
                value: (
                  <>
                    {amountFormatter(
                      +quote.amounts.maxRedeemable -
                        +quote.amounts.minRedeemable +
                        +quote.amounts.maxSettlementFee,
                    )}{' '}
                    {props.baseCcy || vault.depositCcy}
                  </>
                ),
                desc: t('(MM Collateral + Premium). From Market Maker Price'),
                className: styles['gray'],
              },
              {
                name: t('Settlement Fee Rate'),
                value: (
                  <>
                    {displayPercentage(
                      quote.feeRate?.settlement ??
                        +quote.amounts.maxSettlementFee /
                          (+quote.amounts.maxRedeemable -
                            +quote.amounts.minRedeemable),
                      0,
                    )}
                  </>
                ),
                desc: t('Specified in Smart Contract'),
                className: styles['gray'],
              },
              {
                name: t('Trading Fee Rate'),
                value: (
                  <>
                    {displayPercentage(
                      quote.feeRate?.trading ??
                        +quote.amounts.tradingFee / +quote.amounts.premium,
                      0,
                    )}
                  </>
                ),
                desc: t('Specified in Smart Contract'),
                className: styles['gray'],
              },
              {
                name: t('Trading Fee'),
                value: (
                  <>
                    {amountFormatter(+quote.amounts.tradingFee)}{' '}
                    {props.baseCcy || vault.depositCcy}
                  </>
                ),
                desc: t('DepositAmount * Trading Fee Rate'),
                className: styles['gray'],
              },
              ...(Date.now() > props.quote.expiry * 1000
                ? [
                    {
                      name: t('Settlement Fee'),
                      value: (
                        <>
                          {amountFormatter(quote.amounts.settlementFee)}{' '}
                          {props.baseCcy || vault.depositCcy}
                        </>
                      ),
                      desc: t('Protocol Settlement Fee'),
                      className: styles['gray'],
                    },
                  ]
                : [
                    {
                      name: t('Upside Settlement Fee'),
                      value: (
                        <>
                          {amountFormatter(+quote.amounts.maxSettlementFee)}{' '}
                          {props.baseCcy || vault.depositCcy}
                        </>
                      ),
                      desc: t('Protocol Upside Fee (Winning Only)'),
                      className: styles['gray'],
                    },
                  ]),
              {
                name: t('Estimated RCH Airdrop Quantity'),
                value: <>{amountFormatter(+quote.amounts.rchAirdrop)} RCH</>,
                desc: t(
                  'Based on the transaction volume from the previous day',
                ),
                className: styles['highlight'],
              },
              {
                name: t('Estimated RCH Price'),
                value: (
                  <>
                    {amountFormatter(props.quote.pricesForCalculation['RCH'])}{' '}
                    USDT
                  </>
                ),
                desc: t('Implied live RCH USDT price'),
                className: styles['highlight'],
              },
              {
                name: t('Estimated RCH Return'),
                value: (
                  <>
                    {amountFormatter(
                      +quote.amounts.rchAirdrop *
                        props.quote.pricesForCalculation['RCH']!,
                    )}{' '}
                    USDT
                  </>
                ),
                desc: t('RCH Price * RCH Airdrop Quantity'),
                className: styles['highlight'],
              },
            ]
          : vault.riskType === RiskType.LEVERAGE
            ? [
                {
                  name: t('User Actual Deposit'),
                  value: (
                    <>
                      {+quote.amounts.own} {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t("User's Deposit Amount"),
                },
                {
                  name: t('Product Type'),
                  value: (
                    <>
                      {productRef.label(t)} {riskTypeRef.icon}{' '}
                      {riskTypeRef.label(t)}
                    </>
                  ),
                  desc: t('Product Name'),
                },
                {
                  name: t('Execution Time (UTC{{z}})', { z }),
                  value: (
                    <>
                      <Time time={props.quote.timestamp * 1000} />
                    </>
                  ),
                  desc: t('Recorded in EpochSeconds'),
                },
                vault.productType === ProductType.DNT
                  ? {
                      name: t('Observation Start (UTC{{z}})', { z }),
                      value: (
                        <>
                          <Time time={next8h(props.quote.timestamp * 1000)} />
                        </>
                      ),
                      desc: t('Recorded in EpochSeconds'),
                    }
                  : undefined,
                {
                  name: t('Expiry Time (UTC{{z}})', { z }),
                  value: (
                    <>
                      <Time time={next8h(props.quote.expiry * 1000)} />
                    </>
                  ),
                  desc: t('Recorded in EpochSeconds'),
                },
                {
                  name: t('Tenor (Days)'),
                  value: (
                    <>
                      {displayTenor(
                        (
                          ((props.quote.expiry - props.quote.timestamp) *
                            1000) /
                          MsIntervals.day
                        ).toFixed(2),
                        t,
                      )}
                    </>
                  ),
                  desc: t('Expiry Time - Execution Time (in EpochSeconds)'),
                },
                { className: styles['white'] },
                {
                  name: t('Leverage'),
                  value: <>{leverageInfo?.leverage}x</>,
                  desc: t('Preset/Configurable'),
                  className: styles['gray'],
                },
                {
                  name: t('Borrow APR'),
                  value: <>{displayPercentage(leverageInfo?.borrowApr)}</>,
                  desc: t('Preset/Configurable'),
                  className: styles['gray'],
                },
                {
                  name: t('Spread APR'),
                  value: <>{displayPercentage(leverageInfo?.spreadApr)}</>,
                  desc: t('Preset/Configurable'),
                  className: styles['gray'],
                },
                {
                  name: t('Base Yield APR on Total Deposit'),
                  value: <>{displayPercentage(0)}</>,
                  desc: t('Preset/Configurable'),
                  className: styles['gray'],
                },
                {
                  name: t('APR Rules'),
                  value: <>{t('Simple Linear Interest in Tenor in Years')}</>,
                  desc: t('Preset/Configurable'),
                  className: styles['gray'],
                },
                { className: styles['white'] },
                {
                  name: t('Base Deposit Amount'),
                  value: (
                    <>
                      {amountFormatter(
                        +quote.amounts.own - +quote.amounts.borrowCost,
                      )}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: '',
                  className: styles['gray'],
                },
                {
                  name: t('Borrow Amount'),
                  value: (
                    <>
                      {amountFormatter(+quote.amounts.borrow)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: '',
                  className: styles['gray'],
                },
                {
                  name: t('Equivalent Total Deposit Amount'),
                  value: (
                    <>
                      {leverageInfo &&
                        leverageInfo.leverage !== 1 &&
                        !!quote.amounts.borrow &&
                        amountFormatter(
                          (+quote.amounts.borrow * leverageInfo.leverage) /
                            (leverageInfo.leverage - 1),
                        )}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: '',
                  className: styles['gray'],
                },
                {
                  name: t('Borrow Cost'),
                  value: (
                    <>
                      {amountFormatter(+quote.amounts.borrowCost)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: '',
                  className: styles['gray'],
                },
                {
                  name: t('Spread Cost'),
                  value: (
                    <>
                      {amountFormatter(quote.amounts.spreadCost)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t('Fee on Borrowing Cost'),
                  className: styles['gray'],
                },
                { className: styles['white'] },
                {
                  name: t('Equivalent Total Interest Amount'),
                  value: (
                    <>
                      {amountFormatter(+quote.amounts.borrowCost)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t(
                    `Here we assumes the actual interest (dummy) all come from user's payment for borrowing. Otherwise it is equivalent to charge User's borrowing fee`,
                  ),
                  className: styles['gray'],
                },
                {
                  name: t('Base Yield Amount'),
                  value: <>0 {props.baseCcy || vault.depositCcy}</>,
                  desc: '',
                  className: styles['gray'],
                },
                { className: styles['white'] },
                {
                  name: t('Premium'),
                  value: (
                    <>
                      {amountFormatter(+quote.amounts.premium)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t('Premium Amount used for the following calculation.'),
                  className: styles['gray'],
                },
                {
                  name: t('MM Collateral'),
                  value: (
                    <>
                      {amountFormatter(quote.amounts.counterparty)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t('From Market Maker Price'),
                  className: styles['gray'],
                },
                {
                  name: t('Enhanced Amount'),
                  value: (
                    <>
                      {amountFormatter(
                        +quote.amounts.maxRedeemable -
                          +quote.amounts.minRedeemable +
                          +quote.amounts.maxSettlementFee,
                      )}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t('(MM Collateral+Premium). From Market Maker Price'),
                  className: styles['gray'],
                },
                {
                  name: t('Trading Fee'),
                  value: <>0 {props.baseCcy || vault.depositCcy}</>,
                  desc: t('No Trading Fee'),
                  className: styles['gray'],
                },
                {
                  name: t('Settlement Fee'),
                  value: <>0 {props.baseCcy || vault.depositCcy}</>,
                  desc: t('No Settlement Fee'),
                  className: styles['gray'],
                },
                { className: styles['white'] },
                {
                  name: t('Estimated RCH Airdrop Quantity'),
                  value: <>{amountFormatter(+quote.amounts.rchAirdrop)} RCH</>,
                  desc: t(
                    'Based on the transaction volume from the previous day',
                  ),
                  className: styles['highlight'],
                },
                {
                  name: t('Estimated RCH Price'),
                  value: (
                    <>
                      {amountFormatter(props.quote.pricesForCalculation['RCH'])}{' '}
                      USDT
                    </>
                  ),
                  desc: t('Implied live RCH USDT price'),
                  className: styles['highlight'],
                },
                {
                  name: t('Estimated RCH Return'),
                  value: (
                    <>
                      {amountFormatter(
                        +quote.amounts.rchAirdrop *
                          props.quote.pricesForCalculation['RCH']!,
                      )}{' '}
                      USDT
                    </>
                  ),
                  desc: t('RCH Price * RCH Airdrop Quantity'),
                  className: styles['highlight'],
                },
                { className: styles['white'] },
                {
                  name: t('Estimated Base APY Return(after Fee)'),
                  value: <>{displayPercentage(quote.apyInfo?.min)} APY</>,
                  desc: t('((Deposit+Base Return)/Deposit)^(365/Tenor)-1'),
                  className: styles['highlight-1'],
                },
                {
                  name: t('Estimated Base with RCH APY Return(after Fee)'),
                  value: (
                    <>
                      {displayPercentage(
                        simplePlus(quote.apyInfo?.min, quote.apyInfo?.rch),
                      )}{' '}
                      APY
                    </>
                  ),
                  desc: t(
                    '((Deposit+Base Return + RCH Return)/Deposit)^(365/Tenor)-1',
                  ),
                  className: styles['highlight-1'],
                },
                {
                  name: t('Estimated Upside APY Return(after Fee)'),
                  value: (
                    <>
                      {displayPercentage(
                        simplePlus(quote.apyInfo?.max, quote.apyInfo?.rch),
                      )}{' '}
                      APY
                    </>
                  ),
                  desc: t(
                    '((Deposit+Base Return + RCH Return + Enhanced Amount - Upside Settlement Fee)/Deposit)^(365/Tenor)-1',
                  ),
                  className: styles['highlight-1'],
                },
              ]
            : [
                {
                  name: t('Deposit Notional'),
                  value: (
                    <>
                      {+quote.amounts.own} {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t("User's Deposit Amount"),
                },
                {
                  name: t('Product Type'),
                  value: (
                    <>
                      {productRef.label(t)} {riskTypeRef.icon}{' '}
                      {riskTypeRef.label(t)}
                    </>
                  ),
                  desc: t('Product Name'),
                },
                {
                  name: t('Execution Time (UTC{{z}})', { z }),
                  value: (
                    <>
                      <Time time={props.quote.timestamp * 1000} />
                    </>
                  ),
                  desc: t('Recorded in EpochSeconds'),
                },
                vault.productType === ProductType.DNT
                  ? {
                      name: t('Observation Start (UTC{{z}})', { z }),
                      value: (
                        <>
                          <Time time={next8h(props.quote.timestamp * 1000)} />
                        </>
                      ),
                      desc: t('Recorded in EpochSeconds'),
                    }
                  : undefined,
                {
                  name: t('Expiry Time (UTC{{z}})', { z }),
                  value: (
                    <>
                      <Time time={next8h(props.quote.expiry * 1000)} />
                    </>
                  ),
                  desc: t('Recorded in EpochSeconds'),
                },
                {
                  name: t('Tenor (Days)'),
                  value: (
                    <>
                      {displayTenor(
                        (
                          ((props.quote.expiry - props.quote.timestamp) *
                            1000) /
                          MsIntervals.day
                        ).toFixed(2),
                        t,
                      )}
                    </>
                  ),
                  desc: t('Expiry Time - Execution Time (in EpochSeconds)'),
                },
                {
                  name: t('Estimated Aave/Lido/Sofa/Curve/Avalon Yield'),
                  value: <>{displayPercentage(quote.apyInfo?.interest)}</>,
                  desc: t(
                    'Min(1 Month Aave/Lido/Sofa/Curve/Avalon Average, current Aave/Lido/Sofa/Curve/Avalon Apy). (Aave/Lido/Sofa/Curve/Avalon APY)',
                  ),
                },
                {
                  name: t('Estimated Aave/Lido/Sofa/Curve/Avalon Return'),
                  value: (
                    <>
                      {amountFormatter(
                        (+quote.amounts.totalInterest! /
                          (+quote.amounts.counterparty + +quote.amounts.own)) *
                          +quote.amounts.own,
                        4,
                      )}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t(
                    '(Deposit * (1 + Aave/Lido/Sofa/Curve/Avalon APY Estimate) ^ (Tenor / 365) - Deposit)',
                  ),
                },
                {
                  name: t('Earn | Base Yield(APY)'),
                  value: <>{displayPercentage(quote.apyInfo?.min)}</>,
                  desc: t(
                    "User's Selection. Base Yield can be achieved if actual Aave/Lido/Sofa/Curve/Avalon return is equal to current estimate",
                  ),
                },
                {
                  name: t('Earn | Base Return'),
                  value: (
                    <>
                      {amountFormatter(
                        simplePlus(
                          +quote.amounts.minRedeemable,
                          -+quote.amounts.own,
                        ),
                        4,
                      )}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t('(Deposit*(1+Base_APY_Est)^(Tenor/365)-Deposit)'),
                },
                { className: styles['white'] },
                {
                  name: t('Premium'),
                  value: (
                    <>
                      {amountFormatter(+quote.amounts.premium)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  // Premium Amount used for the following calculation.
                  desc: t(
                    'Premium Amount to purchase options that can ensure Base Yield even after fee deduction. <br/>((Estimated Aave/Lido/Sofa/Curve/Avalon Return - Earn|Base Return) / (Deposit Amount + Estimated Aave/Lido/Sofa/Curve/Avalon Return) * Deposit Amount / (1 + Trading Fee Rate))',
                  ),
                  className: styles['gray'],
                },
                {
                  name: t('MM Collateral'),
                  value: (
                    <>
                      {amountFormatter(quote.amounts.counterparty)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t('From Market Maker Price'),
                  className: styles['gray'],
                },
                { className: styles['white'] },
                {
                  name: t('Enhanced Amount'),
                  value: (
                    <>
                      {amountFormatter(
                        +quote.amounts.maxRedeemable -
                          +quote.amounts.minRedeemable +
                          +quote.amounts.maxSettlementFee,
                      )}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t(
                    '(MM Collateral + Premium) * ((1 + Aave/Lido/Sofa/Curve/Avalon interest rate) ^ (Tenor / 365) - 1). From Market Maker Price',
                  ),
                  className: styles['gray'],
                },
                {
                  name: t('Settlement Fee Rate'),
                  value: (
                    <>
                      {displayPercentage(
                        quote.feeRate?.settlement ??
                          +quote.amounts.maxSettlementFee /
                            (+quote.amounts.maxRedeemable -
                              +quote.amounts.minRedeemable),
                        0,
                      )}
                    </>
                  ),
                  desc: t('Specified in Smart Contract'),
                  className: styles['gray'],
                },
                {
                  name: t('Trading Fee Rate'),
                  value: (
                    <>
                      {displayPercentage(
                        quote.feeRate?.trading ??
                          +quote.amounts.tradingFee / +quote.amounts.premium,
                        0,
                      )}
                    </>
                  ),
                  desc: t('Specified in Smart Contract'),
                  className: styles['gray'],
                },
                {
                  name: t('Calculate Premium Considering Fee Cost'),
                  value: t('True'),
                  desc: t(
                    'Calculate Premium to ensure the Base Yield even after fee deduction.',
                  ),
                  className: styles['gray'],
                },
                {
                  name: t('Estimated Trading Fee'),
                  value: (
                    <>
                      {amountFormatter(+quote.amounts.tradingFee)}{' '}
                      {props.baseCcy || vault.depositCcy}
                    </>
                  ),
                  desc: t(
                    'Premium * Trading Fee Rate * ((1 + Aave/Lido/Sofa/Curve/Avalon interest rate) ^ (Tenor / 365)-1)',
                  ),
                  className: styles['gray'],
                },
                ...(Date.now() > props.quote.expiry * 1000
                  ? [
                      {
                        name: t('Estimated Settlement Fee'),
                        value: (
                          <>
                            {amountFormatter(quote.amounts.settlementFee)}{' '}
                            {props.baseCcy || vault.depositCcy}
                          </>
                        ),
                        desc: t('Protocol Settlement Fee'),
                        className: styles['gray'],
                      },
                    ]
                  : [
                      {
                        name: t('Upside Settlement Fee'),
                        value: (
                          <>
                            {amountFormatter(quote.amounts.settlementFee)}{' '}
                            {props.baseCcy || vault.depositCcy}
                          </>
                        ),
                        desc: t('Protocol Upside Fee (Winning Only)'),
                        className: styles['gray'],
                      },
                    ]),
                {
                  name: t('Estimated RCH Airdrop Quantity'),
                  value: <>{amountFormatter(+quote.amounts.rchAirdrop)} RCH</>,
                  desc: t(
                    'Based on the transaction volume from the previous day',
                  ),
                  className: styles['highlight'],
                },
                {
                  name: t('Estimated RCH Price'),
                  value: (
                    <>
                      {amountFormatter(props.quote.pricesForCalculation['RCH'])}{' '}
                      USDT
                    </>
                  ),
                  desc: t('Implied live RCH USDT price'),
                  className: styles['highlight'],
                },
                {
                  name: t('Estimated RCH Return'),
                  value: (
                    <>
                      {amountFormatter(
                        +quote.amounts.rchAirdrop *
                          props.quote.pricesForCalculation['RCH']!,
                      )}{' '}
                      USDT
                    </>
                  ),
                  desc: t('RCH Price * RCH Airdrop Quantity'),
                  className: styles['highlight'],
                },
                { className: styles['white'] },
                {
                  name: t('Estimated Base APY Return'),
                  value: <>{displayPercentage(quote.apyInfo?.min)} APY</>,
                  desc: t('((Deposit+Base Return)/Deposit)^(365/Tenor)-1'),
                  className: styles['highlight-1'],
                },
                {
                  name: t('Estimated Base with RCH APY Return'),
                  value: (
                    <>
                      {displayPercentage(
                        simplePlus(quote.apyInfo?.min, quote.apyInfo?.rch),
                      )}{' '}
                      APY
                    </>
                  ),
                  desc: t(
                    '((Deposit+Base Return + RCH Return)/Deposit)^(365/Tenor)-1',
                  ),
                  className: styles['highlight-1'],
                },
                {
                  name: t('Estimated Upside APY Return'),
                  value: (
                    <>
                      {displayPercentage(
                        simplePlus(quote.apyInfo?.max, quote.apyInfo?.rch),
                      )}{' '}
                      APY
                    </>
                  ),
                  desc: t(
                    '((Deposit+Base Return + RCH Return + Enhanced Amount - Upside Settlement Fee)/Deposit)^(365/Tenor)-1',
                  ),
                  className: styles['highlight-1'],
                },
              ],
    [quote, t, productRef, riskTypeRef, z, leverageInfo, vault],
  );

  const [visible, setVisible] = useState(false);
  const size = useSize(document.body);
  const windowWidth = size?.width || window.innerWidth;
  const useTable = windowWidth - 24 > 1000;

  if (!quote) return <></>;

  return (
    <>
      <IconCalculator
        className={classNames(styles['calculation'], props.className)}
        style={props.style}
        onClick={() => setVisible(true)}
      />
      <Modal
        width={1000}
        title={t('Calculation')}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        {useTable ? (
          <table className={styles['table']}>
            <thead>
              <tr>
                <th>{t('Definition')}</th>
                <th>{t('Value')}</th>
                <th>{t('Description')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((it, i) => {
                if (!it) return <Fragment key={i} />;
                return (
                  <tr key={i} className={it.className}>
                    <td>{it.name}</td>
                    <td>{it.value}</td>
                    <td
                      dangerouslySetInnerHTML={{ __html: it.desc || '...' }}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={styles['list']}>
            <div className={styles['thead']}>
              <div className={styles['tr']}>
                <div className={styles['th']}>{t('Definition')}</div>
                <div className={styles['th']}>{t('Value')}</div>
              </div>
            </div>
            <div className={styles['tbody']}>
              {data.map((it, i) => {
                if (!it) return <Fragment key={i} />;
                return (
                  <div
                    key={i}
                    className={classNames(styles['tr'], it.className)}
                  >
                    <div className={styles['td']}>{it.name}</div>
                    <div className={styles['td']}>{it.value}</div>
                    <div
                      className={styles['td']}
                      dangerouslySetInnerHTML={{ __html: it.desc || '...' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
