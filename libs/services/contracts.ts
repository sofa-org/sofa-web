import { asyncCache, asyncRetry } from '@sofa/utils/decorators';
import { Env } from '@sofa/utils/env';
import { MsIntervals, nearest8h } from '@sofa/utils/expiry';
import {
  PERMIT2_ADDRESS,
  PermitTransferFrom,
  SignatureTransfer,
} from '@uniswap/permit2-sdk';
import dayjs from 'dayjs';
import { ethers } from 'ethers';

import {
  CommonAbis,
  IUniswapV2PairABI,
  IUniswapV3PairABI,
} from './abis/common-abis';
import FeeAbis from './abis/FeeCollector.json';
import HlOracleAbis from './abis/HlOracle.json';
import MerkleAirdropAbis from './abis/MerkleAirdrop.json';
import RCHAbis from './abis/RCH.json';
import SpotOracleAbis from './abis/SpotOracle.json';
import { AutomatorVaults } from './vaults/automator';
import { dualVaults } from './vaults/dual';
import { earnVaults } from './vaults/earn';
import { surgeVaults } from './vaults/surge';
import {
  AutomatorVaultInfo,
  ProductType,
  RiskType,
  TransactionStatus,
  VaultInfo,
  VaultInputInfo,
  VaultInputKey,
} from './base-type';
import { ChainMap, defaultChain } from './chains';
import { WalletConnect } from './wallet-connect';

export { ProductType, RiskType, TransactionStatus };
export type { VaultInfo };

export class InvalidVaultError extends Error {
  constructor() {
    super('InvalidVaultError');
  }
}

export class ContractsService {
  static vaults = [...earnVaults, ...surgeVaults, ...dualVaults].map((it) => ({
    ...it,
    tradeDisable: it.tradeDisable || undefined,
    onlyForAutomator: it.onlyForAutomator || false,
    interestType: it.interestType || undefined,
    earlyClaimable: it.earlyClaimable || undefined,
    realDepositCcy: it.realDepositCcy || it.depositCcy,
    priority: it.priority || 0,
  }));
  static AutomatorVaults = AutomatorVaults;

  static VaultInputInfoKeys = [
    'chainId',
    'productType',
    'riskType',
    'forCcy',
    'domCcy',
    'realDepositCcy',
    'onlyForAutomator',
  ] as const;

  static genVaultInputKey(vault: VaultInputInfo | undefined) {
    if (!vault) return '';
    return ContractsService.VaultInputInfoKeys.map((k) => vault[k]).join(
      '-',
    ) as VaultInputKey;
  }

  static rchAddress() {
    return ChainMap[defaultChain.chainId].rchAddress;
  }

  static rchAirdropAddress() {
    return ChainMap[defaultChain.chainId].rchAirdropAddress;
  }

  static rchUniswapAddress() {
    return ChainMap[defaultChain.chainId].rchUniswapAddress;
  }

  static feeContractAddress(chainId: number) {
    return ChainMap[chainId].feeContractAddress;
  }

  static automatorFeeContractAddress(chainId: number) {
    return ChainMap[chainId].automatorFeeContractAddress;
  }

  static getVaultInfo(vault: string, chainId: number) {
    const vaults = ContractsService.vaults;
    const vaultInfo = vaults.find(
      (it) =>
        it.vault.toLowerCase() === vault.toLowerCase() &&
        it.chainId === chainId,
    );
    if (!vaultInfo) throw new InvalidVaultError();
    return vaultInfo;
  }

  @asyncCache({
    persist: true,
    id: () => (Env.isDaily ? 'fee-rate-test' : 'fee-rate-prod'),
  })
  static async $feeRate(
    provider: ethers.JsonRpcApiProvider,
  ): Promise<{ trading: number; settlement: number }> {
    const network = await provider._detectNetwork();
    console.info('Fee Rate Params: ', {
      network,
      feeContract: ContractsService.feeContractAddress(Number(network.chainId)),
    });
    const contract = ContractsService.feeContract(
      provider,
      Number(network.chainId),
    );
    const [trading, settlement] = await Promise.all([
      contract.tradingFeeRate(),
      contract.settlementFeeRate(),
    ]);
    const res = {
      trading: +ethers.formatUnits(trading, 18),
      settlement: +ethers.formatUnits(settlement, 18),
    };
    console.info('Fee Rate Result', res);
    return res;
  }

  static async feeRate(
    provider: ethers.JsonRpcApiProvider,
    vault: string,
    timeMs: number,
  ): Promise<{ trading: number; settlement: number }> {
    const network = await provider._detectNetwork();
    const vaultInfo = ContractsService.getVaultInfo(
      vault,
      Number(network.chainId),
    );
    if (vaultInfo.riskType === RiskType.LEVERAGE) {
      return { trading: 0, settlement: 0 };
    }

    if (Env.isDaily) {
      // 后续 testnet 的合约发生更新时，在这里记录老的值
    }
    if (!Env.isDaily) {
      // 后续正式环境的合约发生更新时，在这里记录老的值
    }

    // 写死，后面合约改了就再重新硬编码发布就行
    return ContractsService.$feeRate(provider);
  }

  @asyncCache({
    persist: true,
    id: (_, [, v]) => `vault-leverage-${v}`,
  })
  static async $leverageVaultInfo(
    provider: ethers.JsonRpcApiProvider,
    vault: string,
  ) {
    const contract = await ContractsService.rfqContract(vault, provider);
    const [bApr, sApr, leverage] = await Promise.all([
      contract.borrowAPR(),
      contract.spreadAPR(),
      contract.leverageRatio().then((v) => Number(v) + 1),
    ]);
    return {
      borrowApr: Number(bApr) / 1e18,
      spreadApr: Number(sApr) / 1e18,
      leverage,
    };
  }

  static async vaultLeverageInfo(
    provider: ethers.JsonRpcApiProvider,
    vault: string,
    timeMs: number,
  ) {
    const network = await provider._detectNetwork();
    const vaultInfo = ContractsService.getVaultInfo(
      vault,
      Number(network.chainId),
    );

    if (vaultInfo.riskType !== RiskType.LEVERAGE) {
      return { borrowApr: 0, spreadApr: 0, leverage: 1 };
    }

    if (Env.isDaily) {
      // 后续 testnet 的合约发生更新时，在这里记录老的值
      if (timeMs < new Date('2024-07-04T10:26Z').getTime()) {
        return {
          borrowApr: 0.08,
          spreadApr: 0,
          leverage: 5,
        };
      }
    }
    if (!Env.isDaily) {
      // 后续正式环境的合约发生更新时，在这里记录老的值
    }

    return ContractsService.$leverageVaultInfo(provider, vault).catch((err) => {
      console.error(
        `Failed to get Leverage Info of ${vault} (${Number(network.chainId)}):`,
        err,
      );
      return {
        borrowApr: 0.03,
        spreadApr: 0.01,
        leverage: 5,
      };
    });
  }

  static async signPermit(
    collateralCcy: string,
    amount: string | number,
    deadline: string | number,
    vault: string,
    signer: ethers.JsonRpcSigner,
  ) {
    console.info('Sign for position', {
      collateralCcy,
      amount,
      deadline,
      vault,
      signer,
    });
    const nonce = Math.floor(Date.now() / 1000);
    const minterPermit: PermitTransferFrom = {
      permitted: {
        token: collateralCcy,
        amount,
      },
      spender: vault,
      nonce,
      deadline,
    };
    const { domain, types, values } = SignatureTransfer.getPermitData(
      minterPermit,
      PERMIT2_ADDRESS,
      Number((await signer.provider._detectNetwork()).chainId),
    );
    const sign = await signer.signTypedData(
      domain as ethers.TypedDataDomain,
      types,
      values,
    );
    return { sign, nonce };
  }

  static async rfqContract(
    vault: string,
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider, // 提供 provider 时无法调用 vault 的 mint, burn 和 burnBatch 方法
  ) {
    const network =
      'address' in signerOrProvider
        ? await signerOrProvider.provider._detectNetwork()
        : await signerOrProvider._detectNetwork();
    const chainId = Number(network.chainId);
    const info = ContractsService.getVaultInfo(vault, chainId);
    return new ethers.Contract(vault, info.abis, signerOrProvider);
  }

  static async automatorContract(
    vault: string | AutomatorVaultInfo,
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider, // 提供 provider 时无法调用 vault 的 mint, burn 和 burnBatch 方法
  ) {
    const info =
      typeof vault === 'string'
        ? await (async () => {
            const network =
              'address' in signerOrProvider
                ? await signerOrProvider.provider._detectNetwork()
                : await signerOrProvider._detectNetwork();
            const chainId = Number(network.chainId);
            return AutomatorVaults.find(
              (it) =>
                it.vault.toLowerCase() === vault.toLowerCase() &&
                it.chainId === chainId,
            );
          })()
        : vault;
    if (!info) {
      throw new Error(`Automator vault ${vault} not found`);
    }
    return new ethers.Contract(info.vault, info.abis, signerOrProvider);
  }

  static rchContract(
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider,
  ) {
    return new ethers.Contract(
      ContractsService.rchAddress(),
      RCHAbis,
      signerOrProvider,
    );
  }

  static rchAirdropContract(signer: ethers.JsonRpcSigner) {
    return new ethers.Contract(
      ContractsService.rchAirdropAddress(),
      MerkleAirdropAbis,
      signer,
    );
  }

  static feeContract(
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider,
    chainId: number,
  ) {
    return new ethers.Contract(
      ContractsService.feeContractAddress(chainId),
      FeeAbis,
      signerOrProvider,
    );
  }

  static async tokenInfo(
    address: string,
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider,
  ) {
    const contract = new ethers.Contract(
      address,
      [CommonAbis.symbol, CommonAbis.decimals, CommonAbis.balanceOf],
      signerOrProvider,
    );
    return Promise.all([contract.symbol(), contract.decimals()]).then(
      ([symbol, decimal]) => ({
        contract,
        symbol: symbol as string,
        decimal: Number(decimal),
      }),
    );
  }

  @asyncCache({
    persist: true,
    until: (v, t) => !v || !t || Date.now() - t > 60000,
    id: (_, args) => `uniswap-pair-reserves-${args[0]}-${args[1]}`,
  })
  static async getUniswapPairReserves(
    pairAddress: string,
    chainId: number,
  ): Promise<{ ccy: string; address: string; reserve: number }[]> {
    const provider = await WalletConnect.getProvider(chainId);
    const pairContract = new ethers.Contract(
      pairAddress,
      IUniswapV2PairABI,
      provider,
    );
    const [[$reserve0, $reserve1], token0Address, token1Address] =
      await Promise.all([
        pairContract.getReserves() as Promise<[bigint, bigint]>,
        pairContract.token0(),
        pairContract.token1(),
      ]);
    return Promise.all([
      ContractsService.tokenInfo(token0Address, provider).then((info) => ({
        ccy: info.symbol,
        address: token0Address,
        reserve: Number($reserve0 / BigInt(10 ** info.decimal)),
      })),
      ContractsService.tokenInfo(token1Address, provider).then((info) => ({
        ccy: info.symbol,
        address: token1Address,
        reserve: Number($reserve1 / BigInt(10 ** info.decimal)),
      })),
    ]);
  }

  @asyncCache({
    persist: true,
    until: (v, t) => !v || !t || Date.now() - t > 60000,
    id: (_, args) => `uniswap-pair-price-${args[0]}-${args[1]}`,
  })
  static async getUniswapPairPriceV3(pairAddress: string, chainId: number) {
    const provider = await WalletConnect.getProvider(chainId);
    const pairContract = new ethers.Contract(
      pairAddress,
      IUniswapV3PairABI,
      provider,
    );
    const [{ sqrtPriceX96 }, token0Address, token1Address] = await Promise.all([
      pairContract.slot0() as Promise<{ sqrtPriceX96: bigint }>,
      pairContract.token0(),
      pairContract.token1(),
    ]);
    const [token0Info, token1Info] = await Promise.all([
      ContractsService.tokenInfo(token0Address, provider),
      ContractsService.tokenInfo(token1Address, provider),
    ]).then((list) =>
      list.map((info, i) => ({
        ccy: info.symbol,
        address: i === 0 ? token0Address : token1Address,
      })),
    );
    return {
      price:
        (Number(sqrtPriceX96) / 2 ** 96) ** 2 *
        (token1Info.ccy.startsWith('USD') ? 1e12 : 1),
      token0Info,
      token1Info,
    };
  }

  @asyncRetry()
  static async getUniswapPairPrice(
    pairAddress: string,
    ccyAddress: string,
    chainId: number,
    version: 'v2' | 'v3',
  ) {
    if (version === 'v2') {
      const [reserve0, reserve1] =
        await ContractsService.getUniswapPairReserves(pairAddress, chainId);
      // 确定哪个储备是哪个代币，如果需要的话可以调换它们
      if (reserve0.address.toUpperCase() == ccyAddress.toUpperCase()) {
        // 计算 price = reserve1 / reserve0
        return {
          price: reserve1.reserve / reserve0.reserve,
          token0: reserve0.ccy,
          token1: reserve1.ccy,
        };
      }
      // 计算 price = reserve0 / reserve1
      return {
        price: reserve0.reserve / reserve1.reserve,
        token0: reserve1.ccy,
        token1: reserve0.ccy,
      };
    }
    const { price, token0Info, token1Info } =
      await ContractsService.getUniswapPairPriceV3(pairAddress, chainId);
    if (token0Info.address.toUpperCase() == ccyAddress.toUpperCase()) {
      // 计算 price = reserve1 / reserve0
      return { price, token0: token0Info.ccy, token1: token1Info.ccy };
    }
    // 计算 price = reserve0 / reserve1
    return { price: 1 / price, token0: token1Info.ccy, token1: token0Info.ccy };
  }

  @asyncCache({
    persist: true,
    id: (_, args) =>
      `price-at-settlement-${args[1]}-${dayjs(args[2] as number).format(
        'YYYY-MM-DD',
      )}`,
    until: (v, t, _, __, [, , ms]) =>
      !v || !t || t - Number(ms) < MsIntervals.min * 30,
  })
  static async getPriceAtSettlement(
    provider: ethers.JsonRpcApiProvider,
    ccy: 'BTC' | 'ETH',
    ms: number,
  ) {
    const network = await provider._detectNetwork();
    const chainInfo = ChainMap[Number(network.chainId)];
    const contract = new ethers.Contract(
      chainInfo.spotPriceOracle[ccy],
      SpotOracleAbis.abi,
      provider,
    );
    const val = await contract.settlePrices(nearest8h(ms) / 1000);
    const p = +ethers.formatUnits(val, 8);
    return { timestamp: ms / 1000, low: p, high: p, close: p, open: p };
  }

  @asyncCache({
    persist: true,
    id: (_, args) =>
      `hl-price-between-${args[1]}-${dayjs(args[2] as number).format(
        'YYYY-MM-DD',
      )}-${dayjs(args[3] as number).format('YYYY-MM-DD')}`,
    until: (v, t, _, __, [, , , end]) =>
      !v || !t || t - Number(end) < MsIntervals.min * 30,
  })
  static async getHlPriceBetween(
    provider: ethers.JsonRpcApiProvider,
    ccy: 'BTC' | 'ETH',
    startMs: number,
    endMs: number,
  ) {
    const network = await provider._detectNetwork();
    const chainInfo = ChainMap[Number(network.chainId)];
    const contract = new ethers.Contract(
      chainInfo.hlPriceOracle[ccy],
      HlOracleAbis.abi,
      provider,
    );
    const start = nearest8h(startMs);
    const end = nearest8h(endMs);
    const term = (end - start) / MsIntervals.day;
    const val: [number, number] = await contract.getHlPrices(
      term,
      endMs / 1000,
    );
    const low = +ethers.formatUnits(val[0], 8);
    const high = +ethers.formatUnits(val[1], 8);
    return { timestamp: endMs / 1000, low, high, close: high, open: low };
  }

  // 请确保你要调用的方法是 transaction 交易
  static async dirtyCall<T extends unknown[]>(
    contract: ethers.Contract,
    method: string,
    genArgs: (gasLimit?: number) => T,
  ) {
    const argsEst = genArgs(undefined);
    console.info(`Est. gas for ${method}`, {
      contract,
      method,
      argsEst,
    });
    const gasEstimate = await contract[method].estimateGas(...argsEst);
    const gasLimit =
      +Number(gasEstimate) +
      Math.min(Math.floor(+Number(gasEstimate) * 0.1), 40000); // 防止失败
    const args = genArgs(gasLimit);
    console.info(`Add gasLimit for ${method}`, {
      contract,
      method,
      args,
      gasEstimate,
    });
    const tx = await contract[method](...args);
    return tx.hash as string;
  }
}
