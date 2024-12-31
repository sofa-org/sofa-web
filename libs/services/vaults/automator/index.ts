import { get } from 'lodash-es';

import AutomatorAbis from '../../abis/Automator.json';
import { AutomatorVaultInfo, ProjectType } from '../../base-type';
import {
  getCollateralDecimal,
  getDepositMinAmount,
  getDepositTickAmount,
} from '../utils';

import vaults_1 from './1';
import vaults_56 from './56';
import vaults_42161 from './42161';
import vaults_421614 from './421614';
import vaults_11155111 from './11155111';

const vaults = [
  ...vaults_1,
  ...vaults_56,
  ...vaults_42161,
  ...vaults_421614,
  ...vaults_11155111,
];

export const AutomatorVaults = vaults.map((it) => {
  const collateralDecimal = getCollateralDecimal(it.chainId, it.depositCcy);
  return {
    ...it,
    name: get(it, 'name') || it.depositCcy,
    depositMinAmount: getDepositMinAmount(it.depositCcy, ProjectType.Automator),
    depositTickAmount: getDepositTickAmount(
      it.depositCcy,
      ProjectType.Automator,
    ),
    anchorPricesDecimal: 1e8,
    collateralDecimal,
    abis: AutomatorAbis,
    creatorFeeRate: get(it, 'creatorFeeRate') || 0,
  } as AutomatorVaultInfo;
});
