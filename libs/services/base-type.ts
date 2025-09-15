import { ethers } from 'ethers';

export enum ProjectType {
  Earn = 'Earn',
  Surge = 'Surge',
  Automator = 'Automator',
  Dual = 'Dual', // 双币交易
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
  DUAL = 'DUAL',
}

export type VisibleRiskType =
  | RiskType.PROTECTED
  | RiskType.LEVERAGE
  | RiskType.RISKY;

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
  CICADA = 'CICADA', // 净值增加
}

export const InterestTypeRefs = {
  [InterestType.AAVE]: { isRebaseInAutomator: true },
  [InterestType.LIDO]: { isRebaseInAutomator: true },
  [InterestType.SOFA]: { isRebaseInAutomator: false },
  [InterestType.CURVE]: { isRebaseInAutomator: false },
  [InterestType.AriesMarkets]: { isRebaseInAutomator: false },
  [InterestType.CICADA]: { isRebaseInAutomator: false },
};

export enum AutomatorTransactionStatus {
  PENDING = 'PENDING',
  CLAIMABLE = 'CLAIMABLE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface VaultInputInfo {
  chainId: number;
  productType: ProductType;
  riskType: RiskType; // 风险类型：PROTECTED, LEVERAGE, RISKY
  forCcy: Exclude<CCY, 'stETH'>; // 标的物币种
  domCcy: USDS; // 标的物币种的币对
  depositCcy: CCY | USDS; // 申购币种在服务端的名称，正常来讲就是 realDepositCcy，但 SEI 链的一些合约有些历史原因，导致 deposit ccy 和链上的名字不一样
  realDepositCcy: CCY | USDS; // 申购币种合约的 token name
  onlyForAutomator: boolean; // 只允许作为主理人为 automator 交易
}

export type VaultInputKey =
  | ''
  | `${VaultInputInfo['chainId']}-${VaultInputInfo['productType']}-${VaultInputInfo['riskType']}-${VaultInputInfo['forCcy']}-${VaultInputInfo['domCcy']}-${VaultInputInfo['realDepositCcy']}`;

export interface VaultInfo extends VaultInputInfo {
  vault: string; // 合约地址
  trackingSource: string; // 追踪指数源
  depositBaseCcy?: CCY | USDS; // 净值成长类的申购币种销毁时能得到的币种，比如 scrvUSD 销毁得到 crvUSD，sUSDa 销毁得到 USDa
  depositMinAmount: number; // 申购币种数量的最小数量
  depositTickAmount: number; // 申购币种数量的步增
  anchorPricesDecimal: number; // 转换为合约入参的倍数
  collateralDecimal: number; // 转换为合约入参的倍数
  observationStyle?: 'Continuous'; // Continuous 连续敲出 属于合约的属性
  rchMultiplier?: number; // rch 空投乘数，没用了
  tradeDisable: boolean | undefined; // 是否不允许交易，但是允许查看头寸，交易记录，允许 claim
  usePermit2: boolean; // 合约是否使用了 permit2 签名
  balanceDecimal: number; // 头寸余额的精度
  interestType: InterestType | undefined; // 生息方式，undefined 表示 vault 内部没有生息功能
  abis: ethers.InterfaceAbi;
  earlyClaimable: boolean | undefined;
  priority: number; // 用户相同的选择（VaultInputInfo）下，优先级越高，报价越优先

  tickPrice?: number; // 只有 DUAL 的position里会返回
}

export interface AutomatorVaultInfo {
  name: string;
  desc?: string;
  vault: string; // 合约地址
  chainId: number;
  depositCcy: CCY | USDS; // 申购币种在服务端的名称，正常来讲就是 realDepositCcy，但 SEI 链的一些合约有些历史原因，导致 deposit ccy 和链上的名字不一样
  realDepositCcy: CCY | USDS; // 申购币种合约的 token name
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
  redPacketContract?: string; // 发红包的合约
}

export interface AutomatorFactory {
  chainId: number; // 链代码
  chainName: string; // 链名称
  factoryAddress: string; // Factory地址
  vaultDepositCcy: string; // automator 投资的标的物
  clientDepositCcy: string; // 用户存入的标的物
  vaultDepositCcyAddress: string; // 地址
  clientDepositCcyAddress: string; // 地址
}
