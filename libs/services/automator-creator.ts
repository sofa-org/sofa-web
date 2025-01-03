import { http } from '@sofa/utils/http';

import { AutomatorService, OriginAutomatorInfo } from './automator';
import { AutomatorFactory, AutomatorVaultInfo, ProductType } from './base-type';
import { TransactionProgress } from './positions';
import { ProductQuoteResult } from './products';
import { BurnProductParams, WalletService } from './wallet';

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

export interface AutomatorBurnRCHParams {
  chainId: number;
  collateral: string; // clientDepositCcy 对应地址
}

export class AutomatorCreatorService {
  static async automatorFactories() {
    return http
      .get<
        unknown,
        HttpResponse<AutomatorFactory[]>
      >(`/optivisors/automator/factories`)
      .then((res) => res.value);
  }

  static async creatorAutomatorList(params: {
    chainId: number;
    wallet: string;
  }) {
    return http
      .get<unknown, HttpResponse<OriginAutomatorInfo[]>>(`/automator/list`, {
        params,
      })
      .then((res) => res.value.map(AutomatorService.cvtAutomatorInfo));
  }

  static rchAmountForBurning = 500; // TODO 待定
  static async burnRCHBeforeCreate(
    cb: (progress: TransactionProgress) => void,
    params: AutomatorBurnRCHParams,
  ): Promise<string /* transaction hash */> {
    // TODO
    return '';
  }

  static async createAutomator(
    cb: (progress: TransactionProgress) => void,
    data: Omit<AutomatorCreateParams, 'automatorAddress'>,
  ) {
    // TODO
    const address = await AutomatorCreatorService.$createAutomatorByFactory(
      cb,
      data,
    );
    return AutomatorCreatorService.$createAutomator({
      ...data,
      automatorAddress: address,
    });
  }

  static async mintProducts(
    cb: (progress: TransactionProgress) => void,
    vault: AutomatorVaultInfo,
    products: Parameters<typeof WalletService.mint>[0][],
  ) {
    // TODO
  }

  static async claimPositions(
    cb: (progress: TransactionProgress) => void,
    vault: AutomatorVaultInfo,
    positions: Parameters<typeof WalletService.burn>[0][],
  ) {
    // TODO
  }

  static async claimProfits(
    cb: (progress: TransactionProgress) => void,
    vault: AutomatorVaultInfo,
  ) {
    // TODO
  }

  private static async $createAutomatorByFactory(
    cb: (progress: TransactionProgress) => void,
    data: Omit<AutomatorCreateParams, 'automatorAddress'>,
  ): Promise<string /* automator address */> {
    // TODO
    return '';
  }

  private static async $createAutomator(data: AutomatorCreateParams) {
    return http.post<unknown, boolean>('/optivisors/automator/create', data);
  }
}
