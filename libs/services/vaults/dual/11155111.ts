import { RiskType } from '../../base-type';

const RCHVaults = [
  // buy low
  {
    chainId: 11155111,
    vault: '0xd8d1335589C53bFFc6B84ffc7bf6c8655321A8eb',
    riskType: RiskType.DUAL,
    forCcy: 'RCH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // sell high
  {
    chainId: 11155111,
    vault: '0xEC3bc82cc30Be386B86D1976C5E7FAE2A5D26905',
    riskType: RiskType.DUAL,
    forCcy: 'RCH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 1,
    usePermit2: false,
  },
];

const vaults = [...RCHVaults];

export default vaults;
