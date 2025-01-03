import { ReactNode, useMemo } from 'react';
import { ProjectType } from '@sofa/services/base-type';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { useQuery } from '@sofa/utils/hooks';

import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';

import styles from './index.module.scss';

const $options: {
  label(t: TFunction): ReactNode;
  value: string;
  content(): ReactNode;
}[] = [
  {
    label: (t) => t({ enUS: 'Performance', zhCN: '历史表现' }),
    value: 'performance',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Trade', zhCN: '交易' }),
    value: 'performance',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Positions', zhCN: '头寸' }),
    value: 'performance',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Followers', zhCN: '参与钱包' }),
    value: 'performance',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Subscription History', zhCN: '交易记录' }),
    value: 'performance',
    content: () => <></>,
  },
];

const Index = () => {
  const [t] = useTranslation('Automator');
  const tab = useQuery((q) => q['automator-operate-tab'] as string);
  const options = useMemo(
    () => $options.map((it) => ({ ...it, label: it.label(t) })),
    [t],
  );
  const item = useMemo(
    () => options.find((it) => it.value === tab) || options[0],
    [options, tab],
  );
  return (
    <TopTabs
      type="banner-expandable-tab"
      className={styles['container']}
      banner={
        <>
          <h1 className={styles['head-title']}>
            {ProjectTypeRefs[ProjectType.Automator].icon}
            {t({
              enUS: 'Automator: Follow The Best',
              zhCN: 'Automator: 跟单',
            })}
          </h1>
          {/* <div className={styles['desc']}>
              {ProjectTypeRefs[ProjectType.Automator].desc(t)}
            </div> */}
        </>
      }
      options={options}
    >
      <div className={styles['container']}>{item.content()}</div>
    </TopTabs>
  );
};

export default Index;
