import { useMemo } from 'react';
import { Tabs } from '@douyinfe/semi-ui';
import { ProjectType } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import ProductDesc from '../components/ProductDesc';

import { Comp as DepositIcon } from './assets/icon-deposit.svg';
import { Comp as WithdrawIcon } from './assets/icon-withdraw.svg';
import { AutomatorDeposit } from './components/Deposit';
import { AutomatorOverview } from './components/Overview';
import { AutomatorProjectDesc } from './components/ProjectDesc';
import { AutomatorUserInfo } from './components/UserInfo';
import { AutomatorWithdraw } from './components/Withdraw';

import styles from './index.module.scss';

export const Automator = () => {
  const [t] = useTranslation('Automator');
  const { tab } = useQuery();
  const chainId = useWalletStore((state) => state.chainId);

  const vault = useMemo(
    () => ContractsService.AutomatorVaults.find((it) => it.chainId === chainId),
    [chainId],
  );

  return (
    <TopTabs
      type={'banner-expandable'}
      banner={
        <>
          <h1 className={styles['head-title']}>
            {t({ enUS: 'Automator', zhCN: 'Automator' })}
            {/* <span className={styles['badge']}>
              {t({ enUS: 'Aggressive', zhCN: '激进的' })}
            </span> */}
          </h1>
          <div className={styles['desc']}>
            {ProjectTypeRefs[ProjectType.Automator].desc(t)}
          </div>
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
          description={t({
            enUS: 'Supported Automator vaults are coming soon',
            zhCN: '没有支持的 Automator 合约，敬请期待！',
          })}
        />
      ) : (
        <>
          <div className={classNames(styles['section'], styles['section-top'])}>
            <div className={styles['left']}>
              <AutomatorOverview vault={vault} />
              <AutomatorUserInfo vault={vault} />
            </div>
            <div className={styles['right']}>
              <Tabs
                type="card"
                size="small"
                className={styles['tabs']}
                activeKey={tab === 'redeem' ? 'redeem' : 'deposit'}
                onTabClick={(it) => updateQuery({ tab: it })}
              >
                <Tabs.TabPane
                  itemKey="deposit"
                  tab={
                    <span className={styles['tab-title']}>
                      <DepositIcon />
                      {t({ enUS: 'Deposit', zhCN: '申购' })}
                    </span>
                  }
                >
                  <AutomatorDeposit vault={vault} />
                </Tabs.TabPane>
                <Tabs.TabPane
                  itemKey="redeem"
                  tab={
                    <span className={styles['tab-title']}>
                      <WithdrawIcon />
                      {t({ enUS: 'Redeem', zhCN: '赎回' })}
                    </span>
                  }
                >
                  <AutomatorWithdraw vault={vault} />
                </Tabs.TabPane>
              </Tabs>
            </div>
          </div>
          <ProductDesc
            noMoreInfo
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
