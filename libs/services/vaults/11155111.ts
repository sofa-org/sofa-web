import { ProductType, RiskType } from '../base-type';

const USDTVaults = [
  // SmartBullVault(USDT)
  {
    chainId: 11155111,
    vault: '0x1ab54cf5f34dACf0E400bc869227110f414f33d9',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBullVault(WBTC/USDT)
  {
    chainId: 11155111,
    vault: '0xeaaF9D9F9652DA902Bc60E34F8eBAf9e1Ebad256',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(USDT)
  {
    chainId: 11155111,
    vault: '0xB62B938f7c9D8Fa77d559266c8b80030914f064E',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(WBTC/USDT)
  {
    chainId: 11155111,
    vault: '0xdD5134e867c59eE0ec7991F4207a94769997565E',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBullPrincipalVault(USDT)
  {
    chainId: 11155111,
    vault: '0x984c99067d56Dc69091fD6A555c55b527350F90E',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: true,
  },
  // SmartBullPrincipalVault(WBTC/USDT)
  {
    chainId: 11155111,
    vault: '0xc8b7474B7B40EBe07317D4e3d5C88fAfB4a02653',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: true,
  },
  // SmartBearPrincipalVault(USDT)
  {
    chainId: 11155111,
    vault: '0x1d7947e1e3E89C53C05B14fAEEB328300c3Ca624',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: true,
  },
  // SmartBearPrincipalVault(WBTC/USDT)
  {
    chainId: 11155111,
    vault: '0x9077a9C3184Cd49Ffeb0037e15f91298e4B87627',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: true,
  },
  // DNTVault(USDT)
  {
    chainId: 11155111,
    vault: '0x120552f76FD961927848b11707f64905fD24fa2C',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // DNTVault(WBTC/USDT)
  {
    chainId: 11155111,
    vault: '0xD7098dbD25cA5a153160825eA555512Ce4207f9E',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // PrincipalDNTVault(USDT) deprecated
  {
    chainId: 11155111,
    vault: '0xAD311daf1c3399418cCeaC6345720F8dA2b12A86',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: true,
    earlyClaimable: true,
    tradeDisable: true,
  },
  // PrincipalDNTVault(USDT)
  {
    chainId: 11155111,
    vault: '0x61811013bDd2f35512f6AaEcF0fAd769b4251450',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: false,
  },
  // PrincipalDNTVault(WBTC/USDT)
  {
    chainId: 11155111,
    vault: '0x42C633A64aDE67eB883dE9b8B1815851CAed8577',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: true,
    earlyClaimable: true,
  },
  // LeverageDNTVault(USDT)
  {
    chainId: 11155111,
    vault: '0x246cEfc26B2e7cab5845d79E6761b1Df70332003',
    productType: ProductType.DNT,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: false,
  },
  // LeverageBullTrendVault(USDT)
  {
    chainId: 11155111,
    vault: '0xB3b26dEF534FF564a03A1f5689eb1Cc75C1D0Bde',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 50,
    usePermit2: false,
  },
];

const USDTVaultsForAutomator = [
  // LeverageBearSpreadVault(ETH/USDT)
  {
    chainId: 11155111,
    vault: '0x86BadD9C434F06B420c1c6807e80061bd44fB7BC',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // LeverageBullSpreadVault(ETH/USDT)
  {
    chainId: 11155111,
    vault: '0x15C13a4fEFB3D24Ceffe0f70A99EC3E40dC1F644',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // AAVESmartBullVault(ETH/USDT)
  {
    chainId: 11155111,
    vault: '0x35c50461B3E3f56E62bCF11C25FF37F31A766F8B',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // AAVESmartBearVault(ETH/USDT)
  {
    chainId: 11155111,
    vault: '0xf3d532f1D36BD63F9aA44822A8de85F6399ca141',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
];

const RCHVaults = [
  // RCHDNTVault(ETH/USDT)
  {
    chainId: 11155111,
    vault: '0x813E8398E16A87622608669513A32B3CA8E09632',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 50,
    usePermit2: false,
  },
  // RCHBullTrendVault(ETH/USDT)
  {
    chainId: 11155111,
    vault: '0xA6A6A5eE909D9dFF2f6Ee0d7a1416A4FFDf4f4e6',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 50,
    usePermit2: false,
  },
  // RCHBearTrendVault(ETH/USDT)
  {
    chainId: 11155111,
    vault: '0xC24aE9C2a94F569FA3E6D33EF1B2193728387A73',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 50,
    usePermit2: false,
  },
];

const AutomatorVaults = [
  {
    chainId: 11155111,
    vault: '0x8d922b143933FD6D4f6f82ae2Acea6D78b6a23a9',
    productType: ProductType.Automator,
    riskType: RiskType.Null,
    forCcy: '',
    domCcy: '',
    depositCcy: 'USDT',
    rchMultiplier: 0,
    usePermit2: true,
  },
];

const Vaults = [
  ...USDTVaults,
  ...RCHVaults,
  ...AutomatorVaults,
  ...USDTVaultsForAutomator,
];

export default Vaults;
