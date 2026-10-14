import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  tab: 'holding',
  mobile: false,
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  Spin: ({
    children,
    spinning,
  }: {
    children: React.ReactNode;
    spinning: boolean;
  }) => <div aria-busy={spinning}>{children}</div>,
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      TabPane: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    },
  ),
  Toast: { error: vi.fn() },
}));
vi.mock('@sofa/services/automator', () => ({
  AutomatorService: {},
  AutomatorDepositStatus: { ACTIVE: 'ACTIVE', CLOSED: 'CLOSED' },
}));
vi.mock('@sofa/services/automator-user', () => ({
  AutomatorUserService: {
    fetchUserPositionList: mocks.list,
    // Detail/chain requests must not block the portfolio refresh.
    userPosition: () => new Promise(() => {}),
    userShares: () => new Promise(() => {}),
    userRedemptionInfo: () => new Promise(() => {}),
  },
}));
vi.mock('@sofa/services/contracts', () => ({
  ContractsService: { AutomatorVaults: [] },
}));
vi.mock('@sofa/services/ccy', () => ({ CCYService: { ccyConfigs: {} } }));
vi.mock('@sofa/services/chains', () => ({ ChainMap: {} }));
vi.mock('@sofa/services/i18n', () => {
  const t = (text: { enUS: string }) => text.enUS;
  return { t, useTranslation: () => [t] };
});
vi.mock('@sofa/utils/env', () => ({ Env: { isDaily: false } }));
vi.mock('@sofa/utils/history', () => ({ updateQuery: vi.fn() }));
vi.mock('@sofa/utils/hooks', () => ({
  useQuery: (selector: (q: Record<string, string>) => unknown) =>
    selector({ 'automator-market-tab': mocks.tab }),
  useLazyCallback: (fn: unknown) => fn,
}));
vi.mock('@/components/Empty', () => ({
  default: ({ description }: { description?: string }) => (
    <div>{description || 'No Results'}</div>
  ),
}));
vi.mock('@/components/ProductSelector/enums', () => ({
  ProjectTypeRefs: { Automator: {} },
}));
vi.mock('@/components/MobileOnly', () => ({
  useIsMobileUI: () => mocks.mobile,
}));
vi.mock('@/components/TopTabs', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock('@/components/WalletConnector/store', async () => {
  const { create } = await import('zustand');
  return {
    useWalletStore: Object.assign(
      create(() => ({ chainId: 1, address: '0xWallet' })),
      { updateBalanceByAutomatorVault: () => new Promise(() => {}) },
    ),
  };
});
vi.mock('../automator/components/Deposit', () => ({
  AutomatorDeposit: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>Complete deposit</button>
  ),
}));
vi.mock('../automator/components/Withdraw', () => ({
  AutomatorWithdraw: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>Complete withdrawal</button>
  ),
}));
vi.mock('../automator/components/Overview', () => ({
  AutomatorOverview: () => null,
}));
vi.mock('../automator/components/ProjectDesc', () => ({
  AutomatorProjectDesc: () => null,
}));
vi.mock('../automator/components/UserInfo', () => ({
  AutomatorUserInfo: () => null,
}));
vi.mock('../automator/index.module.scss', () => ({ default: {} }));
vi.mock('../components/ProductDesc', () => ({ default: () => null }));
vi.mock('../automator/index-modal', () => ({
  useAutomatorModal: () => [null, { open: vi.fn() }],
}));
vi.mock('../automator-operate/components/ShareModal', () => ({
  default: () => null,
}));
vi.mock('../components/AutomatorChainList', () => ({ ChainList: () => null }));
vi.mock('./components/ShareModal', () => ({ default: () => null }));
vi.mock('./components/Card', () => ({
  AutomatorCard: ({
    info,
    userPosition,
  }: {
    info: { vaultInfo: { name: string } };
    userPosition?: { amountByClientDepositCcy: number | string };
  }) => (
    <article>
      {info.vaultInfo.name}
      {userPosition && (
        <span>My Holding: {userPosition.amountByClientDepositCcy}</span>
      )}
    </article>
  ),
}));
vi.mock('./index.module.scss', () => ({ default: {} }));

import { AutomatorInfo } from '@sofa/services/automator';
import {
  AutomatorUserPosition,
  OriginAutomatorUserPosition,
} from '@sofa/services/automator-user';

import { useWalletStore } from '@/components/WalletConnector/store';

import { AutomatorEl } from '../automator';
import { useAutomatorStore } from '../automator/store';

import Index from './index';

const info = {
  vaultInfo: {
    chainId: 1,
    vault: '0xVault',
    depositCcy: 'USDC',
    name: 'USDC Automator',
  },
} as AutomatorInfo;
const position: OriginAutomatorUserPosition = {
  chainId: 1,
  automatorName: 'USDC Automator',
  automatorVault: '0xVAULT',
  wallet: '0xWALLET',
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
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mocks.tab = 'holding';
  mocks.mobile = false;
  mocks.list.mockImplementation(() => new Promise(() => {}));
  useWalletStore.setState({ chainId: 1, address: '0xWallet' });
  useAutomatorStore.setState({
    userPositionLists: {},
    userInfos: {},
    vaults: { 1: { '0xvault': info.vaultInfo } },
    vaultOverviews: { '1-0xvault-': info },
  });
  vi.spyOn(useAutomatorStore, 'subscribeVaults').mockImplementation(
    () => () => {},
  );
  vi.spyOn(useAutomatorStore, 'subscribeOverview').mockImplementation(
    () => () => {},
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const render = async (withTransactionForm = false) => {
  await act(async () =>
    root.render(
      <>
        <Index />
        {withTransactionForm && <AutomatorEl />}
      </>,
    ),
  );
};

async function completeTransaction(action: 'deposit' | 'withdrawal') {
  await act(async () => {
    const button = Array.from(container.querySelectorAll('button')).find(
      (it) => it.textContent === `Complete ${action}`,
    );
    expect(button).toBeDefined();
    button!.click();
  });
}

describe('Automator Portfolio', () => {
  it('shows loading instead of an empty portfolio before holdings finish', async () => {
    await render();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.textContent).not.toContain('No Results');
  });

  it('shows ACTIVE holdings immediately while CLOSED is still pending', async () => {
    mocks.list.mockImplementation(({ status }) =>
      status === 'ACTIVE' ? Promise.resolve([position]) : new Promise(() => {}),
    );
    await render();
    expect(container.textContent).toContain('My Holding: 105');
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('keeps All visible while personal holdings are still loading', async () => {
    mocks.tab = 'all';
    await render();
    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(container.textContent).not.toContain('My Holding');
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('shows an error instead of no holdings and supports retry', async () => {
    mocks.list.mockRejectedValue(new Error('Network unavailable'));
    await render();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).not.toContain('No Results');
    mocks.list.mockResolvedValue([]);
    await act(async () => {
      const retry = Array.from(container.querySelectorAll('button')).find(
        (button) => button.textContent === 'Retry',
      );
      expect(retry).toBeDefined();
      retry!.click();
    });
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain('No Results');
  });

  it.each(['100', '0'])(
    'prefers ACTIVE over CLOSED for the same vault (amount %s)',
    async (amount) => {
      mocks.list.mockImplementation(async ({ status }) => [
        {
          ...position,
          status,
          amountByVaultDepositCcy: status === 'ACTIVE' ? amount : '900',
          amountByClientDepositCcy: status === 'ACTIVE' ? '105' : '999',
        },
      ]);
      await render();
      expect(container.textContent).not.toContain('999');
      expect(container.querySelectorAll('article')).toHaveLength(
        amount === '0' ? 0 : 1,
      );
    },
  );

  it('does not resurrect cleared holdings from the detail cache', async () => {
    useAutomatorStore.setState({
      userInfos: {
        '1-0xvault-0xWallet': {
          server: {
            ...position,
            vaultInfo: info.vaultInfo,
          } as AutomatorUserPosition,
        },
      },
    });
    mocks.list.mockResolvedValue([]);
    await render();
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(container.textContent).toContain('No Results');
  });

  it('keeps existing cards visible and reports refresh failures', async () => {
    mocks.list.mockImplementation(async ({ status }) =>
      status === 'ACTIVE' ? [position] : [],
    );
    await render(true);
    mocks.list.mockRejectedValue(new Error('Network unavailable'));
    await completeTransaction('withdrawal');
    expect(container.textContent).toContain('My Holding: 105');
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it("hides another wallet's holdings immediately after switching accounts", async () => {
    mocks.list.mockImplementation(async ({ wallet, status }) =>
      wallet === '0xWallet' && status === 'ACTIVE' ? [position] : [],
    );
    await render();
    expect(container.textContent).toContain('My Holding: 105');
    await act(async () => {
      useWalletStore.setState({ address: '0xOther' });
    });
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(container.textContent).toContain('No Results');
  });

  it.each([false, true])(
    'shows a first deposit without waiting for detail requests (mobile: %s)',
    async (mobile) => {
      mocks.mobile = mobile;
      mocks.tab = 'all';
      mocks.list.mockResolvedValue([]);
      await render(true);
      mocks.list.mockImplementation(async ({ status }) =>
        status === 'ACTIVE' ? [position] : [],
      );
      await completeTransaction('deposit');
      mocks.tab = 'holding';
      await render(true);
      expect(container.textContent).toContain('My Holding: 105');
      expect(container.textContent).not.toContain('No Results');
    },
  );

  it.each(['55', '0'])(
    'refreshes the holding after a withdrawal (remaining amount: %s)',
    async (amount) => {
      mocks.list.mockImplementation(async ({ status }) =>
        status === 'ACTIVE' ? [position] : [],
      );
      await render(true);
      expect(container.textContent).toContain('My Holding: 105');
      mocks.list.mockImplementation(async ({ status }) =>
        status === 'ACTIVE'
          ? [
              {
                ...position,
                amountByClientDepositCcy: amount,
                amountByVaultDepositCcy: amount,
              },
            ]
          : [],
      );
      await completeTransaction('withdrawal');
      expect(container.textContent).not.toContain('My Holding: 105');
      if (amount === '0')
        expect(container.querySelectorAll('article')).toHaveLength(0);
      else expect(container.textContent).toContain('My Holding: 55');
    },
  );

  it('refreshes after a deposit even with an older list request in flight', async () => {
    mocks.list.mockResolvedValue([]);
    await render(true);
    let resolveOld!: (positions: OriginAutomatorUserPosition[]) => void;
    const oldResponse = new Promise<OriginAutomatorUserPosition[]>(
      (resolve) => {
        resolveOld = resolve;
      },
    );
    mocks.list.mockImplementation(({ status }) =>
      status === 'ACTIVE' ? oldResponse : Promise.resolve([]),
    );
    let oldRequest!: ReturnType<typeof useAutomatorStore.getUserInfoList>;
    await act(async () => {
      oldRequest = useAutomatorStore.getUserInfoList(1, '0xWallet');
    });
    try {
      mocks.list.mockImplementation(async ({ status }) =>
        status === 'ACTIVE' ? [position] : [],
      );
      await completeTransaction('deposit');
      expect(container.textContent).toContain('My Holding: 105');
    } finally {
      await act(async () => {
        resolveOld([]);
        await oldRequest;
      });
    }
    expect(container.textContent).toContain('My Holding: 105');
  });
});
