import { Toast } from '@douyinfe/semi-ui';
import {
  AutomatorDepositStatus,
  AutomatorInfo,
  AutomatorPerformance,
  AutomatorPosition,
  AutomatorUserDetail,
} from '@sofa/services/automator';
import { AutomatorService } from '@sofa/services/automator';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { MsIntervals } from '@sofa/utils/expiry';
import { getErrorMsg } from '@sofa/utils/fns';
import { arrToDict } from '@sofa/utils/object';
import { createWithEqualityFn } from 'zustand/traditional';

type K = `${AutomatorVaultInfo['chainId']}-${AutomatorVaultInfo['vault']}-${
  string /* address */
}`;

export interface AutomatorDepositData {
  amount?: string | number;
}

export interface AutomatorRedeemData {
  shares?: string | number;
}

export const useAutomatorStore = Object.assign(
  createWithEqualityFn(() => ({
    vaults: null as AutomatorVaultInfo[] | null,
    vaultOverviews: {} as Record<K, AutomatorInfo>,
    snapshots: {} as Record<K, AutomatorPosition[]>,
    performances: {} as Record<K, AutomatorPerformance[]>,
    userInfos: {} as Record<
      K,
      {
        server?: AutomatorUserDetail;
        shareInfo?: PromiseVal<ReturnType<typeof AutomatorService.getShares>>;
        redemptionInfo?: PromiseVal<
          ReturnType<typeof AutomatorService.getRedemptionInfo>
        >;
      }
    >,
    depositData: {} as Record<K, AutomatorDepositData>,
    redeemData: {} as Record<K, AutomatorRedeemData>,
  })),
  {
    getAutomatorVaults: async (chainId: number) => {
      return AutomatorService.getAutomatorList({ chainId }).then((res) => {
        const vaults = res.map((it) => it.vaultInfo);
        const vaultOverviews = arrToDict(
          res,
          (it) =>
            `${it.vaultInfo.chainId}-${it.vaultInfo.vault.toLowerCase()}-`,
        );
        useAutomatorStore.setState((pre) => ({
          vaults,
          vaultOverviews: { ...pre.vaultOverviews, ...vaultOverviews },
        }));
      });
    },
    subscribeVaults: (chainId: number) => {
      useAutomatorStore.getAutomatorVaults(chainId);
      const timer = setInterval(
        () => useAutomatorStore.getAutomatorVaults(chainId),
        MsIntervals.min,
      );
      return () => clearInterval(timer);
    },
    subscribeOverview: (vault: AutomatorVaultInfo) => {
      const sync = () =>
        AutomatorService.getInfo(vault)
          .then((overview) =>
            useAutomatorStore.setState((pre) => ({
              vaultOverviews: {
                ...pre.vaultOverviews,
                [`${vault.chainId}-${vault.vault.toLowerCase()}-`]: overview,
              },
            })),
          )
          .catch((err) =>
            Toast.error(`Failed to fetch overview: ${getErrorMsg(err)}`),
          );
      sync();
      const interval = setInterval(sync, MsIntervals.day);
      return () => clearInterval(interval);
    },
    subscribeSnapshots: (vault: AutomatorVaultInfo) => {
      const sync = () =>
        AutomatorService.positionsSnapshot(vault)
          .then((snapshots) =>
            useAutomatorStore.setState((pre) => ({
              snapshots: {
                ...pre.snapshots,
                [`${vault.chainId}-${vault.vault.toLowerCase()}-`]:
                  snapshots.value,
              },
            })),
          )
          .catch((err) =>
            Toast.error(`Failed to fetch snapshots: ${getErrorMsg(err)}`),
          );
      sync();
      const interval = setInterval(sync, MsIntervals.day);
      return () => clearInterval(interval);
    },
    subscribePerformances: (vault: AutomatorVaultInfo) => {
      const sync = () =>
        AutomatorService.performance(vault)
          .then((weeklyPnlList) =>
            useAutomatorStore.setState((pre) => ({
              performances: {
                ...pre.performances,
                [`${vault.chainId}-${vault.vault.toLowerCase()}-`]:
                  weeklyPnlList.value,
              },
            })),
          )
          .catch((err) =>
            Toast.error(`Failed to fetch weekly pnl list: ${getErrorMsg(err)}`),
          );
      sync();
      const interval = setInterval(sync, MsIntervals.day);
      return () => clearInterval(interval);
    },
    getUserInfoList: async (chainId: number, wallet: string) => {
      return Promise.all([
        AutomatorService.getUserPnlList({
          chainId,
          wallet,
          status: AutomatorDepositStatus.ACTIVE,
        }),
        AutomatorService.getUserPnlList({
          chainId,
          wallet,
          status: AutomatorDepositStatus.CLOSED,
        }),
      ]).then((list) => {
        useAutomatorStore.setState((pre) => {
          const userInfos = Object.fromEntries(
            list.flat().map((it) => {
              const k = `${
                it.vaultInfo.chainId
              }-${it.vaultInfo.vault.toLowerCase()}-` as const;
              return [k, { ...pre.userInfos[k], server: it }];
            }),
          );
          return {
            userInfos: { ...pre.userInfos, ...userInfos },
          };
        });
      });
    },
    subscribeUserInfoList: (chainId: number, wallet: string) => {
      useAutomatorStore.getUserInfoList(chainId, wallet);
      const timer = setInterval(
        () => useAutomatorStore.getUserInfoList(chainId, wallet),
        MsIntervals.min,
      );
      return () => clearInterval(timer);
    },
    updateUserInfo: (vault: AutomatorVaultInfo, address: string) => {
      AutomatorService.getUserPnl(vault, address)
        .then((userInfo) =>
          useAutomatorStore.setState((pre) => ({
            userInfos: {
              ...pre.userInfos,
              [`${vault.chainId}-${vault.vault.toLowerCase()}-${address}`]: {
                ...pre.userInfos[
                  `${vault.chainId}-${vault.vault.toLowerCase()}-${address}`
                ],
                server: userInfo,
              },
            },
          })),
        )
        .catch((err) =>
          Toast.error(`Failed to fetch user pnl: ${getErrorMsg(err)}`),
        );
      AutomatorService.getShares(vault)
        .then((shareInfo) =>
          useAutomatorStore.setState((pre) => ({
            userInfos: {
              ...pre.userInfos,
              [`${vault.chainId}-${vault.vault.toLowerCase()}-${address}`]: {
                ...pre.userInfos[
                  `${vault.chainId}-${vault.vault.toLowerCase()}-${address}`
                ],
                shareInfo,
              },
            },
          })),
        )
        .catch((err) =>
          Toast.error(`Failed to fetch share info: ${getErrorMsg(err)}`),
        );
      AutomatorService.getRedemptionInfo(vault)
        .then((redemptionInfo) =>
          useAutomatorStore.setState((pre) => ({
            userInfos: {
              ...pre.userInfos,
              [`${vault.chainId}-${vault.vault.toLowerCase()}-${address}`]: {
                ...pre.userInfos[
                  `${vault.chainId}-${vault.vault.toLowerCase()}-${address}`
                ],
                redemptionInfo,
              },
            },
          })),
        )
        .catch((err) =>
          Toast.error(`Failed to fetch redemption info: ${getErrorMsg(err)}`),
        );
    },
    subscribeUserInfo: (vault: AutomatorVaultInfo, address: string) => {
      useAutomatorStore.updateUserInfo(vault, address);
      const interval = setInterval(
        () => useAutomatorStore.updateUserInfo(vault, address),
        MsIntervals.min,
      );
      return () => clearInterval(interval);
    },
    updateDepositData: (
      vault: AutomatorVaultInfo,
      data: AutomatorDepositData,
      address: string,
    ) => {
      useAutomatorStore.setState((pre) => ({
        depositData: {
          ...pre.depositData,
          [`${vault.chainId}-${vault.vault.toLowerCase()}-${address}`]: data,
        },
      }));
    },
    updateRedeemData: (
      vault: AutomatorVaultInfo,
      data: AutomatorRedeemData,
      address: string,
    ) => {
      useAutomatorStore.setState((pre) => ({
        redeemData: {
          ...pre.redeemData,
          [`${vault.chainId}-${vault.vault.toLowerCase()}-${address}`]: data,
        },
      }));
    },
  },
);
