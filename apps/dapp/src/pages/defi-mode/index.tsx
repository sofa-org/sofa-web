import { useMemo } from 'react';
import { ProjectType } from '@sofa/services/base-type';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';

import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';

import { Automator } from '../products/automator';
import { ProductCustomize } from '../products/customize';

import { DIY } from './components/DIY';

import styles from './index.module.scss';

const tabs = [
  {
    label: (t: TFunction) => t({ enUS: 'DeFi Mode', zhCN: 'DeFi 模式' }),
    value: 'diy',
    comp: () => <DIY />,
  },
  {
    label: (t: TFunction) => (
      <>
        {ProjectTypeRefs[ProjectType.Automator].icon}
        {t({ enUS: 'Follow The Best', zhCN: '跟单' })}
      </>
    ),
    icon: ProjectTypeRefs.Automator.icon,
    value: 'automator',
    comp: () => <Automator onlyForm className={styles['automator']} />,
  },
  {
    label: (t: TFunction) => (
      <>
        {ProjectTypeRefs[ProjectType.Earn].icon}
        {t({ enUS: 'Professional', zhCN: '专业模式' })}
      </>
    ),
    icon: ProjectTypeRefs.Earn.icon,
    value: 'customize',
    comp: () => <ProductCustomize onlyForm className={styles['automator']} />,
  },
];

const Index = () => {
  const [t] = useTranslation('DefiMode');

  const { mode } = useQuery();

  const options = useMemo(
    () =>
      tabs.map((it) => ({
        ...it,
        label: it.label(t),
      })),
    [t],
  );

  const tab = useMemo(
    () => tabs.find((it) => it.value === mode) || tabs[0],
    [mode],
  );

  return (
    <TopTabs
      bannerClassName={styles['banner']}
      tabClassName={styles['tabs']}
      className={styles['content']}
      contentDecorationClassName={styles['decoration']}
      banner={<></>}
      value={(mode as string) || 'diy'}
      options={options}
      onChange={(v) => updateQuery({ mode: v })}
    >
      {tab.comp()}
    </TopTabs>
  );
};

export default Index;
