import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { Env } from '@sofa/utils/env';
import classNames from 'classnames';

const mobileUIWidthThreshold = 500;

export const isMobileUI = (recalc?: boolean) => {
  // align w/ index.mobile.scss
  return (
    window.innerWidth <= mobileUIWidthThreshold ||
    (window.innerWidth <= window.innerHeight &&
      (recalc ? Env.recalcIsMobile() : Env.isMobile))
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
export const useIsPortraitUI = ({
  widthThreshold = 0,
}: {
  widthThreshold: number | undefined;
}) => {
  const [_isPortraitUI, _setIsPortraitUI] = useState(
    window.innerWidth <= widthThreshold ||
      window.innerWidth <= window.innerHeight,
  );
  useEffect(() => {
    const onResize = function (evt: UIEvent) {
      _setIsPortraitUI(
        window.innerWidth <= widthThreshold ||
          window.innerWidth <= window.innerHeight,
      );
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return _isPortraitUI;
};
export const MobileOnly = (
  props: BaseProps & {
    display?: CSSProperties['display'];
  },
) => {
  const isMobileUI = useIsMobileUI();
  const additionalStyles = useMemo<CSSProperties>(() => {
    if (props.display) {
      // use display
      return isMobileUI
        ? {
            display: props.display,
          }
        : {
            display: 'none',
          };
    }
    return isMobileUI
      ? {
          visibility: 'visible',
        }
      : {
          visibility: 'collapse',
        };
  }, [isMobileUI]);
  return (
    <div
      className={classNames('mobile-only', props.className)}
      id={props.id}
      style={{
        ...props.style,
        ...additionalStyles,
      }}
    >
      {props.children}
    </div>
  );
};

export const PcOnly = (
  props: BaseProps & {
    display?: CSSProperties['display'];
  },
) => {
  const isMobileUI = useIsMobileUI();
  const additionalStyles = useMemo<CSSProperties>(() => {
    if (props.display) {
      // use display
      return !isMobileUI
        ? {
            display: props.display,
          }
        : {
            display: 'none',
          };
    }
    return !isMobileUI
      ? {
          visibility: 'visible',
        }
      : {
          visibility: 'collapse',
        };
  }, [isMobileUI]);
  return (
    <div
      className={classNames('pc-only', props.className)}
      id={props.id}
      style={{
        ...props.style,
        ...additionalStyles,
      }}
    >
      {props.children}
    </div>
  );
};
