import { Env } from '@sofa/utils/env';
import { http } from '@sofa/utils/http';

import { WalletService } from './wallet';

function trimInvalidCharsInReferralCode(origin?: string) {
  const r = origin?.replace(/[/?&].*/, '');
  // 有时候会出现（因为莫名其妙的浏览器？）
  // code="xxxxx/wc?uri"
  if (!r) {
    return undefined;
  }
  return r;
}

export const ReferralCode = {
  key: Env.isDaily ? 'referral-code-test' : 'referral-code',
  get: () => {
    const cookies = Object.fromEntries(
      document.cookie.split(/;\s*/).map((it) => it.split('=').slice(0, 2)),
    );
    return trimInvalidCharsInReferralCode(
      cookies[ReferralCode.key]
        ? decodeURIComponent(cookies[ReferralCode.key])
        : undefined,
    );
  },
  set: (val?: string) => {
    // 测试网用二级域名，正式网用根域名
    const rootOrigin = window.location.origin.match(
      Env.isDaily
        ? /(([^./:]+\.)?([^./:]+\.)?[^./:]+)(?=$|:\d+)/
        : /(([^./:]+\.)?[^./:]+)(?=$|:\d+)/,
    )?.[1];
    if (!rootOrigin) return;
    const v = encodeURIComponent(val || '');
    document.cookie = `${ReferralCode.key}=${v}; domain=${rootOrigin}; path=/`;
  },
};

export interface BindTradeInfo {
  quoteId: string | number;
  rfqId: string | number;
  txId: string;
}

export interface ReferralBindParams {
  quotes: BindTradeInfo[];
  code?: string;
}

export class ReferralService {
  static async bind(quotes: ReferralBindParams['quotes']) {
    const walletInfo = await WalletService.info();
    console.info('Post Quotes', walletInfo, quotes);
    return http.post('/rfq/trade', {
      quotes,
      code: ReferralCode.get(),
      walletType: walletInfo.name,
    });
  }
}
