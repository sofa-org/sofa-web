import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Radio, RadioGroup } from '@douyinfe/semi-ui';
import { RiskType, VaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo } from '@sofa/services/positions';
import { ProductQuoteResult } from '@sofa/services/products';
import {
  amountFormatter,
  cvtAmountsInCcy,
  displayPercentage,
} from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';
addI18nResources(locale, 'ProfitsRenders');

export interface ProfitRenderProps extends BaseProps {
  title?: ReactNode;
  depositCcy: VaultInfo['depositCcy'];
  rchReturnAmount: number; // RCH 空投金额
  amount: number; // 显示金额，可能为负
  amountLabel: string;
  aliasType: 'yield' | 'Return';
  alias: number; // 显示年华 or 倍数
  aliasLabel: string;
  prices: PositionInfo['pricesForCalculation'];
}

const ProfitRender = (props: ProfitRenderProps) => {
  const [t] = useTranslation('ProfitsRenders');
  const prices = props.prices;
  const allProfitInDepositCcy = useMemo(
    () =>
      cvtAmountsInCcy(
        [
          [props.depositCcy, props.amount],
          ['RCH', props.rchReturnAmount],
        ],
        prices,
        props.depositCcy,
      ),
    [prices, props.amount, props.depositCcy, props.rchReturnAmount],
  );
  return (
    <div className={styles['profit-render-wrapper']}>
      {props.title && <div className={styles['title']}>{props.title}:</div>}
      <div className={styles['profit-render']}>
        <div className={styles['item']}>
          <span className={styles['label']}>{props.amountLabel}</span>
          <span
            className={styles['value']}
            style={{
              color:
                allProfitInDepositCcy >= 0
                  ? 'var(--color-rise)'
                  : 'var(--color-gray)',
            }}
          >
            {allProfitInDepositCcy >= 0 ? '+' : ''}
            {amountFormatter(allProfitInDepositCcy, 2)}
            <span className={styles['unit']}>{props.depositCcy}</span>
          </span>
          <span className={styles['value-desc']}>
            ({amountFormatter(props.amount, 2)}
            <span className={styles['unit']}>{props.depositCcy}</span> +{' '}
            <span className={styles['rch']}>
              {amountFormatter(props.rchReturnAmount, 2)}
              <span className={styles['unit']}>
                RCH <span>| {t('Est.')}</span>
              </span>
            </span>
            )
          </span>
        </div>
        <div className={styles['item']}>
          <span className={styles['label']}>{props.aliasLabel}</span>
          {((format: (v: number) => string) => (
            <span
              className={styles['value']}
              style={{
                color:
                  props.alias >= 0 ? 'var(--color-rise)' : 'var(--color-gray)',
              }}
            >
              {format(props.alias)}
            </span>
          ))(
            props.aliasType === 'yield'
              ? displayPercentage
              : (v) => (v ? `${amountFormatter(v, 1)}x` : '0x'),
          )}
        </div>
      </div>
    </div>
  );
};

export const ProfitsRenderNoBaseCcySelect = (
  props: BaseProps & { data: Partial<PositionInfo> },
) => {
  const [t] = useTranslation('ProfitsRenders');
  const position = props.data;
  const product = position.product;
  if (!position.amounts || !position.pricesForCalculation || !product)
    return <div className={styles['profits-render']} />;
  const isRisky = product.vault.riskType === RiskType.RISKY;
  const commonProps = {
    depositCcy: product.vault.depositCcy,
    aliasType: isRisky ? 'Return' : 'yield',
  } as const;
  const returnSituationsDesc =
    ProductTypeRefs[product.vault.productType].returnSituationsDesc(t);
  const maxMultiplier =
    simplePlus(position.oddsInfo?.max, position.oddsInfo?.rch) || 0;
  const minMultiplier =
    simplePlus(position.oddsInfo?.min, position.oddsInfo?.rch) || 0;
  return (
    <div
      className={classNames(styles['profits-render'], props.className)}
      style={props.style}
    >
      <ProfitRender
        {...commonProps}
        prices={position.pricesForCalculation}
        title={returnSituationsDesc.max}
        rchReturnAmount={+position.amounts.rchAirdrop}
        amount={
          simplePlus(
            position.amounts.maxRedeemable,
            -(position.amounts.own || 0),
          )!
        }
        amountLabel={isRisky ? t('Potential Payout') : t('Potential Profits')}
        alias={
          isRisky
            ? maxMultiplier
            : simplePlus(position.apyInfo?.max, position.apyInfo?.rch)!
        }
        aliasLabel={isRisky ? t('Potential Return') : t('Potential Yield(APY)')}
      />
      <ProfitRender
        {...commonProps}
        prices={position.pricesForCalculation}
        title={returnSituationsDesc.min}
        rchReturnAmount={+position.amounts.rchAirdrop}
        amount={
          simplePlus(
            position.amounts.minRedeemable,
            -(position.amounts.own || 0),
          )!
        }
        amountLabel={isRisky ? t('Base+ Payout') : t('Base+ Profits')}
        alias={
          isRisky
            ? minMultiplier
            : simplePlus(position.apyInfo?.min, position.apyInfo?.rch)!
        }
        aliasLabel={isRisky ? t('Base+ Return') : t('Base+ Yield(APY)')}
      />
      {returnSituationsDesc.middle && (
        <div
          className={styles['profit-render-wrapper']}
          key={returnSituationsDesc.middle.situation}
        >
          <div
            className={styles['title']}
            dangerouslySetInnerHTML={{
              __html: `${returnSituationsDesc.middle.situation}:`,
            }}
          />
          <div className={styles['profit-render']}>
            <div
              className={styles['profit-brief']}
              dangerouslySetInnerHTML={{
                __html: returnSituationsDesc.middle.description,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const ProfitsRender = (
  props: BaseProps & {
    data: ProductQuoteResult;
    baseCcy?: CCY | USDS;
    setBaseCcy: (ccy: CCY | USDS) => void;
  },
) => {
  const data = props.data;
  return (
    <>
      {props.baseCcy ? (
        <>
          <RadioGroup
            type="button"
            buttonSize="small"
            value={props.baseCcy}
            className={styles['base-ccy-select']}
            onChange={(v) => props.setBaseCcy(v.target.value)}
          >
            <Radio value={data.vault.depositBaseCcy}>
              {data.vault.depositBaseCcy}
            </Radio>
            <Radio value={data.vault.depositCcy}>{data.vault.depositCcy}</Radio>
          </RadioGroup>
          {props.baseCcy == data.vault.depositBaseCcy ? (
            <ProfitsRenderNoBaseCcySelect
              data={{
                ...data,
                ...data.convertedCalculatedInfoByDepositBaseCcy,
                product: {
                  ...data,
                  ...data.convertedCalculatedInfoByDepositBaseCcy,
                  vault: {
                    ...data.vault,
                    depositCcy: data.vault.depositBaseCcy,
                  },
                },
              }}
            />
          ) : (
            <ProfitsRenderNoBaseCcySelect data={{ ...data, product: data }} />
          )}
        </>
      ) : (
        <ProfitsRenderNoBaseCcySelect data={{ ...data, product: data }} />
      )}
    </>
  );
};
