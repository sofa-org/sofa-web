import { ProductType, RiskType } from '../../base-type';

const CRVVaults = [
  // buy low
  {
    chainId: 11155111,
    vault: '0x0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    riskType: RiskType.PROTECTED,
    forCcy: 'CRV',
    domCcy: 'crvUSD',
    depositCcy: 'crvUSD',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 11155111,
    vault: '0x0BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
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
    chainId: 11155111,
    vault: '0x0CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    riskType: RiskType.PROTECTED,
    forCcy: 'RCH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 11155111,
    vault: '0x0DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
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
