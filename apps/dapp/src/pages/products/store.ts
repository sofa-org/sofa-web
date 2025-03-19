import {
  isDualQuoteParams,
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
import { Toast } from '@douyinfe/semi-ui';
import { getErrorMsg } from '@sofa/utils/fns';

export const useProductsState = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        recommendedList: {} as Record<
          `${VaultInfo['vault']}-${VaultInfo['chainId']}`,
          ProductQuoteResult[]
        >,
        cart: {} as PartialRecord<
          `${VaultInfo['vault']}-${VaultInfo['chainId']}`, // 按照 vault+chainId 来区分购物车
          PartialRequired<ProductQuoteParams, 'id' | 'vault'>[]
        >,
        quoteInfos: {} as PartialRecord<
          ReturnType<typeof ProductsService.productKey>,
          ProductQuoteResult
        >,
        hoverTicketIds: {} as Record<
          `${VaultInfo['vault']}-${VaultInfo['chainId']}`,
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
      vault: Pick<VaultInfo, 'vault' | 'chainId' | 'productType' | 'riskType'>,
    ) => {
      const list = await ProductsService.listRecommended(vault);
      useProductsState.setState((pre) => ({
        recommendedList: {
          ...pre.recommendedList,
          [`${vault.vault.toLowerCase()}-${vault.chainId}`]: list,
        },
      }));
    },
    clearCart: (vault: Pick<VaultInfo, 'vault' | 'chainId'>) => {
      useProductsState.setState((pre) => ({
        cart: {
          ...pre.cart,
          [`${vault.vault.toLowerCase()}-${vault.chainId}`]: undefined,
        },
      }));
    },
    // 彩票产品的 depositAmount 为 undefined 或者 0 时，表示删除
    updateCart: (
      params: PartialRequired<ProductQuoteParams, 'id' | 'vault'>,
    ) => {
      const vault = params.vault;
      const key = `${vault.vault.toLowerCase()}-${vault.chainId}` as const;
      if (
        [RiskType.PROTECTED, RiskType.LEVERAGE, RiskType.DUAL].includes(
          vault.riskType,
        )
      ) {
        // 同时只允许一条 product quote
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
      const vault = params.vault;
      if (!vault) return new Error('Please switch deposit currency');
      if (isDualQuoteParams(params)) {
        if (!params?.anchorPrices?.[0])
          return new Error('Please input the price');
      }
      if (
        vault.riskType === RiskType.PROTECTED &&
        params.fundingApy === undefined
      )
        return new Error(
          'Please wait for the yield from Aave/Lido/Sofa/Curve/Avalon to be successfully retrieved',
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
      return ProductsService.quote({
        ...params,
        takerWallet: useWalletStore.getState().address,
      } as ProductQuoteParams).then((res) => {
        useProductsState.updateQuotes(res);
        return res;
      }).catch(e => {
        console.error(e);
        Toast.error(getErrorMsg(e));
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
      if (!ProductsService.readyForQuote(params)) {
        return false;
      }
      const key = ProductsService.productKey(params as ProductQuoteParams);
      return !useProductsState.getState().quoteInfos[key];
    },
    updateHoverTicket: (vault: VaultInfo, id?: string) => {
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

export function useHoverTicket(vault?: VaultInfo) {
  const hoverTicket = useProductsState((state) => {
    if (!vault) return undefined;
    const key = `${vault.vault.toLowerCase()}-${vault.chainId}` as const;
    const id = state.hoverTicketIds[key];
    const ticket =
      state.cart[key]?.find((it) => it.id === id) || state.cart[key]?.[0];
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
