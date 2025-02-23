import {
  ProductType,
  ProjectType,
  RiskType,
  VaultInfo,
} from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { ProductsService } from '@sofa/services/products';
import { ProductQuoteResultAll } from '@sofa/services/products';
import {
  ProductsDIYConfig,
  ProductsDIYService,
} from '@sofa/services/products-diy';
import { next8h } from '@sofa/utils/expiry';
import { getNearestItemIndex, isLegalNum } from '@sofa/utils/fns';
import { currQuery } from '@sofa/utils/history';
import { simplePlus } from '@sofa/utils/object';
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
  oddsTarget: number;
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
        { chainId, ...formData },
        false,
        true,
      );
      const config = $config ?? useDIYConfigState.getState().configs[chainId];
      return config?.find((it) =>
        vaults.some(
          ($it) => $it.vault.toLowerCase() === it.vault.toLowerCase(),
        ),
      );
    },
  },
);

const instant = createWithEqualityFn(
  persist(
    () => ({
      formData: {} as Record<
        number /* chainId */,
        Partial<DIYFormData> | undefined
      >,
      selectedQuote: [null, 0, 0] as [
        ProductQuoteResultAll | null,
        number /* index */,
        number /* refresh - count */,
      ],
      selectedQuoteProbability: null as {
        productType: ProductType;
        anchorPrices: (string | number)[];
        probability: number;
      } | null,
      quotes: {} as Record<
        `${VaultInfo['chainId']}-${VaultInfo['vault']}-${DIYFormData['expiry']}`,
        {
          keys: ReturnType<typeof ProductsService.productKey>[];
          apyRange: [number, number];
          oddsRange: [number, number];
        }
      >,
    }),
    {
      name: 'diy-state-1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
  isEqual,
);
type AggreatedVault = {
  key: string;
  data: Partial<VaultInfo>;
  isDual?: 'all' | 'partial';
};
export const useDIYState = Object.assign(instant, {
  getVaultOptions: (
    filters: Partial<VaultInfo>,
    fields: (keyof VaultInfo)[],
    options?: {
      disabled?: (o: {
        vaults: VaultInfo[];
        genKey: (it: VaultInfo) => string;
        originDisabled: boolean;
        it: AggreatedVault;
      }) => boolean;
    },
  ) => {
    const vaults = ProductsService.filterVaults(
      ContractsService.vaults,
      omit(filters, fields),
      false,
      true,
    );
    const genKey = (it: VaultInfo) => fields.map((k) => it[k]).join('-');
    return ContractsService.vaults
      .filter((it) => it.chainId === filters.chainId && !it.onlyForAutomator)
      .reduce((pre, it) => {
        const key = genKey(it);
        const matching = pre.find((it) => it.key === key);
        if (!matching) pre.push({ key, data: pick(it, fields) });
        else {
          if (it.riskType == RiskType.DUAL) {
            if (!matching.isDual) {
              matching.isDual = 'all';
            }
          } else {
            if (matching.isDual === 'all') {
              matching.isDual = 'partial';
            }
          }
        }
        return pre;
      }, [] as AggreatedVault[])
      .map((it) => {
        const originDisabled = vaults.every(($it) => genKey($it) !== it.key);
        return {
          ...it,
          disabled: options?.disabled
            ? options.disabled({ vaults, genKey, originDisabled, it })
            : originDisabled,
        };
      });
  },
  validateFormData: (
    formData?: Partial<DIYFormData>,
    throwError?: boolean,
  ): formData is XPartial<DIYFormData, 'apyTarget' | 'oddsTarget'> => {
    try {
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
    } catch (e) {
      if (throwError) throw e;
      return false;
    }
    return true;
  },
  fetchRecommendedList: async (chainId: number) => {
    const formData = useDIYState.getState().formData[chainId];
    if (!useDIYState.validateFormData(formData)) return;
    const vaults = ProductsService.filterVaults(
      ContractsService.vaults,
      { chainId, ...formData },
      false,
      true,
    );
    return ProductsDIYService.recommendList({
      chainId,
      vaults: vaults.map((it) => it.vault).join(','), // 合约组合，以","区分
      expiryDateTime: formData.expiry! / 1000, // 选择的到期日
    }).then((res) => {
      useDIYState.updateQuotes(res);
      setTimeout(() => useDIYState.selectQuote(chainId, true), 100);
      return res;
    });
  },
  updateQuotes: (quotes: ProductQuoteResultAll[]) => {
    useProductsState.updateQuotes(quotes, true);
    useDIYState.setState((pre) => ({
      quotes: {
        ...pre.quotes,
        ...quotes.reduce(
          (pre, it) => {
            const key = `${it.vault.chainId}-${it.vault.vault.toLowerCase()}-${
              it.expiry
            }` as const;
            if (!pre[key])
              pre[key] = {
                keys: [],
                apyRange: [Infinity, -100],
                oddsRange: [Infinity, 0],
              };
            pre[key].keys.push(ProductsService.productKey(it));
            const apy = (() => {
              const v = simplePlus(it.apyInfo?.rch, it.apyInfo?.max);
              if (!v) return v;
              return Math.round(v * 100) / 100;
            })();
            if (isLegalNum(apy)) {
              pre[key].apyRange[0] = Math.min(pre[key].apyRange[0], apy);
              pre[key].apyRange[1] = Math.max(pre[key].apyRange[1], apy);
            }
            const odds = (() => {
              const v = simplePlus(it.oddsInfo?.rch, it.oddsInfo?.max);
              if (!v) return v;
              return +v.toFixed(2);
            })();
            if (isLegalNum(odds)) {
              pre[key].oddsRange[0] = Math.min(pre[key].oddsRange[0], odds);
              pre[key].oddsRange[1] = Math.max(pre[key].oddsRange[1], odds);
            }
            return pre;
          },
          {} as typeof pre.quotes,
        ),
      },
    }));
  },
  selectQuote: async (chainId: number, resetIndex?: boolean) => {
    const pre = useDIYState.getState();
    const formData = pre.formData[chainId];
    if (!useDIYState.validateFormData(formData)) return;

    if (!resetIndex && pre.selectedQuote[2] >= 3)
      return useDIYState.fetchRecommendedList(chainId);

    const quoteInfos = useProductsState.getState().quoteInfos;
    const vaults = ProductsService.filterVaults(
      ContractsService.vaults,
      { chainId, ...formData },
      false,
      true,
    );
    const keys = vaults.map(
      (it) =>
        `${it.chainId}-${it.vault.toLowerCase()}-${
          formData.expiry / 1000
        }` as const,
    );
    const quotes = keys
      .flatMap((k) => pre.quotes[k]?.keys || [])
      .map((k) => quoteInfos[k])
      .filter((it) => !!it) as ProductQuoteResultAll[];
    const { sortList, index } = (() => {
      if (formData.riskType === RiskType.RISKY) {
        if (!formData.oddsTarget)
          throw new Error(`Invalid oddsTarget(${formData.oddsTarget})`);
        return getNearestItemIndex(quotes, formData.oddsTarget, {
          calcCompareNum: (it) =>
            simplePlus(it.oddsInfo?.max, it.oddsInfo?.rch) || 0,
        });
      }
      if (!formData.apyTarget)
        throw new Error(`Invalid apyTarget(${formData.apyTarget})`);
      return getNearestItemIndex(quotes, formData.apyTarget, {
        calcCompareNum: (it) =>
          simplePlus(it.apyInfo?.max, it.apyInfo?.rch) || 0,
      });
    })();

    const [quote, nIndex] = (() => {
      if (resetIndex) return [sortList[index], index];
      let i = 0;
      while (!sortList[index + [1, -1, 2, -2][pre.selectedQuote[2] + i]]) {
        i += 1;
      }
      const quoteIndex = index + [1, -1, 2, -2][pre.selectedQuote[2] + i];
      return [sortList[quoteIndex], quoteIndex];
    })();

    if (!quote && !resetIndex) return useDIYState.fetchRecommendedList(chainId);
    useDIYState.setState({
      selectedQuote: [quote, nIndex, resetIndex ? 0 : pre.selectedQuote[2] + 1],
    });
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getApyList: (chainId: number, $state?: any) => {
    const state: ReturnType<typeof useDIYState.getState> =
      $state ?? useDIYState.getState();
    const formData = state.formData[chainId];
    if (!useDIYState.validateFormData(formData, false)) return [0, 5];
    const vaults = ProductsService.filterVaults(
      ContractsService.vaults,
      { ...formData, chainId },
      false,
      true,
    );
    return vaults.flatMap(
      (it) =>
        state.quotes[
          `${it.chainId}-${it.vault.toLowerCase()}-${formData.expiry / 1000}`
        ]?.apyRange || [],
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOddsList: (chainId: number, $state?: any) => {
    const state: ReturnType<typeof useDIYState.getState> =
      $state ?? useDIYState.getState();
    const formData = state.formData[chainId];
    if (!useDIYState.validateFormData(formData, false)) return [0, 10];
    const vaults = ProductsService.filterVaults(
      ContractsService.vaults,
      { ...formData, chainId },
      false,
      true,
    );
    return vaults.flatMap(
      (it) =>
        state.quotes[
          `${it.chainId}-${it.vault.toLowerCase()}-${formData.expiry / 1000}`
        ]?.oddsRange || [],
    );
  },
  initFormData: (
    chainId: number,
    config?: ProductsDIYConfig,
    apyList?: number[],
    oddsList?: number[],
  ) => {
    const defaultFormData: DIYFormData = {
      forCcy: 'WBTC',
      domCcy: 'USD',
      depositCcy: 'USDT',
      productType: ProductType.BullSpread,
      riskType:
        currQuery().project === ProjectType.Surge
          ? RiskType.RISKY
          : RiskType.PROTECTED,
      apyTarget: 0.15,
      oddsTarget: 4,
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
            ? formData!.expiry!
            : defaultFormData.expiry,
        apyTarget: formData?.apyTarget ?? defaultFormData.apyTarget,
        oddsTarget: formData?.oddsTarget ?? defaultFormData.oddsTarget,
      };
      const expiryList = config?.expiryDateTimes;
      const expiry =
        data.expiry && expiryList?.length
          ? Math.max(
              expiryList[0] * 1000,
              Math.min(expiryList[expiryList.length - 1] * 1000, data.expiry),
            )
          : data.expiry || next8h(undefined, 7);
      return {
        ...pre,
        formData: {
          ...pre.formData,
          [chainId]: {
            ...data,
            expiry,
            apyTarget:
              data.apyTarget && apyList?.length
                ? Math.max(
                    apyList[0],
                    Math.min(apyList[apyList.length - 1], data.apyTarget),
                  )
                : data.apyTarget,
            oddsTarget:
              data.oddsTarget && oddsList?.length
                ? Math.max(
                    oddsList[0],
                    Math.min(oddsList[oddsList.length - 1], data.oddsTarget),
                  )
                : data.oddsTarget,
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
        selectedQuote: [null, 0, 0],
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
        selectedQuote: [null, 0, 0],
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
        selectedQuote: [null, 0, 0],
        selectedQuoteProbabilities: undefined,
      };
    });
  },
  updateMultipleTarget: (chainId: number, oddsTarget: number) => {
    useDIYState.setState((pre) => {
      if (pre.formData[chainId]?.oddsTarget === oddsTarget) return pre;
      return {
        ...pre,
        formData: {
          ...pre.formData,
          [chainId]: { ...pre.formData[chainId], oddsTarget },
        },
        selectedQuote: [null, 0, 0],
        selectedQuoteProbabilities: undefined,
      };
    });
  },
});
