// 参考 https://tympanus.net/Development/FullscreenClipEffect/index.html
import { CSSProperties, MouseEvent, useMemo, useRef } from 'react';
import { useTranslation } from '@sofa/services/i18n';
import { TFunction } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { useLazyCallback } from '@sofa/utils/hooks';
import classNames from 'classnames';
import { nanoid } from 'nanoid';
import { createWithEqualityFn } from 'zustand/traditional';

import { addI18nResources } from '@/locales';

import img1 from './assets/feature-img1.jpg';
import img2 from './assets/feature-img2.jpg';
import img3 from './assets/feature-img3.jpg';
import img4 from './assets/feature-img4.jpg';
import img5 from './assets/feature-img5.jpg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'HomeFeatures');

declare const winScale: Global['winScale'];

// const [t] = useTranslation('HomeFeatures');
const futures = (t: TFunction) => [
  {
    title: t('Goodbye Counterparty Risks.<br/>And Good Riddance.'),
    subTitle: t(
      'Trade with whoever you want, whatever you want.<br/>Know your assets are always safe on-chain.',
    ),
    desc: t(
      `Imagine if the world had a widely available technology solution that provided immutable data records, traceable transactions, definable parameters, operational transparency, and exceptional network security...

Surely a technology like that would provide <span class="txt-gradient">the ideal platform for a decentralized, trustless settlement platform</span> for settling any and all financial transactions, <span class="txt-gradient">regardless of your intermediary</span>?
<span class="txt-gradient">SOFA.org</span> is here to make that a reality.`,
    ),
    img: img1,
  },
  {
    title: t('Blockchain Settlement.<br/>For Real.'),
    subTitle: t(
      'Digital assets demand a critical rethink of our settlement standards.',
    ),
    desc: t(
      `Imagine if the world had a widely available technology solution that provided immutable data records, traceable transactions, definable parameters, operational transparency, and exceptional network security...

It's time to stop relying on centralized, off-chain ledgers for recording instrument data, and start putting them on on-chain where they belong.  <span class="txt-gradient">A digitally native asset deserves a digitally native settlement solution</span>, and <span class="txt-gradient">SOFA.org</span> is here with a framework to show the world how it should be done.

Settlement standards have evolved from paper ledgers, to electronic records, and now to the blockchain network.  Progress is as inevitable as the flow of time, so let's get the foundation built correctly from the get-go.`,
    ),
    img: img2,
  },
  {
    title: t('Risk Tokenization.<br/>Catalyzing Capital Efficiency in DeFi.'),
    subTitle: t(
      'Providing a secure rehypothecation solution for on-chain assets.',
    ),
    desc: t(
      `"ETFs are step one in the technological revolution in the financial markets. Step two is gonna be the tokenization of every financial asset.” - Blackrock CEO Larry Fink, January 2024

With everyone now hopping onto the 'tokenize-everything' bandwagon, the genie is now out of the bottle and with no looking back.  Just as derivatives created significant flexibility over spot instruments, <span class="txt-gradient">tokenization opens up a new dimension of ownership tracking and risk replication that were not possible with conventional methods.</span>

Instead of leaving high-value assets sitting dormant on-chain, surely there are more effective ways to replicate and transfer that unique collateral claim to another?  What if these claims were compatible with conventional tokens standards and accepted by both DeFi and CeFi platforms, and thereby <span class="txt-gradient">unlocking significant capital efficiency and money velocity across the entire crypto system</span>?

Our 'Position Tokens' adhere to ERC-1155 standards, allowing the creation and management of multiple types of tokens within a single contract, with support for each type of token having different properties.  This adoption <span class="txt-gradient">strikes a careful balance between compatibility, flexibility, and gas efficiency</span>.`,
    ),
    img: img3,
  },
  {
    title: t('Strength in Numbers.<br/>Truth and Transparency.'),
    subTitle: t(
      'DeFi, CeFi, TradFi - It should be all about the greater ecosystem.',
    ),
    desc: t(
      `As a decentralized, non-profit, open-source technology organization, <span class="txt-gradient">SOFA.org</span> is a steadfast proponent and supporter of the decentralized and trustless spirit in DeFi.

However, let's be clear that the <span class="txt-gradient">decentralization spirit should be about promoting user access and participation, rather than absolving responsibility</span> in how we conduct ourselves.  While blockchain executions could be anonymous, it should not be a free-ride to some unrestrained form of financial ararchy, and we are looking to promote <span class="txt-gradient">a set of self-imposed, 'best practices' guidelines to uphold the collaborative spirit of DeFi</span>.

Every part of our protocol design, including contract transparency, vault classification, extensibility, and fair-launch tokenomics <span class="txt-gradient">demonstrate our resolve and commitment to building a more responsible DeFi</span>.  We are excited to work hand-in-hand with partners who share in our core values and spirit.  LFG!`,
    ),
    img: img4,
  },
  {
    title: t('Fair Launch Tokenomics.<br/>Use-Case Driven Gains.'),
    subTitle: t('Building a sustainable model for the long-run.'),
    desc: t(
      `Unlike the majority of projects, our <span class="txt-gradient">protocol tokenomics will adopt a 100% fair launch model</span>, so no one - not the team, not VCs, not specialized privileged groups - will have ownership of any utility tokens at launch.  It's almost like Bitcoin circa-2010 all over again!.

<span class="txt-gradient">Utility tokens can only be earned via airdrops as a participating user of the protocol, or as a contributing community building member</span>.  The rest of the (capped) float will be left in a standard Uniswap AMM pool, with and a hard cap on the total issuance from day 1.

Furthermore, <span class="txt-gradient">100% of the protocol's earnings will be used to burn our native tokens daily, ensuring a long-term deflationary token float</span> and aligning all value accretion back to our core users (and hodlers).

The higher the protocol-use, the greater the fees, triggering more token buybacks.  A sustainable, use-case driven model built for the long-run.  Stay long-term greedy.`,
    ),
    img: img5,
  },
];

const useHover = createWithEqualityFn(() => ({
  currId: '',
  className: '',
  pos: undefined as undefined | { left: number; top: number },
}));
useHover.subscribe((state) => {
  const pageScroller = document.querySelector('#root') as HTMLDivElement;
  const header = document.querySelector('#header') as HTMLDivElement;
  if (state.className) {
    pageScroller.style.overflowY = 'hidden';
    header.style.pointerEvents = 'none';
    header.style.opacity = '0';
  } else {
    pageScroller.style.overflowY = 'auto';
    header.style.pointerEvents = 'initial';
    header.style.opacity = '1';
  }
});

const Feature = (props: ReturnType<typeof futures>[0]) => {
  const hoverInfo = useHover();
  const id = useMemo(() => nanoid(), []);

  const pos = useMemo(() => {
    if (!hoverInfo.pos) return undefined;
    if (hoverInfo.currId === id) {
      const el = document.querySelector(
        `#feature-${id} > .${styles['feature']}`,
      );
      if (!el) return undefined;
      const elRect = el.getBoundingClientRect();
      return {
        transform: `translate(${-elRect.left}px,${-elRect.top}px)`,
      } as CSSProperties;
    }
    if (Env.isMobile) return { opacity: 0 };
    const el = document.querySelector(`#feature-${id}`);
    const hoverEl = document.querySelector(`#feature-${hoverInfo.currId}`);
    if (!el || !hoverEl) return undefined;
    const elRect = el.getBoundingClientRect();
    const hoverElRect = hoverEl.getBoundingClientRect();
    const distance = Math.sqrt(
      (hoverElRect.left - elRect.left) ** 2 +
        (hoverElRect.top - elRect.top) ** 2,
    );
    const scale = Math.ceil(
      (distance / 240) * (window.innerHeight / elRect.height),
    );
    const elCenter = {
      left: (elRect.left + elRect.right) / 2,
      top: (elRect.top + elRect.bottom) / 2,
    };
    const hoverElCenter = {
      left: (hoverElRect.left + hoverElRect.right) / 2,
      top: (hoverElRect.top + hoverElRect.bottom) / 2,
    };
    const atLeft = elRect.left < hoverElRect.left;
    const left = atLeft
      ? hoverInfo.pos.left +
        (elCenter.left - hoverElCenter.left) * scale -
        elRect.left
      : window.innerWidth + (elCenter.left - hoverElCenter.left) * scale;
    const atAbove = elRect.top < hoverElRect.top;
    const atBelow = elRect.top > hoverElRect.top;
    const top = atAbove
      ? hoverInfo.pos.top +
        (elCenter.top - hoverElCenter.top) * scale -
        elRect.top
      : atBelow
        ? window.innerHeight + (elCenter.top - hoverElCenter.top) * scale
        : window.innerHeight / 2 - (hoverElRect.top + hoverElRect.bottom) / 2;
    return {
      transform: `translate(${left}px, ${top}px) scale(${scale})`,
      opacity: 0,
    };
  }, [hoverInfo.currId, hoverInfo.pos, id]);
  const className = useMemo(() => {
    if (hoverInfo.currId === id) return hoverInfo.className;
    return null;
  }, [hoverInfo.className, hoverInfo.currId, id]);

  const handleHover = useLazyCallback(
    (e: { currentTarget: HTMLDivElement }) => {
      if (useHover.getState().className) return;
      const gsapEnded =
        !e.currentTarget.parentElement?.classList.contains('gsap-enter');
      if (!gsapEnded) return;
      const rect = e.currentTarget.getBoundingClientRect();
      useHover.setState({
        currId: id,
        className: 'hover',
        pos: { left: -rect.left, top: -rect.top },
      });
    },
  );

  const timer = useRef<number>();
  const handleClick = useLazyCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget.classList.contains('hover')) {
      clearTimeout(timer.current);
      useHover.setState({ currId: id, className: 'no-hover', pos: undefined });
      timer.current = setTimeout(
        () => useHover.setState({ currId: id, className: '' }),
        1100,
      ) as never;
    } else {
      handleHover(e);
    }
  });

  // useEffect(() => {
  //   let preOutWrapper = true;
  //   const handler = (e: { clientX: number; clientY: number }) => {
  //     const el = document.querySelector<HTMLDivElement>(`#feature-${id}`)!;
  //     if (!el) return;
  //     const rect = el.getBoundingClientRect();
  //     const outWrapper = (() => {
  //       if (e.clientX < rect.left) return true;
  //       if (e.clientX > rect.right) return true;
  //       if (e.clientY < rect.top) return true;
  //       if (e.clientY > rect.bottom) return true;
  //       return false;
  //     })();
  //     if (preOutWrapper && !outWrapper) handleHover({ currentTarget: el });
  //     preOutWrapper = outWrapper;
  //   };
  //   window.addEventListener('mousemove', handler);
  //   return () => {
  //     window.addEventListener('mousemove', handler);
  //   };
  // }, [handleHover, id]);

  const imgStyle = useMemo(() => {
    const width = Math.min(800, window.innerWidth * 0.9);
    const height = width * (window.innerHeight / window.innerWidth);
    if (hoverInfo.currId !== id && Env.isMobile) return { width, height };
    const scale = Math.max(
      (window.innerWidth + 10 / winScale) / width,
      (window.innerHeight + 120 / winScale) / height,
    );
    return {
      width,
      height,
      transform:
        hoverInfo.className === 'hover'
          ? `translate(-50%, -50%) scale(${scale})`
          : undefined,
    };
  }, [hoverInfo.className, hoverInfo.currId, id]);

  return (
    <div
      className={classNames(
        styles['feature-wrapper'],
        className,
        'cursor-tail-particle',
      )}
      style={
        hoverInfo.className === 'no-hover' ? { pointerEvents: 'none' } : {}
      }
      id={`feature-${id}`}
      onClick={handleClick}
    >
      <div className={styles['feature']} style={pos}>
        <img style={imgStyle} src={props.img} alt="" />
        <h5 dangerouslySetInnerHTML={{ __html: props.title }} />
        <h6 dangerouslySetInnerHTML={{ __html: props.subTitle }} />
        {props.desc.split(/\n|\r/).map((it, i) => (
          <p
            className={styles['feature-desc']}
            dangerouslySetInnerHTML={{ __html: it }}
            key={`${it}-${i}`}
          />
        ))}
      </div>
    </div>
  );
};

export const HomeFeatures = () => {
  const [t] = useTranslation('HomeFeatures');
  const list = useMemo(() => futures(t), [t]);
  return (
    <div className={styles['home-features-wrapper']}>
      <div className={classNames(styles['home-features'], 'bg-gradient')}>
        <section className={styles['section']}>
          <h2>{t('Welcome to SOFA')}</h2>
          <p
            className={styles['desc']}
            dangerouslySetInnerHTML={{
              __html: t(
                'Where Your Wealth Flourishes in Fairness and Freedom. <br/>Your Wealth, Your Way: Freedom and Fairness in Every Opportunity.',
              ),
            }}
          />
          <div className={styles['features']}>
            {list.map((it) => (
              <Feature {...it} key={it.title} />
            ))}
          </div>
          {/* <CAnimation animationType={8}>
            {(ref) => <h2 ref={ref as never}>{t('Welcome to SOFA')}</h2>}
          </CAnimation>
          <CAnimation animationType={8}>
            {(ref) => (
              <p
                className={styles['desc']}
                ref={ref as never}
                dangerouslySetInnerHTML={{
                  __html: t(
                    'Where Your Wealth Flourishes in Fairness and Freedom. <br/>Your Wealth, Your Way: Freedom and Fairness in Every Opportunity.',
                  ),
                }}
              />
            )}
          </CAnimation>
          <CAnimation animationType={8}>
            {(ref) => (
              <div className={styles['features']} ref={ref as never}>
                {list.map((it) => (
                  <Feature {...it} key={it.title} />
                ))}
              </div>
            )}
          </CAnimation> */}
        </section>
      </div>
    </div>
  );
};
