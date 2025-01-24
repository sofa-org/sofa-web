import { useEffect, useMemo, useRef } from 'react';
import { Button, Toast } from '@douyinfe/semi-ui';
import { wait, waitUntil } from '@livelybone/promise-wait';
import { ContractsService, VaultInfo } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  PositionsService,
  TransactionProgress,
} from '@sofa/services/positions';
import {
  ProductQuoteParams,
  ProductQuoteResult,
  ProductsService,
  RiskType,
} from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';
import { MsIntervals } from '@sofa/utils/expiry';
import { getErrorMsg, isNullLike } from '@sofa/utils/fns';
import { useLazyCallback, useTime } from '@sofa/utils/hooks';
import { arrToDict, simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import AsyncButton from '@/components/AsyncButton';
import { pokerRightsReminder } from '@/components/RightsReminder';
import WalletConnector from '@/components/WalletConnector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { useGlobalState } from '@/store';

import { useProductsState } from '../../store';
import { InvestProgress, ProgressRef } from '../InvestProgress';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'InvestButton');

export interface BaseInvestButtonProps extends BaseProps {
  shouldPrepare?: boolean;
  preparing?: boolean;
  prepareText?: string;
  prepare?(): Promise<void>;
  insufficient?: boolean;
  onSubmit?(): Promise<unknown>;
}

export const BaseInvestButton = (props: BaseInvestButtonProps) => {
  const [t] = useTranslation('InvestButton');
  const wallet = useWalletStore();
  return props.shouldPrepare ? (
    <AsyncButton
      style={props.style}
      className={classNames(styles['btn-deposit'], props.className)}
      size="large"
      onClick={() => props.prepare?.()}
      loading={props.preparing}
    >
      {props.prepareText}
    </AsyncButton>
  ) : !wallet.address ? (
    <WalletConnector
      style={{ padding: 0 }}
      className={classNames(styles['btn-deposit'], props.className)}
      hideArrow
    >
      {(connecting) => (
        <Button style={props.style} size="large" loading={connecting}>
          {t('Connect Wallet')}
        </Button>
      )}
    </WalletConnector>
  ) : props.insufficient ? (
    <AsyncButton
      style={props.style}
      className={classNames(styles['btn-deposit'], props.className)}
      size="large"
      disabled
    >
      {t('Insufficient Balance')}
    </AsyncButton>
  ) : (
    <AsyncButton
      style={props.style}
      size="large"
      className={classNames(styles['btn-deposit'], props.className)}
      onClick={() => props.onSubmit?.()}
    >
      {props.children}
    </AsyncButton>
  );
};
type ProductsStateType = Pick<
  typeof useProductsState,
  'delQuote' | 'getState' | 'quote' | 'updateRecommendedList' | 'clearCart'
>;
export interface ProductInvestButtonProps extends BaseProps {
  vault: string;
  chainId: number;
  autoQuote?: boolean;
  afterInvest?(): void;
  vaultInfo?: Pick<VaultInfo, 'depositCcy' | 'riskType' | 'productType'>;
  useProductsState: ProductsStateType;
  products: PartialRequired<ProductQuoteParams, 'id' | 'vault'>[];
  quoteInfos: (ProductQuoteResult | undefined)[];
  mint: (
    cb: (progress: TransactionProgress) => void,
    data: ProductQuoteResult[],
  ) => Promise<void>;
  isInsufficientBalance: (amount: string | number) => boolean;
}

function useShouldQuote(
  wallet: { address?: string },
  products: PartialRequired<ProductQuoteParams, 'vault' | 'id'>[],
  quoteInfos: (ProductQuoteResult | undefined)[],
  _useProductsState: ProductsStateType,
) {
  // 每三秒触发一次检查，如果性能差可以再放宽些
  const time = useTime({ interval: 3000 });
  return useMemo(() => {
    const map = arrToDict<(typeof quoteInfos)[0]>(
      quoteInfos,
      ProductsService.productKey,
    );
    const shouldQuoteList = products.filter((it) => {
      const quoteInfo = map[ProductsService.productKey(it)];
      const shouldQuote =
        !quoteInfo ||
        (wallet.address && !quoteInfo.quote.signature) ||
        quoteInfo.quote.deadline * 1000 - 0.5 * MsIntervals.min <= time || // 提前
        (it && quoteInfo.amounts.own != it.depositAmount);
      if (shouldQuote && quoteInfo) _useProductsState.delQuote(quoteInfo);
      return shouldQuote;
    });
    return !!shouldQuoteList.length;
  }, [_useProductsState, products, quoteInfos, time, wallet.address]);
}

export const ProductInvestButton = (props: ProductInvestButtonProps) => {
  const [t] = useTranslation('InvestButton');
  const progressRef = useRef<ProgressRef>(null);
  const wallet = useWalletStore();
  useEffect(() => {
    useWalletStore.updateBalanceByVault(props.vault);
  }, [props.vault, wallet.address]);

  const { useProductsState, products, quoteInfos, vaultInfo } = props;
  const vault = useMemo(
    () =>
      vaultInfo && {
        vault: props.vault,
        chainId: props.chainId,
        ...vaultInfo,
      },
    [props.chainId, props.vault, vaultInfo],
  );
  const shouldQuote = useShouldQuote(
    wallet,
    products,
    quoteInfos,
    useProductsState,
  );
  const insufficient = useMemo(() => {
    if (!vault?.depositCcy) return false;
    if (shouldQuote) return false;
    const amount = simplePlus(...products.map((it) => it.depositAmount))!;
    return props.isInsufficientBalance(amount);
  }, [products, shouldQuote, vault?.depositCcy]);

  const showQuote = shouldQuote || !quoteInfos.length;
  const quote = useLazyCallback(async (noToast?: boolean) => {
    if (!showQuote || !vault) return;
    await wait(100);
    const list =
      useProductsState.getState().cart[
        `${props.vault.toLowerCase()}-${props.chainId}`
      ] || [];
    return Promise.all(
      list.map((it) => {
        const quoteInfo =
          useProductsState.getState().quoteInfos[
            ProductsService.productKey(it)
          ];
        if (
          quoteInfo &&
          quoteInfo.quote.signature &&
          quoteInfo.quote.deadline * 1000 > Date.now() &&
          it.depositAmount == quoteInfo.amounts.own
        )
          return;
        return useProductsState.quote(it);
      }),
    )
      .then(() => {
        // 彩票产品在询价之后更新一下推荐列表
        if (vault.riskType === RiskType.RISKY)
          useProductsState.updateRecommendedList(vault);
      })
      .catch((err) => {
        if (noToast) return;
        throw err;
      });
  });

  const productKeys = useMemo(
    () =>
      products
        .map((it) => ProductsService.productKey(it))
        .sort((a, b) => a.localeCompare(b))
        .join('-'),
    [products],
  );

  useEffect(() => {
    if (props.autoQuote && shouldQuote) quote(true);
  }, [props.autoQuote, quote, shouldQuote, productKeys]);

  const interestRate = useGlobalState(
    (state) => vault && state.interestRate[wallet.chainId]?.[vault.depositCcy],
  );

  const handleSubmit = useLazyCallback(async () => {
    if (!vault) return;
    const amount = simplePlus(...quoteInfos.map((it) => it?.amounts.own)) || 0;
    const insufficient = props.isInsufficientBalance(amount);
    if (insufficient) {
      return Toast.warning(t('Balance is no enough!'));
    }
    const delRfq = (key: NonNullable<TransactionProgress['details']>[0][0]) => {
      quoteInfos.forEach((quote) => {
        if (!quote) return;
        const k = `${quote.vault.vault.toLowerCase()}-${quote.vault.chainId}-${
          quote.vault.depositCcy
        }`;
        if (k === key) {
          ProductsService.delRfq(quote.rfqId);
          useProductsState.delQuote(quote);
        }
      });
    };
    const judgeConsumed = (progress: TransactionProgress) => {
      if (/failed/i.test(progress.status)) {
        progress.details?.forEach((it) => {
          if (/signature consumed/i.test(getErrorMsg(it[1].error))) {
            delRfq(it[0]);
          }
        });
      }
    };
    const judgeSuccess = (progress: TransactionProgress) => {
      if (/Success|Partial/i.test(progress.status)) {
        progress.details?.forEach((it) => {
          if (it[1].status === PositionStatus.MINTED) {
            delRfq(it[0]);
          }
        });
        if (vault.riskType === RiskType.RISKY) pokerRightsReminder();
        useWalletStore.updateBalanceByVault(props.vault);
      }
      if (/Success/i.test(progress.status)) {
        if (vault.riskType === RiskType.RISKY)
          useProductsState.clearCart(vault);
        waitUntil(() => !progressRef.current?.visible, {
          interval: 300,
          timeout: 10000000,
        }).then(() => props.afterInvest?.());
      }
    };
    return props.mint((it) => {
      progressRef.current?.update(it);
      judgeConsumed(it);
      judgeSuccess(it);
    }, quoteInfos as ProductQuoteResult[]);
  });

  if (!vault) return <></>;

  return (
    <>
      <BaseInvestButton
        shouldPrepare={shouldQuote || !products.length}
        preparing={
          vault.riskType === RiskType.PROTECTED && !interestRate?.apyUsed
        }
        prepare={quote}
        prepareText={
          vault.riskType === RiskType.PROTECTED && !interestRate?.apyUsed
            ? t('In Preparation...')
            : t('Request For Quote')
        }
        insufficient={insufficient}
        onSubmit={handleSubmit}
      >
        {vault.riskType === RiskType.RISKY
          ? t('Purchase All Tickets')
          : t('Deposit')}
      </BaseInvestButton>
      <InvestProgress chainId={wallet.chainId} ref={progressRef} />
    </>
  );
};
const InvestButton = (
  props: Omit<
    ProductInvestButtonProps,
    | 'useProductsState'
    | 'products'
    | 'quoteInfos'
    | 'mint'
    | 'isInsufficientBalance'
    | 'insufficientDeps'
  >,
) => {
  const wallet = useWalletStore();
  const $products = useProductsState(
    (state) =>
      state.cart[`${props.vault.toLowerCase()}-${props.chainId}`] || [],
  );
  const products = useMemo(
    () => $products.filter((it) => !useProductsState.productValidator(it)),
    [$products],
  );
  const quoteInfos = useProductsState((state) =>
    products.map((it) => state.quoteInfos[ProductsService.productKey(it)]),
  );

  const vault = useMemo(
    () =>
      ProductsService.findVault(ContractsService.vaults, {
        chainId: props.chainId,
        vault: props.vault,
      }),
    [props.chainId, props.vault],
  );
  return (
    <ProductInvestButton
      products={products}
      quoteInfos={quoteInfos}
      useProductsState={useProductsState}
      vaultInfo={vault}
      mint={(cb, data) => {
        if (data.length === 1) {
          return PositionsService.deposit(cb, data[0]!);
        }
        return PositionsService.batchDeposit(cb, data as ProductQuoteResult[]);
      }}
      isInsufficientBalance={(amount) =>
        !vault ||
        !wallet.balance ||
        Number(wallet.balance[vault.depositCcy]) < +amount
      }
      {...props}
    />
  );
};
export default InvestButton;
