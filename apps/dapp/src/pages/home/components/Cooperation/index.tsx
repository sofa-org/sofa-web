import { t } from '@sofa/services/i18n';
import classNames from 'classnames';

import { Comp as Logo } from '@/assets/logo';
import SplineModel from '@/components/SplineModel';

import logo0 from './assets/0.png';
import logo1 from './assets/1.png';
import logo2 from './assets/2.png';
import logo3 from './assets/3.png';
import logo4 from './assets/4.png';
import logo5 from './assets/5.png';
import logo6 from './assets/6.png';
import logo7 from './assets/7.png';
import logo8 from './assets/8.png';
import logo9 from './assets/9.png';
import logo10 from './assets/10.png';
import logo11 from './assets/11.png';
import logo12 from './assets/12.png';
import logo13 from './assets/13.png';
import logo14 from './assets/14.png';
// import logo15 from './assets/15.png';
import logo16 from './assets/16.png';
import logo17 from './assets/17.png';
import logo18 from './assets/18.png';
import logo19 from './assets/19.png';
import logo20 from './assets/20.png';
import logo21 from './assets/21.png';
import logo22 from './assets/22.png';
import logo23 from './assets/23.png';
import logo24 from './assets/24.png';
import logo25 from './assets/25.png';

import styles from './index.module.scss';

const agencies = [
  { name: '0', logo: <img src={logo0} alt="" /> },
  { name: '24', logo: <img src={logo24} alt="" /> },
  { name: '1', logo: <img src={logo1} alt="" /> },
  { name: '3', logo: <img src={logo3} alt="" /> },
  { name: '4', logo: <img src={logo4} alt="" /> },
  { name: '5', logo: <img src={logo5} alt="" /> },
  { name: '6', logo: <img src={logo6} alt="" /> },
  { name: '18', logo: <img src={logo18} alt="" /> },
  { name: '7', logo: <img src={logo7} alt="" /> },
  { name: '8', logo: <img src={logo8} alt="" /> },
  { name: '9', logo: <img src={logo9} alt="" /> },
  { name: '10', logo: <img src={logo10} alt="" /> },
  { name: '12', logo: <img src={logo12} alt="" /> },
  { name: '11', logo: <img src={logo11} alt="" /> },
  { name: '14', logo: <img src={logo14} alt="" /> },
  { name: '13', logo: <img src={logo13} alt="" /> },
  // { name: '15', logo: <img src={logo15} alt="" /> },
  { name: '17', logo: <img src={logo17} alt="" /> },
  { name: '16', logo: <img src={logo16} alt="" /> },
  { name: '19', logo: <img src={logo19} alt="" /> },
  { name: '23', logo: <img src={logo23} alt="" /> },
  { name: '2', logo: <img src={logo2} alt="" /> },
  { name: '22', logo: <img src={logo22} alt="" /> },
  { name: '21', logo: <img src={logo21} alt="" /> },
  { name: '20', logo: <img src={logo20} alt="" /> },
  { name: '25', logo: <img src={logo25} alt="" /> },
];

export const HomeCooperation = () => {
  return (
    <div className={styles['home-cooperation-wrapper']}>
      <div className={styles['home-cooperation']}>
        <SplineModel
          id={'cloudAndCoin'}
          className={classNames(styles['cloud'], 'cursor-tail-particle')}
        />
        <Logo className={classNames(styles['logo'], 'cursor-tail-particle')} />
        <section
          className={classNames(styles['section'], 'flex-column-center')}
        >
          <p
            className={classNames(styles['slogan'])}
            dangerouslySetInnerHTML={{
              __html: t(
                'A decentralized, non-profit, open-source technology organization<br/>looking to uphold the core values and spirit of DeFi in a professional and responsible manner.',
              ),
            }}
          />
          <div className={styles['agencies']}>
            {agencies.map((it) => (
              <div className={styles['agency']} key={it.name}>
                {it.logo}
              </div>
            ))}
          </div>
          {/* <CAnimation animationType={8}>
          {(ref) => (
            <SplineModel
              elRef={ref as never}
              id={'cloudAndCoin'}
              className={classNames(styles['cloud'], 'cursor-tail-particle')}
            />
          )}
        </CAnimation>
        <CAnimation animationType={8}>
          {(ref) => (
            <Logo
              className={classNames(styles['logo'], 'cursor-tail-particle')}
              ref={ref as never}
            />
          )}
        </CAnimation>
        <section
          className={classNames(styles['section'], 'flex-column-center')}
        >
          <CAnimation animationType={8}>
            {(ref) => (
              <p
                ref={ref as never}
                className={classNames(styles['slogan'])}
                dangerouslySetInnerHTML={{
                  __html: t(
                    'A decentralized, non-profit, open-source technology organization<br/>looking to uphold the core values and spirit of DeFi in a professional and responsible manner.',
                  ),
                }}
              />
            )}
          </CAnimation>
          <CAnimation animationType={8}>
            {(ref) => (
              <div className={styles['agencies']} ref={ref as never}>
                {agencies.map((it) => (
                  <div className={styles['agency']} key={it.name}>
                    {it.logo}
                  </div>
                ))}
              </div>
            )}
          </CAnimation> */}
        </section>
      </div>
    </div>
  );
};
