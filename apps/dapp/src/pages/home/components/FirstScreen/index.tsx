import { useEffect } from 'react';
import { AutoBg } from '@sofa/effects/AutoBg';
import { BottomCloud } from '@sofa/effects/BottomCloud';
import { useTranslation } from '@sofa/services/i18n';
import classNames from 'classnames';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import { CAnimation } from '@/components/Animation';
import { addI18nResources } from '@/locales';
import { Comp as More } from '@/pages/mechanism/assets/more.svg';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'FirstScreen');

// 注册ScrollTrigger插件
gsap.registerPlugin(ScrollTrigger);

export const FirstScreen = () => {
  const [t] = useTranslation('FirstScreen');
  useEffect(() => {
    const coins = [...document.querySelectorAll(`.${styles['coin']}`)];
    const h1 = document.querySelectorAll(`.${styles['txt']} > h1`);
    const p = document.querySelectorAll(`.${styles['txt']} > p`);
    const ctx = gsap.context(() => {
      const configs = coins.map(() => ({
        distance: ((Math.random() * 200 + 100) / 100) * window.innerHeight,
        center: ((Math.random() * 80 + 20) / 100) * window.innerHeight,
      }));
      coins.forEach((coin, i) => {
        gsap.set(coin, {
          y: `${-(configs[i].center - configs[i].distance / 2)}px`,
        });
        gsap.to(coin, {
          y: `${-(configs[i].center + configs[i].distance / 2)}px`,
          scrollTrigger: {
            scrub: 1,
            scroller: document.querySelector('#root'),
            trigger: '#first-screen-wrapper',
            start: 'top top',
            end: 'bottom bottom',
          },
        });
      });
      // const earth = document.querySelectorAll(`.${styles['earth']}`);
      // gsap.to(earth, {
      //   scale: 0,
      //   opacity: 0,
      //   scrollTrigger: {
      //     scrub: true,
      //     scroller: document.querySelector('#root'),
      //     trigger: '#first-screen-wrapper',
      //     start: `60% top`,
      //     end: 'bottom center',
      //   },
      // });
      gsap.set(h1, { opacity: 0 });
      gsap.to(h1, { opacity: 1, duration: 5 });
      gsap.set(p, { opacity: 0 });
      gsap.to(p, { opacity: 0.45, duration: 5 });
    });
    return () => {
      ctx.kill();
    };
  }, []);

  return (
    <>
      <div className={styles['first-screen-wrapper']} id="first-screen-wrapper">
        <div className={styles['first-screen']}>
          <div className={styles['banner']}>
            <AutoBg type="starry" style={{ height: '100vh' }} />
            {/* <CAnimation animationType={1}>
              {(ref) => (
                <AutoBg
                  elRef={ref as never}
                  type="starry"
                  style={{ height: '100vh' }}
                />
              )}
            </CAnimation> */}
          </div>
          <div
            className={classNames(styles['earth'], 'cursor-tail-particle')}
          />
          <div className={styles['txt']}>
            <h1>
              {t('Creating a Decentralized, Trustless, Atomic')}
              <br />
              {t(
                'Settlement Foundation for Handling All Financial Assets On-Chain.',
              )}
            </h1>
            <p>
              {t('Authentic risk replication via Position Tokens')}
              <br />
              {t('Mitigating the Asset Pre-Funding Problem')}
              <br />
              {t(
                'Unlocking on-chain asset mobility across both DeFi and TraFi',
              )}
            </p>
          </div>
          <div className={styles['coins']}>
            <div className={styles['coin']} />
            <div className={styles['coin']} />
            <div className={styles['coin']} />
            <div className={styles['coin']} />
            <div className={styles['coin']} />
            <div className={styles['coin']} />
          </div>
          <BottomCloud />
        </div>
      </div>

      <CAnimation animationType={16}>
        {(ref) => (
          <More className={styles['indicator-more']} ref={ref as never} />
        )}
      </CAnimation>
    </>
  );
};
