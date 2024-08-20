import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isElementInView, scrollToElement } from '@livelybone/scroll-get';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import hotImg from './assets/hot.png';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ProductsFixedNav');
export interface ProductsFixedNavProps {
  depositCcyList: VaultInfo['depositCcy'][];
}

export const ProductsFixedNav = (props: ProductsFixedNavProps) => {
  const [t] = useTranslation('ProductsFixedNav');
  const [active, setActive] = useState(props.depositCcyList[0]);

  useEffect(() => {
    const handler = () => {
      for (let i = 0; i < props.depositCcyList.length; i += 1) {
        const ccy = props.depositCcyList[i];
        const el = document.querySelector<HTMLElement>(`#recommend-${ccy}`)!;
        if (isElementInView(el)) {
          setActive(ccy);
          break;
        }
      }
    };
    document.querySelector('#root')?.addEventListener('scroll', handler);
    return () =>
      document.querySelector('#root')?.removeEventListener('scroll', handler);
  }, [props.depositCcyList]);

  if (props.depositCcyList.length <= 1) return <></>;
  return (
    <div className={styles['products-fixed-nav-wrapper']}>
      <div className={styles['products-fixed-nav']}>
        <span className={styles['title']}>{t('Deposit')}</span>
        {props.depositCcyList.map((ccy) => {
          const config = CCYService.ccyConfigs[ccy];
          return (
            <div
              key={ccy}
              className={classNames(styles['ccy'], ccy.toLowerCase(), {
                [styles['active']]: active === ccy,
                [styles['hot']]: ccy === 'RCH',
              })}
              onClick={() =>
                scrollToElement(document.querySelector(`#recommend-${ccy}`)!, {
                  offset: -80,
                })
              }
            >
              <img src={config?.icon} alt="" />
              {ccy}
              {ccy === 'RCH' && (
                <img className={styles['img-hot']} src={hotImg} alt="" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
