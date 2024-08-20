import { useMemo } from 'react';
import { Popover } from '@douyinfe/semi-ui';
import { RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { useIsPortrait } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import { C_Select } from '../CSelect';
import { RiskTypeRefs } from '../ProductSelector/enums';

import locale from './locale';

import styles from './index.module.scss';

import { Comp as LogoSofa } from '@@/favicon.svg';

addI18nResources(locale, 'LaunchApp');

const LaunchApp = (props: BaseProps) => {
  const [t] = useTranslation('LaunchApp');
  const isPortrait = useIsPortrait();
  const options = useMemo(
    () => [
      ...Object.values(RiskTypeRefs)
        .filter((it) => it.value !== RiskType.LEVERAGE)
        .map((it) => ({
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
      <Popover
        content={
          <>
            {options.map((it) => (
              <a
                className={classNames(styles['option'], {
                  [styles['disabled']]: !it.value,
                })}
                href={it.value}
                key={it.value}
                onClick={(e) => !it.value && e.preventDefault()}
              >
                {it.label}
              </a>
            ))}
          </>
        }
        contentClassName={styles['options']}
        trigger="hover"
      >
        <span
          className={classNames(
            styles['launch-app'],
            styles['btn'],
            'bg-gradient',
          )}
          style={props.style}
        >
          {t('LAUNCH APP')}
        </span>
      </Popover>
    );

  return (
    <C_Select
      className={classNames(styles['launch-app'], props.className)}
      style={props.style}
      optionList={options}
      onChange={(v) => {
        window.location.href = v as string;
      }}
      renderSelectedItem={() => (
        <span className={classNames(styles['btn'], 'bg-gradient')}>
          {t('LAUNCH APP')}
        </span>
      )}
    />
  );
};

export default LaunchApp;
