import { useMemo } from 'react';
import { ProductType, RiskType } from '@sofa/services/base-type';
import { PositionInfo } from '@sofa/services/positions';
import { amountFormatter } from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';

import styles from './index.module.scss';

export const TrendImg = (props: { data: Partial<PositionInfo> }) => {
  const position = props.data;
  const product = props.data?.product;
  const anchorPricesTransform = useMemo(() => {
    if (!position.triggerPrice || !product?.anchorPrices) return undefined;
    if (product.vault.productType === ProductType.BullSpread) {
      return position.triggerPrice <= +product.anchorPrices[0]
        ? 'translate(-73,80)'
        : position.triggerPrice >= +product.anchorPrices[1]
          ? 'translate(48,-47)'
          : '';
    }
    return position.triggerPrice <= +product.anchorPrices[0]
      ? 'translate(48,-47)'
      : position.triggerPrice >= +product.anchorPrices[1]
        ? 'translate(-73,80)'
        : '';
  }, [
    position.triggerPrice,
    product?.anchorPrices,
    product?.vault.productType,
  ]);
  if (!position.amounts || !product)
    return <div className={styles['trend-img']} />;
  const hasExpired = Number(product.expiry) * 1000 <= Date.now();
  const isRisky = product.vault.riskType === RiskType.RISKY;
  return (
    <div className={styles['trend-img']}>
      <svg
        viewBox="0 0 261 131"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform:
            product.vault.productType === ProductType.BearSpread
              ? 'rotateY(180deg)'
              : undefined,
        }}
      >
        <path
          d="M0 1L261 1"
          stroke="black"
          strokeOpacity="0.4"
          strokeWidth="1.11732"
          strokeDasharray="2.23 2.23"
        />
        <path
          d="M172.082 1L172.082 130"
          stroke="black"
          strokeOpacity="0.4"
          strokeWidth="1.11732"
          strokeDasharray="2.23 2.23"
        />
        <path
          d="M0 130.386L261 130.386"
          stroke="black"
          strokeOpacity="0.4"
          strokeWidth="1.11732"
          strokeDasharray="2.23 2.23"
        />
        <path
          d="M0 130H93.9992L172.332 1H260.848"
          strokeWidth="2"
          stroke={hasExpired ? 'black' : '#44C476'}
        />
        {anchorPricesTransform && (
          <path
            d="M143.24 57.5474L151.9 48.8871L143.24 40.2269L134.58 48.8871L143.24 57.5474ZM141.74 48.8121C141.74 49.6405 142.412 50.3121 143.24 50.3121C144.069 50.3121 144.74 49.6405 144.74 48.8121L141.74 48.8121ZM144.74 48.8621C144.74 48.0337 144.069 47.3621 143.24 47.3621C142.412 47.3621 141.74 48.0337 141.74 48.8621L144.74 48.8621ZM141.74 48.7871L141.74 48.8121L144.74 48.8121L144.74 48.7871L141.74 48.7871ZM141.74 48.8621L141.74 48.8871L144.74 48.8871L144.74 48.8621L141.74 48.8621Z"
            fill="black"
            transform={anchorPricesTransform}
          />
        )}
      </svg>
      {product.anchorPrices?.map((it, i) => (
        <span className={styles['barrier-1']} key={`${it}-${i}`}>
          {amountFormatter(it, 0)}
        </span>
      ))}
      <span className={styles['return-min']}>
        {amountFormatter(
          simplePlus(
            position.amounts.minRedeemable,
            isRisky ? 0 : -position.amounts.own,
          ),
          2,
        )}{' '}
        {product.vault.realDepositCcy ?? product.vault.depositCcy}
      </span>
      <span className={styles['return-max']}>
        {amountFormatter(
          simplePlus(
            position.amounts.maxRedeemable,
            isRisky ? 0 : -position.amounts.own,
          ),
          2,
        )}{' '}
        {product.vault.realDepositCcy ?? product.vault.depositCcy}
      </span>
    </div>
  );
};
