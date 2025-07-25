import { cvtAmountsInCcy } from '@sofa/utils/amount';
import { getErrorMsg, safeRun } from '@sofa/utils/fns';
import { http, pollingUntil } from '@sofa/utils/http';
import { ethers } from 'ethers';
import { uniqBy } from 'lodash-es';

import {
  AutomatorDepositStatus,
  AutomatorInfo,
  AutomatorService,
  AutomatorTransaction,
} from './automator';
import { AutomatorCreatorService } from './automator-creator';
import { AutomatorVaultInfo, TransactionStatus } from './base-type';
import { ContractsService } from './contracts';
import { MarketService } from './market';
import {
  PositionInfo,
  PositionsService,
  TransactionProgress,
} from './positions';
import { PositionStatus } from './the-graph';
import { WalletService } from './wallet';

// server 返回的结构
export interface OriginAutomatorUserPosition {
  chainId: number; // 链代码
  automatorName: string; // automator名称
  automatorVault: string; // Automator vault
  wallet: string; // 用户钱包地址
  amountByVaultDepositCcy: number | string; // 当前持有的总资产(scrvUSD)
  amountByClientDepositCcy: number | string; // 当前持有的总资产(crvUSD)
  share: number | string; // 当前持有的份额
  totalTradingPnlByClientDepositCcy: number | string; // 通过交易产生的额外的VaultDepositCcy 总PNL (crvUSD)
  totalInterestPnlByClientDepositCcy: number | string; // Client申购币种产生的利息
  totalPnlByClientDepositCcy: number | string; // Client申购币种的总PnL (crvUSD)
  totalRchPnlByClientDepositCcy: number | string; // Rch的总PNL(crvUSD)
  totalRchAmount: number | string; // Rch的总PNL(RCH)
  status: string; // ACTIVE/CLOSED
  pnlPercentage: number | string; // Yield(百分比)
  vaultDepositCcy: string; // USDC
  clientDepositCcy: string; // 用户存入的标的物
  sharesToken: string; // 净值单位
  redemptionPeriodDay: number; // 赎回观察时间（单位：天）
}

export interface AutomatorUserPosition
  extends Omit<OriginAutomatorUserPosition, 'chainId' | 'automatorVault'> {
  vaultInfo: AutomatorVaultInfo;
  depositTotalPnlPercentage?: number | string; // 标的币种的总PNL年化
  rchTotalPnlPercentage?: number | string; // Rch的总PNL年化
}

export interface AutomatorTransactionsParams {
  wallet: string; // 用户钱包地址
  startDateTime?: number; // 对应的秒级时间戳，例如 1672387200
}

export interface AutomatorUserPnlRecordsParams {
  wallet: string;
}

export interface AutomatorUserPnlRecord {
  dateTime: number;
  pnlByClientDepositCcy: number | string;
  rchAmount: number | string;
}

export class AutomatorUserService {
  static cvtUserPosition(
    it: OriginAutomatorUserPosition,
    vaults: AutomatorInfo[],
    prices: Record<string, number | string>,
  ) {
    const vaultInfo = vaults.find(
      (item) =>
        item.vaultInfo.chainId === it.chainId &&
        item.vaultInfo.vault.toLowerCase() === it.automatorVault.toLowerCase(),
    )!.vaultInfo;
    const rchValueInDepositCcy = cvtAmountsInCcy(
      [['RCH', it.totalRchAmount]],
      prices,
      vaultInfo.depositCcy,
    );
    const totalPnl =
      Number(it.totalPnlByClientDepositCcy) + rchValueInDepositCcy;
    const depositTotalPnlPercentage =
      (Number(it.pnlPercentage) * Number(it.totalPnlByClientDepositCcy)) /
      totalPnl;
    const rchTotalPnlPercentage =
      (Number(it.pnlPercentage) * rchValueInDepositCcy) / totalPnl;
    return {
      ...it,
      depositTotalPnlPercentage,
      rchTotalPnlPercentage,
      vaultInfo,
    } as AutomatorUserPosition;
  }

  static async userPosition(
    { chainId, vault }: AutomatorVaultInfo,
    wallet: string,
  ) {
    const [it, vaults, prices] = await Promise.all([
      http
        .get<unknown, HttpResponse<OriginAutomatorUserPosition>>(
          `/users/automator/detail`,
          {
            params: { chainId, automatorVault: vault, wallet },
          },
        )
        .then((res) => res.value),
      AutomatorService.automatorList({ chainId }),
      MarketService.fetchIndexPx(),
    ]);
    return AutomatorUserService.cvtUserPosition(it, vaults, prices);
  }

  static async userPositionList(params: {
    chainId: number;
    wallet: string;
    status: AutomatorDepositStatus;
  }) {
    const [list, vaults, prices] = await Promise.all([
      http
        .get<
          unknown,
          HttpResponse<OriginAutomatorUserPosition[]>
        >(`/users/automator/list`, { params })
        .then((res) => res.value),
      AutomatorService.automatorList({ chainId: params.chainId }),
      MarketService.fetchIndexPx(),
    ]);
    return list.map((it) =>
      AutomatorUserService.cvtUserPosition(it, vaults, prices),
    );
  }

  static async userTransactions(
    { chainId, vault }: AutomatorVaultInfo,
    params: AutomatorTransactionsParams,
    extraParams?: PageParams<'cursor', 'dateTime'>,
  ): Promise<PageResult<AutomatorTransaction, { hasMore: boolean }, 'cursor'>> {
    const limit = extraParams?.limit ?? 20;
    const res = await http.get<unknown, HttpResponse<AutomatorTransaction[]>>(
      `/users/automator/transaction/list`,
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

  static async userPnlRecords(
    { chainId, vault }: AutomatorVaultInfo,
    params: AutomatorUserPnlRecordsParams,
    extraParams?: PageParams<'cursor', 'dateTime'>,
  ): Promise<
    PageResult<AutomatorUserPnlRecord, { hasMore: boolean }, 'cursor'>
  > {
    const limit = extraParams?.limit ?? 20;
    const res = await http.get<unknown, HttpResponse<AutomatorUserPnlRecord[]>>(
      `/users/automator/pnl/list`,
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

  static async userShares(vaultInfo: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(vaultInfo.chainId);
    const Automator = await ContractsService.automatorContract(
      vaultInfo,
      signer,
    );
    const [shareDecimals, sharesWithDecimals, pricePerShare] =
      await Promise.all([
        Automator.decimals().then((res) => Number(res)),
        Automator.balanceOf(signer.address).then((res) => String(res)),
        Automator.getPricePerShare().then(
          (res) => +ethers.formatUnits(res, 18),
        ),
      ]);
    const shares = ethers.formatUnits(sharesWithDecimals, shareDecimals);
    return {
      shareDecimals,
      sharesWithDecimals,
      shares,
      pricePerShare,
      amount: +(+shares * pricePerShare).toFixed(6),
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
            res.status === TransactionStatus.FAILED
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
    vaultInfo: AutomatorVaultInfo,
    amount: string | number,
  ) {
    const { signer } = await WalletService.connect(vaultInfo.chainId);
    const Automator = await ContractsService.automatorContract(
      vaultInfo,
      signer,
    );
    const [decimals, collateralAddress] = await Promise.all([
      Automator.decimals(),
      Automator.collateral(),
    ]);
    const amountWithDecimals = ethers.parseUnits(String(amount), decimals);
    await WalletService.$approve(
      collateralAddress,
      amountWithDecimals,
      signer,
      vaultInfo.vault,
    );
    const genArgs = (gasLimit?: number) => [
      String(amountWithDecimals),
      { gasLimit },
    ];
    return ContractsService.dirtyCall(Automator, 'deposit', genArgs);
  }

  static deposit = AutomatorUserService.progressWrap(
    AutomatorUserService.$deposit,
    {
      before: PositionStatus.PENDING,
      failed: PositionStatus.FAILED,
      success: PositionStatus.MINTED,
    },
  );

  static async userRedemptionInfo(vaultInfo: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(vaultInfo.chainId);
    const Automator = await ContractsService.automatorContract(
      vaultInfo,
      signer,
    );
    return Automator.getRedemption().then((res) => {
      return {
        pendingSharesWithDecimals: String(res[0]),
        createTime: Number(res[1]),
      };
    });
  }

  private static async $redeem(
    vaultInfo: AutomatorVaultInfo,
    sharesWithDecimals: string | number,
  ) {
    const { signer } = await WalletService.connect(vaultInfo.chainId);
    const Automator = await ContractsService.automatorContract(
      vaultInfo,
      signer,
    );
    const genArgs = (gasLimit?: number) => [
      String(sharesWithDecimals),
      { gasLimit },
    ];
    return ContractsService.dirtyCall(Automator, 'withdraw', genArgs);
  }

  static redeem = AutomatorUserService.progressWrap(
    AutomatorUserService.$redeem,
    {
      before: PositionStatus.REDEEMING,
      failed: PositionStatus.MINTED,
      success: PositionStatus.REDEEMED,
    },
  );

  private static async $claim(vaultInfo: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(vaultInfo.chainId);
    const Automator = await ContractsService.automatorContract(
      vaultInfo,
      signer,
    );
    const genArgs = (gasLimit?: number) => [{ gasLimit }];
    return ContractsService.dirtyCall(Automator, 'claimRedemptions', genArgs);
  }

  private static $$claim = AutomatorUserService.progressWrap(
    AutomatorUserService.$claim,
    {
      before: PositionStatus.CLAIMING,
      failed: PositionStatus.REDEEMED,
      success: PositionStatus.CLAIMED,
    },
  );

  static async claim(
    cb: (progress: TransactionProgress) => void,
    vault: AutomatorVaultInfo,
    toast: { info(msg: string): void },
  ) {
    const { provider } = await WalletService.connect(vault.chainId);
    const chainId = await provider
      .getNetwork()
      .then((res) => Number(res.chainId));
    const positions = await pollingUntil<
      PromiseVal<ReturnType<typeof PositionsService.history>>
    >(
      (_, preRes) =>
        PositionsService.history(
          { chainId, owner: vault.vault, claimed: false },
          { limit: 300, cursor: preRes?.cursor },
        ),
      (lastRes) => !lastRes?.hasMore,
    ).then((resList) =>
      uniqBy(
        resList.flatMap((it) => it.list),
        (it: PositionInfo) =>
          `${it.id}-${it.product.vault.vault.toLowerCase()}-${it.createdAt}`,
      ),
    );
    const claimablePositions = positions.filter(
      (it) => Date.now() > it.product.expiry * 1000,
    );
    if (claimablePositions.length) {
      toast.info(
        'The automator has some trades to settle. Please complete the settlement before claiming you amount',
      );
      const data = claimablePositions.map((it) => ({
        positionId: it.id,
        vault: it.product.vault.vault,
        productType: it.product.vault.productType,
        chainId: it.product.vault.chainId,
        owner: it.wallet,
        term: it.claimParams.term,
        expiry: it.product.expiry,
        anchorPrices: it.claimParams.anchorPrices,
        collateralAtRiskPercentage: it.claimParams.collateralAtRiskPercentage,
        isMaker: it.claimParams.maker,
        redeemableAmount: it.amounts.redeemable || 0,
        riskType: it.product.vault.riskType,
      }));
      await AutomatorCreatorService.claimPositions(() => {}, vault, data)
        .then(() =>
          toast.info(
            'Settlement successful. Now proceeding to claim your amount.',
          ),
        )
        .catch((err) =>
          Promise.reject(new Error(`Settlement failed: ${getErrorMsg(err)}`)),
        );
    }
    return AutomatorUserService.$$claim(cb, vault);
  }

  static async sendRedPacket(
    automator: AutomatorVaultInfo,
    amount: string | number,
  ) {
    if (!automator.redPacketContract)
      throw new Error(
        'Red packet sending is not supported - no red packet contract is configured',
      );
    if (!+amount || +amount < 0) throw new Error('Invalid amount');
    const { signer } = await WalletService.connect(automator.chainId);
    const Automator = await ContractsService.automatorContract(
      automator,
      signer,
    );
    const collateral = await Automator.collateral();
    return WalletService.sendByAave(
      automator.chainId,
      automator.redPacketContract,
      collateral,
      amount,
      automator.vault,
    );
  }
}
