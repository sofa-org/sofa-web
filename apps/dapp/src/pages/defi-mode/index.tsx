import { useMemo } from 'react';
import { ProjectType } from '@sofa/services/base-type';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { useIsPortraitUI } from '@/components/MobileOnly';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';

import { AutomatorEl } from '../products/automator';
import { ProductCustomize } from '../products/customize';

import { DIY } from './components/DIY';

import styles from './index.module.scss';

const tabs = [
  {
    label: (t: TFunction) => t({ enUS: 'Core Mode', zhCN: '标准模式' }),
    value: 'diy',
    comp: () => <DIY />,
  },
  {
    label: (t: TFunction) => (
      <>
        {ProjectTypeRefs[ProjectType.Automator].icon}
        {t({ enUS: 'Follow the Best', zhCN: '跟单' })}
      </>
    ),
    icon: ProjectTypeRefs.Automator.icon,
    value: 'automator',
    comp: () => <AutomatorEl className={styles['automator']} />,
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

const portraitModeWidthThreshold = 900;
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
  const isPortrait = useIsPortraitUI({
    widthThreshold: portraitModeWidthThreshold,
  });
  return (
    <TopTabs
      bannerClassName={styles['banner']}
      tabClassName={classNames(styles['tabs'], {
        [styles['portrait-ui']]: isPortrait,
      })}
      className={classNames(styles['content'], {
        [styles['portrait-ui']]: isPortrait,
      })}
      contentDecorationClassName={styles['decoration']}
      banner={<></>}
      value={(mode as string) || 'diy'}
      options={options}
      onChange={(v) => updateQuery({ mode: v })}
      portraitModeWidthThreshold={portraitModeWidthThreshold}
    >
      {tab.comp()}
    </TopTabs>
  );
};

export default Index;
