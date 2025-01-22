import { Toast } from '@douyinfe/semi-ui';
import {
  AutomatorDepositStatus,
  AutomatorDetail,
  AutomatorInfo,
  AutomatorPerformance,
  AutomatorPosition,
} from '@sofa/services/automator';
import { AutomatorService } from '@sofa/services/automator';
import {
  AutomatorUserPosition,
  AutomatorUserService,
} from '@sofa/services/automator-user';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { MsIntervals } from '@sofa/utils/expiry';
import { getErrorMsg } from '@sofa/utils/fns';
import { arrToDict } from '@sofa/utils/object';
import { isEqual } from 'lodash-es';
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
  createWithEqualityFn(
    () => ({
      vaults: {} as Record<
        AutomatorVaultInfo['chainId'],
        Record<AutomatorVaultInfo['vault'], AutomatorVaultInfo> | null
      >,
      vaultOverviews: {} as Record<K, AutomatorInfo & Partial<AutomatorDetail>>,
      vaultDetails: {} as Record<K, AutomatorDetail>,
      snapshots: {} as Record<K, AutomatorPosition[]>,
      performances: {} as Record<K, AutomatorPerformance[]>,
      userInfos: {} as Record<
        K,
        {
          server?: AutomatorUserPosition;
          shareInfo?: PromiseVal<
            ReturnType<typeof AutomatorUserService.userShares>
          >;
          redemptionInfo?: PromiseVal<
            ReturnType<typeof AutomatorUserService.userRedemptionInfo>
          >;
        }
      >,
      depositData: {} as Record<K, AutomatorDepositData>,
      redeemData: {} as Record<K, AutomatorRedeemData>,
    }),
    isEqual,
  ),
  {
    getAutomatorVaults: async (chainId: number) => {
      return AutomatorService.automatorList({ chainId }).then((res) => {
        const vaults = res.map((it) => it.vaultInfo);
        const vaultOverviews = arrToDict(
          res,
          (it) =>
            `${it.vaultInfo.chainId}-${it.vaultInfo.vault.toLowerCase()}-`,
        );
        useAutomatorStore.setState((pre) => ({
          vaults: {
            ...pre.vaults,
            [chainId]: arrToDict(vaults, (it) => it.vault.toLowerCase()),
          },
          vaultOverviews: { ...pre.vaultOverviews, ...vaultOverviews },
        }));
      });
    },
    _subscribeVaultsTimer: null as ReturnType<typeof setInterval> | null,
    subscribeVaults: (chainId: number) => {
      if (!useAutomatorStore._subscribeVaultsTimer) {
        useAutomatorStore.getAutomatorVaults(chainId);
        useAutomatorStore._subscribeVaultsTimer = setInterval(
          () => useAutomatorStore.getAutomatorVaults(chainId),
          MsIntervals.min,
        );
      }
      return () => {
        clearInterval(useAutomatorStore._subscribeVaultsTimer!);
        useAutomatorStore._subscribeVaultsTimer = null;
      };
    },
    _subscribeOverviewTimer: null as ReturnType<typeof setInterval> | null,
    subscribeOverview: (vault: AutomatorVaultInfo) => {
      const sync = () =>
        AutomatorService.info(vault)
          .then((overview) => {
            useAutomatorStore.setState((pre) => ({
              vaults: {
                ...pre.vaults,
                [vault.chainId]: {
                  ...pre.vaults[vault.chainId],
                  [vault.vault.toLowerCase()]: overview.vaultInfo,
                },
              },
              vaultOverviews: {
                ...pre.vaultOverviews,
                [`${vault.chainId}-${vault.vault.toLowerCase()}-`]: overview,
              },
              vaultDetails: {
                ...pre.vaultDetails,
                [`${vault.chainId}-${vault.vault.toLowerCase()}-`]: overview,
              },
            }));
          })
          .catch((err) =>
            Toast.error(`Failed to fetch overview: ${getErrorMsg(err)}`),
          );
      if (!useAutomatorStore._subscribeOverviewTimer) {
        sync();
        useAutomatorStore._subscribeOverviewTimer = setInterval(
          sync,
          MsIntervals.day,
        );
      }
      return () => {
        clearInterval(useAutomatorStore._subscribeOverviewTimer!);
        useAutomatorStore._subscribeOverviewTimer = null;
      };
    },
    _subscribeSnapshotsTimer: null as ReturnType<typeof setInterval> | null,
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
      if (!useAutomatorStore._subscribeSnapshotsTimer) {
        sync();
        useAutomatorStore._subscribeSnapshotsTimer = setInterval(
          sync,
          MsIntervals.day,
        );
      }
      return () => {
        clearInterval(useAutomatorStore._subscribeSnapshotsTimer!);
        useAutomatorStore._subscribeSnapshotsTimer = null;
      };
    },
    _subscribePerformancesTimer: null as ReturnType<typeof setInterval> | null,
    subscribePerformances: (vault: AutomatorVaultInfo) => {
      console.log(111121, useAutomatorStore._subscribePerformancesTimer);
      const sync = () =>
        AutomatorService.performance(vault)
          .then((weeklyPnlList) => {
            console.log(11112, vault, weeklyPnlList);
            useAutomatorStore.setState((pre) => ({
              performances: {
                ...pre.performances,
                [`${vault.chainId}-${vault.vault.toLowerCase()}-`]:
                  weeklyPnlList.value,
              },
            }));
          })
          .catch((err) =>
            Toast.error(`Failed to fetch weekly pnl list: ${getErrorMsg(err)}`),
          );
      if (!useAutomatorStore._subscribePerformancesTimer) {
        sync();
        useAutomatorStore._subscribePerformancesTimer = setInterval(
          sync,
          MsIntervals.day,
        );
      }
      return () => {
        clearInterval(useAutomatorStore._subscribePerformancesTimer!);
        useAutomatorStore._subscribePerformancesTimer = null;
        console.log(111123, 'clear _subscribePerformancesTimer');
      };
    },
    getUserInfoList: async (chainId: number, wallet: string) => {
      return Promise.all([
        AutomatorUserService.userPositionList({
          chainId,
          wallet,
          status: AutomatorDepositStatus.ACTIVE,
        }),
        AutomatorUserService.userPositionList({
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
    _subscribeUserInfoListTimer: null as ReturnType<typeof setInterval> | null,
    subscribeUserInfoList: (chainId: number, wallet: string) => {
      if (!useAutomatorStore._subscribeUserInfoListTimer) {
        useAutomatorStore.getUserInfoList(chainId, wallet);
        useAutomatorStore._subscribeUserInfoListTimer = setInterval(
          () => useAutomatorStore.getUserInfoList(chainId, wallet),
          MsIntervals.min,
        );
      }
      return () => {
        clearInterval(useAutomatorStore._subscribeUserInfoListTimer!);
        useAutomatorStore._subscribeUserInfoListTimer = null;
      };
    },
    updateUserInfo: (vault: AutomatorVaultInfo, address: string) => {
      AutomatorUserService.userPosition(vault, address)
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
      AutomatorUserService.userShares(vault)
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
      AutomatorUserService.userRedemptionInfo(vault)
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
    _subscribeUserInfoTimer: null as ReturnType<typeof setInterval> | null,
    subscribeUserInfo: (vault: AutomatorVaultInfo, address: string) => {
      if (!useAutomatorStore._subscribeUserInfoTimer) {
        useAutomatorStore.updateUserInfo(vault, address);
        useAutomatorStore._subscribeUserInfoTimer = setInterval(
          () => useAutomatorStore.updateUserInfo(vault, address),
          MsIntervals.min,
        );
      }
      return () => {
        clearInterval(useAutomatorStore._subscribeUserInfoTimer!);
        useAutomatorStore._subscribeUserInfoTimer = null;
      };
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
