import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  automatorList: vi.fn(),
  fetchIndexPx: vi.fn(),
}));

vi.mock('@douyinfe/semi-ui', () => ({ Toast: { error: vi.fn() } }));
vi.mock('@sofa/utils/http', () => ({ http: { get: mocks.get } }));
vi.mock('@sofa/utils/sentry', () => ({ sentry: {} }));
vi.mock('@sofa/services/automator', () => ({
  AutomatorDepositStatus: { ACTIVE: 'ACTIVE', CLOSED: 'CLOSED' },
  AutomatorService: { automatorList: mocks.automatorList },
}));
vi.mock('@sofa/services/market', () => ({
  MarketService: { fetchIndexPx: mocks.fetchIndexPx },
}));
vi.mock('@sofa/services/automator-creator', () => ({
  AutomatorCreatorService: {},
}));
vi.mock('@sofa/services/contracts', () => ({ ContractsService: {} }));
vi.mock('@sofa/services/positions', () => ({ PositionsService: {} }));
vi.mock('@sofa/services/wallet', () => ({ WalletService: {} }));
vi.mock('@sofa/services/the-graph', () => ({ PositionStatus: {} }));

import { AutomatorDepositStatus } from '@sofa/services/automator';
import {
  AutomatorUserService,
  OriginAutomatorUserPosition,
} from '@sofa/services/automator-user';

import { useAutomatorStore } from './store';

const position: OriginAutomatorUserPosition = {
  chainId: 1,
  automatorName: 'USDC Automator',
  automatorVault: '0xVault',
  wallet: '0xWallet',
  amountByVaultDepositCcy: '100',
  amountByClientDepositCcy: '105',
  share: '100',
  totalTradingPnlByClientDepositCcy: '3',
  totalInterestPnlByClientDepositCcy: '2',
  totalPnlByClientDepositCcy: '5',
  totalRchPnlByClientDepositCcy: '1',
  totalRchAmount: '2',
  status: 'ACTIVE',
  pnlPercentage: '5',
  vaultDepositCcy: 'USDC',
  clientDepositCcy: 'USDC',
  sharesToken: 'aUSDC',
  redemptionPeriodDay: 7,
};
const params = {
  chainId: 1,
  wallet: '0xWallet',
  status: AutomatorDepositStatus.ACTIVE,
};
const activeKey = '1-0xwallet-ACTIVE';
const closedKey = '1-0xwallet-CLOSED';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  useAutomatorStore.setState({ userPositionLists: {}, userInfos: {} });
  mocks.fetchIndexPx.mockImplementation(() => new Promise(() => {}));
  mocks.automatorList.mockResolvedValue([
    { vaultInfo: { chainId: 1, vault: '0xVault', depositCcy: 'USDC' } },
  ]);
  mocks.get.mockImplementation(async (url, { params: query }) => {
    if (url !== '/users/automator/list')
      throw new Error(`Unexpected URL: ${url}`);
    return {
      value:
        query.status === 'ACTIVE'
          ? [{ ...position, chainId: query.chainId, wallet: query.wallet }]
          : [],
    };
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Automator portfolio loading', () => {
  it('returns server holdings without waiting for market prices or vault metadata', async () => {
    mocks.automatorList.mockImplementation(() => new Promise(() => {}));
    const list = await AutomatorUserService.fetchUserPositionList(params);
    expect(list[0].amountByClientDepositCcy).toBe('105');
    expect(mocks.get).toHaveBeenCalledWith('/users/automator/list', { params });
    expect(mocks.fetchIndexPx).not.toHaveBeenCalled();
  });

  it('publishes ACTIVE holdings while CLOSED remains pending', async () => {
    const closed = deferred<{ value: OriginAutomatorUserPosition[] }>();
    mocks.get.mockImplementation(async (_, { params: query }) =>
      query.status === 'ACTIVE' ? { value: [position] } : closed.promise,
    );
    const request = useAutomatorStore.getUserInfoList(1, '0xWallet');
    await vi.waitFor(
      () =>
        expect(
          useAutomatorStore.getState().userPositionLists?.[activeKey]?.data?.[0]
            .amountByClientDepositCcy,
        ).toBe('105'),
      { timeout: 150 },
    );
    expect(
      useAutomatorStore.getState().userPositionLists[closedKey].loading,
    ).toBe(true);
    closed.resolve({ value: [] });
    await request;
  });

  it('keeps ACTIVE holdings when CLOSED fails and exposes the failure', async () => {
    mocks.get.mockImplementation(async (_, { params: query }) => {
      if (query.status === 'CLOSED') throw new Error('Closed unavailable');
      return { value: [position] };
    });
    await useAutomatorStore.getUserInfoList(1, '0xWallet');
    expect(
      useAutomatorStore.getState().userPositionLists[activeKey].data?.[0]
        .amountByClientDepositCcy,
    ).toBe('105');
    expect(
      useAutomatorStore.getState().userPositionLists[closedKey].error,
    ).toBe('Closed unavailable');
  });

  it('replaces a successful snapshot with an empty list after holdings are cleared', async () => {
    await useAutomatorStore.getUserInfoList(1, '0xWallet');
    mocks.get.mockResolvedValue({ value: [] });
    await useAutomatorStore.getUserInfoList(1, '0xWallet');
    expect(
      useAutomatorStore.getState().userPositionLists[activeKey].data,
    ).toEqual([]);
  });

  it('preserves the last successful snapshot on a refresh failure', async () => {
    await useAutomatorStore.getUserInfoList(1, '0xWallet');
    mocks.get.mockRejectedValue(new Error('Network unavailable'));
    await useAutomatorStore.getUserInfoList(1, '0xWallet');
    const state = useAutomatorStore.getState().userPositionLists[activeKey];
    expect(state.data?.[0].amountByClientDepositCcy).toBe('105');
    expect(state.error).toBe('Network unavailable');
    expect(state.loading).toBe(false);
  });

  it('keeps chain and wallet snapshots separate, including late responses', async () => {
    const old = deferred<{ value: OriginAutomatorUserPosition[] }>();
    mocks.get.mockImplementation(async (_, { params: query }) => {
      if (query.status === 'CLOSED') return { value: [] };
      if (query.chainId === 1 && query.wallet.toLowerCase() === '0xwallet')
        return old.promise;
      return {
        value: [
          {
            ...position,
            chainId: query.chainId,
            wallet: query.wallet,
            amountByClientDepositCcy: '200',
          },
        ],
      };
    });
    const oldRequest = useAutomatorStore.getUserInfoList(1, '0xWallet');
    await useAutomatorStore.getUserInfoList(42161, '0xOther');
    old.resolve({ value: [position] });
    await oldRequest;
    expect(
      useAutomatorStore.getState().userPositionLists['42161-0xother-ACTIVE']
        .data?.[0].amountByClientDepositCcy,
    ).toBe('200');
    expect(
      useAutomatorStore.getState().userPositionLists[activeKey].data?.[0]
        .amountByClientDepositCcy,
    ).toBe('105');
  });

  it('ignores an older response after a newer refresh has completed', async () => {
    const old = deferred<{ value: OriginAutomatorUserPosition[] }>();
    mocks.get.mockReturnValueOnce(old.promise);
    const oldRequest = useAutomatorStore.getUserInfoList(1, '0xWallet');
    mocks.get.mockResolvedValue({ value: [] });
    await useAutomatorStore.getUserInfoList(1, '0xWallet');
    old.resolve({ value: [position] });
    await oldRequest;
    expect(
      useAutomatorStore.getState().userPositionLists[activeKey].data,
    ).toEqual([]);
  });

  it.each(['success', 'failure'])(
    'publishes a slow %s after a polling interval has elapsed',
    async (outcome) => {
      vi.useFakeTimers();
      const slow = deferred<{ value: OriginAutomatorUserPosition[] }>();
      let activeRequests = 0;
      mocks.get.mockImplementation(async (_, { params: query }) => {
        if (query.status === 'CLOSED') return { value: [] };
        return activeRequests++ === 0 ? slow.promise : new Promise(() => {});
      });
      const unsubscribe = useAutomatorStore.subscribeUserInfoList(
        1,
        '0xWallet',
      );
      try {
        await vi.advanceTimersByTimeAsync(60_000);
        if (outcome === 'success') slow.resolve({ value: [position] });
        else slow.reject(new Error('Request timed out'));
        await vi.advanceTimersByTimeAsync(0);
        const state = useAutomatorStore.getState().userPositionLists[activeKey];
        expect(state.loading).toBe(false);
        if (outcome === 'success')
          expect(state.data?.[0].amountByClientDepositCcy).toBe('105');
        else expect(state.error).toBe('Request timed out');
      } finally {
        unsubscribe();
      }
    },
  );
});
