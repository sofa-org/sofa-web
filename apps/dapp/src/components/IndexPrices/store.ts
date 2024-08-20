import { MarketService } from '@sofa/services/market';
import { create } from 'zustand';

export const useIndexPrices = Object.assign(
  create(() => ({
    prices: {} as PRecord<CCY | USDS, number>,
  })),
  {
    subscribePrices: () =>
      MarketService.subscribeIndexPx((d) => {
        return useIndexPrices.setState((pre) => ({
          prices: {
            ...d,
            WETH: d.ETH || pre.prices.ETH,
            stETH: d.ETH || pre.prices.ETH,
            WBTC: d.BTC || pre.prices.BTC,
          },
        }));
      }),
  },
);
