import { ReactNode, useState } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ApyDesc');

export interface ApyDescProps {
  children?: ReactNode;
}

const ApyDesc = (props: ApyDescProps) => {
  const [t] = useTranslation('ApyDesc');
  const [visible, setVisible] = useState(false);
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Modal
        centered
        title={t('Potential Yield(APY)')}
        width={Math.min(
          720 / window.winScale,
          window.innerWidth - 24 / window.winScale,
        )}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <p className={styles['p']}>
          {t(
            'Potential Yield represents the theoretical maximum earnings accrued to the user:',
          )}
        </p>
        <p className={styles['regular']}>{t('It is composed of 3 parts:')}</p>
        <p className={styles['regular']}>
          {t(
            '<b>Base Yield</b>:  Minimum fixed floor yield %\n\r<b>RCH Airdrops</b>:  Additional income derived from RCH token airdrops\n\r<b>Upside</b>: Excess income from favourable market outcomes',
          )
            .split(/[\r\n]/)
            .filter(Boolean)
            .map((it, i) => (
              <span
                className={styles['item']}
                key={it}
                dangerouslySetInnerHTML={{
                  __html: `<b>${i + 1}.</b> ${it}`,
                }}
              />
            ))}
        </p>
        <p className={styles['tips']}>
          {t(
            '*Base yield and Potential Yield are subject to the actual Aave/Lido/Sofa/Curve/Avalon yield',
          )}
        </p>
      </Modal>
      <div
        className={classNames(styles['apy-desc'], 'apy-desc')}
        onClickCapture={() => setVisible(true)}
      >
        {props.children}
      </div>
    </div>
  );
};

export default ApyDesc;
