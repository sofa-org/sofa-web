import { ProductType, RiskType } from '../../base-type';

const USDTVaults = [
  //AAVESmartBullVault(ETH/USDT)
  {
    chainId: 137,
    vault: '0x4FD90c6B2a81d65a10E366dC5051D4D1A2A1c021',
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    rchMultiplier: 20,
    usePermit2: false,
  },
  //AAVESmartBullVault(WBTC/USDT)
  {
    chainId: 137,
    vault: '0x89c82D1B7616B0a465311FF077db6Bc21d43eA22',
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    rchMultiplier: 20,
    usePermit2: false,
  },
  //AAVESmartBearVault(ETH/USDT)
  {
    chainId: 137,
    vault: '0x842E97BaA96cFE1534F1A50Da112C7800134656A',
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    rchMultiplier: 20,
    usePermit2: false,
  },
  //AAVESmartBearVault(WBTC/USDT)
  {
    chainId: 137,
    vault: '0x46706780749bC41E7Ab99D13BC1B2a74Df40A7DA',
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    rchMultiplier: 20,
    usePermit2: false,
  },
  //LeverageBullSpreadVault(USDT)
  {
    chainId: 137,
    vault: '0x53b4b7312e543435f77f25648Fa9B269d0918bc5',
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    rchMultiplier: 20,
    usePermit2: false,
  },
  //LeverageBullSpreadVault(USDT/WBTC)
  {
    chainId: 137,
    vault: '0x40144BC227f78A288FE9Ae6F4C7389C92C5aD9CF',
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    rchMultiplier: 20,
    usePermit2: false,
  },
  //LeverageBearSpreadVault(USDT)
  {
    chainId: 137,
    vault: '0x41Df07a5E58D551164fCAEaD4c1ee67B77a84776',
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    rchMultiplier: 20,
    usePermit2: false,
  },
  //LeverageBearSpreadVault(USDT/WBTC)
  {
    chainId: 137,
    vault: '0xD0fb7977df47d7Fe946A21679DAbCe877f7A3a05',
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    rchMultiplier: 20,
    usePermit2: false,
  },
];

const vaults = [...USDTVaults];

export default vaults;
