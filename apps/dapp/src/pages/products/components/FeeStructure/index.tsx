import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteResult,
  RiskType,
  VaultInfo,
} from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import locale from './locale';

addI18nResources(locale, 'FeeStructure');

import styles from './index.module.scss';

export const FeeStructure = (product: Partial<ProductQuoteResult>) => {
  const [t] = useTranslation('FeeStructure');
  const dualDesc: Partial<Record<`${VaultInfo['forCcy']}`, string>> = {
    [`${'CRV'}`]: t({
      enUS: "For CRV/crvUSD:\n'Buy Low' Product:  No additional fees;\n'Sell High' Product:  15% of the option premium will be charged as fees.",
      zhCN: '针对CRV/crvUSD：\n“低价买入”产品：无额外费用；\n“高价卖出”产品：将收取期权溢价的15%作为费用。',
    }),
    [`${'RCH'}`]: t({
      enUS: 'For RCH/USDT:\nNo additional trading fees will be charged on any RCH/USDT Dual products.',
      zhCN: '针对RCH/USDT：\n任何RCH/USDT 双币产品均不收取额外的交易费用。',
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
              __html:
                dualDesc[product.vault.forCcy]?.replace('\n', '<br />') || '',
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
