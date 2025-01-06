import { ReactNode, useEffect, useMemo } from 'react';
import { ProjectType } from '@sofa/services/base-type';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';

import CEmpty from '@/components/Empty';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorStore } from '../automator/store';
import { useProductsState } from '../automator-store';

import AutomatorTrade from './components/Trade';

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
    value: 'trade',
    content: () => (
      <>
        <AutomatorTrade />
      </>
    ),
  },
  {
    label: (t) => t({ enUS: 'Positions', zhCN: '头寸' }),
    value: 'positions',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Followers', zhCN: '参与钱包' }),
    value: 'followers',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Subscription History', zhCN: '交易记录' }),
    value: 'history',
    content: () => <></>,
  },
];

const Index = () => {
  const [t] = useTranslation('Automator');

  const { tab, v } = useQuery((p) => ({
    tab: p['automator-operate-tab'] as string,
    v: p['automator-vault'] as string,
  }));
  const { vaults } = useAutomatorStore();
  const { chainId, address } = useWalletStore((state) => state);
  const { automatorVault } = useProductsState();
  const options = useMemo(
    () => $options.map((it) => ({ ...it, label: it.label(t) })),
    [t],
  );
  const item = useMemo(
    () => options.find((it) => it.value === tab) || options[0],
    [options, tab],
  );
  useEffect(() => {
    return useAutomatorStore.subscribeVaults(chainId);
  }, [chainId]);
  useEffect(() => {
    const vault = vaults?.find((it) => {
      if (it.chainId !== chainId) return false;
      if (!v) return true;
      return it.vault.toLowerCase() === v.toLowerCase();
    });
    useProductsState.updateAutomatorVault(vault);
  }, [vaults, v]);
  return !automatorVault ? (
    <CEmpty
      className="semi-always-dark"
      description={t({
        enUS: 'There are no supported Automator contracts on this chain. Please switch to another chain',
        zhCN: '这条链上没有支持的 Automator 合约，请切换到其它的链',
      })}
    />
  ) : (
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
      onChange={(v) =>
        updateQuery({
          ['automator-operate-tab']: v,
        })
      }
      options={options}
    >
      <div className={styles['container']}>{item.content()}</div>
    </TopTabs>
  );
};

export default Index;
