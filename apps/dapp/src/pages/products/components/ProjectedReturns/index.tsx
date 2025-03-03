import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Radio, RadioGroup } from '@douyinfe/semi-ui';
import { ProductType, RiskType, VaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo } from '@sofa/services/positions';
import {
  amountFormatter,
  cvtAmountsInCcy,
  displayPercentage,
  getPrecision,
} from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import locale from './locale';
import { RangeboundImg } from './RangeboundImg';
import { TrendImg } from './TrendImg';

import styles from './index.module.scss';

addI18nResources(locale, 'ProjectedReturns');

export interface ProfitRenderProps extends BaseProps {
  title?: ReactNode;
  img?: ReactNode;
  depositCcy: VaultInfo['depositCcy'];
  depositAmount: number; // 本金
  depositLabel: ReactNode;
  rchReturnAmount: number; // RCH 空投金额
  amount: number | string /* range string */; // 显示金额，可能为负
  amountLabel: ReactNode;
  aliasType: 'yield' | 'multiplier';
  alias: [string | number /* origin */, number /* rch */]; // 显示年华 or 倍数
  aliasLabel: ReactNode;
  prices: PositionInfo['pricesForCalculation'];
}

const ProfitScenario = (props: ProfitRenderProps) => {
  const prices = props.prices;
  const allProfitInDepositCcy = useMemo(
    () => ({
      CCY: props.amount,
      RCH: cvtAmountsInCcy(
        { RCH: props.rchReturnAmount },
        prices,
        props.depositCcy,
      ),
    }),
    [prices, props.amount, props.depositCcy, props.rchReturnAmount],
  );
  return (
    <div
      className={classNames(styles['profit-scenario-wrapper'], props.className)}
    >
      {props.title && <div className={styles['title']}>{props.title}:</div>}
      <div className={styles['profit-scenario']}>
        {props.img && <div className={styles['left']}>{props.img}</div>}
        <div className={styles['right']}>
          <div className={styles['item']}>
            <span className={styles['label']}>{props.depositLabel}</span>
            <span className={styles['value']}>
              {amountFormatter(
                props.depositAmount,
                getPrecision(props.depositAmount),
              )}
              <span className={styles['unit']}>{props.depositCcy}</span>
            </span>
          </div>
          <div className={styles['item']}>
            <span className={styles['label']}>{props.amountLabel}</span>
            <span
              className={styles['value']}
              style={{
                color:
                  typeof allProfitInDepositCcy['CCY'] === 'string' ||
                  Number(allProfitInDepositCcy['CCY']) >= 0
                    ? 'var(--color-rise)'
                    : 'var(--color-gray)',
              }}
            >
              {typeof props.amount === 'number'
                ? amountFormatter(props.amount, 2)
                : props.amount}
              <span className={styles['unit']}>{props.depositCcy}</span>{' '}
              <span className={styles['icon-plus']}>+ </span>
              <span className={styles['rch']}>
                {amountFormatter(props.rchReturnAmount, 2)}
                <span className={styles['unit']}>RCH</span>
              </span>
            </span>
            <span
              className={styles['value-desc']}
              style={{
                color:
                  typeof allProfitInDepositCcy['CCY'] === 'string' ||
                  Number(allProfitInDepositCcy['CCY']) >= 0
                    ? 'var(--color-rise)'
                    : 'var(--color-gray)',
              }}
            >
              ≈{' '}
              {typeof allProfitInDepositCcy['CCY'] === 'string'
                ? allProfitInDepositCcy['CCY']
                : amountFormatter(allProfitInDepositCcy['CCY'], 2)}
              <span className={styles['unit']}>{props.depositCcy}</span>{' '}
              <span className={styles['icon-plus']}>+ </span>
              <span className={styles['rch']}>
                {amountFormatter(allProfitInDepositCcy.RCH, 2)}
                <span className={styles['unit']}>{props.depositCcy}</span>
              </span>
            </span>
          </div>
          <div className={styles['item']}>
            <span className={styles['label']}>{props.aliasLabel}</span>
            {((format: (v: string | number) => string) => (
              <span
                className={styles['value']}
                style={{
                  color:
                    typeof props.alias[0] === 'string' || props.alias[0] >= 0
                      ? 'var(--color-rise)'
                      : 'var(--color-gray)',
                }}
              >
                {format(props.alias[0])}{' '}
                <span className={styles['icon-plus']}>+ </span>
                <span className={styles['rch']}>{format(props.alias[1])}</span>
              </span>
            ))(
              props.aliasType === 'yield'
                ? (v) => (typeof v === 'string' ? v : displayPercentage(v))
                : (v) => {
                    if (typeof v === 'string') return v;
                    return v ? `${amountFormatter(v, 1)}x` : '0x';
                  },
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Right = (props: BaseProps & { data: Partial<PositionInfo> }) => {
  const [t] = useTranslation('ProjectedReturns');
  const position = props.data;
  const product = position.product;
  if (!position.amounts || !position.pricesForCalculation || !product)
    return <div className={styles['profit-scenarios']} />;
  const prices = position.pricesForCalculation;
  const isRisky = product.vault.riskType === RiskType.RISKY;
  const commonProps = {
    depositCcy: product.vault.depositCcy,
    depositAmount: Number(position.amounts.own),
    depositLabel: isRisky ? t('Purchase Amount') : t('Deposit Amount'),
    aliasType: isRisky ? 'multiplier' : 'yield',
  } as const;
  const returnSituationsDesc =
    ProductTypeRefs[product.vault.productType].returnSituationsDesc(t);
  const rchMultiplier = Number(position.oddsInfo?.rch) || 0;
  const maxMultiplier = [
    Number(position.oddsInfo?.max) || 0,
    rchMultiplier,
  ] as [number, number];
  const minMultiplier = [
    Number(position.oddsInfo?.min) || 0,
    rchMultiplier,
  ] as [number, number];
  const isTrend = [ProductType.BearSpread, ProductType.BullSpread].includes(
    product.vault.productType,
  );
  const isRangebound = [ProductType.DNT].includes(product.vault.productType);
  const hasExpired = Number(product.expiry) * 1000 <= Date.now();
  const showScenario = {
    max: !hasExpired || !isTrend || Number(position.takerAllocationRate) === 1,
    middle:
      !hasExpired ||
      !isTrend ||
      (Number(position.takerAllocationRate) > 0 &&
        Number(position.takerAllocationRate) < 1),
    min: !hasExpired || !isTrend || Number(position.takerAllocationRate) === 0,
  };
  return (
    <>
      {showScenario.max && (
        <ProfitScenario
          {...commonProps}
          prices={prices}
          className={classNames({
            [styles['highlight']]:
              hasExpired &&
              isRangebound &&
              Number(position.takerAllocationRate) > 0,
          })}
          title={returnSituationsDesc.max}
          img={isRangebound && <RangeboundImg data={position} type="win" />}
          rchReturnAmount={+position.amounts.rchAirdrop}
          amount={
            simplePlus(
              position.amounts.maxRedeemable,
              isRisky ? 0 : -position.amounts.own,
            )!
          }
          amountLabel={
            isRisky ? (
              t('Payout')
            ) : (
              <>
                {t('Profits')}
                <span className={styles['badge-est']}>| {t('Est.')}</span>
              </>
            )
          }
          alias={
            isRisky
              ? maxMultiplier
              : [
                  Number(position.apyInfo?.max) || 0,
                  Number(position.apyInfo?.rch) || 0,
                ]
          }
          aliasLabel={
            isRisky ? (
              t('Return')
            ) : (
              <>
                {t('Annualized Yield(APY)')}
                <span className={styles['badge-est']}>| {t('Est.')}</span>
              </>
            )
          }
        />
      )}
      {showScenario.middle && returnSituationsDesc.middle && (
        <ProfitScenario
          {...commonProps}
          prices={prices}
          title={returnSituationsDesc.middle.situation}
          rchReturnAmount={+position.amounts.rchAirdrop}
          amount={`(${amountFormatter(
            simplePlus(
              position.amounts.minRedeemable,
              isRisky ? 0 : -position.amounts.own,
            ),
            2,
          )}~${amountFormatter(
            simplePlus(
              position.amounts.maxRedeemable,
              isRisky ? 0 : -position.amounts.own,
            ),
            2,
          )})`}
          amountLabel={
            isRisky ? (
              t('Payout')
            ) : (
              <>
                {t('Profits')}
                <span className={styles['badge-est']}>| {t('Est.')}</span>
              </>
            )
          }
          alias={
            isRisky
              ? [`(0x~${amountFormatter(maxMultiplier[0], 1)}x)`, rchMultiplier]
              : [
                  `(${displayPercentage(
                    position.apyInfo?.min,
                  )}~${displayPercentage(position.apyInfo?.max)})`,
                  Number(position.apyInfo?.rch) || 0,
                ]
          }
          aliasLabel={
            isRisky ? (
              t('Return')
            ) : (
              <>
                {t('Annualized Yield(APY)')}
                <span className={styles['badge-est']}>| {t('Est.')}</span>
              </>
            )
          }
        />
      )}
      {showScenario.min && (
        <ProfitScenario
          {...commonProps}
          prices={prices}
          className={classNames({
            [styles['highlight-red']]:
              hasExpired &&
              isRangebound &&
              Number(position.takerAllocationRate) <= 0,
          })}
          title={returnSituationsDesc.min}
          img={isRangebound && <RangeboundImg data={position} type="lose" />}
          rchReturnAmount={+position.amounts.rchAirdrop}
          amount={
            simplePlus(
              position.amounts.minRedeemable,
              isRisky ? 0 : -position.amounts.own,
            )!
          }
          amountLabel={
            isRisky ? (
              t('Payout')
            ) : (
              <>
                {t('Profits')}
                <span className={styles['badge-est']}>| {t('Est.')}</span>
              </>
            )
          }
          alias={
            isRisky
              ? minMultiplier
              : [
                  Number(position.apyInfo?.min) || 0,
                  Number(position.apyInfo?.rch) || 0,
                ]
          }
          aliasLabel={
            isRisky ? (
              t('Return')
            ) : (
              <>
                {t('Annualized Yield(APY)')}
                <span className={styles['badge-est']}>| {t('Est.')}</span>
              </>
            )
          }
        />
      )}
    </>
  );
};
export const ProjectedReturns = (
  props: BaseProps & { data: Partial<PositionInfo> & { vault: VaultInfo } },
) => {
  const [t] = useTranslation('ProjectedReturns');
  const position = props.data;
  const product = position.product;
  const [basedCcy, setBasedCcy] = useState<CCY | USDS | undefined>(undefined);
  useEffect(() => {
    if (!basedCcy && position.vault.depositBaseCcy) {
      setBasedCcy(position.vault.depositBaseCcy);
    }
  }, [basedCcy, position]);
  if (!position.amounts || !position.pricesForCalculation || !product)
    return <div className={styles['profit-scenarios']} />;
  const isTrend = [ProductType.BearSpread, ProductType.BullSpread].includes(
    product.vault.productType,
  );
  const hasExpired = Number(product.expiry) * 1000 <= Date.now();

  return (
    <section className={styles['section']}>
      <h2 className={styles['h']}>
        {/* <span className={styles['icon']}>♦</span> */}
        {hasExpired ? t('Settlement Outcome') : t('Potential Scenarios')}
      </h2>
      <div
        className={classNames(styles['profit-scenarios'], props.className, {
          [styles['highlight']]: hasExpired && isTrend,
          [styles['highlight-red']]:
            hasExpired && isTrend && Number(position.takerAllocationRate) <= 0,
          [styles['is-trend']]: isTrend,
          [styles['expired']]: hasExpired,
        })}
        style={props.style}
      >
        {isTrend && (
          <div className={styles['out-left']}>
            <TrendImg
              data={
                basedCcy == position.vault.depositBaseCcy
                  ? {
                      ...position,
                      ...position.convertedCalculatedInfoByDepositBaseCcy,
                    }
                  : position
              }
            />
          </div>
        )}
        <div className={styles['out-right']}>
          {basedCcy ? (
            <>
              <RadioGroup
                type="button"
                buttonSize="small"
                value={basedCcy}
                className={styles['base-ccy-select']}
                onChange={(v) => setBasedCcy(v.target.value)}
              >
                <Radio value={position.vault.depositBaseCcy}>
                  {position?.vault.depositBaseCcy}
                </Radio>
                <Radio value={position.vault.depositCcy}>
                  {position.vault.depositCcy}
                </Radio>
              </RadioGroup>
              {basedCcy == position.vault?.depositBaseCcy ? (
                <Right
                  data={{
                    ...position,
                    ...position.convertedCalculatedInfoByDepositBaseCcy,
                  }}
                />
              ) : (
                <Right {...props} />
              )}
            </>
          ) : (
            <Right {...props} />
          )}
        </div>
      </div>
    </section>
  );
};
