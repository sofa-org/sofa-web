import { MsIntervals } from '@sofa/utils/expiry';

const Vaults = [
  {
    chainId: 421614,
    vault: '0x8d922b143933FD6D4f6f82ae2Acea6D78b6a23a9',
    depositCcy: 'USDC',
    vaultDepositCcy: 'USDC',
    positionCcy: 'atUSDC',
    redeemWaitPeriod: MsIntervals.min * 20,
    claimPeriod: MsIntervals.min * 10,
    createTime: new Date('2024-11-24T08:00Z').getTime(),
    creator: '0xA4A0425Bac7b53ECC4283A3b34A2308283CDbbd8',
  },
];

export default Vaults;
