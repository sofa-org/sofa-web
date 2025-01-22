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

const VaultsForAutomator = [
  // RebaseSmartBullVault(ETH/aUSDT)
  {
    chainId: 42161,
    vault: '0x3d5489b9846cD3BC3e05D32d46C51d50fA37c049',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // RebaseSmartBullVault(BTC/aUSDT)
  {
    chainId: 42161,
    vault: '0x40e439cb71379eE5fF6b914313c11A792A385e93',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // RebaseSmartBearVault(ETH/aUSDT)
  {
    chainId: 42161,
    vault: '0x68C91Df6ecBa6c697217d747f04B72EEDc6af1e7',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // RebaseSmartBearVault(BTC/aUSDT)
  {
    chainId: 42161,
    vault: '0xC914Ba8F6393cC611BD1d207e317C68BE27943eB',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
].map((it) => ({ ...it, onlyForAutomator: true }));

const vaults = [...USDTVaults, ...VaultsForAutomator];

export default vaults;
