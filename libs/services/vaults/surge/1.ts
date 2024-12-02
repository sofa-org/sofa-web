import { ProductType, RiskType } from '../../base-type';

const USDTVaults = [
  // SmartBullVault(USDT)
  {
    chainId: 1,
    vault: '0x106825b71ccE77a70B69f57A0ACf9C4a6acf292a',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBullVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x5494855B98858Ea4eF54D13E1d003197A387CE34',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(USDT)
  {
    chainId: 1,
    vault: '0x9C5D3C3AbD633b8eA68C5a51325f8630DC620AD9',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x2F1C60bA96ec6925fA9bBbFC9Eb7908bD35Bc224',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // DNTVault(USDT)
  {
    chainId: 1,
    vault: '0x3a253838121b9ad9736fAFc030Cf4971615D68b2',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
  // DNTVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0xD9cFF1bc89f705EaB2579fA2DC86E9a6F971370a',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
];

const RCHVaults = [
  {
    chainId: 1,
    vault: '0xBEFB3aAD1dfb1660444f0D76A91261EF755B2B86',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
    tradeDisable: true,
  },
  // DNTVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0xBFD58c8150cF7048D5C149fA2bAdDD194b8416fe',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
    tradeDisable: true,
  },
  // SmartBullVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0xfA49f859a012e8b1795A81B23b21Db0bD40e7770',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
  // SmartBullVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0x94Fe821E8Adde08aB97530D432Ff34A724FD7830',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
  // SmartBearVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0x4a5B4049a4aFae31278d36768704872f73dA67D1',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
  // SmartBearVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0x08c57aE48a89b6876A76dC618972Ef1602da7ED8',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
];

const vaults = [...USDTVaults, ...RCHVaults];

export default vaults;
