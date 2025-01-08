import { useEffect, useMemo } from 'react';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';

import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorStore } from '../automator/store';

export function useAutomatorMarketSelector() {
  const { chainId } = useWalletStore((state) => state);
  const v = useQuery((p) => p['automator-vault'] as string);
  useEffect(() => {
    return useAutomatorStore.subscribeVaults(chainId);
  }, [chainId]);
  const automators = useAutomatorStore((state) => state.vaults[chainId]);
  const automator = useMemo(
    () =>
      automators?.find((it) => {
        if (it.chainId !== chainId) return false;
        if (!v) return true;
        return it.vault.toLowerCase() === v.toLowerCase();
      }) || automators?.[0],
    [automators, chainId, v],
  );
  const setAutomator = useLazyCallback((v: AutomatorVaultInfo['vault']) =>
    updateQuery({ 'automator-vault': v }),
  );
  return { automator, automators, setAutomator };
}
