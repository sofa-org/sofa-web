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
import DNTVaultAbis from './abis/DNTVault.json';
import DNTVaultAbis1 from './abis/DNTVault-No-Permit2.json';
import FeeAbis from './abis/FeeCollector.json';
import HlOracleAbis from './abis/HlOracle.json';
import LeverageDNTVaultAbis from './abis/LeverageDNTVault.json';
import LeverageSTVaultAbis from './abis/LeverageSmartTrendVault.json';
import MerkleAirdropAbis from './abis/MerkleAirdrop.json';
import PrincipalDNTVaultAbis from './abis/PrincipalDNTVault.json';
import PrincipalDNTVaultAbis1 from './abis/PrincipalDNTVault-No-Permit2.json';
import PrincipalSTVaultAbis from './abis/PrincipalSmartTrendVault.json';
import PrincipalSTVaultAbis1 from './abis/PrincipalSmartTrendVault-No-Permit2.json';
import RCHAbis from './abis/RCH.json';
import STVaultAbis from './abis/SmartTrendVault.json';
import STVaultAbis1 from './abis/SmartTrendVault-No-Permit2.json';
import SpotOracleAbis from './abis/SpotOracle.json';
import vaults_1 from './vaults/1';
import vaults_42161 from './vaults/42161';
import vaults_11155111 from './vaults/11155111';
import {
  ProductType,
  RiskType,
  TransactionStatus,
  VaultInfo,
} from './base-type';
import { ChainMap, defaultChain } from './chains';

export { ProductType, RiskType, TransactionStatus };
export type { VaultInfo };

export class ContractsService {
  private static RFQVaultAbis: PartialRecord<
    `${ProductType}-${RiskType}-${boolean /* usePermit2 */}`,
    ethers.InterfaceAbi
  > = {
    [`${ProductType.DNT}-${RiskType.PROTECTED}-true`]: PrincipalDNTVaultAbis,
    [`${ProductType.DNT}-${RiskType.PROTECTED}-false`]: PrincipalDNTVaultAbis1,
    [`${ProductType.BullSpread}-${RiskType.PROTECTED}-true`]:
      PrincipalSTVaultAbis,
    [`${ProductType.BullSpread}-${RiskType.PROTECTED}-false`]:
      PrincipalSTVaultAbis1,
    [`${ProductType.BearSpread}-${RiskType.PROTECTED}-true`]:
      PrincipalSTVaultAbis,
    [`${ProductType.BearSpread}-${RiskType.PROTECTED}-false`]:
      PrincipalSTVaultAbis1,
    [`${ProductType.DNT}-${RiskType.RISKY}-true`]: DNTVaultAbis,
    [`${ProductType.DNT}-${RiskType.RISKY}-false`]: DNTVaultAbis1,
    [`${ProductType.BullSpread}-${RiskType.RISKY}-true`]: STVaultAbis,
    [`${ProductType.BullSpread}-${RiskType.RISKY}-false`]: STVaultAbis1,
    [`${ProductType.BearSpread}-${RiskType.RISKY}-true`]: STVaultAbis,
    [`${ProductType.BearSpread}-${RiskType.RISKY}-false`]: STVaultAbis1,
    [`${ProductType.DNT}-${RiskType.LEVERAGE}-true`]: LeverageDNTVaultAbis, // 其实是不支持 permit2
    [`${ProductType.DNT}-${RiskType.LEVERAGE}-false`]: LeverageDNTVaultAbis,
    [`${ProductType.BullSpread}-${RiskType.LEVERAGE}-true`]:
      LeverageSTVaultAbis, // 其实是不支持 permit2
    [`${ProductType.BullSpread}-${RiskType.LEVERAGE}-false`]:
      LeverageSTVaultAbis,
    [`${ProductType.BearSpread}-${RiskType.LEVERAGE}-true`]:
      LeverageSTVaultAbis, // 其实是不支持 permit2
    [`${ProductType.BearSpread}-${RiskType.LEVERAGE}-false`]:
      LeverageSTVaultAbis,
  };

  static vaults: VaultInfo[] = [
    ...vaults_1,
    ...vaults_42161,
    ...vaults_11155111,
  ]
    .filter((it) => ChainMap[it.chainId])
    .map(
      (it) =>
        ({
          ...it,
          trackingSource: 'COINBASE',
          depositMinAmount: (() => {
            if (Env.isPre) {
              // 大约 0.05U
              return {
                RCH: 0.05,
                USDT: 0.05,
                USDC: 0.05,
                WETH: 0.000015,
                stETH: 0.000015,
                WBTC: 0.000001,
              }[it.depositCcy];
            }
            return it.riskType === RiskType.RISKY
              ? {
                  RCH: 20,
                  USDT: 20,
                  USDC: 20,
                  WETH: 0.01,
                  stETH: 0.01,
                  WBTC: 0.0005,
                }[it.depositCcy]
              : {
                  RCH: 100,
                  USDT: 100,
                  USDC: 100,
                  WETH: 0.05,
                  stETH: 0.05,
                  WBTC: 0.002,
                }[it.depositCcy];
          })(),
          depositTickAmount: (() => {
            if (Env.isPre) {
              // 大约 0.05U
              return {
                RCH: 0.05,
                USDT: 0.05,
                USDC: 0.05,
                WETH: 0.000001,
                stETH: 0.000001,
                WBTC: 0.000001,
              }[it.depositCcy];
            }
            return it.riskType === RiskType.RISKY
              ? {
                  RCH: 20,
                  USDT: 20,
                  USDC: 20,
                  WETH: 0.01,
                  stETH: 0.01,
                  WBTC: 0.0005,
                }[it.depositCcy]
              : {
                  RCH: 1,
                  USDT: 1,
                  USDC: 1,
                  WETH: 0.0001,
                  stETH: 0.0001,
                  WBTC: 0.0001,
                }[it.depositCcy];
          })(),
          anchorPricesDecimal: 1e8,
          collateralDecimal: {
            RCH: 1e18,
            USDT: 1e6,
            USDC: 1e6,
            WETH: 1e18,
            stETH: 1e18,
            WBTC: 1e18,
          }[it.depositCcy],
          balanceDecimal:
            {
              RCH: 1e18,
              USDT: 1e6,
              USDC: 1e6,
              WETH: 1e18,
              stETH: 1e18,
              WBTC: 1e18,
            }[it.depositCcy]! * (it.riskType === RiskType.PROTECTED ? 1e18 : 1),
          abis: ContractsService.RFQVaultAbis[
            `${it.productType}-${it.riskType}-${it.usePermit2}`
          ],
        }) as VaultInfo,
    );

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

  static getVaultInfo(vault: string, chainId: number) {
    const vaults = ContractsService.vaults;
    const vaultInfo = vaults.find(
      (it) =>
        it.vault.toLowerCase() === vault.toLowerCase() &&
        it.chainId === chainId,
    );
    if (!vaultInfo) throw new Error('Invalid vault');
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
    id: (_, args) => `uniswap-pair-reserves-${args[0]}-${defaultChain.chainId}`,
  })
  static async getUniswapPairReserves(
    pairAddress: string,
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider,
  ): Promise<{ ccy: string; address: string; reserve: number }[]> {
    const pairContract = new ethers.Contract(
      pairAddress,
      IUniswapV2PairABI,
      signerOrProvider,
    );
    const [[$reserve0, $reserve1], token0Address, token1Address] =
      await Promise.all([
        pairContract.getReserves() as Promise<[bigint, bigint]>,
        pairContract.token0(),
        pairContract.token1(),
      ]);
    return Promise.all([
      ContractsService.tokenInfo(token0Address, signerOrProvider).then(
        (info) => ({
          ccy: info.symbol,
          address: token0Address,
          reserve: Number($reserve0 / BigInt(10 ** info.decimal)),
        }),
      ),
      ContractsService.tokenInfo(token1Address, signerOrProvider).then(
        (info) => ({
          ccy: info.symbol,
          address: token1Address,
          reserve: Number($reserve1 / BigInt(10 ** info.decimal)),
        }),
      ),
    ]);
  }

  @asyncCache({
    persist: true,
    until: (v, t) => !v || !t || Date.now() - t > 60000,
    id: (_, args) => `uniswap-pair-price-${args[0]}-${defaultChain.chainId}`,
  })
  static async getUniswapPairPriceV3(
    pairAddress: string,
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider,
  ) {
    const pairContract = new ethers.Contract(
      pairAddress,
      IUniswapV3PairABI,
      signerOrProvider,
    );
    const [{ sqrtPriceX96 }, token0Address, token1Address] = await Promise.all([
      pairContract.slot0() as Promise<{ sqrtPriceX96: bigint }>,
      pairContract.token0(),
      pairContract.token1(),
    ]);
    const [token0Info, token1Info] = await Promise.all([
      ContractsService.tokenInfo(token0Address, signerOrProvider),
      ContractsService.tokenInfo(token1Address, signerOrProvider),
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
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider,
    version: 'v2' | 'v3',
  ) {
    if (version === 'v2') {
      const [reserve0, reserve1] =
        await ContractsService.getUniswapPairReserves(
          pairAddress,
          signerOrProvider,
        );
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
      await ContractsService.getUniswapPairPriceV3(
        pairAddress,
        signerOrProvider,
      );
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
    const gasEstimate = await contract[method].estimateGas(
      ...genArgs(undefined),
    );
    const gasLimit =
      +Number(gasEstimate) + Math.min(+Number(gasEstimate) * 1.5, 40000); // 防止失败
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
