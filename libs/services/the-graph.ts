import { applyMock } from '@sofa/utils/decorators';
import { http } from '@sofa/utils/http';
import dayjs from 'dayjs';
import { omit } from 'lodash-es';

import { ChainMap, defaultChain } from './chains';
import { ContractsService } from './contracts';
import { RiskType } from './products';

export enum PositionStatus {
  PENDING = 'PENDING',
  MINTED = 'MINTED',
  EXPIRED = 'EXPIRED',
  REDEEMING = 'REDEEMING', // 赎回申请中，正在上链，Automator 合约的状态
  REDEEMED = 'REDEEMED', // 赎回已申请中，已上链，Automator 合约的状态
  CLAIMING = 'CLAIMING', // 赎回中，burn 方法已调用，正在上链，前端在交互中设置
  CLAIMED = 'CLAIMED',
  FAILED = 'FAILED',
}

export interface PositionInfoInGraph {
  vault: string;
  chainId: number;
  id: string;
  productId: string; // 产品 ID：pending/failed 状态的 productId 是交易 hash，其它状态的 productId 是由智能合约生成的 id
  expiry: number; // 到期时间，秒
  anchorPrices: string[]; // 边界价格，需要按倍数还原
  term: number; // 合约期，天
  owner: string; // 所有人的地址
  makerCollateral: string; // Maker 对赌抵押金额，需要按倍数还原
  totalCollateral: string; // 总质押金额，需要按倍数还原，包含了 tradingFee
  collateralAtRiskPercentage?: string; // 对赌金额占总质押金额的比例，需要按倍数还原
  isMaker: boolean; // 是否是做市商
  timestamp: number; // 头寸更新时间，秒
  createdAt: number; // 头寸最初创建时间，秒
  payoff?: number; // 能赎回的钱，未 claim 时为 null, claim （调用合约的 burn 或者 burn_batch）之后，合约会将用户赎回的钱更新到 the graph 的这个数据字段
  status?: PositionStatus;
  size?: number; // 对应的 position size，在 collateral 的倍数的基础上乘以了 1e18。Earn 为合约 mint 时产生的 aTokenShare，Leverage 为 totalCollateral - spreadCost，Surge 为 totalCollateral - tradingFee
  balance?: number; // 头寸数量，claim 之后会变少，通过 vault 合约的 balanceOf 方法获取
}

export interface TransactionInfoInGraph
  extends Omit<
    PositionInfoInGraph,
    'productId' | 'owner' | 'isMaker' | 'payoff' | 'status' | 'createdAt'
  > {
  id: string; // 记录 id
  hash: string; // 交易 hash
  minter: string; // 申购者地址
  maker: string; // 做市商地址
  referral: string; // 推荐人地址（如果后面有这种功能的话）
}

export interface RchBurnRecordForAutomator {
  id: string;
  account: string;
  chainId: string | number;
  amount: string | number;
  collateral: string;
  transactionHash: string;
}

export class TheGraphService {
  static vaultGraphUrl(chainId: number) {
    return ChainMap[chainId]?.vaultGraphUrl;
  }

  @applyMock('positions')
  static async positions(
    params: {
      chainId: number;
      owner?: string;
      vault_in?: string[];
    } & (
      | {
          payoff_gt?: number;
        }
      | {
          payoff_not?: null;
        }
      | {
          payoff?: null;
        }
    ),
    extra?: PageParams<'cursor'>,
    cursorField: 'id' | 'timestamp' = 'timestamp', // cursor 对应什么字段
  ): Promise<PageResult<PositionInfoInGraph, EmptyObj, 'cursor'>> {
    const where = (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {
        ...omit(params, ['chainId', 'riskType']),
        [`${cursorField}_lt`]: extra?.cursor,
      };
      if (obj.owner) obj.owner = obj.owner.toLowerCase();
      if (!obj.vault_in)
        obj.vault_in = ContractsService.vaults.map((it) => it.vault);
      return obj;
    })();
    const query = `
    {
      positions(
        where: ${JSON.stringify(where).replace(/"([^"]+)":/g, '$1:')},
        first: ${extra?.limit || 20},
        orderBy: ${JSON.stringify(extra?.orderBy || cursorField)},
        orderDirection: ${JSON.stringify(extra?.orderDirection || 'desc')}
      ) {
        id
        productId
        vault
        owner
        totalCollateral
        timestamp
        createdAt
        term
        payoff
        makerCollateral
        isMaker
        expiry
        collateralAtRiskPercentage
        anchorPrices
      }
    }
    `;
    return http
      .post<
        unknown,
        HttpResponse<{ data: { positions: PositionInfoInGraph[] } }>
      >(TheGraphService.vaultGraphUrl(params.chainId), {
        query,
      })
      .then((res) => ({
        list: res.value.data.positions.map((it) => ({
          ...it,
          chainId: params.chainId,
        })),
        cursor:
          res.value.data.positions[res.value.data.positions.length - 1]?.[
            cursorField
          ],
        limit: extra?.limit || 20,
      }));
  }

  @applyMock('transactions')
  static async transactions(
    params: {
      chainId: number;
      minter?: string;
      riskType?: RiskType;
      vault_in?: string[];
      timestamp_gt?: number;
      timestamp_lt?: number;
    } & Partial<TransactionInfoInGraph>,
    extra?: PageParams<'cursor'>,
    cursorField: 'id' | 'timestamp' = 'timestamp', // cursor 对应什么字段
  ): Promise<PageResult<TransactionInfoInGraph, EmptyObj, 'cursor'>> {
    const where = (() => {
      const obj = {
        ...omit(params, [
          'chainId',
          'limit',
          'offset',
          'riskType',
          'orderBy',
          'orderDirection',
        ]),
        [`${cursorField}_lt`]: extra?.cursor,
      };
      if (obj.minter) obj.minter = obj.minter.toLowerCase();
      if (obj.vault_in && obj.vault) delete obj.vault_in;
      if (!obj.vault_in && !obj.vault)
        obj.vault_in = ContractsService.vaults.map((it) => it.vault);
      if (params.riskType && !params.collateralAtRiskPercentage) {
        return {
          ...obj,
          [params.riskType !== RiskType.RISKY
            ? 'collateralAtRiskPercentage_not'
            : 'collateralAtRiskPercentage']: null,
        };
      }
      return obj;
    })();
    const query = `
    {
      transactions(
        where: ${JSON.stringify(where).replace(/"([^"]+)":/g, '$1:')},
        first: ${extra?.limit || 20},
        orderBy: ${JSON.stringify(extra?.orderBy || cursorField)},
        orderDirection: ${JSON.stringify(extra?.orderDirection || 'desc')}
      ) {
        id
        hash
        vault
        minter
        maker
        makerCollateral
        referral
        term
        timestamp
        totalCollateral
        expiry
        collateralAtRiskPercentage
        anchorPrices
      }
    }
    `;
    return http
      .post<
        unknown,
        HttpResponse<{ data: { transactions: TransactionInfoInGraph[] } }>
      >(TheGraphService.vaultGraphUrl(params.chainId), { query })
      .then((res) => ({
        list: res.value.data.transactions.map((it) => ({
          ...it,
          chainId: params.chainId,
        })),
        cursor:
          res.value.data.transactions[res.value.data.transactions.length - 1]?.[
            cursorField
          ],
        limit: extra?.limit || 20,
      }));
  }

  static async syncInfoOfTheGraph(chainId: number) {
    const query = `
    {
      _meta {
        block {
          timestamp
          number
        }
      }
    }
    `;
    return http
      .post<
        unknown,
        HttpResponse<{
          data: { _meta: { block: { timestamp: number; number: number } } };
        }>
      >(TheGraphService.vaultGraphUrl(chainId), { query })
      .then((res) => {
        const data = res.value.data._meta.block;
        console.info(
          `Sync Info of TheGraph(ChainId - ${chainId}): `,
          `\n\r - Time: ${
            !data.timestamp
              ? '-'
              : dayjs(data.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
          }`,
          `\n\r - BlockNumber: ${data.number}`,
        );
      });
  }

  static async rchBurnRecordsForAutomator(params: {
    chainId: number;
    wallet: string;
  }) {
    const graphUrl = defaultChain.rchBurnForAutomatorGraphUrl;
    const where = { chainId: params.chainId, account: params.wallet };
    const query = `
    {
      burneds(where: ${JSON.stringify(where).replace(/"([^"]+)":/g, '$1:')})  {
          id
          account
          amount
          chainId
          collateral
          transactionHash
      }
    }
    `;
    return http
      .post<
        unknown,
        HttpResponse<{
          data: { burneds: RchBurnRecordForAutomator[] };
        }>
      >(graphUrl, { query })
      .then((res) => res.value.data.burneds);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.syncInfoOfTheGraph = () => {
  return Promise.all(
    ContractsService.vaults
      .reduce(
        (pre, it) => (pre.includes(it.chainId) ? pre : pre.concat(it.chainId)),
        [] as number[],
      )
      .map((it) => TheGraphService.syncInfoOfTheGraph(it)),
  );
};
