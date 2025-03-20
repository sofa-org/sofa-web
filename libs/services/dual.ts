import { roundWith } from '@sofa/utils/amount';
import { isNullLike } from '@sofa/utils/fns';

import { ProductType, VaultInfo } from './base-type';
import { CCYService } from './ccy';
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
    getDualPositionClaimStatus(position, new Date()).status ==
    DualPositionClaimStatus.NotExpired
  ) {
    return DualPositionExecutionStatus.NotExpired;
  }
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
  if (position.product?.expiry === undefined) {
    // is a quote?
    return {
      status: DualPositionClaimStatus.NotExpired,
      leftTime: -1,
    };
  }
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

export function dualShouldRevertAnchorPrice(productType: ProductType) {
  return productType == ProductType.BearSpread;
}

export function dualGetPrice(params: {
  vault: { productType: ProductType; domCcy: VaultInfo['domCcy'] };
  anchorPrices: (number | string)[];
}) {
  const p = params.anchorPrices?.[0];
  if (!dualShouldRevertAnchorPrice(params.vault.productType)) {
    return isNullLike(p)
      ? undefined
      : Number(
          roundWith(
            Number(p),
            CCYService.getPriceInputTick(params.vault.domCcy),
          ),
        );
  }

  return isNullLike(p)
    ? undefined
    : Number(
        roundWith(
          p === 0 || p === '0' ? 0 : 1.0 / Number(p),
          CCYService.getPriceInputTick(params.vault.domCcy),
        ),
      );
}

export function dualUpdatePrice(
  params: { vault: { productType: ProductType } },
  p?: string | number,
) {
  if (!dualShouldRevertAnchorPrice(params.vault.productType)) {
    return isNullLike(p) ? 0 : Number(p);
  }

  return isNullLike(p) ? 0 : p === 0 || p === '0' ? 0 : 1.0 / Number(p);
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
  const price = dualGetPrice(product);
  if (price === undefined) {
    return undefined;
  }
  if (data.vault.productType == ProductType.BearSpread) {
    res.linkedCcy = data.vault.forCcy;
    // 低买： anchorPrice[0] = RCH/USDT
    res.depositAmount = Number(data.amounts.own || 0);
    // anchorPrice[0] * depositAmount(usdt)
    res.linkedCcyAmountWhenSuccessfulExecuted = res.depositAmount / price;
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
    res.linkedCcyAmountWhenSuccessfulExecuted = price * res.depositAmount;
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
  if (
    res.linkedCcyExtraRewardWhenSuccessfulExecuted < 0 &&
    res.linkedCcyExtraRewardWhenSuccessfulExecuted >
      -Math.pow(0.1, CCYService.ccyConfigs[res.linkedCcy]?.precision || 4)
  ) {
    // 精度问题，且负数不会被后面 amountFormatter 排除
    res.linkedCcyExtraRewardWhenSuccessfulExecuted = 0;
  }
  if (
    res.depositCcyExtraRewardWhenNoExecuted < 0 &&
    res.depositCcyExtraRewardWhenNoExecuted >
      -Math.pow(0.1, CCYService.ccyConfigs[res.depositCcy]?.precision || 4)
  ) {
    // 精度问题，且负数不会被后面 amountFormatter 排除
    res.depositCcyExtraRewardWhenNoExecuted = 0;
  }
  return res;
}
