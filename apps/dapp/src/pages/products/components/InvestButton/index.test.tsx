import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  delRfq: vi.fn(),
  delQuote: vi.fn(),
  refreshBalance: vi.fn(),
  clearCart: vi.fn(),
  afterInvest: vi.fn(),
}));

vi.mock('@douyinfe/semi-ui', () => ({ Button: () => null, Toast: {} }));
vi.mock('@sofa/services/contracts', () => ({ ContractsService: {} }));
vi.mock('@sofa/services/i18n', () => ({
  useTranslation: () => [(text: string) => text],
}));
vi.mock('@sofa/services/positions', () => ({ PositionsService: {} }));
vi.mock('@sofa/services/products', () => ({
  RiskType: { RISKY: 'RISKY', PROTECTED: 'PROTECTED', DUAL: 'DUAL' },
  ProductsService: {
    productKey: (product: { vault: { vault: string } }) => product.vault.vault,
    delRfq: mocks.delRfq,
  },
}));
vi.mock('@sofa/services/the-graph', () => ({
  PositionStatus: { MINTED: 'MINTED', PENDING: 'PENDING', FAILED: 'FAILED' },
}));
vi.mock('@/components/AsyncButton', () => ({
  default: ({ onClick }: { onClick: () => Promise<unknown> }) => (
    <button onClick={onClick}>Invest</button>
  ),
}));
vi.mock('@/components/WalletConnector', () => ({ default: () => null }));
vi.mock('@/components/WalletConnector/store', () => ({
  useWalletStore: Object.assign(() => ({ address: '0xWallet', chainId: 1 }), {
    updateBalanceByVault: mocks.refreshBalance,
  }),
}));
vi.mock('@/locales', () => ({ addI18nResources: vi.fn() }));
vi.mock('@/store', () => ({ useGlobalState: () => undefined }));
vi.mock('../../store', () => ({ useProductsState: {} }));
vi.mock('../InvestProgress', async () => {
  const { forwardRef } = await import('react');
  return { InvestProgress: forwardRef(() => null) };
});

import { ProductType } from '@sofa/services/base-type';
import type { TransactionProgress } from '@sofa/services/positions';
import { ProductQuoteResult, RiskType } from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';

import { ProductInvestButton, ProductInvestButtonProps } from './index';

const quotes = ['success', 'pending', 'failed'].map((id) => ({
  rfqId: `rfq-${id}`,
  vault: { vault: id, chainId: 1, depositCcy: 'USDC' },
  amounts: { own: 1 },
  quote: { signature: 'signature', deadline: Date.now() / 1000 + 3600 },
})) as unknown as ProductQuoteResult[];

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
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

async function invest(progress: TransactionProgress) {
  const props: ProductInvestButtonProps = {
    vault: 'success',
    chainId: 1,
    vaultInfo: {
      depositCcy: 'USDC',
      riskType: RiskType.RISKY,
      productType: ProductType.DNT,
      onlyForAutomator: false,
    },
    products: quotes.map((quote) => ({
      id: quote.rfqId,
      vault: quote.vault,
      depositAmount: 1,
    })),
    quoteInfos: quotes,
    useProductsState: {
      delQuote: mocks.delQuote,
      clearCart: mocks.clearCart,
    } as unknown as ProductInvestButtonProps['useProductsState'],
    isInsufficientBalance: () => false,
    mint: async (cb) => {
      cb(progress);
    },
    afterInvest: mocks.afterInvest,
  };
  act(() => root.render(<ProductInvestButton {...props} />));
  mocks.refreshBalance.mockClear();
  await act(async () => {
    container.querySelector('button')!.click();
  });
}

function detail(
  vault: string,
  status: PositionStatus,
  error?: Error,
): NonNullable<TransactionProgress['details']>[number] {
  return [`${vault}-1-USDC`, { status, ids: [vault], error }];
}

describe('investment results', () => {
  it('cleans successful and consumed quotes in a pending batch', async () => {
    await invest({
      status: 'ConfirmationPending',
      details: [
        detail('success', PositionStatus.MINTED),
        detail('pending', PositionStatus.PENDING),
        detail(
          'failed',
          PositionStatus.FAILED,
          new Error('Signature consumed'),
        ),
      ],
    });
    expect(mocks.delRfq.mock.calls.map(([id]) => id).sort()).toEqual([
      'rfq-failed',
      'rfq-success',
    ]);
    expect(mocks.delQuote).toHaveBeenCalledWith(quotes[0]);
    expect(mocks.delQuote).toHaveBeenCalledWith(quotes[2]);
    expect(mocks.delQuote).not.toHaveBeenCalledWith(quotes[1]);
    expect(mocks.refreshBalance).toHaveBeenCalledTimes(1);
    expect(mocks.refreshBalance).toHaveBeenCalledWith('success');
    expect(mocks.clearCart).not.toHaveBeenCalled();
    expect(mocks.afterInvest).not.toHaveBeenCalled();
  });

  it('leaves pending quotes and balance untouched when none succeeded', async () => {
    await invest({
      status: 'ConfirmationPending',
      details: [detail('pending', PositionStatus.PENDING)],
    });
    expect(mocks.delQuote).not.toHaveBeenCalled();
    expect(mocks.delRfq).not.toHaveBeenCalled();
    expect(mocks.refreshBalance).not.toHaveBeenCalled();
    expect(mocks.afterInvest).not.toHaveBeenCalled();
  });

  it('retains retryable failures while cleaning successful items', async () => {
    await invest({
      status: 'Partial Failed',
      details: [
        detail('success', PositionStatus.MINTED),
        detail(
          'failed',
          PositionStatus.FAILED,
          new Error('User rejected transaction'),
        ),
      ],
    });
    expect(mocks.delQuote).toHaveBeenCalledTimes(1);
    expect(mocks.delQuote).toHaveBeenCalledWith(quotes[0]);
    expect(mocks.clearCart).not.toHaveBeenCalled();
    expect(mocks.afterInvest).not.toHaveBeenCalled();
  });

  it('runs the completion callback only for a successful batch', async () => {
    await invest({
      status: 'Success',
      details: [detail('success', PositionStatus.MINTED)],
    });
    expect(mocks.delQuote).toHaveBeenCalledTimes(1);
    expect(mocks.delQuote).toHaveBeenCalledWith(quotes[0]);
    expect(mocks.clearCart).toHaveBeenCalledTimes(1);
    expect(mocks.afterInvest).toHaveBeenCalledTimes(1);
  });
});
