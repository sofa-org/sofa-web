import { http } from '@sofa/utils/http';
import { ethers } from 'ethers';

import { AutomatorTransactionStatus, AutomatorVaultInfo } from './base-type';
import { ContractsService } from './contracts';
import { WalletService } from './wallet';

export interface AutomatorInfo {
  chainId: number; // 链代码
  automatorVault: string; // Automator vault
  amount: number | string; // 当前aum值
  nav: number | string; // 净值
  dateTime: number; // 净值产生的时间（秒级时间戳）
  yieldPercentage: number | string; // 7D Yield(百分比)
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
}

export interface AutomatorUserDetail {
  chainId: number; // 链代码
  automatorVault: string; // Automator vault
  wallet: string; // 用户钱包地址
  amount: number | string; // 当前持有的总资产
  share: number | string; // 当前持有的份额
  depositTotalPnl: number | string; // 标的币种的总PNL
  rchTotalPnl: number | string; // Rch的总PNL
}

export interface AutomatorTransactionsParams {
  wallet: string; // 用户钱包地址
  limit?: number; // 查询数量，默认为 100，不超过200
  startDateTime?: number; // 对应的秒级时间戳，例如 1672387200
}

export interface AutomatorTransaction {
  amount: number | string; // 转换的资产
  share: number | string; // 转换的份额
  status: AutomatorTransactionStatus;
  action: string; // DEPOSIT/WITHDRAW/CLAIM/TRANSFER_IN/TRANSFER_OUT
  dateTime: number; // 日期（秒级时间戳）
}

export class AutomatorService {
  static async getInfo({ chainId, vault }: AutomatorVaultInfo) {
    return http.get<unknown, HttpResponse<AutomatorInfo>>(`/automator/info`, {
      params: { chainId, automatorVault: vault },
    });
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
    return http.get<unknown, HttpResponse<AutomatorUserDetail>>(
      `/automator/user/detail`,
      {
        params: { chainId, automatorVault: vault, wallet },
      },
    );
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
    const automator = await ContractsService.automatorContract(vault, signer);
    const [decimals, shares, pricePerShare] = await Promise.all([
      automator.decimals(),
      automator.balanceOf(signer.address),
      automator
        .getPricePerShare(signer.address)
        .then((res) => ethers.formatUnits(res, 18)),
    ]);
    return { decimals, shares: shares, pricePerShare };
  }

  static async deposit(
    { chainId, vault }: AutomatorVaultInfo,
    amountWithDecimals: number,
  ) {
    const { signer } = await WalletService.connect(chainId);
    const automator = await ContractsService.automatorContract(vault, signer);
    const genArgs = (gasLimit?: number) => [
      String(amountWithDecimals),
      { gasLimit },
    ];
    return ContractsService.dirtyCall(automator, 'deposit', genArgs);
  }

  static async getRedemptionInfo({ chainId, vault }: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(chainId);
    const automator = await ContractsService.automatorContract(vault, signer);
    return automator
      .getRedemption()
      .then((res) => ({ pendingShares: res[0], createTime: res[1] }));
  }

  static async redeem(
    { chainId, vault }: AutomatorVaultInfo,
    sharesWithDecimals: number,
  ) {
    const { signer } = await WalletService.connect(chainId);
    const automator = await ContractsService.automatorContract(vault, signer);
    const genArgs = (gasLimit?: number) => [
      String(sharesWithDecimals),
      { gasLimit },
    ];
    return ContractsService.dirtyCall(automator, 'withdraw', genArgs);
  }

  static async claim({ chainId, vault }: AutomatorVaultInfo) {
    const { signer } = await WalletService.connect(chainId);
    const automator = await ContractsService.automatorContract(vault, signer);
    const genArgs = (gasLimit?: number) => [{ gasLimit }];
    return ContractsService.dirtyCall(automator, 'claimRedemptions', genArgs);
  }
}
