import { ProductType, RiskType } from '../../base-type';

const vaults = [
  // AAVESmartBullVault(ETH/USDT)
  {
    chainId: 56,
    vault: '0x89c82D1B7616B0a465311FF077db6Bc21d43eA22',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // AAVESmartBullVault(WBTC/USDT)
  {
    chainId: 56,
    vault: '0x842E97BaA96cFE1534F1A50Da112C7800134656A',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // AAVESmartBearVault(ETH/USDT)
  {
    chainId: 56,
    vault: '0x5DcEFCa5207c58dCbcf41eF017D1D0EB42d83701',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // AAVESmartBearVault(WBTC/USDT)
  {
    chainId: 56,
    vault: '0x4573382A9d101EB6DFa1C4B448f939c41fF3e81d',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // LeverageBullSpreadVault(USDT)
  {
    chainId: 56,
    vault: '0x40144BC227f78A288FE9Ae6F4C7389C92C5aD9CF',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // LeverageBullSpreadVault(USDT/WBTC)
  {
    chainId: 56,
    vault: '0x41Df07a5E58D551164fCAEaD4c1ee67B77a84776',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // LeverageBearSpreadVault(USDT)
  {
    chainId: 56,
    vault: '0xD0fb7977df47d7Fe946A21679DAbCe877f7A3a05',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // LeverageBearSpreadVault(USDT/WBTC)
  {
    chainId: 56,
    vault: '0xab08fF5dd91636fE556f692825Cadd7bA04A4c97',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
];

export default vaults;
