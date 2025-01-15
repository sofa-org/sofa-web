import { useEffect, useMemo } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorInfo } from '@sofa/services/automator';
import { AutomatorUserPosition } from '@sofa/services/automator-user';
import { AutomatorVaultInfo, ProjectType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { ContractsService } from '@sofa/services/contracts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import { arrToDict } from '@sofa/utils/object';

import CEmpty from '@/components/Empty';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorModal } from '../automator/index-modal';
import { useAutomatorStore } from '../automator/store';

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

  useEffect(() => {
    return useAutomatorStore.subscribeVaults(wallet.chainId);
  }, [wallet.chainId]);

  const data = useAutomatorStore((state) => {
    const vaults = state.vaults[wallet.chainId];
    if (!vaults) return undefined;
    return Object.values(vaults).map(
      (it) => state.vaultOverviews[`${it.chainId}-${it.vault.toLowerCase()}-`],
    );
  });

  const tab = useQuery((q) => (q['automator-market-tab'] as string) || 'all');
  const options = useMemo(
    () => tabOptions.map((it) => ({ label: it.label(t), value: it.value })),
    [t],
  );

  useEffect(() => {
    if (wallet.address)
      return useAutomatorStore.subscribeUserInfoList(
        wallet.chainId,
        wallet.address,
      );
  }, [wallet.address, wallet.chainId]);

  const holding = useAutomatorStore((state) => {
    const list = Object.values(state.userInfos)
      .map((it) => it.server)
      .filter(Boolean);
    if (!list) return undefined;
    return list.filter((it) =>
      Number(it?.amountByVaultDepositCcy),
    ) as AutomatorUserPosition[];
  });

  const lists = useMemo(() => {
    if (!data || (tab === 'holding' && !holding)) return undefined;
    const bool = arrToDict(holding || [], (it) =>
      it.vaultInfo.vault.toLowerCase(),
    );
    const map = data.reduce(
      (pre, it) => {
        if (tab === 'holding' && !bool[it.vaultInfo.vault.toLowerCase()])
          return pre;
        const vault = it.vaultInfo;
        if (!vault) return pre;
        if (!pre[vault.depositCcy]) pre[vault.depositCcy] = [];
        pre[vault.depositCcy].push(it);
        return pre;
      },
      {} as Record<AutomatorVaultInfo['depositCcy'], AutomatorInfo[]>,
    );
    return Object.entries(map);
  }, [data, holding, tab]);

  const loading = (tab === 'holding' ? !holding : !data) && !lists?.length;

  const [modal, modalController] = useAutomatorModal();

  const chains = useMemo(
    () =>
      (Env.isDaily ? [421614] : [1, 42161])
        .map((it) => ChainMap[it]?.name)
        .filter(Boolean)
        .join(', '),
    [],
  );

  return (
    <TopTabs
      type={'banner-expandable-tab'}
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
                <AutomatorCard
                  key={a.vaultInfo.vault.toLowerCase()}
                  info={a}
                  modalController={modalController}
                />
              ))}
            </div>
          );
        })}
        {!lists?.length && !loading && (
          <CEmpty
            className="semi-always-dark"
            description={t(
              {
                enUS: 'There are no supported Automator contracts on this chain. Please switch to another chain, such as {{chains}}',
                zhCN: '这条链上没有支持的 Automator 合约，请切换到其它的链，比如 {{chains}}',
              },
              { chains },
            )}
          />
        )}
      </Spin>
      {modal}
    </TopTabs>
  );
};

export default Index;
