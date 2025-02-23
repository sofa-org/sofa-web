import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResultDual, RiskType } from '@sofa/services/products';
import classNames from 'classnames';

import { useIsMobileUI } from '@/components/MobileOnly';

import { Comp as ImgContent } from './assets/bg-content.svg';
import { Comp as ImgContentMobile } from './assets/bg-content-mobile.svg';

import styles from './DualDesc.module.scss';
export const DualDesc = (
  product: PartialRequired<ProductQuoteResultDual, 'vault'>,
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
                `At the start, the user's deposited funds and the reward amount promised by the market maker are both locked in SOFA contract.`,
              ),
            }}
          />
        </div>
        <div className={styles['desc']}>
          <p
            dangerouslySetInnerHTML={{
              __html: t(
                `Before the expiry date, the market maker has the right to execute a swap within the liquidity pool at the user's specified target price.`,
              ),
            }}
          />
        </div>
        <div className={styles['desc']}>
          <p
            dangerouslySetInnerHTML={{
              __html: t(
                'Upon expiry, the total amount in the pool will be settled and returned to the user. At this point, the user may receive either USDT or the underlying asset.',
              ),
            }}
          />
        </div>
      </div>
    </section>
  );
};
