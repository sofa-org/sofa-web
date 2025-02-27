import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from '@douyinfe/semi-ui';
import { ChainMap, defaultChain } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';
import { useGlobalState } from '@/store';

import AsyncButton from '../AsyncButton';
import { useWalletStore } from '../WalletConnector/store';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'NetworkSelector');

export const NetworkTypes = Object.values(ChainMap).map((it) => ({
  label: it.name,
  chainId: it.chainId,
  icon: it.icon,
}));

const onlyMainnetPaths = ['/rch'];

const NetworkSelector = () => {
  const [t] = useTranslation('NetworkSelector');
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const chainId = useWalletStore((state) => state.chainId);
  const chainName = useWalletStore((state) => state.chainName);
  const address = useWalletStore((state) => state.address);
  const chainInfo = ChainMap[chainId] || ChainMap[NetworkTypes[0]?.chainId];
  const envMatched = !!chainInfo;

  useEffect(() => {
    if (
      !envMatched ||
      (/rch/.test(location.pathname) && chainId !== defaultChain.chainId)
    )
      setVisible(true);
  }, [chainId, envMatched, location.pathname]);

  useEffect(() => {
    useGlobalState.updateInterestRate();
  }, [chainId]);

  useEffect(() => {
    const pro = useWalletStore.subscribeChainChange();
    return () => {
      pro.then((un) => un?.());
    };
  }, [address]);

  const networkOptions = useMemo(
    () =>
      !onlyMainnetPaths.includes(location.pathname)
        ? NetworkTypes
        : NetworkTypes.filter((it) => it.chainId === defaultChain.chainId),
    [location.pathname],
  );

  return (
    <>
      <div
        className={styles['network-selector']}
        onClick={() => setVisible(true)}
      >
        <img src={chainInfo.icon} alt="" />
      </div>
      <Modal
        centered
        className={styles['network-selector-modal']}
        width={320 / window.winScale}
        visible={visible}
        onCancel={() => setVisible(false)}
        closable={envMatched}
        maskClosable={envMatched}
        closeOnEsc={envMatched}
        title={t('title')}
        footer={null}
      >
        <div className={styles['tips']}>
          {!envMatched
            ? t(
                'Current network is {{currName}}({{currChainId}}), please switch to one of networks below',
                {
                  currName: ChainMap[chainId]?.name || chainName || 'Unknown',
                  currChainId: chainId,
                },
              )
            : t('tips')}
        </div>
        {networkOptions.map((it) => (
          <AsyncButton
            className={classNames('btn-ghost', {
              [styles['active']]: it.chainId === chainId,
            })}
            block
            onClick={() =>
              useWalletStore.setChain(it.chainId).then(() => {
                setVisible(false);
              })
            }
            key={it.chainId}
          >
            <img src={it.icon} alt="" />
            {t('btn', { name: it.label })}
          </AsyncButton>
        ))}
      </Modal>
    </>
  );
};

export default NetworkSelector;
