import { MsIntervals } from '@sofa/utils/expiry';

const vaults = [
  // bull BTC
  {
    name: 'Bull BTC',
    chainId: 42161,
    vault: '0x267adC3E106b72ce3b0F2BbDb6c638A12110CF8C',
    depositCcy: 'crvUSD',
    balanceCcy: 'lbcrvUSD',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
  },
  // bull ETH
  {
    name: 'Bull ETH',
    chainId: 42161,
    vault: '0x31D22b4afEC06e67A37AF38A62a6ec9546c1bF8A',
    depositCcy: 'crvUSD',
    balanceCcy: 'lecrvUSD',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
  },
];

export default vaults;
