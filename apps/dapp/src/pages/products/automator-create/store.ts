import {
  AutomatorCreatePayload,
  AutomatorInfo,
  OriginAutomatorInfo,
} from '@sofa/services/automator';
import { createWithEqualityFn } from 'zustand/traditional';

export const automatorCreateConfigs = {
  rchAmountToBurn: 2000,
};
export type AutomatorCreateStoreType = {
  payload: Partial<AutomatorCreatePayload>;
  info?: OriginAutomatorInfo;
  rchBurnHashValidating: boolean;
  rchBurnHashValidated: boolean;
  automatorCreating: boolean;
  rchBurnedManually: boolean;
  reset: () => void;
};
export const useAutomatorCreateStore =
  createWithEqualityFn<AutomatorCreateStoreType>((set, get) => ({
    payload: {},
    rchBurnHashValidating: false,
    rchBurnHashValidated: false,
    automatorCreating: false,
    rchBurnedManually: false,
    reset() {
      set({
        payload: {},
        info: undefined,
        rchBurnHashValidating: false,
        rchBurnHashValidated: false,
        automatorCreating: false,
        rchBurnedManually: false,
      });
    },
  }));
