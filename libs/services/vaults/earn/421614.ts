import { ProductType, RiskType } from '../../base-type';

const USDTVaultsForAutomator = [
  // LeverageBearSpreadVault(ETH/USDT)
  {
    chainId: 421614,
    vault: '0xEAf1edC1d1B03DDfB14BB65FD2182038DB62eb58',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDC',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // LeverageBullSpreadVault(ETH/USDT)
  {
    chainId: 421614,
    vault: '0xB03d10D5Bf8b02D9CEea941AD1180A8368170627',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDC',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // AAVESmartBullVault(WBTC/USDT)
  {
    chainId: 421614,
    vault: '0xb26b8bCc4F3bDe0AB9F3fCD450E5c0882304C6e6',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDC',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // AAVESmartBearVault(WBTC/USDT)
  {
    chainId: 421614,
    vault: '0x7CDaB9df72ACa3ACb2c08f59213089BeB0f050e7',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDC',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
];

const Vaults = [...USDTVaultsForAutomator];

export default Vaults;
