import { MutableRefObject, ReactNode, useEffect, useRef } from 'react';
import { calcVal } from '@sofa/utils/fns';
import { useRefState } from '@sofa/utils/hooks';
import classNames from 'classnames';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { isEmpty } from 'lodash-es';

import styles from './index.module.scss';

// 注册ScrollTrigger插件
gsap.registerPlugin(ScrollTrigger);

const AnimationTypes = {
  1: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    {},
    {
      scale: 1.5,
      scrollTrigger: {
        scrub: 1.5,
        scroller: document.querySelector('#root'),
        trigger: document.querySelector('.main-content'),
        start: 'top top',
        end: 'bottom bottom',
      },
    },
  ],
  2: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    // { y: '+=50vh', opacity: 0, rotate: '180deg' },
    // {
    //   y: 0,
    //   opacity: 1,
    //   rotate: '0deg',
    //   duration: 1,
    //   animationTimingFunction: 'ease-in',
    // },
    {},
    {
      opacity: 0,
      y: '-=25vh',
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top 25%',
        end: 'bottom top',
      },
    },
  ],
  3: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    // { opacity: 0 },
    // { opacity: 1, delay: 0.7, duration: 0.5 },
    {},
    {
      scale: 0.65,
      transformOrigin: 'bottom center',
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top center',
        end: 'top 25%',
      },
    },
  ],
  4: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    {},
    {
      marginTop: 64,
      marginBottom: 64,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top center',
        end: 'top 30%',
      },
    },
  ],
  5: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    {},
    {
      marginBottom: -16,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top center',
        end: 'top 30%',
      },
    },
  ],
  6: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, x: '-50%' },
    {
      opacity: 1,
      x: 0,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top center',
      },
    },
  ],
  7: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, x: '50%' },
    {
      opacity: 1,
      x: 0,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top center',
      },
    },
  ],
  8: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, y: '25vh' },
    {
      opacity: 1,
      y: 0,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top 80%',
      },
    },
  ],
  9: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { x: '-100%', y: '100%' },
    {
      opacity: 1,
      x: 0,
      y: 0,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top 70%',
      },
    },
  ],
  10: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { x: '100%', y: '100%' },
    {
      opacity: 1,
      x: 0,
      y: 0,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top 70%',
      },
    },
  ],
  11: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, y: '-25vh' },
    { opacity: 1, y: 0, duration: 0.5 },
  ],
  12: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, y: '25vh' },
    { opacity: 1, y: 0, duration: 1 },
  ],
  13: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, scale: 0.1 },
    { opacity: 1, scale: 1, duration: 1 },
  ],
  14: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, scale: 0.1 },
    {
      opacity: 1,
      scale: 1,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top 70%',
      },
    },
  ],
  15: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0 },
    { opacity: 1, duration: 4 },
  ],
  16: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, scale: 0.5 },
    { opacity: 0.65, scale: 1, duration: 2, delay: 1 },
    {
      opacity: 0,
      scale: 0.5,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top 90%',
        end: 'bottom 90%',
      },
    },
  ],
  17: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0 },
    {
      opacity: 1,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top 35%',
      },
    },
  ],
  18: (refCurrent: HTMLElement): gsap.TweenVars[] => [
    { opacity: 0, y: '25vh' },
    {
      opacity: 1,
      y: 0,
      scrollTrigger: {
        scrub: 1,
        scroller: document.querySelector('#root'),
        trigger: refCurrent,
        start: 'top bottom',
        end: 'top bottom',
      },
    },
  ],
};

export interface AnimationProps extends BaseProps {
  animationType: keyof typeof AnimationTypes | gsap.TweenVars[];
  children:
    | ReactNode
    | ((ref: MutableRefObject<HTMLElement | null | undefined>) => ReactNode);
  onComplete?(): void;
}

export const CAnimation = (props: AnimationProps) => {
  const ref = useRef<HTMLElement>();
  const onCompleteRef = useRefState(props.onComplete);

  useEffect(() => {
    if (!ref.current) return;
    const [from, ...toList] = calcVal(
      typeof props.animationType === 'object'
        ? props.animationType
        : AnimationTypes[props.animationType],
      ref.current!,
    );
    if (!isEmpty(from)) gsap.set(ref.current!, from);
    const ctx = gsap.context(async () => {
      for (let i = 0; i < toList.length; i += 1) {
        const to = toList[i];
        if (i > 0) gsap.set(ref.current!, toList[i - 1]);
        const scrollTrigger =
          to.scrollTrigger &&
          typeof to.scrollTrigger === 'object' &&
          'trigger' in to.scrollTrigger
            ? (to.scrollTrigger as ScrollTrigger.Vars)
            : null;
        await new Promise<void>((resolve) => {
          gsap.to(ref.current!, {
            ...to,
            // markers: true,
            // onUpdate: (c) => {
            // },
            ...(scrollTrigger
              ? {
                  scrollTrigger: {
                    ...scrollTrigger,
                    onEnter: () => {
                      const el = scrollTrigger.trigger;
                      if (
                        el &&
                        el instanceof Element &&
                        el !== document.querySelector('.main-content')
                      ) {
                        el.classList.add('gsap-enter');
                      }
                    }, // 进入时添加样式类
                    onLeave: () => {
                      const el = scrollTrigger.trigger;
                      if (
                        el &&
                        el instanceof Element &&
                        el !== document.querySelector('.main-content')
                      ) {
                        el.classList.remove('gsap-enter');
                        el.classList.remove('gsap-enter-back');
                      }
                    }, // 离开时移除样式类
                    onEnterBack: () => {
                      const el = scrollTrigger.trigger;
                      if (
                        el &&
                        el instanceof Element &&
                        el !== document.querySelector('.main-content')
                      ) {
                        el.classList.add('gsap-enter-back');
                        el.classList.add('gsap-enter');
                      }
                    }, // 从下往上滚动进入时再次添加样式类
                    onLeaveBack: () => {
                      const el = scrollTrigger.trigger;
                      if (
                        el &&
                        el instanceof Element &&
                        el !== document.querySelector('.main-content')
                      ) {
                        el.classList.remove('gsap-enter');
                        el.classList.remove('gsap-enter-back');
                      }
                    }, // 从下往上滚动离开时再次移除样式类
                  } as ScrollTrigger.Vars,
                }
              : null),
            onComplete: () => {
              resolve();
              onCompleteRef.current?.();
            },
          });
        });
      }
    }, ref);
    return () => ctx.kill();
  }, [onCompleteRef, props.animationType]);

  return typeof props.children === 'function' ? (
    props.children(ref)
  ) : (
    <div
      className={classNames(
        styles['animation-wrapper'],
        'animation-wrapper',
        props.className,
      )}
      style={props.style}
      ref={ref as never}
    >
      {props.children}
    </div>
  );
};
