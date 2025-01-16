import { Toast } from '@douyinfe/semi-ui';
import { AutomatorDetail } from '@sofa/services/automator';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { getErrorMsg } from '@sofa/utils/fns';
import { arrToDict, objectValCvt } from '@sofa/utils/object';
import { isEqual } from 'lodash-es';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { useAutomatorStore } from './../automator/store';

export const useAutomatorCreatorStore = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        vaults: {} as Record<
          `${number}-${string}` /* chainId-wallet */,
          Record<AutomatorVaultInfo['vault'], AutomatorDetail> | null
        >,
      }),
      {
        name: 'global-state',
        storage: createJSONStorage(() => localStorage),
      },
    ),
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
            vaultOverviews: {
              ...pre.vaultOverviews,
              ...objectValCvt(vaultOverviews, (v, k) => ({
                ...pre.vaultOverviews[k as never],
                ...v,
              })),
            },
          }));
        })
        .catch((err) => Toast.error(getErrorMsg(err)));
    },
  },
);
