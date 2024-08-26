import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isElementInView, scrollToElement } from '@livelybone/scroll-get';
import { VaultInfo } from '@sofa/services/base-type';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import { Comp as HotImg } from './assets/icon-hot.svg';
import { Comp as NewImg } from './assets/icon-new.svg';
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
              {ccy}
              {ccy === 'RCH' && <HotImg className={styles['icon']} />}
              {ccy === 'stETH' && <NewImg className={styles['icon']} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
