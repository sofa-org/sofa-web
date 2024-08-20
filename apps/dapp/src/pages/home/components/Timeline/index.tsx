import { useEffect } from 'react';
import { FloatingBorder } from '@sofa/effects/FloatingBorder';
import classNames from 'classnames';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import ImgTimeline from '../../assets/img-timeline.jpg';

import styles from './index.module.scss';

// 注册ScrollTrigger插件
gsap.registerPlugin(ScrollTrigger);

export const Timeline = () => {
  useEffect(() => {
    const img = [...document.querySelectorAll(`.${styles['timeline']} > div`)];
    const ctx = gsap.context(() => {
      gsap.set(img, { scale: 0.2 });
      gsap.to(img, {
        scale: 1,
        scrollTrigger: {
          scrub: true,
          scroller: document.querySelector('#root'),
          trigger: '#timeline-wrapper',
          start: `top bottom`,
          end: 'bottom bottom',
        },
      });
    });
    return () => {
      ctx.kill();
    };
  }, []);

  return (
    <div className={styles['timeline-wrapper']} id="timeline-wrapper">
      <div className={classNames(styles['timeline'], 'flex-center')}>
        <FloatingBorder
          borderWidth={1}
          borderRadius={Math.min(40, window.innerWidth * 0.05)}
        >
          <img src={ImgTimeline} alt="" />
        </FloatingBorder>
      </div>
    </div>
  );
};
