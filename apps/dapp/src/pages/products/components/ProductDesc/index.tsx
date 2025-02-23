import { ReactNode } from 'react';
import { Tabs } from '@douyinfe/semi-ui';
import { t } from '@sofa/services/i18n';
import {
  ProductQuoteResult,
  ProductQuoteResultDual,
  RiskType,
} from '@sofa/services/products';
import classNames from 'classnames';

import { ClaimWithdrawDesc } from '../ClaimWithdrawDesc';
import { FeeStructure } from '../FeeStructure';
import { OptionTrading } from '../OptionTrading';
import { ProductStrategy } from '../ProductStrategy';
import { RiskDisclosures } from '../RiskDisclosures';
import { SuitableMarketScenario } from '../SuitableMarketScenario';
import { VaultDesc } from '../VaultDesc';
import { YieldTower } from '../YieldTower';

import { DualDesc } from './Dual/DualDesc';

import styles from './index.module.scss';

const ProductDesc = (
  props: BaseProps & {
    product?: PartialRequired<ProductQuoteResult, 'vault'>;
    prefixTabs?: { itemKey: string; tab: string; element: ReactNode }[];
    noReturnTab?: boolean;
    noMoreInfo?: boolean;
    dark?: boolean;
  },
) => {
  return (
    <Tabs
      className={classNames(styles['product-desc'], props.className, {
        ['dark']: props.dark,
      })}
      style={props.style}
      lazyRender
    >
      {props.prefixTabs?.map((it) => (
        <Tabs.TabPane itemKey={it.itemKey} tab={it.tab} key={it.itemKey}>
          {it.element}
        </Tabs.TabPane>
      ))}
      {props.product && !props.noMoreInfo && (
        <Tabs.TabPane itemKey="return" tab={t('More Info')}>
          {props.product.vault.riskType === RiskType.RISKY ? (
            <OptionTrading {...props.product} />
          ) : props.product.vault.riskType === RiskType.DUAL ? (
            <DualDesc {...(props.product as ProductQuoteResultDual)} />
          ) : (
            <YieldTower {...props.product} />
          )}
          <SuitableMarketScenario {...props.product} />
          {props.product.vault.riskType !== RiskType.RISKY &&
            props.product.vault.riskType !== RiskType.DUAL && (
              <ProductStrategy {...props.product} />
            )}
          <FeeStructure {...props.product} />
          <VaultDesc {...props.product} />
          <ClaimWithdrawDesc {...props.product} />
        </Tabs.TabPane>
      )}
      <Tabs.TabPane itemKey="strategy" tab={t('Risk Disclosures')}>
        <RiskDisclosures />
      </Tabs.TabPane>
    </Tabs>
  );
};

export default ProductDesc;
