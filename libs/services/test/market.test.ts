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
