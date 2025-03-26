import { useMemo } from 'react';
import { CCYService } from '@sofa/services/ccy';
import { DualProfitRenderProps } from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';

import { useIndexPrices } from '@/components/IndexPrices/store';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';

import styles from './PartialExecutedTooltip.module.scss';
export const PartialExecutedTooltip = (props: DualProfitRenderProps) => {
  const [t] = useTranslation('ProjectedReturns');
  const rchPrice = useIndexPrices((r) => r.prices['RCH']);
  const desc = useMemo(
    () => ProductTypeRefs[props.productType].dualDesc(t),
    [t, props.productType],
  );
  return (
    <div className={styles['content']}>
      <div className={styles['title']}>{desc.partialExecuted}</div>
      <div className={styles['subtitle']}>
        {t({
          enUS: 'Still Get Deposit Rewards and RCH Airdrops',
        })}
      </div>
      <div className={styles['body']}>
        <div className={styles['left']}>
          <div className={styles['label']}>
            {ProductTypeRefs[props.productType].dualIsBuy
              ? t({
                  enUS: 'Deposit Reward + Partial Buy Low',
                })
              : t({
                  enUS: 'Deposit Reward + Partial Sell High',
                })}
          </div>
          <div className={styles['value']}>
            <span className={styles['ccys']}>
              <img src={CCYService.ccyConfigs[props.linkedCcy || '']?.icon} />
              {CCYService.ccyConfigs[props.linkedCcy]?.name || props.linkedCcy}
              <span className={styles['plus-sign']} />
              <img src={CCYService.ccyConfigs[props.depositCcy || '']?.icon} />
              {CCYService.ccyConfigs[props.depositCcy]?.name ||
                props.depositCcy}
            </span>
            <span className={styles['amount']}>
              ≈
              {amountFormatter(
                props.depositAmount + props.depositCcyExtraRewardWhenNoExecuted,
                CCYService.ccyConfigs[props.depositCcy]?.precision,
              )}{' '}
              {CCYService.ccyConfigs[props.depositCcy]?.name ||
                props.depositCcy}
            </span>
          </div>
        </div>
        <span className={styles['plus']} />
        <div className={styles['right']}>
          <div className={styles['label']}>
            {t({
              enUS: 'RCH Airdrop | Est.',
            })}
          </div>
          <div className={styles['value']}>
            <span className={styles['ccys']}>
              <img src={CCYService.ccyConfigs['RCH']?.icon} />
            </span>
            <span className={styles['amount']}>
              {amountFormatter(
                props.rchReturnAmount,
                CCYService.ccyConfigs['RCH']?.precision,
              )}{' '}
              RCH
            </span>
            {rchPrice !== undefined ? (
              <div className={styles['estimated-value']}>
                ≈
                <span className={styles['amount']}>
                  {amountFormatter(
                    props.rchReturnAmount * rchPrice,
                    CCYService.ccyConfigs['USDT']?.precision,
                  )}
                </span>
                <span className={styles['unit']}>USDT</span>
              </div>
            ) : undefined}
          </div>
        </div>
      </div>
    </div>
  );
};
