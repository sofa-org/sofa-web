import { singleton } from '@livelybone/singleton';
import { applyMock, asyncCache, asyncRetry } from '@sofa/utils/decorators';
import { Env } from '@sofa/utils/env';
import { MsIntervals } from '@sofa/utils/expiry';
import { jsonSafeParse } from '@sofa/utils/fns';
import { http } from '@sofa/utils/http';
import { separateTimeByInterval } from '@sofa/utils/time';
import { WsClients } from '@sofa/utils/ws';
import Big from 'big.js';
import { Contract, formatUnits } from 'ethers';
import { max, min, pick, uniq } from 'lodash-es';

import stRCHAbis from './abis/StRCH.json';
import zRCHAbis from './abis/ZenRCH.json';
import { defaultChain } from './chains';
import { ContractsService, RiskType, VaultInfo } from './contracts';
import { ApyDefinition } from './products';
import { WalletConnect } from './wallet-connect';

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

interface PPSEntry {
  fromCcy: string;
  toCcy: string;
  dateTime: number;
  exchangeRate: number;
}

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
      .get<
        unknown,
        HttpResponse<{ price: string }>
      >(`https://api.exchange.coinbase.com/products/${map[ccy]}/ticker`)
      .then((res) => +res.value.price);
  }

  @asyncCache({
    persist: true,
    until: (it, t) => !it || !t || Date.now() - t > MsIntervals.min * 3,
  })
  static async fetchPxFromCoinGecko(ccy: string) {
    const fallbackUrls: Record<string, string> = {
      BTC: 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=0',
      ETH: 'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=0',
      RCH: 'https://api.coingecko.com/api/v3/coins/rch-token/market_chart?vs_currency=usd&days=0',
      crvUSD:
        'https://api.coingecko.com/api/v3/coins/crvusd/market_chart?vs_currency=usd&days=0',
      USDT: 'https://api.coingecko.com/api/v3/coins/tether/market_chart?vs_currency=usd&days=0',
      USDC: 'https://api.coingecko.com/api/v3/coins/usd-coin/market_chart?vs_currency=usd&days=0',
      CRV: 'https://api.coingecko.com/api/v3/coins/curve-dao-token/market_chart?vs_currency=usd&days=0',
    };
    if (!fallbackUrls[ccy]) return [ccy, undefined];
    return http
      .get<
        unknown,
        HttpResponse<{ prices: [number, number][] }>
      >(fallbackUrls[ccy])
      .then((res) => res.value.prices[0][1]);
  }

  static $fetchIndexPx() {
    return Promise.all(
      (['BTC', 'ETH'] as const).map(($ccy) =>
        MarketService.$$fetchIndexPx($ccy)
          .then((price) => [$ccy, price])
          .catch(() => [$ccy, MarketService.fetchPxFromCoinGecko($ccy)]),
      ),
    ).then((res) => Object.fromEntries(res));
  }

  static fetchIndexPx<T extends CCY>(): Promise<Record<T | USDS, number>> {
    return Promise.all([
      MarketService.getPPSOfScrv().catch(() => 1),
      MarketService.getPPSOfZRCH().catch(() => 1),
      MarketService.$fetchIndexPx(),
      MarketService.getPPS({
        fromCcy: 'RCH',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ RCH: res.now })),
      MarketService.getPPS({
        fromCcy: 'crvUSD',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ crvUSD: res.now })),
      MarketService.getPPS({
        fromCcy: 'USDT',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ USDT: res.now })),
      MarketService.getPPS({
        fromCcy: 'USDC',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ USDC: res.now })),
    ]).then(([scrvPPS, zrchPPS, ...prices]) => {
      const obj = prices.reduce(
        (pre, it) => Object.assign(pre, it),
        {} as Record<string, number>,
      );
      obj.scrvUSD = obj.crvUSD * +scrvPPS;
      obj.zRCH = obj.RCH * +zrchPPS;
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
  ): Subscription {
    // const topic = `${ccy}USDT@miniticker`.toLowerCase();
    // return Object.assign(
    //   MarketService.binanceWs.subscribe(topic, callback, 'SUBSCRIBE'),
    //   {
    //     unsubscribe: () =>
    //       MarketService.binanceWs.unsubscribe(topic, callback, 'UNSUBSCRIBE'),
    //   },
    // );
    const fetch = () => MarketService.fetchIndexPx().then(callback);
    const timer = setInterval(() => fetch(), 10000);
    return Object.assign(fetch(), {
      unsubscribe: () => Promise.resolve().then(() => clearInterval(timer)),
    });
  }

  @applyMock('marketInterestRate')
  private static async $interestRate(
    ccy: 'WETH' | 'WBTC' | VaultInfo['depositCcy'],
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
    const ccyList = ContractsService.vaults.reduce((pre, it) => {
      if (it.riskType === RiskType.RISKY || it.chainId !== chainId) return pre;
      if (it.interestType && !pre.includes(it.depositCcy)) {
        pre.push(it.depositCcy);
      }
      if (
        it.interestType &&
        it.depositBaseCcy &&
        !pre.includes(it.depositBaseCcy)
      ) {
        pre.push(it.depositBaseCcy);
      }
      return pre;
    }, [] as string[]);
    const defaultApy = {
      current: 0,
      avgWeekly: 0,
      apyUsed: 0,
      apyDefinition: ApyDefinition.AaveLendingAPY,
    };
    const interestRates = await Promise.all(
      (['WBTC', 'WETH', ...ccyList] as const).map(async (ccy) => [
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

  private static async getPPSOfScrv() {
    const provider = await WalletConnect.getProvider(1);
    const contractAddress = '0x0655977FEb2f289A4aB78af67BAB0d17aAb84367';
    const abi = ['function pricePerShare() public view returns (uint256)'];
    const contract = new Contract(contractAddress, abi, provider);
    return formatUnits(await contract.pricePerShare(), 18);
  }

  private static async getPPSOfZRCH() {
    if (!defaultChain.zRCHAddress) return 1;
    const provider = await WalletConnect.getProvider(defaultChain.chainId);
    const zRCHContract = new Contract(
      defaultChain.zRCHAddress,
      zRCHAbis,
      provider,
    );
    const stRCHContract = new Contract(
      defaultChain.stRCHAddress,
      stRCHAbis,
      provider,
    );
    const [zRCHTotalSupply, balanceOfStRCH] = await Promise.all([
      zRCHContract.totalSupply().then((res) => String(res)),
      stRCHContract
        .balanceOf(defaultChain.zRCHAddress)
        .then((res) => String(res)),
    ]);
    if (!+zRCHTotalSupply) return 1;
    return Big(balanceOfStRCH).div(zRCHTotalSupply).toString();
  }

  @asyncCache({
    until: (it, createdAt) =>
      !it || !createdAt || Date.now() - createdAt > MsIntervals.s * 10,
  })
  static async $getPPSNow(params: { fromCcy: string; toCcy: string }) {
    if (params.fromCcy.includes('USD') && params.toCcy.includes('USD'))
      return { ...params, dateTime: Date.now(), exchangeRate: 1 } as PPSEntry;
    return http
      .get<unknown, HttpResponse<PPSEntry>>(`/rfq/exchange-rate`, { params })
      .then((res) => res.value);
  }

  @asyncCache({
    until: (it, createdAt) =>
      !it || !createdAt || Date.now() - createdAt > MsIntervals.min,
  })
  static async $getPPSHistory(params: {
    fromCcy: string;
    toCcy: string;
    endDateTime: number;
    startDateTime: number;
  }) {
    return http
      .get<
        unknown,
        HttpResponse<PPSEntry[]>
      >(`/rfq/exchange-rate/history-list`, { params })
      .then((res) => res.value);
  }

  @applyMock('getPPS')
  static async getPPS(params: {
    fromCcy: string;
    toCcy: string;
    timeList?: number[];
    includeNow: boolean;
  }): Promise<Record<number | 'now', number>> {
    if (!params.timeList && !params.includeNow) {
      throw new Error('Either timeList/includeNow must be non-empty');
    }
    const result = {} as Record<number | 'now', number>;
    await Promise.all(
      [
        params.includeNow
          ? MarketService.$getPPSNow(pick(params, ['toCcy', 'fromCcy'])).then(
              (res) => {
                result.now = res.exchangeRate;
                result[res.dateTime * 1000] = res.exchangeRate;
              },
            )
          : undefined,
        params.timeList && params.timeList.length
          ? MarketService.$getPPSHistory({
              fromCcy: params.fromCcy,
              toCcy: params.toCcy,
              startDateTime: min(params.timeList)! / 1000 - 86400,
              endDateTime: max(params.timeList)! / 1000 + 86400,
            }).then((res) => {
              if (!res.length) {
                console.error(
                  `Cannot get any exchange-rate from ${params.fromCcy} to ${params.toCcy} between ${min(params.timeList)! / 1000} & ${max(params.timeList)! / 1000}`,
                );
                return;
              }
              const sorttedRes = res.sort((a, b) => a.dateTime - b.dateTime);
              let startIndex = 0;
              for (const it of uniq(params.timeList!).sort()) {
                const itInSec = it / 1000;
                /* eslint-disable no-constant-condition */
                while (true) {
                  const tHead = sorttedRes[startIndex].dateTime;
                  const tNext = sorttedRes[startIndex + 1]?.dateTime;
                  if (
                    tNext === undefined ||
                    tHead == itInSec ||
                    Math.abs(itInSec - tHead) <= Math.abs(itInSec - tNext)
                  ) {
                    // 距离 tHead 更近
                    result[it] = sorttedRes[startIndex].exchangeRate;
                    break;
                  }
                  // 距离 tNext 更近
                  // 更新 startIndex
                  startIndex += 1;
                }
              }
            })
          : undefined,
      ].filter(Boolean),
    );
    return result;
  }
}
