import { applyMock } from '@sofa/utils/decorators';
import { http } from '@sofa/utils/http';

import { ContractsService, ProductType, VaultInfo } from './contracts';
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
      .get<unknown, HttpResponse<ProductsDIYConfig[]>>(
        '/rfq/diy/configuration',
        { params },
      )
      .then((res) => res.value);
  }

  @applyMock('diyRecommendedList')
  static async recommendList(params: ProductsDIYRecommendRequest) {
    if (params.chainId == 1329) {
      // TODO: remove this block when server supports SEI
      throw new Error('SEI(1329) chain not supported by server');
    }
    const vaultInfoList = params.vaults
      .split(',')
      .map((vault) =>
        ProductsService.findVault(ContractsService.vaults, {
          ...params,
          vault,
        }),
      )
      .filter(Boolean) as VaultInfo[];
    if (!vaultInfoList.length) throw new Error('Invalid vault');
    const fetch = (vaultInfo: VaultInfo) => {
      const urls = {
        [ProductType.DNT]: '/rfq/diy/dnt/recommended-list',
        [ProductType.BearSpread]: '/rfq/diy/smart-trend/recommended-list',
        [ProductType.BullSpread]: '/rfq/diy/smart-trend/recommended-list',
      };
      return http
        .get<unknown, HttpResponse<OriginProductQuoteResult[]>>(
          urls[vaultInfo.productType],
          { params },
        )
        .then((res) => ProductsService.dealOriginQuotes(res.value));
    };
    return Promise.all(vaultInfoList.map((it) => fetch(it))).then((res) =>
      res.flat(),
    );
  }

  static getSupportMatrix(v: Partial<VaultInfo>): {
    skipCurrentOptionValue?: boolean;
    skipOption?: 'riskType'[];
    calcApyBasedOn?: CCY | USDS;
  } {
    const vaults = ProductsService.filterVaults(ContractsService.vaults, {
      chainId: v.chainId,
      forCcy: v.forCcy,
    });
    if (vaults.length && vaults.every((v) => v.depositBaseCcy)) {
      return {
        skipCurrentOptionValue: v.productType === ProductType.DNT,
        skipOption: ['riskType'],
        calcApyBasedOn: vaults[0].depositBaseCcy,
      };
    }
    return {};
  }
}
