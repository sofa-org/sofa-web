import { ProductType, VaultInfo } from '@sofa/services/contracts';
import { dirtyArrayOmit, objectValCvt } from '@sofa/utils/object';
import { computed } from '@sofa/utils/zustand';
import { create } from 'zustand';

export interface PayoffStoreState {
  maxYields: PartialRecord<
    `${VaultInfo['depositCcy']}-${ProductType}`,
    number[]
  >;
  minYields: PartialRecord<
    `${VaultInfo['depositCcy']}-${ProductType}`,
    number[]
  >;
  computedMaxYield(): PartialRecord<
    `${VaultInfo['depositCcy']}-${ProductType}`,
    number
  >;
  computedMinYield(): PartialRecord<
    `${VaultInfo['depositCcy']}-${ProductType}`,
    number
  >;
}

export const usePayoffStore = Object.assign(
  create<PayoffStoreState>((_, __, store) => ({
    maxYields: {},
    minYields: {},
    computedMaxYield: computed(
      store,
      (state) =>
        objectValCvt(state.maxYields, (v) => (!v ? undefined : Math.max(...v))),
      ['maxYields'],
    ),
    computedMinYield: computed(
      store,
      (state) =>
        objectValCvt(state.minYields, (v) => (!v ? undefined : Math.min(...v))),
      ['minYields'],
    ),
  })),
  {
    addMaxYield: (
      depositCcy: VaultInfo['depositCcy'],
      productType: ProductType,
      y: number,
    ) => {
      usePayoffStore.setState((pre) => ({
        maxYields: {
          ...pre.maxYields,
          [`${depositCcy}-${productType}`]: [
            ...(pre.maxYields[`${depositCcy}-${productType}`] || []),
            y,
          ].sort((a, b) => a - b),
        },
      }));
    },
    addMinYield: (
      depositCcy: VaultInfo['depositCcy'],
      productType: ProductType,
      y: number,
    ) => {
      usePayoffStore.setState((pre) => ({
        minYields: {
          ...pre.minYields,
          [`${depositCcy}-${productType}`]: [
            ...(pre.minYields[`${depositCcy}-${productType}`] || []),
            y,
          ].sort((a, b) => a - b),
        },
      }));
    },
    removeMaxYield: (
      depositCcy: VaultInfo['depositCcy'],
      productType: ProductType,
      y: number,
    ) => {
      usePayoffStore.setState((pre) => {
        let removed = false;
        return {
          maxYields: {
            ...pre.maxYields,
            [`${depositCcy}-${productType}`]: dirtyArrayOmit(
              pre.maxYields[`${depositCcy}-${productType}`] || [],
              (it) => {
                if (removed || it !== y) return false;
                removed = true;
                return true;
              },
            ),
          },
        };
      });
    },
    removeMinYield: (
      depositCcy: VaultInfo['depositCcy'],
      productType: ProductType,
      y: number,
    ) => {
      usePayoffStore.setState((pre) => {
        let removed = false;
        return {
          minYields: {
            ...pre.minYields,
            [`${depositCcy}-${productType}`]: dirtyArrayOmit(
              pre.minYields[`${depositCcy}-${productType}`] || [],
              (it) => {
                if (removed || it !== y) return false;
                removed = true;
                return true;
              },
            ),
          },
        };
      });
    },
  },
);
