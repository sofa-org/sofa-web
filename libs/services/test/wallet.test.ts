import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => vi.stubGlobal('window', {}));
vi.mock('@sofa/utils/sentry', () => ({ sentry: {} }));
vi.mock('@web3-name-sdk/core', () => ({ createWeb3Name: vi.fn() }));
vi.mock('../wallet-connect', () => ({ WalletConnect: {} }));
vi.mock('../chains', () => ({ ChainMap: {} }));
vi.mock('../contracts', () => ({
  ContractsService: {},
  TransactionStatus: { FAILED: 'FAILED', SUCCESS: 'SUCCESS' },
}));
vi.mock('../products', () => ({ ProductsService: {} }));

import { ethers } from 'ethers';

import { TransactionStatus } from '../contracts';
import { getPendingTransactionConfirmations } from '../transaction-confirmation';
import { WalletService } from '../wallet';

let hash: string;
let hashIndex = 0;
const tx = { to: '0xVault', from: '0xWallet', data: '0x1234', value: 12n };
const receipt = { status: 0, blockNumber: 123, logs: [] };
const provider = {
  getTransactionReceipt: vi.fn(),
  getTransaction: vi.fn(),
  call: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  // Each test uses a different transaction, independent of asyncShare's cache.
  hash = `0x${(++hashIndex).toString(16).padStart(64, '0')}`;
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key),
    setItem: (key: string, value: string) => entries.set(key, value),
  });
  provider.getTransactionReceipt.mockReset().mockResolvedValue(receipt);
  provider.getTransaction.mockReset().mockResolvedValue(tx);
  provider.call.mockReset().mockResolvedValue('0x');
  vi.spyOn(WalletService, 'readonlyConnect').mockResolvedValue(
    provider as unknown as Awaited<
      ReturnType<typeof WalletService.readonlyConnect>
    >,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('confirmed transaction failures', () => {
  it('preserves the original revert error in a confirmed failure', async () => {
    const error = ethers.makeError(
      'execution reverted: signature consumed',
      'CALL_EXCEPTION',
      {
        action: 'call',
        data: null,
        reason: 'signature consumed',
        transaction: tx,
        invocation: null,
        revert: null,
      },
    );
    provider.call.mockRejectedValue(error);
    await expect(WalletService.transactionResult(hash, 1)).resolves.toEqual({
      status: TransactionStatus.FAILED,
      error,
    });
    expect(provider.call).toHaveBeenCalledWith({
      ...tx,
      blockTag: receipt.blockNumber,
    });
    expect(getPendingTransactionConfirmations()).toEqual([]);
  });

  it.each(['getTransaction', 'call'] as const)(
    'keeps FAILED if %s is unavailable',
    async (method) => {
      provider[method].mockRejectedValue(new Error('RPC unavailable'));
      await expect(WalletService.transactionResult(hash, 1)).resolves.toEqual({
        status: TransactionStatus.FAILED,
      });
      expect(getPendingTransactionConfirmations()).toEqual([]);
      expect(provider.getTransactionReceipt).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['getTransaction', 'call'] as const)(
    'bounds a hanging %s without changing FAILED',
    async (method) => {
      provider[method].mockImplementation(() => new Promise(() => {}));
      const result = WalletService.transactionResult(hash, 1);
      const settled = vi.fn();
      void result.then(settled);
      await vi.advanceTimersByTimeAsync(4999);
      expect(settled).not.toHaveBeenCalled();
      expect(getPendingTransactionConfirmations()).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      await expect(result).resolves.toEqual({
        status: TransactionStatus.FAILED,
      });
      expect(provider.getTransactionReceipt).toHaveBeenCalledTimes(1);
    },
  );

  it('shares the diagnosis budget across transaction retrieval and replay', async () => {
    provider.getTransaction.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(tx), 4000)),
    );
    provider.call.mockImplementation(() => new Promise(() => {}));
    const result = WalletService.transactionResult(hash, 1);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(result).resolves.toEqual({ status: TransactionStatus.FAILED });
    expect(Date.now()).toBe(5000);
  });

  it('limits diagnosis to the remaining confirmation budget', async () => {
    provider.getTransactionReceipt.mockImplementation(async () =>
      Date.now() < 59_000 ? null : receipt,
    );
    provider.call.mockImplementation(() => new Promise(() => {}));
    const result = WalletService.transactionResult(hash, 1);
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(result).resolves.toEqual({ status: TransactionStatus.FAILED });
    expect(getPendingTransactionConfirmations()).toEqual([]);
  });

  it('returns FAILED when the original transaction is unavailable', async () => {
    provider.getTransaction.mockResolvedValue(null);
    await expect(WalletService.transactionResult(hash, 1)).resolves.toEqual({
      status: TransactionStatus.FAILED,
    });
    expect(provider.call).not.toHaveBeenCalled();
  });

  it('returns success without running failure diagnosis', async () => {
    provider.getTransactionReceipt.mockResolvedValue({ ...receipt, status: 1 });
    await expect(WalletService.transactionResult(hash, 1)).resolves.toEqual({
      status: TransactionStatus.SUCCESS,
      logs: [],
    });
    expect(provider.getTransaction).not.toHaveBeenCalled();
  });
});
