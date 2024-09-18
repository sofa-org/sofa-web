import { applyMock } from '@sofa/utils/decorators';
import { AuthToken, http } from '@sofa/utils/http';

const prefix = 'user';

export class AuthService {
  static async getLoginNonce(params: { wallet: string }) {
    return http.get<unknown, HttpResponse<string>>(
      `${prefix}/login-nonce?wallet=${encodeURIComponent(params.wallet)}`,
    );
  }

  @applyMock('login')
  private static async $login(params: { message: string; signature: string }) {
    return http.post<
      unknown,
      HttpResponse<{ uid: number; token: string; lastLoginTimestamp: number }>
    >(`${prefix}/login`, params);
  }

  static async login(params: {
    wallet: string;
    message: string;
    signature: string;
  }) {
    return AuthService.$login(params).then((res) => {
      if (!res.value.token) throw new Error('Login failed');
      AuthToken.set(res.value.token, params.wallet.toLowerCase());
      return res;
    });
  }

  static async logout(wallet?: string) {
    if (!AuthToken.get(wallet?.toLowerCase())) return;
    return http.post<unknown, HttpResponse>(`${prefix}/logout`, {}).then(() => {
      AuthToken.remove(wallet?.toLowerCase());
    });
  }
}
