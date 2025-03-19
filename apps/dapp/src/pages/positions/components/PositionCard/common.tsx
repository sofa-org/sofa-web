import { useMemo } from 'react';
import { PositionInfo } from '@sofa/services/positions';
import { ProductType, VaultInfo } from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';
import { MsIntervals } from '@sofa/utils/expiry';
import { currQuery } from '@sofa/utils/history';

export interface PositionCardProps {
  isAutomator?: boolean;
  position: PositionInfo & { vault: VaultInfo };
  onStatusChange?(status: PositionStatus): void;
  onClick?(): void;
  showBaseCcyEst: boolean;
}

export const BUFFER_TIME_FOR_SETTLEMENT = MsIntervals.min * 5;
export function judgeSettled(position: PositionInfo) {
  const product = position.product;

  if (currQuery().settled) return Date.now() - product.expiry * 1000 > 0;

  const isTrend = [ProductType.BearSpread, ProductType.BullSpread].includes(
    product.vault.productType,
  );
  if (isTrend) return !!position.triggerPrice;
  return (
    Date.now() - product.expiry * 1000 > BUFFER_TIME_FOR_SETTLEMENT ||
    !!(position.claimParams.maker && position.triggerTime)
  );
}

export function usePositionSettled(position: PositionInfo) {
  return useMemo(() => judgeSettled(position), [position]);
}
