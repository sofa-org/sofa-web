import { ProductType, VaultInfo } from './base-type';
import { PositionInfo } from './positions';
import { ProductInfo, ProductQuoteResult } from './products';

export interface DualProfitRenderProps {
  linkedCcy: VaultInfo['forCcy'] | VaultInfo['domCcy'];
  linkedCcyAmountWhenSuccessfulExecuted: number; // 要交换目标币种金额(如果成功兑换)
  linkedCcyExtraRewardWhenSuccessfulExecuted: number; // 要交换目标币种奖励金额(如果成功兑换)
  depositCcy: VaultInfo['depositCcy'];
  depositAmount: number; // 本金
  rchReturnAmount: number; // RCH 空投金额
  depositCcyExtraRewardWhenNoExecuted: number; // 如果没交换成功，得到的金额
  productType: VaultInfo['productType'];
  executionResult?:
    | DualPositionExecutionStatus.Executed
    | DualPositionExecutionStatus.NotExecuted
    | DualPositionExecutionStatus.PartialExecuted;
}
export enum DualPositionExecutionStatus {
  NotExpired = 'NotExpired',
  Executed = 'Executed',
  NotExecuted = 'NotExecuted',
  PartialExecuted = 'PartialExecuted',
}
export function getDualLinkedCcy(vault: VaultInfo) {
  return vault.forCcy == vault.depositCcy ? vault.domCcy : vault.forCcy;
}

export function getDualPositionExecutionStatus(
  position: PositionInfo & { vault: VaultInfo },
) {
  if (
    Number(position.amounts.redeemable) > 0 &&
    !Number(position.amounts.redeemableOfLinkedCcy)
  ) {
    return DualPositionExecutionStatus.NotExecuted;
  }
  if (
    !Number(position.amounts.redeemable) &&
    Number(position.amounts.redeemableOfLinkedCcy) > 0
  ) {
    return DualPositionExecutionStatus.Executed;
  }
  if (
    Number(position.amounts.redeemable) > 0 &&
    Number(position.amounts.redeemableOfLinkedCcy) > 0
  ) {
    return DualPositionExecutionStatus.PartialExecuted;
  }
  return DualPositionExecutionStatus.NotExpired;
}

export function getDualSettlementTime(product: ProductInfo) {
  return new Date((product.expiry + 2 * 3600) * 1000);
}

export enum DualPositionClaimStatus {
  NotExpired = 'NotExpired',
  ExpiredButNotClaimable = 'ExpiredButNotClaimable',
  Claimable = 'Claimable',
  Claimed = 'Claimed',
}
export function getDualPositionClaimStatus(
  position: PositionInfo & { vault: VaultInfo },
  now: Date,
) {
  if (position.claimed) {
    return { status: DualPositionClaimStatus.Claimed, leftTime: 0 };
  }
  if (now.getTime() < position.product.expiry * 1000) {
    return {
      status: DualPositionClaimStatus.NotExpired,
      leftTime: position.product.expiry * 1000 - now.getTime(),
    };
  }
  if (now < getDualSettlementTime(position.product)) {
    return {
      status: DualPositionClaimStatus.ExpiredButNotClaimable,
      leftTime: 0,
    };
  }
  return { status: DualPositionClaimStatus.Claimable, leftTime: 0 };
}

export function getDualProfitRenderProps(
  data:
    | (Partial<PositionInfo> & {
        vault: VaultInfo;
      })
    | ProductQuoteResult,
) {
  const product =
    (data as Partial<PositionInfo>).product || (data as ProductQuoteResult);
  if (!data || !data.amounts || !data.vault || !product) {
    return undefined;
  }
  const executionStatus = getDualPositionExecutionStatus(
    data as PositionInfo & { vault: VaultInfo },
  );
  const res = {
    productType: data.vault.productType,
    executionResult: [
      DualPositionExecutionStatus.Executed,
      DualPositionExecutionStatus.NotExecuted,
      DualPositionExecutionStatus.PartialExecuted,
    ].includes(executionStatus)
      ? executionStatus
      : undefined,
  } as DualProfitRenderProps;
  if (data.vault.productType == ProductType.BearSpread) {
    res.linkedCcy = data.vault.forCcy;
    // 低买： anchorPrice[0] = RCH/USDT
    res.depositAmount = Number(data.amounts.own || 0);
    // anchorPrice[0] * depositAmount(usdt)
    res.linkedCcyAmountWhenSuccessfulExecuted =
      Number(product.anchorPrices[0]) * res.depositAmount;
    // maxRedeemableOfLinkedCcy - (anchorPrice[0] * depositAmount)
    res.linkedCcyExtraRewardWhenSuccessfulExecuted =
      Number(
        executionStatus == DualPositionExecutionStatus.NotExpired
          ? data.amounts.maxRedeemableOfLinkedCcy
          : data.amounts.redeemableOfLinkedCcy,
      ) - res.linkedCcyAmountWhenSuccessfulExecuted;
    res.depositCcy = data.vault.depositCcy;

    // maxRedeemable - own
    res.depositCcyExtraRewardWhenNoExecuted =
      Number(data.amounts.maxRedeemable) - res.depositAmount;
    res.rchReturnAmount = Number(data.amounts.rchAirdrop || 0);
  } else {
    res.linkedCcy = data.vault.domCcy;
    // 高卖： anchorPrice[0] = USDT/RCH
    res.depositAmount = Number(data.amounts.own || 0);
    // (anchorPrice[0] * depositAmount(rch))
    res.linkedCcyAmountWhenSuccessfulExecuted =
      Number(product.anchorPrices[0]) * res.depositAmount;
    // maxRedeemableOfLinkedCcy - (anchorPrice[0] * depositAmount)
    res.linkedCcyExtraRewardWhenSuccessfulExecuted =
      Number(
        executionStatus == DualPositionExecutionStatus.NotExpired
          ? data.amounts.maxRedeemableOfLinkedCcy
          : data.amounts.redeemableOfLinkedCcy,
      ) - res.linkedCcyAmountWhenSuccessfulExecuted;

    res.depositCcy = product.vault.forCcy;

    // maxRedeemable - own
    res.depositCcyExtraRewardWhenNoExecuted =
      Number(data.amounts.maxRedeemable) - res.depositAmount;
    res.rchReturnAmount = Number(data.amounts.rchAirdrop || 0);
  }
  return res;
}
