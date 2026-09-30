import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transactionResult: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Toast: { success: mocks.success, error: mocks.error },
}));
vi.mock('@sofa/services/chains', () => ({
  ChainMap: { 1: { name: 'Mainnet' } },
}));
vi.mock('@sofa/services/i18n', () => ({
  useTranslation: () => [(text: string) => text],
}));
vi.mock('@sofa/services/wallet', () => ({
  WalletService: { transactionResult: mocks.transactionResult },
}));
vi.mock('@/components/HashDisplay', () => ({
  HashDisplay: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));
vi.mock('@/locales', () => ({ addI18nResources: vi.fn() }));

import { TransactionStatus } from '@sofa/services/base-type';
import {
  getPendingTransactionConfirmations,
  pendingTransactionConfirmationStorageKey,
  registerPendingTransactionConfirmation,
  removePendingTransactionConfirmation,
  TransactionConfirmationPendingError,
  updatePendingTransactionConfirmation,
} from '@sofa/services/transaction-confirmation';

import { PendingTransactionConfirmations } from './index';

const hash = `0x${'a'.repeat(64)}`;
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', window.localStorage);
  localStorage.clear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('pending transaction panel', () => {
  it('keeps an unresolved check pending and releases the check button', async () => {
    registerPendingTransactionConfirmation(hash, 1);
    mocks.transactionResult.mockImplementation(async () => {
      updatePendingTransactionConfirmation(hash, 1, 'timeout');
      throw new TransactionConfirmationPendingError(hash, 1);
    });
    act(() => root.render(<PendingTransactionConfirmations visible />));
    await act(async () => container.querySelector('button')!.click());
    expect(container.textContent).toContain(hash);
    expect(container.querySelector('button')!.disabled).toBe(false);
    expect(getPendingTransactionConfirmations()[0].reason).toBe('timeout');
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
    expect(mocks.transactionResult).toHaveBeenCalledTimes(1);
  });

  it('updates on same-page additions and removals while already open', () => {
    act(() => root.render(<PendingTransactionConfirmations visible />));
    act(() => registerPendingTransactionConfirmation(hash, 1));
    expect(container.textContent).toContain(hash);
    act(() => removePendingTransactionConfirmation(hash, 1));
    expect(getPendingTransactionConfirmations()).toEqual([]);
    expect(container.textContent).not.toContain(hash);
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it.each([TransactionStatus.SUCCESS, TransactionStatus.FAILED])(
    'keeps manual check feedback visible after the record is removed (%s)',
    async (status) => {
      registerPendingTransactionConfirmation(hash, 1);
      mocks.transactionResult.mockImplementation(async () => {
        removePendingTransactionConfirmation(hash, 1);
        return { status };
      });
      act(() => root.render(<PendingTransactionConfirmations visible />));
      await act(async () => container.querySelector('button')!.click());
      expect(container.textContent).not.toContain(hash);
      expect(
        status === TransactionStatus.SUCCESS ? mocks.success : mocks.error,
      ).toHaveBeenCalledWith(
        status === TransactionStatus.SUCCESS
          ? 'Confirmed successful'
          : 'Confirmed failed',
      );
      expect(mocks.transactionResult).toHaveBeenCalledTimes(1);
      expect(mocks.transactionResult).toHaveBeenCalledWith(hash, 1);
    },
  );

  it.each([pendingTransactionConfirmationStorageKey, null])(
    'refreshes an open panel when another tab deletes records (%s)',
    (key) => {
      registerPendingTransactionConfirmation(hash, 1);
      act(() => root.render(<PendingTransactionConfirmations visible />));
      expect(container.textContent).toContain(hash);
      localStorage.clear();
      act(() => window.dispatchEvent(new StorageEvent('storage', { key })));
      expect(container.textContent).not.toContain(hash);
    },
  );

  it('removes the storage listener when hidden', () => {
    const removeListener = vi.spyOn(window, 'removeEventListener');
    act(() => root.render(<PendingTransactionConfirmations visible />));
    act(() => root.render(<PendingTransactionConfirmations visible={false} />));
    expect(removeListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function),
    );
    removeListener.mockRestore();
  });
});
