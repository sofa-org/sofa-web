import { ProductType, RiskType } from '../../base-type';

const USDTVaults = [
  // SmartBullVault(USDT)
  {
    chainId: 11155111,
    vault: '0x1ab54cf5f34dACf0E400bc869227110f414f33d9',
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
    chainId: 11155111,
    vault: '0xeaaF9D9F9652DA902Bc60E34F8eBAf9e1Ebad256',
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
    chainId: 11155111,
    vault: '0xB62B938f7c9D8Fa77d559266c8b80030914f064E',
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
    chainId: 11155111,
    vault: '0xdD5134e867c59eE0ec7991F4207a94769997565E',
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
    chainId: 11155111,
    vault: '0x120552f76FD961927848b11707f64905fD24fa2C',
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
    chainId: 11155111,
    vault: '0xD7098dbD25cA5a153160825eA555512Ce4207f9E',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
];

const Vaults = [...USDTVaults];

export default Vaults;
