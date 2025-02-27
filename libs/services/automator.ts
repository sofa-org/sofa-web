import { applyMock, asyncCache, asyncShare } from '@sofa/utils/decorators';
import { MsIntervals } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import { get, omitBy } from 'lodash-es';

import AutomatorAbis from './abis/AAVEAutomatorBase.json';
import {
  getCollateralDecimal,
  getDepositMinAmount,
  getDepositTickAmount,
} from './vaults/utils';
import type { AutomatorVaultInfo } from './base-type';
import {
  AutomatorTransactionStatus,
  InterestType,
  ProjectType,
} from './base-type';
import { ContractsService } from './contracts';

// server 返回的结构
export interface OriginAutomatorInfo {
  chainId: number; // 链代码
  automatorName: string; // automator名称
  automatorDescription?: string; // automator说明
  automatorVault: string; // Automator vault
  participantNum: number; // 参与者数量
  aumByVaultDepositCcy: number | string; // aum
  aumByClientDepositCcy: number | string; // aum
  aumBySharesToken: number | string; // aum
  creatorAmountByVaultDepositCcy: number | string; // creator 份额
  creatorAmountByClientDepositCcy: number | string; // aum
  nav: number | string; // 净值 (vaultDepositCcy/sharesToken)
  dateTime: number; // 净值产生的时间 (秒级时间戳)
  yieldPercentage: number | string; // 7D Yield(百分比)
  creator: string; // 主理人
  createTime: number; // automator创建时间, s
  vaultDepositCcy: string; // Automator 拿到客户的钱之后 用来申购 vault 的币种
  clientDepositCcy: string; // 用户存入的标的物
  sharesToken: string; // Automator 的份额代币
  redemptionPeriodDay: number | string; // 赎回观察时间
  riskExposure: number | string; // 最多能亏损多少比例的本金
}

// server 返回的结构
export interface OriginAutomatorDetail extends OriginAutomatorInfo {
  feeRate: number | string; // 抽佣比率 (on vaultDepositCcy)
  totalTradingPnlByClientDepositCcy: number | string; // 通过交易产生的额外的VaultDepositCcy 总PNL (clientDepositCcy)
  totalInterestPnlByClientDepositCcy: number | string; // Client申购币种产生的利息 (clientDepositCcy)
  totalPnlByClientDepositCcy: number | string; // Client申购币种的总PnL (clientDepositCcy)
  totalRchPnlByClientDepositCcy: number | string; // Rch的总PNL(clientDepositCcy)
  totalRchAmount: number | string; // Rch的总PNL(RCH)
  totalPnlWithRchByClientDepositCcy: number | string; // 总PNL(标的币种的总PNL + rch转换成clientDepositCcy的pnl)
  pnlPercentage: number | string; // Yield (百分比) (基于clientDepositCcy)
  sharesToken: string; // 净值单位 (sharesToken)
  totalOptivisorProfitByVaultDepositCcy: number | string; // 基金管理者累计获取的利润
  unExpiredAmountByVaultDepositCcy: number | string; // Active Position Locked (vaultDepositCcy)
  unclaimedAmountByVaultDepositCcy: number | string; // Position unclaimed (vaultDepositCcy)
  redeemedAmountByVaultDepositCcy: number | string; // To Be Redeemed (vaultDepositCcy)
  availableAmountByVaultDepositCcy: number | string; // Available Balance (vaultDepositCcy)
  redemptionPeriodDay: number; // 赎回观察时间 (单位：天)
  positionSize?: number | string; // 当前未到期的头寸数量
  pastAvailableBalanceExcludingPrincipal: number | string; // Available Balance Excluding Principal-vaultDepositCcy
  historicalInterestPlusNetPnL: number | string; // Historical Interest Earned(The cumulative interest earned through Aave/Lido/Sofa/Curve/Avalon)-vaultDepositCcy
  lockedByUnclaimedPosition: number | string; // Current Position(Value of open & Unclaimed positions.)-vaultDepositCcy
  estimatedFutureInterestByVaultCcy: number | string; // Estimated (estimatedTenorInDays)-Day Interest-vaultDepositCcy
  estimatedTenorInDays: number | string; // estimated Tenor In Days-vaultDepositCcy
  poolSizeForFutureInterestByVaultCcy: number | string; // Net PnL (RCH not included)-vaultDepositCcy
  estimatedFundingApyPercentage: number | string; // Estimated Aave/Lido/Sofa/Curve/Avalon Yield(百分比)
}

export interface AutomatorInfo
  extends Omit<
    OriginAutomatorInfo,
    | 'chainId'
    | 'automatorVault'
    | 'automatorName'
    | 'automatorDescription'
    | 'feeRate'
    | 'redemptionPeriodDay'
    | 'creator'
    | 'createTime'
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
    | 'automatorName'
    | 'automatorDescription'
    | 'feeRate'
    | 'redemptionPeriodDay'
    | 'creator'
    | 'createTime'
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

export interface AutomatorTopFollower {
  wallet: string; // wallet
  followDay: number; // 加入天数
  pnlPercentage: number | string; // Yield (百分比) (基于crvUSD)
}

export class AutomatorService {
  static cvtAutomatorInfo<T extends OriginAutomatorInfo>(
    it: T,
  ): T extends OriginAutomatorDetail ? AutomatorDetail : AutomatorInfo {
    const collateralDecimal = getCollateralDecimal(
      it.chainId,
      it.clientDepositCcy,
    );
    const vault = ContractsService.AutomatorVaults.find(
      (item) =>
        item.chainId === it.chainId &&
        item.vault.toLowerCase() === it.automatorVault.toLowerCase(),
    );
    return {
      ...it,
      vaultInfo: omitBy(
        {
          ...Object.fromEntries(
            Object.keys(ContractsService.AutomatorVaults[0]).map((k) => [
              k,
              it[k as never] || vault?.[k as never],
            ]),
          ),
          vault: it.automatorVault,
          name: get(it, 'automatorName') || vault?.name || it.clientDepositCcy,
          desc: it.automatorDescription || vault?.desc,
          creatorFeeRate: [
            get(it, 'creatorFeeRate'),
            get(it, 'feeRate'),
            vault?.creatorFeeRate,
            0,
          ].find((x) => !Number.isNaN(x) && !isNullLike(x)),
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
          interestType:
            vault?.interestType ??
            (() => {
              if (it.vaultDepositCcy === 'scrvUSD') return InterestType.CURVE;
              if (it.vaultDepositCcy === 'stRCH') return InterestType.SOFA;
              if (it.vaultDepositCcy === 'zRCH') return InterestType.SOFA;
              if (it.vaultDepositCcy.startsWith('st')) return InterestType.LIDO;
              if (it.vaultDepositCcy.startsWith('a')) return InterestType.AAVE;
              return undefined;
            })(),
          createTime: it.createTime * 1000 || vault?.createTime,
          riskExposure: it.riskExposure || 0,
        },
        (it) => isNullLike(it),
      ),
    } as never;
  }

  @applyMock('automatorList')
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

  @asyncShare(
    5000,
    (name, [vault]) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `${name}-${vault.chainId}-${vault.vault.toLowerCase()}`,
  )
  static async info({ chainId, vault }: AutomatorVaultInfo) {
    return http
      .get<unknown, HttpResponse<OriginAutomatorDetail>>(`/automator/info`, {
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

  @asyncShare(
    5000,
    (name, [vault]) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `${name}-${vault.chainId}-${vault.vault.toLowerCase()}`,
  )
  static async performance({ chainId, vault }: AutomatorVaultInfo) {
    return http.get<unknown, HttpResponse<AutomatorPerformance[]>>(
      `/automator/performance`,
      {
        params: { chainId, automatorVault: vault },
      },
    );
  }

  @asyncShare(
    5000,
    (name, [vault]) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `${name}-${vault.chainId}-${vault.vault.toLowerCase()}`,
  )
  static async transactions(
    { chainId, vault }: AutomatorVaultInfo,
    params: Omit<AutomatorTransactionsParams, 'wallet'>,
    extraParams?: PageParams<'cursor', 'dateTime'>,
  ): Promise<PageResult<AutomatorTransaction, { hasMore: boolean }, 'cursor'>> {
    const limit = extraParams?.limit ?? 20;
    const res = await http.get<unknown, HttpResponse<AutomatorTransaction[]>>(
      `/optivisors/automator/transaction/list`,
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

  @asyncShare(
    5000,
    (name, [vault]) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `${name}-${vault.chainId}-${vault.vault.toLowerCase()}`,
  )
  @applyMock('automatorFollowers')
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
          chainId: vault.chainId,
          automatorVault: vault.vault,
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

  @asyncShare(
    5000,
    (name, [vault]) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `${name}-${vault.chainId}-${vault.vault.toLowerCase()}`,
  )
  static async topFollowers(vault: AutomatorVaultInfo) {
    return http
      .get<unknown, HttpResponse<AutomatorTopFollower[]>>(
        `/automator/user/top-list`,
        {
          params: {
            chainId: vault.chainId,
            automatorVault: vault.vault,
          },
        },
      )
      .then((res) => res.value);
  }
}
