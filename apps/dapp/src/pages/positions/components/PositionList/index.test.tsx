import type { ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claimBatch: vi.fn(),
  mutate: vi.fn(),
  positions: [] as PositionInfo[],
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({
    onClick,
    children,
  }: {
    onClick: () => void;
    children: ReactNode;
  }) => <button onClick={onClick}>{children}</button>,
  Spin: ({ children }: { children: ReactNode }) => <>{children}</>,
  Modal: {},
  Toast: {},
}));
vi.mock('@sofa/services/automator-creator', () => ({
  AutomatorCreatorService: {},
}));
vi.mock('@sofa/services/ccy', () => ({ CCYService: { ccyConfigs: {} } }));
vi.mock('@sofa/services/i18n', () => ({
  useTranslation: () => [
    (text: string | { enUS: string }) =>
      typeof text === 'string' ? text : text.enUS,
  ],
}));
vi.mock('@sofa/services/positions', () => ({
  PositionsService: { claimBatch: mocks.claimBatch },
}));
vi.mock('@sofa/services/products', () => ({
  ProductsService: {
    productKey: (product: PositionInfo['product']) => product.vault.vault,
  },
  RiskType: { PROTECTED: 'PROTECTED', DUAL: 'DUAL' },
}));
vi.mock('@sofa/services/the-graph', () => ({
  PositionStatus: { CLAIMED: 'CLAIMED', PENDING: 'PENDING', FAILED: 'FAILED' },
}));
vi.mock('ahooks', async () => {
  const { useState } = await import('react');
  return {
    useInfiniteScroll: () => {
      const [data, setData] = useState({
        list: mocks.positions,
        chainId: 1,
        owner: '0xWallet',
      });
      return {
        data,
        loading: false,
        mutate: (update: (pre: typeof data) => typeof data) => {
          mocks.mutate();
          setData(update);
        },
      };
    },
    useLocalStorageState: () => [{}],
  };
});
vi.mock('@/components/AsyncButton', () => ({ default: () => null }));
vi.mock('@/components/Empty', () => ({ default: () => null }));
vi.mock('@/components/ProductSelector', () => ({
  useProjectChange: () => ['PROTECTED'],
  useRiskSelect: () => ['PROTECTED'],
}));
vi.mock('@/components/WalletConnector/store', () => ({
  useWalletStore: () => ({ address: '0xWallet', chainId: 1 }),
}));
vi.mock('@/locales', () => ({ addI18nResources: vi.fn() }));
vi.mock('../ClaimProgress', async () => {
  const { forwardRef } = await import('react');
  return { PositionClaimProgress: forwardRef(() => null) };
});
vi.mock('../PositionCard', () => ({
  default: ({ position }: { position: PositionInfo }) => (
    <span>{position.product.vault.vault}</span>
  ),
}));
vi.mock('../PositionCard/common', () => ({ judgeSettled: () => true }));
vi.mock('../PositionDetails', () => ({ default: () => null }));
vi.mock('./assets/selected.svg', () => ({ Comp: () => null }));
vi.mock('./assets/unselected.svg', () => ({ Comp: () => null }));

import type {
  PositionInfo,
  TransactionProgress,
} from '@sofa/services/positions';
import { PositionStatus } from '@sofa/services/the-graph';

import PositionList from './index';

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mocks.positions = ['0xVaultA', '0xVaultB'].map((vault) => ({
    id: '1',
    claimed: false,
    createdAt: 1,
    wallet: '0xWallet',
    product: { vault: { vault, chainId: 1, depositCcy: 'USDC' }, expiry: 1 },
    amounts: { redeemable: 1 },
    claimParams: { anchorPrices: [], maker: 0 },
  })) as unknown as PositionInfo[];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function detail(
  vault: string,
  chainId: number,
  status: PositionStatus,
): NonNullable<TransactionProgress['details']>[number] {
  return [`${vault}-${chainId}-undefined`, { status, ids: ['1'] }];
}

async function claimAll() {
  await act(async () => {
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Claim All'))!
      .click();
  });
}

describe('claim all position updates', () => {
  it.each([PositionStatus.PENDING, PositionStatus.FAILED])(
    'retries only the unconfirmed sub-batch within the same vault (%s)',
    async (status) => {
      mocks.positions[1] = {
        ...mocks.positions[0],
        id: '2',
      };
      mocks.claimBatch.mockImplementation(
        async (cb: (progress: TransactionProgress) => void) =>
          cb({
            status:
              status === PositionStatus.PENDING
                ? 'ConfirmationPending'
                : 'Partial Failed',
            details: [
              detail('0xvaulta', 1, PositionStatus.CLAIMED),
              ['0xvaulta-1-USDC', { ids: ['2'], status }],
            ],
          }),
      );
      act(() => root.render(<PositionList />));
      await claimAll();
      await claimAll();
      expect(mocks.claimBatch.mock.calls[1][1]).toEqual([
        expect.objectContaining({ vault: '0xVaultA', positionId: '2' }),
      ]);
    },
  );

  it.each(['ConfirmationPending', 'Partial Failed'] as const)(
    'removes only confirmed positions from subsequent claims for %s',
    async (status) => {
      mocks.claimBatch.mockImplementation(
        async (cb: (progress: TransactionProgress) => void) =>
          cb({
            status,
            details: [
              detail('0xvaulta', 1, PositionStatus.CLAIMED),
              detail(
                '0xvaultb',
                1,
                status === 'ConfirmationPending'
                  ? PositionStatus.PENDING
                  : PositionStatus.FAILED,
              ),
            ],
          }),
      );
      act(() => root.render(<PositionList />));
      await claimAll();
      expect(container.textContent).not.toContain('0xVaultA');
      expect(container.textContent).toContain('0xVaultB');
      await claimAll();
      expect(mocks.claimBatch.mock.calls[1][1]).toEqual([
        expect.objectContaining({ vault: '0xVaultB', positionId: '1' }),
      ]);
    },
  );

  it('removes all claimed positions after a fully successful batch', async () => {
    mocks.claimBatch.mockImplementation(
      async (cb: (progress: TransactionProgress) => void) =>
        cb({
          status: 'Success',
          details: [
            detail('0xvaulta', 1, PositionStatus.CLAIMED),
            detail('0xvaultb', 1, PositionStatus.CLAIMED),
          ],
        }),
    );
    act(() => root.render(<PositionList />));
    await claimAll();
    expect(container.textContent).not.toContain('0xVaultA');
    expect(container.textContent).not.toContain('0xVaultB');
    expect(container.textContent).not.toContain('Claim All');
  });

  it('does not mark a position on another chain as claimed', async () => {
    mocks.claimBatch.mockImplementation(
      async (cb: (progress: TransactionProgress) => void) =>
        cb({
          status: 'Success',
          details: [detail('0xvaulta', 2, PositionStatus.CLAIMED)],
        }),
    );
    act(() => root.render(<PositionList />));
    await claimAll();
    expect(container.textContent).toContain('0xVaultA');
    expect(container.textContent).toContain('0xVaultB');
  });

  it('leaves failed and pending positions untouched', async () => {
    mocks.claimBatch.mockImplementation(
      async (cb: (progress: TransactionProgress) => void) => {
        cb({ status: 'Submitting' });
        cb({
          status: 'ConfirmationPending',
          details: [
            detail('0xvaulta', 1, PositionStatus.FAILED),
            detail('0xvaultb', 1, PositionStatus.PENDING),
          ],
        });
      },
    );
    act(() => root.render(<PositionList />));
    await claimAll();
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(container.textContent).toContain('0xVaultA');
    expect(container.textContent).toContain('0xVaultB');
  });
});
