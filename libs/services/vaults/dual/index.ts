import { ethers } from 'ethers';

import AAVEDualVault from '../../abis/AAVEDualVault.json';
import CrvUSDDualVault from '../../abis/CrvUSDDualVault.json';
import DualVault from '../../abis/DualVault.json';
import RCHDualVault from '../../abis/RCHDualVault.json';
import { ProductType, ProjectType, VaultInfo } from '../../base-type';
import {
  getCollateralDecimal,
  getDepositMinAmount,
  getDepositTickAmount,
} from '../utils';

import vaults_1 from './1';
import vaults_421614 from './421614';
import vaults_11155111 from './11155111';

const vaults = [...vaults_1, ...vaults_421614, ...vaults_11155111];

function getDualAbis(
  vault: Pick<VaultInfo, 'forCcy' | 'domCcy' | 'depositCcy'>,
) {
  const RFQVaultAbis: PartialRecord<
    `${VaultInfo['forCcy']}-${VaultInfo['domCcy']}-${VaultInfo['depositCcy']}`,
    ethers.InterfaceAbi
  > = {
    // 高卖 RCH
    [`${'RCH'}-${'USDT'}-${'RCH'}`]: RCHDualVault,
    // 低买 RCH
    [`${'RCH'}-${'USDT'}-${'USDT'}`]: AAVEDualVault,

    // 高卖 CRV
    [`${'CRV'}-${'crvUSD'}-${'CRV'}`]: DualVault,
    // 低买 CRV
    [`${'CRV'}-${'crvUSD'}-${'crvUSD'}`]: CrvUSDDualVault,
  };
  return RFQVaultAbis[`${vault.forCcy}-${vault.domCcy}-${vault.depositCcy}`];
}

export function getDualDepositCcy(
  vault: Pick<VaultInfo, 'forCcy' | 'domCcy' | 'productType'>,
) {
  if (vault.productType == ProductType.BullSpread) {
    // go up, sell crypto
    return vault.forCcy;
  } else {
    // go down, buy crypto w/ USDS
    return vault.domCcy;
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
  } as VaultInfo;
});
