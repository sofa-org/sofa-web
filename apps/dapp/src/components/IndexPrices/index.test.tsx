import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sofa/services/market', () => ({ MarketService: {} }));
vi.mock('@sofa/utils/hooks', () => ({ useLazyCallback: (fn: unknown) => fn }));
vi.mock('@sofa/services/i18n', () => ({
  useTranslation: () => [(text: string) => text],
}));
vi.mock('@/locales', () => ({ addI18nResources: vi.fn() }));
vi.mock('../MobileOnly', () => ({
  MobileOnly: () => null,
  useIsMobileUI: () => false,
}));
vi.mock('@/assets/icon-arrow-up.svg', () => ({
  Comp: () => <svg aria-label="up" />,
}));
vi.mock('@/assets/icon-arrow-down.svg', () => ({
  Comp: () => <svg aria-label="down" />,
}));
vi.mock('@/assets/icon-btc.svg', () => ({ Comp: () => <svg /> }));
vi.mock('@/assets/icon-eth.svg', () => ({ Comp: () => <svg /> }));

import { IndexPrice } from './index';
import { useIndexPrices } from './store';

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  useIndexPrices.setState({ prices: {}, quotes: {} });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('IndexPrice display', () => {
  it('shows a missing price without a direction arrow after the first failure', () => {
    useIndexPrices.setState({
      quotes: { BTC: { loading: false, error: 'offline' } },
    });
    act(() => root.render(<IndexPrice ccy="BTC" />));
    expect(container.textContent).toContain('--');
    expect(
      container.querySelector('[aria-label="up"], [aria-label="down"]'),
    ).toBeNull();
  });

  it('shows a live quote before a full valuation snapshot is ready', () => {
    useIndexPrices.setState({
      quotes: { BTC: { price: 60000, updatedAt: 100, loading: false } },
    });
    act(() => root.render(<IndexPrice ccy="BTC" />));
    expect(container.textContent).toContain('60,000');
    expect(
      container.querySelector('[aria-label="up"], [aria-label="down"]'),
    ).toBeNull();
    expect(useIndexPrices.getState().prices).toEqual({});
  });

  it('keeps the last price visibly marked through a failed refresh and removes the mark on recovery', () => {
    useIndexPrices.setState({
      quotes: { BTC: { price: 60000, updatedAt: 100, loading: false } },
    });
    act(() => root.render(<IndexPrice ccy="BTC" />));
    act(() =>
      useIndexPrices.setState({
        quotes: {
          BTC: {
            price: 60000,
            updatedAt: 100,
            loading: true,
            error: 'offline',
          },
        },
      }),
    );
    expect(container.textContent).toContain('60,000');
    expect(container.textContent).toContain('Not updated');
    expect(
      container.querySelector('[aria-label="up"], [aria-label="down"]'),
    ).toBeNull();
    act(() =>
      useIndexPrices.setState({
        quotes: { BTC: { price: 61000, updatedAt: 200, loading: false } },
      }),
    );
    expect(container.textContent).not.toContain('Not updated');
    expect(container.querySelector('[aria-label="up"]')).not.toBeNull();
  });
});
