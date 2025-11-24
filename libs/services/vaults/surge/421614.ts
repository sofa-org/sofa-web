import { ProductType, RiskType, TradeSide } from '../../base-type';

const VaultsForAutomator = [
  // RebaseSmartBullVault(BTC/aUSDC)
  {
    chainId: 421614,
    vault: '0xd529aE3867aa4d375DB7C67183d1FAf739eCb201',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
  // RebaseSmartBearVault(ETH/aUSDC)
  {
    chainId: 421614,
    vault: '0xA3CDCdCCa1e776207ba774fF1c67360244bd1452',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
  // SmartBullVault(BTC/aArbSepUSDC)
  {
    chainId: 421614,
    vault: '0x865daF1A40194d96a60a7cAD197375219AC8d91A',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
  // SmartBearVault(ETH/aArbSepUSDC)
  {
    chainId: 421614,
    vault: '0x57FEfCc7f8323C83923765E3551cfe14879bA2AF',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
  // SmartBullVault(BTC/aArbSepUSDC)
  {
    chainId: 421614,
    vault: '0x4a7Da148a07781D191a273d69249c6D869e0689B',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(ETH/aArbSepUSDC)
  {
    chainId: 421614,
    vault: '0xd6a1D643a5E30c98fcd82C3588F6283c42442055',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SellSmartBullVault(BTC/aArbSepUSDC)
  {
    chainId: 421614,
    vault: '0xc778287a0e8955AF27600Be6abaf299Ad1dAbEc6',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: false,
    tradeSide: TradeSide.SELL,
  },
  // SellSmartBearVault(ETH/aArbSepUSDC)
  {
    chainId: 421614,
    vault: '0x63D433F183E9d60d01DF6EDE93C1c1376cfA1CaE',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    rchMultiplier: 1,
    usePermit2: false,
    tradeSide: TradeSide.SELL,
  },
].map((it) => ({ ...it, onlyForAutomator: true }));

const Vaults = [...VaultsForAutomator];

export default Vaults;
