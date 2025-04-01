import { RiskType } from '../../base-type';

const CRVVaults = [
  // buy low
  {
    chainId: 1,
    vault: '0x4dE9d93993C1D4944Fb6044a2dd8877D945Fd43C',
    riskType: RiskType.DUAL,
    forCcy: 'CRV',
    domCcy: 'crvUSD',
    depositCcy: 'crvUSD',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 1,
    vault: '0xEECACc0D50f26fEe5aa1aFBa83e8c4E77EbA162C',
    riskType: RiskType.DUAL,
    forCcy: 'CRV',
    domCcy: 'crvUSD',
    depositCcy: 'CRV',
    rchMultiplier: 1,
    usePermit2: false,
  },
];

const RCHVaults = [
  // buy low
  {
    chainId: 1,
    vault: '0x5354C5d057c73B24aa941eA57a07D0E1079be18B',
    riskType: RiskType.DUAL,
    forCcy: 'RCH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 1,
    vault: '0x7Df81fDd4B995b31624F3d6662d547ac313B32ad',
    riskType: RiskType.DUAL,
    forCcy: 'RCH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 1,
    usePermit2: false,
  },
];

const vaults = [...CRVVaults, ...RCHVaults];

export default vaults;
