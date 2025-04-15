import { ProductType, RiskType } from '../../base-type';

const SUSDaVaults = [
  // SUSDaBullTrendVault(ETH/sUSDa)
  {
    chainId: 1329,
    vault: '0x842E97BaA96cFE1534F1A50Da112C7800134656A',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'sUSDa',
    depositBaseCcy: 'USDa',
    usePermit2: false,
  },
  // SUSDaBearTrendVault(ETH/sUSDa)
  {
    chainId: 1329,
    vault: '0x46706780749bC41E7Ab99D13BC1B2a74Df40A7DA',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'sUSDa',
    depositBaseCcy: 'USDa',
    usePermit2: false,
  },
  // SUSDaBullTrendVault(BTC/sUSDa)
  {
    chainId: 1329,
    vault: '0x5DcEFCa5207c58dCbcf41eF017D1D0EB42d83701',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'sUSDa',
    depositBaseCcy: 'USDa',
    usePermit2: false,
  },
  // SUSDaBearTrendVault(BTC/sUSDa)
  {
    chainId: 1329,
    vault: '0x4573382A9d101EB6DFa1C4B448f939c41fF3e81d',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'sUSDa',
    depositBaseCcy: 'USDa',
    usePermit2: false,
  },
  // SmartBullAAVEVault(ETH/USDC)
  {
    chainId: 1329,
    vault: '0x64bb275066E7275FB0803c3e617Ae3ab2A882fF3',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDC',
    depositCcy: 'USDC',
    usePermit2: false,
  },
  // SmartBearAAVEVault(ETH/USDC)
  {
    chainId: 1329,
    vault: '0x634B69cC4168Cfc1c366078FDeB874AfFBb478b5',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDC',
    depositCcy: 'USDC',
    usePermit2: false,
  },
  // SmartBullAAVEVault(BTC/USDC)
  {
    chainId: 1329,
    vault: '0x088dBBeEC1489c557f8D4fD6146E0590E303d7d9',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDC',
    depositCcy: 'USDC',
    usePermit2: false,
  },
  // SmartBearAAVEVault(BTC/USDC)
  {
    chainId: 1329,
    vault: '0xFFf0d064B1cbf5D4C97D0af56a73a4C7e31DFb0D',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDC',
    depositCcy: 'USDC',
    usePermit2: false,
  },
];

const Vaults = [...SUSDaVaults];

export default Vaults;
