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
import vaults_421614 from './421614';
import vaults_11155111 from './11155111';

const vaults = [...vaults_1, ...vaults_421614, ...vaults_11155111];

function getDualAbis(
  vault: Pick<VaultInfo, 'forCcy' | 'domCcy' | 'depositCcy'>,
) {
  return DNTVaultAbis as ethers.InterfaceAbi;
}

export function getDualDepositCcy(
  vault: Pick<VaultInfo, 'forCcy' | 'domCcy' | 'productType'>,
) {
  if (vault.productType == ProductType.BearSpread) {
    return vault.domCcy;
  } else {
    return vault.forCcy;
  }
}

export function getDualProductType(
  vault: Pick<VaultInfo, 'forCcy' | 'depositCcy'>,
) {
  if (vault.forCcy == vault.depositCcy) {
    return ProductType.BullSpread;
  }
  return ProductType.BearSpread;
}

export const dualVaults = vaults.map((it) => {
  const collateralDecimal = getCollateralDecimal(it.chainId, it.depositCcy);
  return {
    ...it,
    productType: getDualProductType({
      forCcy: it.forCcy as VaultInfo['forCcy'],
      depositCcy: it.depositCcy,
    }),
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
