import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  connect: vi.fn(),
  connectStore: vi.fn(),
}));

vi.mock('@sofa/services/chains', () => ({ defaultChain: { chainId: 1 } }));
vi.mock('@sofa/services/rch', () => ({
  AirdropStatus: { Unclaimed: 0, Claiming: 1, Claimed: 2 },
  RCHService: { claimAirdrop: mocks.claim },
}));
vi.mock('@sofa/services/wallet', () => ({
  WalletService: { connect: mocks.connect },
}));
vi.mock('@/components/WalletConnector/store', () => ({
  useWalletStore: { connect: mocks.connectStore },
}));

import { AirdropRecord, AirdropStatus } from '@sofa/services/rch';
import { TransactionConfirmationPendingError } from '@sofa/services/transaction-confirmation';

import { useRCHState } from './store';

const records: AirdropRecord[] = [1, 2, 3].map((timestamp) => ({
  timestamp,
  status: AirdropStatus.Unclaimed,
  amount: timestamp,
  amountInt: String(timestamp),
  proof: '',
  address: '0xWallet',
  investNotional: 0,
}));
const pending = new TransactionConfirmationPendingError(
  `0x${'a'.repeat(64)}`,
  1,
);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.connect.mockResolvedValue({});
  mocks.connectStore.mockResolvedValue({});
  mocks.claim.mockResolvedValue(undefined);
  useRCHState.setState({
    myAirdropList: records.map((record) => ({ ...record })),
    selectedAirdropKeys: [1],
  });
});

describe('RCH batch claiming', () => {
  it('keeps unselected airdrops claimable when a partial claim is pending', async () => {
    mocks.claim.mockRejectedValue(pending);
    await expect(useRCHState.claimBatch(true)).rejects.toBe(pending);
    expect(mocks.claim).toHaveBeenCalledWith([records[0]]);
    expect(useRCHState.getState().claimableList()).toEqual(records.slice(1));
    expect(useRCHState.getState().claimableAmount()).toBe(5);
    expect(useRCHState.getState().myAirdropList?.[0].status).toBe(
      AirdropStatus.Claiming,
    );
  });

  it('rolls back only the failed batch while another batch remains pending', async () => {
    mocks.claim.mockRejectedValueOnce(pending);
    await expect(useRCHState.claimBatch(true)).rejects.toBe(pending);
    useRCHState.updateSelectedAirdropKeys([2]);
    const failed = new Error('User rejected transaction');
    mocks.claim.mockRejectedValueOnce(failed);
    await expect(useRCHState.claimBatch(true)).rejects.toBe(failed);
    expect(
      useRCHState.getState().myAirdropList?.map((it) => it.status),
    ).toEqual([
      AirdropStatus.Claiming,
      AirdropStatus.Unclaimed,
      AirdropStatus.Unclaimed,
    ]);
  });

  it('does not submit the same records twice when connections overlap', async () => {
    let resolveConnection!: (value: object) => void;
    mocks.connect.mockReturnValue(
      new Promise((resolve) => {
        resolveConnection = resolve;
      }),
    );
    const results = Promise.allSettled([
      useRCHState.claimBatch(true),
      useRCHState.claimBatch(true),
    ]);
    resolveConnection({});
    const settled = await results;
    expect(mocks.claim).toHaveBeenCalledTimes(1);
    expect(settled.map((it) => it.status)).toEqual(['fulfilled', 'rejected']);
    expect(useRCHState.getState().claimableList()).toEqual(records.slice(1));
  });

  it('submits all eligible records when claiming all', async () => {
    await useRCHState.claimBatch();
    expect(mocks.claim).toHaveBeenCalledWith(records);
    expect(useRCHState.getState().claimableList()).toEqual([]);
  });

  it('does not lock records if connecting the wallet store fails', async () => {
    const failed = new Error('Connection failed');
    mocks.connectStore.mockRejectedValue(failed);
    await expect(useRCHState.claimBatch(true)).rejects.toBe(failed);
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(useRCHState.getState().claimableList()).toEqual(records);
  });
});
