import { useMemo } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import {
  AutomatorDepositStatus,
  AutomatorInfo,
  AutomatorService,
} from '@sofa/services/automator';
import { AutomatorVaultInfo, ProjectType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService } from '@sofa/services/contracts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import { arrToDict } from '@sofa/utils/object';
import { useRequest } from 'ahooks';

import CEmpty from '@/components/Empty';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import { AutomatorCard } from './components/Card';

import styles from './index.module.scss';

const tabOptions = [
  {
    label: (t: TFunction) => t({ enUS: 'All', zhCN: '全部' }),
    value: 'all',
  },
  {
    label: (t: TFunction) => t({ enUS: 'Holding', zhCN: '我参与的' }),
    value: 'holding',
  },
];

const Index = () => {
  const [t] = useTranslation('AutomatorMarket');
  const wallet = useWalletStore((state) => state);
  const { data, loading: loading1 } = useRequest(
    () => AutomatorService.getAutomatorList({ chainId: wallet.chainId }),
    { pollingInterval: 6000, refreshDeps: [wallet.chainId] },
  );
  const tab = useQuery((q) => (q['automator-market-tab'] as string) || 'all');
  const options = useMemo(
    () => tabOptions.map((it) => ({ label: it.label(t), value: it.value })),
    [t],
  );

  const { data: holding, loading: loading2 } = useRequest(
    async () => {
      if (!wallet.address || tab !== 'holding') return undefined;
      return (
        wallet.address &&
        AutomatorService.getUserPnlList({
          chainId: wallet.chainId,
          wallet: wallet.address,
          status: AutomatorDepositStatus.ACTIVE,
        })
      );
    },
    {
      pollingInterval: 6000,
      refreshDeps: [wallet.chainId, tab, wallet.address],
    },
  );

  const lists = useMemo(() => {
    if (!data) return undefined;
    const bool = arrToDict(holding || [], (it) =>
      it.automatorVault.toLowerCase(),
    );
    const map = data.reduce(
      (pre, it) => {
        if (tab === 'holding' && !bool[it.automatorVault.toLowerCase()])
          return pre;
        const vault = ContractsService.AutomatorVaults.find(
          (item) =>
            item.chainId === wallet.chainId &&
            item.vault.toLowerCase() === it.automatorVault.toLowerCase(),
        );
        if (!vault) return pre;
        if (!pre[vault.depositCcy]) pre[vault.depositCcy] = [];
        pre[vault.depositCcy].push(it);
        return pre;
      },
      {} as Record<AutomatorVaultInfo['depositCcy'], AutomatorInfo[]>,
    );
    return Object.entries(map);
  }, [data, holding, tab, wallet.chainId]);

  const loading = (tab === 'holding' ? loading2 : loading1) && !lists?.length;

  return (
    <TopTabs
      type={'banner-expandable'}
      className={styles['container']}
      tabClassName={styles['tabs']}
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
      dark
      options={options}
      prefix={t({ enUS: 'Product', zhCN: '产品' })}
      sticky
      value={tab}
      onChange={(v) => updateQuery({ 'automator-market-tab': v })}
    >
      <Spin wrapperClassName={styles['cards-wrapper']} spinning={loading}>
        {lists?.map((it) => {
          return (
            <div className={styles['cards']} key={it[0]}>
              {lists.length > 1 && (
                <div className={styles['title']}>
                  <img src={CCYService.ccyConfigs[it[0]]?.icon} alt="" />
                  {it[0]}
                </div>
              )}
              {it[1].map((a) => (
                <AutomatorCard key={a.automatorVault} info={a} />
              ))}
            </div>
          );
        })}
        {!lists?.length && !loading && <CEmpty className="semi-always-dark" />}
      </Spin>
    </TopTabs>
  );
};

export default Index;
