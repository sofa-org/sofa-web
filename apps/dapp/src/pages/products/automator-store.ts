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
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { useWalletStore } from '@/components/WalletConnector/store';
export const debugProductStateWithSepolia = true;
export const useProductsState = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
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
        automatorVault: undefined as undefined | AutomatorVaultInfo,
      }),
      {
        name: 'products-state-new',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
  {
    updateAutomatorVault: (vault?: AutomatorVaultInfo) => {
      if (!vault && debugProductStateWithSepolia) {
        useProductsState.setState({
          automatorVault: JSON.parse(
            `{"chainId":11155111,"automatorName":"The One","automatorDescription":"aaa bbb ccc","automatorVault":"0x8d922b143933fd6d4f6f82ae2acea6d78b6a23a9","participantNum":7,"amount":"93.276912597458798528754","aumInVaultDepositCcy":"93.276912597458798528754","aumInClientDepositCcy":"93.276912597458798528754","aumByVaultDepositCcy":"93.276912597458798528754","aumByClientDepositCcy":"93.276912597458798528754","creatorAmount":"0","creatorAumInVaultDepositCcy":"0","creatorAumInClientDepositCcy":"0","creatorAumByVaultDepositCcy":"0","creatorAumByClientDepositCcy":"0","nav":"2.2375977220620884","dateTime":"1736147539","yieldPercentage":"0","creator":"0xA4A0425Bac7b53ECC4283A3b34A2308283CDbbd8","createTime":1732435200000,"feeRate":"0","totalTradingPnlByClientDepositCcy":"22.002759597458798528754","totalInterestPnlByClientDepositCcy":"0","totalPnlByClientDepositCcy":"22.002759597458798528754","totalRchPnlByClientDepositCcy":"5433.16019464097125","totalRchAmount":"12500","totalPnlWithRchByClientDepositCcy":"5455.162954238430048528754","pnlPercentage":"4991.55","vaultDepositCcy":"USDC","clientDepositCcy":"USDC","sharesToken":"atUSDT","profits":"0","vault":"0x8d922b143933FD6D4f6f82ae2Acea6D78b6a23a9","name":"USDC","desc":"aaa bbb ccc","creatorFeeRate":0,"depositCcy":"USDT","positionCcy":"atUSDC","redeemWaitPeriod":1200000,"claimPeriod":600000,"abis":[{"inputs":[{"internalType":"address","name":"pool_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"yieldShares","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Deposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"feeAmount","type":"uint256"},{"indexed":false,"internalType":"int256","name":"fee","type":"int256"},{"indexed":false,"internalType":"uint256","name":"protocolFeeAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"protocolFee","type":"uint256"}],"name":"FeeCollected","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"components":[{"internalType":"address","name":"vault","type":"address"},{"components":[{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint256[2]","name":"anchorPrices","type":"uint256[2]"}],"internalType":"struct Product[]","name":"products","type":"tuple[]"}],"indexed":false,"internalType":"struct AAVEAutomatorBase.ProductBurn[]","name":"products","type":"tuple[]"},{"indexed":false,"internalType":"uint256","name":"accCollateralPerShare","type":"uint256"},{"indexed":false,"internalType":"int256","name":"fee","type":"int256"},{"indexed":false,"internalType":"uint256","name":"protocolFee","type":"uint256"}],"name":"ProductsBurned","type":"event"},{"anonymous":false,"inputs":[{"components":[{"internalType":"address","name":"vault","type":"address"},{"internalType":"uint256","name":"totalCollateral","type":"uint256"},{"components":[{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint256[2]","name":"anchorPrices","type":"uint256[2]"},{"internalType":"uint256","name":"makerCollateral","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"address","name":"maker","type":"address"},{"internalType":"bytes","name":"makerSignature","type":"bytes"}],"internalType":"struct MintParams","name":"mintParams","type":"tuple"}],"indexed":false,"internalType":"struct AAVEAutomatorBase.ProductMint[]","name":"products","type":"tuple[]"}],"name":"ProductsMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"yieldShares","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"RedemptionsClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[],"name":"MINIMUM_SHARES","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"aToken","outputs":[{"internalType":"contract IAToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"vault","type":"address"},{"components":[{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint256[2]","name":"anchorPrices","type":"uint256[2]"}],"internalType":"struct Product[]","name":"products","type":"tuple[]"}],"internalType":"struct AAVEAutomatorBase.ProductBurn[]","name":"products","type":"tuple[]"}],"name":"burnProducts","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimRedemptions","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"collateral","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPricePerShare","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRedemption","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUnredeemedCollateral","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"harvest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner_","type":"address"},{"internalType":"address","name":"collateral_","type":"address"},{"internalType":"uint256","name":"feeRate_","type":"uint256"},{"internalType":"uint256","name":"maxPeriod_","type":"uint256"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"maxPeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"vault","type":"address"},{"internalType":"uint256","name":"totalCollateral","type":"uint256"},{"components":[{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint256[2]","name":"anchorPrices","type":"uint256[2]"},{"internalType":"uint256","name":"makerCollateral","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"address","name":"maker","type":"address"},{"internalType":"bytes","name":"makerSignature","type":"bytes"}],"internalType":"struct MintParams","name":"mintParams","type":"tuple"}],"internalType":"struct AAVEAutomatorBase.ProductMint[]","name":"products","type":"tuple[]"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"mintProducts","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC1155BatchReceived","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC1155Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pool","outputs":[{"internalType":"contract IPool","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalCollateral","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalFee","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalPendingRedemptions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalPositions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalProtocolFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}],"collateralDecimal":1000000,"anchorPricesDecimal":100000000,"depositMinAmount":0.05,"depositTickAmount":0.05}`,
          ),
        });
        return;
      }
      useProductsState.setState({
        automatorVault: vault,
      });
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
      params: PartialRequired<ProductQuoteParams, 'id' | 'vault'>,
    ) => {
      // debugger;
      const vault = params.vault;
      const key = `${vault.vault.toLowerCase()}-${vault.chainId}` as const;
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
      if (vault.riskType === RiskType.PROTECTED && !params.fundingApy)
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
      return ProductsService.quote(vault.productType, {
        ...params,
        takerWallet: useProductsState.getState().automatorVault?.vault,
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
