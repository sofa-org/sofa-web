import { useEffect, useMemo } from 'react';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { CSelect } from '@/components/CSelect';
import { useWalletStore } from '@/components/WalletConnector/store';
import { useAutomatorCreatorStore } from '@/pages/products/automator-mine/store';

import styles from './index.module.scss';

export function useCreatorAutomatorSelector() {
  const wallet = useWalletStore();

  const vault = useQuery((q) => q['automator-vault'] as string | undefined);
  const setAutomator = useLazyCallback((a: AutomatorVaultInfo['vault']) =>
    updateQuery({ 'automator-vault': a }),
  );

  useEffect(() => {
    if (wallet.address)
      useAutomatorCreatorStore.list(wallet.chainId, wallet.address);
  }, [wallet.address, wallet.chainId]);

  const automators = useAutomatorCreatorStore(
    (state) =>
      state.vaults[`${wallet.chainId}-${wallet.address?.toLowerCase()}`],
  );

  const automator = useMemo(
    () =>
      automators?.find(
        (it) => it.vaultInfo.vault.toLowerCase() === vault?.toLowerCase(),
      ) || automators?.[0],
    [automators, vault],
  );

  return { automator, setAutomator, automators };
}

export const CreatorAutomatorSelector = (
  props: BaseProps & {
    dropdownClassName?: string;
    dark?: boolean;
  },
) => {
  const { automator, setAutomator, automators } = useCreatorAutomatorSelector();

  const options = useMemo(() => {
    if (!automators) return [];
    return automators.map((it) => ({
      label: (
        <span
          className={classNames(styles['automator-item'], 'automator-item')}
        >
          {it.vaultInfo.name}
        </span>
      ),
      value: it.vaultInfo.vault.toLowerCase(),
    }));
  }, [automators]);

  console.log(1111, options);

  return (
    <CSelect
      className={classNames(
        styles['automator-selector'],
        { [styles['dark']]: props.dark },
        props.className,
      )}
      dropdownClassName={classNames(
        styles['automator-dropdown'],
        props.dropdownClassName,
      )}
      style={props.style}
      optionList={options}
      value={automator?.vaultInfo.vault.toLowerCase()}
      onChange={(v) => setAutomator(v as string)}
    />
  );
};
