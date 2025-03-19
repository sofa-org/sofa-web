import { RiskType } from '../../base-type';

const RCHVaults = [
  // buy low
  {
    chainId: 11155111,
    vault: '0x3d257cBFC6d70885EDD30238EbA861fD43368143',
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
    vault: '0x81E6DBbFC3C45A03EACe08D55E2fCB5674Fa2830',
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
