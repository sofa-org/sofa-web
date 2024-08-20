import { useMemo } from 'react';
import { defaultChain } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';

import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import Account from './components/Account';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RCH');

const Index = () => {
  const [t] = useTranslation('RCH');
  const tabs = useMemo(() => [], []);

  const wallet = useWalletStore();

  if (wallet.chainId !== defaultChain.chainId)
    return (
      <span className={styles['tips']}>
        {t('Please switch to {{chain}}', { chain: defaultChain.name })}
      </span>
    );

  return (
    <>
      <TopTabs
        bannerClassName={styles['banner']}
        className={styles['container']}
        banner={<></>}
        options={tabs}
        dark
        type="btn"
        onChange={(v) => updateQuery({ tab: v })}
        extraTopContent={<div className={styles['title']}>{t('My RCH')}</div>}
      >
        <Account />
      </TopTabs>
      <div className={styles['bee']}>{/* <SplineModel id="bee" /> */}</div>
    </>
  );
};

export default Index;
