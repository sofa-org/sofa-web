import { useEffect, useMemo, useRef } from 'react';
import { Button, Toast } from '@douyinfe/semi-ui';
import { wait, waitUntil } from '@livelybone/promise-wait';
import { useTranslation } from '@sofa/services/i18n';
import { DepositProgress, PositionsService } from '@sofa/services/positions';
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
import WalletConnector from '@/components/WalletConnector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { useGlobalState } from '@/store';

import { useProductsState } from '../../store';
import { InvestProgress, ProgressRef } from '../InvestProgress';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'InvestButton');

export interface InvestButtonProps extends BaseProps {
  vault: string;
  chainId: number;
  autoQuote?: boolean;
  afterInvest?(): void;
}

function useShouldQuote(
  wallet: { address?: string },
  products: PartialRequired<ProductQuoteParams, 'vault' | 'id'>[],
  quoteInfos: (ProductQuoteResult | undefined)[],
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
      if (shouldQuote && quoteInfo) useProductsState.delQuote(quoteInfo);
      return shouldQuote;
    });
    return !!shouldQuoteList.length;
  }, [products, quoteInfos, time, wallet.address]);
}

const InvestButton = (props: InvestButtonProps) => {
  const [t] = useTranslation('InvestButton');
  const progressRef = useRef<ProgressRef>(null);
  const wallet = useWalletStore();
  useEffect(() => {
    useWalletStore.updateBalanceByVault(props.vault);
  }, [props.vault, wallet.address]);

  const vault = useGlobalState((state) =>
    ProductsService.findVault(state.vaults, {
      chainId: props.chainId,
      vault: props.vault,
    }),
  );

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
  const shouldQuote = useShouldQuote(wallet, products, quoteInfos);
  const insufficient = useMemo(() => {
    if (!vault?.depositCcy) return false;
    const balance = wallet.balance?.[vault.depositCcy];
    if (shouldQuote || isNullLike(balance)) return false;
    const amount = simplePlus(...products.map((it) => it.depositAmount))!;
    return amount > balance;
  }, [products, shouldQuote, vault?.depositCcy, wallet.balance]);

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

  if (!vault) return <></>;

  const el = showQuote ? (
    <AsyncButton
      style={props.style}
      className={classNames(styles['btn-deposit'], props.className)}
      size="large"
      onClick={() => quote()}
      loading={vault.riskType === RiskType.PROTECTED && !interestRate?.apyUsed}
    >
      {vault.riskType === RiskType.PROTECTED && !interestRate?.apyUsed
        ? t('In Preparation...')
        : t('Request For Quote')}
    </AsyncButton>
  ) : !wallet.address ? (
    <WalletConnector style={{ padding: 0 }} hideArrow>
      {(connecting) => (
        <Button
          style={props.style}
          size="large"
          className={classNames(styles['btn-deposit'], props.className)}
          loading={connecting}
        >
          {t('Connect Wallet')}
        </Button>
      )}
    </WalletConnector>
  ) : insufficient ? (
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
      onClick={() => {
        const amount =
          simplePlus(...quoteInfos.map((it) => it?.amounts.own)) || 0;
        if (
          wallet.balance?.[vault.depositCcy] &&
          wallet.balance[vault.depositCcy]! < amount
        ) {
          return Toast.warning(t('Balance is no enough!'));
        }
        const delRfq = (key: NonNullable<DepositProgress['details']>[0][0]) => {
          quoteInfos.forEach((quote) => {
            if (!quote) return;
            const k = `${quote.vault.vault.toLowerCase()}-${
              quote.vault.chainId
            }-${quote.vault.depositCcy}`;
            if (k === key) {
              ProductsService.delRfq(quote.rfqId);
              useProductsState.delQuote(quote);
            }
          });
        };
        const judgeConsumed = (progress: DepositProgress) => {
          if (/failed/i.test(progress.status)) {
            progress.details?.forEach((it) => {
              if (/signature consumed/i.test(getErrorMsg(it[1].error))) {
                delRfq(it[0]);
              }
            });
          }
        };
        const judgeSuccess = (progress: DepositProgress) => {
          if (/Success|Partial/i.test(progress.status)) {
            progress.details?.forEach((it) => {
              if (it[1].status === PositionStatus.MINTED) {
                delRfq(it[0]);
              }
            });
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
        if (quoteInfos.length === 1) {
          return PositionsService.deposit((it) => {
            progressRef.current?.update(it);
            judgeConsumed(it);
            judgeSuccess(it);
          }, quoteInfos[0]!);
        }
        return PositionsService.batchDeposit((it) => {
          progressRef.current?.update(it);
          judgeConsumed(it);
          judgeSuccess(it);
        }, quoteInfos as ProductQuoteResult[]);
      }}
    >
      {vault.riskType === RiskType.RISKY
        ? t('Purchase All Tickets')
        : t('Deposit')}
    </AsyncButton>
  );

  return (
    <>
      {el}
      <InvestProgress chainId={wallet.chainId} ref={progressRef} />
    </>
  );
};

export default InvestButton;
