import IconBTC from './assets/icon-btc.svg?url';
import IconETH from './assets/icon-eth.svg?url';
import IconRCH from './assets/icon-rch.png';
import IconSTETH from './assets/icon-steth.svg?url';
import IconUSD from './assets/icon-usd.svg?url';
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
      precision: 2,
    },
    USDC: {
      name: 'USDC',
      icon: IconUSDC,
      color: '#2675CA',
      precision: 2,
    },
    USDT: {
      name: 'USDT',
      icon: IconUSDT,
      color: '#1BA27A',
      precision: 2,
    },
    RCH: {
      name: 'RCH',
      icon: IconRCH,
      color: '#FFD639',
      precision: 2,
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
  };
}
