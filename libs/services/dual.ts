import { ProductType, VaultInfo } from './base-type';
import { PositionInfo } from './positions';
import { ProductQuoteResult } from './products';

export interface DualProfitRenderProps {
  forCcy: VaultInfo['forCcy'] | VaultInfo['domCcy'];
  forCcyAmountWhenSuccessfulExecuted: number; // 要交换目标币种金额(如果成功兑换)
  forCcyExtraRewardWhenSuccessfulExecuted: number; // 要交换目标币种奖励金额(如果成功兑换)
  depositCcy: VaultInfo['depositCcy'];
  depositAmount: number; // 本金
  rchReturnAmount: number; // RCH 空投金额
  depositCcyExtraRewardWhenNoExecuted: number; // 如果没交换成功，得到的金额
  productType: VaultInfo['productType'];
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
  const res = {
    productType: data.vault.productType,
  } as DualProfitRenderProps;
  if (data.vault.productType == ProductType.BearSpread) {
    res.forCcy = data.vault.forCcy;
    // 低买： anchorPrice[0] = RCH/USDT
    res.depositAmount = Number(data.amounts.own || 0);
    // anchorPrice[0] * depositAmount(usdt)
    res.forCcyAmountWhenSuccessfulExecuted =
      Number(product.anchorPrices[0]) * res.depositAmount;
    // maxRedeemableOfLinkedCcy - (anchorPrice[0] * depositAmount)
    res.forCcyExtraRewardWhenSuccessfulExecuted =
      Number(data.amounts.maxRedeemableOfLinkedCcy) -
      res.forCcyAmountWhenSuccessfulExecuted;
    res.depositCcy = data.vault.depositCcy;

    // maxRedeemable - own
    res.depositCcyExtraRewardWhenNoExecuted =
      Number(data.amounts.maxRedeemable) - res.depositAmount;
    res.rchReturnAmount = Number(data.amounts.rchAirdrop || 0);
  } else {
    res.forCcy = data.vault.domCcy;
    // 高卖： anchorPrice[0] = USDT/RCH
    res.depositAmount = Number(data.amounts.own || 0);
    // (anchorPrice[0] * depositAmount(rch))
    res.forCcyAmountWhenSuccessfulExecuted =
      Number(product.anchorPrices[0]) * res.depositAmount;
    // maxRedeemableOfLinkedCcy - (anchorPrice[0] * depositAmount)
    res.forCcyExtraRewardWhenSuccessfulExecuted =
      Number(data.amounts.maxRedeemableOfLinkedCcy) -
      res.forCcyAmountWhenSuccessfulExecuted;

    res.depositCcy = product.vault.forCcy;

    // maxRedeemable - own
    res.depositCcyExtraRewardWhenNoExecuted =
      Number(data.amounts.maxRedeemable) - res.depositAmount;
    res.rchReturnAmount = Number(data.amounts.rchAirdrop || 0);
  }
  return res;
}
