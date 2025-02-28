import { VaultInfo } from '@sofa/services/base-type';
import { MarketService } from '@sofa/services/market';
import { useRequest } from 'ahooks';

export function usePPSNow(vault?: VaultInfo) {
  const { data } = useRequest(
    async () =>
      vault === undefined
        ? undefined
        : vault.depositBaseCcy
          ? (
              await MarketService.getPPS({
                fromCcy: vault.depositCcy,
                toCcy: vault.depositBaseCcy,
                includeNow: true,
              })
            ).now
          : 1,
    {
      refreshDeps: [Math.floor(Date.now() / 60000)],
    },
  );
  return data;
}
