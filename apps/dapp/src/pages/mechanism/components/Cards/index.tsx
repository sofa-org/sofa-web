// import required modules
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FloatingBorder } from '@sofa/effects/FloatingBorder';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { useIsPortrait } from '@sofa/utils/hooks';
import { throttle } from 'lodash-es';
import { EffectCoverflow, Pagination } from 'swiper/modules';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

import { addI18nResources } from '@/locales';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

import { Comp as IconCoop } from '../../assets/icon-coop.svg';
import ProcessHowItWorks from '../../assets/process-how-it-works.png';
import ProcessToken from '../../assets/process-token.png';
import ProcessTrading from '../../assets/process-trading.png';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'MechanismCards');

declare const winScale: Global['winScale'];

export const MechanismCards = () => {
  const [t] = useTranslation('MechanismCards');
  const isPortrait = useIsPortrait();
  const [activeIndex, setActiveIndex] = useState(1);
  useEffect(() => {
    if (!isPortrait) return;
    const handler = throttle(() => {
      const cards = document.querySelectorAll(`.${styles['card']}`);
      // 通过计算每个卡片中心与视窗中心的距离，更新 activeIndex
      const sortedCards = [...cards]
        .map((el, i) => {
          const rect = el.getBoundingClientRect();
          const distance = Math.abs(
            window.innerHeight / 2 - (rect.top + rect.height / 2),
          );
          return [el, i, distance] as const;
        })
        .sort((a, b) => a[2] - b[2]);
      requestAnimationFrame(() => setActiveIndex(sortedCards[0][1]));
    }, 500);
    document.querySelector('#root')?.addEventListener('scroll', handler);
    return () => {
      document.querySelector('#root')?.removeEventListener('scroll', handler);
    };
  }, [isPortrait]);

  const renderContent = useCallback(
    (content: ReactNode, i: number) => {
      if (activeIndex !== i)
        return (
          <div
            className={styles['card']}
            style={{ border: '1px solid transparent' }}
          >
            <div
              className="floating-border-content"
              style={{
                padding: `calc(${86 / winScale}px) ${30 / winScale}px ${
                  50 / winScale
                }px`,
              }}
            >
              {content}
            </div>
          </div>
        );
      return (
        <FloatingBorder
          className={styles['card']}
          borderWidth={1}
          borderRadius={24 / winScale}
          padding={`calc(${86 / winScale}px) ${30 / winScale}px ${
            50 / winScale
          }px`}
        >
          {content}
        </FloatingBorder>
      );
    },
    [activeIndex],
  );

  const cards = useMemo(
    () => [
      renderContent(
        <>
          <h2>{t('Transparent Trading with Open RFQ Market')}</h2>
          <img src={ProcessTrading} alt="" className={styles['process-svg']} />
          <p className={styles['desc']}>
            {t(
              'Your lottery purchases initiate queries to multiple market makers through SOFA’s open RFQ market. The best quote ensures execution, with the SOFA vault securing the promised reward amount, guaranteeing your win is always paid out.',
            )}
          </p>
          <IconCoop className={styles['icon-coop']} />
          <a
            href="https://sofa-org.github.io/sofa-gitbook/02-protocols/01-dcv-exotic/02-developers/01-marketmaker-open-apis.html"
            className={styles['link']}
            target={Env.isMetaMaskAndroid ? undefined : '_blank'}
            rel="noopener noreferrer"
          >
            {t('how to become a market maker')}
          </a>
        </>,
        0,
      ),
      renderContent(
        <>
          <h2>{t('100% on-chain + Tokenized Positions ')}</h2>
          <img
            src={ProcessHowItWorks}
            alt=""
            className={styles['process-svg']}
          />
        </>,
        1,
      ),
      renderContent(
        <>
          <h2>{t('Ecosystem')}</h2>
          <img src={ProcessToken} alt="" className={styles['process-svg']} />
        </>,
        2,
      ),
    ],
    [renderContent, t],
  );

  return isPortrait ? (
    <div className={styles['mechanism-cards']}>
      {cards.map((it, i) => (
        <div className={styles['cards']} key={i}>
          {it}
        </div>
      ))}
    </div>
  ) : (
    <Swiper
      effect={'coverflow'}
      grabCursor={true}
      centeredSlides={true}
      slidesPerView={'auto'}
      coverflowEffect={{
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true,
      }}
      pagination={{ clickable: true }}
      modules={[EffectCoverflow, Pagination]}
      className={styles['mechanism-cards']}
      initialSlide={1}
      slideToClickedSlide
      onSlideChange={(v) => setActiveIndex(v.activeIndex)}
    >
      {cards.map((it, i) => (
        <SwiperSlide key={i}>{it}</SwiperSlide>
      ))}
    </Swiper>
  );
};
