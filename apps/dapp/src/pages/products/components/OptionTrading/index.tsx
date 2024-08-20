import { useTranslation } from '@sofa/services/i18n';
import { TFunction } from '@sofa/services/i18n';
import { ProductQuoteResult, ProductType } from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import { Comp as ImgReturn } from './assets/img.svg';
import { Comp as ImgReturn1 } from './assets/img1.svg';
import { Comp as ImgReturn2 } from './assets/img2.svg';
import locale from './locale';

addI18nResources(locale, 'OptionTrading');
import styles from './index.module.scss';
// const [t] = useTranslation('OptionTrading');
const contents = {
  [ProductType.DNT]: {
    img: <ImgReturn />,
    title: (t: TFunction) =>
      t(
        'Rangebound products are speculating on a simple scenario - does the underlying price stay within the range [B1 ~ B2] or not before expiry',
      ),
    situations: (t: TFunction) => [
      t(
        'If it does, buyers will enjoy substantial Upside payoffs + RCH tokens',
      ),
      t(
        `If it doesn't, buyers will lose their deposit and receive only the RCH token airdrops`,
      ),
    ],
  },
  [ProductType.BearSpread]: {
    img: <ImgReturn1 />,

    title: (t: TFunction) =>
      t(
        'Bear Trend product offers users a cost-efficient way to speculate on a limited decline in an underlying asset. <br/>>At settlement, if the price is:',
      ),
    situations: (t: TFunction) => [
      t('below K1, maximum payout will be achieved along with RCH airdrops'),
      t(
        'between K1 and K2, payout will be on a sliding scale depending on the final settlement price',
      ),
      t(
        'above K2, users will lose their purchased amount and receive only the RCH token airdrops',
      ),
    ],
  },
  [ProductType.BullSpread]: {
    img: <ImgReturn2 />,

    title: (t: TFunction) =>
      t(
        'Bull Trend product offers users a cost-efficient way to speculate on a limited rise in an underlying asset. <br/>At settlement, if the price is:',
      ),
    situations: (t: TFunction) => [
      t('above K2, maximum payout will be achieved along with RCH airdrops'),
      t(
        'between K1 and K2, payout will be on a sliding scale depending on the final settlement price',
      ),
      t(
        'below K1, users will lose their purchased amount and receive only the RCH token airdrops',
      ),
    ],
  },
};

export const OptionTrading = (
  product: PartialRequired<ProductQuoteResult, 'vault'>,
) => {
  const [t] = useTranslation('OptionTrading');
  const content = contents[product.vault.productType];
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎♟</span> */}
        {t('Payoff Outcomes')}
      </h2>
      <div className={styles['content']}>
        <div className={styles['left']}>{content.img}</div>
        <div className={styles['right']}>
          <div className={styles['desc']}>
            <p
              className={styles['c-title']}
              dangerouslySetInnerHTML={{
                __html: content.title(t),
              }}
            />
            {content.situations(t).map((it) => (
              <p
                className={styles['c-item']}
                dangerouslySetInnerHTML={{
                  __html: it,
                }}
                key={it}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
