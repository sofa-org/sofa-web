import { MsIntervals } from '@sofa/utils/expiry';

const vaults = [
  {
    chainId: 42161,
    vault: '0x4C241483B4a85e44C59bcEcFe17A4E7d0A073CDB',
    depositCcy: 'USDT',
    balanceCcy: 'atUSDT',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
    createTime: new Date('2024-11-24T08:00Z').getTime(),
  },
];

export default vaults;
