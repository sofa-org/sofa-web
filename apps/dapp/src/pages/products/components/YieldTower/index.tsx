import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, RiskType } from '@sofa/services/products';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import { Comp as ImgReturn } from './assets/img-return.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'YieldTower');

export const YieldTower = (
  product: PartialRequired<ProductQuoteResult, 'vault'>,
) => {
  const [t] = useTranslation('YieldTower');
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>♠︎</span> */}
        {t('Yield Tower')}
      </h2>
      <div
        className={classNames(styles['content'], {
          [styles['leverage']]: product.vault?.riskType === RiskType.LEVERAGE,
        })}
      >
        <ImgReturn className={styles['full-width']} />
      </div>
    </section>
  );
};
