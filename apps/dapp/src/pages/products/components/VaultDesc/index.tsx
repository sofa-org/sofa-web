import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult } from '@sofa/services/products';

import Address from '@/components/Address';
import { addI18nResources } from '@/locales';

import locale from './locale';

addI18nResources(locale, 'VaultDesc');
import styles from './index.module.scss';

export const VaultDesc = (
  product: PartialRequired<ProductQuoteResult, 'vault'>,
) => {
  const [t] = useTranslation('VaultDesc');
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎︎♥</span> */}
        {t('Vault')}
      </h2>
      <div className={styles['content']}>
        <div className={styles['address']}>
          {product.vault && (
            <Address
              address={product.vault.vault.toLowerCase()}
              prefix={t('CONTRACT: ')}
              link
            />
          )}
        </div>
      </div>
    </section>
  );
};
