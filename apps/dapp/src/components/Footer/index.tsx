import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import classNames from 'classnames';

import { Comp as Logo } from '@/assets/logo';

import { LinkItems } from '../Community/config';
import { MobileConsole } from '../MobileConsole';

import styles from './index.module.scss';

const Footer = () => {
  const [t] = useTranslation('Footer');
  const location = useLocation();
  const isSOFA = useMemo(
    () => !/positions|products/.test(location.pathname),
    [location.pathname],
  );

  return (
    <footer className={styles['footer']}>
      <div className={styles['nav']}>
        <div className={styles['left']}>
          {LinkItems.map((it) => (
            <a
              href={it.link}
              key={it.name(t)}
              target={Env.isMetaMaskAndroid ? undefined : '_blank'}
              rel="noopener noreferrer"
            >
              {it.name(t)}
            </a>
          ))}
        </div>
        <div className={styles['copyright']}>
          © 2024 sofa.org All Right Reserved.
          <a href={import.meta.env.VITE_SOFA_LINK}>
            <Logo />
          </a>
        </div>
      </div>
      <div
        className={classNames(styles['bar'], {
          [styles['no-decoration']]: !isSOFA,
        })}
      />
      {(Env.isDev || (!Env.isProd && Env.isMobile)) && <MobileConsole />}
    </footer>
  );
};

export default Footer;
