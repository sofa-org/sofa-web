import { applyMock } from '@sofa/utils/decorators';
import { http } from '@sofa/utils/http';

import {
  ContractsService,
  InvalidVaultError,
  ProductType,
  RiskType,
  VaultInfo,
} from './contracts';
import { OriginProductQuoteResult, ProductsService } from './products';

export interface ProductsDIYConfigRequest {
  chainId: number;
}

export interface ProductsDIYConfig {
  chainId: number;
  vault: string;
  expiryDateTimes: number[]; // 推荐支持的到期日时间 秒
}

export interface ProductsDIYRecommendRequest {
  chainId: number; // 链ID
  vaults: string; // 合约组合，以","区分
  expiryDateTime: number; // 选择的到期日 秒
}

export class ProductsDIYService {
  @applyMock('diyConfig')
  static config(params: ProductsDIYConfigRequest) {
    return http
      .get<
        unknown,
        HttpResponse<ProductsDIYConfig[]>
      >('/rfq/diy/configuration', { params })
      .then((res) => res.value);
  }

  @applyMock('diyRecommendedList')
  static async recommendList(params: ProductsDIYRecommendRequest) {
    const vaultInfoList = params.vaults
      .split(',')
      .map((vault) =>
        ProductsService.findVault(ContractsService.vaults, {
          ...params,
          vault,
        }),
      )
      .filter(Boolean) as VaultInfo[];
    if (!vaultInfoList.length) throw new InvalidVaultError();
    const fetch = (vaultInfo: VaultInfo) => {
      let url: string;
      if (vaultInfo.riskType == RiskType.DUAL) {
        url = '/rfq/dual/diy/recommended-list';
      } else {
        url = {
          [ProductType.DNT]: '/rfq/diy/dnt/recommended-list',
          [ProductType.BearSpread]: '/rfq/diy/smart-trend/recommended-list',
          [ProductType.BullSpread]: '/rfq/diy/smart-trend/recommended-list',
        }[vaultInfo.productType];
      }
      return http
        .get<unknown, HttpResponse<OriginProductQuoteResult[]>>(url, { params })
        .then((res) => ProductsService.dealOriginQuotes(res.value));
    };
    return Promise.all(vaultInfoList.map((it) => fetch(it))).then((res) => {
      const result = res.flat();
      return result;
    });
  }

  static getSupportMatrix(
    v: Partial<VaultInfo> & {
      item?: {
        disabled: boolean;
        key: string;
        data: Partial<VaultInfo>;
        isDual: 'all' | 'partial' | false;
      };
    },
  ): {
    skipCurrentOptionValue?: boolean;
    skipOption?: ('riskType' | 'dualOptions')[];
  } {
    const vaults = ProductsService.filterVaults(ContractsService.vaults, {
      chainId: v.chainId,
      forCcy: v.forCcy,
    });
    if (vaults.length && vaults.every((v) => v.depositBaseCcy)) {
      return {
        skipCurrentOptionValue: v.productType === ProductType.DNT,
        skipOption: ['riskType', 'dualOptions'],
      };
    }
    if (vaults.length && vaults.every((v) => v.riskType == RiskType.DUAL)) {
      // 选双币时，depositCcy 只显示双币的，且不展示disable项目
      const allPossibleDepositCcys = vaults.reduce(
        (ccys, v) => ({
          ...ccys,
          [v.depositCcy]: true,
          [v.forCcy]: true,
        }),
        {} as Record<string, boolean>,
      );
      return {
        skipCurrentOptionValue:
          v.productType === ProductType.DNT ||
          (v.depositCcy && !allPossibleDepositCcys[v.depositCcy]) ||
          v.item?.disabled ||
          false,
        skipOption: ['riskType'],
      };
    }
    // 去掉所有双币的 depositCcy
    const depositCcyOnlyHasDual = vaults.reduce(
      (ccys, v) => ({
        ...ccys,
        [v.depositCcy]:
          v.riskType !== RiskType.DUAL
            ? false
            : ccys[v.depositCcy] === undefined
              ? true
              : undefined,
      }),
      {} as Record<string, boolean | undefined>,
    );
    return {
      skipCurrentOptionValue:
        !!(v.depositCcy && depositCcyOnlyHasDual[v.depositCcy] !== false) ||
        !!(v.riskType && v.riskType === RiskType.DUAL),
      skipOption: ['dualOptions'],
    };
  }
}
