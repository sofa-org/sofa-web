import { useEffect, useState } from 'react';
import { VaultInfo } from '@sofa/services/base-type';
import { MarketService } from '@sofa/services/market';
import { useLazyCallback } from '@sofa/utils/hooks';
import { isEqual } from 'lodash-es';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

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

const useLivePPSStore = createWithEqualityFn(
  persist(
    () => ({
      priceCache: {} as Record<
        `${VaultInfo['forCcy']}-${VaultInfo['domCcy']}`,
        {
          price: number;
          updatedAt: number;
        }
      >,
    }),
    {
      name: 'products-state-new',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
  isEqual,
);

export const useLivePPS = (param: {
  forCcy: VaultInfo['forCcy'];
  domCcy: VaultInfo['domCcy'];
}) => {
  const price = useLivePPSStore(
    (s) => s.priceCache[`${param.forCcy}-${param.domCcy}`],
  );
  const [requesting, setRequesting] = useState(false);
  useEffect(
    useLazyCallback(() => {
      const req = () => {
        if (document.hidden || requesting) {
          // 页面/tab隐蔽
          return;
        }
        if (!price?.updatedAt || price.updatedAt < Date.now() - 15 * 1000) {
          ((param) => {
            setRequesting(true);
            MarketService.getPPS({
              fromCcy: param.forCcy,
              toCcy: param.domCcy,
              includeNow: true,
            })
              .then((res) => {
                useLivePPSStore.setState({
                  priceCache: {
                    ...useLivePPSStore.getState().priceCache,
                    [`${param.forCcy}-${param.domCcy}`]: {
                      price: res.now,
                      updatedAt: Date.now(),
                    },
                  },
                });
              })
              .finally(() => {
                setRequesting(false);
              });
          })(param);
        }
      };
      const interval = setInterval(req, 5 * 1000);
      req();
      return () => clearInterval(interval);
    }),
    [param.forCcy, param.domCcy, document.hidden],
  );
  return price?.price;
};
