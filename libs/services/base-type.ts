import { ethers } from 'ethers';

export enum ProjectType {
  Earn = 'Earn',
  Surge = 'Surge',
  Automator = 'Automator',
}

export enum ProductType {
  DNT = 'DNT',
  // DOT = 'DOT',
  BullSpread = 'BullSpread',
  BearSpread = 'BearSpread',
}

export enum RiskType {
  PROTECTED = 'PROTECTED',
  LEVERAGE = 'LEVERAGE',
  RISKY = 'RISKY',
}

export enum TransactionStatus {
  PENDING = 0,
  SUCCESS,
  FAILED,
}

export enum InterestType {
  AAVE = 'Aave', // rebase 数量增加
  LIDO = 'Lido', // rebase，数量增加
  SOFA = 'Sofa', // ZRCH 是净值增加，但是 stRCH 是 rebase 数量增加的
  CURVE = 'Curve', // 净值增加
  AriesMarkets = 'AriesMarkets', // 净值增加
}

export const InterestTypeRefs = {
  [InterestType.AAVE]: { isRebaseInAutomator: true },
  [InterestType.LIDO]: { isRebaseInAutomator: true },
  [InterestType.SOFA]: { isRebaseInAutomator: false },
  [InterestType.CURVE]: { isRebaseInAutomator: false },
  [InterestType.AriesMarkets]: { isRebaseInAutomator: false },
};

export enum AutomatorTransactionStatus {
  PENDING = 'PENDING',
  CLAIMABLE = 'CLAIMABLE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface VaultInfo {
  vault: string; // 合约地址
  chainId: number;
  productType: ProductType;
  riskType: RiskType; // 风险类型：PROTECTED, LEVERAGE, RISKY
  forCcy: Exclude<CCY, 'RCH' | 'stETH'>; // 标的物币种
  domCcy: USDS; // 标的物币种的币对
  trackingSource: string; // 追踪指数源
  depositCcy: CCY | USDS; // 申购币种
  depositBaseCcy?: CCY | USDS; // 申购币种销毁时能得到的币种，比如 scrvUSD 销毁得到 crvUSD，sUSDa 销毁得到 USDa
  depositMinAmount: number; // 申购币种数量的最小数量
  depositTickAmount: number; // 申购币种数量的步增
  anchorPricesDecimal: number; // 转换为合约入参的倍数
  collateralDecimal: number; // 转换为合约入参的倍数
  observationStyle?: 'Continuous'; // Continuous 连续敲出 属于合约的属性
  rchMultiplier?: number; // rch 空投乘数，没用了
  tradeDisable: boolean | undefined; // 是否不允许交易，但是允许查看头寸，交易记录，允许 claim
  onlyForAutomator: boolean | undefined; // 只允许作为主理人为 automator 交易
  usePermit2: boolean; // 合约是否使用了 permit2 签名
  balanceDecimal: number; // 头寸余额的精度
  interestType: InterestType | undefined; // 生息方式，只有 PROTECTED 产品有
  abis: ethers.InterfaceAbi;
  earlyClaimable: boolean | undefined;
}

export interface AutomatorVaultInfo {
  name: string;
  desc?: string;
  vault: string; // 合约地址
  chainId: number;
  depositCcy: CCY | USDS; // 申购币种
  vaultDepositCcy: CCY | USDS; // 申购币种存入 automator 时被转化成的币种（也是 trend/dnt 合约的 depositCcy），比如 USDT -> aUSDT, crvUSD -> scrvUSD
  depositMinAmount: number; // 申购币种数量的最小数量
  depositTickAmount: number; // 申购币种数量的步增
  collateralDecimal: number; // 转换为合约入参的倍数
  positionCcy: string; // 头寸余额的 ERC20 币种名称
  redeemWaitPeriod: number; // 赎回等待期
  claimPeriod: number; // 赎回有效期
  abis: ethers.InterfaceAbi;
  creator: string;
  creatorFeeRate: number | string; // 默认为 0
  createTime: number | string; // 创建时间, ms
  interestType?: InterestType; // 生息方式，一期的没有
  riskExposure?: string | number; // 最多亏损多少比例的本金
}

export interface AutomatorFactory {
  chainId: number; // 链代码
  chainName: string; // 链名称
  factoryAddress: string; // Factory地址
  vaultDepositCcy: string; // USDC
  clientDepositCcy: string; // 用户存入的标的物
  vaultDepositCcyAddress: string; // 地址
  clientDepositCcyAddress: string; // 地址
}
