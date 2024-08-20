import { useMemo } from 'react';
import { Popover } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { useIsPortrait } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import { C_Select } from '../CSelect';

import { LinkItems } from './config';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Community');

const Community = (props: BaseProps) => {
  const [t] = useTranslation('Community');
  const isPortrait = useIsPortrait();
  const options = useMemo(
    () =>
      LinkItems.map((it) => ({
        label: (
          <>
            {it.icon}
            {it.name(t)}
          </>
        ),
        value: it.link,
      })),
    [t],
  );

  if (!isPortrait)
    return (
      <Popover
        content={
          <>
            {options.map((it) => (
              <a
                className={styles['option']}
                href={it.value}
                target={Env.isMetaMaskAndroid ? undefined : '_blank'}
                key={it.value}
                rel="noopener noreferrer"
              >
                {it.label}
              </a>
            ))}
          </>
        }
        contentClassName={styles['options']}
      >
        <span
          className={classNames(styles['community'], props.className)}
          style={props.style}
        >
          {t('Community')}
        </span>
      </Popover>
    );
  return (
    <C_Select
      className={classNames(styles['community'], props.className)}
      style={props.style}
      optionList={options}
      onChange={(v) => {
        window.open(v as string, '_blank', 'noopener,noreferrer');
      }}
      renderSelectedItem={() => (
        <span className={styles['txt']}>{t('Community')}</span>
      )}
    />
  );
};

export default Community;
