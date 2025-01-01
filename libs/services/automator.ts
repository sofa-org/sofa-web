import { asyncCache } from '@sofa/utils/decorators';
import { MsIntervals } from '@sofa/utils/expiry';
import { http } from '@sofa/utils/http';
import { get, pick } from 'lodash-es';

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
import { defaultChain } from './chains';
import { ContractsService } from './contracts';
import { PositionStatus } from './the-graph';
import { TransactionProgress } from './positions';
import { safeRun } from '@sofa/utils/fns';
import { WalletService } from './wallet';
import Big from 'big.js';

// server 返回的结构
export interface OriginAutomatorInfo {
  chainId: number; // 链代码
  automatorName: string; // automator名称
  automatorDescription?: string; // automator说明
  automatorVault: string; // Automator vault
  participantNum: number; // 参与者数量
  aumByVaultDepositCcy: number | string; // aum
  aumByClientDepositCcy: number | string; // aum
  creatorAumByVaultDepositCcy: number | string; // creator 份额
  creatorAumByClientDepositCcy: number | string; // aum
  nav: number | string; // 净值 (vaultDepositCcy/sharesToken)
  dateTime: number; // 净值产生的时间 (秒级时间戳)
  yieldPercentage: number | string; // 7D Yield(百分比)
  creator: string; // 创建者
  createTime: number; // automator创建时间
  vaultDepositCcy: string; // Automator 拿到客户的钱之后 用来申购 vault 的币种
  clientDepositCcy: string; // 用户存入的标的物
  sharesToken: string; // Automator 的份额代币
  redemptionPeriodDay: number | string; // 赎回观察时间
}

// server 返回的结构
export interface OriginAutomatorDetail {
  chainId: number; // 链代码
  automatorName: string; // automator名称
  automatorDescription: string; // automator说明 (可空)
  automatorVault: string; // Automator vault
  participantNum: number; // 参与者数量
  amount: number | string; // 当前aum值
  aumByVaultDepositCcy: number | string; // 当前aum值(vaultDepositCcy)
  aumByClientDepositCcy: number | string; // 当前aum值(clientDepositCcy)
  creatorAumByVaultDepositCcy: number | string; // 管理者的aum值(vaultDepositCcy)
  creatorAumByClientDepositCcy: number | string; // 管理者的aum值(clientDepositCcy)
  nav: number | string; // 净值 (vaultDepositCcy/sharesToken)
  dateTime: number; // 净值产生的时间 (秒级时间戳)
  yieldPercentage: number | string; // 7D Yield (百分比) (基于clientDepositCcy)
  creator: string; // 创建者
  createTime: number; // automator创建时间
  feeRate: number | string; // 抽佣比率 (on vaultDepositCcy)
  totalTradingPnlByClientDepositCcy: number | string; // 通过交易产生的额外的VaultDepositCcy 总PNL (clientDepositCcy)
  totalInterestPnlByClientDepositCcy: number | string; // Client申购币种产生的利息 (clientDepositCcy)
  totalPnlByClientDepositCcy: number | string; // Client申购币种的总PnL (clientDepositCcy)
  totalRchPnlByClientDepositCcy: number | string; // Rch的总PNL(clientDepositCcy)
  totalRchAmount: number | string; // Rch的总PNL(RCH)
  totalPnlWithRchByClientDepositCcy: number | string; // 总PNL(标的币种的总PNL + rch转换成clientDepositCcy的pnl)
  pnlPercentage: number | string; // Yield (百分比) (基于clientDepositCcy)
  vaultDepositCcy: string; // 交易币种 (vaultDepositCcy)
  clientDepositCcy: string; // 用户存入的标的物 (clientDepositCcy)
  sharesToken: string; // 净值单位 (sharesToken)
  availableBalance: number | string; // Available Balance (vaultDepositCcy)
  profits: number | string; // totalTradingPnlByVaultDepositCcy * feeRate (vaultDepositCcy)
  positionLockedAmount: number | string; // Active Position Locked (vaultDepositCcy)
  unclaimedAmount: number | string; // Position unclaimed (vaultDepositCcy)
  redeemedAmount: number | string; // To Be Redeemed (vaultDepositCcy)
  availableAmount: number | string; // Available Balance (vaultDepositCcy)
  redemptionPeriodDay: number; // 赎回观察时间 (单位：天)
}

export interface AutomatorInfo
  extends Omit<
    OriginAutomatorInfo,
    | 'chainId'
    | 'automatorVault'
    | 'vaultDepositCcy'
    | 'clientDepositCcy'
    | 'sharesToken'
  > {
  vaultInfo: AutomatorVaultInfo;
}

export interface AutomatorDetail
  extends Omit<
    OriginAutomatorDetail,
    | 'chainId'
    | 'automatorVault'
    | 'vaultDepositCcy'
    | 'clientDepositCcy'
    | 'sharesToken'
  > {
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
  depositPercentage: number | string; // 投资占比 (百分比)
  expiry: number; // 到期日对应的秒级时间戳，例如 1672387200
}

export interface AutomatorPerformance {
  dateTime: number; // 日期（秒级时间戳）
  aumByVaultDepositCcy: number | string; // 期初aum值(scrvUSD)
  aumByClientDepositCcy: number | string; // 期初aum值(crvUSD)
  incrRchAmount: number | string; // Rch的总PNL(RCH)
  incrTradingPnlByClientDepositCcy: number | string; // 通过交易产生的额外的VaultDepositCcy 总PNL (crvUSD)
  incrInterestPnlByClientDepositCcy: number | string; // Client申购币种产生的利息
  incrPnlByClientDepositCcy: number | string; // Client申购币种的总PnL (crvUSD)
  incrRchPnlByClientDepositCcy: number | string; // Rch的总PNL(crvUSD)
  incrPnlWithRchByClientDepositCcy: number | string; // 总PNL(标的币种的总PNL + rch转换成clientDepositCcy的pnl)
}

export interface AutomatorTransactionsParams {
  wallet: string; // 用户钱包地址
  startDateTime?: number; // 对应的秒级时间戳，例如 1672387200
}

export interface AutomatorTransaction {
  amountByVaultDepositCcy: number | string; // 转换的资产(scrvUSD)
  amountByClientDepositCcy: number | string; // 转换的资产(crvUSD)
  wallet?: string;
  share: number | string; // 转换的份额
  status: AutomatorTransactionStatus;
  action: string; // DEPOSIT/WITHDRAW/CLAIM/TRANSFER_IN/TRANSFER_OUT
  dateTime: number; // 日期 (秒级时间戳)
}

export enum AutomatorDepositStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface AutomatorCreatePayload {
  rchBurnHash: string;
  automatorName: string;
  chainId: number;
  depositCcy: string;
  redemptionWaitingPeriod: string;
  sharePercent: number;
  automatorDesc: string;
}

export interface AutomatorCreateParams {
  chainId: number; // 链ID
  automatorAddress: string;
  burnTransactionHash: string; // burn的transaction hash
  automatorName: string; // automator名称
  redemptionPeriodDay: number; // 赎回观察时间（单位：天）
  feeRate: number | string; // 抽佣比率
  description: string; // Automator描述
  factoryAddress: string; // Factory地址
  clientDepositCcy: string; // 用户存入的标的物
}

export interface AutomatorFollower {
  wallet: string; // wallet
  amountByVaultDepositCcy: number | string; // 当前持有的总资产(scrvUSD)
  amountByClientDepositCcy: number | string; // 当前持有的总资产(crvUSD)
  share: number | string; // 转换的份额
  totalInterestPnlByClientDepositCcy: number | string; // Client申购币种产生的利息
  totalPnlByClientDepositCcy: number | string; // Client申购币种的总PnL (crvUSD)
  totalRchPnlByClientDepositCcy: number | string; // Rch的总PNL(crvUSD)
  totalRchAmount: number | string; // Rch的总PNL(RCH)
  followDay: number; // 加入天数
  pnlPercentage: number | string; // Yield (百分比) (基于crvUSD)
}

export class AutomatorService {
  static cvtAutomatorInfo(it: OriginAutomatorInfo) {
    const collateralDecimal = getCollateralDecimal(
      it.chainId,
      it.clientDepositCcy,
    );
    return {
      ...it,
      vaultInfo: {
        ...it,
        vault: it.automatorVault,
        name: get(it, 'automatorName') || it.clientDepositCcy,
        desc: it.automatorDescription,
        creatorFeeRate: get(it, 'creatorFeeRate') || 0,
        depositCcy: it.clientDepositCcy,
        vaultDepositCcy: it.vaultDepositCcy,
        positionCcy: it.sharesToken,
        redeemWaitPeriod: +it.redemptionPeriodDay * MsIntervals.day,
        claimPeriod: MsIntervals.day * 3,
        abis: AutomatorAbis,
        collateralDecimal,
        anchorPricesDecimal: 1e8,
        depositMinAmount: getDepositMinAmount(
          it.clientDepositCcy,
          ProjectType.Automator,
        ),
        depositTickAmount: getDepositTickAmount(
          it.clientDepositCcy,
          ProjectType.Automator,
        ),
        ...ContractsService.AutomatorVaults.find(
          (item) =>
            item.chainId === it.chainId &&
            item.vault.toLowerCase() === it.automatorVault.toLowerCase(),
        ),
      },
    } as AutomatorInfo;
  }

  @asyncCache({
    until: (it, createdAt) =>
      !it || !createdAt || Date.now() - createdAt > MsIntervals.min,
  })
  static async automatorList(params: { chainId: number }) {
    return http
      .get<unknown, HttpResponse<OriginAutomatorInfo[]>>(`/automator/list`, {
        params,
      })
      .then((res) => res.value.map(AutomatorService.cvtAutomatorInfo));
  }

  static async info({ chainId, vault }: AutomatorVaultInfo) {
    return http
      .get<unknown, HttpResponse<OriginAutomatorInfo>>(`/automator/info`, {
        params: { chainId, automatorVault: vault },
      })
      .then((res) => AutomatorService.cvtAutomatorInfo(res.value));
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

  static async transactions(
    { chainId, vault }: AutomatorVaultInfo,
    params: Omit<AutomatorTransactionsParams, 'wallet'>,
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

  static async followers(vault: AutomatorVaultInfo, params: PageParams) {
    const pageSize = params.limit || 40;
    const currentPage = Math.floor((params.offset || 0) / pageSize);
    return http
      .get<
        unknown,
        HttpResponse<{
          pageCount: number;
          totalCount: number;
          values: AutomatorFollower[];
        }>
      >(`/optivisors/automator/user/list`, {
        params: {
          ...pick(vault, ['chainId', 'automatorVault']),
          pageSize,
          currentPage,
        },
      })
      .then((res) => {
        return {
          offset: res.value.pageCount * pageSize,
          limit: pageSize,
          total: res.value.totalCount,
          list: res.value.values,
        } as PageResult<AutomatorFollower>;
      });
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
      .toFixed(0);
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
