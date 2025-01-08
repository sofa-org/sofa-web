import { waitUntil } from '@livelybone/promise-wait';
import { applyMock, asyncCache, asyncShare } from '@sofa/utils/decorators';
import { Env } from '@sofa/utils/env';
import { MsIntervals } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import { AbstractSigner, ethers } from 'ethers';
import { omitBy } from 'lodash-es';

import burnAbis from './abis/AutomatorBurner.json';
import factoryAbis from './abis/AutomatorFactory.json';
import { CommonAbis } from './abis/common-abis';
import { AutomatorService, OriginAutomatorDetail } from './automator';
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
      .get<unknown, HttpResponse<AutomatorFactory[]>>(
        `/optivisors/automator/factories`,
      )
      .then((res) => res.value);
  }

  @applyMock('creatorAutomatorList')
  @asyncShare()
  static async automatorList(params: { chainId: number; wallet: string }) {
    return http
      .get<unknown, HttpResponse<OriginAutomatorDetail[]>>(
        `/optivisors/automator/list`,
        {
          params,
        },
      )
      .then((res) => res.value.map(AutomatorService.cvtAutomatorInfo));
  }

  static rchAmountForBurning = 500; // TODO 待定
  static rchBurnContract = {
    chainId: defaultChain.chainId,
    address:
      Env.isProd || Env.isPre
        ? ''
        : '0xab3344989e7e4357d4db494ac53c189956ddf0fb', // TODO
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
        throw new Error(`Burn failed(tx: ${tx})`);
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

  static async signSignatures(
    products: Parameters<typeof WalletService.mint>[0][],
    signer: AbstractSigner,
  ) {
    const signatures = products.reduce((acc, product) => {
      const signature = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'bytes'],
          [product.quote.makerWallet, product.quote.signature],
        ),
      );
      const xorResult = ethers.toBigInt(acc) ^ ethers.toBigInt(signature);
      return ethers.hexlify(ethers.zeroPadValue(ethers.toBeHex(xorResult), 32));
    }, ethers.ZeroHash);

    const signature = await signer.signMessage(ethers.getBytes(signatures));
    return signature;
  }

  static async mintProducts(
    cb: (progress: TransactionProgress) => void,
    vault: AutomatorVaultInfo,
    products: Parameters<typeof WalletService.mint>[0][],
  ) {
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(vault.chainId);
      if (vault.creator.toLowerCase() !== signer.address.toLowerCase())
        throw new Error('Only owner can mint products');
      const contract = new ethers.Contract(vault.vault, vault.abis, signer);

      const signature = await AutomatorCreatorService.signSignatures(
        products,
        signer,
      );
      const productList = products.map((it) => {
        return {
          vault: it.vault.vault,
          totalCollateral: it.quote.totalCollateral,
          mintParams: omitBy(
            {
              expiry: it.expiry,
              anchorPrices: it.quote.anchorPrices,
              collateralAtRisk: it.quote.collateralAtRisk,
              makerCollateral: it.quote.makerCollateral,
              deadline: it.quote.deadline,
              maker: it.quote.makerWallet!,
              makerSignature: it.quote.signature!,
            },
            (it) => isNullLike(it),
          ),
        };
      });
      const tx = await ContractsService.dirtyCall(
        contract,
        'mintProducts',
        (gasLimit) => [productList, signature, { gasLimit }],
      );

      const vaultQuotes = products.reduce(
        (pre, it) => {
          const key = `${it.vault.vault.toLowerCase()}-${it.vault.chainId}-${
            it.vault.depositCcy
          }`;
          if (!pre[key]) pre[key] = [];
          pre[key].push(it.quote.quoteId);
          return pre;
        },
        {} as Record<
          string /* `${vault.toLowerCase()}-${chainId}-${depositCcy}` */,
          (string | number)[]
        >,
      );
      cb({
        status: 'QueryResult',
        details: Object.entries(vaultQuotes).map((v) => [
          v[0],
          { ids: v[1], status: PositionStatus.PENDING, hash: tx },
        ]),
      });

      const res = await WalletService.transactionResult(tx, vault.chainId);
      if (res.status === TransactionStatus.FAILED)
        throw new Error(`Mint Failed(tx: ${tx})`);
      cb({
        status: 'Success',
        details: Object.entries(vaultQuotes).map((v) => [
          v[0],
          { ids: v[1], status: PositionStatus.MINTED, hash: tx },
        ]),
      });
    } catch (e) {
      cb({
        status: 'SubmitFailed',
        details: [
          [
            `${vault.vault}-${vault.chainId}-${vault.depositCcy}`,
            { ids: [], status: PositionStatus.FAILED, error: e },
          ],
        ],
      });
      throw e;
    }
  }

  static async claimPositions(
    cb: (progress: TransactionProgress) => void,
    vault: AutomatorVaultInfo,
    positions: Parameters<typeof WalletService.burn>[0][],
  ) {
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(vault.chainId);
      const contract = new ethers.Contract(vault.vault, vault.abis, signer);
      const positionList = {
        vault: vault.vault,
        products: positions.map((it) => ({
          expiry: it.expiry,
          anchorPrices: it.anchorPrices,
        })),
      };
      const vaultQuotes = positions.reduce(
        (pre, it) => {
          const key = `${it.vault.toLowerCase()}-${it.chainId}-${it.claimCcy}`;
          if (!pre[key]) pre[key] = [];
          pre[key].push(it.positionId);
          return pre;
        },
        {} as Record<
          string /* `${vault.toLowerCase()}-${chainId}-${depositCcy}` */,
          (string | number)[]
        >,
      );
      const tx = await ContractsService.dirtyCall(
        contract,
        'burnProducts',
        (gasLimit) => [positionList, { gasLimit }],
      );

      cb({
        status: 'QueryResult',
        details: Object.entries(vaultQuotes).map((v) => [
          v[0],
          { ids: v[1], status: PositionStatus.CLAIMING, hash: tx },
        ]),
      });
      const res = await WalletService.transactionResult(tx, vault.chainId);
      if (res.status === TransactionStatus.FAILED)
        throw new Error(`Burn Failed(tx: ${tx})`);
      cb({
        status: 'Success',
        details: Object.entries(vaultQuotes).map((v) => [
          v[0],
          { ids: v[1], status: PositionStatus.CLAIMED, hash: tx },
        ]),
      });
    } catch (e) {
      cb({
        status: 'SubmitFailed',
        details: [
          [
            `${vault.vault}-${vault.chainId}-${vault.depositCcy}`,
            { ids: [], status: PositionStatus.FAILED, error: e },
          ],
        ],
      });
      throw e;
    }
  }

  static async profitsCanBeHarvested(vault: AutomatorVaultInfo) {
    const provider = await WalletService.readonlyConnect(vault.chainId);
    const contract = new ethers.Contract(vault.vault, vault.abis, provider);
    const vaultDepositCcy = new ethers.Contract(
      vault.vaultDepositCcy,
      [CommonAbis.decimals],
      provider,
    );
    try {
      return Promise.all([
        contract.totalFee(),
        vaultDepositCcy.decimals(),
      ]).then(([res, decimals]) => +ethers.formatUnits(res, decimals));
    } catch (e) {
      return 0;
    }
  }

  static async harvestProfits(
    cb: (progress: TransactionProgress) => void,
    vault: AutomatorVaultInfo,
  ) {
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(vault.chainId);
      if (vault.creator.toLowerCase() !== signer.address.toLowerCase())
        throw new Error('Only owner can harvest');
      const contract = new ethers.Contract(vault.vault, vault.abis, signer);
      const tx = await ContractsService.dirtyCall(
        contract,
        'harvest',
        (gasLimit) => [{ gasLimit }],
      );

      cb({
        status: 'QueryResult',
        details: [
          ['--', { ids: [], status: PositionStatus.CLAIMING, hash: tx }],
        ],
      });
      const res = await WalletService.transactionResult(tx, vault.chainId);
      if (res.status === TransactionStatus.FAILED)
        throw new Error(`Burn Failed(tx: ${tx})`);
      cb({
        status: 'Success',
        details: [
          ['--', { ids: [], status: PositionStatus.CLAIMED, hash: tx }],
        ],
      });
    } catch (e) {
      cb({
        status: 'SubmitFailed',
        details: [
          [
            `${vault.vault}-${vault.chainId}-${vault.depositCcy}`,
            { ids: [], status: PositionStatus.FAILED, error: e },
          ],
        ],
      });
      throw e;
    }
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
          ethers.parseUnits(String(data.feeRate), 18), // 乘以 1e18
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
        throw new Error(`Failed to create automator(tx: ${tx})`);
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
    return http
      .post<unknown, boolean>('/optivisors/automator/create', data)
      .then(() => data.automatorAddress);
  }
}
