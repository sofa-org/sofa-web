import { AutomatorDetail } from '@sofa/services/automator';
import { TFunction } from '@sofa/services/i18n';
import { arrToDict } from '@sofa/utils/object';

export const AutomatorRiskExposures = [
  {
    label: 'R0',
    value: 0.001,
    desc: (t: TFunction) => t({ enUS: 'Ultra-Safe', zhCN: '超安全' }),
    color: '#FFD000bf',
  },
  {
    label: 'R1',
    value: 0.05,
    desc: (t: TFunction) => t({ enUS: 'Minimal Risk', zhCN: '最小风险' }),
    color: '#FFD000',
  },
  {
    label: 'R2',
    value: 0.1,
    desc: (t: TFunction) => t({ enUS: 'Low Risk', zhCN: '低风险' }),
    color: '#FF9C1Bbf',
  },
  {
    label: 'R3',
    value: 0.2,
    desc: (t: TFunction) => t({ enUS: 'Moderate Risk', zhCN: '中等风险' }),
    color: '#FF9C1B',
  },
  {
    label: 'R4',
    value: 0.35,
    desc: (t: TFunction) => t({ enUS: 'High Risk', zhCN: '高风险' }),
    color: '#F03A43bf',
  },
  {
    label: 'R5',
    value: 0.5,
    desc: (t: TFunction) => t({ enUS: 'Very High Risk', zhCN: '超高风险' }),
    color: '#F03A43',
  },
];

export const AutomatorRiskExposureMap = arrToDict(
  AutomatorRiskExposures,
  'value',
);

export function calcAvailableBalance(info?: AutomatorDetail) {
  if (!info) return 0;
  const maxExposure =
    AutomatorRiskExposureMap[info.vaultInfo.riskExposure!]?.value || 0;
  return (
    (+info.unExpiredAmountByVaultDepositCcy +
      +info.unclaimedAmountByVaultDepositCcy +
      +info.availableAmountByVaultDepositCcy) *
      maxExposure -
    (+info.unExpiredAmountByVaultDepositCcy +
      +info.unclaimedAmountByVaultDepositCcy)
  );
}
