import { useEffect, useMemo } from 'react';
import { ChainMap } from '@sofa/services/chains';
import { objectValCvt } from '@sofa/utils/object';
import classNames from 'classnames';

import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorStore } from '../../automator/store';

import styles from './index.module.scss';
export const ChainList = (props: { dark?: boolean }) => {
  useEffect(() => {
    const unsubscribes = Object.values(ChainMap).map((it) =>
      useAutomatorStore.subscribeVaults(it.chainId),
    );
    return () => unsubscribes.forEach((cb) => cb());
  }, []);

  const vaultsCount = useAutomatorStore((s) =>
    objectValCvt(s.vaults, (v) =>
      !v ? 0 : Object.entries(v).filter((it) => !!it[0]).length,
    ),
  );

  const chainId = useWalletStore((s) => s.chainId);

  const options = useMemo(
    () =>
      Object.values(ChainMap)
        .filter((it) => vaultsCount[it.chainId])
        .map((it) => ({
          label: (
            <>
              <img src={it.icon} alt="" />
              {it.name}
              <span className={styles['count']}>{vaultsCount[it.chainId]}</span>
            </>
          ),
          value: it.chainId,
        })),
    [vaultsCount],
  );

  return (
    <div
      className={classNames(
        styles['chain-select'],
        props.dark ? styles['dark'] : styles['light'],
      )}
    >
      {options.map((it) => (
        <div
          className={classNames(styles['chain'], {
            [styles['active']]: it.value === chainId,
          })}
          key={it.value}
          onClick={() => useWalletStore.setChain(it.value)}
        >
          {it.label}
        </div>
      ))}
    </div>
  );
};
