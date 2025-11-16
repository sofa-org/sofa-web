import { Env } from '@sofa/utils/env';

export class BlacklistService {
  static blacklist = [
    '0x6d6a3a7f560b533626c4d618d748b087ef87feea',
    '0xc21c0885b22EAF7594670327B0aFC5F6efE026b4', // 黑客地址
  ];

  static shouldBlock(wallet?: string) {
    if (!wallet) return false;
    return BlacklistService.blacklist.some(
      (it) => it.toLowerCase() === wallet.toLowerCase(),
    );
  }
}
