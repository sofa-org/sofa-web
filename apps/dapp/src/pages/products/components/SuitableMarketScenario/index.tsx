import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, RiskType } from '@sofa/services/products';

import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'SuitableMarketScenario');
export const SuitableMarketScenario = (
  product: PartialRequired<ProductQuoteResult, 'vault'>,
) => {
  const [t] = useTranslation('SuitableMarketScenario');
  if (product.vault.riskType == RiskType.DUAL) {
    return undefined;
  }
  const ref = ProductTypeRefs[product.vault.productType];
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎✹︎</span> */}
        {t('Suitable Scenario')}
      </h2>
      <div className={styles['content']}>{ref.suitableDesc(t)}</div>
    </section>
  );
};
