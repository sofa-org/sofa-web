import { promiseOnPending, singleton } from '@livelybone/singleton';
import { applyMock, asyncCache, asyncRetry } from '@sofa/utils/decorators';
import { Env } from '@sofa/utils/env';
import { MsIntervals } from '@sofa/utils/expiry';
import { getErrorMsg, jsonSafeParse } from '@sofa/utils/fns';
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
  fetchedAt: number;
}

export interface PriceQuote {
  price: number;
  updatedAt: number;
}

export type IndexPriceUpdate =
  | { ccy: string; type: 'loading' }
  | { ccy: string; type: 'success'; quote: PriceQuote }
  | { ccy: string; type: 'error'; error: string };

const indexPriceInterval = 10000;
const indexPriceWaitTimeout = 15000;

const indexPriceRequestOptions = {
  timeout: 5000,
  'axios-retry': { retries: 0 },
};

function parseIndexPrice(value: unknown): number {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim()) ||
    !Number.isFinite(Number(value)) ||
    Number(value) <= 0
  ) {
    throw new Error('Invalid index price');
  }
  return Number(value);
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
    until: (v, t) => !v || !t || Date.now() - t >= 10000,
    id: (_, [ccy]) => `index-quote-v1-${ccy}_USDT`,
  })
  static async fetchIndexQuote(ccy: 'BTC' | 'ETH'): Promise<PriceQuote> {
    for (const url of [
      `https://data-api.binance.vision/api/v3/ticker/price?symbol=${ccy}USDT`,
      `https://api.exchange.coinbase.com/products/${ccy}-USDT/ticker`,
    ]) {
      try {
        const res = await http.get<unknown, HttpResponse<{ price?: unknown }>>(
          url,
          indexPriceRequestOptions,
        );
        return {
          price: parseIndexPrice(res.value?.price),
          updatedAt: Date.now(),
        };
      } catch {
        // Try the next source for transport errors and invalid prices alike.
      }
    }
    return MarketService.fetchCoinGeckoQuote(ccy);
  }

  static async $$fetchIndexPx(ccy: 'BTC' | 'ETH'): Promise<number> {
    return (await MarketService.fetchIndexQuote(ccy)).price;
  }

  @asyncCache({
    persist: true,
    until: (it, t) => !it || !t || Date.now() - t > MsIntervals.min * 3,
    id: (_, [ccy]) => `coingecko-quote-v1-${ccy}_USD`,
  })
  private static async fetchCoinGeckoQuote(ccy: string): Promise<PriceQuote> {
    const ids: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      RCH: 'rch-token',
      crvUSD: 'crvusd',
      USDT: 'tether',
      USDC: 'usd-coin',
      CRV: 'curve-dao-token',
    };
    if (!Object.prototype.hasOwnProperty.call(ids, ccy)) {
      throw new Error(`Unsupported currency: ${ccy}`);
    }
    return http
      .get<unknown, HttpResponse<Record<string, { usd?: unknown }>>>(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          ...indexPriceRequestOptions,
          params: { ids: ids[ccy], vs_currencies: 'usd' },
        },
      )
      .then((res) => ({
        price: parseIndexPrice(res.value?.[ids[ccy]]?.usd),
        updatedAt: Date.now(),
      }));
  }

  static async fetchPxFromCoinGecko(ccy: string): Promise<number> {
    return (await MarketService.fetchCoinGeckoQuote(ccy)).price;
  }

  private static async fetchSofaQuote(ccy: string): Promise<PriceQuote> {
    const entry = await MarketService.$getPPSNow({
      fromCcy: ccy,
      toCcy: 'USD',
    });
    return {
      price: parseIndexPrice(entry.exchangeRate),
      updatedAt: entry.fetchedAt,
    };
  }

  @asyncCache({
    until: (value, time) =>
      !value || !time || Date.now() - time >= indexPriceInterval,
  })
  private static async fetchPPSQuote(
    ccy: 'scrvUSD' | 'zRCH',
  ): Promise<PriceQuote> {
    const price = await (ccy === 'scrvUSD'
      ? MarketService.getPPSOfScrv()
      : MarketService.getPPSOfZRCH());
    return { price: parseIndexPrice(price), updatedAt: Date.now() };
  }

  static $fetchIndexPx() {
    return Promise.all(
      (['BTC', 'ETH'] as const).map(($ccy) =>
        MarketService.$$fetchIndexPx($ccy).then((price) => [$ccy, price]),
      ),
    ).then((res) => Object.fromEntries(res));
  }

  static fetchIndexPx<T extends CCY>(): Promise<Record<T | USDS, number>> {
    return Promise.all([
      MarketService.fetchPPSQuote('scrvUSD')
        .then((quote) => quote.price)
        .catch(() => 1),
      MarketService.fetchPPSQuote('zRCH')
        .then((quote) => quote.price)
        .catch(() => 1),
      MarketService.$fetchIndexPx(),
      MarketService.getPPS({
        fromCcy: 'RCH',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ RCH: parseIndexPrice(res.now) })),
      MarketService.getPPS({
        fromCcy: 'crvUSD',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ crvUSD: parseIndexPrice(res.now) })),
      MarketService.getPPS({
        fromCcy: 'USDT',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ USDT: parseIndexPrice(res.now) })),
      MarketService.getPPS({
        fromCcy: 'USDC',
        toCcy: 'USD',
        includeNow: true,
      }).then((res) => ({ USDC: parseIndexPrice(res.now) })),
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

  static subscribeIndexPx<T extends CCY>(
    callback: (px: Record<T | USDS, number>) => void,
    onUpdate?: (update: IndexPriceUpdate) => void,
  ): Subscription {
    let active = true;
    let snapshotPending = false;
    const pending = new Set<string>();
    const deadlines = new Set<ReturnType<typeof setTimeout>>();
    const quotes: Partial<Record<string, PriceQuote>> = {};
    const errors: Partial<Record<string, string>> = {};
    const derived = { scrvUSD: 'crvUSD', zRCH: 'RCH' } as const;
    const notify = (update: IndexPriceUpdate) => {
      if (active) onUpdate?.(update);
    };
    const publishDerived = (changedCcy: string) => {
      for (const ccy of ['scrvUSD', 'zRCH'] as const) {
        const base = derived[ccy];
        if (changedCcy !== ccy && changedCcy !== base) continue;
        const error = errors[ccy] || errors[base];
        if (error) {
          notify({ ccy, type: 'error', error });
        } else if (
          !pending.has(ccy) &&
          !pending.has(base) &&
          quotes[ccy] &&
          quotes[base]
        ) {
          const price = quotes[ccy]!.price * quotes[base]!.price;
          if (!Number.isFinite(price) || price <= 0) {
            notify({ ccy, type: 'error', error: 'Invalid index price' });
          } else {
            notify({
              ccy,
              type: 'success',
              quote: {
                price,
                updatedAt: Math.min(
                  quotes[ccy]!.updatedAt,
                  quotes[base]!.updatedAt,
                ),
              },
            });
          }
        }
      }
    };
    const fetchers: Record<string, () => Promise<PriceQuote>> = {
      BTC: () => MarketService.fetchIndexQuote('BTC'),
      ETH: () => MarketService.fetchIndexQuote('ETH'),
      RCH: () => MarketService.fetchSofaQuote('RCH'),
      crvUSD: () => MarketService.fetchSofaQuote('crvUSD'),
      USDT: () => MarketService.fetchSofaQuote('USDT'),
      USDC: () => MarketService.fetchSofaQuote('USDC'),
      scrvUSD: () => MarketService.fetchPPSQuote('scrvUSD'),
      zRCH: () => MarketService.fetchPPSQuote('zRCH'),
    };
    const fetchQuote = async (
      ccy: string,
      fetcher: () => Promise<PriceQuote>,
    ) => {
      if (pending.has(ccy)) return;
      pending.add(ccy);
      notify({ ccy, type: 'loading' });
      for (const [derivedCcy, baseCcy] of Object.entries(derived)) {
        if (ccy === baseCcy) notify({ ccy: derivedCcy, type: 'loading' });
      }
      const fail = (error: string) => {
        errors[ccy] = error;
        notify({ ccy, type: 'error', error });
        publishDerived(ccy);
      };
      const deadline = setTimeout(() => {
        // Keep the pending lock until the underlying request actually settles.
        fail('Price request timed out');
      }, indexPriceWaitTimeout);
      deadlines.add(deadline);
      try {
        const quote = await fetcher();
        if (!active) return;
        quotes[ccy] = quote;
        delete errors[ccy];
        if (!(ccy in derived)) notify({ ccy, type: 'success', quote });
      } catch (error) {
        if (active) fail(getErrorMsg(error) || 'Price unavailable');
      } finally {
        pending.delete(ccy);
        clearTimeout(deadline);
        deadlines.delete(deadline);
        if (active) publishDerived(ccy);
      }
    };
    const fetchSnapshot = async () => {
      if (snapshotPending) return;
      snapshotPending = true;
      try {
        const prices = await MarketService.fetchIndexPx<T>();
        if (active) callback(prices);
      } catch {
        // Preserve the last complete snapshot; per-coin events report failures.
      } finally {
        snapshotPending = false;
      }
    };
    const poll = () => {
      if (!active) return;
      if (onUpdate) {
        for (const [ccy, fetcher] of Object.entries(fetchers))
          void fetchQuote(ccy, fetcher);
      }
      void fetchSnapshot();
    };
    const timer = setInterval(poll, indexPriceInterval);
    poll();
    // This promise acknowledges subscription setup, not the first price batch.
    return Object.assign(Promise.resolve(), {
      unsubscribe: () => {
        active = false;
        clearInterval(timer);
        deadlines.forEach(clearTimeout);
        deadlines.clear();
        return Promise.resolve();
      },
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
      if (it.tradeDisable) return pre;
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
      // A rejected sibling must not cause a still-pending RPC to be sent again.
      promiseOnPending(
        () => zRCHContract.totalSupply().then((res) => String(res)),
        {
          id: `index-pps-supply-${defaultChain.chainId}-${defaultChain.zRCHAddress}`,
        },
      ),
      promiseOnPending(
        () =>
          stRCHContract
            .balanceOf(defaultChain.zRCHAddress)
            .then((res) => String(res)),
        {
          id: `index-pps-balance-${defaultChain.chainId}-${defaultChain.stRCHAddress}-${defaultChain.zRCHAddress}`,
        },
      ),
    ]);
    if (!+zRCHTotalSupply) return 1;
    return Big(balanceOfStRCH).div(zRCHTotalSupply).toString();
  }

  @asyncCache({
    id: (_, [params]) => {
      const { fromCcy, toCcy } = params as { fromCcy: string; toCcy: string };
      return `pps-now-${fromCcy}-${toCcy}`;
    },
    until: (it, createdAt) =>
      !it || !createdAt || Date.now() - createdAt >= MsIntervals.s * 10,
  })
  static async $getPPSNow(params: { fromCcy: string; toCcy: string }) {
    if (params.fromCcy.includes('USD') && params.toCcy.includes('USD'))
      return {
        ...params,
        dateTime: Date.now(),
        exchangeRate: 1,
        fetchedAt: Date.now(),
      } as PPSEntry;
    return http
      .get<unknown, HttpResponse<PPSEntry>>(`/rfq/exchange-rate`, { params })
      .then((res) => ({ ...res.value, fetchedAt: Date.now() }));
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
