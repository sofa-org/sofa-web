import { useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { ProductType, RiskType } from '@sofa/services/contracts';
import { ProductsService } from '@sofa/services/products';

import { useProductsState } from '@/pages/products/automator-store';
import {
  ProductInvestButton,
  ProductInvestButtonProps,
} from '@/pages/products/components/InvestButton';

import { getCurrentCreatorAutomator } from '../AutomatorSelector';

const InvestButton = (
  props: Omit<
    ProductInvestButtonProps,
    'useProductsState' | 'products' | 'quoteInfos' | 'mint'
  > & {
    depositCcy: string;
  },
) => {
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

  return (
    <ProductInvestButton
      products={products}
      quoteInfos={quoteInfos}
      useProductsState={useProductsState}
      vaultInfo={{
        depositCcy: props.depositCcy,
        riskType: RiskType.RISKY,
        // for automator, there is no recommended list, so the value of productType doesn't matter
        productType: ProductType.BearSpread,
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
      {...props}
    />
  );
};
export default InvestButton;
