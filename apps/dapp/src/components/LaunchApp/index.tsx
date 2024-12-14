import { useMemo } from 'react';
import { useTranslation } from '@sofa/services/i18n';
import { useIsPortrait } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { EnvLinks } from '@/env-links';
import { addI18nResources } from '@/locales';

import { C_Select } from '../CSelect';
import { ProjectTypeRefs } from '../ProductSelector/enums';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'LaunchApp');

const LaunchApp = (props: BaseProps) => {
  const [t] = useTranslation('LaunchApp');
  const isPortrait = useIsPortrait();
  const options = useMemo(
    () => [
      ...Object.values(ProjectTypeRefs).map((it) => ({
        label: (
          <>
            {it.icon}
            {it.label(t)}
          </>
        ),
        name: it.value,
        value: it.link,
      })),
    ],
    // () => [
    //   {
    //     label: (
    //       <>
    //         <LogoSofa />
    //         {t('Coming {{time}}', {
    //           time: 'Jun 07 UTC 12:00',
    //         })}
    //       </>
    //     ),
    //     name: '',
    //     value: '',
    //   },
    // ],
    [t],
  );

  if (!isPortrait)
    return (
      // <Popover
      //   content={
      //     <>
      //       {options.map((it) => (
      //         <a
      //           className={classNames(styles['option'], {
      //             [styles['disabled']]: !it.value,
      //           })}
      //           href={it.value}
      //           key={it.value}
      //           onClick={(e) => !it.value && e.preventDefault()}
      //         >
      //           {it.label}
      //         </a>
      //       ))}
      //     </>
      //   }
      //   contentClassName={styles['options']}
      //   trigger="hover"
      // >
      <span
        className={classNames(
          styles['launch-app'],
          styles['btn'],
          'bg-gradient',
        )}
        style={props.style}
        onClick={() => window.open(EnvLinks.config.VITE_EARN_LINK, '_blank')}
      >
        {t('LAUNCH APP')}
      </span>
      // </Popover>
    );
  return (
    <span
      className={classNames(styles['launch-app'], styles['btn'], 'bg-gradient')}
      style={props.style}
      onClick={() => (window.location.href = EnvLinks.config.VITE_EARN_LINK)}
    >
      {t('LAUNCH APP')}
    </span>
  );
  // return (
  //   <C_Select
  //     className={classNames(styles['launch-app'], props.className)}
  //     style={props.style}
  //     optionList={options}
  //     onChange={(v) => {
  //       window.location.href = v as string;
  //     }}
  //     renderSelectedItem={() => (
  //       <span className={classNames(styles['btn'], 'bg-gradient')}>
  //         {t('LAUNCH APP')}
  //       </span>
  //     )}
  //   />
  // );
};

export default LaunchApp;
