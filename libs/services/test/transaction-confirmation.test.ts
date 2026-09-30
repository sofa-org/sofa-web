import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hash = `0x${'a'.repeat(64)}`;
const otherHash = `0x${'b'.repeat(64)}`;
let storage: Storage;
let unsubscribe: (() => void) | undefined;

async function newTab() {
  vi.resetModules();
  return import('../transaction-confirmation');
}

beforeEach(() => {
  const items = new Map<string, string>();
  storage = {
    get length() {
      return items.size;
    },
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
    clear: () => items.clear(),
    key: (index) => [...items.keys()][index] ?? null,
  };
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('pending transaction storage', () => {
  it.each(['storage', 'memory', 'write-failure'])(
    'notifies subscribers of same-page additions, updates and removals in %s mode',
    async (mode) => {
      if (mode === 'memory') vi.stubGlobal('localStorage', undefined);
      if (mode === 'write-failure')
        vi.spyOn(storage, 'setItem').mockImplementation(() => {
          throw new Error('Quota exceeded');
        });
      const tab = await newTab();
      const changed = vi.fn(() => tab.getPendingTransactionConfirmations());
      unsubscribe = tab.subscribePendingTransactionConfirmations(changed);
      tab.registerPendingTransactionConfirmation(hash, 1, 100);
      tab.updatePendingTransactionConfirmation(hash, 1, 'timeout');
      tab.removePendingTransactionConfirmation(hash, 1);
      expect(changed.mock.results.map((result) => result.value)).toEqual([
        [{ hash, chainId: 1, firstSeenAt: 100 }],
        [{ hash, chainId: 1, firstSeenAt: 100, reason: 'timeout' }],
        [],
      ]);
      unsubscribe();
      tab.registerPendingTransactionConfirmation(otherHash, 1);
      expect(changed).toHaveBeenCalledTimes(3);
    },
  );

  it('forwards relevant cross-tab events and removes the listener on unsubscribe', async () => {
    const window = new EventTarget();
    vi.stubGlobal('window', window);
    const tab = await newTab();
    tab.registerPendingTransactionConfirmation(hash, 1);
    const changed = vi.fn(() => tab.getPendingTransactionConfirmations());
    unsubscribe = tab.subscribePendingTransactionConfirmations(changed);
    storage.clear();
    const event = (key: string | null) =>
      Object.assign(new Event('storage'), { key });
    window.dispatchEvent(event('unrelated'));
    expect(changed).not.toHaveBeenCalled();
    window.dispatchEvent(event(tab.pendingTransactionConfirmationStorageKey));
    window.dispatchEvent(event(null));
    expect(changed.mock.results.map((result) => result.value)).toEqual([
      [],
      [],
    ]);
    unsubscribe();
    window.dispatchEvent(event(null));
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('does not let a failing subscriber interrupt storage updates or other subscribers', async () => {
    const tab = await newTab();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const stopFailing = tab.subscribePendingTransactionConfirmations(() => {
      throw new Error('Subscriber failed');
    });
    const changed = vi.fn();
    const stopOther = tab.subscribePendingTransactionConfirmations(changed);
    unsubscribe = () => {
      stopFailing();
      stopOther();
    };
    expect(() =>
      tab.registerPendingTransactionConfirmation(hash, 1),
    ).not.toThrow();
    expect(changed).toHaveBeenCalledOnce();
    expect(tab.getPendingTransactionConfirmations()).toHaveLength(1);
  });

  it('respects deletion by another tab during subsequent reads and writes', async () => {
    const tabA = await newTab();
    const tabB = await newTab();
    tabA.registerPendingTransactionConfirmation(hash, 1, 100);
    tabB.removePendingTransactionConfirmation(hash, 1);

    expect(tabA.getPendingTransactionConfirmations()).toEqual([]);
    tabA.updatePendingTransactionConfirmation(hash, 1, 'timeout');
    tabA.registerPendingTransactionConfirmation(otherHash, 1, 200);
    expect(tabB.getPendingTransactionConfirmations()).toEqual([
      { hash: otherHash, chainId: 1, firstSeenAt: 200 },
    ]);
  });

  it.each(['remove', 'clear'] as const)(
    'respects storage %s instead of restoring cached records',
    async (action) => {
      const tab = await newTab();
      tab.registerPendingTransactionConfirmation(hash, 1);
      if (action === 'remove') {
        localStorage.removeItem(tab.pendingTransactionConfirmationStorageKey);
      } else {
        localStorage.clear();
      }
      expect(tab.getPendingTransactionConfirmations()).toEqual([]);
    },
  );

  it('keeps independent records for each chain and returns defensive copies', async () => {
    const tab = await newTab();
    tab.registerPendingTransactionConfirmation(hash, 1, 100);
    tab.registerPendingTransactionConfirmation(hash.toUpperCase(), 1, 200);
    tab.registerPendingTransactionConfirmation(hash, 2, 300);
    const result = tab.getPendingTransactionConfirmations();
    result[0].firstSeenAt = 0;
    expect(tab.getPendingTransactionConfirmations()[0].firstSeenAt).toBe(100);
    tab.removePendingTransactionConfirmation(hash, 1);
    expect(tab.getPendingTransactionConfirmations()).toEqual([
      { hash, chainId: 2, firstSeenAt: 300 },
    ]);
  });

  it('supports registering, updating and removing without localStorage', async () => {
    vi.stubGlobal('localStorage', undefined);
    const tab = await newTab();
    tab.registerPendingTransactionConfirmation(hash, 1, 100);
    tab.updatePendingTransactionConfirmation(hash, 1, 'rpc-unavailable');
    expect(tab.getPendingTransactionConfirmations()).toEqual([
      { hash, chainId: 1, firstSeenAt: 100, reason: 'rpc-unavailable' },
    ]);
    tab.removePendingTransactionConfirmation(hash, 1);
    expect(tab.getPendingTransactionConfirmations()).toEqual([]);
  });

  it('preserves unsaved records after a write failure without replaying them', async () => {
    const tab = await newTab();
    tab.registerPendingTransactionConfirmation(hash, 1, 100);
    const failingWrite = vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    tab.registerPendingTransactionConfirmation(otherHash, 1, 200);
    failingWrite.mockRestore();
    localStorage.removeItem(tab.pendingTransactionConfirmationStorageKey);
    tab.updatePendingTransactionConfirmation(otherHash, 1, 'timeout');

    expect(tab.getPendingTransactionConfirmations()).toHaveLength(2);
    expect(tab.getPendingTransactionConfirmations()[1].reason).toBe('timeout');
    expect(
      localStorage.getItem(tab.pendingTransactionConfirmationStorageKey),
    ).toBeNull();
  });

  it('retains cached records when reads fail and stays in memory mode', async () => {
    const tab = await newTab();
    tab.registerPendingTransactionConfirmation(hash, 1, 100);
    const failingRead = vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('Storage access denied');
    });
    expect(tab.getPendingTransactionConfirmations()).toHaveLength(1);
    failingRead.mockRestore();
    localStorage.clear();
    tab.registerPendingTransactionConfirmation(otherHash, 1, 200);
    expect(tab.getPendingTransactionConfirmations()).toHaveLength(2);
    expect(
      localStorage.getItem(tab.pendingTransactionConfirmationStorageKey),
    ).toBeNull();
  });
});
