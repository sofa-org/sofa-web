import { useMemo } from 'react';
import { ProductType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { useIndexPrices } from '@/components/IndexPrices/store';

import { PayoffProps } from '..';

import styles from './index.module.scss';

const DualPayoff = (
  props: PayoffProps & {
    domCcy: string;
  },
) => {
  const [t] = useTranslation('Payoff');

  const maxApy = useMemo(
    () =>
      simplePlus(props.rchYield, props.protectedYield, props.enhancedYield)!,
    [props.enhancedYield, props.protectedYield, props.rchYield],
  );
  const atm = useIndexPrices((state) => state.prices[props.forCcy]);

  return (
    <div
      className={classNames(
        styles['payoff'],
        'payoff',
        props.productType == ProductType.BullSpread
          ? styles['buy-low']
          : styles['sell-high'],
      )}
    >
      <div className={styles['payoff-infos']}>
        <div className={styles['apy']}>
          {displayPercentage(maxApy)}
          <span>{t({ enUS: 'APY' })}</span>
        </div>
        <div className={styles['payoff-chart']}>
          {props.productType == ProductType.BullSpread
            ? t({ enUS: 'Buy Low' })
            : t({ enUS: 'Sell High' })}
        </div>
        <div className={styles['ccys']}>
          <img src={CCYService.ccyConfigs[props.depositCcy]?.icon} />
          <div className={styles['icon-arrow']} />

          <img
            src={
              CCYService.ccyConfigs[
                props.productType == ProductType.BearSpread
                  ? props.domCcy
                  : props.forCcy
              ]?.icon
            }
          />
        </div>
      </div>
    </div>
  );
};
export default DualPayoff;
