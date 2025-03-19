import { InterestType, ProductType, RiskType, VaultInfo } from '../base-type';
import { DualPositionExecutionStatus } from '../dual';
import { PositionInfo, PositionParams } from '../positions';
import { ApyDefinition } from '../products';
function createDualPositionItem(params: {
  claimed: boolean;
  idx: number;
  riskType: RiskType;
  wallet: string;
  vault: string;
  chainId: number;
}): PositionInfo {
  const now = Math.floor(Date.now() / 1000);
  const dualExecution: DualPositionExecutionStatus | undefined =
    params.riskType == RiskType.DUAL
      ? !params.claimed
        ? DualPositionExecutionStatus.NotExpired
        : [
            DualPositionExecutionStatus.Executed,
            DualPositionExecutionStatus.NotExecuted,
            DualPositionExecutionStatus.PartialExecuted,
          ][params.idx % 3]
      : undefined;

  const expiry =
    dualExecution == DualPositionExecutionStatus.NotExpired
      ? now + 86400 * (1 + Math.floor(10 * Math.random()))
      : now - 86400;
  const productType = [ProductType.BullSpread, ProductType.BearSpread][
    params.idx % 2
  ];
  const id = `aa${params.idx}a${params.claimed}a${params.riskType}${params.vault}${Math.random()}`;

  // debugger;
  const res = {
    id: id,
    positionId: `0xc${params.wallet}${id}`,
    wallet: params.wallet,
    product: {
      vault: {
        vault: params.vault,
        chainId: params.chainId,
        productType: productType,
        riskType: params.riskType,
        forCcy: 'RCH',
        domCcy: 'USDT',
        depositCcy: productType == ProductType.BullSpread ? 'RCH' : 'USDT',
        trackingSource: 'SOFA',
        anchorPricesDecimal: 100000000,
        collateralDecimal: 1000000000000000000,
        rchMultiplier: 20.0,
        feeRateAddress: '0x4140ab4afc36b93270a9659bd8387660cc6509b5',
        feeRateDecimal: '1000000000000000000',
        rchCalcUseMakerCollateral: false,
        balanceDecimal: -5527149226598858752,
        interestType: InterestType.AAVE,
      } as unknown as VaultInfo,
      expiry: expiry,
      anchorPrices: ['75000', '90000'],
    },
    claimed: false,
    createdAt: now - 86400,
    updatedAt: now - Math.floor(86400 * Math.random()),
    takerAllocationRate: 0,
    triggerTime: undefined,
    triggerPrice: undefined,
    feeRate: {
      trading: '0.15',
      settlement: '0.05',
    },
    leverageInfo: {
      borrowApr: '0',
      spreadApr: '0',
      leverage: 1,
    },
    relevantDollarPrices: [
      {
        ccy: 'crvUSD',
        price: 0.9998889491816843,
      },
      {
        ccy: 'RCH',
        price: 0.19322788579951725,
      },
      {
        ccy: 'scrvUSD',
        price: 1.041518174410683,
      },
      {
        ccy: 'stETH',
        price: 1894.9302115084574,
      },
      {
        ccy: 'sUSDa',
        price: 0.996795035210774,
      },
      {
        ccy: 'USDC',
        price: 1.0,
      },
      {
        ccy: 'USDT',
        price: 0.9999268256960532,
      },
      {
        ccy: 'zRCH',
        price: 0.1958997883057726,
      },
    ],
    amounts: {
      counterparty: '15346',
      own: Math.random() * 100,
      premium: Math.random() * 100,
      forRchAirdrop: '0',
      rchAirdrop: Math.random() * 2,
      totalInterest: '72.66489059914679',
      minRedeemable: '0',
      maxRedeemable: Math.random() * 100,
      maxRedeemableOfLinkedCcy: Math.random() * 100,
      redeemable: Math.random() * 100,
      tradingFee: '0',
      settlementFee: '0',
      maxSettlementFee: '0',
      borrow: '0',
      borrowCost: '0',
      spreadCost: '0',
    },
    apyInfo: {
      outputApyDefinition: ApyDefinition.AaveLendingAPY,
      interest: '0.09999999999999964',
      rch: '0',
      min: '-1',
      max: '20561301.504483957',
    },
    oddsInfo: {
      rch: '0',
      min: '0',
      max: '2.298459767521083266',
    },
    claimParams: {
      term: undefined,
      expiry: expiry,
      anchorPrices: ['7500000000000', '9000000000000'],
      maker: 1,
      collateralAtRiskPercentage: '6488870891779549',
    },
  } as unknown as PositionInfo;

  if (dualExecution == DualPositionExecutionStatus.NotExpired) {
    res.amounts.redeemable = res.amounts.redeemableOfLinkedCcy = undefined;
  } else if (dualExecution == DualPositionExecutionStatus.PartialExecuted) {
    res.amounts.redeemable = Math.random() * 200;
    res.amounts.redeemableOfLinkedCcy = Math.random() * 200;
  } else if (dualExecution == DualPositionExecutionStatus.Executed) {
    res.amounts.redeemable = undefined;
    res.amounts.redeemableOfLinkedCcy = Math.random() * 200;
  } else if (dualExecution == DualPositionExecutionStatus.NotExecuted) {
    res.amounts.redeemable = Math.random() * 200;
    res.amounts.redeemableOfLinkedCcy = undefined;
  }
  return res;
}
async function positionList(
  params: PositionParams,
): Promise<HttpResponse<PositionInfo[]>> {
  const items = params.vaults?.length
    ? Array(20)
        .fill(0)
        .map((r, idx) =>
          createDualPositionItem({
            idx,
            wallet: params.wallet!,
            chainId: params.chainId!,
            vault: params.vaults![idx % params.vaults!.length],
            riskType: RiskType.DUAL,
            claimed: idx % params.vaults!.length == 0 ? false : true,
          }),
        )
    : [];
  return {
    code: 0,
    message: '',
    value: items,
  };
}

if (!window.mockData) window.mockData = {};

window.mockData.positionList = positionList;
