import { load } from '@fingerprintjs/fingerprintjs';
import mobile from 'is-mobile';
import UAParser from 'ua-parser-js';

export interface AuthValue {
  token: string;
}

export class Env {
  static readonly version = '0.0.1';
  static readonly deviceID = (async () => {
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
  static readonly isDev = import.meta.env.DEV;
  static readonly isDaily = ['daily', 'demo'].includes(
    import.meta.env.VITE_ENV,
  );
  static readonly isPre = import.meta.env.VITE_ENV === 'pre';
  static readonly isProd = import.meta.env.VITE_ENV === 'prod';
  private static _isMobile?: boolean;
  static get isMobile() {
    if (Env._isMobile === undefined) Env._isMobile = mobile();
    return Env._isMobile;
  }
  static recalcIsMobile() {
    const isMobile = mobile();
    Env._isMobile = isMobile;
    return isMobile;
  }

  private static _isTelegram?: boolean;
  static get isTelegram() {
    if (Env._isTelegram === undefined)
      Env._isTelegram = !!window.TelegramWebviewProxy;
    return Env._isTelegram;
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
}
