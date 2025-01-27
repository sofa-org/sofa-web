import { useEffect, useMemo } from 'react';
import { AutomatorDetail } from '@sofa/services/automator';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';
import { parse } from 'qs';

import { CSelect } from '@/components/CSelect';
import { useWalletStore } from '@/components/WalletConnector/store';
import { useAutomatorStore } from '@/pages/products/automator/store';
import { useAutomatorCreatorStore } from '@/pages/products/automator-mine/store';

import styles from './index.module.scss';

export function useCreatorAutomatorSelector(noNeedDetail?: boolean) {
  const wallet = useWalletStore();

  const vault = useQuery((q) => q['automator-vault'] as string | undefined);
  const setAutomator = useLazyCallback((a: AutomatorVaultInfo['vault']) =>
    updateQuery({ 'automator-vault': a }),
  );

  useEffect(() => {
    if (wallet.address)
      useAutomatorCreatorStore.list(wallet.chainId, wallet.address);
  }, [wallet.address, wallet.chainId]);

  const automators = useAutomatorCreatorStore((state) => {
    const map =
      state.vaults[`${wallet.chainId}-${wallet.address?.toLowerCase()}`];
    return map && Object.values(map);
  });

  const $automator = useMemo(
    () =>
      automators?.find(
        (it) => it.vaultInfo.vault.toLowerCase() === vault?.toLowerCase(),
      ) || automators?.[0],
    [automators, vault],
  );

  const automator = useAutomatorStore((state) => {
    if (!$automator) return undefined;
    return {
      ...$automator,
      ...state.vaultOverviews[
        `${
          $automator.vaultInfo.chainId
        }-${$automator.vaultInfo.vault.toLowerCase()}-`
      ],
    } as AutomatorDetail;
  });

  useEffect(() => {
    if (!noNeedDetail && automator?.vaultInfo)
      return useAutomatorStore.subscribeOverview(automator.vaultInfo);
  }, [automator?.vaultInfo, noNeedDetail]);

  return { automator, setAutomator, automators };
}

export function getCurrentCreatorAutomator() {
  const currentVault = String(
    parse(location.search, { ignoreQueryPrefix: true })['automator-vault'] ||
      '',
  );
  const wallet = useWalletStore.getState();
  const $automators =
    useAutomatorCreatorStore.getState().vaults[
      `${wallet.chainId}-${wallet.address?.toLowerCase()}`
    ];
  const automators = $automators && Object.values($automators);
  if (!automators?.length)
    return {
      automator: undefined,
      automators,
    };
  const automator =
    automators?.find(
      (it) => it.vaultInfo.vault.toLowerCase() === currentVault.toLowerCase(),
    ) || automators?.[0];
  return {
    automator,
    automators,
  };
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
