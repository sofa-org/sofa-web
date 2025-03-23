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
  return (
    <div className={styles['content']}>
      <div className={styles['title']}>
        {t({
          enUS: 'In extreme cases, partial execution may occur, and you can still get Deposit Rewards and RCH Airdrops',
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
            ≈
            <span className={styles['amount']}>
              {amountFormatter(
                props.depositAmount + props.depositCcyExtraRewardWhenNoExecuted,
                CCYService.ccyConfigs[props.depositCcy]?.precision,
              )}
            </span>
            <span className={styles['unit']}>
              {CCYService.ccyConfigs[props.depositCcy]?.name ||
                props.depositCcy}
            </span>
            <span className={styles['ccys']}>
              {'['}
              {CCYService.ccyConfigs[props.linkedCcy]?.name || props.linkedCcy}+
              {CCYService.ccyConfigs[props.depositCcy]?.name ||
                props.depositCcy}
              {']'}
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
            <span className={styles['amount']}>
              {amountFormatter(
                props.rchReturnAmount,
                CCYService.ccyConfigs['RCH']?.precision,
              )}
            </span>
            <span className={styles['unit']}>RCH</span>
          </div>
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
  );
};
