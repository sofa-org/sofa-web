import { ProductType, RiskType } from '../../base-type';

const USDTVaults = [
  // SmartBullVault(USDT)
  {
    chainId: 42161,
    vault: '0x00aEca021D0f06c7dee54D58ee6Af47B5645aB19',
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
    chainId: 42161,
    vault: '0x989897f1D976EE0b59Bf0A3172C170D8f3Cb84e3',
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
    chainId: 42161,
    vault: '0x6E72C8726c71a4Cbc6e31ff7d47B399Fa983C7B8',
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
    chainId: 42161,
    vault: '0x106825b71ccE77a70B69f57A0ACf9C4a6acf292a',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  {
    chainId: 42161,
    vault: '0x7ECd1b5255543F4C2D7D8E475afCd01699dBE2B0',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // DNTVault(WBTC/USDT)
  {
    chainId: 42161,
    vault: '0xdFEb3460771148799b2D4344c369e2b2d6C26c42',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
];

const vaults = [...USDTVaults];

export default vaults;
