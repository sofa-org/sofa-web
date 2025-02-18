import { RiskType } from '../../base-type';

const CRVVaults = [
  // buy low
  {
    chainId: 421614,
    vault: '0xe462f318FE07427132865e1765A4121b4164086C',
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
    vault: '0x5c2CEBbEc0E378d06A16Ab05d0d32DF990E28666',
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
