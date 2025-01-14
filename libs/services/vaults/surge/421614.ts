import { ProductType, RiskType } from '../../base-type';

const VaultsForAutomator = [
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
];

const Vaults = [...VaultsForAutomator];

export default Vaults;
