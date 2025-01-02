import {
  AutomatorCreateConfig,
  AutomatorCreatePayload,
  OriginAutomatorInfo,
} from '@sofa/services/automator';
import { ChainMap } from '@sofa/services/chains';
import { TFunction } from '@sofa/services/i18n';
import { createWithEqualityFn } from 'zustand/traditional';

export function getNameForChain(chainId: number | undefined, t: TFunction) {
  if (!chainId) {
    return '';
  }
  if (chainId == 1) {
    return t({
      enUS: 'Ethereum Mainnet',
    });
  }
  return ChainMap[chainId].name;
}
export type AutomatorCreateStoreType = {
  payload: Partial<AutomatorCreatePayload>;
  config?: AutomatorCreateConfig;
  info?: OriginAutomatorInfo;
  rchBurning: boolean;
  rchBurned: boolean;
  automatorCreating: boolean;
  reset: () => void;
  updatePayload: (v: Partial<AutomatorCreatePayload>) => void;
  updateConfig: (v?: AutomatorCreateConfig) => void;
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
          automatorDesc: '',
          rchBurnHash: '',
          automatorName: '',
          redemptionWaitingPeriod: '7',
          sharePercent: 5,
        },
        info: undefined,
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
    updateConfig(v) {
      set({
        config: v,
      });
    },
  }));
