import { waitUntil } from '@livelybone/promise-wait';
import { applyMock, asyncCache, asyncShare } from '@sofa/utils/decorators';
import { Env } from '@sofa/utils/env';
import { MsIntervals } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import { arrToDict } from '@sofa/utils/object';
import { ethers } from 'ethers';
import { omitBy } from 'lodash-es';

import burnAbis from './abis/AutomatorBurner.json';
import factoryAbis from './abis/AutomatorFactory.json';
import { AutomatorService, OriginAutomatorDetail } from './automator';
import {
  AutomatorFactory,
  AutomatorVaultInfo,
  TransactionStatus,
  VaultInfo,
} from './base-type';
import { ChainMap, defaultChain } from './chains';
import { ContractsService } from './contracts';
import { isMockEnabled } from './mock';
import { TransactionProgress } from './positions';
import { PositionStatus, TheGraphService } from './the-graph';
import { WalletService } from './wallet';

export interface OriginAutomatorCreateParams {
  chainId: number; // 链ID
  creator: string; // 主理人的钱包
  automatorAddress: string;
  burnTransactionHash: string; // burn的transaction hash
  automatorName: string; // automator名称
  redemptionPeriodDay: number; // 赎回观察时间（单位：天）
  feeRate: number | string; // 抽佣比率
  description: string; // Automator描述
  factoryAddress: string; // Factory地址
  clientDepositCcy: string; // 用户存入的标的物
  riskLevel: string; // 风险等级
}

export interface AutomatorCreateParams {
  factory: AutomatorFactory;
  creator: string; // 主理人的钱包
  burnTransactionHash: string; // burn的transaction hash
  automatorName: string; // automator名称
  redemptionPeriodDay: number; // 赎回观察时间（单位：天）
  feeRate: number | string; // 抽佣比率
  description: string; // Automator描述
  riskLevel: string; // 风险等级
}

export class AutomatorCreatorService {
  static redemptionPeriodDayValues = [7, 14, 30];
  @applyMock('creatorAutomatorFactories')
  @asyncCache({
    until: (i, t) => !i || !t || Date.now() - t > MsIntervals.min,
  })
  static async automatorFactories(params: { chainId: number; wallet: string }) {
    return http
      .get<
        unknown,
        HttpResponse<AutomatorFactory[]>
      >(`/optivisors/automator/factories`)
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

  @asyncCache({
    persist: false,
    until: (it, t) => !it || !t || Date.now() - t > MsIntervals.min * 3,
  })
  static async $quoteConfig(params: {
    chainId: number;
    automatorVault: string;
  }) {
    return http.get<
      unknown,
      HttpResponse<
        { chainId: number; vault: string; expiryDateTimes: number[] }[]
      >
    >('/optivisors/automator/quote/config', {
      params,
    });
  }
  static async vaults(automator: AutomatorVaultInfo) {
    return this.$quoteConfig({
      chainId: automator.chainId,
      automatorVault: automator.vault,
    }).then((res) => {
      const map = arrToDict(
        ContractsService.vaults,
        (it) => `${it.chainId}-${it.vault.toLowerCase()}`,
      );
      return res.value.map((it) => {
        const vault = map[`${it.chainId}-${it.vault.toLowerCase()}`];
        if (!vault)
          throw new Error(
            `Please config this vault(${it.chainId}-${it.vault})`,
          );
        return { vault, quoteConfig: it };
      });
    });
  }

  static rchAmountForBurning = 500; // TODO 待定
  static rchBurnContract = {
    chainId: defaultChain.chainId,
    address:
      Env.isProd || Env.isPre
        ? '0x9093321dEE6123272Ec54690cE28437e2B59a14D'
        : '0xab3344989e7e4357d4db494ac53c189956ddf0fb',
  };
  public static async burnRCHBeforeCreate(
    cb: (progress: TransactionProgress) => void,
    factory: AutomatorFactory,
  ): Promise<string /* transaction hash */> {
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(
        AutomatorCreatorService.rchBurnContract.chainId,
      );
      const amountWithDecimals = ethers.parseUnits(
        String(AutomatorCreatorService.rchAmountForBurning),
        18,
      );
      await WalletService.$approve(
        ChainMap[AutomatorCreatorService.rchBurnContract.chainId].rchAddress,
        amountWithDecimals,
        signer,
        AutomatorCreatorService.rchBurnContract.address,
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
          amountWithDecimals,
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
  public static async awaitingForCreateCredits(
    cb: (progress: TransactionProgress) => void,
    factory: AutomatorFactory,
  ): Promise<void> {
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(
        AutomatorCreatorService.rchBurnContract.chainId,
      );
      await waitUntil(() => AutomatorCreatorService.hasCredits(factory), {
        interval: 1000,
        timeout: MsIntervals.min * 10,
      });
      cb({
        status: 'Success',
        details: [[`--`, { ids: [], status: PositionStatus.MINTED }]],
      });
    } catch (e) {
      cb({
        status: 'SubmitFailed',
        details: [[`--`, { ids: [], status: PositionStatus.FAILED, error: e }]],
      });
    }
  }

  public static async registerAutomator(
    data: AutomatorCreateParams & { automatorAddress: string },
  ) {
    return AutomatorCreatorService.$createAutomator({
      creator: data.creator,
      chainId: data.factory.chainId,
      factoryAddress: data.factory.factoryAddress,
      clientDepositCcy: data.factory.clientDepositCcy,
      automatorAddress: data.automatorAddress,
      burnTransactionHash: data.burnTransactionHash,
      automatorName: data.automatorName,
      redemptionPeriodDay: data.redemptionPeriodDay,
      feeRate: data.feeRate,
      description: data.description,
      riskLevel: data.riskLevel,
    });
  }

  // 需要 automator 白名单钱包签名
  static async signSignatures(
    automator: AutomatorVaultInfo,
    products: Parameters<typeof WalletService.mint>[0][],
  ) {
    return http
      .post<unknown, HttpResponse<{ signature: string }>>(
        '/optivisors/automator/sign',
        {
          chainId: automator.chainId,
          automatorVault: automator.vault,
          quotes: products.map((it) => ({
            ...it.quote,
            vault: it.vault.vault,
            expiry: it.expiry,
          })),
        },
      )
      .then((res) => res.value.signature);
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
        vault,
        products,
      );
      const productList = products.map((it) => {
        return {
          vault: it.vault.vault,
          totalCollateral: it.quote.totalCollateral,
          mintParams: omitBy(
            {
              expiry: it.expiry,
              anchorPrices: it.quote.anchorPrices,
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
      const $positionList = positions.reduce(
        (pre, it) => {
          const key = it.vault.toLowerCase();
          const product = {
            expiry: it.expiry,
            anchorPrices: it.anchorPrices,
          };
          if (!pre[key]) pre[key] = [];
          pre[key].push(product);
          return pre;
        },
        {} as Record<
          VaultInfo['vault'],
          { expiry: number; anchorPrices: string[] }[]
        >,
      );
      const positionList = Object.entries($positionList).map(
        ([vault, products]) => ({ vault, products }),
      );
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
    const decimal = ContractsService.vaults.find(
      (it) =>
        it.chainId === vault.chainId && it.depositCcy === vault.vaultDepositCcy,
    )?.collateralDecimal;
    const decimals = decimal ? String(decimal).length - 1 : 0;
    try {
      return contract
        .totalFee()
        .then((res) => Math.max(0, +ethers.formatUnits(res, decimals)));
    } catch (e) {
      console.warn(e);
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

  public static async createAutomatorContract(
    cb: (progress: TransactionProgress) => void,
    data: Omit<AutomatorCreateParams, 'automatorAddress'>,
  ): Promise<string /* automator address */> {
    cb({ status: 'Submitting' });
    try {
      const { signer } = await WalletService.connect(data.factory.chainId);
      const factory = new ethers.Contract(
        data.factory.factoryAddress,
        factoryAbis,
        signer,
      );
      const tx = isMockEnabled()
        ? '0x4f6d99da55f7a13e0ed598b8f409d320137f9cdf0b10442b17528b4a676f50b5'
        : await ContractsService.dirtyCall(
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
      const findAutomatorAddress = (log: ethers.Log) => {
        // example log.data: 0x0000000000000000000000004adb5b4bc65e85310a10b011a09045569b0c99a20000000000000000000000000000000000000000000000004563918244f400000000000000000000000000000000000000000000000000000000000000093a80
        // 0x 000000000000000000000000 4adb5b4bc65e85310a10b011a09045569b0c99a2
        // len: 2 24 40
        if (!log.data?.length) return undefined;
        if (
          log.address?.toLowerCase() !=
          data.factory.factoryAddress.toLowerCase()
        )
          return undefined;
        if (!/^0x$/.test(log.data.substring(0, 2))) {
          return undefined;
        }
        if (log.data.length < 64 + 2) return undefined;
        return `0x${log.data.substring(2 + 24, 2 + 24 + 40)}`;
      };
      const automatorAddressArr = res.logs
        .map(findAutomatorAddress)
        .filter(Boolean) as string[];
      if (automatorAddressArr.length != 1) {
        console.log(res);
        throw new Error(
          `Unexpected tx log hash, cannot find automator address`,
        );
      }
      return automatorAddressArr[0];
    } catch (e) {
      cb({
        status: 'SubmitFailed',
        details: [[`--`, { ids: [], status: PositionStatus.FAILED, error: e }]],
      });
      throw e;
    }
  }

  public static async hasCredits(factory: AutomatorFactory) {
    const { signer } = await WalletService.connect(factory.chainId);
    const factoryContract = new ethers.Contract(
      factory.factoryAddress,
      factoryAbis,
      signer,
    );
    console.info(`automator-creator.hasCredits ${signer.address}`);
    const res = await factoryContract.credits(signer.address);
    console.info(`automator-creator.hasCredits ${signer.address} => ${res}`);
    return !!res;
  }

  public static async hasAutomatorBeenCreated(factory: AutomatorFactory) {
    const { signer } = await WalletService.connect(factory.chainId);
    const factoryContract = new ethers.Contract(
      factory.factoryAddress,
      factoryAbis,
      signer,
    );
    const res = await factoryContract.getAutomator(
      signer.address,
      factory.clientDepositCcyAddress,
    );
    return res !== '0x0000000000000000000000000000000000000000'
      ? (res as string)
      : undefined;
  }

  static async hasBurned(factory: AutomatorFactory) {
    const { signer } = await WalletService.connect(factory.chainId);
    const records = await TheGraphService.rchBurnRecordsForAutomator({
      chainId: factory.chainId,
      wallet: signer.address,
    });
    return records.some(
      (it) =>
        it.collateral.toLowerCase() ===
        factory.clientDepositCcyAddress.toLowerCase(),
    );
  }

  static async hasNoCreditsAfterBurned(factory: AutomatorFactory) {
    const hasBurn = await AutomatorCreatorService.hasBurned(factory);

    if (!hasBurn) return false;

    const [hasCredits, hasAutomator] = await Promise.all([
      AutomatorCreatorService.hasCredits(factory),
      AutomatorCreatorService.hasAutomatorBeenCreated(factory),
    ]);
    return !hasCredits && !hasAutomator;
  }

  private static async $createAutomator(data: OriginAutomatorCreateParams) {
    return http
      .post<
        unknown,
        HttpResponse<boolean>
      >('/optivisors/automator/create', data)
      .then(() => data.automatorAddress);
  }
}
