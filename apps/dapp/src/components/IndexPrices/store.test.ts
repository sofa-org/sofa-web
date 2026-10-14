import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sofa/services/market', () => ({
  MarketService: { subscribeIndexPx: vi.fn() },
}));
vi.mock('@sofa/utils/hooks', () => ({ useLazyCallback: vi.fn() }));

import { IndexPriceUpdate, MarketService } from '@sofa/services/market';

import { useIndexPrices } from './store';

let update: (event: IndexPriceUpdate) => void;
let snapshot: (prices: Record<string, number>) => void;

beforeEach(() => {
  useIndexPrices.setState({ prices: {}, quotes: {} });
  vi.mocked(MarketService.subscribeIndexPx).mockImplementation(
    (onSnapshot, onUpdate) => {
      snapshot = onSnapshot;
      update = onUpdate!;
      return Object.assign(Promise.resolve(), { unsubscribe: async () => {} });
    },
  );
  useIndexPrices.subscribePrices();
});

describe('index price state', () => {
  it('merges independent quotes without publishing a partial valuation snapshot', () => {
    update({
      ccy: 'ETH',
      type: 'success',
      quote: { price: 2000, updatedAt: 100 },
    });
    update({
      ccy: 'RCH',
      type: 'success',
      quote: { price: 0.5, updatedAt: 200 },
    });
    expect(useIndexPrices.getState().quotes.ETH?.price).toBe(2000);
    expect(useIndexPrices.getState().quotes.RCH?.price).toBe(0.5);
    expect(useIndexPrices.getState().prices).toEqual({});
    snapshot({ BTC: 60000, ETH: 2000, RCH: 0.5, scrvUSD: 1.1 });
    update({
      ccy: 'RCH',
      type: 'success',
      quote: { price: 0.6, updatedAt: 300 },
    });
    expect(useIndexPrices.getState().prices.RCH).toBe(0.5);
    expect(useIndexPrices.getState().prices.scrvUSD).toBe(1.1);
  });

  it('retains a failed quote and its timestamp throughout retries, then clears the error on success', () => {
    update({
      ccy: 'BTC',
      type: 'success',
      quote: { price: 60000, updatedAt: 100 },
    });
    update({ ccy: 'BTC', type: 'error', error: 'offline' });
    update({ ccy: 'BTC', type: 'loading' });
    expect(useIndexPrices.getState().quotes.BTC).toEqual({
      price: 60000,
      updatedAt: 100,
      loading: true,
      error: 'offline',
    });
    update({
      ccy: 'BTC',
      type: 'success',
      quote: { price: 61000, updatedAt: 200 },
    });
    expect(useIndexPrices.getState().quotes.BTC).toEqual({
      price: 61000,
      updatedAt: 200,
      loading: false,
      error: undefined,
    });
  });

  it('keeps a first failure missing and synchronizes wrapped currencies with their base', () => {
    update({ ccy: 'ETH', type: 'error', error: 'offline' });
    expect(useIndexPrices.getState().quotes.ETH?.price).toBeUndefined();
    expect(useIndexPrices.getState().quotes.WETH).toEqual(
      useIndexPrices.getState().quotes.ETH,
    );
    update({
      ccy: 'ETH',
      type: 'success',
      quote: { price: 2000, updatedAt: 100 },
    });
    expect(useIndexPrices.getState().quotes.WETH).toEqual(
      useIndexPrices.getState().quotes.ETH,
    );
    expect(useIndexPrices.getState().quotes.stETH).toEqual(
      useIndexPrices.getState().quotes.ETH,
    );
    update({
      ccy: 'BTC',
      type: 'success',
      quote: { price: 60000, updatedAt: 100 },
    });
    expect(useIndexPrices.getState().quotes.WBTC).toEqual(
      useIndexPrices.getState().quotes.BTC,
    );
  });
});
