import { ethers } from 'ethers';

// TODO: change ABIs to actual dual
import DNTVaultAbis from '../../abis/DNTVault.json';
import { ProductType, ProjectType, RiskType, VaultInfo } from '../../base-type';
import {
  getCollateralDecimal,
  getDepositMinAmount,
  getDepositTickAmount,
  getTickPrice,
} from '../utils';

import vaults_1 from './1';
import vaults_11155111 from './11155111';

const vaults = [...vaults_1, ...vaults_11155111];

function getDualAbis(
  vault: Pick<VaultInfo, 'forCcy' | 'domCcy' | 'depositCcy'>,
) {
  return DNTVaultAbis as ethers.InterfaceAbi;
}

export function getDualDepositCcy(
  vault: Pick<VaultInfo, 'forCcy' | 'domCcy' | 'productType'>,
) {
  if (vault.productType == ProductType.BullSpread) {
    return vault.forCcy;
  } else {
    return vault.domCcy;
  }
}

export const dualVaults = vaults.map((it) => {
  const collateralDecimal = getCollateralDecimal(it.chainId, it.depositCcy);
  return {
    ...it,
    productType:
      it.depositCcy == it.forCcy
        ? ProductType.BullSpread
        : ProductType.BearSpread,
    riskType: RiskType.DUAL,
    trackingSource: 'COINBASE',
    depositMinAmount: getDepositMinAmount(it.depositCcy, ProjectType.Dual),
    depositTickAmount: getDepositTickAmount(it.depositCcy, ProjectType.Dual),
    anchorPricesDecimal: 1e8,
    collateralDecimal,
    balanceDecimal: collateralDecimal,
    abis: getDualAbis(
      it as Pick<VaultInfo, 'forCcy' | 'domCcy' | 'depositCcy'>,
    ),
    tickPrice: getTickPrice(it.domCcy, ProjectType.Dual),
  } as VaultInfo;
});
