import { calc_yield } from '@sofa/alg';
import { isNullLike, safeRun } from '@sofa/utils/fns';
import { http, pollingUntil } from '@sofa/utils/http';
import { UserStorage } from '@sofa/utils/storage';

import {
  ContractsService,
  ProductType,
  TransactionStatus,
  VaultInfo,
} from './contracts';
import { TFunction } from './i18n';
import { MarketService } from './market';
import {
  CalculatedInfo,
  extractFromPPSKey,
  genPPSKey,
  PPSKey,
  PPSValue as PPSValue,
  ProductInfo,
  ProductsService,
} from './products';
import { RiskType } from './products';
import { BindTradeInfo, ReferralService } from './referral';
import {
  PositionInfoInGraph,
  PositionStatus,
  TransactionInfoInGraph,
} from './the-graph';
import { WalletService } from './wallet';

export interface PositionParams {
  chainId?: number; //
  vaults?: string[]; // 合约地址集合，没传表示查询全部合约
  claimed?: boolean; // 是否已被赎回，没传表示查询所有状态的头寸
  expired?: boolean; // 是否到期，没传表示查询所有状态的头寸
  concealed?: boolean; // 是否被隐藏，没传表示查询所有状态的头寸
  positiveReturn?: boolean; //赎回金额是否大于 0，没传表示查询所有头寸
  positiveProfit?: boolean; // 是否获得了超过本金的回报，没传表示查询所有头寸
  limit?: number; // 查询数量，默认为 100，最大为 300
  startDateTime?: number; // 对应的秒级时间戳，例如 1672387200
  endDateTime?: number; // 对应的秒级时间戳，例如 1672387200
  orderBy?: 'createdAt' | 'return'; // 排序方式，createdAt（更新时间，默认），return（回报）
  orderDirection?: 'desc' | 'asc'; // "desc" | "asc", 默认为 desc（按时间戳降序）
  wallet?: string; // 钱包address (默认为空时查询所有钱包地址）
}

export interface ClaimParams {
  term?: number; // 只有 DNT 需要
  expiry: number;
  anchorPrices: string[];
  maker: 1 | 0;
  collateralAtRiskPercentage?: string; // 非 Surge 产品需要
}

export interface TransactionParams {
  chainId?: number; //
  vaults?: string[]; // 合约地址集合，没传表示查询全部合约
  limit?: number; // 查询数量，默认为 100，最大为 300
  startDateTime?: number; // 对应的秒级时间戳，例如 1672387200
  endDateTime?: number; // 对应的秒级时间戳，例如 1672387200
  orderDirection?: 'desc' | 'asc'; // "desc" | "asc", 默认为 desc（按时间戳降序）
  taker?: string; // Taker 钱包 address (默认为空时查询所有钱包地址）
  maker?: string; // Maker 钱包 address (默认为空时查询所有钱包地址）
  claimParams?: ClaimParams; // 赎回的参数，对应 position-list 数据里面的 claimParams 字段
  hash?: string; // 交易 hash
}

export interface SettlementInfo {
  takerAllocationRate?: number; // 以现在的情况来推算，owner 能从对赌池中拿走多少比例，pending 状态下不存在这个值
  triggerTime?: number; // Rangebound 第一次出界的时间，秒
  triggerPrice?: number; // Rangebound 第一次出界的的价格
}

export interface OriginPositionInfo extends CalculatedInfo, SettlementInfo {
  id: PositionInfoInGraph['productId'];
  positionId: PositionInfoInGraph['id'];
  wallet: string; // 所有人的地址
  product: ProductInfo;
  claimed: boolean;
  updatedAt: number; // 更新时间，秒
  createdAt: number; // 创建时间，秒
  claimParams: ClaimParams;
  size?: number;
}

export interface PositionInfo extends OriginPositionInfo {
  pricesForCalculation: Record<string, number | undefined>;

  // 对于存入之后没有利息的 earn 的 vault（比如 sUSDa 的几个 Earn 合约）来讲，需要计算以底层价值币种来转换数据
  convertedCalculatedInfoByDepositBaseCcy?: CalculatedInfo;
}

export interface OriginTransactionInfo
  extends Omit<
    OriginPositionInfo,
    'id' | 'wallet' | 'claimParams' | 'updatedAt' | 'claimed'
  > {
  hash: string;
  takerWallet: string;
  makerWallet: string;
}

export interface TransactionInfo extends OriginTransactionInfo {
  pricesForCalculation: Record<string, number | undefined>;
}

export interface TransactionProgress {
  status:
    | 'Submitting'
    | 'SubmitFailed'
    | 'QueryResult'
    | 'Success'
    | 'Partial Failed'
    | 'All Failed';
  details?: (readonly [
    string /* `${vault.toLowerCase()}-${chainId}-${depositCcy}` */,
    {
      ids: (string | number)[];
      status: PositionStatus;
      hash?: string | string[];
      error?: unknown;
    },
  ])[];
}

const PositionUpdateTime = new UserStorage<{ timeMs: number }>(
  'position-update-time',
  () => 'curr',
);

export class PositionsService {
  static PositionStatusRefs = {
    [PositionStatus.PENDING]: {
      label: (t: TFunction) => t('PENDING'),
      color: '#666',
    },
    [PositionStatus.MINTED]: {
      label: (t: TFunction) => t('MINTED'),
      color: '#44C476',
    },
    [PositionStatus.FAILED]: {
      label: (t: TFunction) => t('FAILED'),
      color: '#eb4476',
    },
    [PositionStatus.EXPIRED]: {
      label: (t: TFunction) => t('EXPIRED'),
      color: '#e05e2b',
    },
    [PositionStatus.REDEEMING]: {
      label: (t: TFunction) => t('REDEEMING'),
      color: '#999',
    },
    [PositionStatus.REDEEMED]: {
      label: (t: TFunction) => t('REDEEMED'),
      color: '#000',
    },
    [PositionStatus.CLAIMING]: {
      label: (t: TFunction) => t('CLAIMING'),
      color: '#999',
    },
    [PositionStatus.CLAIMED]: {
      label: (t: TFunction) => t('CLAIMED'),
      color: '#000',
    },
  };

  static genPositionId(
    vault: string,
    expiry: number,
    observationStart: number,
    anchorPrices: number[],
    collateralAtRiskPercentage?: string | number,
  ) {
    return `${vault.toLowerCase()}-${expiry}-${observationStart}-${anchorPrices.join(
      ',',
    )}-${collateralAtRiskPercentage ?? ''}`;
  }

  static async balanceOfPositions(
    vault: string,
    chainId: number,
    positions: [string /*address*/, string /*position id*/][],
  ) {
    const provider = await WalletService.readonlyConnect(chainId);
    const contract = await ContractsService.rfqContract(vault, provider);
    const addresses = positions.map((it) => it[0]);
    const ids = positions.map((it) => it[1]);
    console.info('Balance of Batch', { addresses, ids, provider });
    return contract
      .balanceOfBatch(addresses, ids)
      .then((list: (string | number)[]) =>
        Object.fromEntries(
          list.map((it, i) => [positions[i][1], Number(it) || 0]),
        ),
      );
  }

  static cvtPosition<
    T extends CalculatedInfo &
      Pick<OriginPositionInfo, 'product' | 'createdAt'> & { claimed?: boolean },
  >(
    it: T,
    ppsMap?: Record<
      VaultInfo['depositCcy'],
      Record<number /* timestamp */ | 'now', number>
    >,
  ) {
    const vault = ContractsService.getVaultInfo(
      it.product.vault.vault,
      it.product.vault.chainId,
    );
    const convertedCalculatedInfoByDepositBaseCcy = vault.depositBaseCcy
      ? (() => {
          if (!ppsMap?.[vault.depositCcy]) return undefined;
          const expiry = it.product.expiry * 1000;
          const hasExpired = Date.now() > expiry;
          const pps = {
            atTrade: ppsMap[vault.depositCcy][it.createdAt * 1000],
            afterExpire:
              ppsMap[vault.depositCcy][
                !it.claimed && hasExpired ? 'now' : expiry
              ],
          };
          if (!pps.atTrade || !pps.afterExpire) return undefined;
          return ProductsService.cvtCalculatedInfoToDepositBaseCcy(
            vault,
            it,
            it.createdAt * 1000,
            !it.claimed && hasExpired ? Date.now() : expiry,
            pps,
          );
        })()
      : undefined;
    return {
      ...it,
      vault,
      pricesForCalculation: it.relevantDollarPrices.reduce(
        (pre, it) => ({ ...pre, [it.ccy]: it.price }),
        {},
      ),
      convertedCalculatedInfoByDepositBaseCcy,
    };
  }

  static async history(
    params: {
      chainId: number;
      owner?: string;
      riskType?: RiskType;
      productType?: ProductType;
      expiry_lte?: number;
      claimed?: boolean;
      expired?: boolean;
      concealed?: boolean;
      positiveReturn?: boolean;
      positiveProfit?: boolean;
      onlyForAutomator?: boolean;
    },
    extra?: PageParams<'cursor', 'createdAt' | 'return'>,
  ): Promise<PageResult<PositionInfo, { hasMore: boolean }, 'cursor'>> {
    const vault_in = ProductsService.filterVaults(
      ContractsService.vaults,
      params,
      true,
    ).map((it) => it.vault.toLowerCase());
    const limit = extra?.limit ?? 20;
    if (!vault_in.length) return { hasMore: false, cursor: 0, limit, list: [] };
    const res = await http.post<unknown, HttpResponse<PositionInfo[]>>(
      '/rfq/position-list',
      {
        chainId: params.chainId,
        wallet: params.owner,
        endDateTime: extra?.cursor ?? params.expiry_lte,
        claimed: params.claimed,
        expired: params.expired,
        concealed: params.concealed,
        positiveReturn: params.positiveReturn,
        positiveProfit: params.positiveProfit,
        vaults: vault_in,
        limit,
        orderBy: extra?.orderBy,
      } as PositionParams,
    );

    const list = res.value.map((it) => ({
      position: it,
      vault: ContractsService.getVaultInfo(
        it.product.vault.vault,
        it.product.vault.chainId,
      ),
    }));
    const timeList = list.reduce(
      (pre, it) => {
        const vault = it.vault;
        // 没有 depositBaseCcy 表示不需要转换，也就不需要历史的 pps
        if (!vault.depositBaseCcy) return pre;
        const key = genPPSKey(vault);
        if (!pre[key]) pre[key] = [];
        if (!pre[key].includes(it.position.createdAt * 1000))
          pre[key].push(it.position.createdAt * 1000);
        return pre;
      },
      {} as Record<PPSKey, number /* ms */[]>,
    );

    const [pps, apyMap] = await Promise.all([
      Promise.all(
        Object.entries(timeList).map(async ([k, list]) => [
          k,
          await MarketService.getPPS({
            fromCcy: extractFromPPSKey(k as PPSKey).depositCcy,
            toCcy: extractFromPPSKey(k as PPSKey).depositBaseCcy,
            includeNow: true,
            timeList: list,
          }),
        ]),
      ).then((res) => Object.fromEntries(res) as Record<PPSKey, PPSValue>),
      MarketService.interestRate(params.chainId),
    ]);

    const ppsMap = list.reduce((pre, { position, vault }) => {
      const expiry = position.product.expiry * 1000;
      const hasExpired = Date.now() > expiry;
      if (!vault.depositBaseCcy || hasExpired) return pre;
      const apy = apyMap[vault.depositBaseCcy];
      if (isNullLike(apy))
        throw new Error(`Can not find apy of ${vault.depositBaseCcy}`);
      const key = genPPSKey(vault);
      if (!pre[key][expiry]) {
        pre[key][expiry] = calc_yield(
          apy.apyUsed,
          pre[key]['now'],
          Date.now(),
          expiry,
        );
      }
      return pre;
    }, pps);

    return {
      cursor:
        extra?.orderBy === 'return'
          ? undefined
          : res.value[res.value.length - 1]?.createdAt,
      limit,
      list: res.value.map((it) => PositionsService.cvtPosition(it, ppsMap)),
      hasMore: res.value.length >= limit,
    };
  }

  static async transactions(
    params: {
      chainId: number;
      minter?: string;
      riskType?: RiskType;
      productType?: ProductType;
    } & Partial<
      Pick<
        TransactionInfoInGraph,
        | 'vault'
        | 'expiry'
        | 'anchorPrices'
        | 'term'
        | 'collateralAtRiskPercentage'
      >
    >,
    extra?: PageParams<'cursor'>,
  ): Promise<PageResult<TransactionInfo, Record<string, unknown>, 'cursor'>> {
    const limit = extra?.limit ?? 20;
    const vault_in = params.vault
      ? [params.vault]
      : ProductsService.filterVaults(ContractsService.vaults, params, true).map(
          (it) => it.vault.toLowerCase(),
        );
    const res = await http.post<unknown, HttpResponse<TransactionInfo[]>>(
      '/rfq/transaction-list',
      {
        chainId: params.chainId,
        taker: params.minter,
        vaults: vault_in,
        endDateTime: extra?.cursor ?? params.expiry,
        claimParams: {
          term: params.term,
          expiry: params.expiry,
          anchorPrices: params.anchorPrices,
          collateralAtRiskPercentage: params.collateralAtRiskPercentage,
          maker: 0,
        },
      } as TransactionParams,
    );

    return {
      cursor: res.value[res.value.length - 1]?.createdAt,
      limit,
      list: res.value.map((it) => PositionsService.cvtPosition(it)),
    };
  }

  static async wonderful(params: {
    chainId: number;
    owner: string;
    riskType?: RiskType;
    productType?: ProductType;
  }): Promise<PositionInfo[]> {
    const res = await PositionsService.history(
      {
        ...params,
        claimed: true,
        ...(params.riskType === RiskType.RISKY
          ? { positiveReturn: true } // 彩票只要有奖金就认为是 wonderful time
          : { positiveProfit: true }),
      },
      { limit: 200 },
    );
    return (
      res.list?.filter((it) => {
        if (it.product.vault.riskType === RiskType.RISKY) {
          return Number(it.amounts.redeemable) > 0;
        }
        return Number(it.amounts.redeemable) - Number(it.amounts.own) > 0;
      }) || []
    );
  }

  static async depositResult(
    hash: string,
    chainId: number,
  ): Promise<PositionStatus> {
    if (!hash) return PositionStatus.PENDING;
    return WalletService.transactionResult(hash, chainId).then(async (s) => {
      const status = await (async () => {
        if (s.status === TransactionStatus.FAILED) return PositionStatus.FAILED;
        // await pollingUntil(
        //   () =>
        //     TheGraphService.transactions({ chainId, hash }).catch(console.warn),
        //   (r) => !!r?.list?.length,
        //   1000,
        // );
        return PositionStatus.MINTED;
      })();
      PositionUpdateTime.set({ timeMs: Date.now() });
      return status;
    });
  }

  static async deposit(
    cb: (progress: TransactionProgress) => void,
    ...[params]: Parameters<typeof WalletService.mint>
  ) {
    safeRun(cb, { status: 'Submitting' });
    const key = `${params.vault.vault.toLowerCase()}-${params.vault.chainId}-${params.depositCcy}`;
    return WalletService.mint(params)
      .then(async (hash) => {
        ReferralService.bind([
          { rfqId: params.rfqId, quoteId: params.quote.quoteId, txId: hash },
        ]);
        safeRun(cb, {
          status: 'QueryResult',
          details: [
            [
              key,
              {
                status: PositionStatus.PENDING,
                hash,
                ids: [params.quote.quoteId],
              },
            ],
          ],
        });
        const status = await PositionsService.depositResult(
          hash,
          params.vault.chainId,
        );
        safeRun(cb, {
          status: status === PositionStatus.FAILED ? 'All Failed' : 'Success',
          details: [[key, { status, hash, ids: [params.quote.quoteId] }]],
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
                status: PositionStatus.FAILED,
                error,
                ids: [params.quote.quoteId],
              },
            ],
          ],
        });
      });
  }

  static async batchDeposit(
    cb: (progress: TransactionProgress) => void,
    ...[params]: Parameters<typeof WalletService.mintBatch>
  ) {
    safeRun(cb, { status: 'Submitting' });
    return WalletService.mintBatch(params).then(async (hashes) => {
      const map = {
        0: 'Success',
        1: 'All Failed',
        2: 'Partial Failed',
      } as const;
      if (map[hashes.code] !== 'All Failed') {
        const detailsMap = Object.fromEntries(hashes.value);
        ReferralService.bind(
          params.reduce((pre, it) => {
            const result =
              detailsMap[
                `${it.vault.vault.toLowerCase()}-${it.vault.chainId}-${
                  it.depositCcy
                }`
              ];
            if (result.hash) {
              pre.push({
                rfqId: it.rfqId,
                quoteId: it.quote.quoteId,
                txId: result.hash,
              });
            }
            return pre;
          }, [] as BindTradeInfo[]),
        );
      }
      safeRun(cb, {
        status: 'QueryResult',
        details: hashes.value.map(
          (it) =>
            [
              it[0],
              {
                ...it[1],
                status: it[1].error
                  ? PositionStatus.FAILED
                  : PositionStatus.PENDING,
                ids: it[1].quoteIds,
              },
            ] as const,
        ),
      });
      const details = await Promise.all(
        hashes.value.map(async (it) => {
          const [key, info] = it;
          if (!info?.hash)
            return [
              key,
              {
                status: PositionStatus.FAILED,
                error: info?.error,
                ids: info?.quoteIds,
              },
            ] as const;
          const chainId = +key.split('-')[1];
          const status = await PositionsService.depositResult(
            info.hash,
            chainId,
          );
          return [
            key,
            { status, hash: info.hash, ids: info.quoteIds },
          ] as const;
        }),
      );
      safeRun(cb, { status: map[hashes.code], details });
    });
  }

  static async claim(
    cb: (progress: TransactionProgress) => void,
    params: Parameters<typeof WalletService.burn>[0] & {
      positionId: string;
    },
  ) {
    safeRun(cb, { status: 'Submitting' });
    const key = `${params.vault.toLowerCase()}-${params.chainId}-${
      params.claimCcy
    }`;
    return WalletService.burn(params)
      .then(async (hash) => {
        safeRun(cb, {
          status: 'QueryResult',
          details: [
            [
              key,
              {
                status: PositionStatus.PENDING,
                hash: [hash],
                ids: [params.positionId],
              },
            ],
          ],
        });
        const status = await PositionsService.claimResult(hash, params.chainId);
        safeRun(cb, {
          status: status === PositionStatus.FAILED ? 'All Failed' : 'Success',
          details: [[key, { status, hash: [hash], ids: [params.positionId] }]],
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
                status: PositionStatus.FAILED,
                error,
                ids: [params.positionId],
              },
            ],
          ],
        });
      });
  }

  static async claimBatch(
    cb: (progress: TransactionProgress) => void,
    params: Parameters<typeof WalletService.burn>[0][],
  ) {
    safeRun(cb, { status: 'Submitting' });
    return WalletService.burnBatch(params).then(async (hashes) => {
      const map = {
        0: 'Success',
        1: 'All Failed',
        2: 'Partial Failed',
      } as const;
      safeRun(cb, {
        status: 'QueryResult',
        details: hashes.value.map(
          (it) =>
            [
              it[0],
              {
                ...it[1],
                ids: it[1].positionIds,
                status: it[1].error
                  ? PositionStatus.FAILED
                  : PositionStatus.PENDING,
              },
            ] as const,
        ),
      });
      const details = await Promise.all(
        hashes.value.map(async (it) => {
          const [key, info] = it;
          if (!info?.hash)
            return [
              key,
              {
                status: PositionStatus.FAILED,
                error: info?.error,
                ids: info.positionIds,
              },
            ] as const;
          const chainId = +key.split('-')[1];
          const status = await PositionsService.claimResult(
            info.hash[0],
            chainId,
          );
          return [
            key,
            { status, hash: info.hash, ids: info.positionIds },
          ] as const;
        }),
      );
      safeRun(cb, { status: map[hashes.code], details });
    });
  }

  static async claimResult(
    hash: string,
    chainId: number,
  ): Promise<PositionStatus> {
    if (!hash) return PositionStatus.EXPIRED;
    return WalletService.transactionResult(hash, chainId).then(async (s) => {
      const status = await (async () => {
        if (s.status === TransactionStatus.FAILED)
          return PositionStatus.EXPIRED;
        // await pollingUntil(
        //   () =>
        //     TheGraphService.transactions({ chainId, hash }).catch(console.warn),
        //   (r) => !!r?.list?.length,
        //   1000,
        // );
        return PositionStatus.CLAIMED;
      })();
      PositionUpdateTime.set({ timeMs: Date.now() });
      return status;
    });
  }

  // buying Spree：谁谁谁，买了什么，倒序排序
  static async buyingSpree(
    params: { chainId: number; productType?: ProductType },
    pageParams: Pick<PageParams<'cursor'>, 'cursor' | 'limit'>,
  ) {
    return PositionsService.history(
      {
        riskType: RiskType.RISKY,
        chainId: params.chainId,
        productType: params.productType,
        onlyForAutomator: false,
      },
      { ...pageParams },
    ).then((res) => res.list.filter((it) => !it.claimParams.maker));
  }

  // big win：谁谁谁，赚了多少，倒序
  static async bigWins(
    params: { chainId: number; productType?: ProductType },
    pageParams: Pick<PageParams<'cursor'>, 'cursor' | 'limit'>,
  ) {
    return PositionsService.history(
      {
        ...params,
        riskType: RiskType.RISKY,
        chainId: params.chainId,
        positiveReturn: true,
        onlyForAutomator: false,
      },
      { ...pageParams, orderBy: 'return' },
    ).then((res) => res.list.filter((it) => !it.claimParams.maker));
  }

  static async conceal(data: { chainId: number; positionIds: string[] }) {
    const call = (count: number) =>
      http.post<unknown, HttpResponse>('/rfq/position/conceal', {
        ...data,
        positionIds: data.positionIds.slice(20 * (count - 1), 20 * count),
      });
    return pollingUntil(
      call,
      (_, count) => 20 * count >= data.positionIds.length,
      1000,
    );
  }
}
