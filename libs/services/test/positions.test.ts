import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => vi.stubGlobal('window', { location: { search: '' } }));
vi.mock('@sofa/utils/sentry', () => ({ sentry: { setUser: vi.fn() } }));
vi.mock('@web3-name-sdk/core', () => ({ createWeb3Name: vi.fn() }));
vi.mock('@sofa/utils/http', () => ({ http: {}, pollingUntil: vi.fn() }));
vi.mock('../wallet-connect', () => ({
  WalletConnect: { connect: vi.fn(), getProvider: vi.fn() },
}));
vi.mock('../chains', () => ({ ChainMap: {} }));
vi.mock('../contracts', async () => ({
  ...(await import('../base-type')),
  ContractsService: { rfqContract: vi.fn(), dirtyCall: vi.fn() },
}));
vi.mock('../products', () => ({ ProductsService: {} }));
vi.mock('../market', () => ({ MarketService: {} }));
vi.mock('../referral', () => ({ ReferralService: {} }));
vi.mock('../vaults/dual', () => ({ getDualProductType: vi.fn() }));

import { ProductType, RiskType } from '../base-type';
import { ContractsService } from '../contracts';
import { PositionsService, TransactionProgress } from '../positions';
import { PositionStatus } from '../the-graph';
import { getPendingTransactionConfirmations } from '../transaction-confirmation';
import { WalletService } from '../wallet';
import { WalletConnect } from '../wallet-connect';

let nextHash = 0;
let hashes: string[];
const provider = {
  getTransactionReceipt: vi.fn(),
  getTransaction: vi.fn().mockResolvedValue(null),
};

function positions(
  count: number,
): Parameters<typeof WalletService.burnBatch>[0] {
  return Array.from({ length: count }, (_, index) => ({
    positionId: String(index),
    vault: '0xVault',
    chainId: 1,
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    owner: '0xWallet',
    expiry: index,
    anchorPrices: [],
    isMaker: 0,
    claimCcy: 'USDT',
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key),
    setItem: (key: string, value: string) => entries.set(key, value),
  });
  vi.stubGlobal('storage', { get: vi.fn(), set: vi.fn() });
  vi.mocked(WalletConnect.connect).mockResolvedValue({
    signer: { address: '0xWallet' },
  } as Awaited<ReturnType<typeof WalletConnect.connect>>);
  vi.mocked(WalletConnect.getProvider).mockResolvedValue(
    provider as unknown as Awaited<
      ReturnType<typeof WalletConnect.getProvider>
    >,
  );
  vi.mocked(ContractsService.rfqContract).mockResolvedValue({} as never);
  hashes = [];
  vi.mocked(ContractsService.dirtyCall)
    .mockReset()
    .mockImplementation(async () => {
      const hash = `0x${(++nextHash).toString(16).padStart(64, '0')}`;
      hashes.push(hash);
      return hash;
    });
  provider.getTransactionReceipt
    .mockReset()
    .mockResolvedValue({ status: 1, logs: [] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('claim sub-batches', () => {
  it('does not connect for an empty claim', async () => {
    const cb = vi.fn();
    await PositionsService.claimBatch(cb, []);
    expect(cb).toHaveBeenLastCalledWith({ status: 'Success', details: [] });
    expect(WalletConnect.connect).not.toHaveBeenCalled();
  });

  it('reports all failed when every sub-batch fails to submit', async () => {
    vi.mocked(ContractsService.dirtyCall).mockRejectedValue(
      new Error('User rejected'),
    );
    const cb = vi.fn();
    await PositionsService.claimBatch(cb, positions(301));
    const last = cb.mock.calls[
      cb.mock.calls.length - 1
    ][0] as TransactionProgress;
    expect(last.status).toBe('All Failed');
    expect(
      last.details!.map(([, detail]) => [detail.status, detail.ids.length]),
    ).toEqual([
      [PositionStatus.FAILED, 300],
      [PositionStatus.FAILED, 1],
    ]);
    expect(provider.getTransactionReceipt).not.toHaveBeenCalled();
  });

  it('keeps claim currency routing when flattening sub-batches', async () => {
    const data = positions(301).map((it) => ({ ...it, claimCcy: 'ETH' }));
    await PositionsService.claimBatch(vi.fn(), data);
    expect(
      vi.mocked(ContractsService.dirtyCall).mock.calls.map((call) => call[1]),
    ).toEqual(['ethBurnBatch', 'ethBurnBatch']);
  });

  it.each([300, 301, 601])(
    'preserves exact IDs for each submitted transaction (%s positions)',
    async (count) => {
      const updates: TransactionProgress[] = [];
      await PositionsService.claimBatch(
        (progress) => updates.push(progress),
        positions(count),
      );
      const last = updates[updates.length - 1];
      expect(last.status).toBe('Success');
      expect(last.details).toHaveLength(Math.ceil(count / 300));
      last.details!.forEach(([, detail], index) => {
        expect(detail).toMatchObject({
          status: PositionStatus.CLAIMED,
          hash: hashes[index],
          ids: positions(count)
            .slice(index * 300, (index + 1) * 300)
            .map((it) => it.positionId),
        });
      });
      vi.mocked(ContractsService.dirtyCall).mock.calls.forEach(
        (call, index) => {
          expect(call[2]()[0]).toHaveLength(last.details![index][1].ids.length);
        },
      );
    },
  );

  it.each(['pending', 'failed'])(
    'keeps the first 300 claims when the last transaction is %s',
    async (outcome) => {
      provider.getTransactionReceipt.mockImplementation(async (hash) =>
        hash === hashes[0]
          ? { status: 1, logs: [] }
          : outcome === 'pending'
            ? null
            : { status: 0, logs: [] },
      );
      const updates: TransactionProgress[] = [];
      const claim = PositionsService.claimBatch(
        (progress) => updates.push(progress),
        positions(301),
      );
      await vi.advanceTimersByTimeAsync(60_000);
      await claim;
      const last = updates[updates.length - 1];
      expect(last.status).toBe(
        outcome === 'pending' ? 'ConfirmationPending' : 'Partial Failed',
      );
      expect(last.details).toHaveLength(2);
      expect(last.details![0][1]).toMatchObject({
        status: PositionStatus.CLAIMED,
        ids: positions(300).map((it) => it.positionId),
      });
      expect(last.details![1][1]).toMatchObject({
        status:
          outcome === 'pending'
            ? PositionStatus.PENDING
            : PositionStatus.FAILED,
        ids: ['300'],
      });
      if (outcome === 'pending') {
        expect(last.details![1][1].confirmation).toMatchObject({
          hash: hashes[1],
          chainId: 1,
        });
        expect(
          getPendingTransactionConfirmations().map((it) => it.hash),
        ).toEqual([hashes[1]]);
      }
    },
  );

  it('keeps submitted hashes and confirmed IDs when another sub-batch fails to submit', async () => {
    const error = new Error('User rejected the second transaction');
    const submit = vi
      .mocked(ContractsService.dirtyCall)
      .getMockImplementation()!;
    vi.mocked(ContractsService.dirtyCall)
      .mockImplementationOnce(submit)
      .mockRejectedValueOnce(error);
    const updates: TransactionProgress[] = [];
    await PositionsService.claimBatch(
      (progress) => updates.push(progress),
      positions(301),
    );
    const last = updates[updates.length - 1];
    expect(last.status).toBe('Partial Failed');
    expect(last.details![0][1]).toMatchObject({
      status: PositionStatus.CLAIMED,
      hash: hashes[0],
    });
    expect(last.details![0][1].ids).toHaveLength(300);
    expect(last.details![1][1]).toMatchObject({
      status: PositionStatus.FAILED,
      error,
      ids: ['300'],
    });
    expect(provider.getTransactionReceipt).toHaveBeenCalledWith(hashes[0]);
  });

  it('reports success, failure and pending independently within the same vault', async () => {
    provider.getTransactionReceipt.mockImplementation(async (hash) =>
      hash === hashes[0]
        ? { status: 1, logs: [] }
        : hash === hashes[1]
          ? { status: 0, logs: [] }
          : null,
    );
    const updates: TransactionProgress[] = [];
    const claim = PositionsService.claimBatch(
      (progress) => updates.push(progress),
      positions(601),
    );
    await vi.advanceTimersByTimeAsync(60_000);
    await claim;
    const last = updates[updates.length - 1];
    expect(last.status).toBe('ConfirmationPending');
    expect(
      last.details!.map(([, detail]) => [detail.status, detail.ids.length]),
    ).toEqual([
      [PositionStatus.CLAIMED, 300],
      [PositionStatus.FAILED, 300],
      [PositionStatus.PENDING, 1],
    ]);
  });
});
