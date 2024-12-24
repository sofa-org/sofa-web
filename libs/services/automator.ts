import { cvtAmountsInCcy } from '@sofa/utils/amount';
import { asyncCache } from '@sofa/utils/decorators';
import { MsIntervals } from '@sofa/utils/expiry';
import { safeRun } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import Big from 'big.js';
import { ethers } from 'ethers';
import { get } from 'lodash-es';

import AutomatorAbis from './abis/Automator.json';
import {
  getCollateralDecimal,
  getDepositMinAmount,
  getDepositTickAmount,
} from './vaults/utils';
import {
  AutomatorTransactionStatus,
  AutomatorVaultInfo,
  ProjectType,
  TransactionStatus,
} from './base-type';
import { ContractsService } from './contracts';
import { MarketService } from './market';
import { TransactionProgress } from './positions';
import { PositionStatus } from './the-graph';
import { WalletService } from './wallet';

// server 返回的结构
export interface OriginAutomatorInfo {
  chainId: number; // 链代码
  automatorVault: string; // Automator vault
  amount: number | string; // 当前aum值
  nav: number | string; // 净值
  dateTime: number; // 净值产生的时间（秒级时间戳）
  yieldPercentage: number | string; // 7D Yield(百分比)
  automatorName?: string; // 名称
  automatorDesc?: string; // 介绍
  creatorWallet?: string; // 创建者钱包地址
  creatorAmount?: number | string; // 创建者钱包地址
  participantNum?: number | string; // 参与者数量
  depositCcy: string;
}

export interface AutomatorInfo
  extends Omit<OriginAutomatorInfo, 'chainId' | 'automatorVault'> {
  vaultInfo: AutomatorVaultInfo;
}

export interface AutomatorPosition {
  vault: string; // 合约地址
  chainId: number | number; // 链ID
  direction: string; // BULLISH,BEARISH
  forCcy: string; // 标的物币种
  domCcy: string; // 币对
  depositCcy: string; // 申购币种
  lowerStrike: number | string; // 下方价格
  upperStrike: number | string; // 上方价格
  side: string; // BUY/SELL
  depositPercentage: number | string; // 投资占比（百分比）
  expiry: number; // 到期日对应的秒级时间戳，例如 1672387200
}

export interface AutomatorPerformance {
  aum: number | string; // 期初aum
  rch: number | string; // 空投的rch数量
  rchPrice: number | string; // rch相对Deposit ccy的币价
  dateTime: number; // 日期（秒级时间戳）
  totalDepositCcyPnlForShare: number | string;
  totalDepositCcyPnlForRch: number | string;
}

// server 返回的结构
export interface OriginAutomatorUserDetail {
  chainId: number; // 链代码
  automatorName?: string; // Automator vault
  automatorVault: string; // Automator vault
  wallet: string; // 用户钱包地址
  amount: number | string; // 当前持有的总资产
  share: number | string; // 当前持有的份额
  depositTotalPnl: number | string; // 标的币种的总PNL
  rchTotalPnl: number | string; // Rch的总PNL
  pnlPercentage?: number | string;
}

export interface AutomatorUserDetail
  extends Omit<OriginAutomatorUserDetail, 'chainId' | 'automatorVault'> {
  vaultInfo: AutomatorVaultInfo;
  depositTotalPnlPercentage?: number | string; // 标的币种的总PNL年化
  rchTotalPnlPercentage?: number | string; // Rch的总PNL年化
}

export interface AutomatorTransactionsParams {
  wallet: string; // 用户钱包地址
  startDateTime?: number; // 对应的秒级时间戳，例如 1672387200
}

export interface AutomatorTransaction {
  amount: number | string; // 转换的资产
  share: number | string; // 转换的份额
  status: AutomatorTransactionStatus;
  action: string; // DEPOSIT/WITHDRAW/CLAIM/TRANSFER_IN/TRANSFER_OUT
  dateTime: number; // 日期（秒级时间戳）
}

export enum AutomatorDepositStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export class AutomatorService {
  @asyncCache({
    until: (it, createdAt) =>
      !it || !createdAt || Date.now() - createdAt > MsIntervals.min * 10,
  })
  static async getAutomatorList(params: {
    chainId: number;
    depositCcy?: AutomatorVaultInfo['depositCcy'];
  }) {
    return http
      .get<unknown, HttpResponse<OriginAutomatorInfo[]>>(`/automator/list`, {
        params,
      })
      .then((res) =>
        res.value.map((it) => {
          const collateralDecimal = getCollateralDecimal(
            it.chainId,
            it.depositCcy,
          );
          return {
            ...it,
            name: get(it, 'name') || it.depositCcy,
            depositMinAmount: getDepositMinAmount(
              it.depositCcy,
              ProjectType.Automator,
            ),
            depositTickAmount: getDepositTickAmount(
              it.depositCcy,
              ProjectType.Automator,
            ),
            anchorPricesDecimal: 1e8,
            collateralDecimal,
            abis: AutomatorAbis,
            creatorFeeRate: get(it, 'creatorFeeRate') || 0,
            vaultInfo: {
              ...it,
              ...ContractsService.AutomatorVaults.find(
                (item) =>
                  item.chainId === it.chainId &&
                  item.vault.toLowerCase() === it.automatorVault.toLowerCase(),
              ),
            },
          } as AutomatorInfo;
        }),
      );
  }

  static async getInfo({ chainId, vault }: AutomatorVaultInfo) {
    return http.get<unknown, HttpResponse<OriginAutomatorInfo>>(
      `/automator/info`,
      {
        params: { chainId, automatorVault: vault },
      },
    );
  }

  static async positionsSnapshot({ chainId, vault }: AutomatorVaultInfo) {
    return http.get<unknown, HttpResponse<AutomatorPosition[]>>(
      `/automator/position/list`,
      {
        params: { chainId, automatorVault: vault },
      },
    );
  }

  static async performance({ chainId, vault }: AutomatorVaultInfo) {
    return http.get<unknown, HttpResponse<AutomatorPerformance[]>>(
      `/automator/performance`,
      {
        params: { chainId, automatorVault: vault },
      },
    );
  }

  static async getUserPnl(
    { chainId, vault }: AutomatorVaultInfo,
    wallet: string,
  ) {
    return http.get<unknown, HttpResponse<OriginAutomatorUserDetail>>(
      `/automator/user/detail`,
      {
        params: { chainId, automatorVault: vault, wallet },
      },
    );
  }

  static async getUserPnlList(params: {
    chainId: number;
    wallet: string;
    status: AutomatorDepositStatus;
  }) {
    const [list, vaults, prices] = await Promise.all([
      http
        .get<unknown, HttpResponse<OriginAutomatorUserDetail[]>>(
          `/automator/user/list`,
          { params },
        )
        .then((res) => res.value),
      AutomatorService.getAutomatorList({ chainId: params.chainId }),
      MarketService.fetchIndexPx(),
    ]);
    return list.map((it) => {
      const vaultInfo = vaults.find(
        (item) =>
          item.vaultInfo.chainId === it.chainId &&
          item.vaultInfo.vault.toLowerCase() ===
            it.automatorVault.toLowerCase(),
      )!.vaultInfo;
      const rchValueInDepositCcy = cvtAmountsInCcy(
        [['RCH', it.rchTotalPnl]],
        prices,
        vaultInfo.depositCcy,
      );
      const totalPnl = Number(it.depositTotalPnl) + rchValueInDepositCcy;
      const depositTotalPnlPercentage =
        (Number(it.pnlPercentage) * Number(it.depositTotalPnl)) / totalPnl;
      const rchTotalPnlPercentage =
        (Number(it.pnlPercentage) * rchValueInDepositCcy) / totalPnl;
      return {
        ...it,
        depositTotalPnlPercentage,
        rchTotalPnlPercentage,
        vaultInfo,
      } as AutomatorUserDetail;
    });
  }

  static async transactions(
    { chainId, vault }: AutomatorVaultInfo,
    params: AutomatorTransactionsParams,
    extraParams?: PageParams<'cursor', 'dateTime'>,
  ): Promise<PageResult<AutomatorTransaction, { hasMore: boolean }, 'cursor'>> {
    const limit = extraParams?.limit ?? 20;
    const res = await http.get<unknown, HttpResponse<AutomatorTransaction[]>>(
      `/automator/user/transaction/list`,
      {
        params: {
          chainId,
          automatorVault: vault,
          ...params,
          endDateTime: extraParams?.cursor,
          limit,
        },
      },
    );
    return {
      cursor: res.value[res.value.length - 1]?.dateTime,
      limit,
      list: res.value,
      hasMore: res.value.length >= limit,
    };
  }

  static async getShares({ chainId, vault }: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(chainId);
    const Automator = await ContractsService.AutomatorContract(vault, signer);
    const [shareDecimals, sharesWithDecimals, pricePerShare] =
      await Promise.all([
        Automator.decimals().then((res) => Number(res)),
        Automator.balanceOf(signer.address).then((res) => Number(res)),
        Automator.getPricePerShare().then(
          (res) => +ethers.formatUnits(res, 18),
        ),
      ]);
    const shares = sharesWithDecimals / 10 ** shareDecimals;
    return {
      shareDecimals,
      sharesWithDecimals,
      shares,
      pricePerShare,
      amount: +(shares * pricePerShare).toFixed(6),
    };
  }

  private static progressWrap<Args extends unknown[]>(
    transactionCall: (
      vault: AutomatorVaultInfo,
      ...args: Args
    ) => Promise<string>,
    statusMap: Record<'before' | 'failed' | 'success', PositionStatus>,
  ) {
    return (
      cb: (progress: TransactionProgress) => void,
      vault: AutomatorVaultInfo,
      ...args: Args
    ) => {
      safeRun(cb, { status: 'Submitting' });
      const key = `${vault.vault.toLowerCase()}-${vault.chainId}-${
        vault.depositCcy
      }`;
      return transactionCall(vault, ...args)
        .then(async (hash) => {
          safeRun(cb, {
            status: 'QueryResult',
            details: [
              [
                key,
                {
                  status: statusMap.before,
                  hash,
                  ids: [],
                },
              ],
            ],
          });
          const status = await WalletService.transactionResult(
            hash,
            vault.chainId,
          ).then((res) =>
            res === TransactionStatus.FAILED
              ? statusMap.failed
              : statusMap.success,
          );
          safeRun(cb, {
            status: status === PositionStatus.FAILED ? 'All Failed' : 'Success',
            details: [[key, { status, hash, ids: [] }]],
          });
        })
        .catch((error) => {
          console.error(error);
          safeRun(cb, {
            status: 'SubmitFailed',
            details: [
              [
                key,
                {
                  status: statusMap.failed,
                  error,
                  ids: [],
                },
              ],
            ],
          });
        });
    };
  }

  private static async $deposit(
    { chainId, vault }: AutomatorVaultInfo,
    amount: string | number,
  ) {
    const { signer } = await WalletService.connect(chainId);
    const Automator = await ContractsService.AutomatorContract(vault, signer);
    const [decimals, collateralAddress] = await Promise.all([
      Automator.decimals(),
      Automator.collateral(),
    ]);
    const amountWithDecimals = Big(amount)
      .times(10 ** Number(decimals))
      .toString();
    await WalletService.$approve(
      collateralAddress,
      amountWithDecimals,
      signer,
      vault,
    );
    const genArgs = (gasLimit?: number) => [
      String(amountWithDecimals),
      { gasLimit },
    ];
    return ContractsService.dirtyCall(Automator, 'deposit', genArgs);
  }

  static deposit = AutomatorService.progressWrap(AutomatorService.$deposit, {
    before: PositionStatus.PENDING,
    failed: PositionStatus.FAILED,
    success: PositionStatus.MINTED,
  });

  static async getRedemptionInfo({ chainId, vault }: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(chainId);
    const Automator = await ContractsService.AutomatorContract(vault, signer);
    return Automator.getRedemption().then((res) => {
      return {
        pendingSharesWithDecimals: Number(res[0]),
        createTime: Number(res[1]),
      };
    });
  }

  private static async $redeem(
    { chainId, vault }: AutomatorVaultInfo,
    sharesWithDecimals: string | number,
  ) {
    const { signer } = await WalletService.connect(chainId);
    const Automator = await ContractsService.AutomatorContract(vault, signer);
    const genArgs = (gasLimit?: number) => [
      String(sharesWithDecimals),
      { gasLimit },
    ];
    return ContractsService.dirtyCall(Automator, 'withdraw', genArgs);
  }

  static redeem = AutomatorService.progressWrap(AutomatorService.$redeem, {
    before: PositionStatus.REDEEMING,
    failed: PositionStatus.MINTED,
    success: PositionStatus.REDEEMED,
  });

  private static async $claim({ chainId, vault }: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(chainId);
    const Automator = await ContractsService.AutomatorContract(vault, signer);
    const genArgs = (gasLimit?: number) => [{ gasLimit }];
    return ContractsService.dirtyCall(Automator, 'claimRedemptions', genArgs);
  }

  static claim = AutomatorService.progressWrap(AutomatorService.$claim, {
    before: PositionStatus.CLAIMING,
    failed: PositionStatus.REDEEMED,
    success: PositionStatus.CLAIMED,
  });
}
