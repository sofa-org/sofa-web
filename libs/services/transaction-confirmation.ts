export interface PendingTransactionConfirmation {
  hash: string;
  chainId: number;
  firstSeenAt: number;
  reason?: 'timeout' | 'rpc-unavailable';
}

export class TransactionConfirmationPendingError extends Error {
  readonly code = 'TRANSACTION_CONFIRMATION_PENDING';
  readonly cause?: unknown;
  constructor(
    readonly hash: string,
    readonly chainId: number,
    readonly reason: 'timeout' | 'rpc-unavailable' = 'timeout',
    options?: { cause?: unknown },
  ) {
    super(`Transaction confirmation pending: ${hash}`);
    this.name = 'TransactionConfirmationPendingError';
    this.cause = options?.cause;
  }
}

export function isTransactionConfirmationPendingError(
  error: unknown,
): error is TransactionConfirmationPendingError {
  if (!error || typeof error !== 'object') return false;
  const value = error as {
    code?: unknown;
    hash?: unknown;
    chainId?: unknown;
    reason?: unknown;
  };
  return (
    value.code === 'TRANSACTION_CONFIRMATION_PENDING' &&
    typeof value.hash === 'string' &&
    /^0x[\da-f]{64}$/i.test(value.hash) &&
    typeof value.chainId === 'number' &&
    Number.isFinite(value.chainId) &&
    value.chainId > 0 &&
    (value.reason === 'timeout' || value.reason === 'rpc-unavailable')
  );
}

/** Resolves/rejects within a deadline and always clears its timer. The attached
 * handlers also observe a late rejection from an operation that cannot be cancelled. */
export function withConfirmationAttemptTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(
      () => {
        if (settled) return;
        settled = true;
        reject(new Error('Transaction confirmation RPC attempt timed out'));
      },
      Math.max(0, timeoutMs),
    );
    Promise.resolve(operation).then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const pendingTransactionConfirmationStorageKey =
  'sofa:pending-transaction-confirmations';
let memory: PendingTransactionConfirmation[] = [];
let memoryOnly = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      // UI errors must not change the result of a transaction confirmation.
      console.error(error);
    }
  }
}

function onStorage(event: StorageEvent) {
  if (
    !memoryOnly &&
    (event.key === pendingTransactionConfirmationStorageKey ||
      event.key === null)
  ) {
    notifyListeners();
  }
}

export function subscribePendingTransactionConfirmations(listener: () => void) {
  const callback = () => listener();
  if (!listeners.size && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
    if (!listeners.size && typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

function valid(value: unknown): value is PendingTransactionConfirmation {
  if (!value || typeof value !== 'object') return false;
  const item = value as PendingTransactionConfirmation;
  return (
    typeof item.hash === 'string' &&
    /^0x[\da-f]{64}$/i.test(item.hash) &&
    Number.isFinite(item.chainId) &&
    item.chainId > 0 &&
    Number.isFinite(item.firstSeenAt) &&
    (item.reason === undefined ||
      item.reason === 'timeout' ||
      item.reason === 'rpc-unavailable')
  );
}
function load(): PendingTransactionConfirmation[] {
  if (memoryOnly) return memory.map((item) => ({ ...item }));
  try {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error('Local storage is unavailable');
    const value = JSON.parse(
      storage.getItem(pendingTransactionConfirmationStorageKey) || '[]',
    );
    memory = Array.isArray(value) ? value.filter(valid) : [];
  } catch {
    memoryOnly = true;
  }
  return memory.map((item) => ({ ...item }));
}
function save(items: PendingTransactionConfirmation[]) {
  memory = items.map((item) => ({ ...item }));
  if (!memoryOnly) {
    try {
      const storage = globalThis.localStorage;
      if (!storage) throw new Error('Local storage is unavailable');
      storage.setItem(
        pendingTransactionConfirmationStorageKey,
        JSON.stringify(memory),
      );
    } catch {
      // Keep this session in memory mode; never replay stale records into storage.
      memoryOnly = true;
    }
  }
  notifyListeners();
}
export function getPendingTransactionConfirmations(): PendingTransactionConfirmation[] {
  return load();
}
export function registerPendingTransactionConfirmation(
  hash: string,
  chainId: number,
  firstSeenAt = Date.now(),
) {
  if (!valid({ hash, chainId, firstSeenAt })) return;
  const items = load();
  if (
    !items.some(
      (item) =>
        item.hash.toLowerCase() === hash.toLowerCase() &&
        item.chainId === chainId,
    )
  )
    items.push({ hash, chainId, firstSeenAt });
  save(items);
}
export function updatePendingTransactionConfirmation(
  hash: string,
  chainId: number,
  reason: PendingTransactionConfirmation['reason'],
) {
  save(
    load().map((item) =>
      item.hash.toLowerCase() === hash.toLowerCase() && item.chainId === chainId
        ? { ...item, reason }
        : item,
    ),
  );
}
export function removePendingTransactionConfirmation(
  hash: string,
  chainId: number,
) {
  save(
    load().filter(
      (item) =>
        item.hash.toLowerCase() !== hash.toLowerCase() ||
        item.chainId !== chainId,
    ),
  );
}
