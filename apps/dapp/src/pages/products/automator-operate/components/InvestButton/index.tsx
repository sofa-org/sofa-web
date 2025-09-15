import { useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { ProductType, RiskType } from '@sofa/services/contracts';
import { ProductsService } from '@sofa/services/products';

import { calcAvailableBalance } from '@/pages/products/automator-create/util';
import { useAutomatorProductsState } from '@/pages/products/automator-store';
import {
  ProductInvestButton,
  ProductInvestButtonProps,
} from '@/pages/products/components/InvestButton';

import {
  getCurrentCreatorAutomator,
  useCreatorAutomatorSelector,
} from '../AutomatorSelector';

export const AutomatorInvestButton = (
  props: Omit<
    ProductInvestButtonProps,
    | 'vault'
    | 'delQuote'
    | 'quote'
    | 'updateRecommendedList'
    | 'clearCart'
    | 'products'
    | 'quoteInfos'
    | 'mint'
    | 'isInsufficientBalance'
  > & {
    vault: AutomatorVaultInfo;
  },
) => {
  const { automator } = useCreatorAutomatorSelector();
  const $products = useAutomatorProductsState(
    (state) =>
      state.cart[`${props.vault.vault.toLowerCase()}-${props.vault.chainId}`] ||
      [],
  );
  const products = useMemo(
    () =>
      $products.filter((it) => !useAutomatorProductsState.productValidator(it)),
    [$products],
  );
  const quoteInfos = useAutomatorProductsState((state) =>
    Object.fromEntries(
      products.map((it) => {
        const k = ProductsService.productKey(it);
        return [k, state.quoteInfos[k]];
      }),
    ),
  );

  const availableBalance = useMemo(
    () => calcAvailableBalance(automator),
    [automator],
  );

  return (
    <ProductInvestButton
      {...props}
      vault={{
        chainId: props.vault.chainId,
        vault: props.vault.vault,
        depositCcy: props.vault.depositCcy,
        realDepositCcy: props.vault.realDepositCcy,
        riskType: RiskType.RISKY,
        // for automator, there is no recommended list, so the value of productType doesn't matter
        productType: ProductType.BearSpread,
        onlyForAutomator: true,
      }}
      products={products}
      quoteInfos={quoteInfos}
      delQuote={useAutomatorProductsState.delQuote}
      quote={useAutomatorProductsState.quote}
      updateRecommendedList={useAutomatorProductsState.updateRecommendedList}
      clearCart={useAutomatorProductsState.clearCart}
      mint={async (cb, data) => {
        const a = getCurrentCreatorAutomator();
        if (!a.automator) {
          Toast.error('cannot find current creator automator');
          return;
        }
        return AutomatorCreatorService.mintProducts(
          cb,
          a.automator.vaultInfo,
          data,
        );
      }}
      isInsufficientBalance={(amount) => availableBalance < +amount}
    />
  );
};
