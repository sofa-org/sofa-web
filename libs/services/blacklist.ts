import { Env } from '@sofa/utils/env';

export class BlacklistService {
  static blacklist = ['0x6d6a3a7f560b533626c4d618d748b087ef87feea'];

  static shouldBlock(wallet?: string) {
    if (!wallet) return false;
    return BlacklistService.blacklist.some(
      (it) => it.toLowerCase() === wallet.toLowerCase(),
    );
  }
}
