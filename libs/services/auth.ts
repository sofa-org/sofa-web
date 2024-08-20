/* eslint-disable @typescript-eslint/no-explicit-any */
import { Env } from '@sofa/utils/env';
import { http } from '@sofa/utils/http';

const debug = (): boolean => {
  return Env.isDaily && /debug/i.test(location.href);
};
const prefix = 'user';

export class AuthApis {
  static async getLoginNonce(params: { wallet: string }) {
    const res = http.get<any, HttpResponse<string>>(
      `${prefix}/login-nonce?wallet=${encodeURIComponent(params.wallet)}`,
    );
    if (!debug()) {
      return res;
    }
    return res.catch((e) => {
      const testData: HttpResponse<string> = {
        code: 0,
        value: 'A' + Math.random(),
      };
      return testData;
    });
  }
  static async login(params: { message: string; signature: string }) {
    const res = http.post<
      any,
      HttpResponse<{ uid: number; token: string; wallet: string }>
    >(`${prefix}/login`, params);
    if (!debug()) {
      return res;
    }
    return res.catch(() => {
      const uid = Math.floor(Math.random() * 10000 + 1);
      const testData: HttpResponse<{
        uid: number;
        token: string;
        wallet: string;
      }> = {
        value: {
          uid,
          token: 'T' + uid,
          wallet: params.message.match(/Ethereum account:\n([^\n]+)\n/)![1],
        },
        code: 0,
      };
      return testData;
    });
  }

  static async logout() {
    const res = http.post<any, HttpResponse>(`${prefix}/logout`, {});
    if (!debug()) {
      return res;
    }
    return res.catch(() => {
      const uid = Math.floor(Math.random() * 10000 + 1);
      const testData: HttpResponse = {
        value: {},
        code: 0,
      };
      return testData;
    });
  }
}
