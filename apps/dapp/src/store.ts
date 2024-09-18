import { ContractsService } from '@sofa/services/contracts';
import { MarketService } from '@sofa/services/market';
import { VaultInfo } from '@sofa/services/products';
import { AuthValue } from '@sofa/utils/env';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { useWalletStore } from './components/WalletConnector/store';

export const useGlobalState = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        loading: true,
        vaults: [] as VaultInfo[],
        interestRate: {} as PartialRecord<
          number /* chainId */,
          PartialRecord<
            string /* currency */,
            {
              current: number;
              avgWeekly: number;
              apyUsed: number;
            }
          >
        >,
        auth: undefined as AuthValue | undefined,
      }),
      {
        name: 'global-state',
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
  {
    getVaultInfo: ContractsService.getVaultInfo,
    async getVaults() {
      useGlobalState.setState({
        loading: false,
        vaults: ContractsService.vaults,
      });
    },
    async updateInterestRate() {
      const { chainId } = useWalletStore.getState();
      // 不要 return
      MarketService.interestRate(chainId).then((interestRate) =>
        useGlobalState.setState((pre) => ({
          interestRate: { ...pre.interestRate, [chainId]: interestRate },
        })),
      );
    },
  },
);
