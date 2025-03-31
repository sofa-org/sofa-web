import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, RiskType } from '@sofa/services/products';
import classNames from 'classnames';

import { useIsMobileUI } from '@/components/MobileOnly';

import { Comp as ImgContent } from './assets/bg-content.svg';
import { Comp as ImgContentMobile } from './assets/bg-content-mobile.svg';

import styles from './DualDesc.module.scss';
export const DualDesc = (
  product: PartialRequired<ProductQuoteResult, 'vault'>,
) => {
  const [t] = useTranslation('ProductStrategy'); //有问题
  const isMobileUI = useIsMobileUI();
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>{t('Product Overview')}</h2>
      <div className={classNames(styles['content'])}>
        {isMobileUI ? (
          <ImgContentMobile className={styles['full-width']} />
        ) : (
          <ImgContent className={styles['full-width']} />
        )}
      </div>
      <div className={classNames(styles['desc-list'])}>
        <div className={styles['desc']}>
          <p
            dangerouslySetInnerHTML={{
              __html: t(
                `Inception: The full user deposit and market maker exposure amounts will be locked on the SOFA contract.`,
              ),
            }}
          />
        </div>
        <div className={styles['desc']}>
          <p
            dangerouslySetInnerHTML={{
              __html: t(
                `Pre-Expiry: Market maker has a right to execute the token swap within the liquidity pool at the user's Target Price.`,
              ),
            }}
          />
        </div>
        <div className={styles['desc']}>
          <p
            dangerouslySetInnerHTML={{
              __html: t(
                'Expiry: Total pool amount will be settled and returned to user, paid either in USDT or the underlying token depending on the market outcome.',
              ),
            }}
          />
        </div>
      </div>
    </section>
  );
};
