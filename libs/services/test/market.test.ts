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

import { MarketService } from '../market';

beforeEach(() => {
  vi.clearAllMocks();
  DecoratorMemoryCache.clear();
  vi.stubGlobal('asyncStorage', { get: vi.fn(), set: vi.fn() });
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
