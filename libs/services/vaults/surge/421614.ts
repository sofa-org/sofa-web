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
    depositCcy: 'aArbSepUSDC',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(ETH/aArbSepUSDC)
  {
    chainId: 421614,
    vault: '0x57FEfCc7f8323C83923765E3551cfe14879bA2AF',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aArbSepUSDC',
    rchMultiplier: 1,
    usePermit2: true,
  },
];

const Vaults = [...VaultsForAutomator];

export default Vaults;
