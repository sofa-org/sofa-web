import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteResult,
  RiskType,
  VaultInfo,
} from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import locale from './locale';

addI18nResources(locale, 'FeeStructure');
import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import enUS from '@/locales/en-US';

import styles from './index.module.scss';

export const FeeStructure = (product: Partial<ProductQuoteResult>) => {
  const [t] = useTranslation('FeeStructure');
  const dualDesc: Partial<Record<`${VaultInfo['forCcy']}`, string>> = {
    [`${'CRV'}`]: t({
      enUS: `For CRV/crvUSD - Buy Low product, users deposit crvUSD, which is automatically placed into Curve protocol. The interest earned is collected by SOFA as the fee, so users <strong>do not need to pay any additional trading fees</strong>.<br/><br/>
For CRV/crvUSD - Sell High product, users deposit CRV and must pay <strong>15% of the option premium</strong> (the Extra Reward) as a trading fee.`,
    }),
    [`${'RCH'}`]: t({
      enUS: `For RCH/USDT - Buy Low product, users deposit USDT, which is placed into the Aave protocol to earn yield.<br/><br/>
For RCH/USDT - Sell High product, users deposit RCH, which is placed into the SOFA protocol to earn yield.<br/><br/>
In both cases, the interest earned is collected by SOFA as the fee, so users <strong>do not need to pay any additional trading fees</strong>.`,
    }),
  };
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎︎♥</span> */}
        {t('Fee Structure')}
      </h2>
      <div className={styles['content']}>
        {product.vault?.riskType == RiskType.DUAL ? (
          <div
            dangerouslySetInnerHTML={{
              __html: dualDesc[product.vault.forCcy] || '',
            }}
          />
        ) : (
          <>
            {t(
              "SOFA will collect 15% of the user's option premium as a base trading fee.  Furthermore, in the event of a 'winning' payout occurring for the user, a further 5% settlement fee will be charged against the total Gross Upside Winnings.",
            )}
            <br />
            <br />
            {t('All the fees will be used to purchase and burn RCH tokens.')}
          </>
        )}
      </div>
    </section>
  );
};
