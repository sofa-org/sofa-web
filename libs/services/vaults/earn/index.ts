import { ethers } from 'ethers';

import LeverageDNTVaultAbis from '../../abis/LeverageDNTVault.json';
import LeverageSTVaultAbis from '../../abis/LeverageSmartTrendVault.json';
import PrincipalDNTVaultAbis from '../../abis/PrincipalDNTVault.json';
import PrincipalDNTVaultAbis1 from '../../abis/PrincipalDNTVault-No-Permit2.json';
import PrincipalSTVaultAbis from '../../abis/PrincipalSmartTrendVault.json';
import PrincipalSTVaultAbis1 from '../../abis/PrincipalSmartTrendVault-No-Permit2.json';
import { ProductType, ProjectType, RiskType, VaultInfo } from '../../base-type';
import {
  getCollateralDecimal,
  getDepositMinAmount,
  getDepositTickAmount,
} from '../utils';

import vaults_1 from './1';
import vaults_56 from './56';
import vaults_137 from './137';
import vaults_42161 from './42161';
import vaults_421614 from './421614';
import vaults_11155111 from './11155111';

const vaults = [
  ...vaults_1,
  ...vaults_56,
  ...vaults_42161,
  ...vaults_137,
  ...vaults_421614,
  ...vaults_11155111,
];

function getEarnAbis(
  vault: Pick<VaultInfo, 'productType' | 'riskType' | 'usePermit2'>,
) {
  const RFQVaultAbis: PartialRecord<
    `${ProductType}-${RiskType}-${boolean /* usePermit2 */}`,
    ethers.InterfaceAbi
  > = {
    [`${ProductType.DNT}-${RiskType.PROTECTED}-true`]: PrincipalDNTVaultAbis,
    [`${ProductType.DNT}-${RiskType.PROTECTED}-false`]: PrincipalDNTVaultAbis1,
    [`${ProductType.BullSpread}-${RiskType.PROTECTED}-true`]:
      PrincipalSTVaultAbis,
    [`${ProductType.BullSpread}-${RiskType.PROTECTED}-false`]:
      PrincipalSTVaultAbis1,
    [`${ProductType.BearSpread}-${RiskType.PROTECTED}-true`]:
      PrincipalSTVaultAbis,
    [`${ProductType.BearSpread}-${RiskType.PROTECTED}-false`]:
      PrincipalSTVaultAbis1,
    [`${ProductType.DNT}-${RiskType.LEVERAGE}-true`]: LeverageDNTVaultAbis, // 其实是不支持 permit2
    [`${ProductType.DNT}-${RiskType.LEVERAGE}-false`]: LeverageDNTVaultAbis,
    [`${ProductType.BullSpread}-${RiskType.LEVERAGE}-true`]:
      LeverageSTVaultAbis, // 其实是不支持 permit2
    [`${ProductType.BullSpread}-${RiskType.LEVERAGE}-false`]:
      LeverageSTVaultAbis,
    [`${ProductType.BearSpread}-${RiskType.LEVERAGE}-true`]:
      LeverageSTVaultAbis, // 其实是不支持 permit2
    [`${ProductType.BearSpread}-${RiskType.LEVERAGE}-false`]:
      LeverageSTVaultAbis,
  };
  return RFQVaultAbis[
    `${vault.productType}-${vault.riskType}-${vault.usePermit2}`
  ];
}

export const earnVaults = vaults.map((it) => {
  const collateralDecimal = getCollateralDecimal(it.chainId, it.depositCcy);
  return {
    ...it,
    trackingSource: 'COINBASE',
    depositMinAmount: getDepositMinAmount(it.depositCcy, ProjectType.Earn),
    depositTickAmount: getDepositTickAmount(it.depositCcy, ProjectType.Earn),
    anchorPricesDecimal: 1e8,
    collateralDecimal,
    balanceDecimal:
      collateralDecimal * (it.riskType === RiskType.PROTECTED ? 1e18 : 1),
    abis: getEarnAbis(it),
  } as VaultInfo;
});
