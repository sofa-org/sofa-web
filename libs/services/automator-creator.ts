import { waitUntil } from '@livelybone/promise-wait';
import { asyncCache } from '@sofa/utils/decorators';
import { Env } from '@sofa/utils/env';
import { MsIntervals } from '@sofa/utils/expiry';
import { http } from '@sofa/utils/http';
import Big from 'big.js';
import { ethers } from 'ethers';

import burnAbis from './abis/AutomatorBurner.json';
import factoryAbis from './abis/AutomatorFactory.json';
import { AutomatorService, OriginAutomatorInfo } from './automator';
import {
  AutomatorFactory,
  AutomatorVaultInfo,
  TransactionStatus,
} from './base-type';
import { defaultChain } from './chains';
import { ContractsService } from './contracts';
import { TransactionProgress } from './positions';
import { PositionStatus } from './the-graph';
import { WalletService } from './wallet';

export interface OriginAutomatorCreateParams {
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

export interface AutomatorCreateParams {
  factory: AutomatorFactory;
  burnTransactionHash: string; // burn的transaction hash
  automatorName: string; // automator名称
  redemptionPeriodDay: number; // 赎回观察时间（单位：天）
  feeRate: number | string; // 抽佣比率
  description: string; // Automator描述
}

export class AutomatorCreatorService {
  @asyncCache({
    until: (i, t) => !i || !t || Date.now() - t > MsIntervals.min,
  })
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
  static rchBurnContract = {
    chainId: defaultChain.chainId,
    address: Env.isProd || Env.isPre ? '' : '', // TODO
  };
  static async burnRCHBeforeCreate(
    cb: (progress: TransactionProgress) => void,
    factory: AutomatorFactory,
  ): Promise<string /* transaction hash */> {
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(
        AutomatorCreatorService.rchBurnContract.chainId,
      );
      const burnContract = new ethers.Contract(
        AutomatorCreatorService.rchBurnContract.address,
        burnAbis,
        signer,
      );
      const tx = await ContractsService.dirtyCall(
        burnContract,
        'burn',
        (gasLimit) => [
          AutomatorCreatorService.rchAmountForBurning,
          factory.chainId,
          factory.clientDepositCcyAddress,
          { gasLimit },
        ],
      );
      cb({
        status: 'QueryResult',
        details: [
          [
            `--`,
            { ids: ['QueryReceipt'], status: PositionStatus.PENDING, hash: tx },
          ],
        ],
      });
      const succ = await WalletService.transactionResult(
        tx,
        AutomatorCreatorService.rchBurnContract.chainId,
      );
      if (succ.status === TransactionStatus.FAILED)
        throw new Error(`Burn failed`);
      cb({
        status: 'QueryResult',
        details: [
          [
            `--`,
            { ids: ['QueryCredits'], status: PositionStatus.PENDING, hash: tx },
          ],
        ],
      });
      await waitUntil(() => AutomatorCreatorService.hasCredits(factory), {
        interval: 1000,
        timeout: MsIntervals.min * 10,
      });
      cb({
        status: 'Success',
        details: [[`--`, { ids: [], status: PositionStatus.MINTED, hash: tx }]],
      });
      return tx;
    } catch (e) {
      cb({
        status: 'SubmitFailed',
        details: [[`--`, { ids: [], status: PositionStatus.FAILED, error: e }]],
      });
      throw e;
    }
  }

  static async createAutomator(
    cb: (progress: TransactionProgress) => void,
    data: Omit<AutomatorCreateParams, 'automatorAddress'>,
  ) {
    const address = await AutomatorCreatorService.$createAutomatorByFactory(
      cb,
      data,
    );
    return AutomatorCreatorService.$createAutomator({
      ...data,
      chainId: data.factory.chainId,
      factoryAddress: data.factory.factoryAddress,
      clientDepositCcy: data.factory.clientDepositCcy,
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
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(
        AutomatorCreatorService.rchBurnContract.chainId,
      );
      const factory = new ethers.Contract(
        data.factory.factoryAddress,
        factoryAbis,
        signer,
      );
      const tx = await ContractsService.dirtyCall(
        factory,
        'createAutomator',
        (gasLimit) => [
          Big(data.feeRate)
            .times(10 ** 18)
            .toFixed(0), // 乘以 1e18
          (data.redemptionPeriodDay * MsIntervals.day) / 1000, // s
          data.factory.clientDepositCcyAddress,
          { gasLimit },
        ],
      );
      cb({
        status: 'QueryResult',
        details: [
          [
            `--`,
            { ids: ['QueryReceipt'], status: PositionStatus.PENDING, hash: tx },
          ],
        ],
      });
      const res = await WalletService.transactionResult(
        tx,
        data.factory.chainId,
      );
      if (res.status === TransactionStatus.FAILED)
        throw new Error('Failed to create automator');
      cb({
        status: 'Success',
        details: [[`--`, { ids: [], status: PositionStatus.MINTED, hash: tx }]],
      });
      // TODO 得看一下怎么从 logs 里面拿到生成的 automator 地址
      // return res.logs.find((e) => e === 'AutomatorCreated')?.args[2];
      return '';
    } catch (e) {
      cb({
        status: 'SubmitFailed',
        details: [[`--`, { ids: [], status: PositionStatus.FAILED, error: e }]],
      });
      throw e;
    }
  }

  private static async hasCredits(factory: AutomatorFactory) {
    const { signer } = await WalletService.connect(
      AutomatorCreatorService.rchBurnContract.chainId,
    );
    const factoryContract = new ethers.Contract(
      factory.factoryAddress,
      factoryAbis,
      signer,
    );
    return factoryContract.credits(signer.address).then((res) => !!res);
  }

  private static async $createAutomator(data: OriginAutomatorCreateParams) {
    return http.post<unknown, boolean>('/optivisors/automator/create', data);
  }
}
