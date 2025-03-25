import { useMemo } from 'react';
import { ProductType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { useIndexPrices } from '@/components/IndexPrices/store';
import { useIsMobileUI } from '@/components/MobileOnly';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';

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
  const mobileUI = useIsMobileUI();
  return (
    <div
      className={classNames(
        styles['payoff'],
        'payoff',
        props.productType == ProductType.BullSpread
          ? styles['buy-low']
          : styles['sell-high'],
        {
          [styles['mobile-ui']]: mobileUI,
        },
      )}
    >
      <div className={styles['payoff-infos']}>
        <div className={styles['apy']}>
          {displayPercentage(maxApy)}
          <span>{t({ enUS: 'APY', zhCN: '年华' })}</span>
        </div>
        <div className={styles['payoff-chart']}>
          {ProductTypeRefs[props.productType]
            .dualDesc(t)
            .op3.replace('{price}', String(props.anchorPrices[0]))}
        </div>
        <div className={styles['ccys']}>
          <img src={CCYService.ccyConfigs[props.depositCcy]?.icon} />
          <div className={styles['icon-arrow']} />

          <img
            src={
              CCYService.ccyConfigs[
                props.depositCcy == props.forCcy ? props.domCcy : props.forCcy
              ]?.icon
            }
          />
        </div>
      </div>
    </div>
  );
};
export default DualPayoff;
