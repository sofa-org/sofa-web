import { useMemo } from 'react';
import { ProductType, RiskType } from '@sofa/services/contracts';
import { ProductsService } from '@sofa/services/products';

import { useProductsState } from '@/pages/products/automator-store';
import {
  ProductInvestButton,
  ProductInvestButtonProps,
} from '@/pages/products/components/InvestButton';

const InvestButton = (
  props: Omit<
    ProductInvestButtonProps,
    'useProductsState' | 'products' | 'quoteInfos'
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
      {...props}
    />
  );
};
export default InvestButton;
