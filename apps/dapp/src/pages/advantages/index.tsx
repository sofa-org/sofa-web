import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AutoBg } from '@sofa/effects/AutoBg';
import { FloatingText } from '@sofa/effects/FloatingText';
import { useTranslation } from '@sofa/services/i18n';
import { TFunction } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import classNames from 'classnames';

import { CAnimation } from '@/components/Animation';
import { addI18nResources } from '@/locales';

import img1 from './assets/img1.png';
import img2 from './assets/img2.png';
import img3 from './assets/img3.png';
import img4 from './assets/img4.png';
import img5 from './assets/img5.png';
import locale from './locale';

import styles from './index.module.scss';
import { Helmet } from 'react-helmet-async';

addI18nResources(locale, 'Advantages');

declare const winScale: Global['winScale'];

const contents = (t: TFunction) => [
  // 下面这行被注释掉的code 告诉 ai18n 下面的 t 都是在 Advantages 包下
  // const [t] = useTranslation('Advantages');
  {
    title: t('SOFA Protocol'),
    noEffect: true,
    className: 'flex-column-center',
    desc: [
      t(
        'The SOFA protocol is our ambitious attempt to establish standards of how financial assets can be atomically settled on-chain, <br/>while simultaneously catalyzing DeFi capital liquidity through transferrable Position Tokens.',
      ),
    ],
  },
  {
    title: t('SECURITY'),
    desc: [
      t(
        'Transaction and instrument parameters are immutably recorded on-chain.',
      ),
      t(
        'Executed assets are locked into SOFA vaults on-chain as a secure, transparent, and neutral 3rd party settlement option servicing both DeFi and CeFi platforms.',
      ),
      t(
        'All protocol vault contracts have been audited by participants from the Secure3 Audit Contest, consisting of a wide group of security experts and anonymous whitehack participants.',
      ),
      t(
        'Allows users the ease of mind to focus on Return ON capital, rather than Return OF capital.',
      ),
    ],
    img: img1,
  },
  {
    title: t('A TRANSPARENT AND COMPETITIVE PRICE DISCOVERY PROCESS'),
    extraTitle: t('HIGH YIELD'),
    desc: [
      t(
        'Through our advanced dAPP and comprehensive API support, the protocol facilitates a fair and competitive bidding process amongst market makers to ensure that users are transacting at the best available prices.',
      ),
      t(
        'The continued growth of the SOFA ecosystem will nurture a vibrant and active marketplace where users will ultimately benefit from the widest selection of investment products offered at the most competitive prices.',
      ),
      t(
        'All executed trades will be automatically sent to our on-chain vaults, allowing users to transact based on optimal pricing rather than credit concerns over counterparty selection.',
      ),
    ],
    img: img2,
  },
  {
    title: t('WIDE GAMUT OF STRUCTURED PRODUCTS'),
    extraTitle: t('OFFERED 24/7'),
    desc: [
      t(
        'SOFA protocol is continuously expanding its network of reputable market makers to stream live prices for an ever widening of structured products investments.',
      ),
      t(
        `There are no 'epoch' restrictions or pricing blackouts for product RFQs (request-for-pricing), ensuring that users are able to transact whenever they want, wherever they want.`,
      ),
      t(
        `SOFA.org can provide comprehensive product pricing tools, API documentation, and other technical support to assist aspiring market makers to become a regular and contributing member to our ecosystem.`,
      ),
    ],
    img: img3,
  },
  {
    title: t(`FAIR-LAUNCH, 'TRADE TO EARN' TOKENOMICS`),
    desc: [
      t(
        `100% fair-launch of the protocol's utility token 'RCH', just like the good ol' days of Bitcoin.`,
      ),
      t(
        'No backdoor allocation, no VC exit-liquidity dumps, no privileged access.  Fair means fair.',
      ),
      t(
        `Fixed supply token with a regular and known airdrop schedule.  No surprises.`,
      ),
      t(
        `RCH can only be earned by protocol usage or ecosystem building rewards.  'Trade to Earn'.`,
      ),
      t(
        `All protocol earnings will be recycled to burn RCH tokens daily, ensuring a net deflationary float over time.`,
      ),
      t(
        `Model design ensures that 100% of the value accretion will be allocated to our core users and long term hodlers.  Building it for the community.`,
      ),
    ],
    img: img5,
  },
];

const Advantages = () => {
  const [t] = useTranslation('Advantages');
  const contentList = useMemo(() => contents(t), [t]);
  return (
    <>
      <Helmet>
        <title>Capabilities - SOFA.org</title>
        <meta name="description" content="The SOFA protocol is our ambitious attempt to establish standards of how financial assets can be atomically settled on-chain, while simultaneously catalyzing DeFi capital liquidity through transferrable Position Tokens." />
      </Helmet>
      {createPortal(
        <svg style={{ position: 'fixed' }}>
          <defs>
            <linearGradient id="ad-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop style={{ stopColor: '#d665a3' }} offset="0" />
              <stop style={{ stopColor: '#e05e2b' }} offset="21.35%" />
              <stop style={{ stopColor: '#f8d748' }} offset="45.31%" />
              <stop style={{ stopColor: '#36af73' }} offset="70.31%" />
              <stop style={{ stopColor: '#2d6fb9' }} offset="100%" />
            </linearGradient>
          </defs>
        </svg>,
        document.querySelector('#root')!,
      )}
      <div className={styles['banner']}>
        <AutoBg type="pipeline" style={{ height: '100vh', opacity: 0.5 }} />
        {/* <CAnimation animationType={1}>
          {(ref) => (
            <AutoBg
              elRef={ref as never}
              type="pipeline"
              style={{ height: '100vh', opacity: 0.5 }}
            />
          )}
        </CAnimation> */}
      </div>
      {contentList.map((it, i) => (
        <CAnimation animationType={15} key={it.title}>
          {($ref) => (
            <div
              className={classNames(styles['content-item'], it.className)}
              ref={$ref as never}
            >
              <div className={styles['left']}>
                <h2
                  className={classNames(
                    styles['title'],
                    'cursor-tail-particle',
                  )}
                  style={{
                    marginBottom:
                      (i < 1 ? 36 : i === 1 ? 80 : it.extraTitle ? 200 : 120) /
                      winScale,
                  }}
                  id={`el${i}`}
                >
                  {it.noEffect || i === 1 ? (
                    <>
                      {i === 1 ? (
                        <span className="txt-gradient">{it.title}</span>
                      ) : (
                        it.title
                      )}
                      {it.extraTitle}
                    </>
                  ) : (
                    <>
                      <FloatingText
                        path={2}
                        direction="left"
                        alignBoundaryEl={() =>
                          document.querySelector(`#el${i}`)
                        }
                        style={{ position: 'relative', top: -90 / winScale }}
                        color={
                          it.extraTitle
                            ? undefined
                            : Env.ua.getBrowser().name === 'Safari'
                              ? '#d665a3'
                              : 'url(#ad-gradient)'
                        }
                        filterType={
                          !Env.isMobile && it.extraTitle ? 'blur' : undefined
                        }
                        fixAtBoundary={i === 1}
                        boundaryClientY={
                          i === 1 ? (window.innerHeight * 3) / 4 : undefined
                        }
                      >
                        {it.title}
                      </FloatingText>
                      {it.extraTitle && (
                        <FloatingText
                          className="txt-gradient"
                          path={2}
                          direction="left"
                          alignBoundaryEl={() =>
                            document.querySelector(`#el${i}`)
                          }
                          color={
                            Env.ua.getBrowser().name === 'Safari'
                              ? '#d665a3'
                              : 'url(#ad-gradient)'
                          }
                          style={{
                            position: 'relative',
                            top: 'calc(-33vw - 90px + 80px)',
                          }}
                        >
                          {it.extraTitle}
                        </FloatingText>
                      )}
                    </>
                  )}
                </h2>
                {it.desc.map(
                  (it) => (
                    <p
                      className={styles['desc']}
                      dangerouslySetInnerHTML={{
                        __html: it,
                      }}
                      key={it}
                    />
                  ),
                  // i === 1 ? (
                  //   <p
                  //     className={styles['desc']}
                  //     dangerouslySetInnerHTML={{
                  //       __html: it,
                  //     }}
                  //     key={it}
                  //   />
                  // ) : (
                  //   <CAnimation animationType={18} key={it}>
                  //     {(ref) => (
                  //       <p
                  //         className={styles['desc']}
                  //         ref={ref as never}
                  //         dangerouslySetInnerHTML={{
                  //           __html: it,
                  //         }}
                  //       />
                  //     )}
                  //   </CAnimation>
                  // ),
                )}
              </div>
              {it.img && (
                <div
                  className={classNames(
                    styles['right'],
                    'cursor-tail-particle',
                  )}
                  style={{
                    marginTop:
                      (i < 1 ? 36 : i === 1 ? 80 : it.extraTitle ? 200 : 120) /
                      winScale,
                  }}
                >
                  <img src={it.img} alt="img" />
                </div>
              )}
              {/* {it.img &&
                (i === 1 ? (
                  <div
                    className={classNames(
                      styles['right'],
                      'cursor-tail-particle',
                    )}
                  >
                    <img src={it.img} alt="img" />
                  </div>
                ) : (
                  <CAnimation animationType={i % 2 === 1 ? 7 : 6}>
                    {(ref) => (
                      <div
                        className={classNames(
                          styles['right'],
                          'cursor-tail-particle',
                        )}
                        ref={ref as never}
                      >
                        <img src={it.img} alt="img" />
                      </div>
                    )}
                  </CAnimation>
                ))} */}
            </div>
          )}
        </CAnimation>
      ))}
    </>
  );
};

export default Advantages;
