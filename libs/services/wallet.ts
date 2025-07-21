import { asyncRetry, asyncShare } from '@sofa/utils/decorators';
import { getErrorMsg, isNullLike } from '@sofa/utils/fns';
import { pollingUntil } from '@sofa/utils/http';
import { reMsgError } from '@sofa/utils/object';
import { sentry } from '@sofa/utils/sentry';
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk';
import { createWeb3Name } from '@web3-name-sdk/core';
import Big from 'big.js';
import { AbstractProvider, Contract, ethers } from 'ethers';
import { pick } from 'lodash-es';

import { CommonAbis } from './abis/common-abis';
import type { AutomatorVaultInfo } from './base-type';
import { ChainMap } from './chains';
import { ContractsService, RiskType, TransactionStatus } from './contracts';
import { ProductQuoteResult, ProductType } from './products';
import { PositionInfoInGraph } from './the-graph';
import { WalletConnect } from './wallet-connect';

export interface BurnProductParams {
  positionId: PositionInfoInGraph['productId'];
  term?: number; // 非 Rangebound 的产品不需要 term 字段
  expiry: number;
  anchorPrices: string[];
  isMaker: number;
  collateralAtRiskPercentage?: string | number;
}

export interface MintProductParams {
  expiry: number;
  anchorPrices: (string | number)[];
  collateralAtRisk?: string | number;
  makerCollateral: string | number;
  deadline: number;
  maker: string;
  makerSignature: string;
}

export interface DualMintProductParams {
  expiry: number;
  anchorPrice: string | number;
  makerCollateral: string | number;
  deadline: number;
  maker: string;
  makerSignature: string;
}

export class WalletService {
  static async readonlyConnect(chainId: number) {
    return WalletConnect.getProvider(chainId);
  }

  static async switchNetwork(chainId: number) {
    const provider = await WalletConnect.getModalProvider();
    if (provider) await WalletConnect.switchNetwork(provider, chainId);
  }

  static async connect(chainId: number) {
    return WalletConnect.connect(chainId)
      .then((res) => {
        sentry.setUser({ id: res.signer.address, wallet: res.name });
        return res;
      })
      .catch((err) => {
        WalletService.disconnect();
        if (/-32002/.test(getErrorMsg(err)) || err?.code === -32002) {
          throw reMsgError(
            err,
            () =>
              'There are pending authorization requests. Please check your wallet alerts',
          );
        }
        throw err;
      });
  }

  static async isConnected(address: string) {
    const provider = await WalletConnect.getModalProvider();
    if (!provider) return false;
    const result = await provider.send('eth_accounts', []);
    const accounts: string[] = result.result || result || [];
    return accounts.some((it) => it.toLowerCase() === address.toLowerCase());
  }

  static async info($chainId?: number) {
    const chainId = await (() => {
      if ($chainId) return $chainId;
      return WalletConnect.getModalProvider()
        .then((p) => p?._detectNetwork())
        .then((n) => Number(n?.chainId));
    })();
    if (!chainId) return { address: 'unknown', name: 'unknown', icon: '' };
    const connector = await WalletService.connect(chainId);
    return {
      address: (await connector.signer.getAddress()).toLowerCase(),
      name: connector.name,
      icon: connector.imageUrl,
    };
  }

  static async disconnect() {
    await WalletConnect.disconnect();
    localStorage.removeItem('@w3m/connected_wallet_image_url');
    localStorage.removeItem('@w3m/connected_connector');
    localStorage.removeItem('@w3m/wallet_id');
  }

  @asyncRetry()
  static async getCollateralFromVault(
    vaultAddress: string,
    provider: AbstractProvider,
  ): Promise<{ symbol: string; address: string | null }> {
    const contract = new ethers.Contract(
      vaultAddress,
      [CommonAbis.COLLATERAL, CommonAbis.collateral],
      provider,
    );
    const address = await contract
      .collateral()
      .catch(() => contract.COLLATERAL()) // 合约方法改成小写了，但是测试环境还是大写，这里做兼容
      .catch(() => null);
    if (!address) return { symbol: 'ETH', address };
    const collateralContract = new ethers.Contract(
      address,
      [CommonAbis.symbol],
      provider,
    );
    const $symbol = await collateralContract.symbol();
    const symbol = $symbol === 'USD₮0' ? 'USDT' : $symbol;
    return { symbol, address };
  }

  @asyncRetry()
  static async getBalanceFromVaultCollateral(
    vaultAddress: string,
    walletAddress: string,
    chainId: number,
  ) {
    const provider = await WalletService.readonlyConnect(chainId);
    const collateral = await WalletService.getCollateralFromVault(
      vaultAddress,
      provider,
    );
    if (!collateral.address)
      return {
        [collateral.symbol]: +ethers.formatEther(
          await provider.getBalance(walletAddress),
        ),
      };
    return WalletService.getBalanceByTokenContract(
      collateral.address,
      walletAddress,
      chainId,
    );
  }

  @asyncRetry()
  static async getBalanceFromAutomatorVaultCollateral(
    vault: AutomatorVaultInfo,
    walletAddress: string,
  ) {
    const provider = await WalletService.readonlyConnect(vault.chainId);
    const collateral = await WalletService.getCollateralFromVault(
      vault.vault,
      provider,
    );
    if (!collateral.address)
      return {
        [collateral.symbol]: +ethers.formatEther(
          await provider.getBalance(walletAddress),
        ),
      };
    return WalletService.getBalanceByTokenContract(
      collateral.address,
      walletAddress,
      vault.chainId,
    );
  }

  private static async $$approve(
    signer: ethers.JsonRpcSigner,
    collateralContract: ethers.Contract,
    approveTo = PERMIT2_ADDRESS,
    allowAmount?: string | number | bigint,
  ) {
    const hash = await ContractsService.dirtyCall(
      collateralContract,
      'approve',
      (gasLimit?: number) => [
        approveTo,
        allowAmount ? String(allowAmount) : ethers.MaxUint256,
        ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
      ],
    );
    const network = await signer.provider._detectNetwork();
    const succ = await WalletService.transactionResult(
      hash,
      Number(network.chainId),
    ).then((res) => res.status === TransactionStatus.SUCCESS);
    if (!succ)
      throw new Error(
        `Please approve ${approveTo} to proceed with the transaction`,
      );
  }

  static async $approve(
    collateralAddress: string,
    amount: string | number | bigint, // 交易金额，用于判断 allowance 是否够用（应该已经乘以了系数，比如实际为 1,000ETH，应该变成 1,000,000,000）
    signer: ethers.JsonRpcSigner,
    approveTo = PERMIT2_ADDRESS,
    forceClearAllowance = false, // 是否强制清空 allowance
  ) {
    const collateralContract = new ethers.Contract(
      collateralAddress,
      [CommonAbis.allowance, CommonAbis.approve],
      signer,
    );
    const allowance = await collateralContract.allowance(
      signer.address,
      approveTo,
    );
    if (Big(allowance).gte(Big(String(amount)))) return;
    console.info('Approve:', {
      allowance,
      amount,
      collateralAddress,
      approveTo,
      signer,
      forceClearAllowance,
    });
    if (
      Number(allowance) &&
      (['0xdac17f958d2ee523a2206206994597c13d831ec7'].includes(
        collateralAddress.toLowerCase(),
      ) ||
        forceClearAllowance)
    ) {
      // 这几个合约的 approve 方法只能在 allowance 全部用完才能继续 approve，否则只能清空
      await WalletService.$$approve(signer, collateralContract, approveTo, 0); // 清空
    }
    return WalletService.$$approve(
      signer,
      collateralContract,
      approveTo,
      approveTo === PERMIT2_ADDRESS ? undefined : amount,
    );
  }

  static async $dualMint(
    ctx: Awaited<ReturnType<typeof WalletService.connect>>,
    data: ProductQuoteResult & { depositCcy?: CCY | USDS },
  ): Promise<string> {
    const contract = await ContractsService.rfqContract(
      data.vault.vault,
      ctx.signer,
    );
    const amount = Big(data.quote.totalCollateral)
      .minus(data.quote.makerCollateral)
      .toFixed();
    const params: DualMintProductParams = {
      expiry: data.expiry,
      anchorPrice: data.quote.anchorPrices[0],
      makerCollateral: data.quote.makerCollateral,
      deadline: data.quote.deadline,
      maker: data.quote.makerWallet!,
      makerSignature: data.quote.signature!,
    };

    const collateral = await WalletService.getCollateralFromVault(
      data.vault.vault,
      ctx.provider,
    );

    await WalletService.$approve(
      collateral.address!,
      amount,
      ctx.signer,
      data.vault.vault,
      true, // 强制清空 allowance
    );
    const args = (gasLimit?: number) => [
      data.quote.totalCollateral,
      params,
      '0x837f487ec9e1C65bf960e7c3652b409EAD9fAb24',
      ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
    ];
    return ContractsService.dirtyCall(contract, 'mint', args);
  }
  static async mint(
    data: ProductQuoteResult & { depositCcy?: CCY | USDS },
  ): Promise<string> {
    const ctx = await WalletService.connect(+data.vault.chainId);
    if (!ctx.signer) throw new Error('Please connect you wallet first');
    if (data.vault.riskType === RiskType.DUAL) {
      return this.$dualMint(ctx, data);
    }
    const contract = await ContractsService.rfqContract(
      data.vault.vault,
      ctx.signer,
    );
    const amount = Big(data.quote.totalCollateral)
      .minus(data.quote.makerCollateral)
      .toFixed();
    const params: MintProductParams = {
      expiry: data.expiry,
      anchorPrices: data.quote.anchorPrices,
      collateralAtRisk: data.quote.collateralAtRisk,
      makerCollateral: data.quote.makerCollateral,
      deadline: data.quote.deadline,
      maker: data.quote.makerWallet!,
      makerSignature: data.quote.signature!,
    };
    if (isNullLike(params.collateralAtRisk)) delete params.collateralAtRisk;
    if (data.depositCcy === 'ETH') {
      const args = (gasLimit?: number) => [
        params,
        '0x837f487ec9e1C65bf960e7c3652b409EAD9fAb24',
        ...(gasLimit
          ? [{ value: amount, gasLimit }]
          : [{ value: amount, blockTag: 'pending' }]),
      ];
      const method =
        'mint((uint256,uint256[2],uint256,uint256,uint256,address,bytes),address)';
      return ContractsService.dirtyCall(contract, method, args);
    }

    const collateral = await WalletService.getCollateralFromVault(
      data.vault.vault,
      ctx.provider,
    );

    if (!data.vault.usePermit2) {
      await WalletService.$approve(
        collateral.address!,
        amount,
        ctx.signer,
        data.vault.vault,
      );
      const args = (gasLimit?: number) => [
        data.quote.totalCollateral,
        params,
        '0x837f487ec9e1C65bf960e7c3652b409EAD9fAb24',
        ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
      ];
      const method =
        data.vault.riskType === RiskType.RISKY
          ? 'mint(uint256,(uint256,uint256[2],uint256,uint256,address,bytes),address)'
          : 'mint(uint256,(uint256,uint256[2],uint256,uint256,uint256,address,bytes),address)';
      return ContractsService.dirtyCall(contract, method, args);
    }
    await WalletService.$approve(collateral.address!, amount, ctx.signer);
    const { sign, nonce } = await ContractsService.signPermit(
      collateral.address!,
      amount,
      data.quote.deadline,
      data.vault.vault,
      ctx.signer,
    );
    const args = (gasLimit?: number) => [
      data.quote.totalCollateral,
      params,
      sign,
      nonce,
      '0x837f487ec9e1C65bf960e7c3652b409EAD9fAb24',
      ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
    ];
    return ContractsService.dirtyCall(contract, 'mint', args);
  }

  private static async $mintBatch(
    ctx: {
      provider: AbstractProvider;
      signer: ethers.JsonRpcSigner;
    },
    contract: ethers.Contract,
    data: Parameters<typeof WalletService.mint>[0][],
    claimCcy?: CCY | USDS,
  ): Promise<string> {
    const params = data.map((it) => {
      const obj = {
        expiry: it.expiry,
        anchorPrices: it.quote.anchorPrices,
        collateralAtRisk: it.quote.collateralAtRisk,
        makerCollateral: it.quote.makerCollateral,
        deadline: it.quote.deadline,
        maker: it.quote.makerWallet,
        makerSignature: it.quote.signature,
      };
      if (!obj.collateralAtRisk) delete obj.collateralAtRisk;
      return obj;
    });
    const totalCollaterals = data.map((it) => it.quote.totalCollateral);
    const value = data
      .reduce(
        (pre, it) =>
          pre.plus(it.quote.totalCollateral).minus(it.quote.makerCollateral),
        Big(0),
      )
      .toFixed();
    if (claimCcy === 'ETH') {
      const args = (gasLimit?: number) => [
        totalCollaterals,
        params,
        '0x837f487ec9e1C65bf960e7c3652b409EAD9fAb24',
        ...(gasLimit
          ? [{ value, gasLimit }]
          : [{ value, blockTag: 'pending' }]),
      ];
      return ContractsService.dirtyCall(contract, 'mintBatch', args);
    }

    const collateral = await WalletService.getCollateralFromVault(
      data[0].vault.vault,
      ctx.provider,
    );

    if (!data[0].vault.usePermit2) {
      await WalletService.$approve(
        collateral.address!,
        value,
        ctx.signer,
        data[0].vault.vault,
      );
      const args = (gasLimit?: number) => [
        totalCollaterals,
        params,
        '0x837f487ec9e1C65bf960e7c3652b409EAD9fAb24',
        ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
      ];
      return ContractsService.dirtyCall(contract, 'mintBatch', args);
    }
    await WalletService.$approve(collateral.address!, value, ctx.signer);
    const deadline = Math.min(...data.map((it) => it.quote.deadline));
    const { sign, nonce } = await ContractsService.signPermit(
      collateral.address!,
      value,
      deadline,
      data[0].vault.vault,
      ctx.signer,
    );
    const args = (gasLimit?: number) => [
      totalCollaterals,
      params,
      sign,
      nonce,
      deadline,
      '0x837f487ec9e1C65bf960e7c3652b409EAD9fAb24',
      ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
    ];
    return ContractsService.dirtyCall(contract, 'mintBatch', args);
  }

  static async mintBatch(
    data: Parameters<typeof WalletService.mint>[0][],
  ): Promise<{
    code: 0 | 1 | 2; // 0 成功；1 全部失败；2 部分成功
    error?: string;
    value: (readonly [
      string /* `${vault.toLowerCase()}-${chainId}-${depositCcy}` */,
      { hash?: string; error?: unknown; quoteIds: (string | number)[] },
    ])[];
  }> {
    if (!data.length) return { code: 0, value: [] };
    // 一次操作的链肯定是一样的
    const ctx = await WalletService.connect(+data[0].vault.chainId);
    if (!ctx.signer) throw new Error('Please connect you wallet first');

    const groups = await data.reduce(
      async ($pre, it) => {
        const pre = await $pre;
        const key = `${it.vault.vault.toLowerCase()}-${it.vault.chainId}-${
          it.depositCcy
        }`;
        if (!pre[key]) {
          pre[key] = {
            contract: await ContractsService.rfqContract(
              it.vault.vault,
              ctx.signer!,
            ),
            params: [it],
            depositCcy: it.depositCcy,
          };
        } else {
          pre[key].params.push(it);
        }
        return pre;
      },
      Promise.resolve(
        {} as Record<
          string,
          {
            contract: ethers.Contract;
            params: Parameters<typeof WalletService.mint>[0][];
            depositCcy?: CCY | USDS;
          }
        >,
      ),
    );
    return Promise.all(
      Object.entries(groups).map(
        async ([key, it]) =>
          [
            key,
            await WalletService.$mintBatch(
              ctx,
              it.contract,
              it.params,
              it.depositCcy,
            ).then(
              (hash) => ({
                hash,
                quoteIds: it.params.map((it) => it.quote.quoteId),
              }),
              (error) => {
                console.error(error);
                return {
                  error,
                  quoteIds: it.params.map((it) => it.quote.quoteId),
                };
              },
            ),
          ] as const,
      ),
    ).then((res) => {
      const failedVaults = res.filter((it) => 'error' in it[1]);
      if (failedVaults.length) {
        const allFailed = failedVaults.length === res.length;
        return {
          code: allFailed ? 1 : 2,
          error: allFailed ? 'All failed' : 'Partially failed',
          value: res,
        };
      }
      return { code: 0, value: res };
    });
  }

  // 异步，合约 burn 方法调用之后会返回一个区块 hash，需要轮询上链结果，时间几十秒到几分钟不等
  static async burn(
    data: BurnProductParams & {
      vault: string;
      productType: ProductType;
      chainId: number;
      claimCcy?: CCY | USDS;
      redeemableAmount?: string | number;
      riskType: RiskType;
    },
  ): Promise<string> {
    const ctx = await WalletService.connect(+data.chainId);
    const contract = await ContractsService.rfqContract(data.vault, ctx.signer);
    const args = (gasLimit?: number) => [
      ...(data.productType === ProductType.DNT ? [data.term] : []),
      data.expiry,
      ...(data.riskType === RiskType.DUAL
        ? [
            // 双币只有一个价格
            data.anchorPrices[0],
          ]
        : [
            // 其他是价格数组
            data.anchorPrices,
          ]),
      ...(data.collateralAtRiskPercentage
        ? [data.collateralAtRiskPercentage]
        : []),
      ...(data.riskType === RiskType.DUAL
        ? []
        : [
            // 其他
            data.isMaker,
          ]),
      ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
    ];
    return ContractsService.dirtyCall(
      contract,
      data.claimCcy === 'ETH' ? 'ethBurn' : 'burn',
      args,
    );
  }

  @asyncShare(1000)
  static async transactionResult(
    hash: string,
    chainId: number,
  ): Promise<
    | { status: TransactionStatus.FAILED }
    | {
        status: TransactionStatus.SUCCESS;
        logs: ethers.Log[];
      }
  > {
    const poll = async () => {
      console.info('Get transaction result of hash', { hash, chainId });
      const provider = await WalletService.readonlyConnect(+chainId);
      const receipt = await provider.getTransactionReceipt(hash);
      if (!receipt) return { status: TransactionStatus.PENDING } as const;
      if (Number(receipt.status) !== 1)
        return { status: TransactionStatus.FAILED } as const;
      return {
        status: TransactionStatus.SUCCESS,
        logs: receipt.logs,
      } as const;
    };
    return pollingUntil(
      () => poll().catch(() => ({ status: TransactionStatus.PENDING })),
      (s) => s.status !== TransactionStatus.PENDING,
      1000,
    ).then(
      (res) =>
        res[res.length - 1] as
          | { status: TransactionStatus.FAILED }
          | {
              status: TransactionStatus.SUCCESS;
              logs: ethers.Log[];
            },
    );
  }

  private static async $burnBatch(
    contract: ethers.Contract,
    data: BurnProductParams[],
    claimCcy?: CCY | USDS,
  ): Promise<string[]> {
    const maxCount = 300;
    const $params = data.map((it) =>
      pick(it, [
        'term',
        'expiry',
        'anchorPrices',
        'isMaker',
        'collateralAtRiskPercentage',
      ]),
    );
    const fn = async (params: typeof $params) => {
      if (!params.length) return '';
      return ContractsService.dirtyCall(
        contract,
        claimCcy === 'ETH' ? 'ethBurnBatch' : 'burnBatch',
        (gasLimit?: number) => [
          params,
          ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
        ],
      );
    };
    return Promise.all(
      [...Array(Math.ceil($params.length / maxCount))]
        .map((_, i) => $params.slice(i * maxCount, (i + 1) * maxCount))
        .map((params) => fn(params)),
    );
  }

  static async burnBatch(
    data: Parameters<typeof WalletService.burn>[0][],
  ): Promise<{
    code: 0 | 1 | 2; // 0 成功；1 全部失败；2 部分成功
    error?: { msg: string; details: string };
    value: (readonly [
      string /* `${vault.toLowerCase()}-${chainId}-${claimCcy}` */,
      { hash?: string[]; error?: unknown; positionIds: string[] },
    ])[];
  }> {
    if (!data.length) return { code: 0, value: [] };
    // 一次操作的链肯定是一样的
    const ctx = await WalletService.connect(+data[0].chainId);
    if (!ctx.signer) throw new Error('Please connect you wallet first');

    const groups = await data.reduce(
      async ($pre, it) => {
        const pre = await $pre;
        const key = `${it.vault.toLowerCase()}-${it.chainId}-${it.claimCcy}`;
        if (!pre[key]) {
          pre[key] = {
            contract: await ContractsService.rfqContract(it.vault, ctx.signer!),
            params: [it],
            claimCcy: it.claimCcy,
            redeemableAmount: Number(it.redeemableAmount) || 0,
          };
        } else {
          pre[key].params.push(it);
          pre[key].redeemableAmount += Number(it.redeemableAmount) || 0;
        }
        return pre;
      },
      Promise.resolve(
        {} as Record<
          string,
          {
            contract: ethers.Contract;
            params: BurnProductParams[];
            claimCcy?: CCY | USDS;
            redeemableAmount: number;
          }
        >,
      ),
    );
    return Promise.all(
      Object.entries(groups)
        .sort((a, b) => b[1].redeemableAmount - a[1].redeemableAmount)
        .map(
          async ([key, it]) =>
            [
              key,
              await WalletService.$burnBatch(it.contract, it.params)
                .then((hash) => ({
                  hash,
                  positionIds: it.params.map((it) => it.positionId),
                }))
                .catch((error) => ({
                  error,
                  positionIds: it.params.map((it) => it.positionId),
                })),
            ] as const,
        ),
    ).then((res) => {
      const failedVaults = res.filter((it) => 'error' in it[1]) as [
        string,
        { error: unknown; positionIds: string[] },
      ][];
      if (failedVaults.length) {
        const allFailed = failedVaults.length === res.length;
        return {
          code: allFailed ? 1 : 2,
          error: {
            msg: allFailed
              ? 'None of the positions were successfully burned'
              : 'Part of the positions were burned failed',
            details: failedVaults
              .map((it) => `vault(${it[0]}): ${getErrorMsg(it[1].error)}`)
              .join('\n'),
          },
          value: res,
        };
      }
      return { code: 0, value: res };
    });
  }

  @asyncRetry()
  static async getBalanceByTokenContract(
    contract: string,
    address: string,
    chainId: number,
  ) {
    const provider = await WalletService.readonlyConnect(chainId);
    const {
      contract: tokenContract,
      symbol,
      decimal,
    } = await ContractsService.tokenInfo(contract, provider);
    const balance = ethers.formatUnits(
      await tokenContract.balanceOf(address),
      decimal,
    );
    return { [symbol === 'USD₮0' ? 'USDT' : symbol]: Number(balance) };
  }

  private static web3NameInstance: ReturnType<typeof createWeb3Name>;
  static async web3name(address: string) {
    WalletService.web3NameInstance =
      WalletService.web3NameInstance || createWeb3Name();
    return WalletService.web3NameInstance.getDomainName({
      address,
      queryChainIdList: Object.keys(ChainMap).map(Number),
    });
  }

  static async sendByAave(
    chainId: number,
    aaveContractAddress: string,
    assetAddress: string,
    amount: string | number,
    to: string,
  ) {
    const abi =
      'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)';
    const { signer } = await WalletService.connect(chainId);
    const contract = new Contract(aaveContractAddress, [abi], signer);
    const asset = new Contract(assetAddress, [CommonAbis.decimals], signer);
    const decimals = await asset.decimals();
    const amountWithDecimals = ethers.parseUnits(String(amount), decimals);
    await WalletService.$approve(
      assetAddress,
      amountWithDecimals,
      signer,
      aaveContractAddress,
    );
    return contract.supply(asset, amountWithDecimals, to, 0);
  }
}
