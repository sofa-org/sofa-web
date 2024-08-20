import { useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { useSize } from 'ahooks';
import classNames from 'classnames';

import { RiskTypeRefs } from '@/components/ProductSelector/enums';
import SplineModel from '@/components/SplineModel';
import { addI18nResources } from '@/locales';

import { Comp as CardAmount } from '../../assets/card-amount.svg';
import { Comp as CardExpiry } from '../../assets/card-expiry.svg';
import { Comp as CardPnl } from '../../assets/card-pnl.svg';
import { Comp as CardStrike } from '../../assets/card-strike.svg';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'BottomAnimation');

declare const winScale: Global['winScale'];

const CustomStars = [
  {
    id: 'pencil',
    img: () => (
      <SplineModel
        id="pencil"
        style={{ right: 0 / winScale, top: -46 / winScale }}
      />
    ),
    card: () => <CardAmount width={177 / winScale} height={84 / winScale} />,
    cardSize: [177 / winScale, 84 / winScale],
    position: [-284 / winScale, -112 / winScale],
  },
  {
    id: 'calendar',
    img: () => (
      <SplineModel
        id="calendar"
        style={{ right: 14 / winScale, top: -48 / winScale }}
      />
    ),
    card: () => <CardExpiry width={152 / winScale} height={43 / winScale} />,
    cardSize: [152 / winScale, 43 / winScale],
    position: [278 / winScale, -136 / winScale],
  },
  {
    id: 'dart',
    img: () => (
      <SplineModel
        id="dart"
        style={{ right: -39 / winScale, top: 0 / winScale }}
      />
    ),
    card: () => <CardStrike width={290 / winScale} height={85 / winScale} />,
    cardSize: [290 / winScale, 85 / winScale],
    position: [-327 / winScale, 200 / winScale],
  },
  {
    id: 'pouch',
    img: () => (
      <SplineModel
        id="pouch"
        style={{ right: -13 / winScale, top: -20 / winScale }}
      />
    ),
    card: () => <CardPnl width={256 / winScale} height={127 / winScale} />,
    cardSize: [256 / winScale, 127 / winScale],
    position: [330 / winScale, 180 / winScale],
  },
] as const;

const trackLen = 3;
export const BottomAnimation = (props: BaseProps) => {
  const [t] = useTranslation('BottomAnimation');
  const size = useSize(document.body);
  const galaxyStyle = useMemo(() => {
    if (!size?.width) return undefined;
    const scale = Math.min((size.width * winScale) / 1100, 1);
    return {
      transformOrigin: 'top center',
      transform: `scale(${scale})`,
      marginBottom: (-(1 - scale) * 800) / winScale,
    };
  }, [size?.width]);
  return (
    <section
      className={classNames(styles['bottom-animation'], props.className)}
      style={props.style}
    >
      <div className={styles['top']}>
        <h2
          dangerouslySetInnerHTML={{
            __html: t('Begin your journey with <br/>our Protocols'),
          }}
        />
        <a
          className={'btn-gradient'}
          href={RiskTypeRefs[RiskType.PROTECTED].link}
          target={Env.isMetaMaskAndroid ? undefined : RiskType.PROTECTED}
        >
          {t('Got To Dapp')}
        </a>
        {/* <LightFlow /> */}
      </div>
      <div className={styles['galaxy']} id="galaxy" style={galaxyStyle}>
        {[...Array(trackLen)].map((_, i) => (
          <div
            className={styles['track']}
            key={i}
            style={{
              width: `${(trackLen - i) * 30}vmax`,
              height: `${(trackLen - i) * 30}vmax`,
            }}
          />
        ))}
        <div className={styles['center']}>
          <span>{t('Customize your own product')}</span>
          <SplineModel id="typewriter" />
        </div>
        {CustomStars.map((it) => {
          const left = it.position[0] - it.cardSize[0] / 2;
          const top = it.position[1] - it.cardSize[1] / 2;
          return (
            <div
              className={styles['star']}
              style={{
                marginLeft: left,
                marginTop: top,
                transformOrigin: `${-left}px ${-top}px`,
              }}
              key={it.id}
            >
              <div className={styles['inner']}>
                {it.card()}
                {it.img()}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
