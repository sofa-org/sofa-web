import { MsIntervals } from '@sofa/utils/expiry';

import { InterestType } from '../../base-type';

const vaults = [
  // bull BTC
  {
    name: 'Bull BTC',
    chainId: 1,
    vault: '0x267adC3E106b72ce3b0F2BbDb6c638A12110CF8C',
    depositCcy: 'crvUSD',
    vaultDepositCcy: 'scrvUSD',
    positionCcy: 'lbcrvUSD',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
    createTime: new Date('2024-12-24T08:00Z').getTime(),
    creator: '0xCc19E60c86C396929E76a6a488848C9596de22bd',
    interestType: InterestType.CURVE,
  },
  // bull ETH
  {
    name: 'Bull ETH',
    chainId: 1,
    vault: '0x31D22b4afEC06e67A37AF38A62a6ec9546c1bF8A',
    depositCcy: 'crvUSD',
    vaultDepositCcy: 'scrvUSD',
    positionCcy: 'lecrvUSD',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
    createTime: new Date('2024-12-24T08:00Z').getTime(),
    creator: '0xCc19E60c86C396929E76a6a488848C9596de22bd',
    interestType: InterestType.CURVE,
  },
];

export default vaults;
