import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => vi.stubGlobal('window', { location: { search: '' } }));
vi.mock('@sofa/utils/env', () => ({ Env: {} }));
vi.mock('@sofa/utils/sentry', () => ({ sentry: {} }));
vi.mock('@sofa/utils/http', () => ({ http: { get: vi.fn() } }));
vi.mock('@sofa/utils/ws', () => ({ WsClients: vi.fn() }));
vi.mock('../chains', () => ({ defaultChain: { chainId: 1 } }));
vi.mock('../contracts', () => ({ ContractsService: {}, RiskType: {} }));
vi.mock('../products', () => ({ ApyDefinition: {} }));
vi.mock('../wallet-connect', () => ({
  WalletConnect: { getProvider: vi.fn() },
}));

import { DecoratorMemoryCache } from '@sofa/utils/decorators';
import { http } from '@sofa/utils/http';

import { defaultChain } from '../chains';
import { MarketService } from '../market';
import { WalletConnect } from '../wallet-connect';

const pendingRequests: Array<() => void> = [];
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  void promise.catch(() => {});
  pendingRequests.push(() => reject(new Error('Test cleanup')));
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  DecoratorMemoryCache.clear();
  vi.stubGlobal('asyncStorage', { get: vi.fn(), set: vi.fn() });
});

describe('independent price subscriptions', () => {
  let subscription: Subscription | undefined;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    vi.mocked(http.get).mockImplementation(async (url) => {
      if (url.includes('exchange-rate'))
        return {
          value: {
            fromCcy: 'RCH',
            toCcy: 'USD',
            exchangeRate: 0.5,
            dateTime: 100,
          },
        };
      return { value: { price: url.includes('BTC') ? '60000' : '2000' } };
    });
    const provider =
      deferred<Awaited<ReturnType<typeof WalletConnect.getProvider>>>();
    vi.mocked(WalletConnect.getProvider).mockReturnValue(provider.promise);
  });
  afterEach(async () => {
    await subscription?.unsubscribe();
    defaultChain.zRCHAddress = undefined;
    defaultChain.stRCHAddress = undefined;
    pendingRequests.splice(0).forEach((reject) => reject());
    await vi.advanceTimersByTimeAsync(0);
  });

  it('publishes RCH and ETH while BTC and RPC are pending, without publishing a partial snapshot', async () => {
    const btc = deferred<{ value: { price: string } }>();
    const normalGet = vi.mocked(http.get).getMockImplementation()!;
    vi.mocked(http.get).mockImplementation((url, config) =>
      url.includes('BTC') ? btc.promise : normalGet(url, config),
    );
    const snapshot = vi.fn();
    const update = vi.fn();
    subscription = MarketService.subscribeIndexPx(snapshot, update);
    await vi.advanceTimersByTimeAsync(0);
    expect(update).toHaveBeenCalledWith({
      ccy: 'RCH',
      type: 'success',
      quote: { price: 0.5, updatedAt: 100000 },
    });
    expect(update).toHaveBeenCalledWith({
      ccy: 'ETH',
      type: 'success',
      quote: { price: 2000, updatedAt: 100000 },
    });
    expect(snapshot).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(http.get)
        .mock.calls.filter(([url]) => url.includes('exchange-rate')),
    ).toHaveLength(1);
    btc.resolve({ value: { price: '60000' } });
    await vi.advanceTimersByTimeAsync(0);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ccy: 'BTC', type: 'success' }),
    );
  });

  it('keeps polling healthy coins while a timed-out RPC is still pending', async () => {
    const update = vi.fn();
    subscription = MarketService.subscribeIndexPx(vi.fn(), update);
    await vi.advanceTimersByTimeAsync(31000);
    expect(WalletConnect.getProvider).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ccy: 'scrvUSD', type: 'error' }),
    );
    expect(
      update.mock.calls.filter(
        ([event]) => event.ccy === 'RCH' && event.type === 'success',
      ).length,
    ).toBeGreaterThan(1);
  });

  it('reports a single coin failure and recovers on the next poll', async () => {
    const normalGet = vi.mocked(http.get).getMockImplementation()!;
    vi.mocked(http.get).mockImplementation(async (url, config) => {
      if (url.includes('BTC') || config?.params?.ids === 'bitcoin')
        throw new Error('BTC offline');
      return normalGet(url, config);
    });
    const update = vi.fn();
    subscription = MarketService.subscribeIndexPx(vi.fn(), update);
    await vi.advanceTimersByTimeAsync(0);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ccy: 'BTC', type: 'error' }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ccy: 'RCH', type: 'success' }),
    );
    vi.mocked(http.get).mockImplementation(normalGet);
    await vi.advanceTimersByTimeAsync(10000);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ccy: 'BTC', type: 'success' }),
    );
  });

  it('retains all currencies in full snapshots and recomputes derived quotes when base prices change', async () => {
    defaultChain.zRCHAddress = '0x0000000000000000000000000000000000000001';
    defaultChain.stRCHAddress = '0x0000000000000000000000000000000000000002';
    const call = vi.fn(async ({ to }: { to: string }) => {
      const value =
        to === defaultChain.zRCHAddress
          ? 100n
          : to === defaultChain.stRCHAddress
            ? 200n
            : 1100000000000000000n;
      return `0x${value.toString(16).padStart(64, '0')}`;
    });
    vi.mocked(WalletConnect.getProvider).mockResolvedValue({
      call,
    } as unknown as Awaited<ReturnType<typeof WalletConnect.getProvider>>);
    const snapshot = vi.fn();
    const update = vi.fn();
    subscription = MarketService.subscribeIndexPx(snapshot, update);
    await vi.advanceTimersByTimeAsync(0);
    expect(snapshot).toHaveBeenCalledWith({
      BTC: 60000,
      WBTC: 60000,
      ETH: 2000,
      WETH: 2000,
      stETH: 2000,
      RCH: 0.5,
      zRCH: 1,
      crvUSD: 1,
      scrvUSD: 1.1,
      USDT: 1,
      USDC: 1,
    });
    expect(update).toHaveBeenCalledWith({
      ccy: 'zRCH',
      type: 'success',
      quote: { price: 1, updatedAt: 100000 },
    });
    const normalGet = vi.mocked(http.get).getMockImplementation()!;
    vi.mocked(http.get).mockImplementation((url, config) =>
      url.includes('exchange-rate')
        ? Promise.resolve({ value: { exchangeRate: 0.75, dateTime: 110 } })
        : normalGet(url, config),
    );
    await vi.advanceTimersByTimeAsync(10000);
    expect(update).toHaveBeenCalledWith({
      ccy: 'zRCH',
      type: 'success',
      quote: { price: 1.5, updatedAt: 110000 },
    });
  });

  it('preserves legacy RPC fallback in full snapshots without reporting it as a fresh derived quote', async () => {
    vi.mocked(WalletConnect.getProvider).mockRejectedValue(
      new Error('RPC unavailable'),
    );
    const snapshot = vi.fn();
    const update = vi.fn();
    subscription = MarketService.subscribeIndexPx(snapshot, update);
    await vi.advanceTimersByTimeAsync(0);
    expect(snapshot).toHaveBeenCalledWith(
      expect.objectContaining({ scrvUSD: 1, RCH: 0.5 }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ccy: 'scrvUSD', type: 'error' }),
    );
    expect(
      update.mock.calls.some(
        ([event]) => event.ccy === 'scrvUSD' && event.type === 'success',
      ),
    ).toBe(false);
  });

  it('keeps a derived quote loading while its PPS refresh is pending', async () => {
    const refresh = deferred<string>();
    const call = vi
      .fn()
      .mockResolvedValueOnce(
        `0x${1100000000000000000n.toString(16).padStart(64, '0')}`,
      )
      .mockReturnValue(refresh.promise);
    vi.mocked(WalletConnect.getProvider).mockResolvedValue({
      call,
    } as unknown as Awaited<ReturnType<typeof WalletConnect.getProvider>>);
    const update = vi.fn();
    subscription = MarketService.subscribeIndexPx(vi.fn(), update);
    await vi.advanceTimersByTimeAsync(0);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ccy: 'scrvUSD', type: 'success' }),
    );
    update.mockClear();
    await vi.advanceTimersByTimeAsync(10000);
    const events = update.mock.calls
      .map(([event]) => event)
      .filter((event) => event.ccy === 'scrvUSD');
    expect(events[events.length - 1].type).toBe('loading');
    expect(events.some((event) => event.type === 'success')).toBe(false);
  });

  it('shares a pending zRCH RPC leg when the other leg rejects', async () => {
    defaultChain.zRCHAddress = '0x0000000000000000000000000000000000000001';
    defaultChain.stRCHAddress = '0x0000000000000000000000000000000000000002';
    const balance = deferred<string>();
    const call = vi.fn(({ to }: { to: string }) => {
      if (to === defaultChain.zRCHAddress)
        return Promise.reject(new Error('Supply RPC unavailable'));
      if (to === defaultChain.stRCHAddress) return balance.promise;
      return Promise.resolve(
        `0x${1100000000000000000n.toString(16).padStart(64, '0')}`,
      );
    });
    vi.mocked(WalletConnect.getProvider).mockResolvedValue({
      call,
    } as unknown as Awaited<ReturnType<typeof WalletConnect.getProvider>>);
    const snapshot = vi.fn();
    subscription = MarketService.subscribeIndexPx(snapshot, vi.fn());
    await vi.advanceTimersByTimeAsync(30000);
    expect(snapshot).toHaveBeenCalledWith(
      expect.objectContaining({ zRCH: 0.5 }),
    );
    expect(
      call.mock.calls.filter(
        ([request]) => request.to === defaultChain.stRCHAddress,
      ),
    ).toHaveLength(1);
  });

  it('does not emit or poll after unsubscribe, even when a request resolves later', async () => {
    const response = deferred<{ value: { price: string } }>();
    vi.mocked(http.get).mockImplementation((url) =>
      url.includes('exchange-rate')
        ? Promise.resolve({ value: { exchangeRate: 0.5 } })
        : response.promise,
    );
    const snapshot = vi.fn();
    const update = vi.fn();
    subscription = MarketService.subscribeIndexPx(snapshot, update);
    await vi.advanceTimersByTimeAsync(0);
    await subscription.unsubscribe();
    const count = update.mock.calls.length;
    const requests = vi.mocked(http.get).mock.calls.length;
    response.resolve({ value: { price: '60000' } });
    await vi.advanceTimersByTimeAsync(30000);
    expect(update).toHaveBeenCalledTimes(count);
    expect(snapshot).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledTimes(requests);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('CoinGecko fallback', () => {
  it.each([
    ['BTC', 'bitcoin', 60000],
    ['ETH', 'ethereum', 2000],
    ['RCH', 'rch-token', 0.5],
    ['crvUSD', 'crvusd', 1],
    ['USDT', 'tether', 1],
    ['USDC', 'usd-coin', 1],
    ['CRV', 'curve-dao-token', 0.3],
  ])('reads the current %s price by coin ID', async (ccy, id, price) => {
    vi.mocked(http.get).mockResolvedValue({ value: { [id]: { usd: price } } });
    await expect(MarketService.fetchPxFromCoinGecko(String(ccy))).resolves.toBe(
      price,
    );
    expect(http.get).toHaveBeenCalledWith(
      'https://api.coingecko.com/api/v3/simple/price',
      expect.objectContaining({ params: { ids: id, vs_currencies: 'usd' } }),
    );
  });

  it.each([undefined, null, '', ' ', 0, -1, NaN, Infinity, true, {}])(
    'rejects an invalid price: %s',
    async (price) => {
      vi.mocked(http.get).mockResolvedValue({
        value: { bitcoin: { usd: price } },
      });
      await expect(MarketService.fetchPxFromCoinGecko('BTC')).rejects.toThrow();
    },
  );

  it('rejects unsupported currencies without making a request', async () => {
    await expect(
      MarketService.fetchPxFromCoinGecko('UNKNOWN'),
    ).rejects.toThrow();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('awaits fallback prices before publishing the BTC/ETH result', async () => {
    vi.mocked(http.get).mockImplementation(async (url, config) => {
      if (!url.includes('coingecko')) throw new Error('offline');
      return {
        value: {
          [config?.params.ids]: {
            usd: config?.params.ids === 'bitcoin' ? 60000 : 2000,
          },
        },
      };
    });
    await expect(MarketService.$fetchIndexPx()).resolves.toEqual({
      BTC: 60000,
      ETH: 2000,
    });
  });

  it('propagates an unavailable fallback instead of returning a price', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('offline'));
    await expect(MarketService.fetchPxFromCoinGecko('BTC')).rejects.toThrow(
      'offline',
    );
  });
});

describe('BTC/ETH source selection', () => {
  it.each(['BTC', 'ETH'] as const)(
    'prefers Binance for %s and skips fallback sources',
    async (ccy) => {
      vi.mocked(http.get).mockResolvedValue({
        value: { symbol: `${ccy}USDT`, price: '60000' },
      });
      await expect(MarketService.$$fetchIndexPx(ccy)).resolves.toBe(60000);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(
        `https://data-api.binance.vision/api/v3/ticker/price?symbol=${ccy}USDT`,
        expect.objectContaining({
          timeout: 5000,
          'axios-retry': { retries: 0 },
        }),
      );
    },
  );

  it('falls back to Coinbase when Binance returns an invalid price', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({ value: { price: '' } })
      .mockResolvedValueOnce({ value: { price: '61000' } });
    await expect(MarketService.$$fetchIndexPx('BTC')).resolves.toBe(61000);
    expect(vi.mocked(http.get).mock.calls.map(([url]) => url)).toEqual([
      'https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT',
      'https://api.exchange.coinbase.com/products/BTC-USDT/ticker',
    ]);
  });

  it('tries CoinGecko after both exchange sources fail', async () => {
    vi.mocked(http.get)
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ value: { ethereum: { usd: 2100 } } });
    await expect(MarketService.$$fetchIndexPx('ETH')).resolves.toBe(2100);
    expect(
      vi.mocked(http.get).mock.calls.map(([url]) => new URL(url).hostname),
    ).toEqual([
      'data-api.binance.vision',
      'api.exchange.coinbase.com',
      'api.coingecko.com',
    ]);
  });

  it('rejects when every source is unavailable', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('offline'));
    await expect(MarketService.$$fetchIndexPx('BTC')).rejects.toThrow(
      'offline',
    );
    expect(http.get).toHaveBeenCalledTimes(3);
  });

  it('moves to Coinbase after the bounded Binance request times out', async () => {
    vi.useFakeTimers();
    vi.mocked(http.get).mockImplementation((url, options) => {
      if (url.includes('binance'))
        return new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), options?.timeout),
        );
      return Promise.resolve({ value: { price: '61000' } });
    });
    const result = MarketService.$$fetchIndexPx('BTC');
    await vi.advanceTimersByTimeAsync(5000);
    await expect(result).resolves.toBe(61000);
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('shares concurrent calls and retains the actual cache timestamp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    vi.mocked(http.get).mockResolvedValue({ value: { price: '60000' } });
    const [first, concurrent] = await Promise.all([
      MarketService.fetchIndexQuote('BTC'),
      MarketService.fetchIndexQuote('BTC'),
    ]);
    expect(first).toEqual({ price: 60000, updatedAt: 100000 });
    expect(concurrent).toEqual(first);
    expect(http.get).toHaveBeenCalledTimes(1);
    vi.setSystemTime(105000);
    expect(await MarketService.fetchIndexQuote('BTC')).toEqual(first);
    vi.setSystemTime(110001);
    expect(await MarketService.fetchIndexQuote('BTC')).toEqual({
      price: 60000,
      updatedAt: 110001,
    });
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('does not give cached CoinGecko prices a new timestamp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    vi.mocked(http.get).mockImplementation(async (url) => {
      if (!url.includes('coingecko')) throw new Error('offline');
      return { value: { bitcoin: { usd: 60000 } } };
    });
    await MarketService.fetchIndexQuote('BTC');
    vi.setSystemTime(111000);
    expect(await MarketService.fetchIndexQuote('BTC')).toEqual({
      price: 60000,
      updatedAt: 100000,
    });
    expect(
      vi
        .mocked(http.get)
        .mock.calls.filter(([url]) => url.includes('coingecko')),
    ).toHaveLength(1);
  });
});
