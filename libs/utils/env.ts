import { load } from '@fingerprintjs/fingerprintjs';
import mobile from 'is-mobile';
import UAParser from 'ua-parser-js';

export interface AuthValue {
  token: string;
}

export class Env {
  static version = '0.0.1';
  static deviceID = (async () => {
    const key = 'device-id';
    const id = localStorage.getItem(key);
    if (id) return id;
    return load()
      .then((fp) => fp.get())
      .then((res) => {
        localStorage.setItem(key, res.visitorId);
        return res.visitorId;
      });
  })();
  static isDev = import.meta.env.DEV;
  static isDaily = ['daily', 'demo'].includes(import.meta.env.VITE_ENV);
  static isPre = import.meta.env.VITE_ENV === 'pre';
  static isProd = import.meta.env.VITE_ENV === 'prod';
  private static _isMobile?: boolean;
  static get isMobile() {
    if (Env._isMobile === undefined) Env._isMobile = mobile();
    return Env._isMobile;
  }

  // Android metamask app 浏览器无法在应用内打开新的 tab page
  private static _isMetaMaskAndroid?: boolean;
  static get isMetaMaskAndroid() {
    if (Env._isMetaMaskAndroid === undefined)
      Env._isMetaMaskAndroid =
        /metamask/i.test(window.navigator.userAgent) ||
        /android/i.test(window.navigator.userAgent);
    return Env._isMetaMaskAndroid;
  }

  private static _ua?: UAParser;
  static get ua() {
    if (Env._ua === undefined) Env._ua = new UAParser();
    return Env._ua;
  }

  static getAuth(): AuthValue | undefined {
    const v = localStorage.getItem('auth') as string;
    try {
      const res = JSON.parse(v) as AuthValue;
      if (res.token) {
        return res;
      }
    } catch (e) {
      // no-ops
    }
    return undefined;
  }

  static setAuth(value?: AuthValue) {
    if (!value) {
      localStorage.removeItem('auth');
      return;
    }
    localStorage.setItem('auth', JSON.stringify(value));
  }
}
