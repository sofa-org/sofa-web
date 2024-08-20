import { ProductType } from '@sofa/services/contracts';
import { dirtyArrayOmit, objectValCvt } from '@sofa/utils/object';
import { computed } from '@sofa/utils/zustand';
import { create } from 'zustand';

export interface PayoffStoreState {
  maxYields: PartialRecord<ProductType, number[]>;
  minYields: PartialRecord<ProductType, number[]>;
  computedMaxYield(): PartialRecord<ProductType, number>;
  computedMinYield(): PartialRecord<ProductType, number>;
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
    addMaxYield: (productType: ProductType, y: number) => {
      usePayoffStore.setState((pre) => ({
        maxYields: {
          ...pre.maxYields,
          [productType]: [...(pre.maxYields[productType] || []), y].sort(
            (a, b) => a - b,
          ),
        },
      }));
    },
    addMinYield: (productType: ProductType, y: number) => {
      usePayoffStore.setState((pre) => ({
        minYields: {
          ...pre.minYields,
          [productType]: [...(pre.minYields[productType] || []), y].sort(
            (a, b) => a - b,
          ),
        },
      }));
    },
    removeMaxYield: (productType: ProductType, y: number) => {
      usePayoffStore.setState((pre) => {
        let removed = false;
        return {
          maxYields: {
            ...pre.maxYields,
            [productType]: dirtyArrayOmit(
              pre.maxYields[productType] || [],
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
    removeMinYield: (productType: ProductType, y: number) => {
      usePayoffStore.setState((pre) => {
        let removed = false;
        return {
          minYields: {
            ...pre.minYields,
            [productType]: dirtyArrayOmit(
              pre.minYields[productType] || [],
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
