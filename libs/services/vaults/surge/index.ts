import { ethers } from 'ethers';

import DNTVaultAbis from '../../abis/DNTVault.json';
import DNTVaultAbis1 from '../../abis/DNTVault-No-Permit2.json';
import STVaultAbis from '../../abis/SmartTrendVault.json';
import STVaultAbis1 from '../../abis/SmartTrendVault-No-Permit2.json';
import { ProductType, ProjectType, RiskType, VaultInfo } from '../../base-type';
import {
  getCollateralDecimal,
  getDepositMinAmount,
  getDepositTickAmount,
} from '../utils';

import vaults_1 from './1';
import vaults_56 from './56';
import vaults_1329 from './1329';
import vaults_42161 from './42161';
import vaults_421614 from './421614';
import vaults_11155111 from './11155111';

const vaults = [
  ...vaults_1,
  ...vaults_56,
  ...vaults_1329,
  ...vaults_42161,
  ...vaults_421614,
  ...vaults_11155111,
];

function getSurgeAbis(
  vault: Pick<VaultInfo, 'productType' | 'riskType' | 'usePermit2'>,
) {
  const RFQVaultAbis: PartialRecord<
    `${ProductType}-${RiskType}-${boolean /* usePermit2 */}`,
    ethers.InterfaceAbi
  > = {
    [`${ProductType.DNT}-${RiskType.RISKY}-true`]: DNTVaultAbis,
    [`${ProductType.DNT}-${RiskType.RISKY}-false`]: DNTVaultAbis1,
    [`${ProductType.BullSpread}-${RiskType.RISKY}-true`]: STVaultAbis,
    [`${ProductType.BullSpread}-${RiskType.RISKY}-false`]: STVaultAbis1,
    [`${ProductType.BearSpread}-${RiskType.RISKY}-true`]: STVaultAbis,
    [`${ProductType.BearSpread}-${RiskType.RISKY}-false`]: STVaultAbis1,
  };
  return RFQVaultAbis[
    `${vault.productType}-${vault.riskType}-${vault.usePermit2}`
  ];
}

export const surgeVaults = vaults.map((it) => {
  const collateralDecimal = getCollateralDecimal(it.chainId, it.depositCcy);
  return {
    ...it,
    trackingSource: 'COINBASE',
    depositMinAmount: getDepositMinAmount(it.depositCcy, ProjectType.Surge),
    depositTickAmount: getDepositTickAmount(it.depositCcy, ProjectType.Surge),
    anchorPricesDecimal: 1e8,
    collateralDecimal,
    balanceDecimal: collateralDecimal,
    abis: getSurgeAbis(it),
  } as VaultInfo;
});
