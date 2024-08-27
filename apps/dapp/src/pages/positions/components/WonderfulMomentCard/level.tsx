import { ReactNode, useState } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';

import { addI18nResources } from '@/locales';

import img1 from './assets/1.png';
import img2 from './assets/2.png';
import img3 from './assets/3.png';
import img4 from './assets/4.png';
import img5 from './assets/5.png';
import img6 from './assets/6.png';
import img7 from './assets/7.png';
import img8 from './assets/8.png';
import { Comp as IconInfo } from './assets/icon-info.svg';
import ruleDescriptions from './assets/rule-descriptions.png';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RuleDescriptions');

export const WonderfulMomentLevels: {
  icon: ReactNode;
  color: string;
  is(returnInUsd: number): boolean;
}[] = [
  {
    icon: <img style={{ width: 64 }} src={img8} alt="" />,
    color: 'linear-gradient(135deg, #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 10000,
  },
  {
    icon: <img style={{ width: 64 }} src={img7} alt="" />,
    color: 'linear-gradient(135deg, #00FFFF, #0F477A)',
    is: (returnInUsd) => returnInUsd >= 7500,
  },
  {
    icon: <img style={{ width: 64 }} src={img6} alt="" />,
    color: 'linear-gradient(135deg,  #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 5000,
  },
  {
    icon: <img style={{ width: 64 }} src={img5} alt="" />,
    color: 'linear-gradient(135deg, #00FFFF, #0F477A)',
    is: (returnInUsd) => returnInUsd >= 2500,
  },
  {
    icon: <img style={{ width: 64 }} src={img4} alt="" />,
    color: 'linear-gradient(135deg,  #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 1000,
  },
  {
    icon: <img style={{ width: 64 }} src={img3} alt="" />,
    color: 'linear-gradient(135deg, #00FFFF, #0F477A)',
    is: (returnInUsd) => returnInUsd >= 500,
  },
  {
    icon: <img style={{ width: 64 }} src={img2} alt="" />,
    color: 'linear-gradient(135deg,  #D1B32F, #FFCF00)',
    is: (returnInUsd) => returnInUsd >= 100,
  },
  {
    icon: <img style={{ width: 64 }} src={img1} alt="" />,
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
