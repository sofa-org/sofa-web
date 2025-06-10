import { ProductType, RiskType } from '../../base-type';

const vaults = [
  // RebaseSmartBullVault(ETH/aUSDC)
  {
    chainId: 1329,
    vault: '0x4Bd6bE959897631fbE5a8Aae01707219850e032f',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    usePermit2: false,
  },
  // RebaseSmartBullVault(BTC/aUSDC)
  {
    chainId: 1329,
    vault: '0xD812F221FA9bF01C1F475D03Ae853D90Ee91E79D',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    usePermit2: false,
  },
  // RebaseSmartBearVault(ETH/aUSDC)
  {
    chainId: 1329,
    vault: '0xaA7764bdD6Ee88E2d59933CBb588144c5474503F',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    usePermit2: false,
  },
  // RebaseSmartBearVault(BTC/aUSDC)
  {
    chainId: 1329,
    vault: '0x0c11a73Ae97A68388d1034662C914B022eD26257',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDC',
    usePermit2: false,
  },
].map((it) => ({ ...it, onlyForAutomator: true }));

export default vaults;
