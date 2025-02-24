import { ProductType, RiskType } from '../../base-type';

const SUSDaVaults = [
  // SUSDaBullTrendVault(ETH/sUSDa)
  {
    chainId: 1329,
    vault: '0x842E97BaA96cFE1534F1A50Da112C7800134656A',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'ETH',
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
    forCcy: 'ETH',
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
];

const Vaults = [...SUSDaVaults];

export default Vaults;
