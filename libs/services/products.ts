import { calc_apy, calc_yield } from '@sofa/alg';
import { cvtAmountsInUsd, getPrecision } from '@sofa/utils/amount';
import { applyMock, asyncCache } from '@sofa/utils/decorators';
import { next8h } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import { simplePlus } from '@sofa/utils/object';
import Big from 'big.js';
import { omit, pick, uniq, uniqBy } from 'lodash-es';

import {
  ContractsService,
  ProductType,
  RiskType,
  VaultInfo,
} from './contracts';
import { DualService } from './dual';
import { MarketService } from './market';
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

export interface WinningProbabilitiesParams {
  forCcy: string;
  expiry: number;
  anchorPrices: (string | number)[];
}

export interface WinningProbabilities {
  probDntStayInRange?: number; // DNT预估始终在区间的概率 报价不适用时为空
  probBullTrendItmLowerStrike?: number; // 到期比LowerStrike高的概率 报价不适用时为空
  probBullTrendItmUpperStrike?: number; // 到期比UpperStrike高的概率 报价不适用时为空
  probBearTrendItmLowerStrike?: number; // 到期比LowerStrike低的概率 报价不适用时为空
  probBearTrendItmUpperStrike?: number; // 到期比UpperStrike低的概率 报价不适用时为空
}

export interface WinningProbabilitiesResult {
  spotPrice: string | number;
  timestamp: number;
  probabilities: WinningProbabilities;
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
    minRedeemableOfLinkedCcy: string | number; // 如果没换币，能赎回的挂钩货币的金额，只有 Dual 产品有，其它产品为 0
    maxRedeemable: string | number; // 对赌全赢的情况能赎回的钱，包含本金
    maxRedeemableOfLinkedCcy: string | number; // 如果换币，能赎回的挂钩货币的金额，只有 Dual 产品有，其它产品为 0
    redeemable?: string | number; // 能赎回的钱，包含本金，如果未到期表示为根据当前的价格情况预估能赎回的钱，pending 状态下不存在这个值
    redeemableOfLinkedCcy?: string | number; // 能赎回的挂钩货币的金额，只有 Dual 产品有，其它产品为 0
    tradingFee: string | number; // 付出给合约的交易手续费，做市商为不付交易手续费
    tradingFeeOfLinkedCcy: string | number; // 挂钩货币的金额的交易手续费，只有 Dual 产品有，其它产品为 0
    settlementFee: string | number; // 赎回时付出给合约的结算手续费，做市商为不付结算手续费
    settlementFeeOfLinkedCcy: string | number; // 赎回时挂钩货币的金额的结算手续费，只有 Dual 产品有，其它产品为 0
    maxSettlementFee: string | number; // 全赢赎回时付出给合约的结算手续费，做市商为不付结算手续费
    maxSettlementFeeOfLinkedCcy: string | number; // 全换币时挂钩货币的金额的结算手续费，只有 Dual 产品有，其它产品为 0
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

export function isDualQuoteParams(params?: Partial<ProductQuoteParams>) {
  return params?.vault?.riskType === RiskType.DUAL;
}
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

  // 对于存入之后没有利息的 earn 的 vault（比如 sUSDa 的几个 Earn 合约）来讲，需要计算以底层价值币种来转换数据
  convertedCalculatedInfoByDepositBaseCcy?: CalculatedInfo;
}

export type PPSKey = `${CCY | USDS}-${CCY | USDS}`;
export type PPSValue = Record<number /* timestamp */ | 'now', number>;
export function genPPSKey(v: VaultInfo) {
  return `${v.depositCcy}-${v.depositBaseCcy}` as PPSKey;
}
export function extractFromPPSKey(key: PPSKey) {
  return {
    depositCcy: key.split('-')[0] as CCY | USDS,
    depositBaseCcy: key.split('-')[1] as CCY | USDS,
  };
}

export interface ProductsRecommendRequest {
  productType: ProductType;
  riskType: RiskType;
  chainId: number;
  vault: string; // 合约地址
}

export class ProductsService {
  static ccyEqual(ccy1: CCY | USDS, ccy2: CCY | USDS) {
    return ccy1 === ccy2 || `W${ccy1}` === ccy2 || ccy1 === `W${ccy2}`;
  }
  static readyForQuote(params: Partial<ProductQuoteParams>) {
    if (isDualQuoteParams(params)) {
      if (
        !params.depositAmount ||
        !params.expiry ||
        !params?.anchorPrices?.[0] ||
        !params.vault
      )
        return false;
      return true;
    }
    if (
      !params.depositAmount ||
      !params.expiry ||
      !params.anchorPrices?.length ||
      !params.vault
    )
      return false;
    return true;
  }
  static productKey(
    product?: PartialRequired<ProductQuoteParams, 'vault'> & {
      protectedReturnApy?: number;
      amounts?: ProductQuoteResult['amounts'];
      apyInfo?: CalculatedInfo['apyInfo'];
    },
  ) {
    if (!product) return '';
    if (isDualQuoteParams(product)) {
      const depositAmount = product.depositAmount || product.amounts?.own;
      const price = DualService.getPrice(product as ProductQuoteParams);
      return `${product.vault.vault.toLowerCase()}-${product.vault?.chainId}-${product.expiry}-${price}-${depositAmount}`;
    }
    const vault = product.vault?.vault?.toLowerCase();
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

  static async dealOriginQuotes(
    quotes: OriginProductQuoteResult[],
    fixProtectedApy?: string | number,
  ) {
    const list = quotes.map((it) => ({
      quote: it,
      vault: ContractsService.getVaultInfo(it.vault, it.chainId),
    }));
    const depositCcyList = uniq(
      list.map((it) => (it.vault.depositBaseCcy ? genPPSKey(it.vault) : false)),
    ).filter(Boolean) as PPSKey[];
    const expiryList = uniq(list.map((it) => it.quote.expiry * 1000));
    const [ppsMapAtNow, apyMap] = await Promise.all([
      Promise.all(
        depositCcyList.map((c) =>
          MarketService.getPPS({
            fromCcy: extractFromPPSKey(c).depositCcy,
            toCcy: extractFromPPSKey(c).depositBaseCcy,
            includeNow: true,
            timeList: expiryList,
          }).then((prices) => [c, prices] as const),
        ),
      ).then((res) => Object.fromEntries(res)),
      quotes.length
        ? MarketService.interestRate(quotes[0].chainId)
        : Promise.resolve({} as ReturnType<typeof MarketService.interestRate>),
    ]);
    const ppsMap = list.reduce((pre, it) => {
      const expiry = it.quote.expiry * 1000;
      if (!it.vault.depositBaseCcy) return pre;
      const apy = apyMap[it.vault.depositBaseCcy];
      if (isNullLike(apy))
        throw new Error(`Can not find apy of ${it.vault.depositBaseCcy}`);
      const key = genPPSKey(it.vault);
      if (!pre[key][expiry]) {
        pre[key][expiry] = simplePlus(
          pre[key]['now'],
          calc_yield(apy.apyUsed, pre[key]['now'], Date.now(), expiry),
        )!;
      }
      return pre;
    }, ppsMapAtNow);
    return list.map((it) =>
      ProductsService.$dealOriginQuote(it.quote, fixProtectedApy, ppsMap),
    );
  }

  static $dealOriginQuote(
    it: OriginProductQuoteResult,
    fixProtectedApy?: string | number,
    ppsMap?: Record<PPSKey, PPSValue>,
  ): ProductQuoteResult {
    const vault = ContractsService.getVaultInfo(it.vault, it.chainId);
    const convertedCalculatedInfoByDepositBaseCcy = vault.depositBaseCcy
      ? (() => {
          const key = genPPSKey(vault);
          if (!ppsMap?.[key]) return undefined;
          const pps = {
            atTrade: ppsMap[key]['now'],
            afterExpire: ppsMap[key][it.expiry * 1000],
          };
          if (!pps.atTrade || !pps.afterExpire) return undefined;
          return ProductsService.cvtCalculatedInfoToDepositBaseCcy(
            vault,
            it,
            Date.now(),
            it.expiry * 1000,
            pps,
          );
        })()
      : undefined;
    return {
      ...it,
      vault,
      expiry: it.expiry,
      anchorPrices: it.quote.anchorPrices.map(
        (it) => +Big(it).div(vault.anchorPricesDecimal),
      ),
      apyInfo: it.apyInfo && {
        ...it.apyInfo,
        min: fixProtectedApy ?? it.apyInfo.min,
      },
      observationStart: it.observationStart || next8h() / 1000,
      pricesForCalculation: it.relevantDollarPrices.reduce(
        (pre, it) => ({ ...pre, [it.ccy]: it.price }),
        {},
      ),
      convertedCalculatedInfoByDepositBaseCcy,
    };
  }

  static matchVault(vault: VaultInfo, filters: Partial<VaultInfo>) {
    for (const $k in vault) {
      const k = $k as keyof VaultInfo;
      if (isNullLike(filters[k])) continue;
      if (k === 'vault') {
        if (vault.vault?.toLowerCase() === filters.vault?.toLowerCase())
          continue;
        return false;
      }
      if (k.includes('forCcy')) {
        if (ProductsService.ccyEqual(vault.forCcy, filters.forCcy!)) continue;
        return false;
      }
      if (k === 'onlyForAutomator') {
        if (!!vault[k] === !!filters[k]) continue;
        else return false;
      }
      if (vault[k] !== filters[k]) return false;
    }
    return true;
  }

  static filterVaults(
    vaults: VaultInfo[],
    filters: Partial<VaultInfo>,
    alsoFindOldVault = false, // 是否把老的合约（不能交易但能看头寸）也查出来
    strictRiskType = false,
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
        if (k === 'riskType' && !strictRiskType) {
          if (filters.riskType === RiskType.DUAL) {
            if (it.riskType !== RiskType.DUAL) return false;
          } else if (it.riskType === RiskType.DUAL) return false;
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
        if (k === 'onlyForAutomator') {
          if (!!it[k] === !!filters[k]) continue;
          else return false;
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
      return ProductsService.matchVault(it, filters);
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
  static async listRecommended(req: ProductsRecommendRequest) {
    let url: string;
    if (req.riskType === RiskType.DUAL) {
      url = '/rfq/dual/recommended-list';
    } else {
      const urls: Record<ProductType, string> = {
        [ProductType.DNT]: '/rfq/dnt/recommended-list',
        [ProductType.BullSpread]: '/rfq/smart-trend/recommended-list',
        [ProductType.BearSpread]: '/rfq/smart-trend/recommended-list',
      };
      if (!urls[req.productType]) return [];
      url = urls[req.productType];
    }
    return http
      .get<unknown, HttpResponse<OriginProductQuoteResult[]>>(url, {
        params: pick(req, ['chainId', 'vault']),
      })
      .then((res) => ProductsService.dealOriginQuotes(res.value));
  }

  static TicketTypeOptions = uniqBy(
    ContractsService.vaults.filter(
      (v) => v.riskType === RiskType.RISKY && !v.onlyForAutomator,
    ),
    (it) => it.depositCcy,
  ).map((it) => ({
    ccy: it.depositCcy,
    value: it.depositCcy,
    per: it.depositMinAmount,
    precision: getPrecision(it.depositMinAmount),
  }));

  @applyMock('productQuote')
  private static async $quote(
    product: {
      productType: ProductType;
      riskType: RiskType;
      domCcy: VaultInfo['domCcy'];
    },
    params: OriginProductQuoteParams,
  ) {
    let url: string;
    if (product.riskType == RiskType.DUAL) {
      url = '/rfq/dual/quote';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (params as any).strike = DualService.getPrice({
        vault: product,
        anchorPrices: [params.lowerStrike],
      });
      params.lowerStrike = undefined!;
      params.upperStrike = undefined!;
      params.lowerBarrier = undefined!;
      params.upperBarrier = undefined!;
    } else {
      url = {
        [ProductType.DNT]: '/rfq/dnt/quote',
        [ProductType.BullSpread]: '/rfq/smart-trend/quote',
        [ProductType.BearSpread]: '/rfq/smart-trend/quote',
      }[product.productType];
    }
    if (!url) return Promise.reject();
    return http.get<unknown, HttpResponse<OriginProductQuoteResult>>(url, {
      params,
    });
  }

  @asyncCache({
    until: (_, createdAt) => !createdAt || Date.now() - createdAt >= 30000,
  })
  static async quote(data: ProductQuoteParams) {
    if (data.vault.riskType === RiskType.LEVERAGE) {
      delete data.fundingApy;
      delete data.protectedApy;
    }

    return ProductsService.$quote(
      pick(data.vault, ['productType', 'riskType', 'domCcy']),
      {
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
        upperBarrier: isDualQuoteParams(data)
          ? data.anchorPrices[0]
          : data.anchorPrices[1],
        lowerStrike: data.anchorPrices[0],
        upperStrike: isDualQuoteParams(data)
          ? data.anchorPrices[0]
          : data.anchorPrices[1],
      },
    )
      .then((res) =>
        ProductsService.dealOriginQuotes([res.value], data.protectedApy),
      )
      .then((res) => res[0]);
  }

  @asyncCache({
    until: (_, createdAt) => !createdAt || Date.now() - createdAt >= 30000,
    id: (name, [type, params]) => {
      const { forCcy, expiry, anchorPrices } =
        params as WinningProbabilitiesParams;
      return `${name}-${type}-${forCcy}-${expiry}-${anchorPrices.join(',')}`;
    },
  })
  static async winningProbabilities(
    type: ProductType,
    params: WinningProbabilitiesParams,
  ) {
    const urls: PartialRecord<ProductType, string> = {
      [ProductType.DNT]: '/rfq/dnt/winning-probabilities',
      [ProductType.BullSpread]: '/rfq/smart-trend/winning-probabilities',
      [ProductType.BearSpread]: '/rfq/smart-trend/winning-probabilities',
    };
    if (!urls[type]) return Promise.reject();
    return http
      .get<unknown, HttpResponse<WinningProbabilitiesResult>>(urls[type]!, {
        params: {
          ...omit(params, 'anchorPrices'),
          lowerBarrier: params.anchorPrices[0],
          upperBarrier: params.anchorPrices[1],
          lowerStrike: params.anchorPrices[0],
          upperStrike: params.anchorPrices[1],
        },
      })
      .then((res) => res.value);
  }

  static calcProbability(
    productType: ProductType,
    probabilities: WinningProbabilities,
  ) {
    if (productType === ProductType.DNT)
      return probabilities.probDntStayInRange;
    if (productType === ProductType.BullSpread)
      return probabilities.probBullTrendItmLowerStrike;
    return probabilities.probBearTrendItmUpperStrike;
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
    if (isNullLike(apy)) return [];
    if (!apy) return [-0.01];
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
      .get<
        unknown,
        HttpResponse<{ timestamp: number; expiries: number[] }>
      >('/rfq/expiry-list', { params: { chainId: vault.chainId, vault: vault.vault } })
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

  static cvtCalculatedInfoToDepositBaseCcy(
    vault: VaultInfo,
    data: CalculatedInfo,
    createdAt: number, // ms
    expiredAt: number, // ms
    pps: { atTrade: number; afterExpire: number }, // depositCcy 与 depositBaseCcy 的汇率
  ): CalculatedInfo {
    const total = +data.amounts.counterparty + +data.amounts.own;
    const amounts = {
      ...data.amounts,
      counterparty: +data.amounts.counterparty * pps.atTrade,
      own: +data.amounts.own * pps.atTrade,
      premium: +data.amounts.premium * pps.atTrade,
      forRchAirdrop: +data.amounts.forRchAirdrop * pps.atTrade,
      rchAirdrop: data.amounts.rchAirdrop,
      totalInterest:
        (total + +data.amounts.totalInterest) * pps.afterExpire -
        total * pps.atTrade,
      minRedeemable: +data.amounts.minRedeemable * pps.afterExpire,
      maxRedeemable: +data.amounts.maxRedeemable * pps.afterExpire,
      redeemable: Number(data.amounts.redeemable) * pps.afterExpire,
      tradingFee: +data.amounts.tradingFee * pps.afterExpire,
      settlementFee: +data.amounts.settlementFee * pps.afterExpire,
      maxSettlementFee: +data.amounts.maxSettlementFee * pps.afterExpire,
      borrow: +data.amounts.borrow * pps.afterExpire,
      borrowCost: +data.amounts.borrowCost * pps.afterExpire,
      spreadCost: +data.amounts.spreadCost * pps.afterExpire,
    };

    const prices = Object.fromEntries(
      data.relevantDollarPrices.map((it) => [it.ccy, it.price]),
    );

    const rchValueInUSD = cvtAmountsInUsd(
      [['RCH', amounts.rchAirdrop]],
      prices,
    );

    const oddsInfo = {
      rch: rchValueInUSD / amounts.own,
      min: amounts.minRedeemable / amounts.own,
      max: amounts.maxRedeemable / amounts.own,
    };

    const rchApy = calc_apy(rchValueInUSD, amounts.own, createdAt, expiredAt);
    const minApy = calc_apy(
      amounts.minRedeemable - amounts.own + rchValueInUSD,
      amounts.own,
      createdAt,
      expiredAt,
    );
    const maxApy = calc_apy(
      amounts.maxRedeemable - amounts.own + rchValueInUSD,
      amounts.own,
      createdAt,
      expiredAt,
    );
    const apyInfo = {
      // Earn 产品
      outputApyDefinition: ApyDefinition.AaveLendingAPY,
      interest: calc_apy(
        amounts.totalInterest,
        amounts.counterparty + amounts.own,
        createdAt,
        expiredAt,
      ),
      rch: rchApy,
      min: minApy,
      max: maxApy,
    };

    return {
      amounts,
      feeRate: data.feeRate,
      leverageInfo: data.leverageInfo,
      apyInfo,
      oddsInfo,
      relevantDollarPrices: data.relevantDollarPrices,
    };
  }
}
