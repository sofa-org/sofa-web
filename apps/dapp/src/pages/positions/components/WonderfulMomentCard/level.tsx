import { useState } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';

import { addI18nResources } from '@/locales';

import { Comp as IconInfo } from './assets/icon-info.svg';
import ruleDescriptions from './assets/rule-descriptions.png';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RuleDescriptions');

export const WonderfulMomentLevels: {
  icon: string;
  color: string;
  is(returnInUsd: number): boolean;
}[] = [
  {
    icon: '🚀',
    color: 'linear-gradient(135deg, #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 10000,
  },
  {
    icon: '⛵️',
    color: 'linear-gradient(135deg, #00FFFF, #0F477A)',
    is: (returnInUsd) => returnInUsd >= 7500,
  },
  {
    icon: '💐',
    color: 'linear-gradient(135deg,  #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 5000,
  },
  {
    icon: '🎁',
    color: 'linear-gradient(135deg, #00FFFF, #0F477A)',
    is: (returnInUsd) => returnInUsd >= 2500,
  },
  {
    icon: '💰',
    color: 'linear-gradient(135deg,  #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 1000,
  },
  {
    icon: '🍺',
    color: 'linear-gradient(135deg, #00FFFF, #0F477A)',
    is: (returnInUsd) => returnInUsd >= 500,
  },
  {
    icon: '🍬',
    color: 'linear-gradient(135deg,  #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 100,
  },
  {
    icon: '✨',
    color: 'linear-gradient(135deg, #00FFFF, #0F477A)',
    is: (returnInUsd) => returnInUsd >= 0,
  },
];

export const RuleDescriptions = () => {
  const [t] = useTranslation('RuleDescriptions');
  const [visible, setVisible] = useState(false);
  return (
    <>
      <IconInfo
        className={styles['icon-info']}
        onClick={() => setVisible(true)}
      />
      <Modal
        title={t('Rule Descriptions')}
        footer={null}
        width={1048}
        visible={visible}
        onCancel={() => setVisible(false)}
        centered
      >
        <img
          className={styles['rule-descriptions']}
          src={ruleDescriptions}
          alt=""
        />
      </Modal>
    </>
  );
};
