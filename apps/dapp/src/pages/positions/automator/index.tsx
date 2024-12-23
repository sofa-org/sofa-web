import { useMemo } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import {
  AutomatorDepositStatus,
  AutomatorService,
} from '@sofa/services/automator';
import { ProjectType } from '@sofa/services/base-type';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import { useRequest } from 'ahooks';

import CEmpty from '@/components/Empty';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import { AutomatorPositionCard } from './components/Card';

import styles from './index.module.scss';

const tabOptions = [
  {
    label: (t: TFunction) => t({ enUS: 'Active', zhCN: '正在持仓' }),
    value: 'active',
  },
  {
    label: (t: TFunction) => t({ enUS: 'Closed', zhCN: '已提现' }),
    value: 'closed',
  },
];

const Index = () => {
  const [t] = useTranslation('AutomatorMarket');
  const wallet = useWalletStore((state) => state);

  const tab = useQuery(
    (q) => (q['automator-positions-tab'] as string) || 'active',
  );
  const options = useMemo(
    () => tabOptions.map((it) => ({ label: it.label(t), value: it.value })),
    [t],
  );

  const { data, loading: loading1 } = useRequest(
    async () => {
      if (!wallet.address) return;
      return AutomatorService.getUserPnlList({
        chainId: wallet.chainId,
        wallet: wallet.address,
        status:
          tab === 'closed'
            ? AutomatorDepositStatus.CLOSED
            : AutomatorDepositStatus.ACTIVE,
      });
    },
    {
      pollingInterval: 6000,
      refreshDeps: [wallet.chainId, tab, wallet.address],
    },
  );

  const loading = loading1 && !data?.length;

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
      onChange={(v) => updateQuery({ 'automator-positions-tab': v })}
    >
      <Spin wrapperClassName={styles['cards']} spinning={loading}>
        {data?.map((it) => {
          return <AutomatorPositionCard key={it.automatorVault} info={it} />;
        })}
        {!data?.length && !loading && <CEmpty className="semi-always-dark" />}
      </Spin>
    </TopTabs>
  );
};

export default Index;
