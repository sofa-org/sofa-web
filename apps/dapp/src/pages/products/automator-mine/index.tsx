import { useEffect } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { ProjectType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorModal } from '../automator/index-modal';

import { AutomatorCreatorCard } from './components/Card';
import { useAutomatorCreatorStore } from './store';

import styles from './index.module.scss';

const Index = () => {
  const [t] = useTranslation('AutomatorMarket');
  const wallet = useWalletStore((state) => state);

  useEffect(() => {
    if (wallet.address)
      useAutomatorCreatorStore.list(wallet.chainId, wallet.address);
  }, [wallet.address, wallet.chainId]);

  const list = useAutomatorCreatorStore((state) => {
    const map =
      state.vaults[`${wallet.chainId}-${wallet.address?.toLowerCase()}`];
    return map && Object.values(map);
  });

  const tab = useQuery((q) => (q['automator-market-tab'] as string) || 'all');

  const loading = !list;

  const [modal, modalController] = useAutomatorModal();

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
              enUS: 'My Automator',
              zhCN: '我的 Automator',
            })}
          </h1>
          {/* <div className={styles['desc']}>
              {ProjectTypeRefs[ProjectType.Automator].desc(t)}
            </div> */}
        </>
      }
      dark
      options={[]}
      prefix={t({ enUS: 'Product', zhCN: '产品' })}
      sticky
      value={tab}
      onChange={(v) => updateQuery({ 'automator-market-tab': v })}
    >
      <Spin
        wrapperClassName={classNames(styles['cards-wrapper'])}
        spinning={loading}
      >
        {list?.map((a) => (
          <AutomatorCreatorCard
            key={a.vaultInfo.vault.toLowerCase()}
            info={a}
            modalController={modalController}
          />
        ))}
        {!list?.length && !loading && <CEmpty className="semi-always-dark" />}
      </Spin>
      {modal}
    </TopTabs>
  );
};

export default Index;
