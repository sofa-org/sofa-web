import { AutoBg } from '@sofa/effects/AutoBg';
import { SFXText } from '@sofa/effects/SFXText';
import { useTranslation } from '@sofa/services/i18n';
import classNames from 'classnames';

import { CAnimation } from '@/components/Animation';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import { BottomAnimation } from '../home/components/BottomAnimation';

import { Comp as More } from './assets/more.svg';
import { MechanismCards } from './components/Cards';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Mechanism');

const Index = () => {
  const [t] = useTranslation('Mechanism');
  return (
    <>
      <div className={styles['banner']}>
        <AutoBg type="swirl" style={{ height: '100vh', opacity: 0.3 }} />
        {/* <CAnimation animationType={1}>
          {(ref) => (
            <AutoBg
              elRef={ref as never}
              type="swirl"
              style={{ height: '100vh', opacity: 0.5 }}
            />
          )}
        </CAnimation> */}
      </div>
      <SFXText
        className={classNames(styles['how-it-works'], 'cursor-tail-particle')}
        style={{ width: '100vw', height: '100vh' }}
      >
        <tspan x="50%" dy="-0.8em">
          HOW
        </tspan>
        <tspan x="50%" dy="1em">
          IT
        </tspan>
        <tspan x="50%" dy="1em">
          WORKS
        </tspan>
      </SFXText>
      <CAnimation animationType={16}>
        {(ref) => (
          <More className={styles['indicator-more']} ref={ref as never} />
        )}
      </CAnimation>
      <MechanismCards />
      <BottomAnimation />
      <section className={styles['section']}>
        <CAnimation animationType={8}>
          {(ref) => (
            <h2 ref={ref as never}>{t('Choose Your Deposit Style')}</h2>
          )}
        </CAnimation>
        <CAnimation animationType={8}>
          {(ref) => (
            <p className={styles['desc']} ref={ref as never}>
              {t(
                `At SOFA.org, a wide selection of innovative products are available and tailored to the user's risk preference, offering both downside-protected arrangements as well as aggressive, return-seeking structures.`,
              )}
            </p>
          )}
        </CAnimation>
        <CAnimation animationType={8}>
          {(ref) => (
            <div className={styles['types']} ref={ref as never}>
              {Object.values(ProjectTypeRefs).map((ref) => {
                return (
                  <div className={styles['type']} key={ref.value}>
                    <h4>{ref.label(t)}</h4>
                    {ref.icon}
                    <p className={styles['desc']}>{ref.desc(t)}</p>
                    <a href={ref.link} className={styles['link1']}>
                      {t('Go To Dapp')}
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </CAnimation>
      </section>
    </>
  );
};

export default Index;
