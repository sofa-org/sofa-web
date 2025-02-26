import { AutomatorVaultInfo } from '@sofa/services/base-type';
import {
  ProductQuoteParams,
  ProductQuoteResult,
  ProductsService,
  RiskType,
  VaultInfo,
} from '@sofa/services/products';
import { useLazyCallback } from '@sofa/utils/hooks';
import { dirtyArrayOmit, toArray } from '@sofa/utils/object';
import { isEqual } from 'lodash-es';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { useWalletStore } from '@/components/WalletConnector/store';

import { getCurrentCreatorAutomator } from './automator-operate/components/AutomatorSelector';
export const useProductsState = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        recommendedList: {} as Record<
          `${AutomatorVaultInfo['vault']}-${AutomatorVaultInfo['chainId']}`,
          ProductQuoteResult[]
        >,
        cart: {} as PartialRecord<
          `${AutomatorVaultInfo['vault']}-${AutomatorVaultInfo['chainId']}`, // 按照 vault+chainId 来区分购物车
          PartialRequired<ProductQuoteParams, 'id' | 'vault'>[]
        >,
        quoteInfos: {} as PartialRecord<
          ReturnType<typeof ProductsService.productKey>,
          ProductQuoteResult
        >,
        hoverTicketIds: {} as Record<
          `${AutomatorVaultInfo['vault']}-${AutomatorVaultInfo['chainId']}`,
          string | undefined
        >,
      }),
      {
        name: 'products-state-new',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
    isEqual,
  ),
  {
    updateRecommendedList: async (
      vault: Pick<VaultInfo, 'vault' | 'chainId' | 'productType'>,
    ) => {
      // automator don't support recommended list yet
    },
    clearCart: (vault: Pick<AutomatorVaultInfo, 'vault' | 'chainId'>) => {
      useProductsState.setState((pre) => ({
        cart: {
          ...pre.cart,
          [`${vault.vault.toLowerCase()}-${vault.chainId}`]: undefined,
        },
      }));
    },
    // 彩票产品的 depositAmount 为 undefined 或者 0 时，表示删除
    updateCart: (
      automatorVault: Pick<AutomatorVaultInfo, 'vault' | 'chainId'>,
      params: PartialRequired<ProductQuoteParams, 'id' | 'vault'>,
    ) => {
      const key = `${automatorVault.vault.toLowerCase()}-${
        automatorVault.chainId
      }` as const;
      const vault = params.vault;
      if ([RiskType.PROTECTED, RiskType.LEVERAGE].includes(vault.riskType)) {
        useProductsState.setState((pre) => {
          return {
            cart: {
              ...pre.cart,
              [key]: [{ ...pre.cart[key]?.[0], ...params }],
            },
          };
        });
      } else {
        useProductsState.setState((pre) => {
          const oldArr = pre.cart[key] || [];
          const index = oldArr.findIndex((it) => it.id === params.id);
          const arr = (() => {
            if ('depositAmount' in params && !Number(params.depositAmount)) {
              // delete
              return oldArr.filter((_, i) => i !== index);
            }
            if (index >= 0) {
              // update
              return oldArr.map((it, i) =>
                i === index ? { ...it, ...params } : it,
              );
            }
            // add
            return oldArr.concat(params);
          })();
          return { cart: { ...pre.cart, [key]: arr } };
        });
      }
    },
    productValidator: (
      params: PartialRequired<ProductQuoteParams, 'vault'>,
    ) => {
      if (!params.depositAmount)
        return new Error('Please enter deposit amount');
      if (!params.expiry) return new Error('Please select expiry');
      if (!params.anchorPrices?.length || params.anchorPrices.some((it) => !it))
        return new Error('Please select the prices');
      const vault = params.vault;
      if (!vault) return new Error('Please switch deposit currency');
      if (
        vault.riskType === RiskType.PROTECTED &&
        params.fundingApy === undefined
      )
        return new Error(
          'Please wait for the yield from Aave/Lido/Sofa/Curve to be successfully retrieved',
        );
      return null;
    },
    updateQuotes: (
      quote: ProductQuoteResult | ProductQuoteResult[],
      replaceAll?: boolean,
    ) => {
      useProductsState.setState((pre) => ({
        quoteInfos: {
          ...(replaceAll
            ? {}
            : Object.fromEntries(
                dirtyArrayOmit(
                  Object.entries(pre.quoteInfos),
                  (it) =>
                    !it[1] ||
                    it[1].quote.deadline * 1000 - 30 * 1000 <= Date.now(),
                ),
              )),
          ...Object.fromEntries(
            toArray(quote).map((it) => [ProductsService.productKey(it), it]),
          ),
        },
      }));
    },
    quote: async (params: PartialRequired<ProductQuoteParams, 'vault'>) => {
      const error = useProductsState.productValidator(params);
      if (error) throw error;
      const vault = params.vault;
      const { automator } = getCurrentCreatorAutomator();
      return ProductsService.quote(vault.productType, {
        ...params,
        takerWallet: automator?.vaultInfo?.vault,
      } as ProductQuoteParams).then((res) => {
        useProductsState.updateQuotes(res);
        return res;
      });
    },
    delQuote: (quoteInfo: ProductQuoteResult) => {
      useProductsState.setState((pre) => {
        const quoteInfos = { ...pre.quoteInfos };
        delete quoteInfos[ProductsService.productKey(quoteInfo)];
        return { quoteInfos };
      });
    },
    isQuoting: (params: Partial<ProductQuoteParams>) => {
      if (
        !params.depositAmount ||
        !params.expiry ||
        !params.anchorPrices?.length ||
        !params.vault
      )
        return false;
      const key = ProductsService.productKey(params as ProductQuoteParams);
      return !useProductsState.getState().quoteInfos[key];
    },
    updateHoverTicket: (
      vault: Pick<AutomatorVaultInfo, 'vault' | 'chainId'>,
      id?: string,
    ) => {
      useProductsState.setState((pre) => ({
        hoverTicketIds: {
          ...pre.hoverTicketIds,
          [`${vault.vault.toLowerCase()}-${vault.chainId}`]: id,
        },
      }));
    },
  },
);

// 钱包发生变化时，清除所有的报价（因为需要重新签名）
useWalletStore.subscribe((state, preState) => {
  if (state.address !== preState.address)
    useProductsState.setState({ quoteInfos: {} });
});

export function useHoverTicket(
  vault?: Pick<AutomatorVaultInfo, 'vault' | 'chainId'>,
) {
  const hoverTicket = useProductsState((state) => {
    if (!vault) return undefined;
    const key = `${vault.vault.toLowerCase()}-${vault.chainId}` as const;
    const id = state.hoverTicketIds[key];
    const ticket = state.cart[key]?.find((it) => it.id === id);
    if (!ticket) return undefined;
    const quoteInfo = state.quoteInfos[ProductsService.productKey(ticket)];
    return { ticket, quoteInfo };
  });
  const setHoverTicket = useLazyCallback((id?: string) => {
    if (!vault) return undefined;
    return useProductsState.updateHoverTicket(vault, id);
  });
  return [hoverTicket, setHoverTicket] as const;
}
