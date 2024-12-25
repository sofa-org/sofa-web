import {
  AutomatorCreatePayload,
  AutomatorInfo,
  OriginAutomatorInfo,
} from '@sofa/services/automator';
import { ChainMap, defaultChain } from '@sofa/services/chains';
import { TFunction } from '@sofa/services/i18n';
import { createWithEqualityFn } from 'zustand/traditional';

export const automatorCreateConfigs = {
  rchAmountToBurn: '2',
  chainIdToBurnRch: defaultChain.chainId,
};
export function getNameForChain(chainId: number, t: TFunction) {
  if (chainId == 1) {
    return t({
      enUS: 'Ethereum Mainnet',
    });
  }
  return ChainMap[chainId].name;
}
export type AutomatorCreateStoreType = {
  payload: Partial<AutomatorCreatePayload>;
  info?: OriginAutomatorInfo;
  rchBurning: boolean;
  rchBurned: boolean;
  automatorCreating: boolean;
  rchBurnedManually: boolean;
  reset: () => void;
};
export const useAutomatorCreateStore =
  createWithEqualityFn<AutomatorCreateStoreType>((set, get) => ({
    payload: {},
    rchBurning: false,
    rchBurned: false,
    automatorCreating: false,
    rchBurnedManually: false,
    reset() {
      set({
        payload: {},
        info: undefined,
        rchBurning: false,
        rchBurned: false,
        automatorCreating: false,
        rchBurnedManually: false,
      });
    },
  }));
