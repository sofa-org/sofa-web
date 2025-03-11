import { useEffect, useMemo } from 'react';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';

import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorStore } from '../automator/store';

export function useAutomatorMarketSelector(options?: { queryName?: string }) {
  const { chainId } = useWalletStore((state) => state);
  const v = useQuery(
    (p) => p[options?.queryName || 'automator-vault'] as string,
  );
  useEffect(() => {
    return useAutomatorStore.subscribeVaults(chainId);
  }, [chainId]);
  const automators = useAutomatorStore((state) =>
    state.vaults[chainId]
      ? Object.values(state.vaults[chainId]!)
      : ContractsService.AutomatorVaults.filter((it) => it.chainId === chainId),
  );
  const automator = useMemo(
    () =>
      automators?.find((it) => {
        if (it.chainId !== chainId) return false;
        if (!v) return true;
        return it.vault.toLowerCase() === v.toLowerCase();
      }) || (automators?.[0] as AutomatorVaultInfo | undefined),
    [automators, chainId, v],
  );

  useEffect(
    () => automator && useAutomatorStore.subscribeOverview(automator),
    [automator],
  );

  const setAutomator = useLazyCallback((v: AutomatorVaultInfo['vault']) =>
    updateQuery({ 'automator-vault': v }),
  );
  return { automator, automators, setAutomator };
}
