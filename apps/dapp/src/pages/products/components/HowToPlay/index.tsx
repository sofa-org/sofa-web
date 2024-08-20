import { useState } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import img from './assets/how-to-play.jpg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'HowToPlay');

export const HowToPlay = (props: BaseProps) => {
  const [t] = useTranslation('HowToPlay');
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div
        className={classNames(styles['how-to-play'], props.className)}
        style={props.style}
        onClick={() => setVisible(true)}
      >
        {t('HOW TO PLAY')}
      </div>
      <Modal
        title={t('HOW TO PLAY')}
        width={Math.min(
          908 / window.winScale,
          window.innerWidth - 24 / window.winScale,
        )}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <img className={styles['img']} src={img} alt="" />
      </Modal>
    </>
  );
};
