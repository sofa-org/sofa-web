import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult } from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import { Comp as ImgReturn } from './assets/img.svg';
import { Comp as ImgReturnLido } from './assets/img-lido.svg';
import locale from './locale';
addI18nResources(locale, 'ProductStrategy');

import styles from './index.module.scss';

export const ProductStrategy = (product: Partial<ProductQuoteResult>) => {
  const [t] = useTranslation('ProductStrategy');
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>♣</span> */}
        {t('Product Overview')}
      </h2>
      <div className={styles['content']}>
        <div className={styles['left']}>
          {product.vault?.depositCcy !== 'stETH' ? (
            <ImgReturn />
          ) : (
            <ImgReturnLido />
          )}
        </div>
        <div className={styles['right']}>
          <div className={styles['desc']}>
            <p
              dangerouslySetInnerHTML={{
                __html: t(
                  'For EARN Products (Secured), all invested amounts will be staked in the Aave/Lido/Sofa/Curve/Avalon protocol to generate passive returns.',
                ),
              }}
            />
          </div>
          <div className={styles['desc']}>
            <p
              dangerouslySetInnerHTML={{
                __html: t(
                  'Moreover, a portion of the Aave/Lido/Sofa/Curve/Avalon returns will be retained as Base Yield, and the remaining part will be deployed to option strategies to generate potential Upside returns.',
                ),
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
