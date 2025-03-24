import { useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { ProductType, RiskType } from '@sofa/services/contracts';
import { ProductsService } from '@sofa/services/products';

import { calcAvailableBalance } from '@/pages/products/automator-create/util';
import { useProductsState } from '@/pages/products/automator-store';
import {
  ProductInvestButton,
  ProductInvestButtonProps,
} from '@/pages/products/components/InvestButton';

import {
  getCurrentCreatorAutomator,
  useCreatorAutomatorSelector,
} from '../AutomatorSelector';

const InvestButton = (
  props: Omit<
    ProductInvestButtonProps,
    | 'useProductsState'
    | 'products'
    | 'quoteInfos'
    | 'mint'
    | 'isInsufficientBalance'
  > & {
    depositCcy: string;
  },
) => {
  const { automator } = useCreatorAutomatorSelector();
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

  const availableBalance = useMemo(
    () => calcAvailableBalance(automator),
    [automator],
  );

  return (
    <ProductInvestButton
      products={products}
      quoteInfos={quoteInfos}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useProductsState={useProductsState as any}
      vaultInfo={{
        depositCcy: props.depositCcy,
        riskType: RiskType.RISKY,
        // for automator, there is no recommended list, so the value of productType doesn't matter
        productType: ProductType.BearSpread,
        onlyForAutomator: true,
      }}
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
      {...props}
    />
  );
};
export default InvestButton;
