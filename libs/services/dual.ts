import { roundWith } from '@sofa/utils/amount';
import { asyncCache } from '@sofa/utils/decorators';
import { isNullLike } from '@sofa/utils/fns';
import { ethers } from 'ethers';

import { dualVaults } from './vaults/dual';
import { ProductType, VaultInfo } from './base-type';
import { CCYService } from './ccy';
import * as positions from './positions';
import { ProductInfo, ProductQuoteResult } from './products';
import { WalletService } from './wallet';

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

export enum DualPositionClaimStatus {
  NotExpired = 'NotExpired',
  ExpiredButNotClaimable = 'ExpiredButNotClaimable',
  Claimable = 'Claimable',
  Claimed = 'Claimed',
}

export class DualService {
  static getLinkedCcy(vault: VaultInfo) {
    return vault.forCcy == vault.depositCcy ? vault.domCcy : vault.forCcy;
  }
  static getExecutionStatus(
    position: positions.PositionInfo & { vault: VaultInfo },
  ) {
    if (
      DualService.getClaimStatus(position, new Date()).status ==
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
  static getSettlementTime(product: ProductInfo) {
    return new Date((Number(product.expiry) + 2 * 3600) * 1000);
  }

  static getClaimStatus(
    position: positions.PositionInfo & { vault: VaultInfo },
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
    if (now < DualService.getSettlementTime(position.product)) {
      return {
        status: DualPositionClaimStatus.ExpiredButNotClaimable,
        leftTime: 0,
      };
    }
    return { status: DualPositionClaimStatus.Claimable, leftTime: 0 };
  }
  static getPrice(params: {
    vault: { productType: ProductType; domCcy: VaultInfo['domCcy'] };
    anchorPrices: (number | string)[];
  }) {
    if (isNullLike(params?.anchorPrices?.[0])) {
      return undefined;
    }
    const p = params.anchorPrices[0];
    if (!DualService.shouldRevertAnchorPrice(params.vault.productType)) {
      return Number(
        roundWith(Number(p), CCYService.getPriceInputTick(params.vault.domCcy)),
      );
    }

    return Number(
      roundWith(
        p === 0 || p === '0' ? 0 : 1.0 / Number(p),
        CCYService.getPriceInputTick(params.vault.domCcy),
      ),
    );
  }
  static shouldRevertAnchorPrice(productType: ProductType) {
    return productType == ProductType.BearSpread;
  }

  static updatePrice(
    params: { vault: { productType: ProductType } },
    p?: string | number,
  ) {
    if (!DualService.shouldRevertAnchorPrice(params.vault.productType)) {
      return isNullLike(p) ? 0 : Number(p);
    }

    return isNullLike(p) ? 0 : p === 0 || p === '0' ? 0 : 1.0 / Number(p);
  }

  private static async $callContract(
    vault: VaultInfo,
    signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcApiProvider,
    method: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[],
  ) {
    const contract = new ethers.Contract(
      vault.vault,
      vault.abis,
      signerOrProvider,
    );
    return contract[method](...args);
  }
  @asyncCache({
    persist: true,
    until: (val, createdAt) =>
      !val || !createdAt || createdAt < Date.now() - 10 * 60 * 1000
        ? true
        : false,
    id: (name, args) => {
      const position = args[0] as positions.PositionInfo;
      return `${name}-${position.product.vault.chainId}-${position.id}-${position.claimParams.maker}`;
    },
  })
  static async $readRedeemableFromChain(data: positions.PositionInfo) {
    const vault = dualVaults.find(
      (v) => v.vault.toLowerCase() == data.product.vault.vault.toLowerCase(),
    );
    if (!vault) {
      return undefined;
    }
    const claimParams = data.claimParams;
    let provider: ethers.BrowserProvider | ethers.JsonRpcProvider = undefined!;
    let productIdPacked: string = undefined!,
      productIdKeccak256: string = undefined!,
      makerProductIdPacked: string = undefined!,
      makerProductIdKeccak256: string = undefined!;
    let totalPositions: bigint = undefined!,
      quotePositions: bigint = undefined!;
    let takerExchangedAmount: number = undefined!;
    let res:
      | {
          redeemableOfLinkedCcy: number;
          redeemable: number;
        }
      | undefined = undefined;

    try {
      provider = await WalletService.readonlyConnect(vault.chainId);
      // 1.查 totalPositions[productId]: maker可换的总金额(不会减少)
      //   productId = uint256(keccak256(abi.encodePacked(expiry, anchorPrice, uint256(0))))
      productIdPacked = ethers.solidityPacked(
        ['uint256', 'uint256', 'uint256'],
        [claimParams.expiry, claimParams.anchorPrices[0], 0],
      );
      productIdKeccak256 = ethers.keccak256(productIdPacked);
      totalPositions = await DualService.$callContract(
        vault,
        provider,
        'totalPositions',
        [productIdKeccak256],
      );
      // 2.查 quotePositions[makerProductId]: maker已经换的总金额
      //   makerProductId = uint256(keccak256(abi.encodePacked(expiry, anchorPrice, uint256(1))))
      makerProductIdPacked = ethers.solidityPacked(
        ['uint256', 'uint256', 'uint256'],
        [claimParams.expiry, claimParams.anchorPrices[0], 1],
      );
      makerProductIdKeccak256 = ethers.keccak256(makerProductIdPacked);
      quotePositions = await DualService.$callContract(
        vault,
        provider,
        'quotePositions',
        [makerProductIdKeccak256],
      );
      if (claimParams.maker) {
        // 3. 对于maker
        // redeemableOfLinkedCcy = quotePositions * anchorPrice
        // redeemable = quotePositions
        res = {
          redeemableOfLinkedCcy:
            Number(quotePositions / BigInt(vault.collateralDecimal)) *
            Number(data.product.anchorPrices[0]),
          redeemable:
            Number(quotePositions / BigInt(vault.collateralDecimal)) *
            Number(data.product.anchorPrices[0]),
        };
      } else {
        //  对于taker
        //  taker换币数量 = quotePositions / totalPositions * (own + counterParty)
        //  redeemableOfLinkedCcy = taker换币数量 * anchorPrice
        //  redeemable = (own + counterParty) - taker换币数量
        takerExchangedAmount =
          Number(quotePositions / totalPositions) *
          (Number(data.amounts.own) + Number(data.amounts.counterparty));

        res = {
          redeemableOfLinkedCcy:
            takerExchangedAmount * Number(data.product.anchorPrices[0]),
          redeemable:
            Number(data.amounts.own) +
            Number(data.amounts.counterparty) -
            takerExchangedAmount,
        };
      }
      console.info('calculated $readRedeemable for dual', {
        provider,
        claimParams,
        productIdPacked,
        productIdKeccak256,
        totalPositions,
        makerProductIdPacked,
        makerProductIdKeccak256,
        quotePositions,
        takerExchangedAmount,
        res,
      });
      return res;
    } catch (e) {
      console.error(
        'Error calc $readRedeemable for dual',
        {
          provider,
          claimParams,
          productIdPacked,
          productIdKeccak256,
          totalPositions,
          makerProductIdPacked,
          makerProductIdKeccak256,
          quotePositions,
          takerExchangedAmount,
          res,
        },
        e,
      );
      return undefined;
    }
  }
  static async getProfitRenderProps(
    originData:
      | (Partial<positions.PositionInfo> & {
          vault: VaultInfo;
        })
      | ProductQuoteResult,
  ) {
    if (!originData) {
      return undefined;
    }
    const data = { ...originData } as typeof originData;
    const product =
      (data as Partial<positions.PositionInfo>).product ||
      (data as ProductQuoteResult);
    if (!data || !data.amounts || !data.vault || !product) {
      return undefined;
    }
    const claimStatus = DualService.getClaimStatus(
      data as positions.PositionInfo & { vault: VaultInfo },
      new Date(),
    ).status;
    if (
      [
        DualPositionClaimStatus.Claimable,
        DualPositionClaimStatus.ExpiredButNotClaimable,
      ].includes(claimStatus) &&
      data.amounts
    ) {
      // 如果已过期，但未领取，需要从链上读状态
      const res = await DualService.$readRedeemableFromChain(
        data as positions.PositionInfo,
      );
      if (res) {
        data.amounts = {
          ...data.amounts,
          ...res,
        };
      }
    }
    const executionStatus = DualService.getExecutionStatus(
      data as positions.PositionInfo & { vault: VaultInfo },
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
    const price = DualService.getPrice(product);
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
      Math.abs(res.linkedCcyExtraRewardWhenSuccessfulExecuted) <
      Math.pow(0.1, CCYService.ccyConfigs[res.linkedCcy]?.precision || 4)
    ) {
      // 精度问题，且负数不会被后面 amountFormatter 排除
      res.linkedCcyExtraRewardWhenSuccessfulExecuted = 0;
    }
    if (
      Math.abs(res.depositCcyExtraRewardWhenNoExecuted) >
      Math.pow(0.1, CCYService.ccyConfigs[res.depositCcy]?.precision || 4)
    ) {
      // 精度问题，且负数不会被后面 amountFormatter 排除
      res.depositCcyExtraRewardWhenNoExecuted = 0;
    }
    return res;
  }
}
