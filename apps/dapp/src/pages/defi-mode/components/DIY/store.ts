import { ProductType, RiskType, VaultInfo } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { ProductsService } from '@sofa/services/products';
import { ProductQuoteResult } from '@sofa/services/products';
import {
  ProductsDIYConfig,
  ProductsDIYService,
} from '@sofa/services/products-diy';
import { next8h } from '@sofa/utils/expiry';
import { isEqual, omit, pick } from 'lodash-es';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { useProductsState } from '@/pages/products/store';

export interface DIYFormData
  extends Pick<
    VaultInfo,
    | 'forCcy'
    | 'domCcy'
    | 'trackingSource'
    | 'depositCcy'
    | 'productType'
    | 'riskType'
  > {
  expiry: number; // 毫秒
  apyTarget: number;
  multiplierTarget: number;
}

export const useDIYConfigState = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        loading: true,
        configs: {} as Record<
          number /* chainId */,
          ProductsDIYConfig[] | undefined
        >,
      }),
      {
        name: 'diy-configs-state',
        storage: createJSONStorage(() => localStorage),
      },
    ),
    isEqual,
  ),
  {
    fetchConfig: (chainId: number) => {
      return ProductsDIYService.config({ chainId }).then((res) => {
        return useDIYConfigState.setState((pre) => ({
          loading: false,
          configs: { ...pre.configs, [chainId]: res },
        }));
      });
    },
    getConfig: (
      chainId: number,
      formData: Partial<DIYFormData>,
      $config?: ProductsDIYConfig[],
    ) => {
      const vaults = ProductsService.filterVaults(
        ContractsService.vaults,
        {
          chainId,
          ...formData,
        },
        false,
        true,
      );
      const config = $config ?? useDIYConfigState.getState().configs[chainId];
      return config?.find((it) => vaults.some(($it) => $it.vault === it.vault));
    },
  },
);

export const useDIYState = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        formData: {} as Record<
          number /* chainId */,
          Partial<DIYFormData> | undefined
        >,
        selectedQuote: null as ProductQuoteResult | null,
        selectedQuoteProbability: null as {
          productType: ProductType;
          anchorPrices: (string | number)[];
          probability: number;
        } | null,
      }),
      {
        name: 'diy-state',
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
  {
    getVaultOptions: (
      filters: Partial<VaultInfo>,
      fields: (keyof VaultInfo)[],
    ) => {
      const vaults = ProductsService.filterVaults(
        ContractsService.vaults,
        omit(filters, fields),
        false,
        true,
      );
      const genKey = (it: VaultInfo) => fields.map((k) => it[k]).join('-');
      return ContractsService.vaults
        .filter((it) => it.chainId === filters.chainId)
        .reduce(
          (pre, it) => {
            const key = genKey(it);
            if (pre.every((it) => it.key !== key))
              pre.push({ key, data: pick(it, fields) });
            return pre;
          },
          [] as { key: string; data: Partial<VaultInfo> }[],
        )
        .map((it) => ({
          ...it,
          disabled: vaults.every(($it) => genKey($it) !== it.key),
        }));
    },
    fetchRecommendedList: async (chainId: number) => {
      const formData = useDIYState.getState().formData[chainId];
      if (
        !formData ||
        (['forCcy', 'domCcy', 'trackingSource'] as const).some(
          (k) => !formData[k],
        )
      ) {
        throw new Error('Please choose what you are betting on');
      }
      if ((['expiry'] as const).some((k) => !formData[k])) {
        throw new Error('Please choose how long you want to bet');
      }
      if ((['productType'] as const).some((k) => !formData[k])) {
        throw new Error('Please choose your market view');
      }
      if ((['depositCcy'] as const).some((k) => !formData[k])) {
        throw new Error('Please choose the deposit token');
      }
      if ((['riskType'] as const).some((k) => !formData[k])) {
        throw new Error('Please choose your risk tolerance');
      }
      if (formData.riskType === RiskType.RISKY) {
        if (!formData.multiplierTarget)
          throw new Error('Please choose your payout multiplier target');
      } else {
        if (!formData.apyTarget)
          throw new Error('Please choose your apy target');
      }
      const vaults = ProductsService.filterVaults(
        ContractsService.vaults,
        {
          chainId,
          ...formData,
        },
        false,
        true,
      );
      return ProductsDIYService.recommendList({
        chainId,
        vaults: vaults.map((it) => it.vault).join(','), // 合约组合，以","区分
        apyPercentage: formData.apyTarget!, // 年化百分比
        payoutMultiple: formData.multiplierTarget, // surge必填
        expiryDateTime: formData.expiry! / 1000, // 选择的到期日
      }).then((res) => {
        useDIYState.selectQuote(res[Math.floor(Math.random() * res.length)]);
        useProductsState.updateQuotes(res);
        return res;
      });
    },
    selectQuote: (quote: ProductQuoteResult) => {
      useDIYState.setState({ selectedQuote: quote });
    },
    initFormData: (chainId: number, config?: ProductsDIYConfig) => {
      const defaultFormData: DIYFormData = {
        forCcy: 'WBTC',
        domCcy: 'USD',
        depositCcy: 'USDT',
        productType: ProductType.BullSpread,
        riskType: RiskType.PROTECTED,
        apyTarget: 0.15,
        multiplierTarget: 4,
        expiry: next8h(undefined, 7),
        trackingSource: 'COINBASE',
      };
      return useDIYState.setState((pre) => {
        const formData = pre.formData[chainId];
        const data = {
          ...defaultFormData,
          ...formData,
          expiry:
            Number(formData?.expiry) >= next8h(undefined, 2)
              ? formData!.expiry
              : defaultFormData.expiry,
          apyTarget: formData?.apyTarget ?? defaultFormData.apyTarget,
          multiplierTarget:
            formData?.multiplierTarget ?? defaultFormData.multiplierTarget,
        };
        const apyList = config?.apyList;
        const multiplierList = config?.payoutMultiples;
        const expiryList = config?.expiryDateTimes;
        return {
          ...pre,
          formData: {
            ...pre.formData,
            [chainId]: {
              ...data,
              apyTarget:
                data.apyTarget && apyList?.length
                  ? Math.max(
                      apyList[0],
                      Math.min(apyList[apyList.length - 1], data.apyTarget),
                    )
                  : data.apyTarget,
              multiplierTarget:
                data.multiplierTarget && multiplierList?.length
                  ? Math.max(
                      multiplierList[0],
                      Math.min(
                        multiplierList[multiplierList.length - 1],
                        data.multiplierTarget,
                      ),
                    )
                  : data.multiplierTarget,
              expiry:
                data.expiry && expiryList?.length
                  ? Math.max(
                      expiryList[0],
                      Math.min(expiryList[expiryList.length - 1], data.expiry),
                    )
                  : data.expiry,
            },
          },
        };
      });
    },
    updateVaultOptions: (
      chainId: number,
      formData: Partial<
        Pick<
          VaultInfo,
          | 'forCcy'
          | 'domCcy'
          | 'trackingSource'
          | 'depositCcy'
          | 'productType'
          | 'riskType'
        >
      >,
    ) => {
      useDIYState.setState((pre) => {
        if (
          pre.formData[chainId] &&
          Object.keys(formData).every(
            (k) =>
              formData[k as keyof typeof formData] ===
              pre.formData[chainId]![k as keyof typeof formData],
          )
        )
          return pre;
        return {
          ...pre,
          formData: {
            ...pre.formData,
            [chainId]: { ...pre.formData[chainId], ...formData },
          },
          selectedQuote: undefined,
          selectedQuoteProbabilities: undefined,
        };
      });
    },
    updateExpiry: (chainId: number, expiry: number) => {
      useDIYState.setState((pre) => {
        if (pre.formData[chainId]?.expiry === expiry) return pre;
        return {
          ...pre,
          formData: {
            ...pre.formData,
            [chainId]: { ...pre.formData[chainId], expiry },
          },
          selectedQuote: undefined,
          selectedQuoteProbabilities: undefined,
        };
      });
    },
    updateApyTarget: (chainId: number, apyTarget: number) => {
      useDIYState.setState((pre) => {
        if (pre.formData[chainId]?.apyTarget === apyTarget) return pre;
        return {
          ...pre,
          formData: {
            ...pre.formData,
            [chainId]: { ...pre.formData[chainId], apyTarget },
          },
          selectedQuote: undefined,
          selectedQuoteProbabilities: undefined,
        };
      });
    },
    updateMultipleTarget: (chainId: number, multiplierTarget: number) => {
      useDIYState.setState((pre) => {
        if (pre.formData[chainId]?.multiplierTarget === multiplierTarget)
          return pre;
        return {
          ...pre,
          formData: {
            ...pre.formData,
            [chainId]: { ...pre.formData[chainId], multiplierTarget },
          },
          selectedQuote: undefined,
          selectedQuoteProbabilities: undefined,
        };
      });
    },
  },
  isEqual,
);
