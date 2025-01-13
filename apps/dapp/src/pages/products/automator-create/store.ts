import { AutomatorCreateParams } from '@sofa/services/automator-creator';
import { ChainMap } from '@sofa/services/chains';
import { TFunction } from '@sofa/services/i18n';
import { createWithEqualityFn } from 'zustand/traditional';

export function getNameForChain(chainId: number | undefined, t: TFunction) {
  // const [t] = useTranslation('AutomatorCreate');
  if (!chainId) {
    return '';
  }
  if (chainId == 1) {
    return t({ enUS: 'Ethereum Mainnet', zhCN: '以太坊主网' });
  }
  return ChainMap[chainId].name;
}
export type AutomatorCreateStoreType = {
  payload: Partial<AutomatorCreateParams>;
  automatorCreateResult?: string;
  rchBurning: boolean;
  rchBurned: boolean;
  automatorCreating: boolean;
  reset: () => void;
  updatePayload: (v: Partial<AutomatorCreateParams>) => void;
};
export const useAutomatorCreateStore =
  createWithEqualityFn<AutomatorCreateStoreType>((set, get) => ({
    payload: {},
    rchBurning: false,
    rchBurned: false,
    automatorCreating: false,
    reset() {
      set({
        payload: {
          ...get().payload,
          description: '',
          burnTransactionHash: '',
          automatorName: '',
          redemptionPeriodDay: 7,
          feeRate: 5,
        },
        automatorCreateResult: undefined,
        rchBurning: false,
        rchBurned: false,
        automatorCreating: false,
      });
    },
    updatePayload(v) {
      set({
        payload: {
          ...get().payload,
          ...v,
        },
      });
    },
  }));
