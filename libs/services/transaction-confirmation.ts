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
  const value = error as { code?: unknown; hash?: unknown; chainId?: unknown; reason?: unknown };
  return value.code === 'TRANSACTION_CONFIRMATION_PENDING' &&
    typeof value.hash === 'string' && /^0x[\da-f]{64}$/i.test(value.hash) &&
    typeof value.chainId === 'number' && Number.isFinite(value.chainId) && value.chainId > 0 &&
    (value.reason === 'timeout' || value.reason === 'rpc-unavailable');
}

/** Resolves/rejects within a deadline and always clears its timer. The attached
 * handlers also observe a late rejection from an operation that cannot be cancelled. */
export function withConfirmationAttemptTimeout<T>(operation: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Transaction confirmation RPC attempt timed out'));
    }, Math.max(0, timeoutMs));
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

const storageKey = 'sofa:pending-transaction-confirmations';
let memory: PendingTransactionConfirmation[] = [];

function valid(value: unknown): value is PendingTransactionConfirmation {
  if (!value || typeof value !== 'object') return false;
  const item = value as PendingTransactionConfirmation;
  return typeof item.hash === 'string' && /^0x[\da-f]{64}$/i.test(item.hash) && Number.isFinite(item.chainId) && item.chainId > 0 &&
    Number.isFinite(item.firstSeenAt) &&
    (item.reason === undefined || item.reason === 'timeout' || item.reason === 'rpc-unavailable');
}
function load(): PendingTransactionConfirmation[] {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(storageKey) || '[]');
    const stored = Array.isArray(value) ? value.filter(valid) : [];
    const combined = [...stored];
    for (const item of memory) {
      if (!combined.some((candidate) => candidate.hash.toLowerCase() === item.hash.toLowerCase() && candidate.chainId === item.chainId)) combined.push(item);
    }
    memory = combined.map((item) => ({ ...item }));
    return combined.map((item) => ({ ...item }));
  } catch { return memory.map((item) => ({ ...item })); }
}
function save(items: PendingTransactionConfirmation[]) {
  memory = items.map((item) => ({ ...item }));
  try { globalThis.localStorage?.setItem(storageKey, JSON.stringify(memory)); } catch { /* memory fallback */ }
}
export function getPendingTransactionConfirmations(): PendingTransactionConfirmation[] { return load().map((item) => ({ ...item })); }
export function registerPendingTransactionConfirmation(hash: string, chainId: number, firstSeenAt = Date.now()) {
  if (!valid({ hash, chainId, firstSeenAt })) return;
  const items = load();
  if (!items.some((item) => item.hash.toLowerCase() === hash.toLowerCase() && item.chainId === chainId))
    items.push({ hash, chainId, firstSeenAt });
  save(items);
}
export function updatePendingTransactionConfirmation(hash: string, chainId: number, reason: PendingTransactionConfirmation['reason']) {
  save(load().map((item) => item.hash.toLowerCase() === hash.toLowerCase() && item.chainId === chainId ? { ...item, reason } : item));
}
export function removePendingTransactionConfirmation(hash: string, chainId: number) {
  save(load().filter((item) => item.hash.toLowerCase() !== hash.toLowerCase() || item.chainId !== chainId));
}
