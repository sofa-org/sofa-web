import { Toast } from '@douyinfe/semi-ui';
import { AutomatorDetail } from '@sofa/services/automator';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { getErrorMsg } from '@sofa/utils/fns';
import { arrToDict } from '@sofa/utils/object';
import { isEqual } from 'lodash-es';
import { createWithEqualityFn } from 'zustand/traditional';

import { useAutomatorStore } from './../automator/store';

export const useAutomatorCreatorStore = Object.assign(
  createWithEqualityFn(
    () => ({
      vaults: {} as Record<
        `${number}-${string}` /* chainId-wallet */,
        AutomatorDetail[] | null
      >,
    }),
    isEqual,
  ),
  {
    list: async (chainId: number, wallet: string) => {
      return AutomatorCreatorService.automatorList({ chainId, wallet })
        .then((res) => {
          const vaultOverviews = arrToDict(
            res,
            (it) =>
              `${it.vaultInfo.chainId}-${it.vaultInfo.vault.toLowerCase()}-`,
          );
          useAutomatorCreatorStore.setState((pre) => ({
            ...pre,
            vaults: {
              ...pre.vaults,
              [`${chainId}-${wallet.toLowerCase()}`]: res,
            },
          }));
          useAutomatorStore.setState((pre) => ({
            ...pre,
            vaults: {
              ...pre.vaults,
              [chainId]: {
                ...pre.vaults[chainId],
                ...arrToDict(
                  res.map((it) => ({
                    ...pre.vaults[chainId]?.[it.vaultInfo.vault.toLowerCase()],
                    ...it.vaultInfo,
                  })),
                  (it) => it.vault.toLowerCase(),
                ),
              },
            },
            vaultOverviews: { ...pre.vaultOverviews, ...vaultOverviews },
          }));
        })
        .catch((err) => Toast.error(getErrorMsg(err)));
    },
  },
);
