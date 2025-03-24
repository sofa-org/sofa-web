import { RiskType } from '../../base-type';

const CRVVaults = [
  // buy low
  {
    chainId: 421614,
    vault: '0x623080585CBf12dd7600cCf6AA2fDe6C35A8684A',
    riskType: RiskType.DUAL,
    forCcy: 'CRV',
    domCcy: 'crvUSD',
    depositCcy: 'crvUSD',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 421614,
    vault: '0x1C5144d4d0027c69FA84C143e325FB3559197557',
    riskType: RiskType.DUAL,
    forCcy: 'CRV',
    domCcy: 'crvUSD',
    depositCcy: 'CRV',
    rchMultiplier: 1,
    usePermit2: false,
  },
];

const vaults = [...CRVVaults];

export default vaults;
