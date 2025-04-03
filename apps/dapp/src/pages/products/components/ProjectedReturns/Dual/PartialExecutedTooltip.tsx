import { useMemo } from 'react';
import { CCYService } from '@sofa/services/ccy';
import { DualProfitRenderProps } from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';

import { useLivePPS } from '@/components/IndexPrices/store';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';

import styles from './PartialExecutedTooltip.module.scss';
export const PartialExecutedTooltip = (props: DualProfitRenderProps) => {
  const [t] = useTranslation('ProjectedReturns');
  const rchPrice = useLivePPS({
    forCcy: 'RCH',
    domCcy: 'USDT',
  });
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
          zhCN: '仍获得双币收益和RCH空投',
        })}
      </div>
      <div className={styles['body']}>
        <div className={styles['left']}>
          <div className={styles['label']}>
            {ProductTypeRefs[props.productType].dualIsBuy
              ? t({
                  enUS: 'Deposit Reward + Partial Buy Low',
                  zhCN: '双币收益 + 部分低买',
                })
              : t({
                  enUS: 'Deposit Reward + Partial Sell High',
                  zhCN: '双币收益 + 部分高卖',
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
            {t({ enUS: 'RCH Airdrop | Est.', zhCN: 'RCH空投 | 估计' })}
          </div>
          <div className={styles['value']}>
            <span className={styles['amount']}>
              <img src={CCYService.ccyConfigs['RCH']?.icon} />
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
