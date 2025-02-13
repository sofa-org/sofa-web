import { ProductType, RiskType } from '../../base-type';

const CRVVaults = [
  // buy low
  {
    chainId: 1,
    vault: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    riskType: RiskType.PROTECTED,
    forCcy: 'CRV',
    domCcy: 'crvUSD',
    depositCcy: 'crvUSD',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 1,
    vault: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    riskType: RiskType.PROTECTED,
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
    vault: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    riskType: RiskType.PROTECTED,
    forCcy: 'RCH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 1,
    vault: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    riskType: RiskType.PROTECTED,
    forCcy: 'RCH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 1,
    usePermit2: false,
  },
];

const vaults = [...CRVVaults, ...RCHVaults];

export default vaults;
