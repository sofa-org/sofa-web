import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult } from '@sofa/services/products';
import classNames from 'classnames';

import { useIsMobileUI } from '@/components/MobileOnly';

import { Comp as ImgContent } from './assets/bg-content.svg';
import { Comp as ImgContentMobile } from './assets/bg-content-mobile.svg';

import styles from './DualDesc.module.scss';
export const DualDesc = (
  product: PartialRequired<ProductQuoteResult, 'vault'>,
) => {
  const [t] = useTranslation('ProductStrategy');
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
              __html: t({
                enUS: 'Inception: The full user deposit and market maker exposure amounts will be locked on the SOFA contract.',
                zhCN: '初始阶段：用户全额存款和做市商的风险敞口金额将锁定在SOFA合约中。',
              }),
            }}
          />
        </div>
        <div className={styles['desc']}>
          <p
            dangerouslySetInnerHTML={{
              __html: t({
                enUS: "Pre-Expiry: Market maker has a right to execute the token swap within the liquidity pool at the user's Target Price.",
                zhCN: '到期前：做市商有权在流动性池内按用户的目标价格执行代币置换。',
              }),
            }}
          />
        </div>
        <div className={styles['desc']}>
          <p
            dangerouslySetInnerHTML={{
              __html: t({
                enUS: 'Expiry: Total pool amount will be settled and returned to user, paid either in USDT or the underlying token depending on the market outcome.',
                zhCN: '到期：总池金额将结算并返还给用户，支付方式取决于市场结果，可能是USDT或基础代币。',
              }),
            }}
          />
        </div>
      </div>
    </section>
  );
};
