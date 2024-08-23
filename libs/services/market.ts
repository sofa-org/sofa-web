import { singleton } from '@livelybone/singleton';
import { asyncCache } from '@sofa/utils/decorators';
import { MsIntervals } from '@sofa/utils/expiry';
import { jsonSafeParse } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import { UserStorage } from '@sofa/utils/storage';
import { separateTimeByInterval } from '@sofa/utils/time';
import { WsClients } from '@sofa/utils/ws';

import { ChainMap, defaultChain } from './chains';
import { ContractsService } from './contracts';
import { ApyDefinition } from './products';
import { WalletService } from './wallet';

export interface AAVERecord {
  id: string;
  liquidityRate: string;
  timestamp: number; // s
}

export interface CandleInfo {
  timestamp: number; // 蜡烛结束时间, 秒
  low: number;
  high: number;
  open: number;
  close: number;
  volume?: number;
}

const RCHPrice = new UserStorage<number>('rch-price', () => 'curr');

export class MarketService {
  static get binanceWs() {
    return singleton(
      'binanceWs',
      () =>
        new WsClients('wss://data-stream.binance.vision', {
          ping: (ctx) => ctx.request('ping', {}),
          dataInterceptor: {
            request: (d) => {
              return JSON.stringify({
                id: d.id,
                method: d.method,
                params: d.args,
              });
            },
            response: (res) => {
              const data = jsonSafeParse(
                res.data,
                {} as Record<string, unknown>,
              );
              return {
                id: data.id as string,
                succ: !data.result,
                method: '',
                data: data.result,
              };
            },
          },
        }),
    ).value;
  }

  // 按时间倒序排序
  // https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getproductcandles
  static async dailyCandles(
    $ccy: 'ETH' | 'BTC' | 'WETH' | 'WBTC',
    startMs: number,
    endMs: number,
  ) {
    const inst = $ccy.includes('ETH') ? 'ETH-USDT' : 'BTC-USDT';
    const url = `https://api.exchange.coinbase.com/products/${inst}/candles`;
    const splits = separateTimeByInterval(
      // 由于要拿 UTC+8 16:00 的数据，只能一个小时一个小时拿，导致
      { startTime: startMs, endTime: endMs },
      10 * MsIntervals.day,
      'desc',
    );
    return Promise.all(
      splits.map((it) =>
        http
          .get<
            unknown,
            HttpResponse<[number, number, number, number, number, number][]> // [timestamp, price_low, price_high, price_open, price_close, volume]
          >(url, {
            params: {
              start: Math.floor(it.startTime / 1000),
              end: Math.floor(it.endTime / 1000),
              granularity: 3600,
            },
          })
          .then((res) =>
            res.value.map(
              (it) =>
                ({
                  timestamp: it[0],
                  low: it[1],
                  high: it[2],
                  open: it[3],
                  close: it[4],
                  volume: it[5],
                }) as CandleInfo,
            ),
          ),
      ),
    ).then((list) => list.flat());
  }

  @asyncCache({
    persist: true,
    until: (v, t) => !v || !t || Date.now() - t > 10000,
    id: (_, [ccy]) => `index-price-${ccy || ''}_USDT`,
  })
  static $$fetchIndexPx<T extends 'BTC' | 'ETH'>(ccy: T) {
    const map = {
      BTC: 'BTC-USDT',
      ETH: 'ETH-USDT',
    };
    return http
      .get<unknown, HttpResponse<{ price: string }>>(
        `https://api.exchange.coinbase.com/products/${map[ccy]}/ticker`,
      )
      .then((res) => +res.value.price);
  }

  @asyncCache({
    persist: true,
    until: (v, t) => !v || !t || Date.now() - t > MsIntervals.min,
    id: () => 'index-price-RCH_USDT',
  })
  static async getRchPriceInUsd() {
    const provider = await WalletService.readonlyConnect(defaultChain.chainId);
    return ContractsService.getUniswapPairPrice(
      ContractsService.rchUniswapAddress(),
      ContractsService.rchAddress(),
      provider,
      defaultChain.rchUniswapVersion,
    )
      .then(async (info) => {
        if (/usd/i.test(info.token1)) return info.price;
        const token1 = /btc/i.test(info.token1) ? 'BTC' : 'ETH';
        const token1Price = await MarketService.$$fetchIndexPx(token1);
        return info.price * token1Price;
      })
      .catch((err) => {
        console.error(err);
        return http
          .get<unknown, HttpResponse<{ prices: [number, number][] }>>(
            'https://api.coingecko.com/api/v3/coins/rch-token/market_chart?vs_currency=usd&days=0',
          )
          .then((res) => res.value.prices[0][1]);
      })
      .then((p) => {
        RCHPrice.set(p);
        return p;
      })
      .catch((err) => {
        console.error(err);
        return RCHPrice.get() ?? 0.85;
      });
  }

  static $fetchIndexPx<T extends 'BTC' | 'ETH' = 'BTC' | 'ETH'>(ccy?: T) {
    const map = {
      BTC: ['BTC'],
      ETH: ['ETH'],
      '': ['BTC', 'ETH'],
    } as const;
    return Promise.all(
      map[ccy || ''].map((ccy) =>
        MarketService.$$fetchIndexPx(ccy).then((price) => [ccy, price]),
      ),
    ).then((res) => {
      return { ...Object.fromEntries(res), USD: 1, USDT: 1, USDC: 1 };
    });
  }

  static fetchIndexPx<T extends CCY>(
    ccy?: T,
  ): Promise<Record<T | USDS, number>> {
    return Promise.all([
      ccy !== 'RCH'
        ? MarketService.$fetchIndexPx(
            ccy ? (ccy.includes('ETH') ? 'ETH' : 'BTC') : undefined,
          )
        : undefined,
      ccy === 'RCH' || !ccy
        ? MarketService.getRchPriceInUsd().then((price) => ({ RCH: price }))
        : undefined,
    ]).then((prices) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = { ...prices[0], ...prices[1] } as any;
      if ('ETH' in obj) {
        obj.WETH = obj.ETH;
        obj.stETH = obj.ETH;
      }
      if ('BTC' in obj) obj.WBTC = obj.BTC;
      return obj as Record<T | USDS, number>;
    });
  }

  // https://binance-docs.github.io/apidocs/spot/en/#individual-symbol-ticker-streams
  static subscribeIndexPx<T extends CCY>(
    callback: (px: Record<T | USDS, number>) => void,
    ccy?: T,
  ): Subscription {
    // const topic = `${ccy}USDT@miniticker`.toLowerCase();
    // return Object.assign(
    //   MarketService.binanceWs.subscribe(topic, callback, 'SUBSCRIBE'),
    //   {
    //     unsubscribe: () =>
    //       MarketService.binanceWs.unsubscribe(topic, callback, 'UNSUBSCRIBE'),
    //   },
    // );
    const fetch = () => MarketService.fetchIndexPx(ccy).then(callback);
    const timer = setInterval(() => fetch(), 10000);
    return Object.assign(fetch(), {
      unsubscribe: () => Promise.resolve().then(() => clearInterval(timer)),
    });
  }

  private static async aaveHistory(
    ccy: 'WETH' | 'WBTC' | 'USDT',
    chainId: number,
    timestampGte: number,
    timestampLt?: number,
  ) {
    const url = ChainMap[chainId].aaveGraphUrl;
    const query = `
        {
          reserves(where: { symbol: "${ccy}" }) {
            id
            name
            liquidityRate
            symbol
            paramsHistory(
              first: 1000
              where: { timestamp_gte: ${timestampGte}${
                timestampLt ? ', timestamp_lt: ' + timestampLt : ''
              } }
              orderBy: timestamp
              orderDirection: desc
            ) {
              id
              liquidityRate
              timestamp
            }
          }
        }
      `;
    return http
      .post<
        unknown,
        HttpResponse<{
          data: {
            reserves: [{ liquidityRate: number; paramsHistory: AAVERecord[] }];
          };
        }>
      >(url, { query })
      .then((res) => res.value.data.reserves[0]);
  }

  private static async $interestRate(
    ccy: 'WETH' | 'WBTC' | 'USDT' | 'USDC' | 'stETH',
    chainId: number,
  ) {
    return http
      .get<
        unknown,
        HttpResponse<{
          chainId: number;
          ccy: string;
          avgApy: string;
          currentApy: string;
          apyUsed: string;
          apyDefinition: ApyDefinition;
        }>
      >('/rfq/apy', {
        params: { ccy, chainId, apyDefinition: ApyDefinition.AaveLendingAPY },
      })
      .then((res) => ({
        current: +res.value.currentApy,
        avgWeekly: +res.value.avgApy,
        apyUsed: +(res.value.apyUsed ?? res.value.avgApy),
        apyDefinition: res.value.apyDefinition,
      }));
    // const oneWeekAgo = Math.floor((Date.now() - MsIntervals.day * 7) / 1000);
    // const RAY = 1e27;
    // let currentApy: number;
    // const history: AAVERecord[] = [];
    // do {
    //   const res = await MarketService.aaveHistory(
    //     ccy,
    //     chainId,
    //     oneWeekAgo,
    //     history[history.length - 1]?.timestamp,
    //   );
    //   if (!history[0])
    //     currentApy = (1 + res.liquidityRate / RAY / 365) ** 365 - 1;
    //   history.push(...res.paramsHistory);
    //   await wait(100);
    //   if (!res.paramsHistory.length) break;
    // } while (history.length % 1000 === 0);
    // const avgWeekly = (() => {
    //   const $avg =
    //     sumBy(history, (it) => +it.liquidityRate / RAY) / history.length;
    //   return (1 + $avg / 365) ** 365 - 1;
    // })();
    // return { current: currentApy!, avgWeekly };
  }

  @asyncCache({
    persist: true,
    id: (_, [chainId]) => `interest-rate-${chainId}`,
    until: (cache, createdAt) =>
      !cache || !createdAt || Date.now() - createdAt > MsIntervals.min * 2,
  })
  static async interestRate(
    chainId: number,
  ): Promise<
    PartialRecord<
      CCY | USDS,
      { current: number; avgWeekly: number; apyUsed: number }
    >
  > {
    const ccyList = ContractsService.vaults.reduce(
      (pre, it) =>
        it.chainId !== chainId || pre.includes(it.depositCcy)
          ? pre
          : pre.concat(it.depositCcy),
      [] as string[],
    );
    const defaultApy = {
      current: 0,
      avgWeekly: 0,
      apyUsed: 0,
      apyDefinition: ApyDefinition.AaveLendingAPY,
    };
    const interestRates = await Promise.all(
      (['WBTC', 'WETH', 'USDT', 'USDC', 'stETH'] as const).map(async (ccy) => [
        ccy,
        !ccyList.includes(ccy)
          ? defaultApy
          : await MarketService.$interestRate(ccy, chainId),
      ]),
    ).then(Object.fromEntries);
    return Promise.resolve().then(() => ({
      ...interestRates,
      ETH: interestRates['ETH'] ?? interestRates['WETH'],
      BTC: interestRates['BTC'] ?? interestRates['WBTC'],
    }));
  }
}
