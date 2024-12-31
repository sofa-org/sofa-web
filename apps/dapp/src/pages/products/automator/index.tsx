import { useMemo, useState } from 'react';
import { Tabs } from '@douyinfe/semi-ui';
import { ProjectType } from '@sofa/services/base-type';
import { ChainMap } from '@sofa/services/chains';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { useIsMobileUI } from '@/components/MobileOnly';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import ProductDesc from '../components/ProductDesc';

import { AutomatorDeposit } from './components/Deposit';
import { AutomatorOverview } from './components/Overview';
import { AutomatorProjectDesc } from './components/ProjectDesc';
import { AutomatorUserInfo } from './components/UserInfo';
import { AutomatorWithdraw } from './components/Withdraw';
import { useAutomatorStore } from './store';

import styles from './index.module.scss';

export const AutomatorEl = (props: BaseProps) => {
  const [t] = useTranslation('Automator');
  const { tab, v } = useQuery((p) => ({
    tab: p['automator-trade-tab'] as string,
    v: p['automator-vault'] as string,
  }));
  const { chainId, address } = useWalletStore((state) => state);
  const isMobileUI = useIsMobileUI();
  const vault = useMemo(
    () =>
      ContractsService.AutomatorVaults.find((it) => {
        if (it.chainId !== chainId) return false;
        if (!v) return true;
        return it.vault.toLowerCase() === v.toLowerCase();
      }),
    [chainId, v],
  );

  const handleSuccess = useLazyCallback(() => {
    if (vault && address) {
      useAutomatorStore.updateUserInfo(vault, address);
      useWalletStore.updateBalanceByAutomatorVault(vault);
    }
  });

  const [mobileUITab, setMobileUITab] = useState<string>(tab);
  const onTabClick = useLazyCallback((tab: string) => {
    if (tab) {
      updateQuery({ 'automator-trade-tab': tab });
    }
    if (isMobileUI) {
      setMobileUITab(tab);
      if (!tab) {
        updateQuery({ 'automator-trade-tab': undefined });
      }
    }
  });

  return (
    <>
      <div
        className={classNames(
          styles['section'],
          styles['section-top'],
          props.className,
        )}
      >
        <AutomatorUserInfo vault={vault} />
        <div className={styles['left']}>
          <AutomatorOverview vault={vault} />
        </div>
        <div
          className={classNames(
            styles['right'],
            styles[`mobile-tab-${mobileUITab || 'none'}`],
          )}
        >
          <div
            className={styles['mobile-tab-bg']}
            onClick={() => onTabClick('')}
          />
          <Tabs
            type="card"
            size="small"
            className={styles['tabs']}
            activeKey={tab === 'redeem' ? 'redeem' : 'deposit'}
            onTabClick={onTabClick}
          >
            <Tabs.TabPane
              itemKey="deposit"
              tab={
                <span
                  className={classNames(styles['tab-title'], styles['deposit'])}
                >
                  {t({ enUS: 'Mint', zhCN: '铸造' })}
                </span>
              }
            >
              <AutomatorDeposit vault={vault} onSuccess={handleSuccess} />
            </Tabs.TabPane>
            <Tabs.TabPane
              itemKey="redeem"
              tab={
                <span
                  className={classNames(styles['tab-title'], styles['redeem'])}
                >
                  {t({ enUS: 'Redeem', zhCN: '赎回' })}
                </span>
              }
            >
              <AutomatorWithdraw vault={vault} onSuccess={handleSuccess} />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const Automator = (props: BaseProps & { onlyForm?: boolean }) => {
  const [t] = useTranslation('Automator');
  const { v } = useQuery((p) => ({ v: p['automator-vault'] as string }));
  const { chainId } = useWalletStore((state) => state);
  const vault = useMemo(
    () =>
      ContractsService.AutomatorVaults.find((it) => {
        if (it.chainId !== chainId) return false;
        if (!v) return true;
        return it.vault.toLowerCase() === v.toLowerCase();
      }),
    [chainId, v],
  );

  const chains = useMemo(
    () =>
      [...new Set(ContractsService.AutomatorVaults.map((it) => it.chainId))]
        .map((it) => ChainMap[it]?.name)
        .filter(Boolean)
        .join(', '),
    [],
  );

  return (
    <TopTabs
      type={'banner-expandable'}
      className={props.className}
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
      options={[]}
      dark
      prefix={t({ enUS: 'Product', zhCN: '产品' })}
      sticky
    >
      {!vault ? (
        <CEmpty
          className="semi-always-dark"
          description={t(
            {
              enUS: 'There are no supported Automator contracts on this chain. Please switch to another chain, such as {{chains}}',
              zhCN: '这条链上没有支持的 Automator 合约，请切换到其它的链，比如{{chains}}',
            },
            { chains },
          )}
        />
      ) : (
        <>
          <div className={styles['form']}>
            <AutomatorEl />
          </div>
          <ProductDesc
            noMoreInfo
            // dark={isMobileUI}
            className={styles['product-desc-wrapper']}
            prefixTabs={[
              {
                itemKey: 'more',
                tab: t({ enUS: 'More Info', zhCN: '更多信息' }),
                element: <AutomatorProjectDesc vault={vault} />,
              },
            ]}
          />
        </>
      )}
    </TopTabs>
  );
};

export default Automator;
