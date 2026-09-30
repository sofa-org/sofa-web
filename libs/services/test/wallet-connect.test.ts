import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => vi.stubGlobal('window', {}));
vi.mock('@sofa/utils/env', () => ({
  Env: {
    get isMobile() {
      return false;
    },
    isTelegram: false,
  },
}));
vi.mock('@sofa/utils/sentry', () => ({ sentry: {} }));
vi.mock('@sofa/utils/wallet/eip-6963', () => ({
  getProviderByEip6963: vi.fn(),
}));
vi.mock('@uxuycom/web3-tg-sdk', () => ({ WalletTgSdk: vi.fn() }));
vi.mock('@web3modal/ethers', () => ({
  createWeb3Modal: vi.fn(),
  defaultConfig: vi.fn(),
}));
vi.mock('../chains', () => ({
  ChainMap: {
    1: { chainId: 1, rpcUrlsForAddNetwork: [] },
    10: { chainId: 10, rpcUrlsForAddNetwork: [] },
  },
}));
vi.mock('ethers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ethers')>()),
  BrowserProvider: class {
    constructor(
      private raw: { request(args: { method: string }): Promise<unknown> },
    ) {}
    send(method: string) {
      return this.raw.request({ method });
    }
    async _detectNetwork() {
      return { chainId: BigInt((await this.send('eth_chainId')) as string) };
    }
    async getSigner() {
      const [address] = (await this.send('eth_accounts')) as string[];
      return { address, getAddress: async () => address };
    }
  },
}));

import { Env } from '@sofa/utils/env';
import { getProviderByEip6963 } from '@sofa/utils/wallet/eip-6963';

import { WalletConnect } from '../wallet-connect';

const addressA = `0x${'a'.repeat(40)}`;
const addressB = `0x${'b'.repeat(40)}`;
let accounts: string[];
let chainId: number;
let raw: ReturnType<typeof createProvider>;
let selected: typeof raw;
let unsubscribe: (() => void) | undefined;

function createProvider() {
  return Object.assign(new EventEmitter(), {
    request: vi.fn(
      async ({ method }: { method: string }): Promise<unknown> =>
        method === 'eth_chainId' ? `0x${chainId.toString(16)}` : [...accounts],
    ),
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function cache(address = addressA) {
  WalletConnect._wallet = {
    id: 'test',
    type: 'INJECTED',
    chainId: 1,
    rawProvider: raw,
    originProvider: raw,
    provider: {} as NonNullable<typeof WalletConnect._wallet>['provider'],
    signer: { address, getAddress: async () => address } as NonNullable<
      typeof WalletConnect._wallet
    >['signer'],
    disconnect: vi.fn(),
  };
  return WalletConnect._wallet;
}

beforeEach(() => {
  vi.useFakeTimers();
  accounts = [addressA];
  chainId = 1;
  raw = createProvider();
  selected = raw;
  vi.spyOn(WalletConnect, '$getModalProvider').mockImplementation(
    async () => selected,
  );
  vi.spyOn(WalletConnect, 'getModal').mockResolvedValue({
    getWalletProvider: () => selected,
    getConnectors: () => [{ id: 'test', type: 'INJECTED', provider: selected }],
    close: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
  } as unknown as Awaited<ReturnType<typeof WalletConnect.getModal>>);
  vi.mocked(getProviderByEip6963).mockImplementation(async () => [
    {
      provider: selected,
      info: { uuid: 'test', name: 'test', icon: '', rdns: 'test' },
    },
  ]);
  cache();
});

afterEach(async () => {
  unsubscribe?.();
  unsubscribe = undefined;
  await WalletConnect.disconnect();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe.each([false, true])('connection sharing (mobile=%s)', (mobile) => {
  beforeEach(() => {
    vi.spyOn(Env, 'isMobile', 'get').mockReturnValue(mobile);
  });

  it.each(['account', 'chain'])(
    'shares requests while rebuilding a stale %s cache',
    async (stale) => {
      if (stale === 'account') accounts = [addressB];
      else chainId = 10;
      const signer = deferred<string[]>();
      const rebuilding = deferred<void>();
      let accountReads = 0;
      raw.request.mockImplementation(async ({ method }) => {
        if (method === 'eth_chainId') return `0x${chainId.toString(16)}`;
        if (++accountReads === 1) return [...accounts];
        rebuilding.resolve();
        return signer.promise;
      });
      const first = WalletConnect.connect(chainId);
      await rebuilding.promise;
      const second = WalletConnect.connect(chainId);
      const results = Promise.allSettled([first, second]);
      await vi.advanceTimersByTimeAsync(0);
      signer.resolve([...accounts]);

      const outcomes = await results;
      expect(outcomes.map((it) => it.status)).toEqual([
        'fulfilled',
        'fulfilled',
      ]);
      expect(await first).toBe(await second);
      expect((await first).signer.address).toBe(accounts[0]);
    },
  );

  it('allows a request whose provider lookup overlaps a successful connection', async () => {
    accounts = [addressB];
    const modal = await WalletConnect.getModal();
    const lookup = deferred<typeof modal>();
    vi.mocked(WalletConnect.getModal).mockReturnValueOnce(lookup.promise);
    const waiting = WalletConnect.connect(1);
    const connected = await WalletConnect.connect(1);
    lookup.resolve(modal);
    await expect(waiting).resolves.toBe(connected);
  });

  it('starts a new request after disconnect and rejects the late old result', async () => {
    accounts = [addressB];
    const signer = deferred<string[]>();
    const rebuilding = deferred<void>();
    let accountReads = 0;
    raw.request.mockImplementation(async ({ method }) => {
      if (method === 'eth_chainId') return '0x1';
      if (++accountReads === 2) {
        rebuilding.resolve();
        return signer.promise;
      }
      return [...accounts];
    });
    const old = WalletConnect.connect(1);
    const rejected = expect(old).rejects.toThrow();
    await rebuilding.promise;
    await WalletConnect.disconnect();
    const connected = await WalletConnect.connect(1);
    signer.resolve([addressB]);
    await rejected;
    expect(WalletConnect._wallet).toBe(connected);
  });

  it('does not reuse a superseded request when returning to its provider', async () => {
    accounts = [addressB];
    const signer = deferred<string[]>();
    const rebuilding = deferred<void>();
    let accountReads = 0;
    raw.request.mockImplementation(async ({ method }) => {
      if (method === 'eth_chainId') return '0x1';
      if (++accountReads === 2) {
        rebuilding.resolve();
        return signer.promise;
      }
      return [...accounts];
    });
    const old = WalletConnect.connect(1);
    const rejected = expect(old).rejects.toThrow();
    await rebuilding.promise;
    selected = createProvider();
    await WalletConnect.connect(1);
    selected = raw;
    const returning = WalletConnect.connect(1);
    const restored = expect(returning).resolves.toMatchObject({
      rawProvider: raw,
    });
    await vi.advanceTimersByTimeAsync(0);
    signer.resolve([addressB]);
    await rejected;
    await restored;
    expect(WalletConnect._wallet).toBe(await returning);
  });
});

describe('account subscriptions', () => {
  it('keeps a cached connection valid when initialization overlaps validation', async () => {
    const cached = WalletConnect._wallet;
    const validation = deferred<string[]>();
    const requested = deferred<void>();
    raw.request.mockImplementation(async ({ method }) => {
      if (method === 'eth_chainId') return '0x1';
      requested.resolve();
      return validation.promise;
    });
    const connection = WalletConnect.connect(1);
    await requested.promise;
    raw.request.mockResolvedValue([addressA.toUpperCase()]);
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    raw.emit('accountsChanged', [addressA]);
    validation.resolve([addressA]);

    await expect(connection).resolves.toBe(cached);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(addressA);
    expect(WalletConnect._wallet).toBe(cached);
  });

  it.each([{ next: [addressB] }, { next: [] }])(
    'invalidates a cached signer on an actual account change: $next',
    async ({ next }) => {
      const cb = vi.fn();
      unsubscribe = await WalletConnect.subscribeAccountChange(cb);
      accounts = next;
      raw.emit('accountsChanged', accounts);
      expect(WalletConnect._wallet).toBeUndefined();
      expect(cb).toHaveBeenLastCalledWith(accounts[0]);
      await vi.advanceTimersByTimeAsync(3000);
      expect(cb).toHaveBeenCalledTimes(2);
    },
  );

  it('invalidates a stale cached signer during initialization', async () => {
    accounts = [addressB];
    unsubscribe = await WalletConnect.subscribeAccountChange(vi.fn());
    expect(WalletConnect._wallet).toBeUndefined();
  });

  it('cancels cached connection validation when the account actually changes', async () => {
    unsubscribe = await WalletConnect.subscribeAccountChange(vi.fn());
    const validation = deferred<string[]>();
    const requested = deferred<void>();
    raw.request.mockImplementation(async ({ method }) => {
      if (method === 'eth_chainId') return '0x1';
      requested.resolve();
      return validation.promise;
    });
    const connection = WalletConnect.connect(1);
    const assertion = expect(connection).rejects.toThrow(
      'Wallet connection was cancelled',
    );
    await requested.promise;
    raw.emit('accountsChanged', [addressB]);
    validation.resolve([addressA]);
    await assertion;
    expect(WalletConnect._wallet).toBeUndefined();
  });

  it('applies a slow poll without overlapping reads or waiting for an event', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    raw.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([addressB]), 5000);
        }),
    );
    await vi.advanceTimersByTimeAsync(8000);
    expect(cb.mock.calls).toEqual([[addressA], [addressB]]);
    expect(WalletConnect._wallet).toBeUndefined();
    expect(raw.request).toHaveBeenCalledTimes(2);
  });

  it('ignores an initial read superseded by an account event', async () => {
    const initial = deferred<string[]>();
    const requested = deferred<void>();
    raw.request.mockImplementationOnce(() => {
      requested.resolve();
      return initial.promise;
    });
    const cb = vi.fn();
    const subscription = WalletConnect.subscribeAccountChange(cb);
    await requested.promise;
    raw.emit('accountsChanged', [addressB]);
    initial.resolve([addressA]);
    unsubscribe = await subscription;
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(addressB);
  });

  it('does not let a late poll undo an event or invalidate the new signer', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    const poll = deferred<string[]>();
    raw.request.mockImplementationOnce(() => poll.promise);
    await vi.advanceTimersByTimeAsync(3000);
    accounts = [addressB];
    raw.emit('accountsChanged', accounts);
    const cached = cache(addressB);
    poll.resolve([addressA]);
    await vi.advanceTimersByTimeAsync(3000);
    expect(cb.mock.calls).toEqual([[addressA], [addressB]]);
    expect(WalletConnect._wallet).toBe(cached);
  });

  it('ignores late reads after unsubscribe', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    const poll = deferred<string[]>();
    raw.request.mockImplementationOnce(() => poll.promise);
    await vi.advanceTimersByTimeAsync(3000);
    unsubscribe();
    poll.resolve([addressB]);
    await vi.advanceTimersByTimeAsync(0);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(addressA);
    expect(raw.listenerCount('accountsChanged')).toBe(0);
    expect(raw.listenerCount('disconnect')).toBe(0);
  });

  it('ignores a poll from before a new connection on the same provider', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    const poll = deferred<string[]>();
    raw.request.mockImplementationOnce(() => poll.promise);
    await vi.advanceTimersByTimeAsync(3000);
    accounts = [addressB];
    const connected = await WalletConnect.connect(1);
    poll.resolve([addressA]);
    await vi.advanceTimersByTimeAsync(0);
    expect(cb.mock.calls).toEqual([[addressA]]);
    expect(WalletConnect._wallet).toBe(connected);
    await vi.advanceTimersByTimeAsync(3000);
    expect(cb.mock.calls).toEqual([[addressA], [addressB]]);
    expect(WalletConnect._wallet).toBe(connected);
  });
});

describe('disconnect notifications', () => {
  beforeEach(async () => {
    await WalletConnect.disconnect();
  });

  it.each([
    { mobile: false, subscribeFirst: false },
    { mobile: false, subscribeFirst: true },
    { mobile: true, subscribeFirst: false },
    { mobile: true, subscribeFirst: true },
  ])(
    'clears the address on disconnect (mobile=$mobile, subscribeFirst=$subscribeFirst)',
    async ({ mobile, subscribeFirst }) => {
      vi.spyOn(Env, 'isMobile', 'get').mockReturnValue(mobile);
      const cb = vi.fn();
      if (subscribeFirst)
        unsubscribe = await WalletConnect.subscribeAccountChange(cb);
      await WalletConnect.connect(1);
      if (!subscribeFirst)
        unsubscribe = await WalletConnect.subscribeAccountChange(cb);
      const poll = deferred<string[]>();
      raw.request.mockImplementationOnce(() => poll.promise);
      await vi.advanceTimersByTimeAsync(3000);

      raw.emit('disconnect');
      expect(cb.mock.calls).toEqual([[addressA], [undefined]]);
      expect(WalletConnect._wallet).toBeUndefined();

      raw.emit('accountsChanged', []);
      raw.emit('disconnect');
      poll.resolve([addressA]);
      await vi.advanceTimersByTimeAsync(3000);
      expect(cb.mock.calls).toEqual([[addressA], [undefined]]);
      expect(WalletConnect._wallet).toBeUndefined();
    },
  );

  it('ignores disconnects and account events from a previous provider', async () => {
    await WalletConnect.connect(1);
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    selected = createProvider();
    const connected = await WalletConnect.connect(1);
    raw.emit('disconnect');
    raw.emit('accountsChanged', []);
    expect(cb.mock.calls).toEqual([[addressA]]);
    expect(WalletConnect._wallet).toBe(connected);
  });

  it('keeps a reconnection valid when a pre-disconnect account read returns', async () => {
    await WalletConnect.connect(1);
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    const poll = deferred<string[]>();
    raw.request.mockImplementationOnce(() => poll.promise);
    await vi.advanceTimersByTimeAsync(3000);
    raw.emit('disconnect');
    accounts = [addressB];
    const connected = await WalletConnect.connect(1);
    poll.resolve([addressA]);
    await vi.advanceTimersByTimeAsync(0);
    expect(cb.mock.calls).toEqual([[addressA], [undefined]]);
    expect(WalletConnect._wallet).toBe(connected);
    await vi.advanceTimersByTimeAsync(3000);
    expect(cb.mock.calls).toEqual([[addressA], [undefined], [addressB]]);
    expect(WalletConnect._wallet).toBe(connected);
  });

  it('reports an already disconnected provider when subscribing', async () => {
    await WalletConnect.connect(1);
    raw.emit('disconnect');
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeAccountChange(cb);
    expect(cb.mock.calls).toEqual([[undefined]]);
  });
});

describe('network subscriptions', () => {
  it('applies slow reads without overlapping polls and continues polling', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeNetworkChange(cb);
    raw.request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('0xa'), 5000);
        }),
    );
    await vi.advanceTimersByTimeAsync(6000);
    expect(raw.request).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(cb.mock.calls).toEqual([[1], [10]]);
    expect(WalletConnect._wallet).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1000);
    expect(cb.mock.calls).toEqual([[1], [10], [1]]);
  });

  it.each(['poll', 'event'] as const)(
    'preserves a new connection when the subscription catches up via %s',
    async (mode) => {
      const cb = vi.fn();
      unsubscribe = await WalletConnect.subscribeNetworkChange(cb);
      chainId = 10;
      const connected = await WalletConnect.connect(10);
      if (mode === 'event') raw.emit('chainChanged', '0xa');
      await vi.advanceTimersByTimeAsync(3000);
      expect(cb.mock.calls).toEqual([[1], [10]]);
      expect(WalletConnect._wallet).toBe(connected);
    },
  );

  it('discards a pre-connection poll while validating the new connection', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeNetworkChange(cb);
    const poll = deferred<string>();
    raw.request.mockImplementationOnce(() => poll.promise);
    await vi.advanceTimersByTimeAsync(3000);
    chainId = 10;
    const connected = await WalletConnect.connect(10);
    const validation = deferred<string[]>();
    const requested = deferred<void>();
    raw.request.mockImplementation(async ({ method }) => {
      if (method === 'eth_chainId') return '0xa';
      requested.resolve();
      return validation.promise;
    });
    const connection = WalletConnect.connect(10);
    await requested.promise;
    poll.resolve('0x1');
    await vi.advanceTimersByTimeAsync(0);
    expect(cb.mock.calls).toEqual([[1]]);
    expect(WalletConnect._wallet).toBe(connected);
    validation.resolve([addressA]);
    await expect(connection).resolves.toBe(connected);
    await vi.advanceTimersByTimeAsync(3000);
    expect(cb.mock.calls).toEqual([[1], [10]]);
    expect(WalletConnect._wallet).toBe(connected);
  });

  it('ignores an initial read superseded by a chain event', async () => {
    const initial = deferred<string>();
    const requested = deferred<void>();
    raw.request.mockImplementationOnce(() => {
      requested.resolve();
      return initial.promise;
    });
    const cb = vi.fn();
    const subscription = WalletConnect.subscribeNetworkChange(cb);
    await requested.promise;
    raw.emit('chainChanged', '0xa');
    initial.resolve('0x1');
    unsubscribe = await subscription;
    expect(cb.mock.calls).toEqual([[10]]);
    expect(WalletConnect._wallet).toBeUndefined();
  });

  it('ignores a late poll superseded by a chain event', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeNetworkChange(cb);
    const poll = deferred<string>();
    raw.request.mockImplementationOnce(() => poll.promise);
    await vi.advanceTimersByTimeAsync(3000);
    raw.emit('chainChanged', '0xa');
    poll.resolve('0x1');
    await vi.advanceTimersByTimeAsync(0);
    expect(cb.mock.calls).toEqual([[1], [10]]);
    expect(WalletConnect._wallet).toBeUndefined();
  });

  it('ignores reads and events after unsubscribe', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeNetworkChange(cb);
    const poll = deferred<string>();
    raw.request.mockImplementationOnce(() => poll.promise);
    await vi.advanceTimersByTimeAsync(3000);
    unsubscribe();
    poll.resolve('0xa');
    raw.emit('chainChanged', '0xa');
    await vi.advanceTimersByTimeAsync(3000);
    expect(cb.mock.calls).toEqual([[1]]);
    expect(raw.listenerCount('chainChanged')).toBe(0);
    expect(raw.request).toHaveBeenCalledTimes(2);
  });

  it('retries after a polling failure', async () => {
    const cb = vi.fn();
    unsubscribe = await WalletConnect.subscribeNetworkChange(cb);
    raw.request.mockRejectedValueOnce(new Error('RPC unavailable'));
    await vi.advanceTimersByTimeAsync(3000);
    chainId = 10;
    await vi.advanceTimersByTimeAsync(3000);
    expect(cb.mock.calls).toEqual([[1], [10]]);
    expect(WalletConnect._wallet).toBeUndefined();
  });
});

describe.each([
  {
    subscribe: WalletConnect.subscribeAccountChange,
    events: ['accountsChanged', 'disconnect'],
  },
  { subscribe: WalletConnect.subscribeNetworkChange, events: ['chainChanged'] },
])('subscription cleanup: $events', ({ subscribe, events }) => {
  it('removes listeners if the initial read fails', async () => {
    raw.request.mockRejectedValueOnce(new Error('RPC unavailable'));
    await expect(subscribe(() => {})).rejects.toThrow('RPC unavailable');
    for (const event of events) expect(raw.listenerCount(event)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('supports providers exposing removeListener without off', async () => {
    Object.defineProperty(raw, 'off', { value: undefined });
    unsubscribe = await subscribe(() => {});
    unsubscribe();
    for (const event of events) expect(raw.listenerCount(event)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
