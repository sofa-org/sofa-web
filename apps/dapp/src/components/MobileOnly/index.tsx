import { useEffect, useState } from 'react';
import { Env } from '@sofa/utils/env';
import classNames from 'classnames';
import { esbuildVersion } from 'vite';

import styles from './index.module.scss';
export const isMobileUI = (recalc?: boolean) => {
  // align w/ index.mobile.scss
  return (
    (recalc ? Env.recalcIsMobile() : Env.isMobile) || window.innerWidth <= 500
  );
};
export const useIsMobileUI = () => {
  const [_isMobileUI, _setIsMobileUI] = useState(isMobileUI());
  useEffect(() => {
    const onResize = function (evt: UIEvent) {
      _setIsMobileUI(isMobileUI(true));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return _isMobileUI;
};
export const MobileOnly = (props: BaseProps) => {
  return (
    <div
      className={classNames(styles['mobile-only'], props.className)}
      id={props.id}
      style={props.style}
    >
      {props.children}
    </div>
  );
};
