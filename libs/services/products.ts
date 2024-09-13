import { getPrecision } from '@sofa/utils/amount';
import { applyMock, asyncCache } from '@sofa/utils/decorators';
import { next8h } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import Big from 'big.js';
import { pick, uniq } from 'lodash-es';

import {
  ContractsService,
  ProductType,
  RiskType,
  VaultInfo,
} from './contracts';
import { WalletService } from './wallet';

export { ProductType };
export { RiskType };
export type { VaultInfo };

export enum ApyDefinition {
  OptimusDefaultAPY = 'OptimusDefaultAPY',
  BinanceDntAPY = 'BinanceDntAPY',
  AaveLendingAPR = 'AaveLendingAPR',
  AaveLendingAPY = 'AaveLendingAPY',
}

export interface OriginProductQuoteParams {
  vault: string; // 合约信息
  chainId: number; // int 链 ID
  expiry: number; // 到期日对应的秒级时间戳，例如 1672387200
  lowerBarrier: string | number; // 下方价格
  upperBarrier: string | number; // 上方价格
  lowerStrike: string | number; // 下方价格
  upperStrike: string | number; // 上方价格
  depositAmount: string | number; // rfq申购金额
  inputApyDefinition: string; // 底层代码是Enum 表明入参的APY具体是怎么计算的
  protectedApy?: string | number; // 保底年化（RISKY时为空）
  fundingApy?: string | number; // AAVE年化（RISKY时为空）
  // outputApyDefinition: ApyDefinition; // 底层代码是Enum 表明出参的APY具体是怎么计算的
  // rchReturnQuantity?: number; // RCH对应的收益数量(单位是RCH个数）
  // rchConversionPrice?: number; // RCH转换成depositCcy采用的价格 (RCH/depositCCY)
  takerWallet?: string; // 询价方钱包公共地址信息
}

export interface QuoteInfo {
  quoteId?: string | number;
  anchorPrices: string[]; // 20000000000,30000000000
  makerCollateral: string; // Maker对赌抵押的金额
  totalCollateral: string; // 总的质押的金额（Taker+Maker）
  collateralAtRisk?: string; // 保底时必填（可空）
  deadline: number; // 过期时间秒级时间戳 例如 1672387200
  makerWallet?: string; // maker的wallet（可空）
  signature?: string; // 签名（可空）
}

export interface CalculatedInfo {
  amounts: {
    counterparty: string | number; // 对手方出的钱
    own: string | number; // 自己出的钱, 对应 deposit amount
    premium: string | number; // deposit amount 中用来对赌的钱
    forRchAirdrop: string | number; // 用于计算 rch 空投的金额
    rchAirdrop: string | number; // rch 空投数量
    totalInterest: string | number; // totalCollateral 产生的总利息，非 Earn 合约为 0
    minRedeemable: string | number; // 对赌输了的情况能赎回的钱，包含本金
    maxRedeemable: string | number; // 对赌全赢的情况能赎回的钱，包含本金
    redeemable?: string | number; // 能赎回的钱，包含本金，如果未到期表示为根据当前的价格情况预估能赎回的钱，pending 状态下不存在这个值
    tradingFee: string | number; // 付出给合约的交易手续费，做市商为不付交易手续费
    settlementFee: string | number; // 赎回时付出给合约的结算手续费，做市商为不付结算手续费
    maxSettlementFee: string | number; // 全赢赎回时付出给合约的结算手续费，做市商为不付结算手续费
    borrow: string | number; // 借款金额，只有杠杆合约有：(depositAmount - borrowCost) * (vault.leverage - 1)，其它合约为 0
    borrowCost: string | number; // 借款成本，只有杠杆合约有，其它合约为 0
    spreadCost: string | number; // 借款成本中合约扣留的部分，只有杠杆合约有，其它合约为 0
  };
  feeRate: { trading: string | number; settlement: string | number };
  leverageInfo: {
    borrowApr: string | number;
    spreadApr: string | number;
    leverage: string | number;
  };
  apyInfo?: {
    // Earn 产品
    outputApyDefinition: ApyDefinition; // 代码内部是Enum::ApyDefinition
    interest: string | number; // 利息年化
    rch: string | number; // RCH 收到数量对应的年化
    min: string | number; // 对赌输了的情况对应的年化
    max: string | number; // 对赌全赢的情况对应的年化
  };
  oddsInfo?: {
    // Surge 产品
    rch: string | number; // RCH 收到数量对应的赔率
    min: string | number; // 对赌输了的情况对应的赔率
    max: string | number; // 对赌全赢的情况对应的赔率
  };
  relevantDollarPrices: { ccy: string; price: string | number }[]; // 计算 RCH 年化时的币种价格
}

export interface OriginProductQuoteResult extends CalculatedInfo {
  rfqId: string;
  vault: string; // 合约地址
  chainId: number;
  expiry: number; // 到期日对应的秒级时间戳，例如 1672387200
  depositAmount: string | number; // rfq申购金额
  timestamp: number; // 目前定价对应的触发时间；下一个观察开始时间基于此逻辑计算
  observationStart: number; // 目前产品根据 timestamp 预估的开始观察敲入敲出时间，需要持续观测的产品有这个
  quote: QuoteInfo & { quoteId: string | number };
}

export type ProductQuoteParams = Omit<
  OriginProductQuoteParams,
  'vault' | 'chainId' | 'inputApyDefinition' | 'lowerBarrier' | 'upperBarrier'
> & {
  id: string; // UI 交互层生成的，用于标识产品
  vault: VaultInfo;
  anchorPrices: (string | number)[];
};

export interface ProductInfo {
  vault: VaultInfo; // 合约信息
  anchorPrices: (string | number)[];
  expiry: number; // 到期日对应的秒级时间戳，例如 1672387200
  observationStart?: number; // 目前产品根据 timestamp 预估的开始观察敲入敲出时间，需要持续观测的产品有这个
}

export interface DealtQuoteInfo {
  anchorPrices: number[]; // 20000000000,30000000000
  makerCollateral: number; // Maker对赌抵押的金额
  totalCollateral: number; // 总的质押的金额（Taker+Maker）
  collateralAtRisk?: number; // 非 Surge 产品有，表示做市商与 taker 对赌的总金额
  makerWallet?: string; // maker的wallet（可空）
  signature?: string; // 签名（可空）
  deadline: number; // 过期时间秒级时间戳 例如 1672387200
}

export interface ProductQuoteResult
  extends ProductInfo,
    CalculatedInfo,
    Pick<OriginProductQuoteResult, 'rfqId' | 'quote' | 'timestamp'> {
  pricesForCalculation: Record<string, number | undefined>;
}

export class ProductsService {
  static ccyEqual(ccy1: CCY | USDS, ccy2: CCY | USDS) {
    return ccy1 === ccy2 || `W${ccy1}` === ccy2 || ccy1 === `W${ccy2}`;
  }

  static productKey(
    product?: Partial<ProductQuoteParams> & {
      protectedReturnApy?: number;
      amounts?: ProductQuoteResult['amounts'];
      apyInfo?: CalculatedInfo['apyInfo'];
    },
  ) {
    if (!product) return '';
    const vault = product.vault?.vault.toLowerCase();
    const prices = product.anchorPrices?.map(Number).join('-');
    const protectedApy =
      product.vault?.riskType === RiskType.LEVERAGE ||
      product.vault?.riskType === RiskType.RISKY
        ? 0
        : (() => {
            const v =
              product.protectedApy ??
              product.protectedReturnApy ??
              product.apyInfo?.min;
            return +(!v ? 0 : Number(v)).toFixed(3);
          })();
    const depositAmount = product.depositAmount || product.amounts?.own;
    return `${vault}-${product.vault?.chainId}-${product.expiry}-${prices}-${protectedApy}-${depositAmount}`;
  }

  private static dealOriginQuote(
    it: OriginProductQuoteResult,
  ): ProductQuoteResult {
    const vault = ContractsService.getVaultInfo(it.vault, it.chainId);
    return {
      ...it,
      vault,
      expiry: it.expiry,
      anchorPrices: it.quote.anchorPrices.map(
        (it) => +Big(it).div(vault.anchorPricesDecimal),
      ),
      observationStart: it.observationStart || next8h() / 1000,
      pricesForCalculation: it.relevantDollarPrices.reduce(
        (pre, it) => ({ ...pre, [it.ccy]: it.price }),
        {},
      ),
    };
  }

  static filterVaults(
    vaults: VaultInfo[],
    filters: Partial<VaultInfo>,
    alsoFindOldVault = false, // 是否把老的合约（不能交易但能看头寸）也查出来
  ) {
    return vaults.filter((it) => {
      if (!alsoFindOldVault && it.tradeDisable) return false;
      for (const $k in it) {
        const k = $k as keyof VaultInfo;
        if (
          isNullLike(filters[k]) ||
          [
            'vault',
            'abis',
            'borrowApr',
            'spreadApr',
            'leverage',
            'usePermit2',
            'balanceDecimal',
          ].includes(k)
        ) {
          continue;
        }
        if (k === 'riskType') {
          if (filters.riskType === RiskType.RISKY) {
            if (it.riskType !== RiskType.RISKY) return false;
          } else if (it.riskType === RiskType.RISKY) return false;
          continue;
        }
        if (k === 'vault') {
          if (it.vault.toLowerCase() === filters.vault!.toLowerCase()) continue;
          return false;
        }
        if (k.includes('forCcy')) {
          if (ProductsService.ccyEqual(it.forCcy, filters.forCcy!)) continue;
          return false;
        }
        if (it[k] !== filters[k]) return false;
      }
      return true;
    });
  }

  static findVault(
    vaults: VaultInfo[],
    filters: Partial<VaultInfo>,
    alsoFindOldVault = false,
  ) {
    return vaults.find((it) => {
      if (!alsoFindOldVault && it.tradeDisable) return false;
      for (const $k in it) {
        const k = $k as keyof VaultInfo;
        if (isNullLike(filters[k])) continue;
        if (k === 'vault') {
          if (it.vault.toLowerCase() === filters.vault!.toLowerCase()) continue;
          return false;
        }
        if (k.includes('forCcy')) {
          if (ProductsService.ccyEqual(it.forCcy, filters.forCcy!)) continue;
          return false;
        }
        if (it[k] !== filters[k]) return false;
      }
      return true;
    });
  }

  static async vaultLeverageInfo(vault: VaultInfo, timeMs?: number) {
    const provider = await WalletService.readonlyConnect(vault.chainId);
    return ContractsService.vaultLeverageInfo(
      provider,
      vault.vault,
      timeMs || Date.now(),
    );
  }

  @applyMock('listRecommended')
  static async listRecommended(
    type: ProductType,
    params: {
      chainId: number;
      vault: string; // 合约地址
    },
  ) {
    const urls: PartialRecord<ProductType, string> = {
      [ProductType.DNT]: '/rfq/dnt/recommended-list',
      [ProductType.BullSpread]: '/rfq/smart-trend/recommended-list',
      [ProductType.BearSpread]: '/rfq/smart-trend/recommended-list',
    };
    if (!urls[type]) return [];
    return http
      .get<unknown, HttpResponse<OriginProductQuoteResult[]>>(urls[type]!, {
        params: pick(params, ['chainId', 'vault']),
      })
      .then((res) => res.value.map(ProductsService.dealOriginQuote));
  }

  static TicketTypeOptions = [
    {
      ccy: 'USDT',
      value: 'USDT',
    },
    {
      ccy: 'RCH',
      value: 'RCH',
    },
    {
      ccy: 'BTC',
      value: 'WBTC',
    },
    {
      ccy: 'ETH',
      value: 'WETH',
    },
    {
      ccy: 'stETH',
      value: 'stETH',
    },
  ]
    .map((it) => {
      const per =
        ContractsService.vaults.find(
          (v) => v.riskType === RiskType.RISKY && v.depositCcy === it.value,
        )?.depositMinAmount || 0;
      return {
        ...it,
        per,
        precision: getPrecision(per),
      };
    })
    .filter((it) => it.per);

  @applyMock('productQuote')
  private static async $quote(
    type: ProductType,
    params: OriginProductQuoteParams,
  ) {
    const urls: PartialRecord<ProductType, string> = {
      [ProductType.DNT]: '/rfq/dnt/quote',
      [ProductType.BullSpread]: '/rfq/smart-trend/quote',
      [ProductType.BearSpread]: '/rfq/smart-trend/quote',
    };
    if (!urls[type]) return Promise.reject();
    return http.get<unknown, HttpResponse<OriginProductQuoteResult>>(
      urls[type]!,
      { params },
    );
  }

  @asyncCache({
    until: (_, createdAt) => !createdAt || Date.now() - createdAt >= 30000,
  })
  static async quote(type: ProductType, data: ProductQuoteParams) {
    if (data.vault.riskType === RiskType.LEVERAGE) delete data.fundingApy;
    return ProductsService.$quote(type, {
      ...pick(data, [
        'expiry',
        'depositAmount',
        'protectedApy',
        'fundingApy',
        'takerWallet',
      ]),
      vault: data.vault.vault,
      chainId: data.vault.chainId,
      inputApyDefinition: ApyDefinition.AaveLendingAPY,
      lowerBarrier: data.anchorPrices[0],
      upperBarrier: data.anchorPrices[1],
      lowerStrike: data.anchorPrices[0],
      upperStrike: data.anchorPrices[1],
    }).then((res) => ProductsService.dealOriginQuote(res.value));
  }

  static genProtectedApyList(apy: number | undefined, dev = false) {
    if (dev) {
      return [...Array(30)].map(
        (_, i) => +Big(-0.1).plus(+Big(i).times(0.005)),
      );
    }
    // 优先级：
    // 1. 保证用户 1% 的保底年化
    // 2. 至少让用户拿 3% 的年化去赌
    // 2. 保证用户 3% 的保底年化
    if (!apy) return [];
    const max = Math.max(Math.floor(apy * 100) - 3, 1);
    const min = Math.min(1, max);
    if (min === max) return [max / 100];
    const list = [];
    for (let i = min; i <= max; i += 1) {
      list.push(i / 100);
    }
    return list;
  }

  static async genExpiries(vault: VaultInfo) {
    return http
      .get<unknown, HttpResponse<{ timestamp: number; expiries: number[] }>>(
        '/rfq/expiry-list',
        { params: { chainId: vault.chainId, vault: vault.vault } },
      )
      .then((res) => res.value?.expiries.map((it) => it * 1000));
  }

  static async genStrikes(atm: number, forCcy?: VaultInfo['forCcy']) {
    return http
      .get<unknown, HttpResponse<{ strikes: string[] }>>('/rfq/strike-list', {
        params: { indexPrice: atm, forCcy },
      })
      .then((res) => uniq(res.value?.strikes.map(Number)));
  }

  static recommendedExpiries() {
    return [next8h(undefined, 4), next8h(undefined, 8), next8h(undefined, 15)];
  }

  static delRfq(rfqId: string) {
    if (!rfqId) return;
    return http.post<unknown, HttpResponse<unknown>>('/rfq/remove', { rfqId });
  }
}
