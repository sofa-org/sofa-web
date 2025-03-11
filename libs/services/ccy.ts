import IconBTC from './assets/icon-btc.svg?url';
import IconCRV from './assets/icon-crv.svg?url';
import IconCrvUSD from './assets/icon-crvusd.png';
import IconETH from './assets/icon-eth.svg?url';
import IconRCH from './assets/icon-rch.png';
import IconSTETH from './assets/icon-steth.svg?url';
import IconsUSDa from './assets/icon-susda.png?url';
import IconUSD from './assets/icon-usd.svg?url';
import IconUSDa from './assets/icon-usda.avif?url';
import IconUSDC from './assets/icon-usdc.svg?url';
import IconUSDT from './assets/icon-usdt.svg?url';

export interface CCYConfig {
  name: string;
  icon: string;
  color: string;
  precision: number; // 数值精度
}

export class CCYService {
  static ccyConfigs: PartialRecord<string, CCYConfig> = {
    ETH: {
      name: 'ETH',
      icon: IconETH,
      color: '#627EEA',
      precision: 4,
    },
    BTC: {
      name: 'BTC',
      icon: IconBTC,
      color: '#FFA800',
      precision: 5,
    },
    USD: {
      name: 'USD',
      icon: IconUSD,
      color: '#FFD639',
      precision: 4,
    },
    crvUSD: {
      name: 'crvUSD',
      icon: IconCrvUSD,
      color: '#366f49',
      precision: 4,
    },
    scrvUSD: {
      name: 'scrvUSD',
      icon: IconCrvUSD,
      color: '#366f49',
      precision: 4,
    },
    USDC: {
      name: 'USDC',
      icon: IconUSDC,
      color: '#2675CA',
      precision: 4,
    },
    USDT: {
      name: 'USDT',
      icon: IconUSDT,
      color: '#1BA27A',
      precision: 4,
    },
    RCH: {
      name: 'RCH',
      icon: IconRCH,
      color: '#FFD639',
      precision: 4,
    },
    stETH: {
      name: 'ETH',
      icon: IconSTETH,
      color: '#66C8FF',
      precision: 4,
    },
    WETH: {
      name: 'ETH',
      icon: IconETH,
      color: '#627EEA',
      precision: 4,
    },
    WBTC: {
      name: 'BTC',
      icon: IconBTC,
      color: '#FFA800',
      precision: 5,
    },
    CRV: {
      name: 'CRV',
      icon: IconCRV,
      color: '#FFA800',
      precision: 4,
    },
    sUSDa: {
      name: 'sUSDa',
      icon: IconsUSDa,
      color: '#FFA800',
      precision: 4,
    },
    USDa: {
      name: 'USDa',
      icon: IconUSDa,
      color: '#FFA800',
      precision: 4,
    },
  };
}
