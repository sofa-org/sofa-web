import { Tabs } from '@douyinfe/semi-ui';
import { TFunction, useTranslation } from '@sofa/services/i18n';

import { ProjectTypeRefs } from '@/components/ProductSelector/enums';

import { Automator } from '../products/automator';
import Customize from '../products/customize';

import { DIY } from './components/DIY';

import styles from './index.module.scss';

const tabs = [
  {
    label: (t: TFunction) => t({ enUS: 'DIY', zhCN: 'DIY' }),
    value: 'diy',
    comp: () => <DIY />,
  },
  {
    label: (t: TFunction) => t({ enUS: 'Follow The Best', zhCN: '跟单' }),
    icon: ProjectTypeRefs.Automator.icon,
    value: 'automator',
    comp: () => <Automator onlyForm className={styles['automator']} />,
  },
  {
    label: (t: TFunction) => t({ enUS: 'Customize', zhCN: '自定义' }),
    icon: ProjectTypeRefs.Earn.icon,
    value: 'customize',
    comp: () => <Customize onlyForm className={styles['automator']} />,
  },
];

const Index = () => {
  const [t] = useTranslation('DefiMode');

  return (
    <div className={styles['container']}>
      <Tabs className={styles['tabs']} lazyRender>
        {tabs.map((it) => (
          <Tabs.TabPane itemKey={it.value} icon={it.icon} tab={it.label(t)}>
            {it.comp()}
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default Index;
