import { useEffect } from 'react';
import { RotateText } from '@sofa/effects/RotateText';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { useInViewport } from 'ahooks';
import classNames from 'classnames';
import gsap from 'gsap';
import MotionPathPlugin from 'gsap/MotionPathPlugin';
import ScrollTrigger from 'gsap/ScrollTrigger';

import SplineModel from '@/components/SplineModel';
import { addI18nResources } from '@/locales';

import { Comp as IconChecked } from '../../assets/icon-checked.svg';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'HomeDescriptions');

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

declare const winScale: Global['winScale'];

export const HomeDescriptions = () => {
  const [t] = useTranslation('HomeDescriptions');
  const [inView] = useInViewport(() =>
    document.querySelector('#home-desc-wrapper'),
  );

  useEffect(() => {
    if (!inView) return;
    const ctx = gsap.context(() => {
      const elements = [
        '#home-desc-1',
        '#home-desc-2',
        '#home-desc-3',
        '#home-desc-4',
      ];
      const circleRadius = 180 / winScale;
      const paths: { x: number; y: number }[] = [
        { x: window.innerWidth + circleRadius, y: circleRadius },
      ];
      const scales = [1, 1, 1, Env.isMobile ? 2.4 : 2.6];

      const wrapperRect = document
        .querySelector('#home-desc-wrapper')!
        .getBoundingClientRect();
      elements.forEach((selector, index) => {
        const element = document.querySelector(selector)!;
        const rect = element.getBoundingClientRect();
        const center = {
          x: rect.left + rect.width / 2 - wrapperRect.left - circleRadius,
          y: rect.top + rect.height / 2 - wrapperRect.top - circleRadius,
        };
        paths.push(center);

        ScrollTrigger.create({
          scrub: 1,
          scroller: document.querySelector('#root'),
          trigger: selector,
          start: 'top 70%',
          end: 'bottom 30%',
          onEnter: () => moveToElement(index, 'next'),
          onLeaveBack: () => moveToElement(index, 'pre'),
          // markers: true,
        });
      });

      function moveToElement(index: number, to: 'next' | 'pre') {
        const nextPath =
          to === 'next'
            ? paths.slice(index, index + 2)
            : paths.slice(index, index + 2).reverse();

        if (nextPath.length < 2) return;

        // 创建一个时间线
        const tl = gsap.timeline();

        // 添加缩小的动画
        tl.to('#home-txt-circle', {
          scale: 0.5, // 缩小到50%
          duration: 0.5,
        });

        // 添加沿路径移动的动画
        tl.to(
          '#home-txt-circle',
          {
            duration: 1,
            motionPath: {
              path: nextPath,
              autoRotate: false,
              curviness: 1.5,
            },
            ease: 'expo.inOut',
          },
          '-=0.5',
        ); // 让这个动画稍微提前开始，以便与缩小动画有重叠

        // 添加放大回原本大小的动画
        tl.to(
          '#home-txt-circle',
          {
            scale: scales[to === 'pre' ? index - 1 : index], // 放大回100%
            duration: 0.5,
          },
          '-=0.25',
        );
      }
    });
    return () => {
      ctx.kill();
    };
  }, [inView]);

  return (
    <div className={styles['home-descriptions-wrapper']} id="home-desc-wrapper">
      <section className={classNames(styles['section'], styles['row'])}>
        <div
          className={classNames(styles['img'], 'cursor-tail-particle')}
          id="home-desc-1"
        >
          <SplineModel id="rubik" />
        </div>
        <div className={styles['content']}>
          <h2
            dangerouslySetInnerHTML={{
              __html: t('Trustless DeFi, <br/>Responsible Framework'),
            }}
          />
          <p
            className={styles['desc']}
            dangerouslySetInnerHTML={{
              __html: t(
                '<span class="txt-gradient">SOFA.org</span> is looking to develop a rich ecosystem of settlement and wealth management protocols that rigorously upholds the decentralization spirit of DeFi, but without making any compromises on asset security, product quality, and user experience.  Enjoy complete ease of mind when executing through the SOFA protocols, with the full knowledge that your assets are safely held in on-chain vaults, regardless of your transacted intermediary.',
              ),
            }}
          />
        </div>
      </section>
      <section className={classNames(styles['section'], styles['row'])}>
        <div
          className={classNames(styles['img'], 'cursor-tail-particle')}
          id="home-desc-2"
        >
          <SplineModel id="safe" />
        </div>
        <div className={styles['content']}>
          <h2
            dangerouslySetInnerHTML={{
              __html: t('A Growing <br/>Structured Products Catalogue'),
            }}
          />
          <p className={styles['sub-title']}>
            {t(
              'Dive into our diverse range of structured products, each designed to cater to your risk tolerance and investment goals.',
            )}
          </p>
          <p className={styles['desc-bright']}>
            <IconChecked />
            {t(
              'Choose from a selection of Earn products to protect against worst-case downside.',
            )}
          </p>
          <p className={styles['desc-bright']}>
            <IconChecked />
            {t(
              'Or opt for the more aggressive Surge products for a chance at substantial upside.',
            )}
          </p>
        </div>
      </section>
      <section className={classNames(styles['section'], styles['row'])}>
        <div
          className={classNames(styles['img'], 'cursor-tail-particle')}
          id="home-desc-3"
        >
          <SplineModel id="atom" />
        </div>
        <div className={styles['content']}>
          <h2>{t('The SOFA Advantage')}</h2>
          <p className={styles['sub-title']}>
            {t('Maximum Decentralization and Elimination of Counterparty Risk')}
          </p>
          <p className={styles['desc']}>
            {t(
              `Embrace the pinnacle of blockchain security with SOFA's unwavering commitment to full decentralisation and on-chain asset settlement.  The protocol's on-chain vaults are governed by transparent, audited contracts from PeckShield, SigmaPrime, and Code4rena - the gold standards in blockchain security.  DAO based governance, transparent logistics, open source code, decentralized oracles and a full competitive bidding process ensure the maximum levels of decentralisation with no functional compromise.`,
            )}
          </p>
        </div>
      </section>
      <section
        className={classNames(styles['section'], styles['column-center'])}
        id="home-desc-4"
      >
        <div className={classNames(styles['img'], 'cursor-tail-particle')}>
          <SplineModel id="hammer" />
        </div>
        <div className={styles['content']}>
          <h2>{t('Redefining DeFi Deposit Products')}</h2>
          <p className={styles['desc']}>
            {t(
              `SOFA's approach to handling DeFi investment products goes well beyond being a mere service.  It is a defining example of how one can handle complex structured products on-chain, ensuring fairness of pricing, ease of execution, secure collateralization of assets, and flexible composability into other DeFi and CeFi venues.  By smartly mitigating all counterparty and collateral issues onto the blockchain, users are free to focus on product selection and payoff profiles, allowing a first-class TradFi investment experience with the full security benefits of DeFi.`,
            )}
          </p>
        </div>
      </section>
      <div id="home-txt-circle">
        <RotateText fontSize={24} color="#fff" radius={800}>
          SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG
          SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG
          SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG SOFA.ORG
        </RotateText>
      </div>
    </div>
  );
};
