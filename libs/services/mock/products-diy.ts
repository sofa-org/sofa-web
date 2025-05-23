import { next8h } from '@sofa/utils/expiry';
import { nanoid } from 'nanoid';

import { ContractsService, RiskType, VaultInfo } from '../contracts';
import {
  ApyDefinition,
  OriginProductQuoteResult,
  ProductQuoteResult,
  ProductsService,
} from '../products';
import {
  ProductsDIYConfigRequest,
  ProductsDIYRecommendRequest,
} from '../products-diy';

function mockDIYConfig(params: ProductsDIYConfigRequest) {
  const vaults = ContractsService.vaults.filter(
    (it) => it.chainId === params.chainId,
  );
  return vaults.map((it) => ({
    chainId: it.chainId,
    vault: it.vault,
    expiryDateTimes: [1, 2, 3, 5, 8, 12, 20, 32].map(
      (it) => next8h(undefined, it + 1) / 1000,
    ),
    apyList: [0, 15, 25, 50, 75, 100],
    payoutMultiples: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  }));
}

async function mockDIYRecommendedList(params: ProductsDIYRecommendRequest) {
  const origin = params.vaults
    .split(',')
    .map((it) => it.trim())
    .flatMap((vault) => {
      const vaultInfo = ProductsService.findVault(ContractsService.vaults, {
        vault,
        chainId: params.chainId,
      });
      if (!vaultInfo) return undefined;
      if (params.expiryDateTime) {
        return [...Array(2)].map(() => mockProductQuote(vaultInfo, params));
      } else {
        const result: OriginProductQuoteResult[] = [];
        for (const expiryDateTime of [
          next8h(undefined, 7) / 1000,
          next8h(undefined, 7) / 1000,
          next8h(undefined, 7) / 1000,
          next8h(undefined, 7) / 1000,
          next8h(undefined, 7) / 1000,
          next8h(undefined, 7) / 1000,
          next8h(undefined, 7) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
          next8h(undefined, 18) / 1000,
        ]) {
          result.push(
            mockProductQuote(vaultInfo, {
              ...params,
              expiryDateTime,
            }),
          );
        }
        return result;
      }
    })
    .filter(Boolean);
  if (!origin.length) {
    return [];
  }
  return ProductsService.dealOriginQuotes(origin as OriginProductQuoteResult[]);
}

function mockProductQuote(
  vaultInfo: PartialRequired<VaultInfo, 'forCcy' | 'riskType'>,
  params: ProductsDIYRecommendRequest,
): OriginProductQuoteResult {
  const prices: PartialRecord<CCY, number> = {
    RCH: 0.3,
    WBTC: 95000,
  };
  const vault = ProductsService.findVault(ContractsService.vaults, vaultInfo)!;
  const origin: OriginProductQuoteResult = {
    chainId: vault.chainId,
    depositAmount: 100,
    rfqId: '',
    vault: vault.vault, // 合约地址
    expiry: params.expiryDateTime || next8h(undefined, 18) / 1000, // 到期日对应的秒级时间戳，例如 1672387200
    timestamp: (Date.now() + 3 * 60 * 60 * 1000) / 1000, // 目前定价对应的触发时间；下一个观察开始时间基于此逻辑计算
    observationStart: (Date.now() + 3 * 60 * 60 * 1000) / 1000, // 目前产品根据timestamp预估的开始观察敲入敲出时间
    minStepSize: 0.001,
    quote: {
      quoteId: '',
      anchorPrices: ['20000000000', '30000000000'], // 20000000000,30000000000
      makerCollateral: '10000000', // Maker对赌抵押的金额
      totalCollateral: '1010000000', // 总的质押的金额（Taker+Maker）
      collateralAtRisk: '300000', // 保底时必填（可空）
      deadline: (Date.now() + 100000000) / 1000, // 过期时间秒级时间戳 例如 1672387200
      makerWallet: nanoid(), // maker的wallet（可空）
      signature: 'string', // 签名（可空）
    },
    amounts: {
      counterparty: Math.random() * 10, // 对手方出的钱
      own: 100, // 自己出的钱, 对应 deposit amount
      premium: Math.random() * 10, // deposit amount 中用来对赌的钱
      forRchAirdrop: Math.random() * 10, // 用于计算 rch 空投的金额
      rchAirdrop: Math.random() * 10, // rch 空投数量
      totalInterest: Math.random() * 10, // totalCollateral 产生的总利息，非 Earn 合约为 0
      minRedeemable: Math.random() * 10, // 对赌输了的情况能赎回的钱，包含本金
      maxRedeemable: Math.random() * 10, // 对赌全赢的情况能赎回的钱，包含本金
      maxRedeemableOfLinkedCcy: Math.random() * 10,
      redeemable: Math.random() * 10, // 能赎回的钱，包含本金，如果未到期表示为根据当前的价格情况预估能赎回的钱，pending 状态下不存在这个值
      tradingFee: Math.random() * 10, // 付出给合约的交易手续费，做市商为不付交易手续费
      settlementFee: Math.random() * 10, // 赎回时付出给合约的结算手续费，做市商为不付结算手续费
      maxSettlementFee: Math.random() * 10, // 全赢赎回时付出给合约的结算手续费，做市商为不付结算手续费
      borrow: Math.random() * 10, // 借款金额，只有杠杆合约有：(depositAmount - borrowCost) * (vault.leverage - 1)，其它合约为 0
      borrowCost: Math.random() * 10, // 借款成本，只有杠杆合约有，其它合约为 0
      spreadCost: Math.random() * 10,
      minRedeemableOfLinkedCcy: 0,
      tradingFeeOfLinkedCcy: 0,
      settlementFeeOfLinkedCcy: 0,
      maxSettlementFeeOfLinkedCcy: 0,
    },
    feeRate: { trading: Math.random() * 10, settlement: Math.random() * 10 },
    leverageInfo: {
      borrowApr: Math.random() * 10,
      spreadApr: Math.random() * 10,
      leverage: Math.random() * 10,
    },
    apyInfo: {
      // Earn 产品
      outputApyDefinition: ApyDefinition.AaveLendingAPY, // 代码内部是Enum::ApyDefinition
      interest: Math.random() * 10, // 利息年化
      rch: Math.random() * 10, // RCH 收到数量对应的年化
      min: 0.02, // 对赌输了的情况对应的年化
      max: Math.random() * 10, // 对赌全赢的情况对应的年化
    },
    oddsInfo: {
      // Surge 产品
      rch: Math.random() * 10, // RCH 收到数量对应的赔率
      min: 0, // 对赌输了的情况对应的赔率
      max: Math.random() * 10, // 对赌全赢的情况对应的赔率
    },
    relevantDollarPrices: Object.entries(prices).map((e) => ({
      ccy: e[0],
      price: e[1],
    })), // 计算 RCH 年化时的币种价格
  };
  return origin;
}

if (!window.mockData) window.mockData = {};

window.mockData.diyConfig = mockDIYConfig;
window.mockData.diyRecommendedList = mockDIYRecommendedList;
