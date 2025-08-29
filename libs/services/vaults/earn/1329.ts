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
    domCcy: 'USD',
    depositCcy: 'USDC',
    realDepositCcy: 'USDC.n',
    usePermit2: false,
  },
  // SmartBearAAVEVault(ETH/USDC)
  {
    chainId: 1329,
    vault: '0x634B69cC4168Cfc1c366078FDeB874AfFBb478b5',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDC',
    realDepositCcy: 'USDC.n',
    usePermit2: false,
  },
  // SmartBullAAVEVault(BTC/USDC)
  {
    chainId: 1329,
    vault: '0x088dBBeEC1489c557f8D4fD6146E0590E303d7d9',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDC',
    realDepositCcy: 'USDC.n',
    usePermit2: false,
  },
  // SmartBearAAVEVault(BTC/USDC)
  {
    chainId: 1329,
    vault: '0xFFf0d064B1cbf5D4C97D0af56a73a4C7e31DFb0D',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDC',
    realDepositCcy: 'USDC.n',
    usePermit2: false,
  },
  // SmartBullAAVEVault(ETH/NativeUSDC)
  {
    chainId: 1329,
    vault: '0x4f1B513F846821559d59e8324EaeF201Cb5B0479',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'NativeUSDC',
    realDepositCcy: 'USDC',
    usePermit2: false,
  },
  // SmartBearAAVEVault(ETH/NativeUSDC)
  {
    chainId: 1329,
    vault: '0x989897f1D976EE0b59Bf0A3172C170D8f3Cb84e3',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'NativeUSDC',
    realDepositCcy: 'USDC',
    usePermit2: false,
  },
  // SmartBullAAVEVault(BTC/NativeUSDC)
  {
    chainId: 1329,
    vault: '0x00aEca021D0f06c7dee54D58ee6Af47B5645aB19',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'NativeUSDC',
    realDepositCcy: 'USDC',
    usePermit2: false,
  },
  // SmartBearAAVEVault(BTC/NativeUSDC)
  {
    chainId: 1329,
    vault: '0x6E72C8726c71a4Cbc6e31ff7d47B399Fa983C7B8',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'NativeUSDC',
    realDepositCcy: 'USDC',
    usePermit2: false,
  },
];

const Vaults = [...SUSDaVaults];

export default Vaults;
